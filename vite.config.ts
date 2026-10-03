import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Rutas relativas: funciona en cualquier subcarpeta (p. ej. GitHub Pages).
  base: './',
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', 'icon-192.png'],
      manifest: {
        name: 'Alquiler del local',
        short_name: 'Alquiler',
        description: 'Facturas del alquiler del local, IVA y Renta',
        lang: 'es',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#f2f2f7',
        theme_color: '#0f7a68',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,png,svg}'], maximumFileSizeToCacheInBytes: 3_000_000 },
    }),
  ],
  test: { include: ['tests/**/*.test.ts'] },
});
