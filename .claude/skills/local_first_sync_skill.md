# AI Skill: Local-First Storage & Sync Management

PARITY prioritizes working fully offline without server dependency. Understand the storage layer to prevent sync issues.

## Rules:
1. **IndexedDB Operations:**
   - Any database transaction must be executed through helpers in `services/db.ts`.
   - Never write direct IndexedDB queries inside view components.
2. **Offline Mutation Queue:**
   - When offline, modifications must be pushed to a sync queue (`services/sync.ts`).
   - Mutations are executed sequentially when connection status returns to online.
3. **Data Loss Prevention:**
   - When updating state inside React, make sure to queue the persistence backup immediately afterward.
   - Do not block UI rendering while waiting for database writes. Handle database actions asynchronously.
4. **Google Drive Sync Hook:**
   - Use the `useGoogleDriveSync` hook for imports/exports.
   - Verify that Google Drive sync is only initialized or displayed when `isDevMode` is active.
5. **Conflict Resolution:**
   - Implement simple "last-write-wins" resolution based on the transaction `updatedAt` timestamps.
