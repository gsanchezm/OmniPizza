import React from "react";
import Toast from "../../src/components/Toast";
import { useToastStore } from "../../src/components/toastStore";

describe("Toast", () => {
  it("renders nothing when hidden", () => {
    useToastStore.setState({ message: "", visible: false });
    cy.mount(<Toast />);
    cy.get("[data-testid=toast]").should("not.exist");
  });

  it("shows the message and dismisses on close", () => {
    useToastStore.setState({ message: "Added to cart", visible: true });
    cy.mount(<Toast />);

    cy.get("[data-testid=toast]").should("exist");
    cy.get("[data-testid=toast-message]").should("have.text", "Added to cart");

    cy.get("[data-testid=toast-close]").click();
    cy.get("[data-testid=toast]").should("not.exist");
  });
});
