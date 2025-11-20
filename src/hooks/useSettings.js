/**
 * useSettings Hook
 * Custom hook for accessing system settings
 * Based on admin-settings-system design document
 * 
 * Requirements: 1.2
 */

import { useContext, useCallback } from 'react';
import SettingsContext from '../contexts/SettingsContext';

/**
 * Hook to access settings context
 * 
 * Provides access to centralized settings data and operations.
 * Must be used within a SettingsProvider or will throw an error.
 * 
 * **Features:**
 * - Access to all system settings
 * - Loading and error states
 * - Refresh functionality
 * - Update operations
 * 
 * **Usage:**
 * ```jsx
 * function MyComponent() {
 *   const { settings, loading, error, updateSetting, refreshSettings } = useSettings();
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
 *       <button onClick={refreshSettings}>
 *         Refresh Settings
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @hook
 * @throws {Error} If used outside of SettingsProvider
 * @returns {Object} Settings context value
 * @returns {Object} returns.settings - System settings object
 * @returns {boolean} returns.loading - Loading state
 * @returns {Error|null} returns.error - Error object if loading failed
 * @returns {Function} returns.updateSetting - Update a single setting
 * @returns {Function} returns.updateMultipleSettings - Update multiple settings
 * @returns {Function} returns.refreshSettings - Manually refresh settings from Firestore
 * @returns {Function} returns.getSetting - Get a specific setting value with optional default
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

export default useSettings;
