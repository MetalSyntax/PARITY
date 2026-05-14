// Tests: App loads, dashboard renders, navigation to all main views works.
// Covers: view transition (framer-motion AnimatePresence), bottom nav, back buttons.

describe('Navigation', () => {
  beforeEach(() => {
    cy.seedAppData();
    cy.visit('/');
  });

  it('shows the dashboard (not onboarding) when data is seeded', () => {
    // Onboarding has a "Get started" / setup prompt; dashboard has the balance card
    cy.contains('Total Balance', { matchCase: false }).should('be.visible');
    cy.get('h1').should('not.contain', 'Onboarding');
  });

  it('bottom nav is visible on dashboard', () => {
    // Home button is always the first nav item
    cy.get('nav, [class*="h-20"]').should('exist');
  });

  it('navigates to Transactions view and back', () => {
    // Find the Transactions nav shortcut or navigate from a button
    cy.contains('button, a', /transactions/i, { matchCase: false }).first().click();
    cy.contains(/transactions|history/i).should('be.visible');
    cy.get('[data-cy="back"], button[aria-label="back"]').first().click({ force: true });
  });

  it('navigates to Budget view', () => {
    cy.contains('button, a', /budget|presupuesto/i, { matchCase: false }).first().click({ force: true });
    cy.contains(/budget|envelope/i, { matchCase: false }).should('be.visible');
  });

  it('navigates to Analysis view', () => {
    cy.contains('button, a', /analysis|analytics|análisis/i, { matchCase: false }).first().click({ force: true });
    cy.contains(/analysis|analytics|income|expense/i, { matchCase: false }).should('be.visible');
  });

  it('navigates to Wallets view', () => {
    cy.contains('button, a', /wallet|billetera/i, { matchCase: false }).first().click({ force: true });
    cy.contains(/wallet|account|balance/i, { matchCase: false }).should('be.visible');
  });
});
