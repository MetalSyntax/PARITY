/**
 * Mobile-specific Vite build — produces a self-contained bundle that can be served
 * from file:// URIs inside React Native WebView (no CDN dependencies, no type="module").
 *
 * Usage:  pnpm --filter @parity/web build:mobile
 * Output: apps/web/dist-mobile/  →  synced to apps/mobile/assets/www/ via sync-web script
 *
 * PREREQUISITE before activating offline mode in the wrapper:
 * The main index.html currently loads these from CDN and must be self-hosted first:
 *   - Tailwind CSS  →  replace cdn.tailwindcss.com with a PostCSS generated stylesheet
 *   - Google Fonts  →  self-host Inter + JetBrains Mono via fontsource
 *   - Tesseract.js  →  install tesseract.js npm package and import directly
 *   - jsPDF         →  install jspdf npm package and import directly
 *
 * Once those are bundled, switch WEB_URL in apps/mobile/app/index.tsx to the local file URI.
 */

import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Strips type="module" and crossorigin from generated script/link tags so the bundle
// executes as a classic script when loaded via file:// in Android/iOS WebView.
// Required because file:// URIs block CORS for ES module scripts.
function stripModuleTypePlugin(): Plugin {
  return {
    name: 'parity-strip-module-type',
    transformIndexHtml(html: string) {
      return html
        .replace(/<script type="module"/g, '<script')
        .replace(/ crossorigin=""/g, '')
        .replace(/ crossorigin/g, '');
    },
  };
}

export default defineConfig({
  plugins: [react(), stripModuleTypePlugin()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@parity/core': path.resolve(__dirname, '../../packages/core/src/index.ts'),
      '@parity/i18n': path.resolve(__dirname, '../../packages/i18n/src/index.ts'),
      '@parity/ui': path.resolve(__dirname, '../../packages/ui/src/index.ts'),
    },
  },
  build: {
    outDir: 'dist-mobile',
    // Single IIFE bundle — no code splitting, no dynamic imports at the chunk level.
    // Required: file:// cannot load ES module imports; IIFE is a self-contained script.
    rollupOptions: {
      output: {
        format: 'iife',
        // Fixed filenames (no content hash) so require() in Metro can reference them statically.
        entryFileNames: 'assets/app.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
        inlineDynamicImports: true,
      },
    },
  },
  server: {
    watch: { usePolling: true },
    hmr: true,
    host: true,
  },
});
