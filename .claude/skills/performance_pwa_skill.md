# AI Skill: Performance & PWA Optimizations

Ensure the PARITY application loads instantly and runs smoothly at 60fps on mobile wrappers and desktop screens.

## Performance Checklist:
1. **Prevent Excessive Re-renders:**
   - Since all state is centralized in `AppContent`, sub-components should use `React.memo` or use dependency arrays in `useMemo` / `useCallback` to prevent unnecessary paint actions.
2. **Dynamic Imports:**
   - Lazy load heavy modules (like complex charting components or calculation engines) to keep the initial JS bundle small.
3. **PWA Assets & Service Worker:**
   - Keep the PWA manifest and service worker configs updated.
   - Cache static assets locally for offline operations.
4. **Database Performance:**
   - Perform bulk read/write operations when importing profiles to avoid locking IndexedDB.
   - Use pagination or lazy loading on long transaction lists.
