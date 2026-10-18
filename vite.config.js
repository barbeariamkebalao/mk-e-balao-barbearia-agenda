import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Habilita SW em dev para testar o install prompt
      devOptions: { enabled: false },

      // Assets que devem ir para o cache inicial
      includeAssets: [
        'logo-escudo.jpg',
        'logo-semfundo.png',
        'logo-fundo-preto.jpg',
        'maquina.png',
      ],

      manifest: {
        id: '/login',
        name: 'MK e BALÃO Barbearia',
        short_name: 'MK e Balão',
        description: 'Agendamentos e gestão — MK e BALÃO Barbearia, Piraju-SP',
        lang: 'pt-BR',
        theme_color: '#0A0A0A',
        background_color: '#0A0A0A',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/login',
        scope: '/',
        categories: ['business', 'productivity'],
        icons: [
          { src: '/icons/admin-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/admin-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/admin-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          {
            name: 'Minha Agenda',
            short_name: 'Agenda',
            description: 'Ver agendamentos do dia',
            url: '/barbeiro',
            icons: [{ src: '/icons/admin-192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Agendar',
            short_name: 'Agendar',
            description: 'Fazer um agendamento',
            url: '/agendar',
            icons: [{ src: '/icons/admin-192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
      },

      workbox: {
        navigateFallbackDenylist: [/^\/instalar-admin\.html$/],
        // Pré-cacheia assets do build — exclui imagens pesadas de social media
        globPatterns: ['**/*.{js,css,html,ico,svg,woff2}', '*.{png,jpg}', 'icons/*.png', '*.webmanifest'],
        globIgnores: ['social-media/**'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB

        runtimeCaching: [
          {
            // Supabase API — NUNCA cachear: dados precisam ser sempre frescos
            urlPattern: ({ url }) => url.hostname.includes('supabase.co'),
            handler: 'NetworkOnly',
          },
          {
            // Google Fonts CSS — cache por 1 ano
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-css',
              expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Google Fonts woff2 — cache por 1 ano
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-woff2',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Imagens da barbearia — cache por 7 dias
            urlPattern: /\.(jpg|jpeg|png|webp|svg)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: { port: 5173 },
})
