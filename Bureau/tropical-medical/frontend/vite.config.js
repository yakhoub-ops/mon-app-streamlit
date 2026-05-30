import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Tropical',
        short_name: 'Tropical',
        description: 'Plateforme médicale sénégalaise',
        theme_color: '#07f113',
        background_color: '#ffffff',
        orientation: 'portrait',
        display: 'standalone',
        start_url: '/login',
        icons: [
          { src: '/icon.svg',            sizes: 'any',     type: 'image/svg+xml', purpose: 'any maskable' },
          { src: '/icon-192.png',        sizes: '192x192', type: 'image/png',     purpose: 'any' },
          { src: '/icon-512.png',        sizes: '512x512', type: 'image/png',     purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^http:\/\/localhost:4000\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 60, maxAgeSeconds: 300 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: { port: 3000 },
});
