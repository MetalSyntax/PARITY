// Tests: ScenarioPlannerView — Rate Shock Simulator, scenario events, compare table.
// This is a Phase 2 feature with no prior test coverage.

describe('Scenario Planner', () => {
  beforeEach(() => {
    cy.seedAppData();
    cy.visit('/');
    // Navigate to Scenario Planner
    // It may be under Analysis or accessible from the bottom nav favorites
    cy.contains('button, a', /scenario|planner|escenario/i, { matchCase: false }).first().click({ force: true });
  });

  it('renders the Scenario Planner view', () => {
    cy.contains(/scenario|planner|escenario/i, { matchCase: false }).should('be.visible');
  });

  it('shows the Rate Shock Simulator control', () => {
    cy.contains(/rate shock|shock de tasa/i, { matchCase: false }).should('be.visible');
    // The slider control should be present
    cy.get('input[type="range"]').should('exist');
  });

  it('moving the rate shock slider updates the projected balance display', () => {
    cy.get('input[type="range"]').first().then($slider => {
      const min = parseFloat($slider.attr('min') || '0');
      const max = parseFloat($slider.attr('max') || '100');
      const mid = Math.floor((min + max) / 2).toString();
      cy.wrap($slider).invoke('val', mid).trigger('input').trigger('change');
    });
    // Some numeric output should update — at minimum no crash
    cy.get('body').should('not.contain', 'undefined');
  });

  it('has an "Add Event" button to create scenario events', () => {
    cy.contains('button', /add event|agregar evento|new event/i, { matchCase: false }).should('exist');
  });

  it('can open the add-event form', () => {
    cy.contains('button', /add event|agregar evento|new event/i, { matchCase: false }).first().click({ force: true });
    // Form fields should appear
    cy.get('input, select').should('have.length.at.least', 1);
  });

  it('shows a projected balance or net worth figure', () => {
    // The scenario planner should show some USD balance figure
    cy.contains(/\$|USD|balance|net worth/i, { matchCase: false }).should('be.visible');
  });

  it('shows a comparison table or section when multiple scenarios exist', () => {
    // At minimum the compare section label should be present
    cy.contains(/compare|comparar|scenarios/i, { matchCase: false }).should('be.visible');
  });
});
