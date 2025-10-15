import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // Apunta al puerto correcto del backend
        changeOrigin: true,
        // Se elimina la opción 'rewrite' para que la ruta /api se mantenga
      },
    },
  },
})