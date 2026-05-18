module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['../..'],
          extensions: [
            '.native.tsx', '.native.ts', '.native.js',
            '.ios.tsx', '.ios.ts', '.ios.js',
            '.android.tsx', '.android.ts', '.android.js',
            '.tsx', '.ts', '.js', '.jsx', '.json',
          ],
          alias: {
            '@parity/core': '../../packages/core/src/index.ts',
            '@parity/i18n': '../../packages/i18n/src/index.ts',
            '@parity/ui': '../../packages/ui/src/index.native.ts',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
