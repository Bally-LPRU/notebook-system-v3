/**
 * Category Limit Editor
 * 
 * Reusable component for editing a single category's borrowing limit.
 * Displays category name, current limit, borrowed count, and provides input for editing.
 * 
 * Features:
 * - Input field for setting limit per category
 * - Validation for positive integers
 * - Visual indicator when limit is reached
 * - Shows current borrowed count
 * 
 * Requirements: 6.1, 6.4
 */

import React, { useState, useEffect } from 'react';

/**
 * CategoryLimitEditor Component
 * 
 * Editable row for a single category's borrowing limit.
 * Provides input validation and visual feedback.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.categoryId - Category ID
 * @param {string} props.categoryName - Category display name
 * @param {number|null} props.limit - Current limit (null = use default)
 * @param {number} props.currentBorrowedCount - Number of items currently borrowed in this category
 * @param {number} props.defaultLimit - System default limit
 * @param {Function} props.onChange - Callback when limit changes (categoryId, newLimit)
 * @returns {JSX.Element} Category limit editor row
 */
const CategoryLimitEditor = ({
  categoryId,
  categoryName,
  limit,
  currentBorrowedCount = 0,
  defaultLimit = 3,
  onChange
}) => {
  const [inputValue, setInputValue] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Initialize input value
  useEffect(() => {
    if (limit !== null && limit !== undefined) {
      setInputValue(limit.toString());
    } else {
      setInputValue('');
    }
  }, [limit]);

  /**
   * Get effective limit (custom or default)
   */
  const effectiveLimit = limit !== null && limit !== undefined ? limit : defaultLimit;

  /**
   * Check if limit is reached
   */
  const isLimitReached = currentBorrowedCount >= effectiveLimit;

  /**
   * Calculate usage percentage
   */
  const usagePercentage = effectiveLimit > 0 
    ? Math.min((currentBorrowedCount / effectiveLimit) * 100, 100)
    : 0;

  /**
   * Get progress bar color based on usage
   */
  const getProgressColor = () => {
    if (usagePercentage >= 100) return 'bg-red-500';
    if (usagePercentage >= 80) return 'bg-amber-500';
    if (usagePercentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  /**
   * Handle input change
   */
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setValidationError('');

    // Allow empty value (will use default)
    if (value === '') {
      onChange(categoryId, null);
      return;
    }

    // Validate positive integer
    const numValue = parseInt(value, 10);
    
    if (isNaN(numValue)) {
      setValidationError('กรุณาใส่ตัวเลขเท่านั้น');
      return;
    }

    if (numValue < 0) {
      setValidationError('จำนวนต้องไม่ติดลบ');
      return;
    }

    if (!Number.isInteger(numValue)) {
      setValidationError('จำนวนต้องเป็นจำนวนเต็ม');
      return;
    }

    // Valid input
    onChange(categoryId, numValue);
  };

  /**
   * Handle focus
   */
  const handleFocus = () => {
    setIsEditing(true);
  };

  /**
   * Handle blur
   */
  const handleBlur = () => {
    setIsEditing(false);
  };

  /**
   * Clear limit (use default)
   */
  const handleClear = () => {
    setInputValue('');
    onChange(categoryId, null);
    setValidationError('');
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between">
        {/* Category Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            <h3 className="text-base font-medium text-gray-900 truncate">
              {categoryName}
            </h3>
            {limit === null && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                ใช้ค่าเริ่มต้น
              </span>
            )}
          </div>

          {/* Current Usage */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">
                กำลังยืม: <span className={isLimitReached ? 'text-red-600 font-semibold' : 'text-gray-900'}>{currentBorrowedCount}</span> / {effectiveLimit} ชิ้น
              </span>
              <span className="text-gray-500">
                {usagePercentage.toFixed(0)}%
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
                style={{ width: `${usagePercentage}%` }}
              />
            </div>

            {/* Limit Reached Warning */}
            {isLimitReached && (
              <div className="mt-2 flex items-center text-sm text-red-600">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                ถึงขีดจำกัดแล้ว
              </div>
            )}
          </div>
        </div>

        {/* Limit Input */}
        <div className="ml-4 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1"
                value={inputValue}
                onChange={handleInputChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={`เริ่มต้น: ${defaultLimit}`}
                className={`
                  w-24 px-3 py-2 border rounded-lg text-sm text-right
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  ${validationError 
                    ? 'border-red-300 bg-red-50' 
                    : isEditing 
                      ? 'border-blue-300' 
                      : 'border-gray-300'
                  }
                `}
              />
              {validationError && (
                <div className="absolute top-full left-0 mt-1 text-xs text-red-600 whitespace-nowrap">
                  {validationError}
                </div>
              )}
            </div>

            {/* Clear Button */}
            {limit !== null && (
              <button
                onClick={handleClear}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="ล้างค่า (ใช้ค่าเริ่มต้น)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Helper Text */}
          <div className="mt-1 text-xs text-gray-500 text-right">
            {limit === null ? `ใช้ค่าเริ่มต้น (${defaultLimit})` : 'ชิ้นต่อผู้ใช้'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryLimitEditor;
