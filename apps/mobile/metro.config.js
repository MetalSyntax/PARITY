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

module.exports = config;
