import React from "react";
import InputGroup from "../../src/components/InputGroup";

describe("InputGroup", () => {
  it("renders and propagates change", () => {
    const onChange = cy.stub().as("onChange");
    cy.mount(
      <InputGroup
        label="Email"
        value=""
        onChange={onChange}
        placeholder="name@example.com"
        data-testid="input-email"
      />,
    );

    cy.get("[data-testid=input-email]").type("abc");
    cy.get("@onChange").should("have.callCount", 3);
  });
});
