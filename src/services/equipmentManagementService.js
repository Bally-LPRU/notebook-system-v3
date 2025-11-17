import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { 
  EQUIPMENT_MANAGEMENT_STATUS,
  EQUIPMENT_MANAGEMENT_PAGINATION,
  IMAGE_CONFIG
} from '../types/equipmentManagement';
import PermissionService from './permissionService';
import ActivityLoggerService from './activityLoggerService';
import CacheService from './cacheService';

class EquipmentManagementService {
  static COLLECTION_NAME = 'equipmentManagement';
  static CATEGORIES_COLLECTION = 'equipmentCategories';
  static HISTORY_COLLECTION = 'equipmentHistory';
  static TEMPLATES_COLLECTION = 'equipmentTemplates';
  static STORAGE_PATH = 'equipment-images';

  /**
   * Create new equipment
   * @param {Object} equipmentData - Equipment data
   * @param {Array<File>} imageFiles - Image files to upload
   * @param {string} createdBy - UID of creator
   * @param {Object} user - User object for permission validation
   * @returns {Promise<Object>} Created equipment with ID
   */
  static async createEquipment(equipmentData, imageFiles = [], createdBy, user = null) {
    try {
      // Validate permissions
      if (user) {
        const permissionCheck = PermissionService.validateEquipmentAccess(user, 'create');
        if (!permissionCheck.allowed) {
          await ActivityLoggerService.logPermissionDenied(
            createdBy, 
            'create_equipment', 
            'equipment', 
            permissionCheck.reason
          );
          throw new Error(permissionCheck.reason);
        }
      }

      // Check if equipment number is unique
      const isUnique = await this.isEquipmentNumberUnique(equipmentData.equipmentNumber);
      if (!isUnique) {
        throw new Error('หมายเลขครุภัณฑ์นี้มีอยู่ในระบบแล้ว');
      }

      // Process images
      const processedImages = await this.processImages(imageFiles, equipmentData.equipmentNumber);

      // Generate search keywords
      const searchKeywords = this.generateSearchKeywords(equipmentData);

      // Prepare equipment data
      const equipment = {
        equipmentNumber: equipmentData.equipmentNumber.trim().toUpperCase(),
        name: equipmentData.name.trim(),
        category: equipmentData.category,
        brand: equipmentData.brand?.trim() || '',
        model: equipmentData.model?.trim() || '',
        description: equipmentData.description?.trim() || '',
        specifications: equipmentData.specifications || {},
        status: equipmentData.status || EQUIPMENT_MANAGEMENT_STATUS.ACTIVE,
        location: equipmentData.location,
        purchaseDate: equipmentData.purchaseDate ? new Date(equipmentData.purchaseDate) : null,
        purchasePrice: equipmentData.purchasePrice || 0,
        vendor: equipmentData.vendor?.trim() || '',
        warrantyExpiry: equipmentData.warrantyExpiry ? new Date(equipmentData.warrantyExpiry) : null,
        responsiblePerson: equipmentData.responsiblePerson || null,
        images: processedImages,
        qrCode: null, // Will be generated later
        tags: equipmentData.tags || [],
        notes: equipmentData.notes?.trim() || '',
        createdAt: serverTimestamp(),
        createdBy,
        updatedAt: serverTimestamp(),
        updatedBy: createdBy,
        version: 1,
        searchKeywords,
        isActive: true,
        viewCount: 0,
        lastViewed: null
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), equipment);
      
      // Log activity with enhanced audit trail
      await ActivityLoggerService.logEquipmentActivity(
        ActivityLoggerService.ACTIVITY_TYPES.EQUIPMENT_CREATED,
        {
          equipmentId: docRef.id,
          equipmentNumber: equipment.equipmentNumber,
          equipmentName: equipment.name,
          reason: 'สร้างอุปกรณ์ใหม่'
        },
        createdBy
      );

      // Update category count
      if (equipment.category?.id) {
        await this.updateCategoryCount(equipment.category.id, 1);
      }

      const createdEquipment = {
        id: docRef.id,
        ...equipment,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Cache the created equipment
      CacheService.setCachedEquipment(docRef.id, createdEquipment);
      
      // Invalidate related caches
      CacheService.invalidateSearchCache();

      return createdEquipment;
    } catch (error) {
      console.error('Error creating equipment:', error);
      throw error;
    }
  }

  /**
   * Update existing equipment
   * @param {string} equipmentId - Equipment ID
   * @param {Object} equipmentData - Updated equipment data
   * @param {Array<File>} newImageFiles - New image files (optional)
   * @param {Array<string>} removeImageIds - Image IDs to remove
   * @param {string} updatedBy - UID of updater
   * @param {Object} user - User object for permission validation
   * @returns {Promise<Object>} Updated equipment
   */
  static async updateEquipment(equipmentId, equipmentData, newImageFiles = [], removeImageIds = [], updatedBy, user = null) {
    try {
      const equipmentRef = doc(db, this.COLLECTION_NAME, equipmentId);
      
      // Get current equipment data
      const currentEquipment = await this.getEquipmentById(equipmentId);
      if (!currentEquipment) {
        throw new Error('ไม่พบอุปกรณ์ที่ต้องการแก้ไข');
      }

      // Validate permissions
      if (user) {
        const permissionCheck = PermissionService.validateEquipmentAccess(user, 'update', currentEquipment);
        if (!permissionCheck.allowed) {
          await ActivityLoggerService.logPermissionDenied(
            updatedBy, 
            'update_equipment', 
            `equipment:${equipmentId}`, 
            permissionCheck.reason
          );
          throw new Error(permissionCheck.reason);
        }
      }

      // Check equipment number uniqueness if changed
      if (equipmentData.equipmentNumber !== currentEquipment.equipmentNumber) {
        const isUnique = await this.isEquipmentNumberUnique(equipmentData.equipmentNumber, equipmentId);
        if (!isUnique) {
          throw new Error('หมายเลขครุภัณฑ์นี้มีอยู่ในระบบแล้ว');
        }
      }

      // Handle image updates
      let updatedImages = [...(currentEquipment.images || [])];
      
      // Remove specified images
      if (removeImageIds.length > 0) {
        const imagesToRemove = updatedImages.filter(img => removeImageIds.includes(img.id));
        await Promise.all(imagesToRemove.map(img => this.deleteImage(img)));
        updatedImages = updatedImages.filter(img => !removeImageIds.includes(img.id));
      }

      // Add new images
      if (newImageFiles.length > 0) {
        const newImages = await this.processImages(newImageFiles, equipmentData.equipmentNumber);
        updatedImages = [...updatedImages, ...newImages];
      }

      // Generate search keywords
      const searchKeywords = this.generateSearchKeywords(equipmentData);

      // Track changes for audit log
      const changes = this.trackChanges(currentEquipment, equipmentData);

      // Prepare update data
      const updateData = {
        equipmentNumber: equipmentData.equipmentNumber.trim().toUpperCase(),
        name: equipmentData.name.trim(),
        category: equipmentData.category,
        brand: equipmentData.brand?.trim() || '',
        model: equipmentData.model?.trim() || '',
        description: equipmentData.description?.trim() || '',
        specifications: equipmentData.specifications || {},
        status: equipmentData.status,
        location: equipmentData.location,
        purchaseDate: equipmentData.purchaseDate ? new Date(equipmentData.purchaseDate) : null,
        purchasePrice: equipmentData.purchasePrice || 0,
        vendor: equipmentData.vendor?.trim() || '',
        warrantyExpiry: equipmentData.warrantyExpiry ? new Date(equipmentData.warrantyExpiry) : null,
        responsiblePerson: equipmentData.responsiblePerson || null,
        images: updatedImages,
        tags: equipmentData.tags || [],
        notes: equipmentData.notes?.trim() || '',
        updatedAt: serverTimestamp(),
        updatedBy,
        version: increment(1),
        searchKeywords
      };

      // Update in Firestore
      await updateDoc(equipmentRef, updateData);
      
      // Log activity with enhanced audit trail
      if (changes.length > 0) {
        await ActivityLoggerService.logEquipmentActivity(
          ActivityLoggerService.ACTIVITY_TYPES.EQUIPMENT_UPDATED,
          {
            equipmentId,
            equipmentNumber: updateData.equipmentNumber,
            equipmentName: updateData.name,
            changes: changes,
            previousValues: changes.reduce((acc, change) => {
              acc[change.field] = change.oldValue;
              return acc;
            }, {}),
            newValues: changes.reduce((acc, change) => {
              acc[change.field] = change.newValue;
              return acc;
            }, {}),
            affectedFields: changes.map(change => change.field),
            reason: 'แก้ไขข้อมูลอุปกรณ์'
          },
          updatedBy
        );
      }

      // Update category counts if category changed
      if (currentEquipment.category?.id !== equipmentData.category?.id) {
        if (currentEquipment.category?.id) {
          await this.updateCategoryCount(currentEquipment.category.id, -1);
        }
        if (equipmentData.category?.id) {
          await this.updateCategoryCount(equipmentData.category.id, 1);
        }
      }

      const updatedEquipment = {
        id: equipmentId,
        ...currentEquipment,
        ...updateData,
        updatedAt: new Date()
      };

      // Update cache
      CacheService.setCachedEquipment(equipmentId, updatedEquipment);
      
      // Invalidate related caches
      CacheService.invalidateSearchCache();

      return updatedEquipment;
    } catch (error) {
      console.error('Error updating equipment:', error);
      throw error;
    }
  }

  /**
   * Delete equipment
   * @param {string} equipmentId - Equipment ID
   * @param {string} deletedBy - UID of deleter
   * @param {Object} user - User object for permission validation
   * @returns {Promise<boolean>} Success status
   */
  static async deleteEquipment(equipmentId, deletedBy, user = null) {
    try {
      const equipment = await this.getEquipmentById(equipmentId);
      if (!equipment) {
        throw new Error('ไม่พบอุปกรณ์ที่ต้องการลบ');
      }

      // Validate permissions
      if (user) {
        const permissionCheck = PermissionService.validateEquipmentAccess(user, 'delete', equipment);
        if (!permissionCheck.allowed) {
          await ActivityLoggerService.logPermissionDenied(
            deletedBy, 
            'delete_equipment', 
            `equipment:${equipmentId}`, 
            permissionCheck.reason
          );
          throw new Error(permissionCheck.reason);
        }
      }

      // Delete all images
      if (equipment.images && equipment.images.length > 0) {
        await Promise.all(equipment.images.map(img => this.deleteImage(img)));
      }

      // Log activity before deletion with enhanced audit trail
      await ActivityLoggerService.logEquipmentActivity(
        ActivityLoggerService.ACTIVITY_TYPES.EQUIPMENT_DELETED,
        {
          equipmentId,
          equipmentNumber: equipment.equipmentNumber,
          equipmentName: equipment.name,
          reason: 'ลบอุปกรณ์ออกจากระบบ'
        },
        deletedBy
      );

      // Delete from Firestore
      const equipmentRef = doc(db, this.COLLECTION_NAME, equipmentId);
      await deleteDoc(equipmentRef);

      // Update category count
      if (equipment.category?.id) {
        await this.updateCategoryCount(equipment.category.id, -1);
      }

      // Invalidate caches
      CacheService.invalidateEquipmentCache(equipmentId);
      CacheService.invalidateSearchCache();
      
      return true;
    } catch (error) {
      console.error('Error deleting equipment:', error);
      throw error;
    }
  }

  /**
   * Get equipment by ID
   * @param {string} equipmentId - Equipment ID
   * @param {string} userId - User ID for audit logging (optional)
   * @param {Object} user - User object for permission validation (optional)
   * @returns {Promise<Object|null>} Equipment data or null
   */
  static async getEquipmentById(equipmentId, userId = null, user = null) {
    try {
      // Check cache first
      const cachedEquipment = CacheService.getCachedEquipment(equipmentId);
      if (cachedEquipment) {
        // Still need to update view count and log activity
        if (userId) {
          const equipmentRef = doc(db, this.COLLECTION_NAME, equipmentId);
          await updateDoc(equipmentRef, {
            viewCount: increment(1),
            lastViewed: serverTimestamp()
          });

          await ActivityLoggerService.logEquipmentActivity(
            ActivityLoggerService.ACTIVITY_TYPES.EQUIPMENT_VIEWED,
            {
              equipmentId,
              equipmentNumber: cachedEquipment.equipmentNumber,
              equipmentName: cachedEquipment.name
            },
            userId
          );
        }
        return cachedEquipment;
      }

      // Validate permissions if user is provided
      if (user) {
        const permissionCheck = PermissionService.validateEquipmentAccess(user, 'view');
        if (!permissionCheck.allowed) {
          if (userId) {
            await ActivityLoggerService.logPermissionDenied(
              userId, 
              'view_equipment', 
              `equipment:${equipmentId}`, 
              permissionCheck.reason
            );
          }
          throw new Error(permissionCheck.reason);
        }
      }

      const equipmentRef = doc(db, this.COLLECTION_NAME, equipmentId);
      const equipmentDoc = await getDoc(equipmentRef);
      
      if (equipmentDoc.exists()) {
        const data = equipmentDoc.data();
        
        // Update view count
        await updateDoc(equipmentRef, {
          viewCount: increment(1),
          lastViewed: serverTimestamp()
        });

        // Log view activity if user is provided
        if (userId) {
          await ActivityLoggerService.logEquipmentActivity(
            ActivityLoggerService.ACTIVITY_TYPES.EQUIPMENT_VIEWED,
            {
              equipmentId,
              equipmentNumber: data.equipmentNumber,
              equipmentName: data.name
            },
            userId
          );
        }

        const equipment = {
          id: equipmentDoc.id,
          ...data,
          // Ensure arrays are always arrays (defensive programming)
          images: Array.isArray(data.images) ? data.images : [],
          tags: Array.isArray(data.tags) ? data.tags : [],
          searchKeywords: Array.isArray(data.searchKeywords) ? data.searchKeywords : [],
          specifications: data.specifications || {},
          location: data.location || {},
          responsiblePerson: data.responsiblePerson || null
        };

        // Cache the equipment
        CacheService.setCachedEquipment(equipmentId, equipment);

        return equipment;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting equipment by ID:', error);
      throw error;
    }
  }

  /**
   * Get equipment list with filters and pagination
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Object>} Equipment list with pagination info
   */
  static async getEquipmentList(filters = {}) {
    try {
      const {
        search = '',
        categories = [],
        statuses = [],
        dateRange = null,
        priceRange = null,
        location = '',
        responsiblePerson = '',
        sortBy = 'updatedAt',
        sortOrder = 'desc',
        page = EQUIPMENT_MANAGEMENT_PAGINATION.DEFAULT_PAGE,
        limit: pageLimit = EQUIPMENT_MANAGEMENT_PAGINATION.DEFAULT_LIMIT,
        lastDoc = null
      } = filters;

      // Ensure limit doesn't exceed maximum and is at least 1
      const itemsLimit = Math.max(1, Math.min(pageLimit, EQUIPMENT_MANAGEMENT_PAGINATION.MAX_LIMIT));
      console.log('📊 Pagination settings:', { page, pageLimit, itemsLimit });

      // Check cache first (only for simple queries without lastDoc)
      if (!lastDoc) {
        const cachedList = CacheService.getCachedEquipmentList(filters, page);
        if (cachedList) {
          return cachedList;
        }
      }

      let equipmentQuery = collection(db, this.COLLECTION_NAME);
      const queryConstraints = [];

      // Add active filter
      queryConstraints.push(where('isActive', '==', true));

      // Add filters
      if (categories.length > 0) {
        queryConstraints.push(where('category.id', 'in', categories));
      }
      
      if (statuses.length > 0) {
        queryConstraints.push(where('status', 'in', statuses));
      }

      if (dateRange) {
        if (dateRange.start) {
          queryConstraints.push(where('purchaseDate', '>=', dateRange.start));
        }
        if (dateRange.end) {
          queryConstraints.push(where('purchaseDate', '<=', dateRange.end));
        }
      }

      if (priceRange) {
        if (priceRange.min !== undefined) {
          queryConstraints.push(where('purchasePrice', '>=', priceRange.min));
        }
        if (priceRange.max !== undefined) {
          queryConstraints.push(where('purchasePrice', '<=', priceRange.max));
        }
      }

      if (location) {
        queryConstraints.push(where('location.building', '==', location));
      }

      if (responsiblePerson) {
        queryConstraints.push(where('responsiblePerson.uid', '==', responsiblePerson));
      }

      // Add search filter using keywords
      if (search && search.length >= 2) {
        const searchKeywords = this.generateSearchKeywords({ name: search });
        queryConstraints.push(where('searchKeywords', 'array-contains-any', searchKeywords));
      }

      // Add sorting (only if no other complex filters to avoid index issues)
      // For simple queries, we can sort. For complex queries, we'll sort in memory
      const hasComplexFilters = categories.length > 0 || statuses.length > 0 || 
                                dateRange || priceRange || location || responsiblePerson || search;
      
      if (!hasComplexFilters) {
        queryConstraints.push(orderBy(sortBy, sortOrder));
      }
      
      // Add pagination
      if (lastDoc) {
        queryConstraints.push(startAfter(lastDoc));
      }
      
      queryConstraints.push(limit(itemsLimit + 1)); // Get one extra to check if there's next page

      // Build query
      equipmentQuery = query(equipmentQuery, ...queryConstraints);
      
      // Execute query
      console.log('🔍 Executing equipment query with constraints:', queryConstraints.length);
      console.log('📊 Items limit:', itemsLimit);
      const querySnapshot = await getDocs(equipmentQuery);
      console.log('📦 Query returned:', querySnapshot.size, 'documents');
      
      const equipment = [];
      let hasNextPage = false;
      let index = 0;
      
      querySnapshot.forEach((doc) => {
        console.log(`📄 Processing doc ${index}:`, doc.id, 'itemsLimit:', itemsLimit);
        if (index < itemsLimit) {
          const data = doc.data();
          console.log('✅ Adding equipment:', data.name);
          
          // Ensure arrays are always arrays (defensive programming)
          equipment.push({
            id: doc.id,
            ...data,
            images: Array.isArray(data.images) ? data.images : [],
            tags: Array.isArray(data.tags) ? data.tags : [],
            searchKeywords: Array.isArray(data.searchKeywords) ? data.searchKeywords : [],
            specifications: data.specifications || {},
            location: data.location || {},
            responsiblePerson: data.responsiblePerson || null
          });
        } else {
          console.log('⏭️  Skipping (hasNextPage)');
          hasNextPage = true;
        }
        index++;
      });

      // Sort in memory if we couldn't sort in query
      if (hasComplexFilters && equipment.length > 0) {
        equipment.sort((a, b) => {
          const aValue = a[sortBy];
          const bValue = b[sortBy];
          
          if (aValue === bValue) return 0;
          if (aValue === null || aValue === undefined) return 1;
          if (bValue === null || bValue === undefined) return -1;
          
          // Handle dates
          if (aValue?.toDate) {
            const comparison = aValue.toDate() - bValue.toDate();
            return sortOrder === 'desc' ? -comparison : comparison;
          }
          
          // Handle other types
          const comparison = aValue < bValue ? -1 : 1;
          return sortOrder === 'desc' ? -comparison : comparison;
        });
      }

      console.log('✅ Processed equipment list:', equipment.length, 'items');

      const result = {
        equipment,
        pagination: {
          currentPage: page,
          hasNextPage,
          totalItems: equipment.length,
          limit: itemsLimit
        },
        lastDoc: equipment.length > 0 ? querySnapshot.docs[Math.min(equipment.length - 1, itemsLimit - 1)] : null
      };

      // Cache the result (only for simple queries without lastDoc)
      if (!lastDoc) {
        CacheService.setCachedEquipmentList(filters, page, result);
      }

      return result;
    } catch (error) {
      console.error('Error getting equipment list:', error);
      throw error;
    }
  }

  /**
   * Check if equipment number is unique
   * @param {string} equipmentNumber - Equipment number to check
   * @param {string} excludeId - Equipment ID to exclude from check (for updates)
   * @returns {Promise<boolean>} True if unique
   */
  static async isEquipmentNumberUnique(equipmentNumber, excludeId = null) {
    try {
      const equipmentRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        equipmentRef, 
        where('equipmentNumber', '==', equipmentNumber.trim().toUpperCase()),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return true;
      }
      
      // If excludeId is provided, check if the found document is the same one being updated
      if (excludeId && querySnapshot.size === 1) {
        const doc = querySnapshot.docs[0];
        return doc.id === excludeId;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking equipment number uniqueness:', error);
      throw error;
    }
  }

  /**
   * Process multiple images
   * @param {Array<File>} imageFiles - Image files to process
   * @param {string} equipmentNumber - Equipment number for naming
   * @returns {Promise<Array>} Processed image objects
   */
  static async processImages(imageFiles, equipmentNumber) {
    try {
      const processedImages = [];
      
      for (const imageFile of imageFiles) {
        const processedImage = await this.processImage(imageFile, equipmentNumber);
        processedImages.push(processedImage);
      }
      
      return processedImages;
    } catch (error) {
      console.error('Error processing images:', error);
      throw error;
    }
  }

  /**
   * Process single image
   * @param {File} imageFile - Image file to process
   * @param {string} equipmentNumber - Equipment number for naming
   * @returns {Promise<Object>} Processed image object
   */
  static async processImage(imageFile, equipmentNumber) {
    try {
      // Validate file
      this.validateImageFile(imageFile);

      const imageId = this.generateImageId();
      const fileExtension = imageFile.name.split('.').pop().toLowerCase();
      
      // Create file names
      const originalFileName = `${equipmentNumber}_${imageId}_original.${fileExtension}`;
      const thumbnailFileName = `${equipmentNumber}_${imageId}_thumb.webp`;
      const mediumFileName = `${equipmentNumber}_${imageId}_medium.webp`;

      // Upload original image
      const originalRef = ref(storage, `${this.STORAGE_PATH}/${equipmentNumber}/original/${originalFileName}`);
      const originalSnapshot = await uploadBytes(originalRef, imageFile);
      const originalUrl = await getDownloadURL(originalSnapshot.ref);

      // Generate and upload thumbnail
      const thumbnailBlob = await this.resizeImage(imageFile, IMAGE_CONFIG.THUMBNAIL_SIZE);
      const thumbnailRef = ref(storage, `${this.STORAGE_PATH}/${equipmentNumber}/thumbnails/${thumbnailFileName}`);
      const thumbnailSnapshot = await uploadBytes(thumbnailRef, thumbnailBlob);
      const thumbnailUrl = await getDownloadURL(thumbnailSnapshot.ref);

      // Generate and upload medium size
      const mediumBlob = await this.resizeImage(imageFile, IMAGE_CONFIG.MEDIUM_SIZE);
      const mediumRef = ref(storage, `${this.STORAGE_PATH}/${equipmentNumber}/medium/${mediumFileName}`);
      const mediumSnapshot = await uploadBytes(mediumRef, mediumBlob);
      const mediumUrl = await getDownloadURL(mediumSnapshot.ref);

      return {
        id: imageId,
        url: originalUrl,
        thumbnailUrl: thumbnailUrl,
        mediumUrl: mediumUrl,
        filename: imageFile.name,
        size: imageFile.size,
        uploadedAt: new Date(),
        uploadedBy: null // Will be set by calling function
      };
    } catch (error) {
      console.error('Error processing image:', error);
      throw error;
    }
  }

  /**
   * Validate image file
   * @param {File} imageFile - Image file to validate
   */
  static validateImageFile(imageFile) {
    // Check file type
    if (!IMAGE_CONFIG.ALLOWED_TYPES.includes(imageFile.type)) {
      throw new Error('รองรับเฉพาะไฟล์รูปภาพ (JPEG, PNG, WebP)');
    }
    
    // Check file size
    if (imageFile.size > IMAGE_CONFIG.MAX_FILE_SIZE) {
      throw new Error('ขนาดไฟล์ต้องไม่เกิน 5MB');
    }
  }

  /**
   * Resize image
   * @param {File} imageFile - Original image file
   * @param {Object} targetSize - Target size {width, height}
   * @returns {Promise<Blob>} Resized image blob
   */
  static async resizeImage(imageFile, targetSize) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate dimensions maintaining aspect ratio
        const { width: targetWidth, height: targetHeight } = targetSize;
        const aspectRatio = img.width / img.height;
        
        let newWidth, newHeight;
        if (aspectRatio > 1) {
          newWidth = Math.min(targetWidth, img.width);
          newHeight = newWidth / aspectRatio;
        } else {
          newHeight = Math.min(targetHeight, img.height);
          newWidth = newHeight * aspectRatio;
        }

        canvas.width = newWidth;
        canvas.height = newHeight;

        // Draw and compress
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        canvas.toBlob(resolve, 'image/webp', IMAGE_CONFIG.COMPRESSION_QUALITY);
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(imageFile);
    });
  }

  /**
   * Delete image from storage
   * @param {Object} imageData - Image data object
   * @returns {Promise<boolean>} Success status
   */
  static async deleteImage(imageData) {
    try {
      const deletePromises = [];

      // Delete original
      if (imageData.url) {
        const originalRef = this.getStorageRefFromUrl(imageData.url);
        if (originalRef) deletePromises.push(deleteObject(originalRef));
      }

      // Delete thumbnail
      if (imageData.thumbnailUrl) {
        const thumbnailRef = this.getStorageRefFromUrl(imageData.thumbnailUrl);
        if (thumbnailRef) deletePromises.push(deleteObject(thumbnailRef));
      }

      // Delete medium
      if (imageData.mediumUrl) {
        const mediumRef = this.getStorageRefFromUrl(imageData.mediumUrl);
        if (mediumRef) deletePromises.push(deleteObject(mediumRef));
      }

      await Promise.all(deletePromises);
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }

  /**
   * Get storage reference from URL
   * @param {string} url - Storage URL
   * @returns {Object|null} Storage reference
   */
  static getStorageRefFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathMatch = urlObj.pathname.match(/\/o\/(.+)\?/);
      if (!pathMatch) return null;
      
      const filePath = decodeURIComponent(pathMatch[1]);
      return ref(storage, filePath);
    } catch (error) {
      console.error('Error getting storage ref from URL:', error);
      return null;
    }
  }

  /**
   * Generate search keywords
   * @param {Object} equipmentData - Equipment data
   * @returns {Array<string>} Search keywords
   */
  static generateSearchKeywords(equipmentData) {
    const keywords = new Set();
    
    // Add keywords from various fields
    this.addKeywords(keywords, equipmentData.equipmentNumber);
    this.addKeywords(keywords, equipmentData.name);
    this.addKeywords(keywords, equipmentData.brand);
    this.addKeywords(keywords, equipmentData.model);
    this.addKeywords(keywords, equipmentData.description);
    
    // Add category keywords
    if (equipmentData.category) {
      this.addKeywords(keywords, equipmentData.category.name);
    }
    
    // Add tags
    if (equipmentData.tags) {
      equipmentData.tags.forEach(tag => this.addKeywords(keywords, tag));
    }
    
    return Array.from(keywords).filter(keyword => keyword.length >= 2);
  }

  /**
   * Add keywords from text
   * @param {Set} keywords - Keywords set
   * @param {string} text - Text to extract keywords from
   */
  static addKeywords(keywords, text) {
    if (!text) return;
    
    const words = text.toLowerCase()
      .replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length >= 2);
    
    words.forEach(word => keywords.add(word));
  }

  /**
   * Track changes between old and new data
   * @param {Object} oldData - Old equipment data
   * @param {Object} newData - New equipment data
   * @returns {Array} Array of changes
   */
  static trackChanges(oldData, newData) {
    const changes = [];
    const fieldsToTrack = [
      'equipmentNumber', 'name', 'category', 'brand', 'model', 
      'description', 'status', 'location', 'purchasePrice', 
      'vendor', 'responsiblePerson'
    ];

    fieldsToTrack.forEach(field => {
      const oldValue = oldData[field];
      const newValue = newData[field];
      
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({
          field,
          oldValue,
          newValue
        });
      }
    });

    return changes;
  }

  /**
   * Log activity
   * @param {string} equipmentId - Equipment ID
   * @param {string} action - Action type
   * @param {Object} data - Additional data
   * @param {string} userId - User ID
   */
  static async logActivity(equipmentId, action, data, userId) {
    try {
      const activity = {
        equipmentId,
        action,
        ...data,
        userId,
        timestamp: serverTimestamp(),
        ipAddress: null, // Would be set by backend
        userAgent: navigator.userAgent,
        sessionId: null // Would be set by backend
      };

      await addDoc(collection(db, this.HISTORY_COLLECTION), activity);
    } catch (error) {
      console.error('Error logging activity:', error);
      // Don't throw error for logging failures
    }
  }

  /**
   * Update category equipment count
   * @param {string} categoryId - Category ID
   * @param {number} incrementValue - Increment value
   */
  static async updateCategoryCount(categoryId, incrementValue) {
    try {
      const categoryRef = doc(db, this.CATEGORIES_COLLECTION, categoryId);
      await updateDoc(categoryRef, {
        equipmentCount: increment(incrementValue)
      });
    } catch (error) {
      console.error('Error updating category count:', error);
      // Don't throw error for count update failures
    }
  }

  /**
   * Generate unique image ID
   * @returns {string} Unique image ID
   */
  static generateImageId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export default EquipmentManagementService;