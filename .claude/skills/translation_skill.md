# AI Skill: Multi-Language Translation Enforcement

PARITY supports English (`en`), Spanish (`es`), and Portuguese (`pt`). Every user-facing string added to the app must be translated across all three languages.

## Rules for Adding Text:
1. **Never Hardcode User-Facing Text:** Avoid hardcoded strings in `.tsx` files. Always use the translations key system.
2. **Translate to All 3 Languages:** When you add a new string key, you MUST add it to the corresponding files in:
   - `packages/i18n/src/en/`
   - `packages/i18n/src/es/`
   - `packages/i18n/src/pt/`
3. **Keep Keys Consistent:** The structure and keys must match perfectly across `en`, `es`, and `pt`.
4. **Retrieve via Helper:** Call `getTranslation(userProfile.language, 'domain.key')` to read values.
5. **Fallbacks:** The localization engine will fall back to English if the active profile's translation is missing. However, AI tasks must provide all three translations directly.
