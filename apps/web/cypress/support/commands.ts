// Seed the app with plain-JSON data (bypasses encryption via legacy JSON fallback).
// The app tries decryptData() first; on failure it falls back to JSON.parse().
Cypress.Commands.add('seedAppData', (fixture = 'seed') => {
  cy.fixture(fixture).then((data) => {
    localStorage.setItem('parity_data_v3', JSON.stringify(data));
    localStorage.setItem('activeProfileId', 'default');
    localStorage.setItem('displayCurrency', 'USD');
    localStorage.setItem('isBalanceVisible', 'true');
  });
});

declare global {
  namespace Cypress {
    interface Chainable {
      seedAppData(fixture?: string): Chainable<void>;
    }
  }
}
