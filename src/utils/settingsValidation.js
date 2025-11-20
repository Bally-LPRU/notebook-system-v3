/**
 * Settings Validation Utility
 * Provides validation functions for all setting types
 * Based on admin-settings-system design document
 */

import { SETTINGS_VALIDATION } from '../types/settings';

/**
 * Validation result structure
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether validation passed
 * @property {string|null} error - Error message if validation failed
 */

/**
 * Validate loan duration setting
 * @param {number} value - Loan duration in days
 * @returns {ValidationResult}
 */
export function validateLoanDuration(value) {
  if (typeof value !== 'number') {
    return {
      isValid: false,
      error: 'Loan duration must be a number'
    };
  }
  
  if (!Number.isInteger(value)) {
    return {
      isValid: false,
      error: 'Loan duration must be an integer'
    };
  }
  
  const { min, max } = SETTINGS_VALIDATION.maxLoanDuration;
  
  if (value < min || value > max) {
    return {
      isValid: false,
      error: `Loan duration must be between ${min} and ${max} days`
    };
  }
  
  return { isValid: true, error: null };
}

/**
 * Validate advance booking period setting
 * @param {number} value - Advance booking period in days
 * @returns {ValidationResult}
 */
export function validateAdvanceBookingDays(value) {
  if (typeof value !== 'number') {
    return {
      isValid: false,
      error: 'Advance booking period must be a number'
    };
  }
  
  if (!Number.isInteger(value)) {
    return {
      isValid: false,
      error: 'Advance booking period must be an integer'
    };
  }
  
  const { min, max } = SETTINGS_VALIDATION.maxAdvanceBookingDays;
  
  if (value < min || value > max) {
    return {
      isValid: false,
      error: `Advance booking period must be between ${min} and ${max} days`
    };
  }
  
  return { isValid: true, error: null };
}

/**
 * Validate category limit setting
 * @param {number} value - Category limit
 * @returns {ValidationResult}
 */
export function validateCategoryLimit(value) {
  if (typeof value !== 'number') {
    return {
      isValid: false,
      error: 'Category limit must be a number'
    };
  }
  
  if (!Number.isInteger(value)) {
    return {
      isValid: false,
      error: 'Category limit must be an integer'
    };
  }
  
  const { min, max } = SETTINGS_VALIDATION.defaultCategoryLimit;
  
  if (value < min || value > max) {
    return {
      isValid: false,
      error: `Category limit must be between ${min} and ${max} items`
    };
  }
  
  return { isValid: true, error: null };
}

/**
 * Validate Discord webhook URL
 * @param {string} url - Discord webhook URL
 * @returns {ValidationResult}
 */
export function validateDiscordWebhookUrl(url) {
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      error: 'Discord webhook URL must be a non-empty string'
    };
  }
  
  // Discord webhook URL pattern
  const discordWebhookPattern = /^https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+$/;
  
  if (!discordWebhookPattern.test(url)) {
    return {
      isValid: false,
      error: 'Invalid Discord webhook URL format. Must be https://discord.com/api/webhooks/...'
    };
  }
  
  return { isValid: true, error: null };
}

/**
 * Validate closed date
 * @param {Date|string} date - Date to validate
 * @returns {ValidationResult}
 */
export function validateClosedDate(date) {
  let dateObj;
  
  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    return {
      isValid: false,
      error: 'Date must be a Date object or valid date string'
    };
  }
  
  if (isNaN(dateObj.getTime())) {
    return {
      isValid: false,
      error: 'Invalid date'
    };
  }
  
  // Check if date is not too far in the past (more than 1 year ago)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  if (dateObj < oneYearAgo) {
    return {
      isValid: false,
      error: 'Date cannot be more than 1 year in the past'
    };
  }
  
  return { isValid: true, error: null };
}

/**
 * Validate closed date reason
 * @param {string} reason - Reason for closure
 * @returns {ValidationResult}
 */
export function validateClosedDateReason(reason) {
  if (!reason || typeof reason !== 'string') {
    return {
      isValid: false,
      error: 'Reason must be a non-empty string'
    };
  }
  
  if (reason.trim().length === 0) {
    return {
      isValid: false,
      error: 'Reason cannot be empty or whitespace only'
    };
  }
  
  if (reason.length > 200) {
    return {
      isValid: false,
      error: 'Reason must be 200 characters or less'
    };
  }
  
  return { isValid: true, error: null };
}

/**
 * Validate notification title
 * @param {string} title - Notification title
 * @returns {ValidationResult}
 */
export function validateNotificationTitle(title) {
  if (!title || typeof title !== 'string') {
    return {
      isValid: false,
      error: 'Title must be a non-empty string'
    };
  }
  
  if (title.trim().length === 0) {
    return {
      isValid: false,
      error: 'Title cannot be empty or whitespace only'
    };
  }
  
  if (title.length > 100) {
    return {
      isValid: false,
      error: 'Title must be 100 characters or less'
    };
  }
  
  return { isValid: true, error: null };
}

/**
 * Validate notification content
 * @param {string} content - Notification content
 * @returns {ValidationResult}
 */
export function validateNotificationContent(content) {
  if (!content || typeof content !== 'string') {
    return {
      isValid: false,
      error: 'Content must be a non-empty string'
    };
  }
  
  if (content.trim().length === 0) {
    return {
      isValid: false,
      error: 'Content cannot be empty or whitespace only'
    };
  }
  
  if (content.length > 1000) {
    return {
      isValid: false,
      error: 'Content must be 1000 characters or less'
    };
  }
  
  return { isValid: true, error: null };
}

/**
 * Validate all settings in an object
 * @param {Object} settings - Settings object to validate
 * @returns {Object} Validation results for each setting
 */
export function validateSettings(settings) {
  const results = {};
  
  if (settings.maxLoanDuration !== undefined) {
    results.maxLoanDuration = validateLoanDuration(settings.maxLoanDuration);
  }
  
  if (settings.maxAdvanceBookingDays !== undefined) {
    results.maxAdvanceBookingDays = validateAdvanceBookingDays(settings.maxAdvanceBookingDays);
  }
  
  if (settings.defaultCategoryLimit !== undefined) {
    results.defaultCategoryLimit = validateCategoryLimit(settings.defaultCategoryLimit);
  }
  
  if (settings.discordWebhookUrl !== undefined && settings.discordWebhookUrl !== null) {
    results.discordWebhookUrl = validateDiscordWebhookUrl(settings.discordWebhookUrl);
  }
  
  return results;
}

/**
 * Check if all validation results are valid
 * @param {Object} results - Validation results object
 * @returns {boolean} True if all validations passed
 */
export function areAllValid(results) {
  return Object.values(results).every(result => result.isValid);
}

/**
 * Get first error message from validation results
 * @param {Object} results - Validation results object
 * @returns {string|null} First error message or null if all valid
 */
export function getFirstError(results) {
  const firstInvalid = Object.values(results).find(result => !result.isValid);
  return firstInvalid ? firstInvalid.error : null;
}
