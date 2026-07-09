import React from "react";
import MarketDropdown from "../../src/components/MarketDropdown";
import { useCountryStore } from "../../src/store";

describe("MarketDropdown", () => {
  beforeEach(() => {
    useCountryStore.setState({ countryCode: "US" });
  });

  it("opens the listbox and selects a market", () => {
    cy.mount(<MarketDropdown />);

    // Closed by default.
    cy.get("[data-testid=market-dropdown-menu]").should("not.exist");

    // Open it.
    cy.get("[data-testid=market-dropdown-trigger]").click();
    cy.get("[data-testid=market-dropdown-menu]").should("be.visible");

    // Choose Japan → store updates and the menu closes.
    cy.get("[data-testid=market-option-JP]").click();
    cy.get("[data-testid=market-dropdown-menu]").should("not.exist");
    cy.wrap(null).then(() => {
      expect(useCountryStore.getState().countryCode).to.eq("JP");
    });
  });
});
