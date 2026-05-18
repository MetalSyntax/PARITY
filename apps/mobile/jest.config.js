module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  moduleNameMapper: {
    '^@parity/core$': '<rootDir>/../../packages/core/src/index.ts',
    '^@parity/i18n$': '<rootDir>/../../packages/i18n/src/index.ts',
    '^@parity/ui$': '<rootDir>/../../packages/ui/src/index.native.ts',
  },
};
