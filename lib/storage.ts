// storage.ts - Handles data persistence with localStorage and future Supabase migration
// Updated to use plain functions instead of a class for better Next.js serialization support

const STORAGE_KEYS = {
  LICENSE: 'licenseKey',
  USER_PREFERENCES: 'userPreferences',
  TASKS: 'tasks',
  IDEAS: 'ideas',
} as const;

export type StorageKey = keyof typeof STORAGE_KEYS;

/**
 * Get a value from localStorage by key
 */
export function getStorage<T>(key: StorageKey): T | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const item = localStorage.getItem(STORAGE_KEYS[key]);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error reading from localStorage: ${error}`);
    return null;
  }
}

/**
 * Set a value in localStorage by key
 */
export function setStorage<T>(key: StorageKey, value: T): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Create a backup before setting new value
    const timestamp = new Date().toISOString();
    const currentValue = localStorage.getItem(STORAGE_KEYS[key]);
    if (currentValue) {
      localStorage.setItem(`${STORAGE_KEYS[key]}_backup_${timestamp}`, currentValue);
    }
    
    localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage: ${error}`);
  }
}

/**
 * Remove a value from localStorage by key
 */
export function removeStorage(key: StorageKey): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEYS[key]);
  } catch (error) {
    console.error(`Error removing from localStorage: ${error}`);
  }
}

/**
 * Clear all app-related values from localStorage
 */
export function clearStorage(): void {
  if (typeof window === 'undefined') return;
  
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error(`Error clearing localStorage: ${error}`);
  }
}

/**
 * Attempt to recover the most recent backup for a given key
 */
export function recoverFromBackup(key: StorageKey): any | null {
  if (typeof window === 'undefined') return null;
  
  try {
    // Find all backup keys for this storage key
    const backupKeys = Object.keys(localStorage)
      .filter(k => k.startsWith(`${STORAGE_KEYS[key]}_backup_`))
      .sort()
      .reverse(); // Most recent first
    
    if (backupKeys.length > 0) {
      // Get the most recent backup
      const latestBackup = localStorage.getItem(backupKeys[0]);
      if (latestBackup) {
        // Restore the backup
        localStorage.setItem(STORAGE_KEYS[key], latestBackup);
        return JSON.parse(latestBackup);
      }
    }
    return null;
  } catch (error) {
    console.error(`Error recovering from backup: ${error}`);
    return null;
  }
}

// Compatibility layer for existing code that uses StorageManager
const StorageManager = {
  get: getStorage,
  set: setStorage,
  remove: removeStorage,
  clear: clearStorage,
  recover: recoverFromBackup,
};

export default StorageManager;
