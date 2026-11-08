import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import pkg from './package.json' with { type: 'json' }

const defaultBuildId = (() => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const y = parts.find((p) => p.type === 'year')?.value || '2026'
  const m = parts.find((p) => p.type === 'month')?.value || '11'
  const d = parts.find((p) => p.type === 'day')?.value || '08'
  return `${y}${m}${d}01v`
})()

const buildId = pkg.buildMeta?.buildId || defaultBuildId

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version || '1.2.1'),
    __BUILD_TIME__: JSON.stringify(buildId),
  },
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/google-upload': {
        target: 'https://www.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/google-upload/, ''),
        secure: true,
      },
    },
  },
})
