// Tests: ContactDirectoryView and DebtSplitTrackerView — Phase 2 features.
// Covers: contact list, add contact form, debt list, add debt form, settle flow.

describe('Contact Directory', () => {
  beforeEach(() => {
    cy.seedAppData();
    cy.visit('/');
    cy.contains('button, a', /contacts|contactos/i, { matchCase: false }).first().click({ force: true });
  });

  it('renders the Contacts view', () => {
    cy.contains(/contacts|contactos/i, { matchCase: false }).should('be.visible');
  });

  it('shows empty state when no contacts exist', () => {
    cy.contains(/no contacts|add your first|empty|ningún/i, { matchCase: false }).should('be.visible');
  });

  it('has an "Add Contact" button', () => {
    cy.contains('button', /add contact|nuevo contacto|\+/i, { matchCase: false }).should('exist');
  });

  it('clicking Add Contact opens a form', () => {
    cy.contains('button', /add contact|nuevo contacto|\+/i, { matchCase: false }).first().click({ force: true });
    cy.get('input[placeholder*="name" i], input[placeholder*="nombre" i]').should('be.visible');
  });

  it('can create a new contact', () => {
    cy.contains('button', /add contact|nuevo contacto|\+/i, { matchCase: false }).first().click({ force: true });
    cy.get('input[placeholder*="name" i], input[placeholder*="nombre" i]').first().type('Carlos Test');
    cy.contains('button', /save|guardar|add|crear/i, { matchCase: false }).first().click({ force: true });
    cy.contains('Carlos Test').should('be.visible');
  });
});

describe('Debt & Split Tracker', () => {
  beforeEach(() => {
    cy.seedAppData();
    cy.visit('/');
    cy.contains('button, a', /debt|deuda/i, { matchCase: false }).first().click({ force: true });
  });

  it('renders the Debt Tracker view', () => {
    cy.contains(/debt|deuda/i, { matchCase: false }).should('be.visible');
  });

  it('shows two sections: "I Owe" and "They Owe"', () => {
    cy.contains(/i owe|yo debo/i, { matchCase: false }).should('be.visible');
    cy.contains(/they owe|me deben/i, { matchCase: false }).should('be.visible');
  });

  it('has an "Add Debt" button', () => {
    cy.contains('button', /add debt|nueva deuda|\+/i, { matchCase: false }).should('exist');
  });

  it('clicking Add Debt opens a form with required fields', () => {
    cy.contains('button', /add debt|nueva deuda|\+/i, { matchCase: false }).first().click({ force: true });
    cy.get('input, select').should('have.length.at.least', 2);
  });

  it('can add a "They Owe" debt', () => {
    cy.contains('button', /add debt|nueva deuda|\+/i, { matchCase: false }).first().click({ force: true });
    // Select "They owe me" type
    cy.contains('button, label, input', /they owe|me deben/i, { matchCase: false }).first().click({ force: true });
    cy.get('input[type="number"]').first().type('150');
    cy.get('input[type="text"], input[placeholder*="name" i], input[placeholder*="nombre" i]').first().type('Juan');
    cy.contains('button', /save|guardar|add|confirm/i, { matchCase: false }).first().click({ force: true });
    cy.contains('Juan').should('be.visible');
  });
});
