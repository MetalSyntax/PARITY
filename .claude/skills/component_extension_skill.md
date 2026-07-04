# AI Skill: Core Component Usage & Extensibility

Avoid duplicating UI components. This skill enforces reusing existing elements and extending them properly.

## Reusable Components
- **Location:** Locate shared components under `packages/ui` or `apps/web/components`.
- **Core Elements:** Always use built-in inputs, modal layouts, custom keypad widgets, transaction lists, and budget cards.
- **Extending Functionality:**
  - **Props Extension:** Add optional props to existing components to cover new use cases rather than building a parallel custom version.
  - **Backward Compatibility:** When adding a new prop, assign safe defaults to prevent breaking existing layouts.
  - **Composition over Inheritance:** Compose smaller components (e.g. Card, Tooltip, KeypadButton) inside larger containers to create new screens.
- **Lucide Icons:** Always map new options to existing Lucide configurations in `constants.tsx` rather than importing arbitrary visual assets.
