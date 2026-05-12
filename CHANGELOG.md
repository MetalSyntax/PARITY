# Changelog

All notable changes to **Parity** are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/). Versioning follows [Semantic Versioning](https://semver.org/).

---

## [1.4.0] — 2026-05-12

### Added
- **Interactive Tutorial System** — complete rewrite of `TutorialSystem` component; now a live, step-by-step guided experience running inside the real app (not a slideshow). Features: 4-rect spotlight overlay with click-through to target element, `getBoundingClientRect` tooltip positioning (prefers below, flips above when space is insufficient, clamped to viewport), `waitForClick` event listeners that auto-advance on real user interaction, async setup with 15×100 ms DOM retry loop for post-navigation renders, exit confirmation modal, and a completion/trophy screen. Desktop-only (≥ 1024 px); shows an informational sheet on mobile.
- **10 tutorial definitions** covering: recording expenses, recording income, transfers, account setup, transaction categorization, budget management, expense reports, recurring payments, data export, and Dashboard customization.
- **Tutorial System lifted to App.tsx** — `TutorialSystem` is now mounted at app level so the overlay persists across view changes. Receives `onNavigate` prop wired to `setCurrentView`.
- **Tutorial icons** — replaced emoji characters with Lucide icon components, each with a unique accent color per tutorial type.
- **`data-tutorial` attributes** added to `AddTransaction`: type selector buttons (`tx-type-expense`, `tx-type-income`, `tx-type-transfer`), amount section wrapper (`tx-amount-input`), and save button (`tx-save-btn`).
- **Unified filter bar** in `DashboardWidgets.TransactionsWidget`: collapsible panel with full-width search + 4 icon/label popup buttons (Period, Wallet, Type, Category). Active-filter badge on toggle button; "Clear filters" link in header.
- **Unified filter bar** in `TransactionsListView`: always-visible search row + 3-column grid for Wallet, Type, and Category popups. Month picker moved to the header row (matching other views).
- **Wallet filter** in `TransactionsWidget` and `TransactionsListView` — covers both `accountId` and `toAccountId` so transfer legs are correctly matched.
- **Dashboard header overhaul** — two-row layout: Row 1 = profile photo + name (left) + exchange rate (right); Row 2 = left-aligned action buttons (Sync, Widgets, Update, Settings, Tutorials).
- **i18n** — added `btn_sync`, `btn_widgets`, `btn_update`, `btn_settings`, `btn_tutorials`, `filter`, `clearFilters` keys across EN/ES/PT.
- **`AddTransaction` — currency label next to Fijo** — the fixed-commission input now displays a small `USD` / `VES` / `EUR` suffix matching the active transaction currency.

### Fixed
- **Transfer fee** — commission is now deducted from the source account (`amount + fee` out), not the destination. Delete reversal and receipt preview updated to match.
- **VES→USD transfer normalization** — `manualExchangeRate` now always stores the standard Bs/USD rate; preview and normalization divide when source is VES (fixes 500 Bs normalizing to 250 000 USD).
- **Wallet filter icons** — replaced raw icon-key string rendering with `renderAccountIcon()` so correct React icon components are displayed in filter chips.
- **Dashboard `showTutorials` reference** — removed stale `showTutorials` from `useEffect` dependency array and bottom-nav toggle logic after lifting state to App.tsx.

### Changed
- `ProfileView` version label updated `v1.3.0` → `v1.4.0`.
- `package.json` version bumped `1.3.0` → `1.4.0`.
- `TutorialSystem` props extended: `onNavigate: (view: string) => void` added; component removed from Dashboard and mounted exclusively at App.tsx level.

---

## [1.3.0] — 2026-05-08

### Added
- **ContactDirectoryView** — wallet-linked payment handle quick-fill: user accounts now appear as chips in the Add Contact modal; clicking one auto-selects the inferred handle type (Zelle, Binance Pay, Pago Móvil, Bank, Cash) and pre-fills the value field for editing.
- **ContactDirectoryView** — all payment handle type labels localized in the `<select>` and detail badges (EN/ES/PT).
- **ContactDirectoryView** — hardcoded placeholder strings replaced with i18n keys: `namePlaceholder`, `emailPlaceholder`, `handlePlaceholder`, `contactEmail`.
- **App.tsx** — `accounts` prop (profile-scoped) now passed to `ContactDirectoryView`.
- **Contact & Debt persistence** — state routed through App.tsx and saved to encrypted IndexedDB (`encContacts`, `encDebts`).
- **ScenarioPlannerView** — "Apply to Reality" button per scenario event; fires `onApplyToReality` callback that pre-populates `AddTransaction`.
- **FinancialCalendarView** — calendar days read real transaction data; day headers generated with locale-aware `toLocaleString` instead of hardcoded Spanish strings.
- **ProfileView** — USDT P2P Spread input (range −10% to +20%) stored in `UserProfile.usdtSpread`.
- **Debt overdue notifications** — `checkScheduledNotifications` now fires a push alert once per day per overdue debt.
- **AddTransaction** — contact autosuggest dropdown (triggers at 2+ chars) with badge and `contactId` attached to saved transaction.
- **i18n** — new keys across EN/ES/PT: `handleZelle`, `handleBinancePay`, `handlePagoMovil`, `handleBank`, `handleCash`, `handleOther`, `fromYourWallets`, `namePlaceholder`, `emailPlaceholder`, `handlePlaceholder`, `contactEmail`, `applyToReality`, `rateShift`, `paymentHandles`, `createdAt`, `contactNetFlow`, `quickTransfer`, `theyOweMe`, `iOwe`, `inflationGuard`, `originalValue`, `paymentHistory`, `newSplit`, `remaining`, `paid`, `addPayment`, `overdue`, `dueIn`, `partial`, `theyOwe`, `usdtSpread`, `usdtSpreadDesc`, `p2pSpreadPercent`, `usdtSpreadHint`, `debtOverdueTitle`, `newScenario`, `noScenarios`, `createFirstScenario`, `maxScenariosReached`, `compareScenarios`, `eventCount`, `delete`, `fieldRequired`, `mustBePositive`.

### Changed
- `ProfileView` version label updated from `v1.1.0` → `v1.3.0`.
- `package.json` version bumped `1.2.0` → `1.3.0`.

---

## [1.2.0] — 2026-04-XX

### Added
- Complete redesign of **Wallet View** with tabbed interface (Income / Wallets).
- **Active Sources** dashboard with percentage income breakdown.
- **Realized Income History** with date grouping.
- **Net Monthly Flow** metrics and scheduled income tracking.
- New functional modules: **Contact Directory**, **Debt Split Tracker**, **Scenario Planner**, **Financial Calendar**.
- Unified data portability into a single **Export/Import Center**.
- Comprehensive atomic UI library (atoms & molecules).
- Full i18n coverage for all new views in EN/ES/PT.

---

## [1.1.0] — 2026-XX-XX

### Added
- Standardized UI/UX navigation, budget isolation, and custom dropdowns.
- TypeDoc project documentation and unit/E2E testing environments.
- **Offline-First Sync Queue** for reliable data management.
- Dashboard Quick Actions enhancements.
- Budget enhancements, goal associations, and multiple UI refinements.
- Exchange rate update logic and customizer restructure.

---

## [1.0.29]

- Invoice View directly in Transactions page.
- Manual image cropping and update controls for receipts.
- Unified invoice translations (EN/ES/PT).

## [1.0.28]

- Currency Converter UI redesign.
- App Onboarding enhancements; developer-only feature gating.
- Fix: Android black screen, React Hook mismatch, Dashboard Total Balance.

## [1.0.27]

- Goal Completion workflow with automatic multi-wallet transaction recording.
- Standardize currency symbols globally: Bs (VES), € (EUR), $ (USD).

## [1.0.26]

- Scheduled Notifications system.
- Live historical market data (BCV/Binance) for USD & EUR.
- Currency Performance view with inflation shield and volatility spread charts.

## [1.0.25]

- Unified `TransactionDetailModal` (drawer-style, Summary/Invoice tabs).
- Fullscreen Lightbox for receipts.
- Fix: RangeError (max call stack) during encryption of large datasets.

## [1.0.24]

- Full i18n for ProfileView, TransferView, BudgetView, ScheduledPaymentView.
- Locale-aware date formatting (es-ES, pt-BR, en-US).

## [1.0.23]

- Transfer commissions (fixed + percentage).
- Unified custom numeric keypad across all financial inputs.
- Currency Converter Dashboard widget.
- Smart category filtering (income vs. expense segregation).

## [1.0.22]

- Google Drive backup list and restore UI (dev mode).
- IndexedDB decryption fallback to prevent `TransactionInactiveError`.

## [1.0.21]

- Biometric/fingerprint reveal for masked balances.
- Dashboard PIN modal with biometric support.

## [1.0.20]

- Enhanced UI consistency, theme handling, and mobile gesture disabling.
- Splash screen and PWA mobile experience.

## [1.0.17]

- Integrated camera modal and custom capture flow.
- Smart invoice scanning with native camera capture.
- PIN auto-lock with configurable delay.

## [1.0.16]

- Dynamic widget drag-and-drop reordering on Dashboard.

## [1.0.14]

- Fix scheduled payment cycles; enhanced wallet sources; redesigned category selection.
