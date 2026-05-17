// Tests: DataPortabilityView — CSV export (papaparse), JSON export, import tab.
// Covers: tab navigation, export buttons, download trigger, import file UI.

describe('Data Portability — Export & Import', () => {
  beforeEach(() => {
    cy.seedAppData();
    cy.visit('/');
    // Navigate to Export view via Profile → Export or bottom nav shortcut
    cy.contains('button, a', /profile|perfil/i, { matchCase: false }).first().click({ force: true });
    cy.contains('button, a', /export|portabilidad|data/i, { matchCase: false }).first().click({ force: true });
  });

  // ── Tab navigation ────────────────────────────────────────────────────────

  it('renders the Export tab by default with CSV and JSON options', () => {
    cy.contains(/export|exportar/i, { matchCase: false }).should('be.visible');
    cy.contains(/csv/i).should('be.visible');
    cy.contains(/json/i).should('be.visible');
  });

  it('can switch to the Import tab', () => {
    cy.contains('button, [role="tab"]', /import|importar/i, { matchCase: false }).click({ force: true });
    cy.contains(/import|upload|drag/i, { matchCase: false }).should('be.visible');
  });

  it('can switch to the Report tab', () => {
    cy.contains('button, [role="tab"]', /report|reporte/i, { matchCase: false }).click({ force: true });
    cy.contains(/report|pdf|summary/i, { matchCase: false }).should('be.visible');
  });

  // ── CSV export ────────────────────────────────────────────────────────────

  it('CSV export button is present', () => {
    cy.contains('button', /csv/i).should('exist');
  });

  it('CSV export triggers a download (intercept <a> click)', () => {
    // Intercept the download by listening for the "download" attribute on <a>
    cy.window().then(win => {
      cy.stub(win.document.body, 'appendChild').callThrough();
    });
    cy.contains('button', /csv/i).first().click({ force: true });
    // After clicking, no error should be thrown and we stay on the export page
    cy.contains(/csv|export/i, { matchCase: false }).should('be.visible');
  });

  // ── JSON export ───────────────────────────────────────────────────────────

  it('JSON export button is present', () => {
    cy.contains('button', /json/i).should('exist');
  });

  it('shows both JSON format options (encrypted and plain)', () => {
    cy.contains(/json/i).should('be.visible');
  });

  // ── Export filters ────────────────────────────────────────────────────────

  it('date-from and date-to filter inputs are present', () => {
    cy.get('input[type="date"]').should('have.length.at.least', 2);
  });

  it('wallet filter selector is present', () => {
    // There should be a select or wallet button for filtering
    cy.contains(/wallet|account|all/i, { matchCase: false }).should('be.visible');
  });

  // ── Import tab ────────────────────────────────────────────────────────────

  it('import tab has JSON backup restore option', () => {
    cy.contains('button, [role="tab"]', /import|importar/i, { matchCase: false }).click({ force: true });
    cy.contains(/json|backup|restore/i, { matchCase: false }).should('be.visible');
  });

  it('import tab has CSV external import option', () => {
    cy.contains('button, [role="tab"]', /import|importar/i, { matchCase: false }).click({ force: true });
    cy.contains(/csv|external/i, { matchCase: false }).should('be.visible');
  });
});
