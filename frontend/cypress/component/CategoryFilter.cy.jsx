import React from "react";
import CategoryFilter from "../../src/components/CategoryFilter";
import { useCountryStore } from "../../src/store";

describe("CategoryFilter", () => {
  beforeEach(() => {
    useCountryStore.setState({ language: "en" });
  });

  it("renders categories and calls onSelect", () => {
    const onSelect = cy.stub().as("onSelect");
    cy.mount(<CategoryFilter selected="all" onSelect={onSelect} />);

    cy.get("[data-testid=category-all]").should("exist");
    cy.get("[data-testid=category-meat]").click();
    cy.get("@onSelect").should("have.been.calledWith", "meat");
  });
});
