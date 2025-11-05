import { useState, useCallback } from 'react';
import DuplicateDetectionService from '../services/duplicateDetectionService';

/**
 * Hook for managing duplicate detection in forms
 * Implements requirements 8.1, 8.2, 8.4
 */
const useDuplicateDetection = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Check for duplicate profiles
   * @param {string} email - Email address to check
   * @param {string} phoneNumber - Phone number to check (optional)
   * @returns {Promise<Object>} - Duplicate detection result
   */
  const checkDuplicates = useCallback(async (email, phoneNumber = null) => {
    if (!email) {
      setError('Email is required for duplicate detection');
      return null;
    }

    setIsChecking(true);
    setError(null);
    setDuplicateResult(null);

    try {
      const result = await DuplicateDetectionService.detectDuplicates(email, phoneNumber);
      setDuplicateResult(result);
      return result;
    } catch (err) {
      console.error('Duplicate detection error:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล');
      return null;
    } finally {
      setIsChecking(false);
    }
  }, []);

  /**
   * Check if email exists in the system
   * @param {string} email - Email address to check
   * @returns {Promise<Object|null>} - User profile if exists
   */
  const checkEmailExists = useCallback(async (email) => {
    if (!email) return null;

    setIsChecking(true);
    setError(null);

    try {
      const profile = await DuplicateDetectionService.checkProfileByEmail(email);
      return profile;
    } catch (err) {
      console.error('Email check error:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการตรวจสอบอีเมล');
      return null;
    } finally {
      setIsChecking(false);
    }
  }, []);

  /**
   * Get recommended action based on duplicate detection result
   * @param {Object} result - Duplicate detection result
   * @returns {string} - Recommended action
   */
  const getRecommendedAction = useCallback((result) => {
    if (!result || !result.hasDuplicate) return 'create_new';
    return DuplicateDetectionService.getRecommendedAction(result.existingProfile);
  }, []);

  /**
   * Get user-friendly message for duplicate detection result
   * @param {Object} result - Duplicate detection result
   * @returns {string} - User-friendly message
   */
  const getDuplicateMessage = useCallback((result) => {
    if (!result || !result.hasDuplicate) return '';
    return DuplicateDetectionService.getDuplicateMessage(result.existingProfile);
  }, []);

  /**
   * Get dashboard route for existing profile
   * @param {Object} profile - User profile
   * @returns {string} - Dashboard route
   */
  const getDashboardRoute = useCallback((profile) => {
    return DuplicateDetectionService.getDashboardRoute(profile);
  }, []);

  /**
   * Clear duplicate detection state
   */
  const clearState = useCallback(() => {
    setDuplicateResult(null);
    setError(null);
    setIsChecking(false);
  }, []);

  /**
   * Check if profile has complete information
   * @param {Object} profile - User profile
   * @returns {boolean} - True if profile is complete
   */
  const hasCompleteProfile = useCallback((profile) => {
    return DuplicateDetectionService.hasCompleteProfile(profile);
  }, []);

  return {
    // State
    isChecking,
    duplicateResult,
    error,
    
    // Actions
    checkDuplicates,
    checkEmailExists,
    clearState,
    
    // Helpers
    getRecommendedAction,
    getDuplicateMessage,
    getDashboardRoute,
    hasCompleteProfile,
    
    // Computed properties
    hasDuplicate: duplicateResult?.hasDuplicate || false,
    duplicateType: duplicateResult?.duplicateType || null,
    existingProfile: duplicateResult?.existingProfile || null,
    recommendedAction: duplicateResult ? getRecommendedAction(duplicateResult) : null
  };
};

export default useDuplicateDetection;