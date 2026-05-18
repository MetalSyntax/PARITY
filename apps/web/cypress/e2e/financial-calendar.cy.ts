// Tests: FinancialCalendarView — month grid, day cells, scheduled payment ghosts.
// Phase 2 feature with no prior test coverage.

describe('Financial Calendar', () => {
  beforeEach(() => {
    cy.seedAppData();
    cy.visit('/');
    cy.contains('button, a', /calendar|calendario/i, { matchCase: false }).first().click({ force: true });
  });

  it('renders the Financial Calendar view', () => {
    cy.contains(/calendar|calendario/i, { matchCase: false }).should('be.visible');
  });

  it('shows a month grid with day numbers', () => {
    // Day numbers 1–28 at minimum should appear
    cy.contains('1').should('be.visible');
    cy.contains('15').should('be.visible');
  });

  it('shows navigation arrows for previous/next month', () => {
    cy.get('svg.lucide-chevron-left, svg.lucide-arrow-left, button[aria-label*="prev" i]').should('exist');
    cy.get('svg.lucide-chevron-right, svg.lucide-arrow-right, button[aria-label*="next" i]').should('exist');
  });

  it('can navigate to the previous month', () => {
    cy.get('svg.lucide-chevron-left').closest('button').first().click({ force: true });
    cy.get('body').should('not.contain', 'Error');
  });

  it('can navigate to the next month', () => {
    cy.get('svg.lucide-chevron-right').closest('button').first().click({ force: true });
    cy.get('body').should('not.contain', 'Error');
  });

  it('clicking a day with transactions opens the day detail', () => {
    // The seeded data has a transaction on May 10, 2026
    cy.contains('10').click({ force: true });
    // Should show some detail — either a sheet or inline expansion
    cy.contains(/groceries|income|salary|detail|transaction/i, { matchCase: false }).should('be.visible');
  });

  it('shows colored indicators on days with activity', () => {
    // Days with expenses should have a red/green dot — look for colored circle elements
    cy.get('[class*="rounded-full"][class*="bg-"]').should('have.length.at.least', 1);
  });
});
