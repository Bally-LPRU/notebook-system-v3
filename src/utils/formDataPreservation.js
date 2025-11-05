/**
 * Form Data Preservation Utility
 * Handles automatic saving and restoration of form data during network failures
 */

import { logError } from './errorLogger';

const STORAGE_KEY_PREFIX = 'preserved_form_data_';
const STORAGE_EXPIRY_HOURS = 24; // Data expires after 24 hours

/**
 * Form Data Preservation Manager
 */
export class FormDataPreserver {
  constructor(formId, options = {}) {
    this.formId = formId;
    this.storageKey = `${STORAGE_KEY_PREFIX}${formId}`;
    this.options = {
      autoSave: true,
      saveInterval: 30000, // 30 seconds
      excludeFields: ['password', 'confirmPassword', 'token'],
      includeTimestamp: true,
      ...options
    };
    
    this.autoSaveInterval = null;
    this.lastSaveTime = null;
  }

  /**
   * Start automatic form data preservation
   */
  startAutoSave(formElement) {
    if (!this.options.autoSave || this.autoSaveInterval) {
      return;
    }

    this.autoSaveInterval = setInterval(() => {
      this.saveFormData(formElement);
    }, this.options.saveInterval);

    // Also save on form input changes (debounced)
    this.setupInputListeners(formElement);

    logError({
      type: 'form_data_preservation_started',
      context: {
        formId: this.formId,
        saveInterval: this.options.saveInterval
      },
      severity: 'info'
    });
  }

  /**
   * Stop automatic form data preservation
   */
  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }

    logError({
      type: 'form_data_preservation_stopped',
      context: {
        formId: this.formId
      },
      severity: 'info'
    });
  }

  /**
   * Setup input listeners for real-time saving
   */
  setupInputListeners(formElement) {
    if (!formElement) return;

    let debounceTimeout = null;

    const handleInput = () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }

      debounceTimeout = setTimeout(() => {
        this.saveFormData(formElement);
      }, 2000); // 2 second debounce
    };

    // Add listeners to all form inputs
    const inputs = formElement.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('input', handleInput);
      input.addEventListener('change', handleInput);
    });

    // Store cleanup function
    this.cleanupListeners = () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      inputs.forEach(input => {
        input.removeEventListener('input', handleInput);
        input.removeEventListener('change', handleInput);
      });
    };
  }

  /**
   * Save form data to localStorage
   */
  saveFormData(formElement) {
    try {
      if (!formElement) {
        console.warn('Form element not provided for data preservation');
        return false;
      }

      const formData = this.extractFormData(formElement);
      
      // Don't save if no data or data hasn't changed
      if (Object.keys(formData).length === 0) {
        return false;
      }

      const preservedData = {
        formId: this.formId,
        data: formData,
        timestamp: Date.now(),
        expiresAt: Date.now() + (STORAGE_EXPIRY_HOURS * 60 * 60 * 1000),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      localStorage.setItem(this.storageKey, JSON.stringify(preservedData));
      this.lastSaveTime = Date.now();

      logError({
        type: 'form_data_saved',
        context: {
          formId: this.formId,
          fieldCount: Object.keys(formData).length,
          timestamp: this.lastSaveTime
        },
        severity: 'info'
      });

      return true;
    } catch (error) {
      logError({
        type: 'form_data_save_error',
        error: error,
        context: {
          formId: this.formId
        },
        severity: 'medium'
      });
      return false;
    }
  }

  /**
   * Extract form data from form element
   */
  extractFormData(formElement) {
    const formData = {};
    
    const inputs = formElement.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
      const { name, type, value, checked } = input;
      
      // Skip excluded fields
      if (!name || this.options.excludeFields.includes(name)) {
        return;
      }

      // Handle different input types
      if (type === 'checkbox') {
        formData[name] = checked;
      } else if (type === 'radio') {
        if (checked) {
          formData[name] = value;
        }
      } else if (type === 'file') {
        // Don't preserve file inputs for security reasons
        return;
      } else {
        formData[name] = value;
      }
    });

    return formData;
  }

  /**
   * Restore form data from localStorage
   */
  restoreFormData(formElement) {
    try {
      const preservedDataStr = localStorage.getItem(this.storageKey);
      
      if (!preservedDataStr) {
        return null;
      }

      const preservedData = JSON.parse(preservedDataStr);
      
      // Check if data has expired
      if (Date.now() > preservedData.expiresAt) {
        this.clearPreservedData();
        return null;
      }

      // Restore data to form
      if (formElement && preservedData.data) {
        this.populateForm(formElement, preservedData.data);
        
        logError({
          type: 'form_data_restored',
          context: {
            formId: this.formId,
            fieldCount: Object.keys(preservedData.data).length,
            savedAt: preservedData.timestamp
          },
          severity: 'info'
        });

        return preservedData.data;
      }

      return preservedData.data;
    } catch (error) {
      logError({
        type: 'form_data_restore_error',
        error: error,
        context: {
          formId: this.formId
        },
        severity: 'medium'
      });
      return null;
    }
  }

  /**
   * Populate form with preserved data
   */
  populateForm(formElement, data) {
    Object.entries(data).forEach(([name, value]) => {
      const input = formElement.querySelector(`[name="${name}"]`);
      
      if (!input) return;

      const { type } = input;

      if (type === 'checkbox') {
        input.checked = Boolean(value);
      } else if (type === 'radio') {
        if (input.value === value) {
          input.checked = true;
        }
      } else {
        input.value = value;
      }

      // Trigger change event to update any React state
      const event = new Event('change', { bubbles: true });
      input.dispatchEvent(event);
    });
  }

  /**
   * Get preserved data without restoring
   */
  getPreservedData() {
    try {
      const preservedDataStr = localStorage.getItem(this.storageKey);
      
      if (!preservedDataStr) {
        return null;
      }

      const preservedData = JSON.parse(preservedDataStr);
      
      // Check if data has expired
      if (Date.now() > preservedData.expiresAt) {
        this.clearPreservedData();
        return null;
      }

      return preservedData;
    } catch (error) {
      console.warn('Error getting preserved data:', error);
      return null;
    }
  }

  /**
   * Check if preserved data exists
   */
  hasPreservedData() {
    const data = this.getPreservedData();
    return data && data.data && Object.keys(data.data).length > 0;
  }

  /**
   * Clear preserved data
   */
  clearPreservedData() {
    try {
      localStorage.removeItem(this.storageKey);
      
      logError({
        type: 'form_data_cleared',
        context: {
          formId: this.formId
        },
        severity: 'info'
      });

      return true;
    } catch (error) {
      console.warn('Error clearing preserved data:', error);
      return false;
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stopAutoSave();
    
    if (this.cleanupListeners) {
      this.cleanupListeners();
    }
  }
}

/**
 * Utility functions for form data preservation
 */

/**
 * Create a form data preserver instance
 */
export const createFormPreserver = (formId, options = {}) => {
  return new FormDataPreserver(formId, options);
};

/**
 * Quick save form data
 */
export const saveFormData = (formId, formElement) => {
  const preserver = new FormDataPreserver(formId);
  return preserver.saveFormData(formElement);
};

/**
 * Quick restore form data
 */
export const restoreFormData = (formId, formElement) => {
  const preserver = new FormDataPreserver(formId);
  return preserver.restoreFormData(formElement);
};

/**
 * Check if form has preserved data
 */
export const hasPreservedFormData = (formId) => {
  const preserver = new FormDataPreserver(formId);
  return preserver.hasPreservedData();
};

/**
 * Clear preserved form data
 */
export const clearPreservedFormData = (formId) => {
  const preserver = new FormDataPreserver(formId);
  return preserver.clearPreservedData();
};

/**
 * Clean up expired form data from localStorage
 */
export const cleanupExpiredFormData = () => {
  try {
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          
          if (data.expiresAt && Date.now() > data.expiresAt) {
            keysToRemove.push(key);
          }
        } catch (error) {
          // Invalid data, remove it
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    if (keysToRemove.length > 0) {
      logError({
        type: 'expired_form_data_cleanup',
        context: {
          removedCount: keysToRemove.length
        },
        severity: 'info'
      });
    }

    return keysToRemove.length;
  } catch (error) {
    console.warn('Error cleaning up expired form data:', error);
    return 0;
  }
};

// Auto-cleanup expired data on module load
cleanupExpiredFormData();

export default FormDataPreserver;