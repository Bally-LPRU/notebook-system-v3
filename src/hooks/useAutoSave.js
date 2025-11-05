import { useEffect, useRef, useCallback, useState } from 'react';

const useAutoSave = ({
  data,
  saveFunction,
  delay = 2000,
  enabled = true,
  storageKey = null,
  onSaveStart = null,
  onSaveSuccess = null,
  onSaveError = null
}) => {
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved, error
  const [lastSaved, setLastSaved] = useState(null);
  const timeoutRef = useRef(null);
  const previousDataRef = useRef(data);
  const isInitialMount = useRef(true);

  // Save to localStorage
  const saveToLocalStorage = useCallback((dataToSave) => {
    if (storageKey && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          data: dataToSave,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.warn('Failed to save to localStorage:', error);
      }
    }
  }, [storageKey]);

  // Load from localStorage
  const loadFromLocalStorage = useCallback(() => {
    if (storageKey && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            data: parsed.data,
            timestamp: parsed.timestamp
          };
        }
      } catch (error) {
        console.warn('Failed to load from localStorage:', error);
      }
    }
    return null;
  }, [storageKey]);

  // Clear localStorage
  const clearLocalStorage = useCallback(() => {
    if (storageKey && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.warn('Failed to clear localStorage:', error);
      }
    }
  }, [storageKey]);

  // Perform save operation
  const performSave = useCallback(async (dataToSave) => {
    if (!enabled || !saveFunction) return;

    setSaveStatus('saving');
    if (onSaveStart) onSaveStart();

    try {
      await saveFunction(dataToSave);
      setSaveStatus('saved');
      setLastSaved(new Date());
      if (onSaveSuccess) onSaveSuccess();
      
      // Clear localStorage after successful save
      clearLocalStorage();
      
      // Reset to idle after showing saved status
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (error) {
      setSaveStatus('error');
      if (onSaveError) onSaveError(error);
      
      // Save to localStorage as backup
      saveToLocalStorage(dataToSave);
      
      // Reset to idle after showing error status
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    }
  }, [enabled, saveFunction, onSaveStart, onSaveSuccess, onSaveError, clearLocalStorage, saveToLocalStorage]);

  // Manual save function
  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    performSave(data);
  }, [data, performSave]);

  // Check if data has changed
  const hasDataChanged = useCallback((newData, oldData) => {
    return JSON.stringify(newData) !== JSON.stringify(oldData);
  }, []);

  // Auto-save effect
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      previousDataRef.current = data;
      return;
    }

    // Skip if not enabled or no save function
    if (!enabled || !saveFunction) {
      previousDataRef.current = data;
      return;
    }

    // Check if data has actually changed
    if (!hasDataChanged(data, previousDataRef.current)) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Save to localStorage immediately for backup
    saveToLocalStorage(data);

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(() => {
      performSave(data);
    }, delay);

    // Update previous data reference
    previousDataRef.current = data;

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, enabled, saveFunction, delay, hasDataChanged, performSave, saveToLocalStorage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    saveStatus,
    lastSaved,
    saveNow,
    loadFromLocalStorage,
    clearLocalStorage,
    isAutoSaveEnabled: enabled && !!saveFunction
  };
};

export default useAutoSave;