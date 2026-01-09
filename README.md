# PARITY 💸

**Master the Flux. Two Currencies. One Wallet.**

*(Replace with actual banner/screenshot)*

## 📋 About The Project

**Parity** is a next-generation financial tracker designed for the modern economy: digital nomads, freelancers, and users living in high-inflation environments. Unlike traditional wallets that treat multi-currency as an afterthought, Parity is built with a **Dual-Currency Native Core**.

It visualizes, tracks, and analyzes your finances in your Local Currency (e.g., VES, ARS) and a Hard Currency (e.g., USD, EUR) simultaneously, preserving the historical value of your money against exchange rate volatility.

## ✨ Key Features

### 🚀 The "Dual-Core" Experience

* **Simultaneous Display:** Dashboard shows balances in both Base and Local currencies instantly.
* **Historic Rate Preservation:** Transactions lock the exchange rate at the moment of purchase. Changing the rate today does not alter the history of yesterday.
* **Smart Rate Engine:** Choose between API-based rates (Forex), Parallel Market APIs, or a "Manual Control" slider for maximum precision.

### ⚡ Frictionless UX (Input-First)

* **One-Thumb Interaction:** All key actions are reachable with one hand.
* **Custom Smart Keypad:** Built-in calculator and "Quick Currency Toggle" inside the number pad.
* **Natural Language Input:** Type "Dinner $20" and let AI categorize it automatically.
* **4-Second Entry:** Designed to open, log, and close in record time.

### 🎨 Neumorphic / Glassmorphism UI

* **Visual Depth:** Modern interface using blur effects, semitransparent layers, and subtle shadows.
* **OLED Dark Mode:** True black mode for battery saving and eye comfort.
* **Sankey Diagrams:** Flow-based visualization for income vs. expenses (replacing boring pie charts).
* **Haptic Feedback:** Subtle vibrations on key interactions.

### 🌍 Global Ready (i18n)

* **Multi-language Support:** Fully localized (English/Spanish) using `i18next`.
* **Regional Formats:** Adapts decimal separators (`, ` vs `.`) and currency symbols automatically.

---

## 🛠 Tech Stack

This project is built as a Monorepo (Client only).

### Client (Frontend)

* **Framework:** React 18
* **Build Tool:** Vite (for lightning-fast HMR)
* **Language:** TypeScript
* **Styling:** CSS Modules / Styled-components

---

## ⚙️ Installation & Setup

### Prerequisites

* Node.js (v18 or higher)
* npm or yarn

### 1. Clone the repository

```bash
git clone https://github.com/your-username/parity-wallet.git
cd parity-wallet

```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Navigate to client and install
cd client
npm install

# Navigate to server and install
cd ../server
npm install

```

### 3. Run Development Server

```bash
# In the client folder
npm run dev
```

---

## 📱 Screen & UX Architecture

1. **Dashboard:** Split-view balance card with trend indicators.
2. **Add Transaction:** Instant keypad popup with currency toggle (USD/Local).
3. **Rate Control:** Slider UI to adjust the daily exchange rate manually or sync via API.
4. **Insights:** "Money Leaks" analysis and Emotional Spending tracking.

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Parity** - *Economy is volatile. Your peace of mind shouldn't be.*