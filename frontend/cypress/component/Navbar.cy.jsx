import React from "react";
import { MemoryRouter } from "react-router-dom";
import Navbar from "../../src/components/Navbar";
import { useAuthStore, useCartStore, useCountryStore } from "../../src/store";

describe("Navbar", () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
    useAuthStore.setState({
      token: "fake.token.value",
      username: "standard_user",
      behavior: "standard",
    });
    useCartStore.setState({
      items: [{ id: "i1", quantity: 2 }],
    });
    useCountryStore.setState({
      countryCode: "CH",
      language: "de",
      locale: "de-CH",
      currency: "CHF",
    });
  });

  it("shows nav links, cart count, and language switch for CH", () => {
    cy.mount(
      <MemoryRouter initialEntries={["/catalog"]}>
        <Navbar />
      </MemoryRouter>,
    );

    cy.get("[data-testid=nav-catalog]").should("exist");
    cy.get("[data-testid=nav-checkout]").should("exist");
    cy.get("[data-testid=nav-cart-count]").should("have.text", "2");
    cy.get("[data-testid=lang-fr]").click();
    cy.wrap(null).should(() => {
      expect(useCountryStore.getState().language).to.eq("fr");
    });
  });
});
