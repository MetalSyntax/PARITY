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
// This allows Metro to resolve all files in the monorepo, including pnpm's shared node_modules/.pnpm.
config.server = {
  ...config.server,
  unstable_serverRoot: monorepoRoot,
};

// pnpm symlinks pretty-format@30 into .pnpm/node_modules/ which Metro finds first,
// but that version's webpack-wrapped build confuses Metro's CJS interop (default = undefined).
// Force v29 (plain CJS exports) for every requirer regardless of pnpm resolution chain.
const PRETTY_FORMAT_PATH = path.resolve(
  monorepoRoot,
  'node_modules/.pnpm/pretty-format@29.7.0/node_modules/pretty-format/build/index.js'
);
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // If Metro is looking for the main 'index' entry point and it's not found at the server root,
  // redirect it to the project's index.js. This is necessary because unstable_serverRoot
  // is set to the monorepo root.
  if ((moduleName === 'index' || moduleName === './index') && context.originModulePath === undefined) {
    try {
      return context.resolveRequest(context, moduleName, platform);
    } catch (e) {
      return {
        filePath: path.resolve(projectRoot, 'index.js'),
        type: 'sourceFile',
      };
    }
  }

  if (moduleName === 'pretty-format') {
    return { filePath: PRETTY_FORMAT_PATH, type: 'sourceFile' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
