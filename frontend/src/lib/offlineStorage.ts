// Offline Storage and Sync Queue using IndexedDB for Field Collectors

export interface OfflineOperation {
  id: string;
  operation: 'START_COLLECTION' | 'ARRIVED' | 'VERIFY_MATERIAL' | 'ADD_PHOTO' | 'COLLECTION_COMPLETED';
  assignment_id: string;
  payload: any;
  created_at: string;
  sync_status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'CONFLICT';
  conflict_reason?: string;
}

const DB_NAME = 'ewaste_collector_offline_db';
const DB_VERSION = 1;
const STORE_OPERATIONS = 'sync_queue';
const STORE_CACHE = 'assignments_cache';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_OPERATIONS)) {
        db.createObjectStore(STORE_OPERATIONS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const offlineStorage = {
  async queueOperation(operation: Omit<OfflineOperation, 'id' | 'created_at' | 'sync_status'>): Promise<OfflineOperation> {
    const db = await openDB();
    const entry: OfflineOperation = {
      ...operation,
      id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      sync_status: 'PENDING',
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_OPERATIONS, 'readwrite');
      const store = tx.objectStore(STORE_OPERATIONS);
      const req = store.add(entry);
      req.onsuccess = () => resolve(entry);
      req.onerror = () => reject(req.error);
    });
  },

  async getPendingOperations(): Promise<OfflineOperation[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_OPERATIONS, 'readonly');
      const store = tx.objectStore(STORE_OPERATIONS);
      const req = store.getAll();
      req.onsuccess = () => {
        const ops: OfflineOperation[] = req.result || [];
        resolve(ops.filter((o) => o.sync_status === 'PENDING' || o.sync_status === 'CONFLICT'));
      };
      req.onerror = () => reject(req.error);
    });
  },

  async updateOperationStatus(id: string, status: OfflineOperation['sync_status'], conflictReason?: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_OPERATIONS, 'readwrite');
      const store = tx.objectStore(STORE_OPERATIONS);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const item: OfflineOperation = getReq.result;
        if (item) {
          item.sync_status = status;
          if (conflictReason) item.conflict_reason = conflictReason;
          store.put(item);
        }
        resolve();
      };
      getReq.onerror = () => reject(getReq.error);
    });
  },

  async cacheAssignment(assignment: any): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CACHE, 'readwrite');
      const store = tx.objectStore(STORE_CACHE);
      store.put(assignment);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async getCachedAssignment(id: string): Promise<any | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CACHE, 'readonly');
      const store = tx.objectStore(STORE_CACHE);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  },

  async getCachedAssignments(): Promise<any[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CACHE, 'readonly');
      const store = tx.objectStore(STORE_CACHE);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },
};
