# AI Skill: Unit & Automated Testing (Jest & Cypress)

Use these guidelines when writing, modifying, or debugging tests in the PARITY repository.

## Jest (Unit & Component Tests)
- **Framework & Config:** Standard React Testing Library with Jest. Configuration resides in `jest.config.js` and setups in `jest.setup.ts`.
- **Test File Location:** Place unit tests in files named `*.test.ts` or `*.test.tsx` inside `__tests__` directories or alongside the component.
- **Coverage Goals:**
  - Logic/Math Utils: 100% logic coverage (especially exchange rate formatting and financial forecasting modules).
  - Business Hook Logic: Test hooks (`useTheme`, `useGoogleDriveSync`) in isolation using `@testing-library/react-hooks`.
- **Mocking Rules:**
  - Mock Web Crypto API functions because they are asynchronous and environment-dependent.
  - Mock IndexedDB services so testing doesn't pollute or depend on the browser storage layer.

## Cypress (End-to-End & Integration Tests)
- **Framework & Config:** Cypress 13+. Config in `cypress.config.ts`.
- **Test Specifications:** Located under the `cypress/` directory.
- **Testing Local-First Flows:**
  - **IndexedDB state injection:** Pre-populate state inside IndexedDB before starting tests to test specific application views instantly.
  - **Offline Mode emulation:** Test offline sync triggers by disabling browser connectivity programmatically in tests.
- **Command Runs:**
  - Open UI Runner: `npm run cypress:open`
  - Headless Run: `npm run cypress:run`
