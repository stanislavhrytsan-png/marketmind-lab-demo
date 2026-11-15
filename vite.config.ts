import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// base './' keeps every asset path relative, so the built site works
// unchanged on Vercel, GitHub Pages or from any subfolder.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
  // One bundle of about 760 kB (225 kB compressed) is fine for a demo, so the size hint is raised.
  build: { chunkSizeWarningLimit: 900 },
})
