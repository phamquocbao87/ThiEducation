import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite Build Configuration cho Site 2: erp.lakeducation.edu.vn (Internal 6-Role ERP Portal)
 * Kết quả xuất ra: dist/erp/ (Chỉ bundle ErpApp nội bộ + meta noindex bảo mật)
 */
export default defineConfig({
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
});
