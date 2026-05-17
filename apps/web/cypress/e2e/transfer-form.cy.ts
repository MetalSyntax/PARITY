// Tests: TransferView with react-hook-form + zod validation.
// Covers: empty-amount error, same-account error, valid submission.

describe('Transfer Form (react-hook-form + zod)', () => {
  beforeEach(() => {
    cy.seedAppData();
    cy.visit('/');
    // Navigate to Transfer view via the + button or bottom nav shortcut
    cy.contains('button', /transfer/i, { matchCase: false }).first().click({ force: true });
    // Wait for the transfer form to appear
    cy.contains(/transfer/i, { matchCase: false }).should('be.visible');
  });

  it('renders the Transfer view with from/to selects and amount input', () => {
    cy.get('select').should('have.length.at.least', 2);
    cy.get('input[type="number"]').should('exist');
    cy.contains('button[type="submit"], button', /transfer now|transferir/i, { matchCase: false }).should('exist');
  });

  it('shows validation error when submitting with empty amount', () => {
    cy.get('form').submit();
    // Zod refine: "Required" or "Must be > 0"
    cy.contains(/required|must be/i, { matchCase: false }).should('be.visible');
  });

  it('shows error when amount is 0', () => {
    cy.get('input[type="number"]').first().type('0');
    cy.get('form').submit();
    cy.contains(/must be/i, { matchCase: false }).should('be.visible');
  });

  it('shows error when amount is negative', () => {
    cy.get('input[type="number"]').first().type('-50');
    cy.get('form').submit();
    cy.contains(/must be/i, { matchCase: false }).should('be.visible');
  });

  it('shows same-account error when from and to are the same', () => {
    // Select the same account for both dropdowns (select index 0 for both)
    cy.get('select').eq(0).then($from => {
      const firstOption = $from.find('option').first().val() as string;
      cy.get('select').eq(0).select(firstOption);
      cy.get('select').eq(1).select(firstOption);
    });
    cy.get('input[type="number"]').first().type('100');
    cy.get('form').submit();
    cy.contains(/same account/i, { matchCase: false }).should('be.visible');
  });

  it('submits successfully with valid data', () => {
    // Ensure from !== to (seed has acc-1 and acc-2)
    cy.get('select').eq(0).find('option').first().then($opt => {
      cy.get('select').eq(0).select($opt.val() as string);
    });
    cy.get('select').eq(1).find('option').eq(1).then($opt => {
      cy.get('select').eq(1).select($opt.val() as string);
    });
    cy.get('input[type="number"]').first().clear().type('50');
    cy.contains('button', /transfer now|transferir/i, { matchCase: false }).click();
    // After successful transfer, view should go back to dashboard or show no errors
    cy.contains(/same account|required|must be/i, { matchCase: false }).should('not.exist');
  });
});
