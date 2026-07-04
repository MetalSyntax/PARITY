# AI Skill: PARITY Agent Guidelines

This document serves as the system rules and context for AI models (like Claude, Gemini, or ChatGPT) working on the PARITY codebase. When assisting with tasks in this repository, always align with the rules, conventions, and architectural decisions outlined below.

---

## 1. Codebase Overview & Philosophy
- **Local-First & Privacy-First:** PARITY is designed to store data locally and securely. No unencrypted user financial data should ever leave the client.
- **Dual-Currency Focus:** Built for multi-currency economies (USD/VES/EUR). All transactions contain local rate histories and normalized values.
- **Monorepo Architecture:**
  - `apps/web`: React 19 + Vite 6 + TypeScript PWA.
  - `packages/core`: Core services, business logic, types, and constants.
  - `packages/ui`: Shared UI components.
  - `packages/i18n`: Internationalization assets.

---

## 2. Core Constraints & Developer Rules

### A. State Management
- **Single Source of Truth:** All application state lives in a single `AppContent` component inside [App.tsx](file:///Users/metalsyntax/Documents/GitHub/PARITY/apps/web/App.tsx).
- **No External State Managers:** Do not introduce Redux, Zustand, Recoil, or MobX.
- **Prop Drilling:** Pass state down via props. Keep components stateless and focused where possible.

### B. Security & Cryptography
- **Encryption at Rest:** All personal and transaction data must be encrypted before saving to disk/storage.
- **Web Crypto API:** Use `AES-GCM` and `PBKDF2` for key derivation and encryption, located in `services/crypto.ts`.
- **Primary Store:** IndexedDB via `services/db.ts` (specifically the `app_data` object store).
- **Fallback:** `localStorage` under the key `parity_data_v3` for legacy encrypted blobs.
- **Plain-text UI Preferences:** Only non-sensitive preferences (e.g., `displayCurrency`, `app_theme`, `isDevMode`) can be saved to `localStorage` without encryption.

### C. Internationalization (i18n)
- **Zero Third-Party i18n Libraries:** Do not install `react-i18next` or similar packages.
- **Modular Translation System:** Translations are loaded from custom JSON/JS files split by domains (e.g., `common`, `views`, `categories`, `alerts`, `fiscal`).
- **Translation Retrieval:** Always use `getTranslation(userProfile.language, key)` for rendering text.

### D. Developer Mode
- **Toggle Mechanism:** Triggered by rapidly clicking the version label 10 times.
- **Developer Features:** Dev mode unlocks Google Drive backup sync UI, parallel exchange rate selectors, and advanced testing views. Never expose these to standard users by default.

---

## 3. UI & Styling Guidelines
- **Tailwind / CSS:** Use the styling approach established in `index.css` and individual component styles.
- **Theming:** Apply themes dynamically using CSS variables defined in `themes.json` and handled by the `useTheme` hook.
- **Icons:** Use `lucide-react` for UI icons.
