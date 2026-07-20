import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
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
