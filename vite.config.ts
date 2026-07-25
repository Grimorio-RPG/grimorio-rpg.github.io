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
  optimizeDeps: {
    // O pdf.js usa top-level await. O pré-bundle do modo dev tem alvo próprio,
    // então precisamos declarar o suporte explicitamente — sem isto o
    // `npm run dev` derruba o servidor ao processar a dependência.
    esbuildOptions: {
      target: 'es2022',
      supported: { 'top-level-await': true },
    },
  },
  server: {
    host: true,
    port: 5173,
  },
})
