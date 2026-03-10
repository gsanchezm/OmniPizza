import React from "react";
import PizzaCustomizerModal from "../../src/components/PizzaCustomizerModal";
import { useCountryStore } from "../../src/store";

const pizza = {
  id: "p01",
  name: "Margherita",
  image: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Margherita_pizza.jpg",
  currency: "USD",
  currency_symbol: "$",
  price: 12.99,
  base_price: 12.99,
};

describe("PizzaCustomizerModal", () => {
  beforeEach(() => {
    useCountryStore.setState({
      language: "en",
      locale: "en-US",
    });
  });

  it("mounts in open state and confirms selection", () => {
    const onConfirm = cy.stub().as("onConfirm");
    cy.mount(
      <PizzaCustomizerModal
        open
        onClose={cy.stub()}
        pizza={pizza}
        initialConfig={{ size: "small", toppings: [] }}
        onConfirm={onConfirm}
      />,
    );

    cy.get("[data-testid=size-medium]").click();
    cy.get("[data-testid=confirm-add-to-cart]").click();
    cy.get("@onConfirm").should("have.been.calledOnce");
  });
});
