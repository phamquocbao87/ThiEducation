import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import LandingApp from './LandingApp.jsx';
import { enforceCanonicalDomain } from './core/config/siteConfig';

// Ép chuyển hướng 0ms sang https://lakeducation.edu.vn nếu truy cập từ *.web.app
enforceCanonicalDomain();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LandingApp />
  </StrictMode>
);

