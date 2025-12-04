import { 
  doc, 
  updateDoc, 
  deleteDoc, 
  writeBatch, 
  collection, 
  serverTimestamp,
  addDoc 
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { deleteObject, ref } from 'firebase/storage';
import { storage } from '../config/firebase';

/**
 * Service for handling bulk operations on equipment
 */
class BulkOperationsService {
  /**
   * Update multiple equipment items
   * @param {Array} equipmentList - List of equipment to update
   * @param {Object} updateData - Data to update
   * @param {Function} progressCallback - Progress callback function
   */
  static async bulkUpdateEquipment(equipmentList, updateData, progressCallback = null) {
    if (!equipmentList || equipmentList.length === 0) {
      throw new Error('ไม่มีรายการอุปกรณ์ที่จะอัปเดต');
    }

    if (!auth.currentUser) {
      throw new Error('กรุณาเข้าสู่ระบบก่อนทำการอัปเดต');
    }

    const batch = writeBatch(db);
    const total = equipmentList.length;
    let completed = 0;
    const errors = [];

    try {
      // Prepare update data with metadata
      const finalUpdateData = {
        ...updateData,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser.uid
      };

      // Process in batches (Firestore batch limit is 500)
      const batchSize = 500;
      const batches = [];
      
      for (let i = 0; i < equipmentList.length; i += batchSize) {
        const batchItems = equipmentList.slice(i, i + batchSize);
        batches.push(batchItems);
      }

      for (const batchItems of batches) {
        const currentBatch = writeBatch(db);
        
        for (const equipment of batchItems) {
          try {
            const equipmentRef = doc(db, 'equipment', equipment.id);
            currentBatch.update(equipmentRef, finalUpdateData);

            // Log the change for audit trail
            const historyData = {
              equipmentId: equipment.id,
              action: 'bulk_update',
              changes: Object.entries(updateData).map(([field, newValue]) => ({
                field,
                oldValue: equipment[field] || null,
                newValue
              })),
              reason: 'Bulk operation',
              userId: auth.currentUser.uid,
              userName: auth.currentUser.displayName || auth.currentUser.email,
              userEmail: auth.currentUser.email,
              timestamp: serverTimestamp(),
              ipAddress: null, // Could be added if needed
              userAgent: navigator.userAgent,
              sessionId: null // Could be added if needed
            };

            const historyRef = doc(collection(db, 'equipmentHistory'));
            currentBatch.set(historyRef, historyData);

          } catch (error) {
            errors.push({
              equipment: equipment.name,
              error: error.message
            });
          }

          completed++;
          if (progressCallback) {
            progressCallback({ current: completed, total });
          }
        }

        // Commit the batch
        await currentBatch.commit();
      }

      if (errors.length > 0) {
        console.warn('Some items failed to update:', errors);
        throw new Error(`อัปเดตสำเร็จ ${completed - errors.length} รายการ, ล้มเหลว ${errors.length} รายการ`);
      }

      return {
        success: true,
        updated: completed,
        errors: []
      };

    } catch (error) {
      console.error('Bulk update error:', error);
      throw new Error(error.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
    }
  }

  /**
   * Delete multiple equipment items
   * @param {Array} equipmentList - List of equipment to delete
   * @param {Function} progressCallback - Progress callback function
   */
  static async bulkDeleteEquipment(equipmentList, progressCallback = null) {
    if (!equipmentList || equipmentList.length === 0) {
      throw new Error('ไม่มีรายการอุปกรณ์ที่จะลบ');
    }

    if (!auth.currentUser) {
      throw new Error('กรุณาเข้าสู่ระบบก่อนทำการลบ');
    }

    const total = equipmentList.length;
    let completed = 0;
    const errors = [];

    try {
      // Process items one by one to handle image deletion
      for (const equipment of equipmentList) {
        try {
          // Delete images from storage first
          if (equipment.images && equipment.images.length > 0) {
            await this.deleteEquipmentImages(equipment.images);
          }

          // Log the deletion for audit trail
          const historyData = {
            equipmentId: equipment.id,
            action: 'bulk_delete',
            changes: [{
              field: 'deleted',
              oldValue: false,
              newValue: true
            }],
            reason: 'Bulk deletion',
            userId: auth.currentUser.uid,
            userName: auth.currentUser.displayName || auth.currentUser.email,
            userEmail: auth.currentUser.email,
            timestamp: serverTimestamp(),
            ipAddress: null,
            userAgent: navigator.userAgent,
            sessionId: null,
            // Store equipment data for recovery if needed
            equipmentData: equipment
          };

          await addDoc(collection(db, 'equipmentHistory'), historyData);

          // Delete the equipment document
          await deleteDoc(doc(db, 'equipment', equipment.id));

        } catch (error) {
          errors.push({
            equipment: equipment.name,
            error: error.message
          });
        }

        completed++;
        if (progressCallback) {
          progressCallback({ current: completed, total });
        }
      }

      if (errors.length > 0) {
        console.warn('Some items failed to delete:', errors);
        throw new Error(`ลบสำเร็จ ${completed - errors.length} รายการ, ล้มเหลว ${errors.length} รายการ`);
      }

      return {
        success: true,
        deleted: completed,
        errors: []
      };

    } catch (error) {
      console.error('Bulk delete error:', error);
      throw new Error(error.message || 'เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  }

  /**
   * Delete equipment images from storage
   * @param {Array} images - Array of image objects
   */
  static async deleteEquipmentImages(images) {
    const deletePromises = images.map(async (image) => {
      try {
        // Delete original image
        if (image.url) {
          const originalRef = ref(storage, image.url);
          await deleteObject(originalRef);
        }

        // Delete thumbnail if exists
        if (image.thumbnailUrl) {
          const thumbnailRef = ref(storage, image.thumbnailUrl);
          await deleteObject(thumbnailRef);
        }

        // Delete medium size if exists
        if (image.mediumUrl) {
          const mediumRef = ref(storage, image.mediumUrl);
          await deleteObject(mediumRef);
        }
      } catch (error) {
        console.warn(`Failed to delete image ${image.id}:`, error);
        // Don't throw error for image deletion failures
      }
    });

    await Promise.allSettled(deletePromises);
  }

  /**
   * Update status for multiple equipment items
   * @param {Array} equipmentList - List of equipment to update
   * @param {string} newStatus - New status value
   * @param {Function} progressCallback - Progress callback function
   */
  static async bulkUpdateStatus(equipmentList, newStatus, progressCallback = null) {
    return this.bulkUpdateEquipment(
      equipmentList, 
      { status: newStatus }, 
      progressCallback
    );
  }

  /**
   * Update location for multiple equipment items
   * @param {Array} equipmentList - List of equipment to update
   * @param {string} newLocation - New location value
   * @param {Function} progressCallback - Progress callback function
   */
  static async bulkUpdateLocation(equipmentList, newLocation, progressCallback = null) {
    return this.bulkUpdateEquipment(
      equipmentList, 
      { location: newLocation }, 
      progressCallback
    );
  }

  /**
   * Generate QR codes for multiple equipment items
   * @param {Array} equipmentList - List of equipment
   */
  static async generateBulkQRCodes(equipmentList) {
    // This would integrate with a QR code generation service
    // For now, return the equipment data that can be used to generate QR codes
    return equipmentList.map(equipment => ({
      id: equipment.id,
      name: equipment.name,
      equipmentNumber: equipment.equipmentNumber,
      qrData: JSON.stringify({
        id: equipment.id,
        name: equipment.name,
        equipmentNumber: equipment.equipmentNumber,
        url: `${window.location.origin}/equipment/${equipment.id}`
      })
    }));
  }

}

export default BulkOperationsService;