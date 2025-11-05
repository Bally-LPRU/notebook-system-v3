/**
 * EquipmentSkeleton - Skeleton components สำหรับ equipment
 */

import React from 'react';
import SkeletonLoader, { SkeletonImage } from '../common/SkeletonLoader';

export const EquipmentCardSkeleton = ({ className = '' }) => (
  <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
    {/* Image skeleton */}
    <SkeletonImage height="200px" className="mb-4" />
    
    {/* Content skeleton */}
    <div className="space-y-3">
      {/* Equipment number */}
      <SkeletonLoader height="16px" width="40%" />
      
      {/* Equipment name */}
      <SkeletonLoader height="20px" width="80%" />
      
      {/* Brand and model */}
      <div className="flex space-x-2">
        <SkeletonLoader height="16px" width="30%" />
        <SkeletonLoader height="16px" width="25%" />
      </div>
      
      {/* Status badge */}
      <SkeletonLoader height="24px" width="60px" className="rounded-full" />
      
      {/* Action buttons */}
      <div className="flex space-x-2 pt-2">
        <SkeletonLoader height="32px" width="80px" className="rounded" />
        <SkeletonLoader height="32px" width="80px" className="rounded" />
        <SkeletonLoader height="32px" width="80px" className="rounded" />
      </div>
    </div>
  </div>
);

export const EquipmentGridSkeleton = ({ count = 6, columns = 3 }) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className={`grid gap-6 ${gridClasses[columns] || gridClasses[3]}`}>
      {Array.from({ length: count }).map((_, index) => (
        <EquipmentCardSkeleton key={index} />
      ))}
    </div>
  );
};

export const EquipmentListSkeleton = ({ rows = 10 }) => (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    {/* Header */}
    <div className="bg-gray-50 px-6 py-3 border-b">
      <div className="flex space-x-4">
        <SkeletonLoader height="20px" width="15%" />
        <SkeletonLoader height="20px" width="25%" />
        <SkeletonLoader height="20px" width="15%" />
        <SkeletonLoader height="20px" width="15%" />
        <SkeletonLoader height="20px" width="15%" />
        <SkeletonLoader height="20px" width="15%" />
      </div>
    </div>
    
    {/* Rows */}
    <div className="divide-y">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="px-6 py-4">
          <div className="flex items-center space-x-4">
            <SkeletonLoader variant="circular" width="40px" height="40px" />
            <SkeletonLoader height="16px" width="12%" />
            <SkeletonLoader height="16px" width="20%" />
            <SkeletonLoader height="16px" width="12%" />
            <SkeletonLoader height="16px" width="12%" />
            <SkeletonLoader height="24px" width="80px" className="rounded-full" />
            <div className="flex space-x-2">
              <SkeletonLoader height="24px" width="24px" className="rounded" />
              <SkeletonLoader height="24px" width="24px" className="rounded" />
              <SkeletonLoader height="24px" width="24px" className="rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const EquipmentDetailSkeleton = () => (
  <div className="max-w-4xl mx-auto p-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Image section */}
      <div className="space-y-4">
        <SkeletonImage height="400px" />
        <div className="flex space-x-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonImage key={index} width="80px" height="60px" />
          ))}
        </div>
      </div>
      
      {/* Details section */}
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <SkeletonLoader height="32px" width="70%" />
          <SkeletonLoader height="20px" width="40%" />
          <SkeletonLoader height="24px" width="100px" className="rounded-full" />
        </div>
        
        {/* Info sections */}
        {Array.from({ length: 4 }).map((_, sectionIndex) => (
          <div key={sectionIndex} className="space-y-3">
            <SkeletonLoader height="20px" width="30%" />
            <div className="space-y-2">
              <SkeletonLoader height="16px" width="100%" />
              <SkeletonLoader height="16px" width="80%" />
              <SkeletonLoader height="16px" width="60%" />
            </div>
          </div>
        ))}
        
        {/* Action buttons */}
        <div className="flex space-x-3 pt-4">
          <SkeletonLoader height="40px" width="100px" className="rounded" />
          <SkeletonLoader height="40px" width="100px" className="rounded" />
          <SkeletonLoader height="40px" width="100px" className="rounded" />
        </div>
      </div>
    </div>
  </div>
);

export const EquipmentFormSkeleton = () => (
  <div className="max-w-2xl mx-auto p-6">
    <div className="space-y-6">
      {/* Form header */}
      <div className="space-y-2">
        <SkeletonLoader height="28px" width="40%" />
        <SkeletonLoader height="16px" width="60%" />
      </div>
      
      {/* Form sections */}
      {Array.from({ length: 3 }).map((_, sectionIndex) => (
        <div key={sectionIndex} className="bg-white rounded-lg p-6 shadow">
          <SkeletonLoader height="20px" width="30%" className="mb-4" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, fieldIndex) => (
              <div key={fieldIndex} className="space-y-2">
                <SkeletonLoader height="16px" width="25%" />
                <SkeletonLoader height="40px" width="100%" className="rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {/* Image upload section */}
      <div className="bg-white rounded-lg p-6 shadow">
        <SkeletonLoader height="20px" width="25%" className="mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonImage key={index} height="120px" />
          ))}
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex justify-end space-x-3">
        <SkeletonLoader height="40px" width="80px" className="rounded" />
        <SkeletonLoader height="40px" width="100px" className="rounded" />
      </div>
    </div>
  </div>
);

export const EquipmentSearchSkeleton = () => (
  <div className="space-y-4">
    {/* Search bar */}
    <div className="flex space-x-4">
      <SkeletonLoader height="40px" width="100%" className="rounded" />
      <SkeletonLoader height="40px" width="120px" className="rounded" />
    </div>
    
    {/* Filters */}
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <SkeletonLoader key={index} height="32px" width="100px" className="rounded-full" />
      ))}
    </div>
    
    {/* Results count */}
    <SkeletonLoader height="16px" width="200px" />
  </div>
);

export const EquipmentFiltersSkeleton = () => (
  <div className="bg-white rounded-lg shadow p-4">
    <div className="space-y-4">
      {/* Filter sections */}
      {Array.from({ length: 4 }).map((_, sectionIndex) => (
        <div key={sectionIndex} className="space-y-2">
          <SkeletonLoader height="18px" width="40%" />
          <div className="space-y-1">
            {Array.from({ length: 3 }).map((_, optionIndex) => (
              <div key={optionIndex} className="flex items-center space-x-2">
                <SkeletonLoader height="16px" width="16px" className="rounded" />
                <SkeletonLoader height="16px" width="60%" />
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {/* Clear filters button */}
      <SkeletonLoader height="32px" width="100px" className="rounded" />
    </div>
  </div>
);

const EquipmentSkeletons = {
  EquipmentCardSkeleton,
  EquipmentGridSkeleton,
  EquipmentListSkeleton,
  EquipmentDetailSkeleton,
  EquipmentFormSkeleton,
  EquipmentSearchSkeleton,
  EquipmentFiltersSkeleton
};

export default EquipmentSkeletons;