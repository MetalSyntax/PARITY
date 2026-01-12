# PARITY 💸

**Master the Flux. Two Currencies. One Wallet.**

## 📋 About The Project

**Parity** is a modern, privacy-focused financial tracker designed for users living in multi-currency economies (specifically tailored for high-inflation environments like Venezuela). It treats dual-currency management (USD & VES) as a first-class citizen, not an afterthought.

Built with a **Local-First** philosophy, Parity stores all your financial data securely in your browser's local storage or IndexedDB, ensuring your data never leaves your device without your explicit action.

## ✨ Key Features

### 🚀 Dual-Currency Core
* **Instant Toggle:** Switch your entire Dashboard and transaction history between **USD** and **VES** with a single tap.
* **Live Exchange Rates:** Integration with `DolarAPI` to fetch Official (BCV) and Parallel market rates in real-time. Manual control is also available.
* **Smart Transfers:** Move money between accounts of different currencies (e.g., USD Zelle -> VES Bank) with automatic rate calculation.

### 🛡️ Privacy & Security (Zero-Knowledge)
* **Encryption by Default:** All financial data is encrypted using the **Web Crypto API (AES-GCM)** before being stored. Your data is unreadable without the app's internal security context.
* **Advanced Storage Strategies:** Choose between **LocalStorage** (standard) or **IndexedDB** (high-performance/high-capacity) for storing large datasets.
* **Privacy Mode:** One-click balance masking (`******`) to hide sensitive numbers in public navigation.
* **PIN Protection:** Secure your financial data with a configurable 4-digit PIN.

### 🌍 Multi-Language Support (Modular i18n)
* **Native Localization:** Full support for **English**, **Spanish**, and **Portuguese**.
* **Modular Architecture:** Refactored i18n system for easy maintenance and expansion to new languages.

### 💰 Financial Management & Analysis
* **Interactive Dashboard:** 
    * **Balance History:** Track your net worth trend over the last 7 days.
    * **Category-Visualized structure:** Interactive doughnut charts with robust **Category-to-Color** mapping for instant spending recognition.
* **Digital Envelopes:** Set monthly spending limits per category and track your burning rate visually.
* **Shared Goals:** Create savings goals (e.g., "New Laptop") with progress tracking and celebration cues.
* **Scheduled Payments:** Manage recurring bills (subscriptions, rent) and income schedules.

### 🎨 Premium UX & Accessibility
* **Immersive Interface:** Custom, glassmorphic **Alert & Confirmation** system replaces native browser dialogs for a seamless, high-end application feel.
* **Intelligent Navigation:** A context-aware bottom-nav bar that hides during focused tasks (adding transactions, editing accounts) to maximize screen real estate.
* **Voice Input:** Use Speech-to-Text for quick note-taking during transaction entry.
* **Dynamic Theming:** Choose from **Midnight**, **Forest**, or **Original** themes.

---

## 🛠 Tech Stack

The project is built as a lightweight, performant Single Page Application (SPA) with a focus on local-only processing.

* **Framework:** [React 18](https://reactjs.org/)
* **Security:** [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) (AES-GCM Encryption)
* **Storage:** [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) & LocalStorage
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Styling:** [TailwindCSS](https://tailwindcss.com/) + CSS Variables
* **Icons:** [Lucide React](https://lucide.dev/) & React Icons
* **Charts:** custom SVG-based interactive visualizations.

---

## 📱 Navigation Structure

1.  **Dashboard:** Your financial command center with intelligent spending charts.
2.  **Wallet:** Manage your accounts and active income sources.
3.  **Analysis:** Deep dive into spending structures and trends.
4.  **Transactions:** Searchable and filterable full history.
5.  **Budgets & Goals:** Dedicated view for Envelope budgeting and Savings tracking.
6.  **Profile:** Data management (Encrypted Import/Export), language settings, and storage stats.
7.  **Settings:** Configure Exchange Rates (Live/Manual), Themes, and Security.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes using the Conventional Commits format.
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Parity** - *Economy is volatile. Your peace of mind shouldn't be.*