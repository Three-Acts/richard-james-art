import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  server: { port: 5199, strictPort: true, host: true },
  preview: { port: 5199, strictPort: true, host: true },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    react(),
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
  ssgOptions: {
    script: 'async',
    formatting: 'none',
    crittersOptions: false,
    // Render concurrently but keep it gentle on memory for 30+ routes.
    concurrency: 8,
  },
})
