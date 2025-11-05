/**
 * OptimizedEquipmentGrid - Performance optimized equipment grid
 * รองรับ virtual scrolling, lazy loading, และ skeleton screens
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { EquipmentCardSkeleton, EquipmentGridSkeleton } from './EquipmentSkeleton';
import ProgressiveImage from '../common/ProgressiveImage';
import { useVirtualScrolling, useDebounce, useIntersectionObserver } from '../../utils/performanceOptimization';
import { useCache } from '../../hooks/useCache';

const OptimizedEquipmentGrid = ({
  equipment = [],
  loading = false,
  onEquipmentClick,
  onEquipmentEdit,
  onEquipmentDelete,
  selectedItems = [],
  onSelectionChange,
  viewMode = 'grid',
  itemsPerRow = 3,
  itemHeight = 320,
  containerHeight = 600,
  enableVirtualScrolling = true,
  enableLazyLoading = true,
  className = ''
}) => {
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const { getCachedEquipment, setCachedEquipment } = useCache();

  // Debounce selection changes for better performance
  const debouncedSelectionChange = useDebounce(onSelectionChange, 100);

  // Memoize equipment data with caching
  const memoizedEquipment = useMemo(() => {
    return equipment.map(item => {
      const cached = getCachedEquipment(item.id);
      if (cached) {
        return cached;
      }
      setCachedEquipment(item.id, item);
      return item;
    });
  }, [equipment, getCachedEquipment, setCachedEquipment]);

  // Virtual scrolling for large datasets
  const {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop
  } = useVirtualScrolling(
    memoizedEquipment,
    itemHeight,
    containerHeight
  );

  // Calculate grid dimensions
  const itemWidth = useMemo(() => {
    const containerWidth = 1200; // Assume container width
    const gap = 24; // Gap between items
    const totalGap = (itemsPerRow - 1) * gap;
    return Math.floor((containerWidth - totalGap) / itemsPerRow);
  }, [itemsPerRow]);

  // Handle scroll for virtual scrolling
  const handleScroll = useCallback((scrollTop) => {
    setScrollTop(scrollTop);
    
    // Update visible range for lazy loading
    const start = Math.floor(scrollTop / itemHeight) * itemsPerRow;
    const end = start + (Math.ceil(containerHeight / itemHeight) + 1) * itemsPerRow;
    setVisibleRange({ start, end });
  }, [setScrollTop, itemHeight, itemsPerRow, containerHeight]);

  // Equipment card component with performance optimizations
  const EquipmentCard = React.memo(({ equipment, style, isVisible }) => {
    const [ref, isIntersecting] = useIntersectionObserver({
      rootMargin: '100px',
      threshold: 0.1
    });

    const isSelected = selectedItems.includes(equipment.id);
    const shouldLoadImage = isVisible && (isIntersecting || !enableLazyLoading);

    const handleImageLoad = useCallback(() => {
      setLoadedImages(prev => new Set([...prev, equipment.id]));
    }, [equipment.id]);

    const handleClick = useCallback(() => {
      onEquipmentClick?.(equipment);
    }, [equipment]);

    const handleEdit = useCallback((e) => {
      e.stopPropagation();
      onEquipmentEdit?.(equipment);
    }, [equipment]);

    const handleDelete = useCallback((e) => {
      e.stopPropagation();
      onEquipmentDelete?.(equipment);
    }, [equipment]);

    const handleSelectionToggle = useCallback((e) => {
      e.stopPropagation();
      const newSelection = isSelected
        ? selectedItems.filter(id => id !== equipment.id)
        : [...selectedItems, equipment.id];
      debouncedSelectionChange(newSelection);
    }, [isSelected, equipment.id, selectedItems]);

    return (
      <div
        ref={ref}
        style={style}
        className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        }`}
        onClick={handleClick}
      >
        <div className="p-4">
          {/* Image section */}
          <div className="relative mb-4">
            {shouldLoadImage && equipment.images?.[0] ? (
              <ProgressiveImage
                src={equipment.images[0].url}
                thumbnailSrc={equipment.images[0].thumbnailUrl}
                mediumSrc={equipment.images[0].mediumUrl}
                alt={equipment.name}
                className="w-full h-48 object-cover rounded"
                onLoad={handleImageLoad}
                priority={isVisible}
              />
            ) : (
              <div className="w-full h-48 bg-gray-200 rounded flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            
            {/* Selection checkbox */}
            <div className="absolute top-2 left-2">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={handleSelectionToggle}
                className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Content section */}
          <div className="space-y-2">
            <div className="text-sm text-gray-500">
              {equipment.equipmentNumber}
            </div>
            
            <h3 className="font-semibold text-gray-900 line-clamp-2">
              {equipment.name}
            </h3>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>{equipment.brand}</span>
              {equipment.model && (
                <>
                  <span>•</span>
                  <span>{equipment.model}</span>
                </>
              )}
            </div>
            
            {/* Status badge */}
            <div className="flex items-center justify-between">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                equipment.status === 'active' 
                  ? 'bg-green-100 text-green-800'
                  : equipment.status === 'maintenance'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {equipment.status === 'active' ? 'ใช้งานได้' : 
                 equipment.status === 'maintenance' ? 'ซ่อมบำรุง' : 'เสื่อมสภาพ'}
              </span>
            </div>
            
            {/* Action buttons */}
            <div className="flex space-x-2 pt-2">
              <button
                onClick={handleEdit}
                className="flex-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                แก้ไข
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  });

  // Grid cell renderer for react-window
  const Cell = useCallback(({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * itemsPerRow + columnIndex;
    const item = enableVirtualScrolling ? visibleItems[index] : memoizedEquipment[index];
    
    if (!item) {
      return <div style={style} />;
    }

    const isVisible = !enableVirtualScrolling || 
      (index >= visibleRange.start && index <= visibleRange.end);

    return (
      <div style={{ ...style, padding: '12px' }}>
        <EquipmentCard
          equipment={item}
          isVisible={isVisible}
        />
      </div>
    );
  }, [memoizedEquipment, visibleItems, itemsPerRow, enableVirtualScrolling, visibleRange]);

  // Show loading skeleton
  if (loading) {
    return <EquipmentGridSkeleton count={12} columns={itemsPerRow} />;
  }

  // Show empty state
  if (memoizedEquipment.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m0 0V9a2 2 0 012-2h2m0 0V6a2 2 0 012-2h2.09M15 13h2m-2 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่พบอุปกรณ์</h3>
        <p className="mt-1 text-sm text-gray-500">ไม่มีอุปกรณ์ที่ตรงกับเงื่อนไขการค้นหา</p>
      </div>
    );
  }

  // Calculate grid dimensions
  const rowCount = Math.ceil(memoizedEquipment.length / itemsPerRow);

  // Render virtual grid or regular grid
  if (enableVirtualScrolling && memoizedEquipment.length > 50) {
    return (
      <div className={className}>
        <Grid
          columnCount={itemsPerRow}
          columnWidth={itemWidth}
          height={containerHeight}
          rowCount={rowCount}
          rowHeight={itemHeight}
          onScroll={({ scrollTop }) => handleScroll(scrollTop)}
          overscanRowCount={2}
          overscanColumnCount={1}
        >
          {Cell}
        </Grid>
      </div>
    );
  }

  // Regular grid for smaller datasets
  return (
    <div className={`grid gap-6 ${
      itemsPerRow === 1 ? 'grid-cols-1' :
      itemsPerRow === 2 ? 'grid-cols-1 md:grid-cols-2' :
      itemsPerRow === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
      'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    } ${className}`}>
      {memoizedEquipment.map((equipment, index) => (
        <EquipmentCard
          key={equipment.id}
          equipment={equipment}
          isVisible={index < 20} // Load first 20 items immediately
        />
      ))}
    </div>
  );
};

export default OptimizedEquipmentGrid;