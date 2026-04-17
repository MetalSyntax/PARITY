# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server on port 4000
npm run build      # Production build
npm run preview    # Preview production build
npm test           # Jest unit tests
npm run cypress:open  # Cypress E2E UI
npm run cypress:run   # Cypress E2E headless
npm run docs       # Generate TypeDoc docs
```

## Architecture

**PARITY** is a privacy-first, local-first dual-currency personal finance PWA for multi-currency economies (primarily Venezuela — USD/VES/EUR). Built with React 19 + Vite 6 + TypeScript.

### State Management

All app state lives in a single `AppContent` component in `App.tsx` — no Redux or Zustand. State is passed down via props. Key state domains:
- Entities: `accounts`, `transactions`, `scheduledPayments`, `budgets`, `goals`, `shoppingLists`
- Rates: `exchangeRate`, `usdRateParallel`, `euroRate`, `euroRateParallel` (fetched from `ve.dolarapi.com`)
- Multi-profile: `profiles`, `activeProfileId`, `userProfile`
- UI: `currentView`, `isDevMode`, `displayCurrency`, `isBalanceVisible`, `navbarFavorites`

### Persistence Layer

All data is encrypted at rest using **Web Crypto API (AES-GCM + PBKDF2)**. `services/crypto.ts` handles key derivation, encryption, and decryption.

- **Primary store:** IndexedDB via `services/db.ts`. Object store `"app_data"` holds all entities.
- **Fallback:** `localStorage` key `parity_data_v3` for legacy/encrypted blob.
- **UI preferences** (not encrypted): `displayCurrency`, `isBalanceVisible`, `isDevMode`, `activeProfileId`, `navbarFavorites`, `autoLockEnabled`, `autoLockDelay`, `biometricsEnabled`, `app_theme`.

**Offline sync:** `services/sync.ts` queues mutations when offline and processes them on reconnect. Google Drive backup is optional (dev-mode feature) via `useGoogleDriveSync` hook; exports/imports use the same encrypted format.

### Views & Navigation

`currentView` in AppContent controls which view renders. Views live in `/views/`. Key views:
- `Dashboard` — Widget-based overview with draggable/reorderable widget grid (`widgetRegistry.tsx`)
- `AddTransaction` / `TransferView` — Custom numeric keypad, smart category detection
- `BudgetView`, `AnalysisView`, `GoalView` — Planning/forecasting features
- `FiscalReportView` — Tax-tagged transactions summary
- `CurrencyPerformanceView` — Exchange rate history with dev-mode parallel rate card
- `Onboarding` — First-run setup; Google Drive import shown only in `isDevMode`

### Dev Mode

`isDevMode` is toggled by clicking the version label 10 times rapidly (`handleDevModeTrigger` in `App.tsx`). It persists in `localStorage` key `isDevMode`. Dev mode unlocks: Google Drive sync UI, parallel exchange rate selector in settings, parallel rate card in CurrencyPerformanceView.

### i18n

Custom modular translation system — no third-party library. Files in `/i18n/{en,es,pt}/` split by domain (`common`, `views`, `categories`, `alerts`, `fiscal`, `misc`). Usage: `getTranslation(userProfile.language, key)`. Falls back to English then to the key string. Language is per-profile.

### Key Types

Defined in `types.ts`:
- `Currency`: `USD | VES | EUR | USDT`
- `TransactionType`: `EXPENSE | INCOME | TRANSFER`
- `RateType`: `'OFFICIAL' | 'PARALLEL'`
- `FiscalTag`: `'TAXABLE_INCOME' | 'DEDUCTIBLE_EXPENSE' | 'NEUTRAL'`
- `ViewState`: union of 16 view name strings
- `Transaction`: includes `amountInOriginalCurrency`, `normalizedAmount` (USD), `exchangeRateAtTime`, `fiscalTag`, `profileId`
- `UserProfile`: includes `language`, `rateType`, `hideDevMode`, `dashboardTxLimit`, `hideWelcome`, `hideName`

### Utils & Services

- `utils/forecast.ts`: Linear regression, month-end projections, budget pace alerts, fiscal year summaries, runway calculations.
- `utils/formatUtils.ts`: `formatAmount()` / `formatSecondaryAmount()` — always pass active exchange rate and `rateType`.
- `constants.tsx`: 31+ spending categories with Lucide icons/colors; `SMART_CATEGORIES_EN` map for auto-categorization by merchant name; recurring payment templates.
- `themes.json`: 3 built-in themes (Original Dark, Midnight Ocean, Forest) — CSS variables applied by `useTheme`.

### Environment Variables

Required in `.env`:
```
VITE_GOOGLE_CLIENT_ID=
VITE_APP_ENCRYPTION_SECRET=
VITE_APP_ENCRYPTION_SALT=
```
