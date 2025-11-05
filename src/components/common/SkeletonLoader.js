/**
 * SkeletonLoader - คอมโพเนนต์สำหรับแสดง loading skeleton
 */

import React from 'react';

const SkeletonLoader = ({ 
  width = '100%', 
  height = '20px', 
  className = '', 
  variant = 'rectangular',
  animation = 'pulse',
  count = 1 
}) => {
  const baseClasses = 'bg-gray-200 animate-pulse';
  
  const variantClasses = {
    rectangular: 'rounded',
    circular: 'rounded-full',
    text: 'rounded h-4',
    card: 'rounded-lg',
    avatar: 'rounded-full w-10 h-10'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-wave',
    none: ''
  };

  const skeletonClasses = `
    ${baseClasses}
    ${variantClasses[variant] || variantClasses.rectangular}
    ${animationClasses[animation]}
    ${className}
  `.trim();

  const style = {
    width,
    height: variant === 'avatar' ? undefined : height
  };

  if (count === 1) {
    return <div className={skeletonClasses} style={style} />;
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={skeletonClasses} style={style} />
      ))}
    </div>
  );
};

// Specialized skeleton components
export const SkeletonText = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, index) => (
      <SkeletonLoader
        key={index}
        height="16px"
        width={index === lines - 1 ? '75%' : '100%'}
        variant="text"
      />
    ))}
  </div>
);

export const SkeletonCard = ({ className = '' }) => (
  <div className={`p-4 border rounded-lg ${className}`}>
    <div className="flex items-start space-x-4">
      <SkeletonLoader variant="avatar" />
      <div className="flex-1 space-y-2">
        <SkeletonLoader height="20px" width="60%" />
        <SkeletonLoader height="16px" width="40%" />
        <SkeletonText lines={2} />
      </div>
    </div>
  </div>
);

export const SkeletonImage = ({ width = '100%', height = '200px', className = '' }) => (
  <div className={`bg-gray-200 animate-pulse rounded ${className}`} style={{ width, height }}>
    <div className="flex items-center justify-center h-full">
      <svg 
        className="w-8 h-8 text-gray-400" 
        fill="currentColor" 
        viewBox="0 0 20 20"
      >
        <path 
          fillRule="evenodd" 
          d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" 
          clipRule="evenodd" 
        />
      </svg>
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5, columns = 4, className = '' }) => (
  <div className={`space-y-3 ${className}`}>
    {/* Header */}
    <div className="flex space-x-4">
      {Array.from({ length: columns }).map((_, index) => (
        <SkeletonLoader key={index} height="20px" width="100%" />
      ))}
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <SkeletonLoader key={colIndex} height="16px" width="100%" />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonGrid = ({ items = 6, columns = 3, className = '' }) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
  };

  return (
    <div className={`grid gap-4 ${gridClasses[columns] || gridClasses[3]} ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
};

export default SkeletonLoader;