import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { serverTimestamp } from 'firebase/firestore';

/**
 * ImageService - Service for handling image upload, processing, and management
 * Supports multiple images per equipment with compression and thumbnail generation
 */
class ImageService {
  // Supported image types
  static SUPPORTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  // Size limits (in bytes)
  static MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  static MAX_IMAGES_PER_EQUIPMENT = 10;
  
  // Image dimensions
  static THUMBNAIL_SIZE = 150;
  static MEDIUM_SIZE = 800;
  static MAX_ORIGINAL_SIZE = 1920;
  
  // Compression quality
  static COMPRESSION_QUALITY = 0.8;
  static THUMBNAIL_QUALITY = 0.7;

  /**
   * Validate image file
   * @param {File} file - Image file to validate
   * @throws {Error} If validation fails
   */
  static validateImage(file) {
    if (!file) {
      throw new Error('ไม่พบไฟล์รูปภาพ');
    }

    // Check file type
    if (!this.SUPPORTED_TYPES.includes(file.type)) {
      throw new Error(`ประเภทไฟล์ไม่รองรับ รองรับเฉพาะ: ${this.SUPPORTED_TYPES.join(', ')}`);
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      const maxSizeMB = this.MAX_FILE_SIZE / (1024 * 1024);
      throw new Error(`ขนาดไฟล์เกิน ${maxSizeMB}MB`);
    }

    return true;
  }

  /**
   * Validate multiple images
   * @param {File[]} files - Array of image files
   * @throws {Error} If validation fails
   */
  static validateImages(files) {
    if (!Array.isArray(files)) {
      throw new Error('ข้อมูลรูปภาพไม่ถูกต้อง');
    }

    if (files.length > this.MAX_IMAGES_PER_EQUIPMENT) {
      throw new Error(`สามารถอัปโหลดได้สูงสุด ${this.MAX_IMAGES_PER_EQUIPMENT} รูป`);
    }

    // Validate each file
    files.forEach((file, index) => {
      try {
        this.validateImage(file);
      } catch (error) {
        throw new Error(`รูปที่ ${index + 1}: ${error.message}`);
      }
    });

    return true;
  }

  /**
   * Generate unique image ID
   * @returns {string} Unique image ID
   */
  static generateImageId() {
    return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create canvas element for image processing
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @returns {Object} Canvas and context
   */
  static createCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // Set high quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    return { canvas, ctx };
  }

  /**
   * Load image from file
   * @param {File} file - Image file
   * @returns {Promise<HTMLImageElement>} Loaded image
   */
  static loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('ไม่สามารถโหลดรูปภาพได้'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Calculate resize dimensions maintaining aspect ratio
   * @param {number} originalWidth - Original width
   * @param {number} originalHeight - Original height
   * @param {number} maxSize - Maximum size (width or height)
   * @returns {Object} New dimensions
   */
  static calculateResizeDimensions(originalWidth, originalHeight, maxSize) {
    if (originalWidth <= maxSize && originalHeight <= maxSize) {
      return { width: originalWidth, height: originalHeight };
    }

    const aspectRatio = originalWidth / originalHeight;
    
    if (originalWidth > originalHeight) {
      return {
        width: maxSize,
        height: Math.round(maxSize / aspectRatio)
      };
    } else {
      return {
        width: Math.round(maxSize * aspectRatio),
        height: maxSize
      };
    }
  }

  /**
   * Resize and compress image
   * @param {File} file - Original image file
   * @param {number} maxSize - Maximum dimension
   * @param {number} quality - Compression quality (0-1)
   * @returns {Promise<Blob>} Processed image blob
   */
  static async resizeAndCompressImage(file, maxSize, quality = this.COMPRESSION_QUALITY) {
    const img = await this.loadImage(file);
    const { width, height } = this.calculateResizeDimensions(img.width, img.height, maxSize);
    
    const { canvas, ctx } = this.createCanvas(width, height);
    
    // Draw resized image
    ctx.drawImage(img, 0, 0, width, height);
    
    // Convert to blob with compression
    return new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', quality);
    });
  }

  /**
   * Generate thumbnail from image
   * @param {File} file - Original image file
   * @returns {Promise<Blob>} Thumbnail blob
   */
  static async generateThumbnail(file) {
    return this.resizeAndCompressImage(file, this.THUMBNAIL_SIZE, this.THUMBNAIL_QUALITY);
  }

  /**
   * Generate medium size image
   * @param {File} file - Original image file
   * @returns {Promise<Blob>} Medium size image blob
   */
  static async generateMediumSize(file) {
    return this.resizeAndCompressImage(file, this.MEDIUM_SIZE, this.COMPRESSION_QUALITY);
  }

  /**
   * Optimize original image
   * @param {File} file - Original image file
   * @returns {Promise<Blob>} Optimized image blob
   */
  static async optimizeOriginalImage(file) {
    // If image is already small enough, just compress
    const img = await this.loadImage(file);
    if (img.width <= this.MAX_ORIGINAL_SIZE && img.height <= this.MAX_ORIGINAL_SIZE) {
      return this.resizeAndCompressImage(file, Math.max(img.width, img.height), this.COMPRESSION_QUALITY);
    }
    
    // Resize if too large
    return this.resizeAndCompressImage(file, this.MAX_ORIGINAL_SIZE, this.COMPRESSION_QUALITY);
  }

  /**
   * Upload blob to Firebase Storage
   * @param {Blob} blob - Image blob to upload
   * @param {string} path - Storage path
   * @returns {Promise<string>} Download URL
   */
  static async uploadToStorage(blob, path) {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, blob);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error('Storage upload error:', error);
      throw new Error('ไม่สามารถอัปโหลดรูปภาพได้');
    }
  }

  /**
   * Delete file from Firebase Storage
   * @param {string} path - Storage path
   */
  static async deleteFromStorage(path) {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      // Ignore if file doesn't exist
      if (error.code !== 'storage/object-not-found') {
        console.error('Storage delete error:', error);
        throw new Error('ไม่สามารถลบรูปภาพได้');
      }
    }
  }

  /**
   * Upload single image with processing
   * @param {File} file - Image file
   * @param {string} equipmentId - Equipment ID
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Image metadata
   */
  static async uploadImage(file, equipmentId, onProgress = null) {
    // Validate image
    this.validateImage(file);
    
    // Generate unique image ID
    const imageId = this.generateImageId();
    
    try {
      // Report progress
      if (onProgress) onProgress({ stage: 'processing', progress: 10 });
      
      // Process images in parallel
      const [optimizedOriginal, thumbnail, medium] = await Promise.all([
        this.optimizeOriginalImage(file),
        this.generateThumbnail(file),
        this.generateMediumSize(file)
      ]);
      
      if (onProgress) onProgress({ stage: 'uploading', progress: 50 });
      
      // Upload all sizes in parallel
      const [originalUrl, thumbnailUrl, mediumUrl] = await Promise.all([
        this.uploadToStorage(optimizedOriginal, `equipment-images/${equipmentId}/original/${imageId}.jpg`),
        this.uploadToStorage(thumbnail, `equipment-images/${equipmentId}/thumbnails/${imageId}_thumb.jpg`),
        this.uploadToStorage(medium, `equipment-images/${equipmentId}/medium/${imageId}_medium.jpg`)
      ]);
      
      if (onProgress) onProgress({ stage: 'complete', progress: 100 });
      
      // Return image metadata
      return {
        id: imageId,
        url: originalUrl,
        thumbnailUrl: thumbnailUrl,
        mediumUrl: mediumUrl,
        filename: file.name,
        size: file.size,
        uploadedAt: serverTimestamp()
      };
      
    } catch (error) {
      console.error('Image upload error:', error);
      throw new Error(`ไม่สามารถอัปโหลดรูป ${file.name} ได้: ${error.message}`);
    }
  }

  /**
   * Upload multiple images
   * @param {File[]} files - Array of image files
   * @param {string} equipmentId - Equipment ID
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object[]>} Array of image metadata
   */
  static async uploadImages(files, equipmentId, onProgress = null) {
    // Validate all images first
    this.validateImages(files);
    
    const results = [];
    const totalFiles = files.length;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        const imageMetadata = await this.uploadImage(file, equipmentId, (progress) => {
          if (onProgress) {
            const overallProgress = ((i / totalFiles) * 100) + (progress.progress / totalFiles);
            onProgress({
              stage: progress.stage,
              progress: Math.round(overallProgress),
              currentFile: i + 1,
              totalFiles: totalFiles,
              fileName: file.name
            });
          }
        });
        
        results.push(imageMetadata);
        
      } catch (error) {
        console.error(`Failed to upload image ${file.name}:`, error);
        // Continue with other images, but collect errors
        results.push({
          error: true,
          fileName: file.name,
          message: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Delete image and all its variants
   * @param {string} equipmentId - Equipment ID
   * @param {string} imageId - Image ID
   */
  static async deleteImage(equipmentId, imageId) {
    const paths = [
      `equipment-images/${equipmentId}/original/${imageId}.jpg`,
      `equipment-images/${equipmentId}/thumbnails/${imageId}_thumb.jpg`,
      `equipment-images/${equipmentId}/medium/${imageId}_medium.jpg`
    ];
    
    // Delete all variants in parallel
    await Promise.all(paths.map(path => this.deleteFromStorage(path)));
  }

  /**
   * Delete multiple images
   * @param {string} equipmentId - Equipment ID
   * @param {string[]} imageIds - Array of image IDs
   */
  static async deleteImages(equipmentId, imageIds) {
    await Promise.all(imageIds.map(imageId => this.deleteImage(equipmentId, imageId)));
  }

  /**
   * Delete all images for equipment
   * @param {string} equipmentId - Equipment ID
   * @param {Object[]} images - Array of image metadata
   */
  static async deleteAllEquipmentImages(equipmentId, images) {
    if (!images || images.length === 0) return;
    
    const imageIds = images.map(img => img.id);
    await this.deleteImages(equipmentId, imageIds);
  }

  /**
   * Get image URL by size
   * @param {Object} imageMetadata - Image metadata
   * @param {string} size - Size: 'thumbnail', 'medium', 'original'
   * @returns {string} Image URL
   */
  static getImageUrl(imageMetadata, size = 'medium') {
    if (!imageMetadata) return null;
    
    switch (size) {
      case 'thumbnail':
        return imageMetadata.thumbnailUrl || imageMetadata.url;
      case 'medium':
        return imageMetadata.mediumUrl || imageMetadata.url;
      case 'original':
      default:
        return imageMetadata.url;
    }
  }

  /**
   * Create image preview URL from file
   * @param {File} file - Image file
   * @returns {string} Preview URL
   */
  static createPreviewUrl(file) {
    return URL.createObjectURL(file);
  }

  /**
   * Revoke preview URL to free memory
   * @param {string} url - Preview URL
   */
  static revokePreviewUrl(url) {
    URL.revokeObjectURL(url);
  }
}

export default ImageService;