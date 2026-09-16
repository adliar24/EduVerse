/**
 * EduVerse Version Manager & Smart Cache Invalidator
 * 
 * Automatically detects new deployments via /version.json in production,
 * clears stale browser caches without requiring manual user action,
 * and refreshes the application safely (protecting ongoing exams).
 */

declare const __APP_BUILD_ID__: string;

const RUNNING_BUILD_ID = typeof __APP_BUILD_ID__ !== 'undefined' ? __APP_BUILD_ID__ : '';
const CHECK_INTERVAL_MS = 2 * 60 * 1000; // Check every 2 minutes in background
const MIN_RELOAD_INTERVAL_MS = 15 * 1000; // 15 seconds debounce to prevent reload loop

// Clean up browser CacheStorage while preserving heavy AI models
export async function clearStaleCaches(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  try {
    const cacheKeys = await window.caches.keys();
    await Promise.all(
      cacheKeys.map(key => {
        // Preserve face-api-models so users don't have to re-download heavy model weights
        if (!key.includes('face-api-models')) {
          return window.caches.delete(key);
        }
        return Promise.resolve(true);
      })
    );
  } catch (err) {
    console.warn('[EduVerse Version] Error clearing stale caches:', err);
  }
}

// Check if user is actively taking an exam
export function isUserInExam(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  return path.includes('/student/exam') || path.includes('/ujian-siswa') || path.includes('/exam/start');
}

let isUpdating = false;

// Query remote /version.json and trigger update if version mismatch
export async function checkForAppUpdate(): Promise<boolean> {
  // Absolutely do not run in local development or if already updating
  if (typeof window === 'undefined' || import.meta.env.DEV || isUpdating) {
    return false;
  }

  // If running build ID is not set, skip
  if (!RUNNING_BUILD_ID || RUNNING_BUILD_ID === 'dev') {
    return false;
  }

  try {
    const response = await fetch(`/version.json?t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) return false;

    const data = await response.json();
    const remoteVersion = data?.version;

    // If versions match or invalid, no update needed
    if (!remoteVersion || remoteVersion === 'dev' || remoteVersion === RUNNING_BUILD_ID) {
      return false;
    }

    // Safety guard: do not disrupt active exams
    if (isUserInExam()) {
      console.warn('[EduVerse Version] User is actively taking an exam. Deferring update until exam completion.');
      return false;
    }

    // Prevent immediate infinite reload loop (within 15 seconds)
    const lastReload = localStorage.getItem('eduverse_last_update_reload');
    const now = Date.now();
    if (lastReload && now - parseInt(lastReload, 10) < MIN_RELOAD_INTERVAL_MS) {
      return false;
    }

    isUpdating = true;
    localStorage.setItem('eduverse_last_update_reload', String(now));
    localStorage.setItem('eduverse_applied_version', remoteVersion);
    localStorage.setItem('eduverse_build_id', remoteVersion);

    console.log(`[EduVerse Version] New deployment detected: ${remoteVersion} (current: ${RUNNING_BUILD_ID}). Auto-refreshing...`);

    // 1. Clear stale caches
    await clearStaleCaches();

    // 2. Trigger Service Worker update in background
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.update().catch(() => {});
        }
      } catch (swErr) {
        console.warn('[EduVerse Version] SW update check warning:', swErr);
      }
    }

    // 3. Reload application cleanly with cache busting query
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('_v', String(now));
    window.location.replace(currentUrl.toString());
    return true;
  } catch (error) {
    console.warn('[EduVerse Version] Failed to check for app update:', error);
    return false;
  } finally {
    isUpdating = false;
  }
}

// Start periodic checker & event listeners
export function initVersionManager(): void {
  // Never run in dev
  if (typeof window === 'undefined' || import.meta.env.DEV) return;

  // Run immediate check as soon as possible
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    checkForAppUpdate();
  } else {
    document.addEventListener('DOMContentLoaded', () => checkForAppUpdate());
    window.addEventListener('load', () => checkForAppUpdate());
  }

  // Also check after 1.5 seconds to catch any slow-loading state
  setTimeout(() => {
    checkForAppUpdate();
  }, 1500);

  // Check when user switches back to this tab / brings app to foreground
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkForAppUpdate();
    }
  });

  // Periodic interval check
  setInterval(() => {
    checkForAppUpdate();
  }, CHECK_INTERVAL_MS);
}
