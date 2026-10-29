import React from "react";
import ProductCard from "../../src/components/ProductCard";

// Same shape GET /api/pizzas returns: `category`, no `type`.
const pizza = {
  id: "p01",
  name: "Margherita",
  description: "Tomato, mozzarella, basil",
  image: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Margherita_pizza.jpg",
  price: 12.99,
  currency: "USD",
  category: "popular",
};

const mountCard = (overrides = {}, onAdd = cy.stub()) =>
  cy.mount(
    <ProductCard
      pizza={{ ...pizza, ...overrides }}
      onAdd={onAdd}
      formatPrice={(v) => `$${Number(v).toFixed(2)}`}
      t={(key) => key}
    />,
  );

describe("ProductCard", () => {
  it("renders pizza info and handles add", () => {
    const onAdd = cy.stub().as("onAdd");
    mountCard({}, onAdd);

    cy.get("[data-testid=pizza-name-p01]").should("contain.text", "Margherita");
    cy.get("[data-testid=add-to-cart-p01]").click();
    cy.get("@onAdd").should("have.been.calledWith", pizza);
  });

  it("shows the Bestseller badge for the popular category", () => {
    mountCard({ category: "popular" });
    cy.contains("bestseller").should("be.visible");
    cy.contains("veggieBadge").should("not.exist");
  });

  it("shows the Veggie badge for the veggie category", () => {
    mountCard({ category: "veggie" });
    cy.contains("veggieBadge").should("be.visible");
    cy.contains("bestseller").should("not.exist");
  });

  it("shows no badge for the meat category", () => {
    mountCard({ category: "meat" });
    cy.contains("bestseller").should("not.exist");
    cy.contains("veggieBadge").should("not.exist");
  });
});
