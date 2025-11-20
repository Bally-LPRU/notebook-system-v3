/**
 * Settings Tab Skeleton Loader
 * 
 * Specialized skeleton loader for settings tabs.
 * Provides consistent loading states across all settings tabs.
 * 
 * Requirements: 1.2
 */

import React from 'react';
import SkeletonLoader, { SkeletonText } from '../../common/SkeletonLoader';

/**
 * SettingsTabSkeleton Component
 * 
 * Displays a skeleton loader for settings tabs while data is loading.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.variant - Skeleton variant ('form', 'list', 'table')
 * @returns {JSX.Element} Settings tab skeleton
 */
const SettingsTabSkeleton = ({ variant = 'form' }) => {
  if (variant === 'form') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Header */}
        <div className="mb-6">
          <SkeletonLoader height="28px" width="40%" className="mb-2" />
          <SkeletonLoader height="16px" width="60%" />
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          {[1, 2, 3].map((index) => (
            <div key={index}>
              <SkeletonLoader height="20px" width="30%" className="mb-2" />
              <SkeletonLoader height="40px" width="100%" />
              <SkeletonLoader height="14px" width="50%" className="mt-2" />
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 mt-6 border-t">
          <SkeletonLoader height="40px" width="100px" />
          <SkeletonLoader height="40px" width="120px" />
        </div>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className="space-y-6">
        {/* Add Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <SkeletonLoader height="24px" width="40%" className="mb-4" />
          <div className="space-y-4">
            <div>
              <SkeletonLoader height="20px" width="20%" className="mb-2" />
              <SkeletonLoader height="40px" width="100%" />
            </div>
            <div>
              <SkeletonLoader height="20px" width="20%" className="mb-2" />
              <SkeletonLoader height="40px" width="100%" />
            </div>
            <div className="flex justify-end">
              <SkeletonLoader height="40px" width="120px" />
            </div>
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <SkeletonLoader height="24px" width="40%" className="mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-1">
                  <SkeletonLoader height="20px" width="60%" className="mb-2" />
                  <SkeletonLoader height="16px" width="40%" />
                </div>
                <SkeletonLoader height="40px" width="40px" variant="circular" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <SkeletonLoader height="28px" width="40%" className="mb-2" />
          <SkeletonLoader height="16px" width="60%" />
        </div>

        {/* Table Content */}
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((index) => (
              <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                <SkeletonLoader height="40px" width="40px" variant="circular" />
                <div className="flex-1">
                  <SkeletonLoader height="20px" width="40%" className="mb-2" />
                  <SkeletonLoader height="16px" width="60%" />
                </div>
                <SkeletonLoader height="40px" width="100px" />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
          <SkeletonLoader height="40px" width="100px" />
          <SkeletonLoader height="40px" width="120px" />
        </div>
      </div>
    );
  }

  // Default skeleton
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <SkeletonLoader height="28px" width="40%" className="mb-4" />
      <SkeletonText lines={5} />
    </div>
  );
};

/**
 * Settings Loading State Component
 * 
 * Displays a centered loading spinner with message.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.message - Loading message
 * @returns {JSX.Element} Loading state
 */
export const SettingsLoadingState = ({ message = 'กำลังโหลดการตั้งค่า...' }) => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">{message}</p>
      </div>
    </div>
  );
};

/**
 * Settings Empty State Component
 * 
 * Displays an empty state with icon and message.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.icon - Icon element
 * @param {string} props.title - Empty state title
 * @param {string} props.message - Empty state message
 * @param {React.ReactNode} props.action - Optional action button
 * @returns {JSX.Element} Empty state
 */
export const SettingsEmptyState = ({ icon, title, message, action }) => {
  return (
    <div className="text-center py-12">
      <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-4">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default SettingsTabSkeleton;
