# AI Skill: Code Quality, Linting & Clean Code

Apply these rules when writing code or running self-reviews to maintain high standards of code sanity.

## Clean Code Principles
- **No Side-Effects in Pure Utilities:** Math utils (e.g. forecasts, rate conversions) must be deterministic and pure functions.
- **Short Components:** If a view exceeds 400 lines of code, break out widgets or layout logic into separate sub-components.
- **Strict Typing:** Avoid `any` in TypeScript. Declare precise types for inputs, return values, and state containers.
- **Comments and Documentation:** Preserve existing comments. Document complex mathematical models (like linear regression) and encryption algorithms.

## Linting & Formatting
- **ESLint & Prettier:** Ensure all files adhere to the project lint rules.
- **Automatic Checking:** Before finalizing code changes, check for linting errors and run formatting matching the workspace configuration (`package.json`).
- **Pruning Unused Code:** Remove unused imports, variables, and dead code before committing changes.
