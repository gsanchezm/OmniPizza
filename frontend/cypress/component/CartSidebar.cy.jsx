import React from "react";
import CartSidebar from "../../src/components/CartSidebar";
import { useCountryStore } from "../../src/store";

describe("CartSidebar", () => {
  beforeEach(() => {
    useCountryStore.setState({
      countryCode: "US",
      language: "en",
      locale: "en-US",
      currency: "USD",
    });
  });

  it("renders empty state when cart has no items", () => {
    cy.mount(
      <CartSidebar
        cartItems={[]}
        onCheckout={cy.stub()}
        onRemove={cy.stub()}
        onUpdateQty={cy.stub()}
      />,
    );

    cy.get("[data-testid=cart-sidebar-empty]").should("be.visible");
    cy.contains("Your cart is empty").should("be.visible");
  });

  it("shows totals and triggers checkout callback", () => {
    const onCheckout = cy.stub().as("onCheckout");
    const cartItems = [
      {
        id: "item-1",
        pizza_id: "p01",
        quantity: 2,
        unit_price: 10,
        currency: "USD",
        currency_symbol: "$",
        pizza: {
          name: "Margherita",
          image:
            "https://upload.wikimedia.org/wikipedia/commons/8/8a/Margherita_pizza.jpg",
        },
        config: { size: "small", toppings: [] },
      },
    ];

    cy.mount(
      <CartSidebar
        cartItems={cartItems}
        onCheckout={onCheckout}
        onRemove={cy.stub()}
        onUpdateQty={cy.stub()}
      />,
    );

    cy.get("[data-testid=cart-sidebar]").should("be.visible");
    cy.get("[data-testid=cart-subtotal-value]").should("have.text", "$20.00");
    cy.get("[data-testid=cart-delivery-fee-value]").should("have.text", "$2.50");
    cy.get("[data-testid=cart-total-value]").should("have.text", "$22.50");
    cy.get("[data-testid=cart-checkout-btn]").click();
    cy.get("@onCheckout").should("have.been.calledOnce");
  });
});
