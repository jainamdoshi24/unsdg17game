import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // In dev, /api is proxied to :5000. In production, the absolute URL is baked in.
  define: {
    '__API_BASE__': command === 'build'
      ? JSON.stringify('http://localhost:5000/api')
      : JSON.stringify('/api'),
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../',
    emptyOutDir: false,
    assetsDir: 'assets',
  },
}))
