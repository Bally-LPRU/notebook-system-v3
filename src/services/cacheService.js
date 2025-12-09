/**
 * CacheService - ระบบแคชสำหรับข้อมูลอุปกรณ์
 * รองรับการแคชข้อมูลอุปกรณ์, รูปภาพ, ผลการค้นหา, และตัวเลือกกรอง
 */

class CacheService {
  static cache = new Map();
  static imageCache = new Map();
  static searchCache = new Map();
  static categoryCache = new Map();
  
  // Cache timeouts (in milliseconds)
  static CACHE_TIMEOUTS = {
    equipment: 5 * 60 * 1000,      // 5 minutes
    images: 30 * 60 * 1000,        // 30 minutes
    search: 2 * 60 * 1000,         // 2 minutes
    categories: 60 * 60 * 1000,    // 1 hour
    filters: 10 * 60 * 1000        // 10 minutes
  };

  /**
   * Equipment Data Caching
   */
  static getCachedEquipment(equipmentId) {
    const cacheKey = `equipment_${equipmentId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isValidCache(cached, this.CACHE_TIMEOUTS.equipment)) {
      return cached.data;
    }
    
    return null; // Return null if not cached or expired
  }

  static setCachedEquipment(equipmentId, equipment) {
    const cacheKey = `equipment_${equipmentId}`;
    this.cache.set(cacheKey, {
      data: equipment,
      timestamp: Date.now(),
      type: 'equipment'
    });
  }

  static invalidateEquipmentCache(equipmentId) {
    const cacheKey = `equipment_${equipmentId}`;
    this.cache.delete(cacheKey);
    
    // Also invalidate related search results
    this.invalidateSearchCache();
  }

  /**
   * Equipment List Caching
   */
  static getCachedEquipmentList(filters = {}, page = 1) {
    const cacheKey = this.generateListCacheKey(filters, page);
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isValidCache(cached, this.CACHE_TIMEOUTS.equipment)) {
      return cached.data;
    }
    
    return null;
  }

  static setCachedEquipmentList(filters, page, equipmentList) {
    const cacheKey = this.generateListCacheKey(filters, page);
    this.cache.set(cacheKey, {
      data: equipmentList,
      timestamp: Date.now(),
      type: 'equipment_list'
    });
  }

  /**
   * Image Caching
   */
  static getCachedImage(imageUrl, size = 'medium') {
    const cacheKey = `image_${imageUrl}_${size}`;
    const cached = this.imageCache.get(cacheKey);
    
    if (cached && this.isValidCache(cached, this.CACHE_TIMEOUTS.images)) {
      return cached.data;
    }
    
    return null;
  }

  static setCachedImage(imageUrl, size, imageBlob) {
    const cacheKey = `image_${imageUrl}_${size}`;
    this.imageCache.set(cacheKey, {
      data: imageBlob,
      timestamp: Date.now(),
      type: 'image'
    });
  }

  /**
   * Search Results Caching
   */
  static getCachedSearchResults(query, filters = {}) {
    const cacheKey = this.generateSearchCacheKey(query, filters);
    const cached = this.searchCache.get(cacheKey);
    
    if (cached && this.isValidCache(cached, this.CACHE_TIMEOUTS.search)) {
      return cached.data;
    }
    
    return null;
  }

  static setCachedSearchResults(query, filters, results) {
    const cacheKey = this.generateSearchCacheKey(query, filters);
    this.searchCache.set(cacheKey, {
      data: results,
      timestamp: Date.now(),
      type: 'search'
    });
  }

  static invalidateSearchCache() {
    this.searchCache.clear();
  }

  /**
   * Category and Filter Options Caching
   */
  static getCachedCategories() {
    const cached = this.categoryCache.get('categories');
    
    if (cached && this.isValidCache(cached, this.CACHE_TIMEOUTS.categories)) {
      return cached.data;
    }
    
    return null;
  }

  static setCachedCategories(categories) {
    if (categories === null) {
      // If null is passed, delete the cache entry
      this.categoryCache.delete('categories');
      return;
    }
    this.categoryCache.set('categories', {
      data: categories,
      timestamp: Date.now(),
      type: 'categories'
    });
  }

  /**
   * Invalidate all category-related caches
   */
  static invalidateCategoryCache() {
    this.categoryCache.delete('categories');
    // Also clear filter options related to categories
    this.categoryCache.delete('filter_options_categories');
  }

  static getCachedFilterOptions(filterType) {
    const cacheKey = `filter_options_${filterType}`;
    const cached = this.categoryCache.get(cacheKey);
    
    if (cached && this.isValidCache(cached, this.CACHE_TIMEOUTS.filters)) {
      return cached.data;
    }
    
    return null;
  }

  static setCachedFilterOptions(filterType, options) {
    const cacheKey = `filter_options_${filterType}`;
    this.categoryCache.set(cacheKey, {
      data: options,
      timestamp: Date.now(),
      type: 'filter_options'
    });
  }

  /**
   * Cache Management Utilities
   */
  static isValidCache(cached, timeout) {
    return Date.now() - cached.timestamp < timeout;
  }

  static generateListCacheKey(filters, page) {
    const filterString = JSON.stringify(filters);
    return `equipment_list_${btoa(filterString)}_page_${page}`;
  }

  static generateSearchCacheKey(query, filters) {
    const searchString = JSON.stringify({ query, filters });
    return `search_${btoa(searchString)}`;
  }

  /**
   * Cache Statistics and Management
   */
  static getCacheStats() {
    return {
      equipment: this.cache.size,
      images: this.imageCache.size,
      search: this.searchCache.size,
      categories: this.categoryCache.size,
      total: this.cache.size + this.imageCache.size + this.searchCache.size + this.categoryCache.size
    };
  }

  static clearExpiredCache() {
    
    // Clear expired equipment cache
    for (const [key, value] of this.cache.entries()) {
      if (!this.isValidCache(value, this.CACHE_TIMEOUTS.equipment)) {
        this.cache.delete(key);
      }
    }
    
    // Clear expired image cache
    for (const [key, value] of this.imageCache.entries()) {
      if (!this.isValidCache(value, this.CACHE_TIMEOUTS.images)) {
        this.imageCache.delete(key);
      }
    }
    
    // Clear expired search cache
    for (const [key, value] of this.searchCache.entries()) {
      if (!this.isValidCache(value, this.CACHE_TIMEOUTS.search)) {
        this.searchCache.delete(key);
      }
    }
    
    // Clear expired category cache
    for (const [key, value] of this.categoryCache.entries()) {
      const timeout = key.includes('categories') ? 
        this.CACHE_TIMEOUTS.categories : 
        this.CACHE_TIMEOUTS.filters;
        
      if (!this.isValidCache(value, timeout)) {
        this.categoryCache.delete(key);
      }
    }
  }

  static clearAllCache() {
    this.cache.clear();
    this.imageCache.clear();
    this.searchCache.clear();
    this.categoryCache.clear();
  }

  /**
   * Memory Management
   */
  static getMemoryUsage() {
    const calculateSize = (cache) => {
      let size = 0;
      for (const [key, value] of cache.entries()) {
        size += key.length * 2; // Approximate string size
        size += JSON.stringify(value).length * 2;
      }
      return size;
    };

    return {
      equipment: calculateSize(this.cache),
      images: calculateSize(this.imageCache),
      search: calculateSize(this.searchCache),
      categories: calculateSize(this.categoryCache)
    };
  }

  static optimizeMemory() {
    const memoryUsage = this.getMemoryUsage();
    const totalMemory = Object.values(memoryUsage).reduce((sum, size) => sum + size, 0);
    
    // If memory usage exceeds 10MB, clear expired cache
    if (totalMemory > 10 * 1024 * 1024) {
      this.clearExpiredCache();
    }
    
    // If still high, clear search cache (most volatile)
    if (totalMemory > 15 * 1024 * 1024) {
      this.searchCache.clear();
    }
  }
}

// Auto cleanup every 5 minutes
setInterval(() => {
  CacheService.clearExpiredCache();
  CacheService.optimizeMemory();
}, 5 * 60 * 1000);

export default CacheService;