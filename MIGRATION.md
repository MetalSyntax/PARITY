# Phase 0 Migration Checklist — Monorepo

## Zero data loss guarantee
- [ ] apps/web builds successfully (`pnpm --filter @parity/web run build`)
- [ ] apps/web dev server starts (`pnpm --filter @parity/web run dev`)
- [ ] All unit tests pass (`pnpm --filter @parity/web run test`)
- [ ] IndexedDB structure unchanged — DB_NAME, DB_VERSION, STORE_NAME, KEYS all preserved in @parity/core
- [ ] Encryption keys unchanged — crypto.ts preserved byte-for-byte in packages/core/src/services/crypto.ts
- [ ] i18n keys intact — all EN/ES/PT translations preserved in @parity/i18n
- [ ] No runtime import errors in browser console

## Environment setup
The `.env` file must be present at `apps/web/.env` for the web app to work.
Copy or symlink from the root: `cp .env apps/web/.env`

## Rollback plan
If the migration breaks, the original monolithic app is preserved in git history.
