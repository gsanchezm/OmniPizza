import React from "react";
import ConfirmDialog from "../../src/components/ConfirmDialog";

const mountDialog = (props = {}) =>
  cy.mount(
    <ConfirmDialog
      open
      testIdPrefix="delete-account"
      title="Delete your account?"
      body="This clears your data."
      cancelLabel="Cancel"
      confirmLabel="Delete account"
      onCancel={cy.stub().as("onCancel")}
      onConfirm={cy.stub().as("onConfirm")}
      {...props}
    />,
  );

describe("ConfirmDialog", () => {
  it("renders nothing when closed", () => {
    mountDialog({ open: false });
    cy.get("[data-testid=delete-account-modal]").should("not.exist");
  });

  it("is a labelled modal dialog and moves focus to Cancel", () => {
    mountDialog();
    cy.get("[data-testid=delete-account-modal]")
      .should("have.attr", "role", "dialog")
      .and("have.attr", "aria-modal", "true");
    cy.get("[data-testid=delete-account-cancel]").should("be.focused");
  });

  it("cancels on Cancel, Escape and a backdrop click", () => {
    mountDialog();
    cy.get("[data-testid=delete-account-cancel]").click();
    cy.get("body").type("{esc}");
    cy.get("[data-testid=delete-account-modal]").click("topLeft");
    cy.get("@onCancel").should("have.been.calledThrice");
  });

  it("confirms, and disables the confirm button while busy", () => {
    mountDialog();
    cy.get("[data-testid=delete-account-confirm]").click();
    cy.get("@onConfirm").should("have.been.calledOnce");

    mountDialog({ busy: true });
    cy.get("[data-testid=delete-account-confirm]").should("be.disabled");
  });
});
