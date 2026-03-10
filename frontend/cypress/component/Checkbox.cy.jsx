import React from "react";
import Checkbox from "../../src/components/Checkbox";

describe("Checkbox", () => {
  it("calls onChange when toggled", () => {
    const onChange = cy.stub().as("onChange");
    cy.mount(<Checkbox checked={false} onChange={onChange} label="Accept" />);

    cy.contains("Accept").click();
    cy.get("@onChange").should("have.been.calledWith", true);
  });
});
