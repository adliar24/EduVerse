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

declare const __APP_BUILD_ID__: string;

// Smart version check & automatic browser cache invalidation
const initSmartCacheManager = async () => {
  if (typeof window === 'undefined') return;

  try {
    const currentBuild = typeof __APP_BUILD_ID__ !== 'undefined' ? __APP_BUILD_ID__ : String(Date.now());
    const savedBuild = localStorage.getItem('eduverse_build_id');

    if (savedBuild && savedBuild !== currentBuild) {
      console.log('[EduVerse] New app update detected! Clearing stale browser caches...');

      // 1. Clear CacheStorage (keep face-api-models to avoid re-downloading heavy AI weights)
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(
          cacheKeys.map(key => {
            if (!key.includes('face-api-models')) {
              return caches.delete(key);
            }
            return Promise.resolve(true);
          })
        );
      }

      // 2. Silently refresh student session from Supabase if student is currently logged in
      const studentSessionStr = localStorage.getItem('student_session');
      if (studentSessionStr) {
        try {
          const session = JSON.parse(studentSessionStr);
          if (session?.id) {
            const { supabase } = await import('./lib/supabase');
            const { data: latestStudent } = await supabase
              .from('students')
              .select('*')
              .eq('id', session.id)
              .maybeSingle();

            if (latestStudent) {
              localStorage.setItem('student_session', JSON.stringify({
                id: latestStudent.id,
                student_code: latestStudent.student_code,
                name: latestStudent.name,
                class_id: latestStudent.class_id,
                school_id: latestStudent.school_id,
                gender: latestStudent.gender
              }));
              window.dispatchEvent(new Event('student_session_change'));
            }
          }
        } catch (err) {
          console.warn('[EduVerse] Student session refresh warning:', err);
        }
      }
    }

    localStorage.setItem('eduverse_build_id', currentBuild);
  } catch (e) {
    console.warn('[EduVerse] Cache manager init error:', e);
  }
};

initSmartCacheManager();

// Handle Vite dynamic import chunk loading errors (e.g., when a new deployment deletes old chunks)
const handleChunkError = (err: any) => {
  const errorMessage = err?.message || err?.reason?.message || '';
  if (errorMessage.includes('Failed to fetch dynamically imported module') || errorMessage.includes('Expected a JavaScript-or-Wasm module script') || errorMessage.includes('Importing a module script failed')) {
    console.warn('[EduVerse] Dynamic chunk import mismatch, auto-clearing cache and refreshing page for update...');
    
    // Clear caches
    if ('caches' in window) {
      caches.keys().then(keys => {
        keys.forEach(k => {
          if (!k.includes('face-api-models')) caches.delete(k);
        });
      });
    }

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

// Safe Service Worker registration without infinite reload loop
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (const reg of registrations) {
        reg.update().catch(() => {});
      }
    }).catch(() => {});
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
