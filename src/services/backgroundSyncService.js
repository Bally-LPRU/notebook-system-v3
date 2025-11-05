// Background Sync Service for Equipment Management
// Handles offline data synchronization and background uploads

import { OfflineDataManager } from '../utils/serviceWorkerRegistration';
import { equipmentManagementService } from './equipmentManagementService';
import { imageService } from './imageService';

class BackgroundSyncService {
  constructor() {
    this.offlineManager = new OfflineDataManager();
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    this.syncQueue = [];
    
    this.init();
  }
  
  init() {
    // Listen for network status changes
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
    
    // Register service worker sync events
    this.registerSyncEvents();
  }
  
  async registerSyncEvents() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Listen for sync events from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data.type === 'SYNC_COMPLETE') {
            this.handleSyncComplete(event.data.payload);
          }
        });
        
      } catch (error) {
        console.error('Failed to register sync events:', error);
      }
    }
  }
  
  // Add equipment to offline queue
  async addEquipmentOffline(equipmentData) {
    try {
      const uploadId = await this.offlineManager.addPendingUpload('equipment', {
        action: 'create',
        data: equipmentData,
        timestamp: Date.now()
      });
      
      // Also add to offline actions for UI feedback
      await this.offlineManager.addOfflineAction('equipment_create', {
        uploadId,
        equipmentData,
        status: 'pending'
      });
      
      // Try to sync immediately if online
      if (this.isOnline) {
        this.requestSync('equipment-upload');
      }
      
      return uploadId;
    } catch (error) {
      console.error('Failed to add equipment to offline queue:', error);
      throw error;
    }
  }
  
  // Update equipment offline
  async updateEquipmentOffline(equipmentId, updateData) {
    try {
      const uploadId = await this.offlineManager.addPendingUpload('equipment', {
        action: 'update',
        equipmentId,
        data: updateData,
        timestamp: Date.now()
      });
      
      await this.offlineManager.addOfflineAction('equipment_update', {
        uploadId,
        equipmentId,
        updateData,
        status: 'pending'
      });
      
      if (this.isOnline) {
        this.requestSync('equipment-upload');
      }
      
      return uploadId;
    } catch (error) {
      console.error('Failed to add equipment update to offline queue:', error);
      throw error;
    }
  }
  
  // Add image upload to offline queue
  async addImageUploadOffline(equipmentId, imageFile, metadata = {}) {
    try {
      const uploadId = await this.offlineManager.addPendingUpload('images', {
        equipmentId,
        file: imageFile,
        metadata,
        timestamp: Date.now()
      });
      
      await this.offlineManager.addOfflineAction('image_upload', {
        uploadId,
        equipmentId,
        fileName: imageFile.name,
        fileSize: imageFile.size,
        status: 'pending'
      });
      
      if (this.isOnline) {
        this.requestSync('image-upload');
      }
      
      return uploadId;
    } catch (error) {
      console.error('Failed to add image upload to offline queue:', error);
      throw error;
    }
  }
  
  // Request background sync
  async requestSync(tag) {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register(tag);
        console.log(`Background sync requested: ${tag}`);
      } catch (error) {
        console.error(`Failed to request background sync for ${tag}:`, error);
        // Fallback to immediate sync
        this.processSyncQueue();
      }
    } else {
      // Fallback for browsers without background sync
      this.processSyncQueue();
    }
  }
  
  // Process sync queue manually
  async processSyncQueue() {
    if (this.syncInProgress || !this.isOnline) {
      return;
    }
    
    this.syncInProgress = true;
    
    try {
      // Sync equipment uploads
      await this.syncEquipmentUploads();
      
      // Sync image uploads
      await this.syncImageUploads();
      
      // Clean up completed actions
      await this.cleanupCompletedActions();
      
    } catch (error) {
      console.error('Sync queue processing failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }
  
  // Sync equipment uploads
  async syncEquipmentUploads() {
    try {
      const pendingUploads = await this.offlineManager.getPendingUploads('equipment');
      
      for (const upload of pendingUploads) {
        try {
          let result;
          
          if (upload.data.action === 'create') {
            result = await equipmentManagementService.createEquipment(upload.data.data);
          } else if (upload.data.action === 'update') {
            result = await equipmentManagementService.updateEquipment(
              upload.data.equipmentId, 
              upload.data.data
            );
          }
          
          if (result) {
            // Remove from pending uploads
            await this.offlineManager.removePendingUpload(upload.id);
            
            // Update offline action status
            await this.updateOfflineActionStatus(upload.id, 'completed', result);
            
            console.log('Equipment sync completed:', upload.id);
          }
          
        } catch (error) {
          console.error('Failed to sync equipment upload:', upload.id, error);
          
          // Update offline action with error
          await this.updateOfflineActionStatus(upload.id, 'failed', { error: error.message });
        }
      }
    } catch (error) {
      console.error('Equipment uploads sync failed:', error);
    }
  }
  
  // Sync image uploads
  async syncImageUploads() {
    try {
      const pendingUploads = await this.offlineManager.getPendingUploads('images');
      
      for (const upload of pendingUploads) {
        try {
          const result = await imageService.uploadImage(
            upload.data.file,
            upload.data.equipmentId,
            upload.data.metadata
          );
          
          if (result) {
            // Remove from pending uploads
            await this.offlineManager.removePendingUpload(upload.id);
            
            // Update offline action status
            await this.updateOfflineActionStatus(upload.id, 'completed', result);
            
            console.log('Image sync completed:', upload.id);
          }
          
        } catch (error) {
          console.error('Failed to sync image upload:', upload.id, error);
          
          // Update offline action with error
          await this.updateOfflineActionStatus(upload.id, 'failed', { error: error.message });
        }
      }
    } catch (error) {
      console.error('Image uploads sync failed:', error);
    }
  }
  
  // Update offline action status
  async updateOfflineActionStatus(uploadId, status, result = null) {
    try {
      const actions = await this.offlineManager.getOfflineActions();
      const action = actions.find(a => a.data.uploadId === uploadId);
      
      if (action) {
        action.data.status = status;
        action.data.result = result;
        action.data.completedAt = Date.now();
        
        // Update in IndexedDB
        await this.offlineManager.addOfflineAction(action.type, action.data);
      }
    } catch (error) {
      console.error('Failed to update offline action status:', error);
    }
  }
  
  // Clean up completed actions (older than 24 hours)
  async cleanupCompletedActions() {
    try {
      const actions = await this.offlineManager.getOfflineActions();
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      
      const actionsToKeep = actions.filter(action => {
        return action.data.status === 'pending' || 
               (action.data.completedAt && action.data.completedAt > oneDayAgo);
      });
      
      // Clear all actions and re-add the ones to keep
      await this.offlineManager.clearOfflineActions();
      
      for (const action of actionsToKeep) {
        await this.offlineManager.addOfflineAction(action.type, action.data);
      }
      
    } catch (error) {
      console.error('Failed to cleanup completed actions:', error);
    }
  }
  
  // Handle sync completion from service worker
  handleSyncComplete(payload) {
    console.log('Sync completed:', payload);
    
    // Dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent('sync-complete', {
      detail: payload
    }));
  }
  
  // Get pending uploads count
  async getPendingUploadsCount() {
    try {
      const equipmentUploads = await this.offlineManager.getPendingUploads('equipment');
      const imageUploads = await this.offlineManager.getPendingUploads('images');
      
      return {
        equipment: equipmentUploads.length,
        images: imageUploads.length,
        total: equipmentUploads.length + imageUploads.length
      };
    } catch (error) {
      console.error('Failed to get pending uploads count:', error);
      return { equipment: 0, images: 0, total: 0 };
    }
  }
  
  // Get offline actions for UI display
  async getOfflineActions() {
    try {
      return await this.offlineManager.getOfflineActions();
    } catch (error) {
      console.error('Failed to get offline actions:', error);
      return [];
    }
  }
  
  // Force sync all pending data
  async forceSyncAll() {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }
    
    await this.processSyncQueue();
    
    // Also request service worker sync
    await this.requestSync('equipment-upload');
    await this.requestSync('image-upload');
  }
  
  // Clear all offline data (for testing/debugging)
  async clearAllOfflineData() {
    try {
      const equipmentUploads = await this.offlineManager.getPendingUploads('equipment');
      const imageUploads = await this.offlineManager.getPendingUploads('images');
      
      // Remove all pending uploads
      for (const upload of [...equipmentUploads, ...imageUploads]) {
        await this.offlineManager.removePendingUpload(upload.id);
      }
      
      // Clear all offline actions
      await this.offlineManager.clearOfflineActions();
      
      console.log('All offline data cleared');
    } catch (error) {
      console.error('Failed to clear offline data:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const backgroundSyncService = new BackgroundSyncService();

// Export utilities for components
export const useBackgroundSync = () => {
  return {
    addEquipmentOffline: (data) => backgroundSyncService.addEquipmentOffline(data),
    updateEquipmentOffline: (id, data) => backgroundSyncService.updateEquipmentOffline(id, data),
    addImageUploadOffline: (equipmentId, file, metadata) => 
      backgroundSyncService.addImageUploadOffline(equipmentId, file, metadata),
    getPendingUploadsCount: () => backgroundSyncService.getPendingUploadsCount(),
    getOfflineActions: () => backgroundSyncService.getOfflineActions(),
    forceSyncAll: () => backgroundSyncService.forceSyncAll(),
    clearAllOfflineData: () => backgroundSyncService.clearAllOfflineData()
  };
};

export default backgroundSyncService;