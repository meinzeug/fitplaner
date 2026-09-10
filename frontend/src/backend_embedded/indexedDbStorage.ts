/**
 * IndexedDB Persistent Database for FitPlaner Standalone / Offline Mode
 * Provides resilient, structured client-side storage directly on the device.
 */

const DB_NAME = 'fitplaner_local_db';
const DB_VERSION = 5;

export const STORES = {
  SETTINGS: 'settings',
  PROFILES: 'profiles',
  PANTRY: 'pantry',
  PLANS: 'weekly_plans',
  SHOPPING_LIST: 'shopping_list',
  CHORES: 'chores',
  CACHE: 'offline_cache',
  OFFERS: 'cached_offers',
  RECIPES: 'recipes',
  CUSTOM_ITEMS: 'custom_items',
  TIMELINE: 'timeline',
  HEALTH: 'health_dossiers',
  PRODUCTS: 'products',
  RECURRING: 'recurring_purchases',
} as const;

type StoreName = typeof STORES[keyof typeof STORES];

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const req = window.indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e: IDBVersionChangeEvent) => {
      const db = (e.target as IDBOpenDBRequest).result;
      Object.values(STORES).forEach((store) => {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store);
        }
      });
    };

    req.onsuccess = (e: Event) => {
      dbInstance = (e.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    req.onerror = (e) => {
      console.warn('[FitPlaner DB] Failed to open IndexedDB:', e);
      reject(e);
    };
  });
}

export async function localDbGet<T>(storeName: StoreName, key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => resolve(fallbackGet<T>(storeName, key));
    });
  } catch {
    return fallbackGet<T>(storeName, key);
  }
}

export async function localDbSet<T>(storeName: StoreName, key: string, value: T): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.put(value, key);
      tx.oncomplete = () => {
        fallbackSet(storeName, key, value);
        resolve();
      };
      tx.onerror = () => {
        fallbackSet(storeName, key, value);
        resolve();
      };
    });
  } catch {
    fallbackSet(storeName, key, value);
  }
}

export async function localDbGetAll<T>(storeName: StoreName): Promise<T[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as T[]) || []);
      req.onerror = () => resolve(fallbackGetAll<T>(storeName));
    });
  } catch {
    return fallbackGetAll<T>(storeName);
  }
}

export async function localDbDelete(storeName: StoreName, key: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.delete(key);
      tx.oncomplete = () => {
        fallbackDelete(storeName, key);
        resolve();
      };
      tx.onerror = () => {
        fallbackDelete(storeName, key);
        resolve();
      };
    });
  } catch {
    fallbackDelete(storeName, key);
  }
}

// ----------------------------------------------------
// Fallback to localStorage (for environments with private browsing or restricted IndexedDB)
// ----------------------------------------------------
function fallbackKey(store: string, key: string): string {
  return `fp_db_${store}_${key}`;
}

function fallbackGet<T>(store: string, key: string): T | null {
  try {
    const raw = localStorage.getItem(fallbackKey(store, key));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function fallbackSet<T>(store: string, key: string, val: T): void {
  try {
    localStorage.setItem(fallbackKey(store, key), JSON.stringify(val));
  } catch {}
}

function fallbackGetAll<T>(store: string): T[] {
  try {
    const prefix = `fp_db_${store}_`;
    const results: T[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) {
        const raw = localStorage.getItem(k);
        if (raw) results.push(JSON.parse(raw));
      }
    }
    return results;
  } catch {
    return [];
  }
}

function fallbackDelete(store: string, key: string): void {
  try {
    localStorage.removeItem(fallbackKey(store, key));
  } catch {}
}
