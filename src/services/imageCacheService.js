/**
 * ImageCacheService - ระบบแคชและ lazy loading สำหรับรูปภาพ
 * รองรับการโหลดรูปภาพแบบ progressive และการจัดการ cache
 */

import CacheService from './cacheService';

class ImageCacheService {
  static loadingImages = new Set();
  static imageObserver = null;
  static preloadQueue = [];
  static maxConcurrentLoads = 3;
  static currentLoads = 0;

  /**
   * Initialize Intersection Observer for lazy loading
   */
  static initializeLazyLoading() {
    if (this.imageObserver) return;

    this.imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            this.loadImage(img);
            this.imageObserver.unobserve(img);
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01
      }
    );
  }

  /**
   * Setup lazy loading for an image element
   */
  static setupLazyLoading(imgElement, src, size = 'medium') {
    if (!this.imageObserver) {
      this.initializeLazyLoading();
    }

    // Store original src and size in data attributes
    imgElement.dataset.src = src;
    imgElement.dataset.size = size;
    imgElement.dataset.loading = 'lazy';

    // Add loading placeholder
    imgElement.src = this.generatePlaceholder(size);
    imgElement.classList.add('lazy-image', 'loading');

    // Start observing
    this.imageObserver.observe(imgElement);
  }

  /**
   * Load image with caching
   */
  static async loadImage(imgElement) {
    const src = imgElement.dataset.src;
    const size = imgElement.dataset.size || 'medium';
    
    if (!src || this.loadingImages.has(src)) return;

    try {
      this.loadingImages.add(src);
      imgElement.classList.add('loading');

      // Check cache first
      const cachedImage = CacheService.getCachedImage(src, size);
      if (cachedImage) {
        this.applyImageToElement(imgElement, cachedImage);
        return;
      }

      // Load image
      const imageBlob = await this.fetchImage(src);
      
      // Cache the image
      CacheService.setCachedImage(src, size, imageBlob);
      
      // Apply to element
      this.applyImageToElement(imgElement, imageBlob);

    } catch (error) {
      console.error('Error loading image:', error);
      this.handleImageError(imgElement);
    } finally {
      this.loadingImages.delete(src);
      imgElement.classList.remove('loading');
    }
  }

  /**
   * Fetch image with retry logic
   */
  static async fetchImage(src, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        // Wait for available slot
        await this.waitForLoadSlot();
        this.currentLoads++;

        const response = await fetch(src);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const blob = await response.blob();
        return URL.createObjectURL(blob);

      } catch (error) {
        if (i === retries - 1) throw error;
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      } finally {
        this.currentLoads--;
        this.processPreloadQueue();
      }
    }
  }

  /**
   * Wait for available loading slot
   */
  static async waitForLoadSlot() {
    while (this.currentLoads >= this.maxConcurrentLoads) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Apply loaded image to element
   */
  static applyImageToElement(imgElement, imageSrc) {
    const img = new Image();
    img.onload = () => {
      imgElement.src = imageSrc;
      imgElement.classList.remove('loading');
      imgElement.classList.add('loaded');
      
      // Trigger fade-in animation
      requestAnimationFrame(() => {
        imgElement.style.opacity = '1';
      });
    };
    img.src = imageSrc;
  }

  /**
   * Handle image loading error
   */
  static handleImageError(imgElement) {
    imgElement.src = this.generateErrorPlaceholder();
    imgElement.classList.add('error');
    imgElement.alt = 'ไม่สามารถโหลดรูปภาพได้';
  }

  /**
   * Generate placeholder image
   */
  static generatePlaceholder(size = 'medium') {
    const dimensions = this.getSizeDimensions(size);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    
    // Create gradient placeholder
    const gradient = ctx.createLinearGradient(0, 0, dimensions.width, dimensions.height);
    gradient.addColorStop(0, '#f3f4f6');
    gradient.addColorStop(1, '#e5e7eb');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    
    // Add loading icon
    ctx.fillStyle = '#9ca3af';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('📷', dimensions.width / 2, dimensions.height / 2 + 8);
    
    return canvas.toDataURL();
  }

  /**
   * Generate error placeholder
   */
  static generateErrorPlaceholder() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 300;
    canvas.height = 200;
    
    ctx.fillStyle = '#fef2f2';
    ctx.fillRect(0, 0, 300, 200);
    
    ctx.fillStyle = '#ef4444';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('❌ ไม่สามารถโหลดรูปภาพได้', 150, 100);
    
    return canvas.toDataURL();
  }

  /**
   * Get dimensions for different sizes
   */
  static getSizeDimensions(size) {
    const dimensions = {
      thumbnail: { width: 150, height: 100 },
      medium: { width: 300, height: 200 },
      large: { width: 600, height: 400 }
    };
    
    return dimensions[size] || dimensions.medium;
  }

  /**
   * Preload images
   */
  static preloadImages(imageSrcs, size = 'medium', priority = 'normal') {
    imageSrcs.forEach(src => {
      if (!CacheService.getCachedImage(src, size)) {
        this.preloadQueue.push({ src, size, priority });
      }
    });
    
    this.processPreloadQueue();
  }

  /**
   * Process preload queue
   */
  static processPreloadQueue() {
    if (this.currentLoads >= this.maxConcurrentLoads || this.preloadQueue.length === 0) {
      return;
    }

    // Sort by priority
    this.preloadQueue.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    const item = this.preloadQueue.shift();
    if (item) {
      this.fetchImage(item.src).then(imageBlob => {
        CacheService.setCachedImage(item.src, item.size, imageBlob);
      }).catch(error => {
        console.warn('Preload failed:', error);
      });
    }
  }

  /**
   * Progressive image loading
   */
  static setupProgressiveLoading(imgElement, imageSizes) {
    const { thumbnail, medium, large } = imageSizes;
    
    // Start with thumbnail
    if (thumbnail) {
      this.setupLazyLoading(imgElement, thumbnail, 'thumbnail');
      
      // Upgrade to medium when in viewport
      const upgradeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && medium) {
            setTimeout(() => {
              this.upgradeImage(imgElement, medium, 'medium');
            }, 500);
            upgradeObserver.unobserve(imgElement);
          }
        });
      });
      
      upgradeObserver.observe(imgElement);
    } else if (medium) {
      this.setupLazyLoading(imgElement, medium, 'medium');
    }
  }

  /**
   * Upgrade image to higher resolution
   */
  static async upgradeImage(imgElement, newSrc, newSize) {
    try {
      const cachedImage = CacheService.getCachedImage(newSrc, newSize);
      if (cachedImage) {
        this.applyImageToElement(imgElement, cachedImage);
        return;
      }

      const imageBlob = await this.fetchImage(newSrc);
      CacheService.setCachedImage(newSrc, newSize, imageBlob);
      this.applyImageToElement(imgElement, imageBlob);
      
    } catch (error) {
      console.warn('Image upgrade failed:', error);
    }
  }

  /**
   * Cleanup and memory management
   */
  static cleanup() {
    if (this.imageObserver) {
      this.imageObserver.disconnect();
      this.imageObserver = null;
    }
    
    this.loadingImages.clear();
    this.preloadQueue = [];
  }

  /**
   * Get loading statistics
   */
  static getStats() {
    return {
      currentLoads: this.currentLoads,
      queueLength: this.preloadQueue.length,
      loadingImages: this.loadingImages.size,
      cacheStats: CacheService.getCacheStats()
    };
  }
}

export default ImageCacheService;