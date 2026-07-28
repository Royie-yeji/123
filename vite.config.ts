import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    open: false,
    port: 5177,
    strictPort: true,
    host: true,
    allowedHosts: ['royieaiguide', 'localhost', '127.0.0.1', '192.168.10.118'],
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: true,
    port: 3003,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
