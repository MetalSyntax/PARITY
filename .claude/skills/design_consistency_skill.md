# AI Skill: Design Consistency & Theming

PARITY has a custom, premium visual layout designed to give a native-app feel on web and mobile wrapper formats.

## Styling Rules
- **CSS Variables:** Never use hardcoded HEX or RGB colors in styling files. Always reference the theme variables defined in the dynamic theme engine.
- **Dynamic Theming:** Refer to `themes.json` for styling options (e.g. Original Dark, Midnight Ocean, Forest). All styles must respond smoothly to CSS custom properties dynamically loaded by `useTheme`.
- **Layout Consistency:** Maintain a responsive design suitable for PWAs:
  - Desktop: Sidebar navigation, full width grid dashboards.
  - Mobile: Bottom navigation bar, swipeable widget layouts.
- **Responsive Sizing:** Use flexbox, CSS Grid, and custom aspect ratios instead of fixed dimensions.
- **Micro-Animations:** Buttons, transaction keypad inputs, and modal popups should feature smooth transition animations.
