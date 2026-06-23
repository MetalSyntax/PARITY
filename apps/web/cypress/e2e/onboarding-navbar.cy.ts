// Tests: Onboarding completes correctly and the bottom navbar shows the expected 4 items.
// Regression: SHOPPING id mismatch (was 'SHOPPING' but NAV_ICON_MAP uses 'SHOPPING_LIST').

const completeOnboarding = (overrideSelections?: () => void) => {
  cy.clearLocalStorage();
  cy.clearCookies();
  cy.window().then((win) => {
    return new Cypress.Promise((resolve) => {
      const req = win.indexedDB.deleteDatabase('parity_db');
      req.onsuccess = () => resolve(null);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    });
  });

  cy.visit('/');

  // Step 1: Profile — enter name
  cy.get('input[placeholder]').first().type('Test User', { delay: 30 });
  cy.contains('button', /next|siguiente|próximo/i).click();

  // Step 2: Language
  cy.contains('button', /next|siguiente|próximo/i).click();

  // Step 3: Privacy / currency
  cy.contains('button', /next|siguiente|próximo/i).click();

  // Step 4: Menu customization
  if (overrideSelections) {
    overrideSelections();
  }
  cy.contains('button', /next|siguiente|próximo/i).click();

  // Step 5: Finish
  cy.contains('button', /start|comenzar|iniciar/i).first().click();
};

const countNavbarButtons = () => {
  // The bottom nav has a fixed structure: leftItems + FAB + rightItems
  // We count nav buttons by looking inside the h-20 nav bar, excluding the FAB (rounded-full)
  return cy.get('[class*="h-20"]').find('button').not('[class*="rounded-full"]').not('[aria-label*="nueva"]');
};

describe('Onboarding → Navbar items', () => {
  it('shows 4 bottom nav items after completing onboarding with default selections', () => {
    completeOnboarding();

    // Should land on dashboard, not onboarding
    cy.contains(/total balance|balance total/i, { matchCase: false }).should('be.visible');

    // Bottom nav must have exactly 4 tappable items (2 left + 2 right of FAB)
    countNavbarButtons().should('have.length', 4);
  });

  it('shows 4 bottom nav items when Shopping List is selected during onboarding', () => {
    completeOnboarding(() => {
      // Deselect the 4th default (SCHEDULED) and select Shopping List instead
      cy.contains('button', /scheduled|pagos|programados/i).first().click();
      cy.contains('button', /shopping|compras|lista/i).first().click();
    });

    cy.contains(/total balance|balance total/i, { matchCase: false }).should('be.visible');

    // Shopping List (SHOPPING_LIST) must survive the NAV_ICON_MAP filter → 4 items visible
    countNavbarButtons().should('have.length', 4);
  });

  it('profile page reports 4/4 favorites that match what the navbar actually renders', () => {
    completeOnboarding();

    cy.contains(/total balance|balance total/i, { matchCase: false }).should('be.visible');

    // Verify raw navbar count
    countNavbarButtons().then(($navBtns) => {
      const navCount = $navBtns.length;

      // Navigate to Profile and read the displayed counter
      cy.get('[class*="h-20"]').find('button').last().click({ force: true });
      cy.contains(/profile|perfil/i, { matchCase: false }).should('be.visible');

      // The badge shows "{n}/4" — extract n and compare with actual navbar count
      cy.get('[class*="text-theme-brand"]')
        .filter(':contains("/")')
        .first()
        .invoke('text')
        .then((text) => {
          const profileCount = parseInt(text.split('/')[0].trim(), 10);
          expect(profileCount).to.equal(navCount);
        });
    });
  });
});
