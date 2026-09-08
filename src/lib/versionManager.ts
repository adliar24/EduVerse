/**
 * EduVerse Version Manager & Smart Cache Invalidator
 * 
 * Automatically detects new deployments via /version.json,
 * clears stale browser caches without requiring manual user action,
 * and refreshes the application safely (protecting ongoing exams).
 */

declare const __APP_BUILD_ID__: string;

const RUNNING_BUILD_ID = typeof __APP_BUILD_ID__ !== 'undefined' ? __APP_BUILD_ID__ : String(Date.now());
const CHECK_INTERVAL_MS = 2 * 60 * 1000; // Check every 2 minutes
const RELOAD_THROTTLE_MS = 15 * 1000; // Throttle reloads to prevent loops

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
  return path.includes('/student/exam') || path.includes('/ujian-siswa');
}

let isUpdating = false;

// Query remote /version.json and trigger update if version mismatch
export async function checkForAppUpdate(): Promise<boolean> {
  if (typeof window === 'undefined' || isUpdating) return false;

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

    if (!remoteVersion || remoteVersion === RUNNING_BUILD_ID) {
      return false;
    }

    console.log(`[EduVerse Version] New deployment detected: ${remoteVersion} (current: ${RUNNING_BUILD_ID})`);

    // Safety guard: do not disrupt active exams
    if (isUserInExam()) {
      console.warn('[EduVerse Version] User is actively taking an exam. Deferring update until exam completion.');
      return false;
    }

    // Check reload throttle to prevent reload loops
    const lastReload = localStorage.getItem('eduverse_last_update_reload');
    const now = Date.now();
    if (lastReload && now - parseInt(lastReload, 10) < RELOAD_THROTTLE_MS) {
      return false;
    }

    isUpdating = true;
    localStorage.setItem('eduverse_last_update_reload', String(now));
    localStorage.setItem('eduverse_build_id', remoteVersion);

    // 1. Clear stale caches
    await clearStaleCaches();

    // 2. Trigger Service Worker update
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

    // 3. Smoothly reload application to load new bundle
    console.log('[EduVerse Version] Reloading application to apply update...');
    window.location.reload();
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
  if (typeof window === 'undefined') return;

  // Run initial check after page has loaded
  window.addEventListener('load', () => {
    // Stagger check slightly after initial render to avoid competing with startup queries
    setTimeout(() => {
      checkForAppUpdate();
    }, 4000);
  });

  // Check whenever user switches back to this tab
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkForAppUpdate();
    }
  });

  // Check whenever window gains focus
  window.addEventListener('focus', () => {
    checkForAppUpdate();
  });

  // Periodic interval check
  setInterval(() => {
    checkForAppUpdate();
  }, CHECK_INTERVAL_MS);
}
