/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/sec-api': {
        target: 'https://www.sec.gov',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sec-api/, '/files'),
        headers: {
          'User-Agent': 'OptionsPrototype/1.0 (engineering-laboratory)',
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
