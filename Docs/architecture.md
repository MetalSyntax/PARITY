# PARITY Architecture & Monorepo Structure

This document outlines the high-level architecture of the PARITY monorepo.

## Monorepo Layout

PARITY is organized as a monorepo managed with `pnpm` workspaces:

```
PARITY/
├── apps/
│   ├── web/                  # Core React 19 + Vite 6 PWA
│   ├── desktop/              # Desktop wrapper/builds
│   ├── mobile/               # Mobile wrapper/builds
│   └── mobile-experimental/  # Experimental mobile builds
├── packages/
│   ├── core/                 # Shared logic, services, types & utilities
│   ├── ui/                   # Shared design system components
│   ├── i18n/                 # Translation modules (EN, ES, PT)
│   └── config/               # Build/tooling configurations
```

## Key Technology Stack

- **Frontend Core:** React 19, TypeScript
- **Bundler & Dev Server:** Vite 6
- **Styling:** Vanilla CSS & CSS Variables with dynamic themes
- **Database:** IndexedDB (via native wrappers)
- **Encryption:** Web Crypto API (AES-GCM + PBKDF2)
- **i18n:** Custom modular Translation utilities

## Entry Points and Execution Flow

1. **Vite Development Server:** Runs from `apps/web` with configuration defined in `vite.config.ts`.
2. **Bootstrap:** `apps/web/index.html` loads `apps/web/index.tsx` which boots the React tree.
3. **Application Core:** `AppContent` inside `apps/web/App.tsx` handles all state, navigation, and storage synchronization.
