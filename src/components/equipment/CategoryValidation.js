import React from 'react';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

/**
 * Category validation utilities and components
 */

/**
 * Validate category selection based on requirements
 * @param {Object} category - Selected category
 * @param {Array} requiredFields - Required fields for the form
 * @param {Object} formData - Current form data
 * @returns {Object} Validation result
 */
export const validateCategorySelection = (category, requiredFields = [], formData = {}) => {
  const errors = [];
  const warnings = [];
  
  if (!category) {
    errors.push('กรุณาเลือกประเภทอุปกรณ์');
    return { isValid: false, errors, warnings };
  }

  // Check if category is active
  if (!category.isActive) {
    errors.push('ประเภทอุปกรณ์ที่เลือกไม่สามารถใช้งานได้');
  }

  // Check required fields from category
  if (category.requiredFields && category.requiredFields.length > 0) {
    category.requiredFields.forEach(field => {
      if (!formData[field] || (typeof formData[field] === 'string' && formData[field].trim() === '')) {
        warnings.push(`ฟิลด์ "${field}" เป็นข้อมูลที่จำเป็นสำหรับประเภทอุปกรณ์นี้`);
      }
    });
  }

  // Check custom fields validation
  if (category.customFields && category.customFields.length > 0) {
    category.customFields.forEach(customField => {
      if (customField.required) {
        const fieldValue = formData.specifications?.[customField.name];
        if (!fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '')) {
          warnings.push(`ฟิลด์ "${customField.label || customField.name}" เป็นข้อมูลที่จำเป็น`);
        }
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    hasWarnings: warnings.length > 0
  };
};

/**
 * CategoryValidationMessage Component
 * Displays validation messages for category selection
 */
export const CategoryValidationMessage = ({ 
  validation,
  className = ""
}) => {
  if (!validation || (validation.errors.length === 0 && validation.warnings.length === 0)) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Errors */}
      {validation.errors.map((error, index) => (
        <div key={`error-${index}`} className="flex items-start p-3 bg-red-50 border border-red-200 rounded-md">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      ))}

      {/* Warnings */}
      {validation.warnings.map((warning, index) => (
        <div key={`warning-${index}`} className="flex items-start p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-yellow-700">{warning}</span>
        </div>
      ))}
    </div>
  );
};

/**
 * CategoryRequirements Component
 * Shows category requirements and custom fields
 */
export const CategoryRequirements = ({ 
  category,
  className = ""
}) => {
  if (!category) {
    return null;
  }

  const hasRequirements = category.requiredFields && category.requiredFields.length > 0;
  const hasCustomFields = category.customFields && category.customFields.length > 0;

  if (!hasRequirements && !hasCustomFields) {
    return null;
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-md p-4 ${className}`}>
      <div className="flex items-start">
        <CheckCircleIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            ข้อมูลที่จำเป็นสำหรับประเภท "{category.name}"
          </h4>
          
          {hasRequirements && (
            <div className="mb-3">
              <h5 className="text-xs font-medium text-blue-800 mb-1">ฟิลด์ที่จำเป็น:</h5>
              <ul className="text-xs text-blue-700 space-y-1">
                {category.requiredFields.map((field, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span>
                    {field}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hasCustomFields && (
            <div>
              <h5 className="text-xs font-medium text-blue-800 mb-1">ฟิลด์เพิ่มเติม:</h5>
              <ul className="text-xs text-blue-700 space-y-1">
                {category.customFields.map((field, index) => (
                  <li key={index} className="flex items-center">
                    <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                      field.required ? 'bg-red-400' : 'bg-blue-400'
                    }`}></span>
                    {field.label || field.name}
                    {field.required && <span className="text-red-600 ml-1">*</span>}
                    {field.type === 'select' && field.options && (
                      <span className="text-blue-600 ml-1">
                        ({field.options.join(', ')})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * CategorySelectionSummary Component
 * Shows selected category with path and requirements
 */
export const CategorySelectionSummary = ({ 
  category,
  categoryPath = [],
  validation,
  className = ""
}) => {
  if (!category) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Category Info */}
      <div className="flex items-center p-3 bg-gray-50 rounded-md">
        <div 
          className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 mr-3"
          style={{ backgroundColor: category.color || '#6B7280' }}
        >
          <span className="text-white text-sm font-medium">
            {category.icon ? category.icon.charAt(0) : category.name.charAt(0)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900">{category.name}</div>
          {category.nameEn && (
            <div className="text-sm text-gray-500">{category.nameEn}</div>
          )}
          {categoryPath.length > 1 && (
            <div className="text-xs text-gray-400">
              {categoryPath.map(cat => cat.name).join(' / ')}
            </div>
          )}
        </div>
        {category.equipmentCount > 0 && (
          <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
            {category.equipmentCount} รายการ
          </span>
        )}
      </div>

      {/* Requirements */}
      <CategoryRequirements category={category} />

      {/* Validation Messages */}
      <CategoryValidationMessage validation={validation} />
    </div>
  );
};

const CategoryValidationUtils = {
  validateCategorySelection,
  CategoryValidationMessage,
  CategoryRequirements,
  CategorySelectionSummary
};

export default CategoryValidationUtils;