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
        runtimeCaching: []
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
