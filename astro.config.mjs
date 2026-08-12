import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import { fileURLToPath, URL } from 'node:url'
import { site } from './src/data/site.ts'

// https://astro.build/config
export default defineConfig({
  site: site.url,

  // Emit about.html / projects/<slug>.html rather than about/index.html, which
  // is what vercel.json's cleanUrls + trailingSlash:false expect.
  build: { format: 'file' },
  trailingSlash: 'never',

  server: { port: 5199, host: true },
  // `astro preview` reuses the server block unless overridden.
  integrations: [react()],

  // Astro is a Vite app, so the previous vite.config.ts moves in here almost
  // verbatim. Tailwind v4 keeps using its own Vite plugin (the deprecated
  // @astrojs/tailwind integration is for v3 only); React comes from the
  // integration above, so @vitejs/plugin-react is no longer added by hand.
  vite: {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    plugins: [
      tailwindcss(),
      // Build-time compression for any imported/bundled assets. The project
      // artwork in public/images is handled beforehand by scripts/prepare-images.mjs
      // (resize ≤ 1920px + convert to AVIF), so we leave public/ alone here to
      // avoid re-encoding those already-optimised AVIFs a second time.
      ViteImageOptimizer({
        avif: { quality: 72 },
        webp: { quality: 80 },
        jpg: { quality: 80 },
        png: { quality: 80 },
        includePublic: false,
        logStats: true,
      }),
    ],
  },
})
