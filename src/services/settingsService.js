/**
 * Settings Service
 * Handles all settings-related operations for the admin settings system
 * Based on admin-settings-system design document
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  arrayUnion,
  addDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { DEFAULT_SETTINGS } from '../types/settings';

/**
 * Collection names
 */
const COLLECTIONS = {
  SETTINGS: 'settings',
  CLOSED_DATES: 'closedDates',
  CATEGORY_LIMITS: 'categoryLimits',
  SYSTEM_NOTIFICATIONS: 'systemNotifications',
  AUDIT_LOG: 'settingsAuditLog'
};

/**
 * Settings document ID (single document for all system settings)
 */
const SETTINGS_DOC_ID = 'systemSettings';

/**
 * Settings Service Class
 */
class SettingsService {
  /**
   * Get all system settings
   * @returns {Promise<Object>} System settings object
   */
  async getSettings() {
    try {
      const settingsRef = doc(db, COLLECTIONS.SETTINGS, SETTINGS_DOC_ID);
      const settingsSnap = await getDoc(settingsRef);
      
      if (settingsSnap.exists()) {
        return {
          ...settingsSnap.data(),
          id: settingsSnap.id
        };
      }
      
      // Initialize with default settings if document doesn't exist
      const defaultSettings = {
        ...DEFAULT_SETTINGS,
        lastUpdated: serverTimestamp(),
        lastUpdatedBy: 'system'
      };
      
      await setDoc(settingsRef, defaultSettings);
      
      return {
        ...DEFAULT_SETTINGS,
        id: SETTINGS_DOC_ID
      };
    } catch (error) {
      console.error('Error getting settings:', error);
      
      // Retry logic for transient errors
      if (this._isRetryableError(error)) {
        return this._retryOperation(() => this.getSettings());
      }
      
      throw error;
    }
  }

  /**
   * Update a single setting
   * @param {string} key - Setting key
   * @param {*} value - Setting value
   * @param {string} adminId - Admin user ID
   * @param {string} adminName - Admin display name
   * @returns {Promise<void>}
   */
  async updateSetting(key, value, adminId, adminName) {
    try {
      // Validate the setting value
      const validation = await this._validateSetting(key, value);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Get current settings to capture old value for audit log
      const currentSettings = await this.getSettings();
      const oldValue = currentSettings[key];

      // Update the setting
      const settingsRef = doc(db, COLLECTIONS.SETTINGS, SETTINGS_DOC_ID);
      const updateData = {
        [key]: value,
        lastUpdated: serverTimestamp(),
        lastUpdatedBy: adminId
      };

      await updateDoc(settingsRef, updateData);

      // Log the change to audit log
      await this._logChange({
        adminId,
        adminName,
        action: 'update',
        settingType: key,
        settingPath: `${SETTINGS_DOC_ID}.${key}`,
        oldValue,
        newValue: value
      });

    } catch (error) {
      console.error(`Error updating setting ${key}:`, error);
      
      // Retry logic for transient errors
      if (this._isRetryableError(error)) {
        return this._retryOperation(() => 
          this.updateSetting(key, value, adminId, adminName)
        );
      }
      
      throw error;
    }
  }

  /**
   * Update multiple settings at once
   * @param {Object} settings - Settings object with key-value pairs
   * @param {string} adminId - Admin user ID
   * @param {string} adminName - Admin display name
   * @returns {Promise<void>}
   */
  async updateMultipleSettings(settings, adminId, adminName) {
    try {
      // Validate all settings first
      const validationErrors = [];
      for (const [key, value] of Object.entries(settings)) {
        const validation = await this._validateSetting(key, value);
        if (!validation.isValid) {
          validationErrors.push(`${key}: ${validation.error}`);
        }
      }

      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      // Get current settings to capture old values for audit log
      const currentSettings = await this.getSettings();

      // Update all settings
      const settingsRef = doc(db, COLLECTIONS.SETTINGS, SETTINGS_DOC_ID);
      const updateData = {
        ...settings,
        lastUpdated: serverTimestamp(),
        lastUpdatedBy: adminId
      };

      await updateDoc(settingsRef, updateData);

      // Log each change to audit log
      for (const [key, newValue] of Object.entries(settings)) {
        const oldValue = currentSettings[key];
        if (oldValue !== newValue) {
          await this._logChange({
            adminId,
            adminName,
            action: 'update',
            settingType: key,
            settingPath: `${SETTINGS_DOC_ID}.${key}`,
            oldValue,
            newValue
          });
        }
      }

    } catch (error) {
      console.error('Error updating multiple settings:', error);
      
      // Retry logic for transient errors
      if (this._isRetryableError(error)) {
        return this._retryOperation(() => 
          this.updateMultipleSettings(settings, adminId, adminName)
        );
      }
      
      throw error;
    }
  }

  /**
   * Add a closed date
   * @param {Date} date - The date to close
   * @param {string} reason - Reason for closure
   * @param {string} adminId - Admin user ID
   * @param {boolean} isRecurring - Whether this is a recurring date
   * @param {string|null} recurringPattern - Recurring pattern
   * @returns {Promise<string>} Document ID of created closed date
   */
  async addClosedDate(date, reason, adminId, isRecurring = false, recurringPattern = null) {
    try {
      // Validate inputs
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        throw new Error('Invalid date provided');
      }
      
      if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
        throw new Error('Reason is required');
      }

      if (!adminId || typeof adminId !== 'string') {
        throw new Error('Admin ID is required');
      }

      // Create closed date document
      const closedDatesRef = collection(db, COLLECTIONS.CLOSED_DATES);
      const newClosedDateRef = doc(closedDatesRef);
      
      const closedDateData = {
        date: Timestamp.fromDate(date),
        reason: reason.trim(),
        createdAt: serverTimestamp(),
        createdBy: adminId,
        isRecurring: isRecurring || false,
        recurringPattern: recurringPattern || null
      };

      await setDoc(newClosedDateRef, closedDateData);

      // Log the change
      await this._logChange({
        adminId,
        adminName: 'Admin', // Will be enhanced with actual name
        action: 'create',
        settingType: 'closedDate',
        settingPath: `closedDates/${newClosedDateRef.id}`,
        oldValue: null,
        newValue: closedDateData
      });

      return newClosedDateRef.id;
    } catch (error) {
      console.error('Error adding closed date:', error);
      
      // Retry logic for transient errors
      if (this._isRetryableError(error)) {
        return this._retryOperation(() => 
          this.addClosedDate(date, reason, adminId, isRecurring, recurringPattern)
        );
      }
      
      throw error;
    }
  }

  /**
   * Remove a closed date
   * @param {string} dateId - Closed date document ID
   * @returns {Promise<void>}
   */
  async removeClosedDate(dateId) {
    try {
      if (!dateId || typeof dateId !== 'string') {
        throw new Error('Date ID is required');
      }

      // Get the closed date before deleting for audit log
      const closedDateRef = doc(db, COLLECTIONS.CLOSED_DATES, dateId);
      const closedDateSnap = await getDoc(closedDateRef);
      
      if (!closedDateSnap.exists()) {
        throw new Error('Closed date not found');
      }

      const closedDateData = closedDateSnap.data();

      // Delete the closed date
      await deleteDoc(closedDateRef);

      // Log the change
      await this._logChange({
        adminId: closedDateData.createdBy || 'unknown',
        adminName: 'Admin',
        action: 'delete',
        settingType: 'closedDate',
        settingPath: `closedDates/${dateId}`,
        oldValue: closedDateData,
        newValue: null
      });

    } catch (error) {
      console.error('Error removing closed date:', error);
      
      // Retry logic for transient errors
      if (this._isRetryableError(error)) {
        return this._retryOperation(() => this.removeClosedDate(dateId));
      }
      
      throw error;
    }
  }

  /**
   * Get all closed dates
   * @returns {Promise<Array>} Array of closed date objects
   */
  async getClosedDates() {
    try {
      const closedDatesRef = collection(db, COLLECTIONS.CLOSED_DATES);
      const q = query(closedDatesRef, orderBy('date', 'asc'));
      const querySnapshot = await getDocs(q);
      
      const closedDates = [];
      querySnapshot.forEach((doc) => {
        closedDates.push({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore Timestamp to Date for easier handling
          date: doc.data().date?.toDate(),
          createdAt: doc.data().createdAt?.toDate()
        });
      });
      
      return closedDates;
    } catch (error) {
      console.error('Error getting closed dates:', error);
      
      // Retry logic for transient errors
      if (this._isRetryableError(error)) {
        return this._retryOperation(() => this.getClosedDates());
      }
      
      throw error;
    }
  }

  /**
   * Check if a date is closed
   * @param {Date} date - Date to check
   * @returns {Promise<boolean>} True if date is closed
   */
  async isDateClosed(date) {
    try {
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        throw new Error('Invalid date provided');
      }

      // Normalize the date to start of day for comparison
      const normalizedDate = new Date(date);
      normalizedDate.setHours(0, 0, 0, 0);

      // Get all closed dates
      const closedDates = await this.getClosedDates();
      
      // Check if the date matches any closed date
      return closedDates.some(closedDate => {
        if (!closedDate.date) return false;
        
        const closedDateNormalized = new Date(closedDate.date);
        closedDateNormalized.setHours(0, 0, 0, 0);
        
        // Check for exact date match
        if (closedDateNormalized.getTime() === normalizedDate.getTime()) {
          return true;
        }
        
        // Check for recurring patterns (e.g., yearly)
        if (closedDate.isRecurring && closedDate.recurringPattern === 'yearly') {
          return (
            closedDateNormalized.getMonth() === normalizedDate.getMonth() &&
            closedDateNormalized.getDate() === normalizedDate.getDate()
          );
        }
        
        return false;
      });
    } catch (error) {
      console.error('Error checking if date is closed:', error);
      
      // Retry logic for transient errors
      if (this._isRetryableError(error)) {
        return this._retryOperation(() => this.isDateClosed(date));
      }
      
      // Return false on error to avoid blocking operations
      return false;
    }
  }

  /**
   * Set category limit
   * @param {string} categoryId - Category ID
   * @param {string} categoryName - Category name
   * @param {number} limit - Maximum items allowed
   * @param {string} adminId - Admin user ID
   * @returns {Promise<void>}
   */
  async setCategoryLimit(categoryId, categoryName, limit, adminId) {
    try {
      // Validate inputs
      if (!categoryId || typeof categoryId !== 'string') {
        throw new Error('Category ID is required');
      }

      if (!categoryName || typeof categoryName !== 'string') {
        throw new Error('Category name is required');
      }

      if (typeof limit !== 'number' || limit < 0 || !Number.isInteger(limit)) {
        throw new Error('Limit must be a non-negative integer');
      }

      if (!adminId || typeof adminId !== 'string') {
        throw new Error('Admin ID is required');
      }

      // Get current limit for audit log
      const currentLimit = await this.getCategoryLimit(categoryId);

      // Set or update category limit
      const categoryLimitRef = doc(db, COLLECTIONS.CATEGORY_LIMITS, categoryId);
      const categoryLimitData = {
        categoryId,
        categoryName,
        limit,
        updatedAt: serverTimestamp(),
        updatedBy: adminId
      };

      await setDoc(categoryLimitRef, categoryLimitData, { merge: true });

      // Log the change
      await this._logChange({
        adminId,
        adminName: 'Admin',
        action: currentLimit !== null ? 'update' : 'create',
        settingType: 'categoryLimit',
        settingPath: `categoryLimits/${categoryId}`,
        oldValue: currentLimit,
        newValue: limit
      });

    } catch (error) {
      console.error('Error setting category limit:', error);
      
      // Retry logic for transient errors
      if (this._isRetryableError(error)) {
        return this._retryOperation(() => 
          this.setCategoryLimit(categoryId, categoryName, limit, adminId)
        );
      }
      
      throw error;
    }
  }

  /**
   * Get category limit
   * @param {string} categoryId - Category ID
   * @returns {Promise<number|null>} Category limit or null if not set
   */
  async getCategoryLimit(categoryId) {
    try {
      if (!categoryId || typeof categoryId !== 'string') {
        throw new Error('Category ID is required');
      }

      const categoryLimitRef = doc(db, COLLECTIONS.CATEGORY_LIMITS, categoryId);
      const categoryLimitSnap = await getDoc(categoryLimitRef);

      if (categoryLimitSnap.exists()) {
        const data = categoryLimitSnap.data();
        return data.limit;
      }

      return null;
    } catch (error) {
      console.error('Error getting category limit:', error);
      
      // Retry logic for transient errors
      if (this._isRetryableError(error)) {
        return this._retryOperation(() => this.getCategoryLimit(categoryId));
      }
      
      // Return null on error to use default
      return null;
    }
  }

  /**
   * Get all category limits
   * @returns {Promise<Array>} Array of category limit objects
   */
  async getAllCategoryLimits() {
    try {
      const categoryLimitsRef = collection(db, COLLECTIONS.CATEGORY_LIMITS);
      const querySnapshot = await getDocs(categoryLimitsRef);
      
      const categoryLimits = [];
      querySnapshot.forEach((doc) => {
        categoryLimits.push({
          id: doc.id,
          ...doc.data(),
          updatedAt: doc.data().updatedAt?.toDate()
        });
      });
      
      return categoryLimits;
    } catch (error) {
      console.error('Error getting all category limits:', error);
      
      // Retry logic for transient errors
      if (this._isRetryableError(error)) {
        return this._retryOperation(() => this.getAllCategoryLimits());
      }
      
      throw error;
    }
  }

  /**
   * Set Discord webhook URL
   * @param {string} url - Discord webhook URL
   * @param {string} adminId - Admin user ID
   * @param {string} adminName - Admin display name
   * @returns {Promise<void>}
   */
  async setDiscordWebhook(url, adminId, adminName) {
    return this.updateSetting('discordWebhookUrl', url, adminId, adminName);
  }

  /**
   * Test Discord webhook
   * @returns {Promise<Object>} Test result
   */
  async testDiscordWebhook() {
    const discordWebhookService = (await import('./discordWebhookService.js')).default;
    const settings = await this.getSettings();
    
    if (!settings.discordWebhookUrl) {
      throw new Error('Discord webhook URL is not configured');
    }

    return discordWebhookService.testWebhook(settings.discordWebhookUrl);
  }

  /**
   * Send Discord notification
   * @param {string} message - Message to send
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Result object
   */
  async sendDiscordNotification(message, options = {}) {
    const discordWebhookService = (await import('./discordWebhookService.js')).default;
    return discordWebhookService.sendDiscordNotification(message, options);
  }

  /**
   * Create system notification
   * @param {Object} notification - Notification data
   * @returns {Promise<string>} Document ID of created notification
   */
  async createSystemNotification(notification) {
    // Implementation will be added in task 10
    throw new Error('Not implemented yet');
  }

  /**
   * Get system notifications with optional filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of notification objects
   */
  async getSystemNotifications(filters = {}) {
    // Implementation will be added in task 10
    throw new Error('Not implemented yet');
  }

  /**
   * Log a setting change to audit log
   * Requirements: 8.1, 8.2
   * @param {Object} change - Change details
   * @param {string} change.adminId - Admin user ID
   * @param {string} change.adminName - Admin display name
   * @param {string} change.action - Action type ('create', 'update', 'delete')
   * @param {string} change.settingType - Type of setting changed
   * @param {string} change.settingPath - Full path to setting
   * @param {*} change.oldValue - Previous value
   * @param {*} change.newValue - New value
   * @param {string} [change.reason] - Optional reason for change
   * @param {string} [change.ipAddress] - IP address of admin
   * @param {string} [change.userAgent] - Browser user agent
   * @returns {Promise<string>} Document ID of created audit log entry
   */
  async logSettingChange(change) {
    try {
      const auditLogRef = collection(db, COLLECTIONS.AUDIT_LOG);
      const auditLogEntry = {
        timestamp: serverTimestamp(),
        adminId: change.adminId,
        adminName: change.adminName,
        action: change.action,
        settingType: change.settingType,
        settingPath: change.settingPath,
        oldValue: change.oldValue !== undefined ? change.oldValue : null,
        newValue: change.newValue !== undefined ? change.newValue : null,
        reason: change.reason || null,
        ipAddress: change.ipAddress || 'unknown',
        userAgent: change.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown')
      };

      const docRef = await addDoc(auditLogRef, auditLogEntry);

      // Send notification for critical setting changes
      await this._notifyCriticalSettingChange(change);

      return docRef.id;
    } catch (error) {
      console.error('Error logging setting change:', error);
      throw error;
    }
  }

  /**
   * Get audit log with optional filters
   * Requirements: 8.3, 8.4
   * @param {Object} filters - Filter options
   * @param {Date} [filters.startDate] - Start date for filtering
   * @param {Date} [filters.endDate] - End date for filtering
   * @param {string} [filters.adminId] - Filter by admin user ID
   * @param {string} [filters.settingType] - Filter by setting type
   * @param {number} [filters.limit] - Maximum number of entries to return
   * @returns {Promise<Array>} Array of audit log entries (newest first)
   */
  async getAuditLog(filters = {}) {
    try {
      const auditLogRef = collection(db, COLLECTIONS.AUDIT_LOG);
      let q = query(auditLogRef, orderBy('timestamp', 'desc'));

      // Apply filters
      const constraints = [orderBy('timestamp', 'desc')];

      if (filters.adminId) {
        constraints.unshift(where('adminId', '==', filters.adminId));
      }

      if (filters.settingType) {
        constraints.unshift(where('settingType', '==', filters.settingType));
      }

      if (filters.startDate && filters.endDate) {
        constraints.unshift(
          where('timestamp', '>=', Timestamp.fromDate(filters.startDate)),
          where('timestamp', '<=', Timestamp.fromDate(filters.endDate))
        );
      } else if (filters.startDate) {
        constraints.unshift(where('timestamp', '>=', Timestamp.fromDate(filters.startDate)));
      } else if (filters.endDate) {
        constraints.unshift(where('timestamp', '<=', Timestamp.fromDate(filters.endDate)));
      }

      q = query(auditLogRef, ...constraints);

      const snapshot = await getDocs(q);
      const auditLogs = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        auditLogs.push({
          id: docSnap.id,
          ...data,
          timestamp: data.timestamp?.toDate()
        });
      });

      // Apply limit if specified
      if (filters.limit && filters.limit > 0) {
        return auditLogs.slice(0, filters.limit);
      }

      return auditLogs;
    } catch (error) {
      console.error('Error getting audit log:', error);
      
      // Retry logic for transient errors
      if (this._isRetryableError(error)) {
        return this._retryOperation(() => this.getAuditLog(filters));
      }
      
      throw error;
    }
  }

  /**
   * Export settings to JSON
   * Requirements: 9.1, 9.5
   * @param {boolean} includeSensitive - Whether to include sensitive data
   * @param {string} adminId - Admin user ID performing export
   * @param {string} adminName - Admin display name
   * @returns {Promise<Object>} Settings export object
   */
  async exportSettings(includeSensitive = false, adminId = 'unknown', adminName = 'Unknown Admin') {
    try {
      // Get all current settings
      const settings = await this.getSettings();
      const closedDates = await this.getClosedDates();
      const categoryLimits = await this.getAllCategoryLimits();

      // Prepare export data
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          exportedBy: adminName,
          exportedByUserId: adminId,
          version: settings.version || 1,
          includeSensitive
        },
        settings: {
          maxLoanDuration: settings.maxLoanDuration,
          maxAdvanceBookingDays: settings.maxAdvanceBookingDays,
          defaultCategoryLimit: settings.defaultCategoryLimit,
          loanReturnStartTime: settings.loanReturnStartTime || null,
          loanReturnEndTime: settings.loanReturnEndTime || null,
          discordEnabled: settings.discordEnabled
        },
        closedDates: closedDates.map(cd => ({
          date: cd.date.toISOString(),
          reason: cd.reason,
          isRecurring: cd.isRecurring,
          recurringPattern: cd.recurringPattern
        })),
        categoryLimits: categoryLimits.map(cl => ({
          categoryId: cl.categoryId,
          categoryName: cl.categoryName,
          limit: cl.limit
        }))
      };

      // Include sensitive data if requested
      if (includeSensitive) {
        exportData.settings.discordWebhookUrl = settings.discordWebhookUrl;
      }

      // Log the export action
      await this._logChange({
        adminId,
        adminName,
        action: 'export',
        settingType: 'settings_export',
        settingPath: 'settings/export',
        oldValue: null,
        newValue: { includeSensitive, itemCount: closedDates.length + categoryLimits.length }
      });

      return exportData;
    } catch (error) {
      console.error('Error exporting settings:', error);
      throw error;
    }
  }

  /**
   * Import settings from JSON
   * Requirements: 9.2, 9.3, 9.4
   * @param {Object} settingsData - Settings data to import
   * @param {string} adminId - Admin user ID
   * @param {string} adminName - Admin display name
   * @returns {Promise<Object>} Import result with stats
   */
  async importSettings(settingsData, adminId, adminName) {
    try {
      // Validate import data structure
      const validation = this._validateImportData(settingsData);
      if (!validation.isValid) {
        throw new Error(`Import validation failed: ${validation.errors.join(', ')}`);
      }

      // Create backup before import
      const backup = await this.createBackup(adminId, adminName);

      const importStats = {
        settingsUpdated: 0,
        closedDatesAdded: 0,
        categoryLimitsUpdated: 0,
        errors: []
      };

      try {
        // Import system settings
        if (settingsData.settings) {
          const settingsToUpdate = {};
          
          if (settingsData.settings.maxLoanDuration !== undefined) {
            settingsToUpdate.maxLoanDuration = settingsData.settings.maxLoanDuration;
          }
          if (settingsData.settings.maxAdvanceBookingDays !== undefined) {
            settingsToUpdate.maxAdvanceBookingDays = settingsData.settings.maxAdvanceBookingDays;
          }
          if (settingsData.settings.defaultCategoryLimit !== undefined) {
            settingsToUpdate.defaultCategoryLimit = settingsData.settings.defaultCategoryLimit;
          }
          if (settingsData.settings.loanReturnStartTime !== undefined) {
            settingsToUpdate.loanReturnStartTime = settingsData.settings.loanReturnStartTime;
          }
          if (settingsData.settings.loanReturnEndTime !== undefined) {
            settingsToUpdate.loanReturnEndTime = settingsData.settings.loanReturnEndTime;
          }
          if (settingsData.settings.discordEnabled !== undefined) {
            settingsToUpdate.discordEnabled = settingsData.settings.discordEnabled;
          }
          if (settingsData.settings.discordWebhookUrl !== undefined) {
            settingsToUpdate.discordWebhookUrl = settingsData.settings.discordWebhookUrl;
          }

          if (Object.keys(settingsToUpdate).length > 0) {
            await this.updateMultipleSettings(settingsToUpdate, adminId, adminName);
            importStats.settingsUpdated = Object.keys(settingsToUpdate).length;
          }
        }

        // Import closed dates
        if (settingsData.closedDates && Array.isArray(settingsData.closedDates)) {
          for (const closedDate of settingsData.closedDates) {
            try {
              const date = new Date(closedDate.date);
              await this.addClosedDate(
                date,
                closedDate.reason,
                adminId,
                closedDate.isRecurring || false,
                closedDate.recurringPattern || null
              );
              importStats.closedDatesAdded++;
            } catch (error) {
              importStats.errors.push(`Failed to import closed date ${closedDate.date}: ${error.message}`);
            }
          }
        }

        // Import category limits
        if (settingsData.categoryLimits && Array.isArray(settingsData.categoryLimits)) {
          for (const categoryLimit of settingsData.categoryLimits) {
            try {
              await this.setCategoryLimit(
                categoryLimit.categoryId,
                categoryLimit.categoryName,
                categoryLimit.limit,
                adminId
              );
              importStats.categoryLimitsUpdated++;
            } catch (error) {
              importStats.errors.push(`Failed to import category limit ${categoryLimit.categoryId}: ${error.message}`);
            }
          }
        }

        // Log the import action
        await this._logChange({
          adminId,
          adminName,
          action: 'import',
          settingType: 'settings_import',
          settingPath: 'settings/import',
          oldValue: null,
          newValue: importStats
        });

        return {
          success: true,
          backup,
          stats: importStats
        };
      } catch (error) {
        // If import fails, we have a backup
        console.error('Error during import, backup available:', backup.id);
        throw error;
      }
    } catch (error) {
      console.error('Error importing settings:', error);
      throw error;
    }
  }

  /**
   * Create backup of current settings
   * Requirements: 9.3
   * @param {string} adminId - Admin user ID creating backup
   * @param {string} adminName - Admin display name
   * @returns {Promise<Object>} Backup object with ID
   */
  async createBackup(adminId = 'system', adminName = 'System') {
    try {
      // Export all settings (including sensitive data for backup)
      const backupData = await this.exportSettings(true, adminId, adminName);
      
      // Add backup-specific metadata
      backupData.metadata.isBackup = true;
      backupData.metadata.backupDate = new Date().toISOString();
      backupData.metadata.backupBy = adminName;

      // Store backup in a special collection
      const backupsRef = collection(db, 'settingsBackups');
      const backupDoc = await addDoc(backupsRef, {
        ...backupData,
        createdAt: serverTimestamp(),
        createdBy: adminId
      });

      // Log the backup creation
      await this._logChange({
        adminId,
        adminName,
        action: 'backup',
        settingType: 'settings_backup',
        settingPath: `settingsBackups/${backupDoc.id}`,
        oldValue: null,
        newValue: { backupId: backupDoc.id }
      });

      return {
        id: backupDoc.id,
        ...backupData
      };
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }

  /**
   * Validate import data structure
   * Requirements: 9.2, 9.4
   * @private
   * @param {Object} data - Import data to validate
   * @returns {Object} Validation result
   */
  _validateImportData(data) {
    const errors = [];

    // Check for required metadata
    if (!data.metadata) {
      errors.push('Missing metadata section');
    }

    // Validate settings section
    if (data.settings) {
      if (data.settings.maxLoanDuration !== undefined) {
        if (typeof data.settings.maxLoanDuration !== 'number' || 
            data.settings.maxLoanDuration < 1 || 
            data.settings.maxLoanDuration > 365) {
          errors.push('Invalid maxLoanDuration: must be between 1 and 365');
        }
      }

      if (data.settings.maxAdvanceBookingDays !== undefined) {
        if (typeof data.settings.maxAdvanceBookingDays !== 'number' || 
            data.settings.maxAdvanceBookingDays < 1 || 
            data.settings.maxAdvanceBookingDays > 365) {
          errors.push('Invalid maxAdvanceBookingDays: must be between 1 and 365');
        }
      }

      if (data.settings.defaultCategoryLimit !== undefined) {
        if (typeof data.settings.defaultCategoryLimit !== 'number' || 
            data.settings.defaultCategoryLimit < 1 || 
            data.settings.defaultCategoryLimit > 100) {
          errors.push('Invalid defaultCategoryLimit: must be between 1 and 100');
        }
      }

      const isValidTimeString = (value) => typeof value === 'string' && /^\d{2}:\d{2}$/.test(value);

      if (data.settings.loanReturnStartTime !== undefined && data.settings.loanReturnStartTime !== null) {
        if (!isValidTimeString(data.settings.loanReturnStartTime)) {
          errors.push('Invalid loanReturnStartTime: must be HH:mm or null');
        }
      }
      if (data.settings.loanReturnEndTime !== undefined && data.settings.loanReturnEndTime !== null) {
        if (!isValidTimeString(data.settings.loanReturnEndTime)) {
          errors.push('Invalid loanReturnEndTime: must be HH:mm or null');
        }
      }
      if (
        data.settings.loanReturnStartTime &&
        data.settings.loanReturnEndTime &&
        isValidTimeString(data.settings.loanReturnStartTime) &&
        isValidTimeString(data.settings.loanReturnEndTime)
      ) {
        if (data.settings.loanReturnStartTime >= data.settings.loanReturnEndTime) {
          errors.push('Invalid return time window: start must be before end');
        }
      }

      if (data.settings.discordEnabled !== undefined) {
        if (typeof data.settings.discordEnabled !== 'boolean') {
          errors.push('Invalid discordEnabled: must be boolean');
        }
      }

      if (data.settings.discordWebhookUrl !== undefined && 
          data.settings.discordWebhookUrl !== null && 
          data.settings.discordWebhookUrl !== '') {
        if (typeof data.settings.discordWebhookUrl !== 'string' || 
            !data.settings.discordWebhookUrl.startsWith('https://discord.com/api/webhooks/')) {
          errors.push('Invalid discordWebhookUrl: must be a valid Discord webhook URL');
        }
      }
    }

    // Validate closed dates
    if (data.closedDates) {
      if (!Array.isArray(data.closedDates)) {
        errors.push('closedDates must be an array');
      } else {
        data.closedDates.forEach((cd, index) => {
          if (!cd.date) {
            errors.push(`closedDates[${index}]: missing date`);
          } else {
            const date = new Date(cd.date);
            if (isNaN(date.getTime())) {
              errors.push(`closedDates[${index}]: invalid date format`);
            }
          }
          if (!cd.reason || typeof cd.reason !== 'string') {
            errors.push(`closedDates[${index}]: missing or invalid reason`);
          }
        });
      }
    }

    // Validate category limits
    if (data.categoryLimits) {
      if (!Array.isArray(data.categoryLimits)) {
        errors.push('categoryLimits must be an array');
      } else {
        data.categoryLimits.forEach((cl, index) => {
          if (!cl.categoryId || typeof cl.categoryId !== 'string') {
            errors.push(`categoryLimits[${index}]: missing or invalid categoryId`);
          }
          if (!cl.categoryName || typeof cl.categoryName !== 'string') {
            errors.push(`categoryLimits[${index}]: missing or invalid categoryName`);
          }
          if (typeof cl.limit !== 'number' || cl.limit < 1 || !Number.isInteger(cl.limit)) {
            errors.push(`categoryLimits[${index}]: limit must be a positive integer (minimum 1)`);
          }
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Private helper: Validate a single setting
   * @private
   * @param {string} key - Setting key
   * @param {*} value - Setting value
   * @returns {Promise<Object>} Validation result
   */
  async _validateSetting(key, value) {
    // Import validation functions dynamically to avoid circular dependencies
    const {
      validateLoanDuration,
      validateAdvanceBookingDays,
      validateCategoryLimit,
      validateDiscordWebhookUrl
    } = await import('../utils/settingsValidation.js');

    const validateTimeString = (value) => {
      if (value === null || value === undefined || value === '') {
        return { isValid: true, error: null };
      }
      const isValid = typeof value === 'string' && /^\d{2}:\d{2}$/.test(value);
      return isValid
        ? { isValid: true, error: null }
        : { isValid: false, error: 'Invalid time format (HH:mm)' };
    };

    switch (key) {
      case 'maxLoanDuration':
        return validateLoanDuration(value);
      case 'maxAdvanceBookingDays':
        return validateAdvanceBookingDays(value);
      case 'defaultCategoryLimit':
        return validateCategoryLimit(value);
      case 'loanReturnStartTime':
      case 'loanReturnEndTime':
        return validateTimeString(value);
      case 'discordWebhookUrl':
        return value === null || value === '' 
          ? { isValid: true, error: null }
          : validateDiscordWebhookUrl(value);
      case 'discordEnabled':
        return typeof value === 'boolean'
          ? { isValid: true, error: null }
          : { isValid: false, error: 'discordEnabled must be a boolean' };
      default:
        // Allow other fields without validation
        return { isValid: true, error: null };
    }
  }

  /**
   * Private helper: Log a setting change
   * @private
   * @param {Object} change - Change details
   * @returns {Promise<void>}
   */
  async _logChange(change) {
    try {
      await this.logSettingChange(change);
    } catch (error) {
      // Log error but don't fail the operation
      console.error('Error logging setting change:', error);
    }
  }

  /**
   * Private helper: Notify about critical setting changes
   * Requirements: 8.5
   * @private
   * @param {Object} change - Change details
   * @returns {Promise<void>}
   */
  async _notifyCriticalSettingChange(change) {
    try {
      // Import CRITICAL_SETTINGS from types
      const { CRITICAL_SETTINGS } = await import('../types/settings.js');
      
      // Check if this is a critical setting
      const isCritical = CRITICAL_SETTINGS.includes(change.settingType) ||
                        change.settingType === 'closedDate' ||
                        change.settingType === 'categoryLimit';

      if (!isCritical) {
        return;
      }

      // Send Discord notification
      const discordWebhookService = (await import('./discordWebhookService.js')).default;
      await discordWebhookService.notifyCriticalSettingChange({
        settingName: change.settingType,
        adminName: change.adminName,
        oldValue: change.oldValue,
        newValue: change.newValue,
        reason: change.reason
      });

      // Send notification to all administrators
      const { collection: firestoreCollection, query, where, getDocs } = await import('firebase/firestore');
      const usersRef = firestoreCollection(db, 'users');
      const adminsQuery = query(usersRef, where('role', '==', 'admin'));
      const adminsSnapshot = await getDocs(adminsQuery);

      const NotificationService = (await import('./notificationService.js')).default;
      const notificationPromises = [];

      adminsSnapshot.forEach((adminDoc) => {
        const admin = adminDoc.data();
        
        // Format title and message based on setting type
        let title, message;
        
        if (change.settingType === 'closedDate') {
          if (change.action === 'create') {
            title = 'เพิ่มวันปิดทำการใหม่';
            const dateStr = change.newValue?.date ? new Date(change.newValue.date.seconds * 1000).toLocaleDateString('th-TH') : 'N/A';
            const reason = change.newValue?.reason || 'ไม่ระบุเหตุผล';
            message = `${change.adminName} เพิ่มวันปิดทำการ: ${dateStr} (${reason})`;
          } else if (change.action === 'delete') {
            title = 'ลบวันปิดทำการ';
            const dateStr = change.oldValue?.date ? new Date(change.oldValue.date.seconds * 1000).toLocaleDateString('th-TH') : 'N/A';
            message = `${change.adminName} ลบวันปิดทำการ: ${dateStr}`;
          } else {
            title = 'แก้ไขวันปิดทำการ';
            message = `${change.adminName} แก้ไขวันปิดทำการ`;
          }
        } else if (change.settingType === 'categoryLimit') {
          title = 'อัปเดตขอบเขตหมวดหมู่';
          message = `${change.adminName} เปลี่ยนขอบเขตหมวดหมู่จาก ${this._formatValue(change.oldValue)} เป็น ${this._formatValue(change.newValue)}`;
        } else {
          // For other critical settings
          title = `การตั้งค่าสำคัญถูกเปลี่ยนแปลง: ${this._formatSettingName(change.settingType)}`;
          message = `${change.adminName} เปลี่ยน ${this._formatSettingName(change.settingType)} จาก ${this._formatValue(change.oldValue)} เป็น ${this._formatValue(change.newValue)}`;
        }
        
        // Prepare notification data, excluding undefined values
        const notificationData = {
          settingType: change.settingType,
          action: change.action,
          changedBy: change.adminName
        };
        
        // Only include reason if it's defined
        if (change.reason !== undefined && change.reason !== null) {
          notificationData.reason = change.reason;
        }
        
        notificationPromises.push(
          NotificationService.createNotification(
            admin.uid,
            'critical_setting_change',
            title,
            message,
            notificationData
          )
        );
      });

      await Promise.all(notificationPromises);
    } catch (error) {
      // Log error but don't fail the operation
      console.error('Error sending critical setting change notification:', error);
    }
  }

  /**
   * Private helper: Format setting name for display
   * @private
   * @param {string} settingType - Setting type
   * @returns {string} Formatted setting name
   */
  _formatSettingName(settingType) {
    const settingNames = {
      maxLoanDuration: 'ระยะเวลายืมสูงสุด',
      maxAdvanceBookingDays: 'จำนวนวันจองล่วงหน้าสูงสุด',
      defaultCategoryLimit: 'จำนวนรายการต่อหมวดหมู่เริ่มต้น',
      discordEnabled: 'การแจ้งเตือน Discord',
      discordWebhookUrl: 'Discord Webhook URL',
      closedDate: 'วันปิดทำการ',
      categoryLimit: 'ขอบเขตหมวดหมู่'
    };
    
    return settingNames[settingType] || settingType;
  }

  /**
   * Private helper: Format value for display
   * @private
   * @param {*} value - Value to format
   * @returns {string} Formatted value
   */
  _formatValue(value) {
    if (value === null || value === undefined) {
      return 'ไม่ระบุ';
    }

    if (typeof value === 'boolean') {
      return value ? 'เปิดใช้งาน' : 'ปิดใช้งาน';
    }

    if (typeof value === 'number') {
      return `${value} วัน`;
    }

    if (typeof value === 'object') {
      // Don't show raw JSON for objects
      return '[ข้อมูลซับซ้อน]';
    }

    return String(value);
  }

  /**
   * Private helper: Check if error is retryable
   * @private
   * @param {Error} error - Error to check
   * @returns {boolean} True if error is retryable
   */
  _isRetryableError(error) {
    const retryableErrors = [
      'unavailable',
      'deadline-exceeded',
      'resource-exhausted',
      'aborted'
    ];
    
    return retryableErrors.some(code => 
      error.code === code || error.message?.toLowerCase().includes(code)
    );
  }

  /**
   * Private helper: Retry an operation with exponential backoff
   * @private
   * @param {Function} operation - Operation to retry
   * @param {number} maxRetries - Maximum number of retries
   * @param {number} delay - Initial delay in milliseconds
   * @returns {Promise<*>} Operation result
   */
  async _retryOperation(operation, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries || !this._isRetryableError(error)) {
          throw error;
        }
        
        // Exponential backoff
        const waitTime = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  /**
   * Create a system notification
   * Requirements: 7.1, 7.2, 7.3
   * @param {Object} notificationData - Notification data
   * @param {string} adminId - Admin user ID creating the notification
   * @returns {Promise<Object>} Created notification with stats
   */
  async createSystemNotification(notificationData, adminId) {
    try {
      const { title, content, type, priority, feedbackEnabled, feedbackQuestion, expiresAt } = notificationData;

      // Create notification document
      const notification = {
        title,
        content,
        type,
        priority,
        createdAt: serverTimestamp(),
        createdBy: adminId,
        expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null,
        feedbackEnabled: feedbackEnabled || false,
        feedbackQuestion: feedbackEnabled ? feedbackQuestion : null,
        sentTo: [],
        readBy: [],
        responses: []
      };

      const notificationsRef = collection(db, COLLECTIONS.SYSTEM_NOTIFICATIONS);
      const notificationRef = await addDoc(notificationsRef, notification);
      const notificationId = notificationRef.id;

      // Get all active users
      const usersRef = collection(db, 'users');
      const usersQuery = query(usersRef, where('status', '==', 'approved'));
      const usersSnapshot = await getDocs(usersQuery);

      const userIds = [];
      usersSnapshot.forEach((userDoc) => {
        userIds.push(userDoc.id);
      });

      // Update notification with sentTo list
      await updateDoc(doc(db, COLLECTIONS.SYSTEM_NOTIFICATIONS, notificationId), {
        sentTo: userIds
      });

      // Send individual notifications to all users via NotificationService
      const NotificationService = (await import('./notificationService')).default;
      const notificationPromises = userIds.map(userId =>
        NotificationService.createNotification(
          userId,
          'system_notification',
          title,
          content,
          {
            systemNotificationId: notificationId,
            priority,
            type,
            expiresAt: expiresAt ? expiresAt.toISOString() : null
          }
        )
      );

      await Promise.all(notificationPromises);

      return {
        id: notificationId,
        ...notification,
        sentCount: userIds.length
      };
    } catch (error) {
      console.error('Error creating system notification:', error);
      throw error;
    }
  }

  /**
   * Get all system notifications
   * Requirements: 7.5
   * @param {Object} filters - Optional filters (type, startDate, endDate)
   * @returns {Promise<Array>} Array of system notifications with stats
   */
  async getSystemNotifications(filters = {}) {
    try {
      const notificationsRef = collection(db, COLLECTIONS.SYSTEM_NOTIFICATIONS);
      let q = query(notificationsRef, orderBy('createdAt', 'desc'));

      // Apply filters
      if (filters.type) {
        q = query(notificationsRef, where('type', '==', filters.type), orderBy('createdAt', 'desc'));
      }

      if (filters.startDate && filters.endDate) {
        q = query(
          notificationsRef,
          where('createdAt', '>=', Timestamp.fromDate(filters.startDate)),
          where('createdAt', '<=', Timestamp.fromDate(filters.endDate)),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      const notifications = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        notifications.push({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          expiresAt: data.expiresAt?.toDate(),
          deliveryStats: {
            sent: data.sentTo?.length || 0,
            read: data.readBy?.length || 0,
            responded: data.responses?.length || 0
          }
        });
      });

      return notifications;
    } catch (error) {
      console.error('Error getting system notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread system notifications for a user
   * Requirements: 7.4
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of unread notifications
   */
  async getUnreadSystemNotifications(userId) {
    try {
      const notificationsRef = collection(db, COLLECTIONS.SYSTEM_NOTIFICATIONS);
      const now = Timestamp.now();

      // Get notifications where user is in sentTo but not in readBy
      const q = query(
        notificationsRef,
        where('sentTo', 'array-contains', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const unreadNotifications = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        
        // Check if user hasn't read it
        const isUnread = !data.readBy?.includes(userId);
        
        // Check if not expired
        const isNotExpired = !data.expiresAt || data.expiresAt.toMillis() > now.toMillis();

        if (isUnread && isNotExpired) {
          unreadNotifications.push({
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            expiresAt: data.expiresAt?.toDate()
          });
        }
      });

      return unreadNotifications;
    } catch (error) {
      console.error('Error getting unread system notifications:', error);
      throw error;
    }
  }

  /**
   * Mark system notification as read for a user
   * Requirements: 7.4
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async markSystemNotificationAsRead(notificationId, userId) {
    try {
      const notificationRef = doc(db, COLLECTIONS.SYSTEM_NOTIFICATIONS, notificationId);
      const notificationDoc = await getDoc(notificationRef);
      
      if (!notificationDoc.exists()) {
        throw new Error('Notification not found');
      }

      const data = notificationDoc.data();
      const readBy = data.readBy || [];
      
      if (!readBy.includes(userId)) {
        readBy.push(userId);
        await updateDoc(notificationRef, { readBy });
      }
    } catch (error) {
      console.error('Error marking system notification as read:', error);
      throw error;
    }
  }

  /**
   * Submit feedback response to system notification
   * Requirements: 7.6
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID
   * @param {string} response - User's response text
   * @returns {Promise<Object>} Feedback response object
   */
  async submitNotificationFeedback(notificationId, userId, response) {
    try {
      const notificationRef = doc(db, COLLECTIONS.SYSTEM_NOTIFICATIONS, notificationId);
      const notificationDoc = await getDoc(notificationRef);
      
      if (!notificationDoc.exists()) {
        throw new Error('Notification not found');
      }

      const data = notificationDoc.data();
      const responses = data.responses || [];
      
      const feedbackResponse = {
        userId,
        response,
        timestamp: Timestamp.now()
      };

      responses.push(feedbackResponse);
      await updateDoc(notificationRef, { responses });

      return feedbackResponse;
    } catch (error) {
      console.error('Error submitting notification feedback:', error);
      throw error;
    }
  }

  /**
   * Get aggregated feedback for a system notification
   * Requirements: 7.6
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} Feedback data with responses
   */
  async getNotificationFeedback(notificationId) {
    try {
      const notificationRef = doc(db, COLLECTIONS.SYSTEM_NOTIFICATIONS, notificationId);
      const notificationDoc = await getDoc(notificationRef);

      if (!notificationDoc.exists()) {
        throw new Error('Notification not found');
      }

      const data = notificationDoc.data();
      return {
        feedbackQuestion: data.feedbackQuestion,
        responses: data.responses || [],
        totalResponses: data.responses?.length || 0
      };
    } catch (error) {
      console.error('Error getting notification feedback:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new SettingsService();
