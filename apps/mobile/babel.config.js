module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['../..'],
          extensions: ['.ios.js', '.android.js', '.js', '.jsx', '.ts', '.tsx', '.json'],
          alias: {
            '@parity/core': '../../packages/core/src/index.ts',
            '@parity/i18n': '../../packages/i18n/src/index.ts',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
