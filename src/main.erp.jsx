import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import ErpApp from './ErpApp.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErpApp />
  </StrictMode>
);

