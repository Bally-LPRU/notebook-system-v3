// Service Worker Registration and Management
// Handles PWA installation, updates, and offline functionality

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

export function register(config) {
  if ('serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/sw.js`;

      if (isLocalhost) {
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then(() => {
          console.log(
            'This web app is being served cache-first by a service ' +
            'worker. To learn more, visit https://cra.link/PWA'
          );
        });
      } else {
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('✅ Service Worker registered successfully:', registration);
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        
        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log(
                '🔄 New content is available and will be used when all ' +
                'tabs for this page are closed.'
              );
              
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              console.log('📱 Content is cached for offline use.');
              
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        });
      });
      
      // Set up background sync with error handling
      try {
        setupBackgroundSync(registration);
      } catch (error) {
        console.warn('⚠️ Background sync setup failed:', error);
      }
      
      // Set up push notifications with error handling
      try {
        setupPushNotifications(registration);
      } catch (error) {
        console.warn('⚠️ Push notifications setup failed:', error);
      }
      
    })
    .catch((error) => {
      console.error('❌ Error during service worker registration:', error);
      
      // Don't let SW registration failure break the app
      if (config && config.onError) {
        config.onError(error);
      }
    });
}

function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log(
        'No internet connection found. App is running in offline mode.'
      );
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

// Background Sync Setup
function setupBackgroundSync(registration) {
  if ('sync' in window.ServiceWorkerRegistration.prototype) {
    console.log('Background Sync is supported');
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('Back online, triggering sync');
      registration.sync.register('equipment-upload');
      registration.sync.register('image-upload');
    });
    
    window.addEventListener('offline', () => {
      console.log('Gone offline, data will be synced when back online');
    });
  } else {
    console.log('Background Sync is not supported');
  }
}

// Push Notifications Setup
function setupPushNotifications(registration) {
  if ('PushManager' in window) {
    console.log('Push messaging is supported');
    
    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        console.log('Notification permission:', permission);
      });
    }
  } else {
    console.log('Push messaging is not supported');
  }
}

// PWA Installation Utilities
export class PWAInstaller {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.isInstallable = false;
    
    this.init();
  }
  
  init() {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('PWA install prompt available');
      e.preventDefault();
      this.deferredPrompt = e;
      this.isInstallable = true;
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('pwa-installable'));
    });
    
    // Listen for appinstalled event
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.isInstalled = true;
      this.deferredPrompt = null;
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('pwa-installed'));
    });
    
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
    }
  }
  
  async install() {
    if (!this.deferredPrompt) {
      throw new Error('Install prompt not available');
    }
    
    const result = await this.deferredPrompt.prompt();
    console.log('Install prompt result:', result);
    
    this.deferredPrompt = null;
    this.isInstallable = false;
    
    return result;
  }
  
  canInstall() {
    return this.isInstallable && !this.isInstalled;
  }
  
  isAppInstalled() {
    return this.isInstalled;
  }
}

// Offline Data Management
export class OfflineDataManager {
  constructor() {
    this.dbName = 'EquipmentOfflineDB';
    this.dbVersion = 1;
    this.db = null;
    
    this.init();
  }
  
  async init() {
    try {
      this.db = await this.openDB();
      console.log('Offline database initialized');
    } catch (error) {
      console.error('Failed to initialize offline database:', error);
    }
  }
  
  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('pendingUploads')) {
          const store = db.createObjectStore('pendingUploads', { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('cachedEquipment')) {
          const store = db.createObjectStore('cachedEquipment', { keyPath: 'id' });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('status', 'status', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('offlineActions')) {
          const store = db.createObjectStore('offlineActions', { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }
  
  async addPendingUpload(type, data) {
    if (!this.db) await this.init();
    
    const upload = {
      id: Date.now() + Math.random(),
      type,
      data,
      timestamp: Date.now()
    };
    
    const transaction = this.db.transaction(['pendingUploads'], 'readwrite');
    const store = transaction.objectStore('pendingUploads');
    
    return new Promise((resolve, reject) => {
      const request = store.add(upload);
      request.onsuccess = () => resolve(upload.id);
      request.onerror = () => reject(request.error);
    });
  }
  
  async getPendingUploads(type) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['pendingUploads'], 'readonly');
    const store = transaction.objectStore('pendingUploads');
    const index = store.index('type');
    
    return new Promise((resolve, reject) => {
      const request = type ? index.getAll(type) : store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  async removePendingUpload(id) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['pendingUploads'], 'readwrite');
    const store = transaction.objectStore('pendingUploads');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  async cacheEquipment(equipment) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['cachedEquipment'], 'readwrite');
    const store = transaction.objectStore('cachedEquipment');
    
    return new Promise((resolve, reject) => {
      const request = store.put({
        ...equipment,
        cachedAt: Date.now()
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  async getCachedEquipment() {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['cachedEquipment'], 'readonly');
    const store = transaction.objectStore('cachedEquipment');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  async addOfflineAction(type, data) {
    if (!this.db) await this.init();
    
    const action = {
      id: Date.now() + Math.random(),
      type,
      data,
      timestamp: Date.now()
    };
    
    const transaction = this.db.transaction(['offlineActions'], 'readwrite');
    const store = transaction.objectStore('offlineActions');
    
    return new Promise((resolve, reject) => {
      const request = store.add(action);
      request.onsuccess = () => resolve(action.id);
      request.onerror = () => reject(request.error);
    });
  }
  
  async getOfflineActions() {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['offlineActions'], 'readonly');
    const store = transaction.objectStore('offlineActions');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  async clearOfflineActions() {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['offlineActions'], 'readwrite');
    const store = transaction.objectStore('offlineActions');
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Network Status Utilities
export class NetworkStatusManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.callbacks = {
      online: [],
      offline: []
    };
    
    this.init();
  }
  
  init() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.callbacks.online.forEach(callback => callback());
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.callbacks.offline.forEach(callback => callback());
    });
  }
  
  onOnline(callback) {
    this.callbacks.online.push(callback);
  }
  
  onOffline(callback) {
    this.callbacks.offline.push(callback);
  }
  
  getStatus() {
    return this.isOnline;
  }
}

const serviceWorkerUtils = {
  register,
  unregister,
  PWAInstaller,
  OfflineDataManager,
  NetworkStatusManager
};

export default serviceWorkerUtils;