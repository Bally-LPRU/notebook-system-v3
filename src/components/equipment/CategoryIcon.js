import React from 'react';
import {
  ComputerDesktopIcon,
  SpeakerWaveIcon,
  PrinterIcon,
  WrenchScrewdriverIcon,
  HomeIcon,
  DevicePhoneMobileIcon,
  TvIcon,
  VideoCameraIcon,
  CameraIcon,
  FolderIcon
} from '@heroicons/react/24/outline';

/**
 * Icon mapping for categories
 */
const ICON_MAP = {
  ComputerDesktopIcon,
  SpeakerWaveIcon,
  PrinterIcon,
  WrenchScrewdriverIcon,
  HomeIcon,
  DevicePhoneMobileIcon,
  TvIcon,
  VideoCameraIcon,
  CameraIcon,
  FolderIcon
};

/**
 * CategoryIcon Component
 * Displays category icon with color coding and fallback options
 */
const CategoryIcon = ({ 
  category,
  size = 'md',
  showBackground = true,
  className = ""
}) => {
  // Size configurations
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
    '2xl': 'w-10 h-10'
  };

  const backgroundSizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
    '2xl': 'w-10 h-10'
  };

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-xs',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-base',
    '2xl': 'text-lg'
  };

  if (!category) {
    return (
      <div className={`${backgroundSizeClasses[size]} bg-gray-300 rounded flex-shrink-0 ${className}`}>
        <FolderIcon className={`${sizeClasses[size]} text-gray-500 m-auto`} />
      </div>
    );
  }

  // Get icon component
  const IconComponent = category.icon && ICON_MAP[category.icon] ? 
    ICON_MAP[category.icon] : null;

  // Get category color
  const categoryColor = category.color || '#6B7280';

  if (IconComponent && !showBackground) {
    // Show icon without background
    return (
      <IconComponent 
        className={`${sizeClasses[size]} flex-shrink-0 ${className}`}
        style={{ color: categoryColor }}
      />
    );
  }

  if (IconComponent && showBackground) {
    // Show icon with colored background
    return (
      <div 
        className={`${backgroundSizeClasses[size]} rounded flex items-center justify-center flex-shrink-0 ${className}`}
        style={{ backgroundColor: categoryColor }}
      >
        <IconComponent className={`${sizeClasses[size]} text-white`} />
      </div>
    );
  }

  // Fallback: show first letter of category name
  return (
    <div 
      className={`${backgroundSizeClasses[size]} rounded flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ backgroundColor: categoryColor }}
    >
      <span className={`text-white font-medium ${textSizeClasses[size]}`}>
        {category.name ? category.name.charAt(0).toUpperCase() : '?'}
      </span>
    </div>
  );
};

/**
 * CategoryBadge Component
 * Displays category as a badge with icon and name
 */
export const CategoryBadge = ({ 
  category,
  size = 'md',
  showIcon = true,
  showName = true,
  className = ""
}) => {
  const badgeSizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  if (!category) {
    return null;
  }

  return (
    <div className={`
      inline-flex items-center rounded-full bg-gray-100 text-gray-800 
      ${badgeSizeClasses[size]} ${className}
    `}>
      {showIcon && (
        <CategoryIcon 
          category={category} 
          size={size === 'sm' ? 'xs' : size === 'lg' ? 'md' : 'sm'}
          showBackground={false}
          className="mr-1"
        />
      )}
      {showName && (
        <span className="truncate">
          {category.name}
        </span>
      )}
    </div>
  );
};

/**
 * CategoryPath Component
 * Displays category path as breadcrumb
 */
export const CategoryPath = ({ 
  categoryPath,
  onCategoryClick,
  separator = '/',
  className = ""
}) => {
  if (!categoryPath || categoryPath.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center text-sm text-gray-600 ${className}`}>
      {categoryPath.map((category, index) => (
        <React.Fragment key={category.id}>
          {index > 0 && (
            <span className="mx-2 text-gray-400">{separator}</span>
          )}
          <button
            onClick={() => onCategoryClick && onCategoryClick(category)}
            className="flex items-center hover:text-blue-600 transition-colors"
          >
            <CategoryIcon 
              category={category} 
              size="sm"
              showBackground={false}
              className="mr-1"
            />
            <span>{category.name}</span>
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

export default CategoryIcon;