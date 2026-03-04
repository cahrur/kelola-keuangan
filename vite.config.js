import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      includeAssets: ['logo.png', 'logo-192.png', 'logo.webp', 'logo-192.webp', 'robots.txt'],
      manifest: {
        id: '/',
        name: 'Kelola Keuangan',
        short_name: 'Kelola Keuangan',
        description: 'Aplikasi pengelola keuangan pribadi yang modern dan lengkap',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f4f7f6',
        theme_color: '#3b987b',
        orientation: 'portrait',
        lang: 'id',
        categories: ['finance', 'productivity'],
        icons: [
          {
            src: '/logo-192.webp',
            sizes: '192x192',
            type: 'image/webp',
          },
          {
            src: '/logo-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/logo.webp',
            sizes: '512x512',
            type: 'image/webp',
          },
          {
            src: '/logo.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,webp,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5, // 5 minutes
              },
            },
          },
        ],
      },
    }),
  ],
})
