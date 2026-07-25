import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // es2022 permite top-level await (usado pelo pdf.js). Suportado por navegadores modernos.
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 3000,
  },
  esbuild: {
    target: 'es2022',
  },
  server: {
    host: true,
    port: 5173,
  },
})
