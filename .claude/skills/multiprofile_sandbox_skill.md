# AI Skill: Multi-Profile & Database Isolation

PARITY supports switching profiles (e.g. Personal vs. Business, Sandbox vs. Real) securely within the same device.

## Security & Isolation Rules:
1. **Never Leak Data Across Profiles:**
   - Always ensure every transaction, budget, goal, or account object is explicitly stamped with the current `profileId`.
   - Before returning transaction logs or reports, filter items: `item.profileId === activeProfileId`.
2. **Profile Creation & Secrets:**
   - Each profile must utilize its own profile options.
   - When switching profiles, completely flush the active view memory state to prevent stale data leaks during screen transitions.
3. **Delete/Purge Compliance:**
   - If a user deletes a profile, ensure all associated records stamped with that profile ID are purged from IndexedDB to clean up space.
