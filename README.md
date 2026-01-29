# PARITY 💸 `v1.0.18`

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

### v1.0.18

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
