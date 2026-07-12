import React from "react";
import { MemoryRouter } from "react-router-dom";
import Login from "../../src/pages/Login";
import { useAuthStore, useCountryStore } from "../../src/store";

// Regression coverage for the "error flashes then the page refreshes" bug.
//
// Root cause was in the global 401 response interceptor (src/services/httpClient.js):
// it called window.location.assign("/") on ANY 401, including a failed login. Because
// "/" IS the login route, that reload wiped the React `error` state — the user saw the
// message for a split second, then a refresh. The fix gates the redirect on an existing
// session (a token in the store); a logged-out 401 now rejects so the form keeps its error.
describe("Login — auth error handling", () => {
  beforeEach(() => {
    cy.viewport(1280, 800); // desktop → data-testid suffix is "-desktop"
    // Logged out: no session token, so a 401 must NOT trigger the redirect.
    useAuthStore.setState({ token: null, username: null, behavior: null });
    useCountryStore.setState({ countryCode: "US", language: "en", locale: "en-US", currency: "USD" });

    // The Quick Login panel fetches /api/auth/users on mount — stub it so the
    // test doesn't hit the network for unrelated data.
    cy.intercept("GET", "**/api/auth/users", { statusCode: 200, body: [] }).as("getUsers");
  });

  it("keeps the 'Invalid credentials' error on screen after a failed login (no refresh)", () => {
    cy.intercept("POST", "**/api/auth/login", {
      statusCode: 401,
      body: { error: "Invalid username or password", status_code: 401, timestamp: "2026-07-12T00:00:00Z" },
    }).as("login");

    cy.mount(
      <MemoryRouter initialEntries={["/"]}>
        <Login />
      </MemoryRouter>,
    );

    cy.get("[data-testid=username-desktop]").clear().type("standard_users");
    cy.get("[data-testid=login-button-desktop]").click();
    cy.wait("@login");

    cy.get("[data-testid=login-error]").should("be.visible").and("contain.text", "Invalid credentials");

    // The bug was that the error vanished on reload. Assert it persists and the
    // login screen is still mounted (i.e. the app did not navigate/refresh away).
    cy.wait(500);
    cy.get("[data-testid=screen-login]").should("exist");
    cy.get("[data-testid=login-error]").should("be.visible").and("contain.text", "Invalid credentials");
    // The typed username survives too — proof the form was not remounted.
    cy.get("[data-testid=username-desktop]").should("have.value", "standard_users");
  });

  // Regression for the "Rendered fewer hooks than expected" Rules-of-Hooks bug.
  //
  // Login had `if (token) return <Navigate/>` placed BEFORE a `useEffect`. On a
  // successful login, `login()` sets the token; this still-mounted component
  // re-renders with `token` truthy, the early return fires, and the effect hook
  // is skipped — so this render calls fewer hooks than the prior one and React
  // throws. The fix moves the redirect after every hook.
  it("redirects cleanly (no Rules-of-Hooks error) when a successful login sets the token", () => {
    cy.intercept("POST", "**/api/auth/login", {
      statusCode: 200,
      body: { access_token: "test-token", username: "standard_user", behavior: "standard" },
    }).as("login");

    let hooksErrorSeen = false;
    cy.on("uncaught:exception", (err) => {
      if (/Rendered fewer hooks than expected/.test(err.message)) {
        hooksErrorSeen = true;
        return false; // asserted explicitly below
      }
      // any other unexpected error should still fail the test
      return true;
    });

    cy.mount(
      <MemoryRouter initialEntries={["/"]}>
        <Login />
      </MemoryRouter>,
    );

    cy.get("[data-testid=login-button-desktop]").click();
    cy.wait("@login");

    // Token is now set → Login must redirect (render <Navigate/>), so the login
    // screen unmounts, WITHOUT a hooks-order violation.
    cy.get("[data-testid=screen-login]").should("not.exist");
    cy.then(() => {
      expect(
        hooksErrorSeen,
        "React 'Rendered fewer hooks than expected' error was thrown on login",
      ).to.be.false;
    });
  });

  it("surfaces the backend's locked-out message on a 403", () => {
    cy.intercept("POST", "**/api/auth/login", {
      statusCode: 403,
      body: { error: "Sorry, this user has been locked out.", status_code: 403, timestamp: "2026-07-12T00:00:00Z" },
    }).as("login");

    cy.mount(
      <MemoryRouter initialEntries={["/"]}>
        <Login />
      </MemoryRouter>,
    );

    cy.get("[data-testid=username-desktop]").clear().type("locked_out_user");
    cy.get("[data-testid=login-button-desktop]").click();
    cy.wait("@login");

    cy.get("[data-testid=login-error]").should("be.visible").and("contain.text", "locked out");
  });
});
