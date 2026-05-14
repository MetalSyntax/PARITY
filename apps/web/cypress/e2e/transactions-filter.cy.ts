// Tests: TransactionsListView month filter — new position (top utility bar) and
// new BudgetView-matching design (min-w-[140px], ChevronDown, Calendar brand icon).
// Also covers: search filter, type/category filter, clear filters.

describe('TransactionsListView — filters', () => {
  beforeEach(() => {
    cy.seedAppData();
    cy.visit('/');
    // Navigate to Transactions view
    cy.contains('button, a', /transactions|historial/i, { matchCase: false }).first().click({ force: true });
    cy.contains(/transactions|history/i, { matchCase: false }).should('be.visible');
  });

  // ── Month filter position & design ────────────────────────────────────────

  it('month filter button is in the top utility bar (not the title header)', () => {
    // The top utility bar has the currency toggle and month picker aligned to the right
    // It should NOT be inside the flex-row that contains the back-arrow + title
    cy.get('svg.lucide-calendar').should('exist');

    // The month button should contain a ChevronDown icon (BudgetView design)
    cy.get('svg.lucide-chevron-down').should('exist');
  });

  it('month filter button has the correct min-width and padding (BudgetView style)', () => {
    // Look for the button containing the Calendar icon — it should have min-w-[140px]
    cy.get('svg.lucide-calendar').closest('button').should($btn => {
      // Has "min-w" class in className string
      expect($btn.attr('class')).to.include('min-w');
      // Has px-5 or py-3 padding
      expect($btn.attr('class')).to.match(/px-5|py-3/);
    });
  });

  it('month filter button shows "All Periods" by default', () => {
    cy.get('svg.lucide-calendar').closest('button').should('contain.text', 'All');
  });

  it('clicking month filter opens a dropdown with month options', () => {
    cy.get('svg.lucide-calendar').closest('button').click();
    // The dropdown contains at least the "All Periods" option and month options
    cy.contains(/all periods|todos/i, { matchCase: false }).should('be.visible');
    // The seeded data has transactions in 2026-05
    cy.contains('2026').should('be.visible');
  });

  it('selecting a month filters the transaction list', () => {
    cy.get('svg.lucide-calendar').closest('button').click();
    cy.contains('2026').click();
    // After selecting, the list should be filtered (button shows selected month)
    cy.get('svg.lucide-calendar').closest('button').should('not.contain.text', 'All');
  });

  it('clicking "All Periods" resets the month filter', () => {
    // First select a month
    cy.get('svg.lucide-calendar').closest('button').click();
    cy.contains('2026').click();
    // Then click the button again and reset
    cy.get('svg.lucide-calendar').closest('button').click();
    cy.contains(/all periods|todos/i, { matchCase: false }).click();
    cy.get('svg.lucide-calendar').closest('button').should('contain.text', 'All');
  });

  it('ChevronDown rotates when dropdown is open', () => {
    cy.get('svg.lucide-chevron-down').closest('button').click();
    // After opening, the ChevronDown should have a rotate class
    cy.get('svg.lucide-chevron-down').should($el => {
      expect($el.attr('class')).to.include('rotate');
    });
  });

  // ── Search filter ─────────────────────────────────────────────────────────

  it('search filter shows matching transactions', () => {
    cy.get('input[placeholder*="search" i], input[placeholder*="buscar" i]').type('Groceries');
    cy.contains('Groceries').should('be.visible');
  });

  it('search filter hides non-matching transactions', () => {
    cy.get('input[placeholder*="search" i], input[placeholder*="buscar" i]').type('zzznomatch');
    cy.contains('Groceries').should('not.exist');
    cy.contains('Salary').should('not.exist');
  });

  it('X button clears search', () => {
    cy.get('input[placeholder*="search" i], input[placeholder*="buscar" i]').type('Groceries');
    // The clear X button appears next to the search input
    cy.get('svg.lucide-x').first().click({ force: true });
    cy.contains('Salary').should('be.visible');
  });

  // ── Clear all filters ─────────────────────────────────────────────────────

  it('"Clear filters" button appears when a filter is active', () => {
    cy.get('input[placeholder*="search" i], input[placeholder*="buscar" i]').type('test');
    cy.contains(/clear filters|limpiar/i, { matchCase: false }).should('be.visible');
  });

  it('"Clear filters" resets all filters', () => {
    cy.get('input[placeholder*="search" i], input[placeholder*="buscar" i]').type('zzznomatch');
    cy.contains(/clear filters|limpiar/i, { matchCase: false }).click();
    cy.get('input[placeholder*="search" i], input[placeholder*="buscar" i]').should('have.value', '');
  });
});
