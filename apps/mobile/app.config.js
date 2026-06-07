// Dynamic Expo config — extends app.json with runtime environment values.
// GOOGLE_CLIENT_ID is provided via EAS Secrets at build time (never committed to source).
// Locally, set it in your shell: GOOGLE_CLIENT_ID=xxx npx expo start
module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  },
});
