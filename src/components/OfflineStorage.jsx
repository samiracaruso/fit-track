// Offline-first storage utilities
const DB_NAME = 'WorkoutPlannerDB';
const DB_VERSION = 1;
const STORES = {
  WORKOUTS: 'workouts',
  SYNC_QUEUE: 'syncQueue',
  EXERCISES: 'exercises'
};

class OfflineStorage {
  constructor() {
    this.db = null;
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingChanges();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores
        if (!db.objectStoreNames.contains(STORES.WORKOUTS)) {
          db.createObjectStore(STORES.WORKOUTS, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { 
            keyPath: 'queueId',
            autoIncrement: true 
          });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.EXERCISES)) {
          db.createObjectStore(STORES.EXERCISES, { keyPath: 'id' });
        }
      };
    });
  }

  // Save workout locally
  async saveWorkoutLocally(workout) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction([STORES.WORKOUTS], 'readwrite');
    const store = transaction.objectStore(STORES.WORKOUTS);
    
    return new Promise((resolve, reject) => {
      const request = store.put({
        ...workout,
        _lastModified: Date.now(),
        _needsSync: !this.isOnline
      });
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get workout from local storage
  async getWorkoutLocally(id) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction([STORES.WORKOUTS], 'readonly');
    const store = transaction.objectStore(STORES.WORKOUTS);
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Add to sync queue
  async addToSyncQueue(action, data) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction([STORES.SYNC_QUEUE], 'readwrite');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);
    
    return new Promise((resolve, reject) => {
      const request = store.add({
        action,
        data,
        timestamp: Date.now(),
        retries: 0
      });
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get all pending sync items
  async getPendingSyncItems() {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction([STORES.SYNC_QUEUE], 'readonly');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Remove from sync queue
  async removeFromSyncQueue(queueId) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction([STORES.SYNC_QUEUE], 'readwrite');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(queueId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Sync pending changes to server
  async syncPendingChanges() {
    if (!this.isOnline || this.syncInProgress) return;
    
    this.syncInProgress = true;
    
    try {
      const pendingItems = await this.getPendingSyncItems();
      
      for (const item of pendingItems) {
        try {
          // Attempt to sync this item
          await this.syncItem(item);
          await this.removeFromSyncQueue(item.queueId);
        } catch (error) {
          console.error('Failed to sync item:', error);
          // Item stays in queue for next sync attempt
        }
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  async syncItem(item) {
    // This will be called with base44 client from the component
    // We can't import base44 here directly
    throw new Error('syncItem must be overridden by component');
  }

  // Cache exercises locally
  async cacheExercises(exercises) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction([STORES.EXERCISES], 'readwrite');
    const store = transaction.objectStore(STORES.EXERCISES);
    
    for (const exercise of exercises) {
      await new Promise((resolve, reject) => {
        const request = store.put(exercise);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  // Get cached exercises
  async getCachedExercises() {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction([STORES.EXERCISES], 'readonly');
    const store = transaction.objectStore(STORES.EXERCISES);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorage();

// Auth persistence utilities
export const persistAuth = (token, user) => {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('auth_user', JSON.stringify(user));
  localStorage.setItem('auth_timestamp', Date.now().toString());
};

export const getPersistedAuth = () => {
  const token = localStorage.getItem('auth_token');
  const userStr = localStorage.getItem('auth_user');
  const timestamp = localStorage.getItem('auth_timestamp');
  
  if (!token || !userStr) return null;
  
  // Check if auth is stale (older than 7 days)
  const age = Date.now() - parseInt(timestamp || '0');
  if (age > 7 * 24 * 60 * 60 * 1000) {
    clearPersistedAuth();
    return null;
  }
  
  return {
    token,
    user: JSON.parse(userStr)
  };
};

export const clearPersistedAuth = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  localStorage.removeItem('auth_timestamp');
};