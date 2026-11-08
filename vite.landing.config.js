import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import pkg from './package.json' with { type: 'json' };

const buildId = pkg.buildMeta?.buildId || '2026110801v';

/**
 * Vite Build Configuration cho Site 1: lakeducation.edu.vn (Public Marketing & Ads Landing Page)
 * Kết quả xuất ra: dist/landing/ (Chỉ bundle LandingApp + Form Login, loại bỏ hoàn toàn 5 phân hệ ERP nặng)
 */
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version || '1.2.1'),
    __BUILD_TIME__: JSON.stringify(buildId),
  },
  plugins: [
    react(),
    {
      name: 'html-landing-entry',
      transformIndexHtml: {
        order: 'pre',
        handler(html) {
          return html
            .replace('/src/main.jsx', '/src/main.landing.jsx')
            .replace(
              /<title>.*?<\/title>/,
              '<title>LAK EDUCATION (lakeducation.edu.vn) — McGraw-Hill Wonders ELA (Kindergarten GK – Grade 5)</title>\n    <meta name="description" content="Chương trình phát triển năng lực ngôn ngữ bản ngữ Mỹ (ELA - McGraw-Hill Wonders) dành cho lứa tuổi Mầm non (GK) và Tiểu học (Grades 1–5) tại LAK EDUCATION." />'
            );
        },
      },
    },
  ],
  build: {
    outDir: 'dist/landing',
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
