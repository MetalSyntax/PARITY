const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo so Metro resolves workspace packages
config.watchFolders = [monorepoRoot];

// Look for modules in both the app's node_modules and the workspace root's
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Allow Metro to bundle .wasm files as static assets (required by expo-sqlite web worker)
config.resolver.assetExts.push('wasm');

// Ensure a single copy of React, React Native and web packages (prevent dual-instance issues)
config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  'react-dom': path.resolve(projectRoot, 'node_modules/react-dom'),
  'react-native-web': path.resolve(projectRoot, 'node_modules/react-native-web'),
};

// Expo SDK 54 sets unstable_serverRoot to the pnpm workspace root via resolveWorkspaceRoot().
// Metro then resolves the JS entry file (getJSMainModuleName = "index") relative to serverRoot,
// not projectRoot — so it looks for ./index at the monorepo root instead of apps/mobile/.
// Override serverRoot back to projectRoot so entry resolution stays correct.
config.server = {
  ...config.server,
  unstable_serverRoot: projectRoot,
};

// pnpm symlinks pretty-format@30 into .pnpm/node_modules/ which Metro finds first,
// but that version's webpack-wrapped build confuses Metro's CJS interop (default = undefined).
// Force v29 (plain CJS exports) for every requirer regardless of pnpm resolution chain.
const PRETTY_FORMAT_PATH = path.resolve(
  monorepoRoot,
  'node_modules/.pnpm/pretty-format@29.7.0/node_modules/pretty-format/build/index.js'
);
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'pretty-format') {
    return { filePath: PRETTY_FORMAT_PATH, type: 'sourceFile' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
