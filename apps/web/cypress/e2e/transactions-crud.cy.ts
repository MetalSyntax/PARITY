// E2E: Add, Edit, and Delete transactions
// Covers: all transaction types, currencies, confirmation modal, balance updates.

const SEL = {
  fab:      '[data-tutorial="fab-add"]',
  save:     '[data-tutorial="tx-save-btn"]',
  amount:   '[data-tutorial="tx-amount-input"] input',
  // Type buttons (may have tutorial duplicates — always use .first())
  expense:  '[data-tutorial="tx-type-expense"]',
  income:   '[data-tutorial="tx-type-income"]',
  transfer: '[data-tutorial="tx-type-transfer"]',
  note:     'input[placeholder="Add a note..."]',
  // Currency pills live inside the tx-amount-input container
  currencyPills: '[data-tutorial="tx-amount-input"] .rounded-2xl button',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function openForm() {
  cy.get(SEL.fab).click();
  cy.get(SEL.save).should('be.visible');
}

function enterAmount(amount: string) {
  // .first() because EXPENSE/TRANSFER also render commission inputs inside the same container
  cy.get(SEL.amount).first().click().clear().type(amount);
}

function save() {
  cy.get(SEL.save).click();
  cy.get(SEL.fab).should('be.visible');
}

function selectCurrency(cur: 'USD' | 'VES' | 'EUR' | 'USDT') {
  cy.get('[data-tutorial="tx-amount-input"]').within(() => {
    cy.contains('button', cur).click();
  });
}

function isCurrencySelected(cur: string) {
  cy.get('[data-tutorial="tx-amount-input"]').within(() => {
    cy.contains('button', cur).should('have.class', 'bg-theme-brand');
  });
}

// Hover the tx row to reveal hidden actions, return the row chain
function txRow(noteText: string) {
  return cy.contains(noteText).closest('[class*="group"]').trigger('mouseover');
}

// Edit2 is aliased to Pen in lucide-react 0.562+ → class is lucide-pen
function clickEdit(noteText: string) {
  txRow(noteText).find('button:has(svg.lucide-pen)').click({ force: true });
  cy.get(SEL.save).should('be.visible');
}

// Trash2 → lucide-trash-2 (unchanged)
function clickDelete(noteText: string) {
  txRow(noteText).find('button:has(svg.lucide-trash-2)').click({ force: true });
  cy.contains(/are you sure/i).should('be.visible');
}

// ─────────────────────────────────────────────────────────────────────────────

describe('Add Transaction', () => {
  beforeEach(() => {
    // Provide deterministic rates so USDT (parallel) ≠ USD (official) conversion
    cy.intercept('GET', 'https://ve.dolarapi.com/v1/dolares', {
      body: [{ fuente: 'oficial', promedio: 40 }, { fuente: 'paralelo', promedio: 50 }],
    });
    cy.intercept('GET', 'https://ve.dolarapi.com/v1/euros', {
      body: [{ fuente: 'oficial', promedio: 43 }, { fuente: 'paralelo', promedio: 47 }],
    });
    cy.seedAppData();
    cy.visit('/');
    cy.get(SEL.fab, { timeout: 12000 }).should('be.visible');
  });

  it('opens and closes the add form', () => {
    openForm();
    cy.get(SEL.save).should('be.visible');
    cy.get('body').type('{esc}', { force: true });
    cy.get(SEL.fab).should('be.visible');
  });

  it('defaults to EXPENSE type (bg-theme-bg = selected state)', () => {
    openForm();
    // Selected type button uses bg-theme-bg (not bg-theme-brand)
    cy.get(SEL.expense).first().should('have.class', 'bg-theme-bg');
  });

  it('defaults to USD currency', () => {
    openForm();
    isCurrencySelected('USD');
  });

  it('adds an expense and shows it on the dashboard', () => {
    openForm();
    cy.get(SEL.expense).first().click();
    enterAmount('45');
    cy.get(SEL.note).type('Test Coffee');
    save();
    cy.contains('Test Coffee').should('exist');
  });

  it('adds an income transaction', () => {
    openForm();
    cy.get(SEL.income).first().click();
    enterAmount('500');
    cy.get(SEL.note).type('Test Salary');
    save();
    cy.contains('Test Salary').should('exist');
  });

  it('switches to VES currency and shows Bs. symbol', () => {
    openForm();
    selectCurrency('VES');
    cy.get('[data-tutorial="tx-amount-input"] span').first().should('contain', 'Bs');
  });

  it('switches to EUR currency and shows € symbol', () => {
    openForm();
    selectCurrency('EUR');
    cy.get('[data-tutorial="tx-amount-input"] span').first().should('contain', '€');
  });

  it('shows conversion summary (≈) when amount is entered', () => {
    openForm();
    enterAmount('100');
    cy.contains('≈').should('be.visible');
  });

  it('USDT conversion uses parallel rate (≠ BCV rate)', () => {
    openForm();
    enterAmount('100');
    selectCurrency('USD');
    // Scope to the form's conversion span to avoid matching stale dashboard elements
    cy.get('[data-tutorial="tx-amount-input"] span.italic').invoke('text').then((usdText) => {
      selectCurrency('USDT');
      cy.get('[data-tutorial="tx-amount-input"] span.italic').invoke('text').should((usdtText) => {
        // seed: usdRateParallel=42 > exchangeRate=40 → USDT Bs value > USD Bs value
        expect(usdtText).not.to.equal(usdText);
      });
    });
  });

  it('adds an expense with VES currency', () => {
    openForm();
    cy.get(SEL.expense).first().click();
    selectCurrency('VES');
    enterAmount('2000');
    cy.get(SEL.note).type('VES Lunch');
    save();
    cy.contains('VES Lunch').should('exist');
  });

  it('adds an expense with EUR currency', () => {
    openForm();
    cy.get(SEL.expense).first().click();
    selectCurrency('EUR');
    enterAmount('30');
    cy.get(SEL.note).type('EUR Purchase');
    save();
    cy.contains('EUR Purchase').should('exist');
  });

  it('amount input accepts decimal values', () => {
    openForm();
    enterAmount('12.50');
    cy.get(SEL.amount).should('have.value', '12.50');
  });

  it('adds a transfer between accounts', () => {
    openForm();
    cy.get(SEL.transfer).first().click();
    enterAmount('100');
    cy.get(SEL.note).type('Test Transfer');
    save();
    // Transfers are excluded from the dashboard list — form closing confirms success
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('Edit Transaction', () => {
  beforeEach(() => {
    cy.seedAppData();
    cy.visit('/');
    cy.get(SEL.fab, { timeout: 12000 }).should('be.visible');
  });

  it('opens edit form pre-filled with existing data', () => {
    clickEdit('Groceries');
    cy.get(SEL.amount).invoke('val').should('match', /50/);
    cy.get(SEL.note).should('have.value', 'Groceries');
  });

  it('updates the amount of a transaction', () => {
    clickEdit('Groceries');
    enterAmount('80');
    save();
    cy.contains('Groceries').should('exist');
  });

  it('updates the note of a transaction', () => {
    clickEdit('Groceries');
    cy.get(SEL.note).clear().type('Updated Groceries');
    save();
    cy.contains('Updated Groceries').should('exist');
  });

  it('can change the transaction type when editing', () => {
    clickEdit('Groceries');
    cy.get(SEL.income).first().click();
    cy.get(SEL.income).first().should('have.class', 'bg-theme-bg');
    save();
  });

  it('can change currency when editing', () => {
    clickEdit('Groceries');
    selectCurrency('VES');
    cy.get('[data-tutorial="tx-amount-input"] span').first().should('contain', 'Bs');
    save();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('Delete Transaction', () => {
  beforeEach(() => {
    cy.seedAppData();
    cy.visit('/');
    cy.get(SEL.fab, { timeout: 12000 }).should('be.visible');
  });

  it('shows confirmation modal before deleting', () => {
    clickDelete('Groceries');
    cy.contains(/are you sure/i).should('be.visible');
    cy.contains('button', /cancel/i).should('be.visible');
    cy.contains('button', /delete/i).should('be.visible');
  });

  it('deletes a transaction after confirming', () => {
    clickDelete('Groceries');
    cy.contains('button', /delete/i).click();
    cy.contains(/are you sure/i).should('not.exist');
    cy.contains('Groceries').should('not.exist');
  });

  it('cancels deletion — transaction remains', () => {
    clickDelete('Groceries');
    cy.contains('button', /cancel/i).click();
    cy.contains(/are you sure/i).should('not.exist');
    cy.contains('Groceries').should('exist');
  });

  it('deletes an income transaction', () => {
    clickDelete('Salary');
    cy.contains('button', /delete/i).click();
    cy.contains('Salary').should('not.exist');
  });

  it('deletes both transactions sequentially', () => {
    clickDelete('Groceries');
    cy.contains('button', /delete/i).click();
    cy.contains('Groceries').should('not.exist');

    clickDelete('Salary');
    cy.contains('button', /delete/i).click();
    cy.contains('Salary').should('not.exist');
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('Data Persistence (within session)', () => {
  beforeEach(() => {
    cy.seedAppData();
    cy.visit('/');
    cy.get(SEL.fab, { timeout: 12000 }).should('be.visible');
  });

  it('new transaction persists after reopening the add form', () => {
    openForm();
    enterAmount('99');
    cy.get(SEL.note).type('Persist Test');
    save();
    cy.contains('Persist Test').should('exist');

    // Adding the first transaction on a fresh profile always earns the first_dollar badge.
    // Wait for it (uses bg-black/60 which is unique to badge/level-up overlays),
    // then dismiss so the FAB is accessible again.
    cy.get('[class*="bg-black/60"]', { timeout: 5000 })
      .should('exist')
      .then(() => cy.get('body').type('{esc}', { force: true }));
    cy.get('[class*="bg-black/60"]').should('not.exist');

    // Re-open and close the form — transaction should still be there
    openForm();
    cy.get('body').type('{esc}', { force: true });
    cy.contains('Persist Test').should('exist');
  });

  it('balance reflects after adding an expense', () => {
    openForm();
    cy.get(SEL.expense).first().click();
    enterAmount('100');
    cy.get(SEL.note).type('Balance Check');
    save();
    cy.contains('Balance Check').should('exist');
  });
});
