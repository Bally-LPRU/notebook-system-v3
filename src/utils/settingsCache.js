/**
 * Settings Cache Utility
 * Provides in-memory caching for frequently accessed settings
 * Based on admin-settings-system design document
 */

import { SETTINGS_CACHE_CONFIG } from '../types/settings';

/**
 * Cache entry structure
 * @typedef {Object} CacheEntry
 * @property {*} value - Cached value
 * @property {number} timestamp - Cache timestamp
 * @property {number} ttl - Time to live in milliseconds
 */

/**
 * Settings Cache Class
 */
class SettingsCache {
  constructor() {
    this.cache = new Map();
    this.listeners = new Map();
    
    // Set up BroadcastChannel for cross-instance synchronization
    // Only available in browser environments
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel('settings-cache-sync');
      this.channel.onmessage = (event) => {
        this.handleSyncMessage(event.data);
      };
    } else {
      this.channel = null;
    }
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {*|null} Cached value or null if not found/expired
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if cache entry has expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds (default from config)
   * @param {boolean} broadcast - Whether to broadcast to other instances (default true)
   */
  set(key, value, ttl = SETTINGS_CACHE_CONFIG.TTL, broadcast = true) {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });
    
    // Notify listeners of cache update
    this.notifyListeners(key, value);
    
    // Broadcast to other instances
    if (broadcast && this.channel) {
      this.channel.postMessage({
        type: 'set',
        key,
        value,
        ttl,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Invalidate cache entry
   * @param {string} key - Cache key to invalidate
   * @param {boolean} broadcast - Whether to broadcast to other instances (default true)
   */
  invalidate(key, broadcast = true) {
    this.cache.delete(key);
    this.notifyListeners(key, null);
    
    // Broadcast to other instances
    if (broadcast && this.channel) {
      this.channel.postMessage({
        type: 'invalidate',
        key,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Invalidate all cache entries
   * @param {boolean} broadcast - Whether to broadcast to other instances (default true)
   */
  invalidateAll(broadcast = true) {
    const keys = Array.from(this.cache.keys());
    this.cache.clear();
    
    // Notify all listeners
    keys.forEach(key => {
      this.notifyListeners(key, null);
    });
    
    // Broadcast to other instances
    if (broadcast && this.channel) {
      this.channel.postMessage({
        type: 'invalidateAll',
        timestamp: Date.now()
      });
    }
  }

  /**
   * Check if cache has valid entry for key
   * @param {string} key - Cache key
   * @returns {boolean} True if valid cache entry exists
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Get cache size
   * @returns {number} Number of cached entries
   */
  size() {
    return this.cache.size;
  }

  /**
   * Subscribe to cache changes for a specific key
   * @param {string} key - Cache key to watch
   * @param {Function} callback - Callback function (value) => void
   * @returns {Function} Unsubscribe function
   */
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    
    this.listeners.get(key).add(callback);
    
    // Return unsubscribe function
    return () => {
      const keyListeners = this.listeners.get(key);
      if (keyListeners) {
        keyListeners.delete(callback);
        if (keyListeners.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  /**
   * Notify listeners of cache changes
   * @param {string} key - Cache key that changed
   * @param {*} value - New value (null if invalidated)
   * @private
   */
  notifyListeners(key, value) {
    const keyListeners = this.listeners.get(key);
    if (keyListeners) {
      keyListeners.forEach(callback => {
        try {
          callback(value);
        } catch (error) {
          console.error('Error in cache listener:', error);
        }
      });
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;
    
    this.cache.forEach((entry) => {
      if (now - entry.timestamp > entry.ttl) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    });
    
    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      listeners: this.listeners.size
    };
  }

  /**
   * Clean up expired entries
   * @returns {number} Number of entries removed
   */
  cleanup() {
    const now = Date.now();
    let removed = 0;
    
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removed++;
      }
    });
    
    return removed;
  }

  /**
   * Handle sync messages from other instances
   * @param {Object} message - Sync message
   * @private
   */
  handleSyncMessage(message) {
    try {
      switch (message.type) {
        case 'set':
          // Update cache without broadcasting (to avoid infinite loop)
          this.set(message.key, message.value, message.ttl, false);
          break;
        
        case 'invalidate':
          // Invalidate cache without broadcasting
          this.invalidate(message.key, false);
          break;
        
        case 'invalidateAll':
          // Invalidate all without broadcasting
          this.invalidateAll(false);
          break;
        
        default:
          console.warn('Unknown sync message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling sync message:', error);
    }
  }

  /**
   * Close the broadcast channel (cleanup)
   */
  destroy() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
  }
}

// Export singleton instance
export default new SettingsCache();

// Export class for testing
export { SettingsCache };
