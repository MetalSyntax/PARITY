# AI Skill: Financial Calculations & Forecasting Math

PARITY provides insights like runways, month-end projections, and budget pacing. All mathematical formulas must remain accurate and standardized.

## Calculation Principles:
1. **Utility Isolation:**
   - Keep math formulas inside `utils/forecast.ts` or helper modules.
   - Do not write custom regression algorithms inside view renders.
2. **Linear Regression:**
   - Used for computing runway trends and future balances.
   - Always sanitize input data (remove outliers or temporary transfers that would skew the calculations).
3. **Pace Alert Triggers:**
   - Budget alerts should utilize linear projections of current spending rates vs. elapsed days of the active month.
4. **Tax Calculations:**
   - When summarizing taxable transactions, cross-reference transactions tagged with `FiscalTag` (`TAXABLE_INCOME`, `DEDUCTIBLE_EXPENSE`) to calculate the net fiscal footprint.
5. **Precision:**
   - Ensure interest calculations or recurring rate projections handle leap years and custom monthly days properly.
