import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';

// Polyfill for crypto.randomUUID in non-secure contexts (e.g. testing via local IP address over HTTP)
if (typeof window !== 'undefined') {
  if (!window.crypto) {
    (window as any).crypto = {} as any;
  }
  if (!(window.crypto as any).randomUUID) {
    (window.crypto as any).randomUUID = function () {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };
  }
}

import App from './App.tsx';
import './index.css';

// Handle Vite dynamic import chunk loading errors (e.g., when a new deployment deletes old chunks)
const handleChunkError = (err: any) => {
  const errorMessage = err?.message || err?.reason?.message || '';
  if (errorMessage.includes('Failed to fetch dynamically imported module') || errorMessage.includes('Expected a JavaScript-or-Wasm module script')) {
    console.warn('[EduTest] Dynamic chunk import failed, refreshing page for update...');
    
    // Prevent infinite reload loops
    const lastReload = localStorage.getItem('last_chunk_reload');
    const now = Date.now();
    if (!lastReload || now - parseInt(lastReload) > 10000) {
      localStorage.setItem('last_chunk_reload', String(now));
      window.location.reload();
    }
  }
};

window.addEventListener('error', handleChunkError, true);
window.addEventListener('unhandledrejection', handleChunkError);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
