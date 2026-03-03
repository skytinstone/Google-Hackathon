import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), mkcert(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'https://google-hackathon-e1cl.vercel.app',
        changeOrigin: true,
      },
      '/login': {
        target: 'https://google-hackathon-e1cl.vercel.app',
        changeOrigin: true,
      },
    },
  },
})
