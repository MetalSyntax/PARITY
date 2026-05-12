# PARITY 💸 `v1.4.0`

**Master the Flux. Two Currencies. One Wallet.**

---

## 📋 About The Project

**Parity** is a modern, privacy-focused financial tracker designed for users living in multi-currency economies (specifically tailored for high-inflation environments like Venezuela). It treats dual-currency management (USD & VES) as a first-class citizen, providing seamless visualization and calculation of your net worth across different exchange rates.

Built with a **Local-First** philosophy, Parity ensures your financial data stays under your control. All processing happens on your device, using modern web technologies for security and performance.

## ✨ Key Features

### 🚀 Dual-Currency Core

- **Instant Toggle:** Switch your entire Dashboard and transaction history between **USD** and **VES** with a single tap.
- **Live Exchange Rates:** Integration with `DolarAPI` to fetch Official (BCV) and Parallel market rates in real-time.
- **Smart Transfers:** Move money between accounts of different currencies (e.g., USD Zelle -> VES Bank) with automatic rate calculation at the moment of the transaction.

### 🛡️ Privacy & Security (Zero-Knowledge)

- **Encryption by Default:** All financial data is encrypted using the **Web Crypto API (AES-GCM)** before being stored. Your data is unreadable without the app's internal security context.
- **Cloud Sync:** Securely backup and sync your encrypted data using **Google Drive Integration**. Only you can access your backup files.
- **Storage Options:** Choose between **LocalStorage** or **IndexedDB** for high-performance and larger dataset support.
- **Privacy Mode:** One-click balance masking (`******`) to hide sensitive numbers while navigating in public.
- **PIN Protection:** Secure your financial data with a configurable 4-digit PIN.

### 📊 Advanced Analytics

- **Interactive Dashboard:**
  - **Net Flow Chart:** Visualize your last 7 days of income vs. expenses.
  - **Daily Spending:** Track your daily burn rate with precision.
  - **Category Structure:** Interactive doughnut charts for instant spending recognition.
- **Digital Envelopes:** Set monthly spending limits per category and track your "burning rate" visually.
- **Savings Goals:** Create specific goals (e.g., "New Laptop") with progress tracking and celebratory milestones.

### 🌍 Multi-Language Support

- **Modular i18n:** Full support for **English**, **Spanish**, and **Portuguese**.

### 🎨 Premium UX

- **Glassmorphic UI:** A sleek, modern interface with smooth transitions and custom alerts.
- **Intelligent Nav:** A context-aware navigation system that maximizes screen real estate.
- **PWA Ready:** Install Parity on your phone or desktop for an app-like experience.

---

## 🛠 Tech Stack

The project is built as a lightweight, performant Single Page Application (SPA) with a focus on local-only processing.

- **Framework:** [React 19](https://reactjs.org/)
- **Security:** [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) (AES-GCM)
- **Storage:** IndexedDB & LocalStorage
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [TailwindCSS](https://tailwindcss.com/) + CSS Variables
- **Icons:** [Lucide React](https://lucide.dev/)
- **Charts:** custom SVG & [Chart.js](https://www.chartjs.org/)

---

## 📜 Changelog

### v1.4.0

- **Interactive Tutorial System (full rewrite):**
  - `feat`: live spotlight overlay with 4-rect cutout — real click-through to the highlighted element; clicking outside the spotlight opens an exit-confirmation dialog
  - `feat`: `waitForClick` event listeners auto-advance tutorial steps on genuine user interaction (FAB, type buttons, etc.)
  - `feat`: `getBoundingClientRect` tooltip positioning — prefers below target, flips above when space is insufficient, clamped to viewport
  - `feat`: async step setup with 15×100 ms DOM retry loop for post-navigation renders (e.g. AddTransaction modal)
  - `feat`: tutorial system lifted to App.tsx so the overlay persists across view changes
  - `feat`: 10 tutorials covering the full core workflow
  - `feat`: tutorial cards use Lucide icons with per-tutorial accent colors (replaced emojis)
  - `feat`: desktop-only guard — informational sheet shown on screens < 1024 px
- **Filter UX overhaul:**
  - `feat`: unified collapsible filter bar in Dashboard Transactions widget — search + 4 icon/label popup buttons (Period, Wallet, Type, Category)
  - `feat`: TransactionsListView filter bar — 3-column popup grid (Wallet, Type, Category); month picker promoted to header row
  - `feat`: wallet filter covers both source and destination accounts (transfers included)
- **Dashboard header restructure:**
  - `feat`: two-row header layout — profile + rate on top; action buttons (Sync, Widgets, Update, Settings, Tutorials) left-aligned below
  - `feat`: 5 action buttons fully translated (EN/ES/PT)
- **AddTransaction:**
  - `feat`: fixed-commission ("Fijo") input shows `USD` / `VES` / `EUR` suffix matching the active currency
  - `fix`: commission deducted from source account, not destination; preview and reversal updated
  - `fix`: VES→USD transfer normalization (`manualExchangeRate` always stored as Bs/USD)
- **i18n:** `btn_sync`, `btn_widgets`, `btn_update`, `btn_settings`, `btn_tutorials`, `filter`, `clearFilters` added to EN/ES/PT

### v1.3.0

- **Contact Directory — Smart Popup:**
  - `feat`: integrate user wallet accounts as quick-fill chips in the "Payment Handles" section — clicking a wallet auto-selects the matching handle type (Zelle, Binance Pay, Pago Móvil, etc.) and pre-fills the value field
  - `feat`: localize all payment handle type labels in the selector and detail badges (EN/ES/PT)
  - `feat`: replace every hardcoded placeholder string with i18n keys (`namePlaceholder`, `emailPlaceholder`, `handlePlaceholder`, `contactEmail`)
- **Phase 2 Module Completion:**
  - `feat`: persist **Contact Directory** and **Debt Split Tracker** state through App.tsx and encrypted IndexedDB
  - `feat`: **Scenario Planner** — "Apply to Reality" button wires hypothetical events directly into the AddTransaction flow
  - `feat`: **Financial Calendar** — days now show real transaction counts and amounts from live data; day names are locale-aware
  - `feat`: **USDT P2P Spread** setting added to ProfileView for accurate parallel-rate calculations
  - `feat`: overdue debt push notifications via `checkScheduledNotifications`
- **i18n:**
  - `feat`: 50+ new keys across EN/ES/PT — handle types, contact form labels, scenario planner, debt tracker, USDT spread

### v1.2.0

- **Income & Wallet Redesign:**
  - `feat`: complete redesign of the **Wallet View** with a new tabbed interface (Income / Wallets)
  - `feat`: implement **Active Sources** dashboard with percentage breakdown for income
  - `feat`: add **Realized Income History** with date grouping and improved transaction display
  - `feat`: introduce **Net Monthly Flow** metrics and scheduled income tracking
- **New Functional Modules:**
  - `feat`: implement **Contact Directory**, **Debt Split Tracker**, **Scenario Planner**, and **Financial Calendar**
  - `feat`: unify data portability into a single **Export/Import Center**
- **Atomic Design System:**
  - `feat`: introduce comprehensive **UI library** (atoms & molecules) for consistent aesthetics
  - `refactor`: transition core components to the new atomic design architecture
- **I18n & Localization:**
  - `feat`: complete i18n coverage for all new views in English, Spanish, and Portuguese

### v1.1.0

- **Standardization & Productivity:**
  - `feat`: standardize UI/UX navigation, budget isolation, and custom dropdowns
  - `feat`: implement project documentation (TypeDoc) and setup unit/E2E testing environments
- **Offline & Reliability:**
  - `feat`: implement **Offline-First Sync Queue** for reliable data management
  - `feat`: enhance dashboard Quick Actions and overall app responsiveness
- **Features & Enhancements:**
  - `feat`: budget enhancements, goal associations, and multiple UI refinements
  - `feat`: update exchange rate update logic and restructure customizer
  - `refactor`: extract unused code and improve Transaction Detail view logic

### v1.0.29

- **Invoices & Image Editing:**
  - `feat`: implement dedicated Invoice View directly in the Transactions page
  - `feat`: add manual image cropping and update controls for existing receipts/invoices
  - `feat`: add new "Invoices" quick action to the Dashboard
  - `feat`: unified translations for invoices (EN, ES, PT)
  - `ux`: enhance crop/edit modal spacing to prevent overlap with bottom navigation bar

### v1.0.28

- **UI Redesign & Mobile Stability:**
  - `feat`: redesign Currency Converter UI layout and improve input logic
  - `feat`: enhance App Onboarding process and restrict developer-only features
  - `feat`: improve commission calculation logic
  - `fix`: fix Android black screen issues, React Hook mismatch, and system effects
  - `fix`: resolve Dashboard Total Balance UI issues & Currency Performance rendering
  - `chore`: implemented and reverted experimental mobile permission management

### v1.0.27

- **Goal Milestones & Currency Standardization:**
  - `feat`: implement **Goal Completion** workflow with automatic multi-wallet transaction recording
  - `feat`: add option to register goal fulfillment as **Expense** or **Income**
  - `feat`: standardize currency symbols to "Bs" (VES), "€" (EUR), and "$" (USD) globally
  - `feat`: integrate goal transactions into multi-language system (EN, ES, PT)
  - `fix`: remove redundant zero-amount goal reaching transactions
  - `ux`: mark completed goals with visual "Done" status and celebration trophy

### v1.0.26

- **Architecture Refactor & Smart Notifications:**
  - `feat`: architectural cleanup moving UI components to a dedicated `views/` directory
  - `feat`: implement **Scheduled Notifications** system with per-payment alert management
  - `feat`: integrate live **historical market data** (BCV/Binance) for USD & EUR
  - `feat`: enhance **Currency Performance** view with inflation shield and volatility spread charts
  - `feat`: implement automatic exchange rate refresh on app foreground/visibility change
  - `feat`: unify multi-language support (EN, ES, PT) for notification and market data
  - `fix`: resolve React hydration errors by standardizing `CurrencyAmount` as phrasing content (span)
  - `fix`: eliminate syntax errors in `TransferView` and `WalletView` after directory restructuring
  - `ux`: redesign Dashboard header for cleaner dual-currency display on small screens

### v1.0.25

- **Reusable Transaction Modals & Logic Robustness:**
  - `feat`: consolidate individual modal views into a unified `TransactionDetailModal`
  - `feat`: implement drawer-style tabbed navigation (Summary/Invoice) for better mobile UX
  - `feat`: add fullscreen Lightbox viewer for transaction receipts with direct download
  - `fix`: resolve `RangeError` (Maximum call stack size exceeded) during encryption of large datasets
  - `fix`: eliminate potential null pointer crashes in the Transaction Detail view
  - `ux`: ensure internal modal state resets correctly when switching between transactions

### v1.0.24

- **Full i18n Localization & UX Polish:**
  - `feat`: fully localize ProfileView, TransferView, BudgetView, and ScheduledPaymentView
  - `feat`: add missing translation keys for Heatmap, Goals, and Recurring Payments
  - `feat`: implement locale-aware date formatting (es-ES, pt-BR, en-US) for all transaction lists
  - `fix`: resolve duplicate translation keys and property name collisions in locale files
  - `fix`: remove hardcoded fallback strings for a cleaner, unified i18n system
  - `chore`: bump version to 1.0.24 and update documentation

### v1.0.23

- **Commission Engine & Numeric UX:**
  - `feat`: enhance transfer commissions with support for both fixed and percentage fees
  - `feat`: implement unified custom numeric keypad for all financial inputs with inputMode="none" (prevents native keyboard popup)
  - `feat`: add Currency Converter widget to the Dashboard for instant USD/VES calculation
  - `feat`: add automatic BCV exchange rate update on daily app load
  - `feat`: implement smart category filtering (segregation of income vs. expense categories)
  - `feat`: add smart account auto-selection based on transfer currency
  - `fix`: correct VES to USD conversion calculation logic in transfer preview
  - `ux`: add paste support for all numeric fields and improved focus handling

### v1.0.22

- **Google Drive & Database:**
  - `feat`: add Google Drive backup list and restore UI (experimental/personal use)
  - `fix`: handle Google GSI prompt errors to prevent silent popup failures on Windows
  - `fix`: implement defensive IndexedDB decryption fallback to prevent TransactionInactiveError
  - `chore`: integrate native UI alerts instead of window.alert for Google Drive sync

### v1.0.21

- **Features & Security:**
  - `feat`: add dedicated "Transfer" category with automatic switching in transactions
  - `feat`: implement biometric/fingerprint reveal for masked balances in the Dashboard
  - `feat`: enhance Dashboard PIN modal with biometric support
  - `feat`: synchronize versioning across README, package, and UI

### v1.0.20

- **UI/UX & Theming:**
  - `feat`: enhance UI consistency, theme handling, and disable mobile gestures
  - `feat`: refine scrolling behavior, text selection permissions, and i18n labels
  - `fix`: move dev mode for small screens
  - `feat`: add splash screen and enhance PWA mobile experience
- **Core Logic:**
  - Updated balance masking logic across all views for better privacy consistency.
  - Implemented dynamic mobile status bar coloring based on the active theme.

### v1.0.17

- **Features:**
  - `feat`: implement integrated camera modal and custom capture flow
  - `feat`: implement manual OCR selection and configurable auto-lock delay
  - `feat`: implement smart invoice scanning with native camera capture
  - `feat`: enhance currency switching sync
- **Fixes & Improvements:**
  - `feat`: add PIN auto-lock, enhance widget UI, and fix chart stability
  - `feat`: hide cloud sync behind developer mode

### v1.0.16

- **Widgets & Dashboard:**
  - `feat`: implement dynamic widget reordering (Drag and Drop)
  - `fix`: restore dashboard widget logic and update analysis navigation icon
  - `ui`: premium aesthetic enhancements, content security, and layout optimization

### v1.0.15

- **Visuals:**
  - `feat`: update logo and fix profile view
  - `feat`: change logo style
  - `feat`: update exchange labels to Binance and enhance Calendar Heatmap interactivity
  - `feat`: fix heatmap & inflation shield icon

### v1.0.14

- **Scheduled Payments:**
  - `feat`: fix scheduled payment cycles, enhance wallet sources, and redesign category selection

---

## 🤝 Contributing

Contributions are welcome! If you have ideas for new features or find a bug, please open an issue or submit a PR.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes using Conventional Commits.
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Parity** - _Economy is volatile. Your peace of mind shouldn't be._
