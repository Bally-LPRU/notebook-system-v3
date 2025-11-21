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
  startAfter,
  limit as firestoreLimit,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { 
  EQUIPMENT_STATUS, 
  EQUIPMENT_PAGINATION 
} from '../types/equipment';

class EquipmentService {
  static COLLECTION_NAME = 'equipmentManagement'; // Correct collection name where data exists
  // Collections that may hold equipment data (fallback for legacy data)
  static READ_COLLECTIONS = ['equipmentManagement', 'equipment'];
  static STORAGE_PATH = 'equipment-images';

  // Helper to try multiple collections for read-only operations
  static async fetchFromCollections(fetcher) {
    for (const name of this.READ_COLLECTIONS) {
      const result = await fetcher(name);
      if (result) {
        return result;
      }
    }
    return null;
  }

  /**
   * Create new equipment
   * @param {Object} equipmentData - Equipment data
   * @param {File|null} imageFile - Image file to upload
   * @param {string} createdBy - UID of creator
   * @returns {Promise<Object>} Created equipment with ID
   */
  static async createEquipment(equipmentData, imageFile = null, createdBy) {
    try {
      // Check if serial number is unique
      const isUnique = await this.isSerialNumberUnique(equipmentData.serialNumber);
      if (!isUnique) {
        throw new Error('หมายเลขซีเรียลนี้มีอยู่ในระบบแล้ว');
      }

      let imageURL = null;
      
      // Upload image if provided
      if (imageFile) {
        imageURL = await this.uploadEquipmentImage(imageFile, equipmentData.serialNumber);
      }

      // Prepare equipment data
      const equipment = {
        name: equipmentData.name.trim(),
        category: equipmentData.category,
        brand: equipmentData.brand.trim(),
        model: equipmentData.model.trim(),
        serialNumber: equipmentData.serialNumber.trim(),
        description: equipmentData.description?.trim() || '',
        imageURL,
        status: equipmentData.status || EQUIPMENT_STATUS.AVAILABLE,
        location: equipmentData.location.trim(),
        purchaseDate: equipmentData.purchaseDate ? new Date(equipmentData.purchaseDate) : null,
        warrantyExpiry: equipmentData.warrantyExpiry ? new Date(equipmentData.warrantyExpiry) : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), equipment);
      
      return {
        id: docRef.id,
        ...equipment,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error creating equipment:', error);
      throw error;
    }
  }

  /**
   * Update existing equipment
   * @param {string} equipmentId - Equipment ID
   * @param {Object} equipmentData - Updated equipment data
   * @param {File|null} imageFile - New image file (optional)
   * @param {string} updatedBy - UID of updater
   * @returns {Promise<Object>} Updated equipment
   */
  static async updateEquipment(equipmentId, equipmentData, imageFile = null, updatedBy) {
    try {
      const equipmentRef = doc(db, this.COLLECTION_NAME, equipmentId);
      
      // Get current equipment data
      const currentEquipment = await this.getEquipmentById(equipmentId);
      if (!currentEquipment) {
        throw new Error('ไม่พบอุปกรณ์ที่ต้องการแก้ไข');
      }

      // Check serial number uniqueness if changed
      if (equipmentData.serialNumber !== currentEquipment.serialNumber) {
        const isUnique = await this.isSerialNumberUnique(equipmentData.serialNumber, equipmentId);
        if (!isUnique) {
          throw new Error('หมายเลขซีเรียลนี้มีอยู่ในระบบแล้ว');
        }
      }

      let imageURL = currentEquipment.imageURL;
      
      // Handle image upload/update
      if (imageFile) {
        // Delete old image if exists
        if (currentEquipment.imageURL) {
          await this.deleteEquipmentImage(currentEquipment.imageURL);
        }
        
        // Upload new image
        imageURL = await this.uploadEquipmentImage(imageFile, equipmentData.serialNumber);
      }

      // Prepare update data
      const updateData = {
        name: equipmentData.name.trim(),
        category: equipmentData.category,
        brand: equipmentData.brand.trim(),
        model: equipmentData.model.trim(),
        serialNumber: equipmentData.serialNumber.trim(),
        description: equipmentData.description?.trim() || '',
        imageURL,
        status: equipmentData.status,
        location: equipmentData.location.trim(),
        purchaseDate: equipmentData.purchaseDate ? new Date(equipmentData.purchaseDate) : null,
        warrantyExpiry: equipmentData.warrantyExpiry ? new Date(equipmentData.warrantyExpiry) : null,
        updatedAt: serverTimestamp(),
        updatedBy
      };

      // Update in Firestore
      await updateDoc(equipmentRef, updateData);
      
      return {
        id: equipmentId,
        ...currentEquipment,
        ...updateData,
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error updating equipment:', error);
      throw error;
    }
  }

  /**
   * Delete equipment
   * @param {string} equipmentId - Equipment ID
   * @returns {Promise<boolean>} Success status
   */
  static async deleteEquipment(equipmentId) {
    try {
      const equipment = await this.getEquipmentById(equipmentId);
      if (!equipment) {
        throw new Error('ไม่พบอุปกรณ์ที่ต้องการลบ');
      }

      // Check if equipment is currently borrowed
      if (equipment.status === EQUIPMENT_STATUS.BORROWED) {
        throw new Error('ไม่สามารถลบอุปกรณ์ที่กำลังถูกยืมได้');
      }

      // Delete image if exists
      if (equipment.imageURL) {
        await this.deleteEquipmentImage(equipment.imageURL);
      }

      // Delete from Firestore
      const equipmentRef = doc(db, this.COLLECTION_NAME, equipmentId);
      await deleteDoc(equipmentRef);
      
      return true;
    } catch (error) {
      console.error('Error deleting equipment:', error);
      throw error;
    }
  }

  /**
   * Get equipment by ID
   * @param {string} equipmentId - Equipment ID
   * @returns {Promise<Object|null>} Equipment data or null
   */
  static async getEquipmentById(equipmentId) {
    try {
      const result = await this.fetchFromCollections(async (collectionName) => {
        const equipmentRef = doc(db, collectionName, equipmentId);
        const equipmentDoc = await getDoc(equipmentRef);
        
        if (equipmentDoc.exists()) {
          return {
            id: equipmentDoc.id,
            ...equipmentDoc.data()
          };
        }
        return null;
      });
      
      return result;
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
        category = '',
        status = '',
        location = '',
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = EQUIPMENT_PAGINATION.DEFAULT_PAGE,
        limit: pageLimit = EQUIPMENT_PAGINATION.DEFAULT_LIMIT,
        lastDoc = null
      } = filters;

      // Ensure limit doesn't exceed maximum
      const limit = Math.min(pageLimit, EQUIPMENT_PAGINATION.MAX_LIMIT);

      console.log('EquipmentService.getEquipmentList called with:', { filters, limit });

      const result = await this.fetchFromCollections(async (collectionName) => {
        console.log('Trying collection:', collectionName);
        
        const equipmentRef = collection(db, collectionName);
        
        // Simple query - just limit, no filters, no orderBy
        const simpleQuery = query(equipmentRef, firestoreLimit(limit + 1));
        
        // Execute query
        const querySnapshot = await getDocs(simpleQuery);
        
        console.log('Query result:', {
          collection: collectionName,
          size: querySnapshot.size,
          empty: querySnapshot.empty
        });
        
        if (querySnapshot.empty) {
          return null; // Try next collection
        }

        const equipment = [];
        let hasNextPage = false;
        
        querySnapshot.forEach((doc, index) => {
          if (index < limit) {
            const data = doc.data();
            const equipmentItem = {
              id: doc.id,
              ...data
            };
            console.log('Equipment item:', equipmentItem);
            equipment.push(equipmentItem);
          } else {
            hasNextPage = true;
          }
        });

        console.log('Processed equipment:', equipment.length, 'items');

        // Apply filters client-side (temporary solution)
        let filteredEquipment = equipment;
        
        if (category) {
          filteredEquipment = filteredEquipment.filter(item => item.category === category);
        }
        
        if (status) {
          filteredEquipment = filteredEquipment.filter(item => item.status === status);
        }
        
        if (location) {
          filteredEquipment = filteredEquipment.filter(item => item.location === location);
        }
        
        if (search) {
          const searchLower = search.toLowerCase();
          filteredEquipment = filteredEquipment.filter(item => 
            item.name?.toLowerCase().includes(searchLower) ||
            item.brand?.toLowerCase().includes(searchLower) ||
            item.model?.toLowerCase().includes(searchLower) ||
            item.serialNumber?.toLowerCase().includes(searchLower) ||
            item.description?.toLowerCase().includes(searchLower)
          );
        }

        console.log('Filtered equipment:', filteredEquipment.length, 'items');

        return {
          equipment: filteredEquipment,
          pagination: {
            currentPage: page,
            hasNextPage: hasNextPage && !search && !category && !status && !location,
            totalItems: filteredEquipment.length,
            limit
          },
          lastDoc: equipment.length > 0 ? querySnapshot.docs[Math.min(equipment.length - 1, limit - 1)] : null
        };
      });

      // If no collections returned data, return empty result gracefully
      if (!result) {
        return {
          equipment: [],
          pagination: {
            currentPage: page,
            hasNextPage: false,
            totalItems: 0,
            limit
          },
          lastDoc: null
        };
      }

      return result;
    } catch (error) {
      console.error('Error getting equipment list:', error);
      throw error;
    }
  }

  /**
   * Get available equipment for borrowing
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Array>} Available equipment list
   */
  static async getAvailableEquipment(filters = {}) {
    try {
      const availableFilters = {
        ...filters,
        status: EQUIPMENT_STATUS.AVAILABLE
      };
      
      const result = await this.getEquipmentList(availableFilters);
      return result.equipment;
    } catch (error) {
      console.error('Error getting available equipment:', error);
      throw error;
    }
  }

  /**
   * Get equipment statistics
   * @returns {Promise<Object>} Equipment statistics
   */
  static async getEquipmentStats() {
    try {
      const equipmentRef = collection(db, this.COLLECTION_NAME);
      
      // Get all equipment
      const allEquipmentQuery = query(equipmentRef);
      const allEquipmentSnapshot = await getDocs(allEquipmentQuery);
      
      // Count by status
      const stats = {
        total: 0,
        available: 0,
        borrowed: 0,
        maintenance: 0,
        retired: 0,
        byCategory: {}
      };
      
      allEquipmentSnapshot.forEach((doc) => {
        const equipment = doc.data();
        stats.total++;
        
        // Count by status
        if (equipment.status === EQUIPMENT_STATUS.AVAILABLE) {
          stats.available++;
        } else if (equipment.status === EQUIPMENT_STATUS.BORROWED) {
          stats.borrowed++;
        } else if (equipment.status === EQUIPMENT_STATUS.MAINTENANCE) {
          stats.maintenance++;
        } else if (equipment.status === EQUIPMENT_STATUS.RETIRED) {
          stats.retired++;
        }
        
        // Count by category
        if (!stats.byCategory[equipment.category]) {
          stats.byCategory[equipment.category] = 0;
        }
        stats.byCategory[equipment.category]++;
      });
      
      return stats;
    } catch (error) {
      console.error('Error getting equipment stats:', error);
      throw error;
    }
  }

  /**
   * Check if serial number is unique
   * @param {string} serialNumber - Serial number to check
   * @param {string} excludeId - Equipment ID to exclude from check (for updates)
   * @returns {Promise<boolean>} True if unique
   */
  static async isSerialNumberUnique(serialNumber, excludeId = null) {
    try {
      const equipmentRef = collection(db, this.COLLECTION_NAME);
      const q = query(equipmentRef, where('serialNumber', '==', serialNumber.trim()));
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
      console.error('Error checking serial number uniqueness:', error);
      throw error;
    }
  }

  /**
   * Upload equipment image to Firebase Storage
   * @param {File} imageFile - Image file to upload
   * @param {string} serialNumber - Equipment serial number for filename
   * @returns {Promise<string>} Download URL
   */
  static async uploadEquipmentImage(imageFile, serialNumber) {
    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(imageFile.type)) {
        throw new Error('รองรับเฉพาะไฟล์รูปภาพ (JPEG, PNG, WebP)');
      }
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (imageFile.size > maxSize) {
        throw new Error('ขนาดไฟล์ต้องไม่เกิน 5MB');
      }
      
      // Create unique filename
      const timestamp = Date.now();
      const fileExtension = imageFile.name.split('.').pop();
      const fileName = `${serialNumber}_${timestamp}.${fileExtension}`;
      
      // Create storage reference
      const imageRef = ref(storage, `${this.STORAGE_PATH}/${fileName}`);
      
      // Upload file
      const snapshot = await uploadBytes(imageRef, imageFile);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading equipment image:', error);
      throw error;
    }
  }

  /**
   * Delete equipment image from Firebase Storage
   * @param {string} imageURL - Image URL to delete
   * @returns {Promise<boolean>} Success status
   */
  static async deleteEquipmentImage(imageURL) {
    try {
      if (!imageURL) return true;
      
      // Extract file path from URL
      const url = new URL(imageURL);
      const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
      if (!pathMatch) return true;
      
      const filePath = decodeURIComponent(pathMatch[1]);
      
      // Create storage reference and delete
      const imageRef = ref(storage, filePath);
      await deleteObject(imageRef);
      
      return true;
    } catch (error) {
      console.error('Error deleting equipment image:', error);
      // Don't throw error for image deletion failures
      return false;
    }
  }

  /**
   * Update equipment status
   * @param {string} equipmentId - Equipment ID
   * @param {string} newStatus - New status
   * @param {string} updatedBy - UID of updater
   * @returns {Promise<boolean>} Success status
   */
  static async updateEquipmentStatus(equipmentId, newStatus, updatedBy) {
    try {
      const equipmentRef = doc(db, this.COLLECTION_NAME, equipmentId);
      
      await updateDoc(equipmentRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        updatedBy
      });
      
      return true;
    } catch (error) {
      console.error('Error updating equipment status:', error);
      throw error;
    }
  }

  /**
   * Bulk update equipment status
   * @param {Array<string>} equipmentIds - Array of equipment IDs
   * @param {string} newStatus - New status
   * @param {string} updatedBy - UID of updater
   * @returns {Promise<boolean>} Success status
   */
  static async bulkUpdateEquipmentStatus(equipmentIds, newStatus, updatedBy) {
    try {
      const batch = writeBatch(db);
      
      equipmentIds.forEach(equipmentId => {
        const equipmentRef = doc(db, this.COLLECTION_NAME, equipmentId);
        batch.update(equipmentRef, {
          status: newStatus,
          updatedAt: serverTimestamp(),
          updatedBy
        });
      });
      
      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error bulk updating equipment status:', error);
      throw error;
    }
  }

  /**
   * Get equipment categories with counts
   * @returns {Promise<Array>} Categories with equipment counts
   */
  static async getEquipmentCategories() {
    try {
      const equipmentRef = collection(db, this.COLLECTION_NAME);
      const querySnapshot = await getDocs(equipmentRef);
      
      const categoryCounts = {};
      
      querySnapshot.forEach((doc) => {
        const equipment = doc.data();
        if (!categoryCounts[equipment.category]) {
          categoryCounts[equipment.category] = 0;
        }
        categoryCounts[equipment.category]++;
      });
      
      return Object.entries(categoryCounts).map(([category, count]) => ({
        category,
        count
      }));
    } catch (error) {
      console.error('Error getting equipment categories:', error);
      throw error;
    }
  }

  /**
   * Search equipment by text
   * @param {string} searchTerm - Search term
   * @param {number} limit - Maximum results
   * @returns {Promise<Array>} Search results
   */
  static async searchEquipment(searchTerm, limit = 10) {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return [];
      }
      
      // For now, we'll do a simple client-side search
      // In production, consider using Algolia or similar for better search
      const result = await this.getEquipmentList({ limit: 100 });
      const searchLower = searchTerm.toLowerCase();
      
      return result.equipment
        .filter(equipment => 
          equipment.name.toLowerCase().includes(searchLower) ||
          equipment.brand.toLowerCase().includes(searchLower) ||
          equipment.model.toLowerCase().includes(searchLower) ||
          equipment.serialNumber.toLowerCase().includes(searchLower)
        )
        .slice(0, limit);
    } catch (error) {
      console.error('Error searching equipment:', error);
      throw error;
    }
  }
}

export default EquipmentService;
