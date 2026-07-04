# AI Skill: Form Validations & Smart UX Input

Creating a low-friction input system for adding transactions or editing budgets is central to the PARITY user experience.

## UX Design Guidelines:
1. **Custom Numeric Keypad:**
   - Use PARITY's custom keypad on touchscreens instead of default mobile keypads to ensure fast entry.
   - Keypad must support operations for rapid sum/subtraction if required.
2. **Auto-Categorization:**
   - Use merchant name mappings (`SMART_CATEGORIES_EN` or localized equivalent maps in `constants.tsx`) to auto-assign categories when a user types the transaction payee.
3. **Form Constraints & Feedback:**
   - Warn users immediately if they enter a transaction amount exceeding their active budget.
   - Use micro-feedback transitions (e.g. slight vibration, pulse colors) for successful actions.
   - Always auto-fill default values like current date, active account, and previous currency option.
