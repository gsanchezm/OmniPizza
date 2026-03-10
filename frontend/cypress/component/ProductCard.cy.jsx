import React from "react";
import ProductCard from "../../src/components/ProductCard";

const pizza = {
  id: "p01",
  name: "Margherita",
  description: "Tomato, mozzarella, basil",
  image: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Margherita_pizza.jpg",
  price: 12.99,
  currency: "USD",
  type: "meat",
};

describe("ProductCard", () => {
  it("renders pizza info and handles add", () => {
    const onAdd = cy.stub().as("onAdd");
    cy.mount(
      <ProductCard
        pizza={pizza}
        onAdd={onAdd}
        formatPrice={(v) => `$${Number(v).toFixed(2)}`}
      />,
    );

    cy.get("[data-testid=pizza-name-p01]").should("contain.text", "Margherita");
    cy.get("[data-testid=add-to-cart-p01]").click();
    cy.get("@onAdd").should("have.been.calledWith", pizza);
  });
});
