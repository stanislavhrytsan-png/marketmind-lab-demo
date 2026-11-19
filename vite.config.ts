import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// base './' keeps every asset path relative, so the built site works
// unchanged on Vercel, GitHub Pages or from any subfolder.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
  // The screens of the further modules are separate files that load when they are opened (see src/App.tsx).
  // What every screen needs stays in one file. The engine's results alone are about 450 kB of it, so the size hint is raised.
  build: { chunkSizeWarningLimit: 1200 },
})
