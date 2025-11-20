/**
 * Settings Tooltip Component
 * 
 * Provides contextual help tooltips for settings fields.
 * Displays on hover with helpful information and examples.
 * 
 * Requirements: 1.4
 */

import React, { useState } from 'react';

/**
 * SettingsTooltip Component
 * 
 * Displays a tooltip with help text on hover.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.content - Tooltip content
 * @param {string} props.position - Tooltip position ('top', 'bottom', 'left', 'right')
 * @param {React.ReactNode} props.children - Trigger element
 * @returns {JSX.Element} Tooltip component
 */
export const SettingsTooltip = ({ 
  content, 
  position = 'top', 
  children 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      default: // top
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'bottom':
        return 'bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-900';
      case 'left':
        return 'left-full top-1/2 transform -translate-y-1/2 border-l-gray-900';
      case 'right':
        return 'right-full top-1/2 transform -translate-y-1/2 border-r-gray-900';
      default: // top
        return 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-900';
    }
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          className={`absolute z-50 ${getPositionClasses()} pointer-events-none`}
          style={{ minWidth: '200px', maxWidth: '300px' }}
        >
          <div className="bg-gray-900 text-white text-sm rounded-lg px-3 py-2 shadow-lg">
            {content}
          </div>
          <div
            className={`absolute w-0 h-0 border-4 border-transparent ${getArrowClasses()}`}
          />
        </div>
      )}
    </div>
  );
};

/**
 * HelpIcon Component
 * 
 * Displays a help icon with tooltip.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.content - Tooltip content
 * @param {string} props.position - Tooltip position
 * @returns {JSX.Element} Help icon with tooltip
 */
export const HelpIcon = ({ content, position = 'top' }) => {
  return (
    <SettingsTooltip content={content} position={position}>
      <button
        type="button"
        className="inline-flex items-center justify-center w-5 h-5 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full transition-colors"
        tabIndex={0}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    </SettingsTooltip>
  );
};

/**
 * FieldLabel Component
 * 
 * Label with optional tooltip for form fields.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.htmlFor - Input ID
 * @param {string} props.label - Label text
 * @param {boolean} props.required - Whether field is required
 * @param {string} props.tooltip - Tooltip content
 * @param {string} props.tooltipPosition - Tooltip position
 * @returns {JSX.Element} Field label
 */
export const FieldLabel = ({ 
  htmlFor, 
  label, 
  required = false, 
  tooltip,
  tooltipPosition = 'top'
}) => {
  return (
    <label 
      htmlFor={htmlFor} 
      className="flex items-center text-sm font-medium text-gray-700 mb-2"
    >
      <span>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </span>
      {tooltip && (
        <span className="ml-2">
          <HelpIcon content={tooltip} position={tooltipPosition} />
        </span>
      )}
    </label>
  );
};

/**
 * HelpSection Component
 * 
 * Expandable help section with detailed information.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.title - Section title
 * @param {React.ReactNode} props.children - Section content
 * @param {boolean} props.defaultExpanded - Whether section is expanded by default
 * @returns {JSX.Element} Help section
 */
export const HelpSection = ({ 
  title = 'คำแนะนำและตัวอย่าง', 
  children,
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center">
          <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium text-gray-900">{title}</span>
        </div>
        <svg 
          className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isExpanded && (
        <div className="px-4 py-3 bg-white border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * DocumentationLink Component
 * 
 * Link to external documentation.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.href - Documentation URL
 * @param {string} props.text - Link text
 * @returns {JSX.Element} Documentation link
 */
export const DocumentationLink = ({ href, text = 'ดูเอกสารเพิ่มเติม' }) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline"
    >
      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
      {text}
      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
};

export default SettingsTooltip;
