# PARITY 💸

**Master the Flux. Two Currencies. One Wallet.**

*(Add screenshots here showing Dark Mode, Privacy Mode, and Budgeting Views)*

## 📋 About The Project

**Parity** is a modern, privacy-focused financial tracker designed for users living in multi-currency economies (specifically tailored for high-inflation environments like Venezuela). It treats dual-currency management (USD & VES) as a first-class citizen, not an afterthought.

Built with a **Local-First** philosophy, Parity stores all your financial data securely in your browser's local storage, ensuring your data never leaves your device without your explicit action.

## ✨ Key Features

### 🚀 Dual-Currency Core
* **Instant Toggle:** Switch your entire Dashboard and transaction history between **USD** and **VES** with a single tap.
* **Dynamic Exchange Rate:** Manage your own exchange rate in real-time via the Settings panel. Visualizations adapt instantly.
* **Smart Transfers:** Move money between accounts of different currencies (e.g., USD Zelle -> VES Bank) with automatic rate calculation.

### 🛡️ Privacy & Security
* **Privacy Mode:** One-click balance masking (`******`) to hide sensitive numbers in public.
* **PIN Protection:** Secure your financial data with a 4-digit PIN.
* **Local Storage:** No external servers. Your data belongs to you.

### 🎨 Personalization
* **Dynamic Theming:** Choose your vibe with built-in themes:
    * **Original:** Clean, professional visuals.
    * **Midnight:** Deep dark mode with neon accents.
    * **Forest:** Calming green and nature-inspired tones.
* **Responsive Design:** A mobile-first experience that feels native on your phone but scales beautifully to desktop.

### 💰 Financial Management
* **Digital Envelopes:** Set monthly spending limits per category (Food, Transport, etc.) and track progress visually.
* **Shared Goals:** Create savings goals (e.g., "Trip to Japan") and track your contributions over time.
* **Recurring Payments:** Never miss a bill with the Scheduled Payments tracker.
* **Analysis:** Interactive charts showing expense structure and balance trends (7-day lookback).

---

## 🛠 Tech Stack

The project is built as a lightweight, performant Single Page Application (SPA).

* **Framework:** [React 18](https://reactjs.org/)
* **Build Tool:** [Vite](https://vitejs.dev/)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Styling:** [TailwindCSS](https://tailwindcss.com/) using CSS Variables for Theming.
* **Icons:** [Lucide React](https://lucide.dev/)
* **State/Persistence:** React Hooks + LocalStorage

---

## ⚙️ Installation & Setup

Parity is a client-side application. You can run it locally in minutes.

### Prerequisites

* Node.js (v16 or higher)
* npm or pnpm

### 1. Clone the repository

```bash
git clone https://github.com/your-username/parity.git
cd parity
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```
The app will open at `http://localhost:5173` (or similar).

---

## 📱 Navigation Structure

1.  **Dashboard:** Your financial command center. View balances, recent transactions, and quick stats.
2.  **Wallet:** Manage your accounts (Cash, Bank, Apps).
3.  **Analysis:** Deep dive into where your money goes with visual charts.
4.  **Profile:** Manage data (Import/Export JSON), language settings, and user details.
5.  **Budgets & Goals:** Dedicated view for Envelope budgeting and Savings tracking.
6.  **Settings:** Configure Exchange Rates, Themes, and Security PIN.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Parity** - *Economy is volatile. Your peace of mind shouldn't be.*