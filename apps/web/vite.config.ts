import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Parity Finance',
        short_name: 'Parity',
        description: 'Personal Finance & Budgeting App',
        theme_color: '#050505',
        background_color: '#050505',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Precached app-shell assets already work fully offline (see globPatterns above).
        // These two rules cover the cross-origin network calls the app also makes:
        runtimeCaching: [
          {
            // Exchange rates: prefer a fresh value, but if the connection is slow or drops
            // mid-request, fall back to the last cached response almost immediately instead
            // of hanging — this is what keeps rate conversions working through a sudden
            // disconnect rather than stalling on a dead request.
            urlPattern: /^https:\/\/ve\.dolarapi\.com\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'exchange-rates-cache',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Tesseract.js's WASM engine, worker script and language data are fetched from
            // jsDelivr at runtime (not bundled — see services/invoiceOcrClient.ts). They're
            // versioned/immutable, so once OCR has been used successfully while online,
            // caching them means invoice scanning keeps working offline afterwards too.
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/npm\/tesseract\.js.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'ocr-engine-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: true, type: 'module' }
    })
  ],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@parity/core': path.resolve(__dirname, '../../packages/core/src/index.ts'),
      '@parity/i18n': path.resolve(__dirname, '../../packages/i18n/src/index.ts'),
      '@parity/ui': path.resolve(__dirname, '../../packages/ui/src/index.ts'),
    }
  },
  build: { outDir: 'dist' },
  server: { watch: { usePolling: true }, hmr: true, host: true }
})
