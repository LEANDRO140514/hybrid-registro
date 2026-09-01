import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'The Hybrid Experience',
        short_name: 'Hybrid',
        description:
          'Vive HYBRID EXPERIENCE del 13 al 15 de noviembre de 2026 en Mérida. Compite en Individual, Dobles o Relay, empieza con ½ Hybrid y Workout Experience, o compra tu acceso como público.',
        lang: 'es-MX',
        start_url: '/',
        display: 'standalone',
        background_color: '#0A0A0A',
        theme_color: '#E6F2B1',
        orientation: 'portrait-primary',
        icons: [
          { src: '/icons/icon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        ],
        categories: ['fitness', 'sports', 'health'],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        // Sin esto el service worker nuevo se queda "esperando" y quien ya
        // visitó el sitio sigue viendo la versión cacheada anterior hasta
        // cerrar todas sus pestañas — en un sitio de venta eso significa
        // mostrar precios/itinerario viejos a gente que ya nos visitó.
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        // El NavigationRoute de workbox responde con index.html a CUALQUIER
        // navegación que no esté en el precache. Sin denylist, abrir en el
        // navegador la URL directa de un asset (p. ej. /og/*.jpg, /robots.txt)
        // devolvía la SPA → su página 404. Los crawlers/bots no pasan por el
        // service worker, así que esto solo afecta a un humano abriendo la URL
        // directa; aun así, que caiga en el archivo real.
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [
          /^\/og\//,
          /^\/icons\//,
          /^\/fonts\//,
          // cualquier ruta cuyo último segmento tenga extensión de archivo
          /\/[^/?]+\.[^/?]+$/,
        ],
      },
    }),
  ],
  server: {
    port: 3000,
    host: true,
  },
})
