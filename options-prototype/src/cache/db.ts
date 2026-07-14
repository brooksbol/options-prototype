/**
 * Shared IndexedDB connection for the cache layer.
 *
 * Single database, single version, both stores created in one upgrade.
 * Prevents version conflicts between durable-cache and crawl-state.
 */

const DB_NAME = "options-prototype-cache";
const DB_VERSION = 2;
export const MARKET_STORE = "market";
export const CRAWL_STORE = "crawl";

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(MARKET_STORE)) {
        const store = db.createObjectStore(MARKET_STORE, { keyPath: "key" });
        store.createIndex("dataType", "dataType", { unique: false });
        store.createIndex("symbol", "symbol", { unique: false });
        store.createIndex("staleUntil", "staleUntil", { unique: false });
      }
      if (!db.objectStoreNames.contains(CRAWL_STORE)) {
        db.createObjectStore(CRAWL_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });
  return dbPromise;
}

/** Reset the DB connection (for testing). */
export function resetDB(): void {
  dbPromise = null;
}
