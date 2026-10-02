/**
 * Storage Persistence Service
 * Ensures browser storage (IndexedDB) is promoted to "persistent" mode
 * so Chrome, Edge, and Safari will NEVER silently clear EduVerse data during storage pressure.
 */

export interface StorageEstimate {
  quota: number;
  usage: number;
  usagePercentage: number;
  persisted: boolean;
}

/**
 * Request persistent storage from the browser
 */
export async function enablePersistentStorage(): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.storage || !navigator.storage.persist) {
    return false;
  }

  try {
    const isAlreadyPersisted = await navigator.storage.persisted();
    if (isAlreadyPersisted) {
      return true;
    }

    const granted = await navigator.storage.persist();
    if (granted) {
      console.log('[StoragePersistence] Browser granted permanent storage status.');
    } else {
      console.warn('[StoragePersistence] Storage persistence request was not granted by browser.');
    }
    return granted;
  } catch (err) {
    console.warn('[StoragePersistence] Error requesting persistence:', err);
    return false;
  }
}

/**
 * Get current storage quota and usage
 */
export async function getStorageEstimate(): Promise<StorageEstimate> {
  const fallback: StorageEstimate = { quota: 0, usage: 0, usagePercentage: 0, persisted: false };
  if (typeof window === 'undefined' || !navigator.storage || !navigator.storage.estimate) {
    return fallback;
  }

  try {
    const estimate = await navigator.storage.estimate();
    const persisted = navigator.storage.persisted ? await navigator.storage.persisted() : false;
    const quota = estimate.quota || 0;
    const usage = estimate.usage || 0;
    const usagePercentage = quota > 0 ? (usage / quota) * 100 : 0;

    return {
      quota,
      usage,
      usagePercentage,
      persisted,
    };
  } catch (err) {
    return fallback;
  }
}
