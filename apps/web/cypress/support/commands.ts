Cypress.Commands.add('seedAppData', (fixture = 'seed') => {
  // Delete IndexedDB so the app falls through to the localStorage fallback
  cy.window().then((win) => {
    return new Cypress.Promise((resolve) => {
      const req = win.indexedDB.deleteDatabase('parity_db');
      req.onsuccess = () => resolve(null);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    });
  });

  cy.fixture(fixture).then((data) => {
    // Force LOCAL_STORAGE mode so the app skips IndexedDB on next load
    localStorage.setItem('storageType', 'LOCAL_STORAGE');
    localStorage.setItem('parity_data_v3', JSON.stringify(data));
    localStorage.setItem('activeProfileId', 'default');
    localStorage.setItem('displayCurrency', 'USD');
    localStorage.setItem('isBalanceVisible', 'true');
    // Ensure PIN lock and dev mode don't interfere
    localStorage.removeItem('autoLockEnabled');
    localStorage.removeItem('isDevMode');
  });
});

declare global {
  namespace Cypress {
    interface Chainable {
      seedAppData(fixture?: string): Chainable<void>;
    }
  }
}
