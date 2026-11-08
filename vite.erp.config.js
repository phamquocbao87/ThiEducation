import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import pkg from './package.json' with { type: 'json' };

const buildId = pkg.buildMeta?.buildId || '2026110801v';

/**
 * Vite Build Configuration cho Site 2: erp.lakeducation.edu.vn (Internal 6-Role ERP Portal)
 * Kết quả xuất ra: dist/erp/ (Chỉ bundle ErpApp nội bộ + meta noindex bảo mật)
 */
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version || '1.2.1'),
    __BUILD_TIME__: JSON.stringify(buildId),
  },
  plugins: [
    react(),
    {
      name: 'html-erp-entry',
      transformIndexHtml: {
        order: 'pre',
        handler(html) {
          return html
            .replace('/src/main.jsx', '/src/main.erp.jsx')
            .replace(
              /<title>.*?<\/title>/,
              '<title>LAK EDUCATION ERP Portal (erp.lakeducation.edu.vn)</title>\n    <meta name="robots" content="noindex, nofollow" />'
            );
        },
      },
    },
  ],
  build: {
    outDir: 'dist/erp',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/google-upload': {
        target: 'https://www.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/google-upload/, ''),
        secure: true,
      },
    },
  },
});
