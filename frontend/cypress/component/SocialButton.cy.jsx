import React from "react";
import SocialButton from "../../src/components/SocialButton";

describe("SocialButton", () => {
  it("renders label and handles click", () => {
    const onClick = cy.stub().as("onClick");
    cy.mount(
      <SocialButton
        icon={<span>G</span>}
        label="Continue with Google"
        onClick={onClick}
      />,
    );

    cy.contains("Continue with Google").click();
    cy.get("@onClick").should("have.been.calledOnce");
  });
});
