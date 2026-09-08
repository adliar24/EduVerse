import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

function versionPlugin(buildId: string) {
  return {
    name: 'generate-version-json',
    apply: 'build' as const,
    generateBundle(this: any) {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({
          version: buildId,
          buildTime: new Date().toISOString()
        }, null, 2)
      });
    }
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const buildId = Date.now().toString();

  return {
    plugins: [
      react(), 
      tailwindcss(),
      versionPlugin(buildId),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true
        },
        workbox: {
          skipWaiting: true,
          clientsClaim: true,
          cleanupOutdatedCaches: true,
          // Exclude html from precache to ensure users always receive latest index.html
          globPatterns: [
            '**/*.{js,css,ico,png,svg,webmanifest}'
          ],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api/, /version\.json$/],
          runtimeCaching: [
            {
              urlPattern: /\/models\/.*\.(json|bin)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'face-api-models',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              // Never cache version.json in Service Worker
              urlPattern: /version\.json$/,
              handler: 'NetworkOnly'
            }
          ]
        },
        manifest: {
          name: 'EduVerse - Digitalisasi Pendidikan',
          short_name: 'EduVerse',
          description: 'Platform pendidikan all-in-one: Ujian online, Absensi digital, dan Penilaian terintegrasi untuk guru dan siswa.',
          theme_color: '#1e1b4b',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            {
              src: '/logo.svg',
              sizes: '192x192 512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      '__APP_BUILD_ID__': JSON.stringify(buildId),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      target: 'es2020',
      minify: 'esbuild',
      cssMinify: true,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('recharts')) return 'charts';
              if (id.includes('xlsx')) return 'xlsx';
              if (id.includes('supabase')) return 'supabase';
              if (id.includes('lucide-react')) return 'icons';
              if (id.includes('framer-motion')) return 'motion';
              if (id.includes('react') || id.includes('router')) return 'react';
            }
          }
        }
      }
    },
    esbuild: {
      // Remove console.logs in production to reduce bundle size and protect data
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    }
  };
});
