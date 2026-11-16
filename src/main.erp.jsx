import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import ErpApp from './ErpApp.jsx';
import { enforceCanonicalDomain } from './core/config/siteConfig';

// Ép chuyển hướng 0ms sang https://erp.lakeducation.edu.vn nếu truy cập từ *.web.app
enforceCanonicalDomain();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErpApp />
  </StrictMode>
);

