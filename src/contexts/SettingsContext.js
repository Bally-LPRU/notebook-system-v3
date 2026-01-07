/**
 * Settings Context
 * Provides centralized access to system settings with real-time updates
 * Based on admin-settings-system design document
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import settingsService from '../services/settingsService';
import settingsCache from '../utils/settingsCache';
import { DEFAULT_SETTINGS, DEFAULT_USER_TYPE_LIMITS } from '../types/settings';
import { useAuth } from './AuthContext';

const TEST_AUTH_FALLBACK = {
  user: {
    uid: 'test-admin',
    email: 'test@example.com',
    displayName: 'Test Admin'
  },
  authInitialized: true,
  loading: false
};

// Helper hook to gracefully fall back when AuthContext is not mounted during tests
const useSafeAuth = () => {
  try {
    return useAuth();
  } catch (error) {
    if (process.env.NODE_ENV === 'test') {
      return TEST_AUTH_FALLBACK;
    }
    throw error;
  }
};

/**
 * Settings Context
 * @type {React.Context<Object|null>}
 */
const SettingsContext = createContext(null);

/**
 * Settings Provider Component
 * 
 * Provides centralized access to system settings with:
 * - Real-time Firestore listeners for automatic updates
 * - In-memory caching for performance
 * - Loading and error states
 * - Utility functions for settings operations
 * 
 * **Usage:**
 * ```jsx
 * <SettingsProvider>
 *   <App />
 * </SettingsProvider>
 * ```
 * 
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Provider component
 */
export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [userTypeLimits, setUserTypeLimits] = useState(DEFAULT_USER_TYPE_LIMITS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, authInitialized } = useSafeAuth();

  /**
   * Initialize settings and set up real-time listener
   */
  useEffect(() => {
    let unsubscribeSettings = null;
    let unsubscribeUserTypeLimits = null;

    // Wait for auth to initialize so reads are authenticated
    if (!authInitialized) {
      return undefined;
    }

    // If signed out, reset to defaults and stop
    if (!user) {
      setSettings(DEFAULT_SETTINGS);
      setUserTypeLimits(DEFAULT_USER_TYPE_LIMITS);
      setLoading(false);
      setError(null);
      return undefined;
    }

    const initializeSettings = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to get from cache first
        const cachedSettings = settingsCache.get('systemSettings');
        if (cachedSettings) {
          setSettings(cachedSettings);
        }

        // Fetch from Firestore
        const fetchedSettings = await settingsService.getSettings();
        setSettings(fetchedSettings);
        
        // Update cache
        settingsCache.set('systemSettings', fetchedSettings);

        // Fetch user type limits
        try {
          const fetchedUserTypeLimits = await settingsService.getUserTypeLimits();
          if (fetchedUserTypeLimits && Object.keys(fetchedUserTypeLimits).length > 0) {
            setUserTypeLimits(fetchedUserTypeLimits);
            settingsCache.set('userTypeLimits', fetchedUserTypeLimits);
          }
        } catch (limitsError) {
          console.warn('Could not load user type limits, using defaults:', limitsError.message);
        }
        
        setLoading(false);

        // Set up real-time listener for settings
        const settingsRef = doc(db, 'settings', 'systemSettings');
        unsubscribeSettings = onSnapshot(
          settingsRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const updatedSettings = {
                ...snapshot.data(),
                id: snapshot.id
              };
              setSettings(updatedSettings);
              
              // Update cache
              settingsCache.set('systemSettings', updatedSettings);
            }
          },
          (err) => {
            // Log error but don't block the app
            console.warn('Settings listener error (non-critical):', err.message);
            // Don't set error state to avoid blocking UI
          }
        );

        // Set up real-time listener for user type limits
        const userTypeLimitsRef = collection(db, 'userTypeLimits');
        unsubscribeUserTypeLimits = onSnapshot(
          userTypeLimitsRef,
          (snapshot) => {
            const limits = {};
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              limits[docSnap.id] = {
                ...data,
                userType: docSnap.id,
                updatedAt: data.updatedAt?.toDate()
              };
            });
            if (Object.keys(limits).length > 0) {
              setUserTypeLimits(limits);
              settingsCache.set('userTypeLimits', limits);
            }
          },
          (err) => {
            // Log error but don't block the app
            console.warn('User type limits listener error (non-critical):', err.message);
          }
        );
      } catch (err) {
        // Log error but use default settings to not block the app
        console.warn('Settings initialization error (using defaults):', err.message);
        setSettings(DEFAULT_SETTINGS);
        setUserTypeLimits(DEFAULT_USER_TYPE_LIMITS);
        setLoading(false);
        // Don't set error state to avoid blocking UI
      }
    };

    initializeSettings();

    // Cleanup listeners on unmount or when user changes
    return () => {
      if (unsubscribeSettings) {
        unsubscribeSettings();
      }
      if (unsubscribeUserTypeLimits) {
        unsubscribeUserTypeLimits();
      }
    };
  }, [authInitialized, user]);

  /**
   * Update a single setting
   * @param {string} key - Setting key
   * @param {*} value - Setting value
   * @param {string} adminId - Admin user ID
   * @param {string} adminName - Admin display name
   * @returns {Promise<void>}
   */
  const updateSetting = useCallback(async (key, value, adminId, adminName) => {
    try {
      await settingsService.updateSetting(key, value, adminId, adminName);
      
      // Invalidate cache to force refresh
      settingsCache.invalidate('systemSettings');
      
      // Optimistically update local state
      setSettings(prev => ({
        ...prev,
        [key]: value
      }));
    } catch (err) {
      console.error('Error updating setting:', err);
      throw err;
    }
  }, []);

  /**
   * Update multiple settings at once
   * @param {Object} settingsToUpdate - Settings object with key-value pairs
   * @param {string} adminId - Admin user ID
   * @param {string} adminName - Admin display name
   * @returns {Promise<void>}
   */
  const updateMultipleSettings = useCallback(async (settingsToUpdate, adminId, adminName) => {
    try {
      await settingsService.updateMultipleSettings(settingsToUpdate, adminId, adminName);
      
      // Invalidate cache to force refresh
      settingsCache.invalidate('systemSettings');
      
      // Optimistically update local state
      setSettings(prev => ({
        ...prev,
        ...settingsToUpdate
      }));
    } catch (err) {
      console.error('Error updating multiple settings:', err);
      throw err;
    }
  }, []);

  /**
   * Refresh settings from Firestore
   * @returns {Promise<void>}
   */
  const refreshSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Invalidate cache
      settingsCache.invalidate('systemSettings');
      settingsCache.invalidate('userTypeLimits');
      
      // Fetch fresh data
      const fetchedSettings = await settingsService.getSettings();
      setSettings(fetchedSettings);
      
      // Update cache
      settingsCache.set('systemSettings', fetchedSettings);

      // Fetch user type limits
      try {
        const fetchedUserTypeLimits = await settingsService.getUserTypeLimits();
        if (fetchedUserTypeLimits && Object.keys(fetchedUserTypeLimits).length > 0) {
          setUserTypeLimits(fetchedUserTypeLimits);
          settingsCache.set('userTypeLimits', fetchedUserTypeLimits);
        }
      } catch (limitsError) {
        console.warn('Could not refresh user type limits:', limitsError.message);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error refreshing settings:', err);
      setError(err);
      setLoading(false);
      throw err;
    }
  }, []);

  /**
   * Get a specific setting value
   * @param {string} key - Setting key
   * @param {*} defaultValue - Default value if setting not found
   * @returns {*} Setting value
   */
  const getSetting = useCallback((key, defaultValue = null) => {
    return settings[key] !== undefined ? settings[key] : defaultValue;
  }, [settings]);

  const value = {
    // State
    settings: {
      ...settings,
      userTypeLimits // Include userTypeLimits in settings object
    },
    userTypeLimits, // Also expose separately for direct access
    loading,
    error,
    
    // Actions
    updateSetting,
    updateMultipleSettings,
    refreshSettings,
    
    // Utilities
    getSetting
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

/**
 * Hook to access settings context
 * 
 * Provides access to centralized settings data and operations.
 * Must be used within a SettingsProvider or will throw an error.
 * 
 * **Usage:**
 * ```jsx
 * function MyComponent() {
 *   const { settings, userTypeLimits, loading, error, updateSetting } = useSettings();
 *   
 *   if (loading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *   
 *   return (
 *     <div>
 *       <p>Max Loan Duration: {settings.maxLoanDuration} days</p>
 *       <button onClick={() => updateSetting('maxLoanDuration', 21, adminId, adminName)}>
 *         Update
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @hook
 * @throws {Error} If used outside of SettingsProvider
 * @returns {Object} Settings context value
 * @returns {Object} returns.settings - System settings object (includes userTypeLimits)
 * @returns {Object} returns.userTypeLimits - User type limits object (direct access)
 * @returns {boolean} returns.loading - Loading state
 * @returns {Error|null} returns.error - Error object if loading failed
 * @returns {Function} returns.updateSetting - Update a single setting
 * @returns {Function} returns.updateMultipleSettings - Update multiple settings
 * @returns {Function} returns.refreshSettings - Manually refresh settings
 * @returns {Function} returns.getSetting - Get a specific setting value
 */
export const useSettings = () => {
  const context = useContext(SettingsContext);
  
  if (context === null) {
    throw new Error(
      'useSettings must be used within a SettingsProvider. ' +
      'Please wrap your component tree with <SettingsProvider>.'
    );
  }
  
  return context;
};

export default SettingsContext;
