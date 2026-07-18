import util from 'node:util'
if (!(util as any).styleText) {
  (util as any).styleText = (_format: any, text: any) => text
}

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/uploads': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    },
    allowedHosts: true
  }
})
