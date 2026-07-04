# AI Skill: Multi-Currency & Exchange Rate Conversions

Handling multiple volatile currencies (USD, VES, EUR, USDT) is a core aspect of PARITY. Follow these strict mathematical guidelines to prevent financial rounding errors and representation bugs.

## Rules:
1. **Always Store in Original & Normalized Currencies:**
   - Every transaction must store:
     - `amountInOriginalCurrency`: Exact value entered by user.
     - `normalizedAmount`: Value converted to base currency (typically USD).
     - `exchangeRateAtTime`: The rate applied to convert the values.
2. **Avoid Floating Point Imprecision:**
   - Always round monetary amounts to the appropriate decimal places using utility wrappers. Never perform raw division or multiplication in views without rounding.
3. **Formatters Requirement:**
   - Use `formatAmount()` and `formatSecondaryAmount()` from `utils/formatUtils.ts`.
   - Never write ad-hoc template literals for dollar/bolivar/euro formatting.
   - Pass the active profile's selected exchange rate and `RateType` ('OFFICIAL' | 'PARALLEL') to all formatters.
4. **Exchange Rate Fetching:**
   - Fetching must go through the dedicated rates workflow. Always handle network fallback values securely in case external rate APIs are unreachable.
