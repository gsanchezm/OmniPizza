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
      countryInfo: null,
    });
  });

  const cartItemsIn = (currency) => [
    {
      id: "item-1",
      pizza_id: "p01",
      quantity: 2,
      unit_price: 10,
      currency,
      currency_symbol: "$",
      pizza: { name: "Margherita", image: "x.jpg" },
      config: { size: "small", toppings: [] },
    },
  ];

  const mountSidebar = (items) =>
    cy.mount(
      <CartSidebar
        cartItems={items}
        onCheckout={cy.stub()}
        onRemove={cy.stub()}
        onUpdateQty={cy.stub()}
      />,
    );

  it("uses the market's delivery fee (not a hardcoded 2.50) before countryInfo loads", () => {
    useCountryStore.setState({ countryCode: "MX", locale: "es-MX", currency: "MXN" });
    mountSidebar(cartItemsIn("MXN"));

    cy.get("[data-testid=cart-delivery-fee-value]").should("have.text", "$35.10");
    cy.get("[data-testid=cart-total-value]").should("have.text", "$55.10");
  });

  it("prefers the delivery fee from GET /api/countries when available", () => {
    useCountryStore.setState({ countryInfo: { delivery_fee: 3 } });
    mountSidebar(cartItemsIn("USD"));

    cy.get("[data-testid=cart-delivery-fee-value]").should("have.text", "$3.00");
    cy.get("[data-testid=cart-total-value]").should("have.text", "$23.00");
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
    cy.get("[data-testid=cart-delivery-fee-value]").should("have.text", "$2.00");
    cy.get("[data-testid=cart-total-value]").should("have.text", "$22.00");
    cy.get("[data-testid=cart-checkout-btn]").click();
    cy.get("@onCheckout").should("have.been.calledOnce");
  });
});
