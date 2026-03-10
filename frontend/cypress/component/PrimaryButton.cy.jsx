import React from "react";
import PrimaryButton from "../../src/components/PrimaryButton";

describe("PrimaryButton", () => {
  it("renders and handles click", () => {
    const onClick = cy.stub().as("onClick");
    cy.mount(
      <PrimaryButton data-testid="primary-btn" onClick={onClick}>
        Continue
      </PrimaryButton>,
    );

    cy.get("[data-testid=primary-btn]").click();
    cy.get("@onClick").should("have.been.calledOnce");
  });
});
