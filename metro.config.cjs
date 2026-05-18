// Root metro.config.js – safety net for when Metro is invoked from the monorepo root.
// Forces projectRoot to apps/mobile/ so `index.js` always resolves correctly.
const path = require('path');

const mobileDir = path.join(__dirname, 'apps', 'mobile');
const monorepoRoot = __dirname;

// Resolve @expo/metro-config from the mobile package context
const { getDefaultConfig } = require(
  require.resolve('@expo/metro-config', { paths: [mobileDir] })
);

const config = getDefaultConfig(mobileDir);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.join(mobileDir, 'node_modules'),
  path.join(monorepoRoot, 'node_modules'),
];
config.resolver.assetExts.push('wasm');
config.resolver.extraNodeModules = {
  react:              path.join(mobileDir, 'node_modules/react'),
  'react-native':     path.join(mobileDir, 'node_modules/react-native'),
  'react-dom':        path.join(mobileDir, 'node_modules/react-dom'),
  'react-native-web': path.join(mobileDir, 'node_modules/react-native-web'),
};

const PRETTY_FORMAT_PATH = path.join(
  monorepoRoot,
  'node_modules/.pnpm/pretty-format@29.7.0/node_modules/pretty-format/build/index.js'
);
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'pretty-format') {
    return { filePath: PRETTY_FORMAT_PATH, type: 'sourceFile' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Same fix as apps/mobile/metro.config.js: override serverRoot back to mobileDir
// so Metro resolves ./index from apps/mobile/ not the monorepo root.
config.server = {
  ...config.server,
  unstable_serverRoot: mobileDir,
};

module.exports = config;
