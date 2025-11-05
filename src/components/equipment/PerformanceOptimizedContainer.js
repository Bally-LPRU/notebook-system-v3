/**
 * PerformanceOptimizedContainer - Container with performance optimizations
 * รวม lazy loading, caching, virtual scrolling, และ code splitting
 */

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useDebounce, PerformanceMetrics } from '../../utils/performanceOptimization';
import { LazyEquipmentComponents, preloadCriticalComponents } from '../../utils/codeSplitting';
import { useCache } from '../../hooks/useCache';
import { EquipmentGridSkeleton, EquipmentSearchSkeleton, EquipmentFiltersSkeleton } from './EquipmentSkeleton';
import OptimizedEquipmentGrid from './OptimizedEquipmentGrid';

const PerformanceOptimizedContainer = ({
  initialFilters = {},
  enableVirtualScrolling = true,
  enableLazyLoading = true,
  preloadComponents = true
}) => {
  // State management
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(initialFilters);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showBulkOperations, setShowBulkOperations] = useState(false);

  // Performance hooks
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const debouncedFilters = useDebounce(filters, 500);
  const { 
    getCachedEquipmentList, 
    setCachedEquipmentList,
    getCachedSearchResults,
    setCachedSearchResults 
  } = useCache();

  // Preload critical components
  useEffect(() => {
    if (preloadComponents) {
      preloadCriticalComponents().catch(console.error);
    }
  }, [preloadComponents]);

  // Performance monitoring
  useEffect(() => {
    PerformanceMetrics.startMeasure('equipment-container-render');
    
    return () => {
      PerformanceMetrics.endMeasure('equipment-container-render');
    };
  }, []);

  // Memoized equipment data with caching
  const memoizedEquipment = useMemo(() => {
    PerformanceMetrics.startMeasure('equipment-data-processing');
    
    // Check cache first
    const cacheKey = { filters: debouncedFilters, search: debouncedSearchQuery };
    const cached = getCachedSearchResults(debouncedSearchQuery, cacheKey);
    
    if (cached) {
      PerformanceMetrics.endMeasure('equipment-data-processing');
      return cached.equipment || [];
    }

    // Process equipment data
    let processedEquipment = equipment;

    // Apply search filter
    if (debouncedSearchQuery) {
      const searchLower = debouncedSearchQuery.toLowerCase();
      processedEquipment = processedEquipment.filter(item =>
        item.name?.toLowerCase().includes(searchLower) ||
        item.equipmentNumber?.toLowerCase().includes(searchLower) ||
        item.brand?.toLowerCase().includes(searchLower) ||
        item.model?.toLowerCase().includes(searchLower)
      );
    }

    // Apply filters
    if (debouncedFilters.categories?.length > 0) {
      processedEquipment = processedEquipment.filter(item =>
        debouncedFilters.categories.includes(item.category?.id)
      );
    }

    if (debouncedFilters.statuses?.length > 0) {
      processedEquipment = processedEquipment.filter(item =>
        debouncedFilters.statuses.includes(item.status)
      );
    }

    // Cache the results
    setCachedSearchResults(debouncedSearchQuery, cacheKey, {
      equipment: processedEquipment,
      totalCount: processedEquipment.length
    });

    PerformanceMetrics.endMeasure('equipment-data-processing');
    return processedEquipment;
  }, [equipment, debouncedSearchQuery, debouncedFilters, getCachedSearchResults, setCachedSearchResults]);

  // Load equipment data
  useEffect(() => {
    const loadEquipment = async () => {
      try {
        setLoading(true);
        PerformanceMetrics.startMeasure('equipment-data-fetch');

        // Check cache first
        const cached = getCachedEquipmentList(debouncedFilters, 1);
        if (cached) {
          setEquipment(cached.equipment);
          setLoading(false);
          PerformanceMetrics.endMeasure('equipment-data-fetch');
          return;
        }

        // Simulate API call - replace with actual service call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data - replace with actual API call
        const mockEquipment = Array.from({ length: 100 }, (_, index) => ({
          id: `eq-${index + 1}`,
          equipmentNumber: `EQ${String(index + 1).padStart(4, '0')}`,
          name: `อุปกรณ์ทดสอบ ${index + 1}`,
          brand: ['Dell', 'HP', 'Lenovo', 'Apple'][index % 4],
          model: `Model ${index + 1}`,
          status: ['active', 'maintenance', 'retired'][index % 3],
          category: {
            id: `cat-${(index % 5) + 1}`,
            name: ['คอมพิวเตอร์', 'เครื่องพิมพ์', 'โปรเจคเตอร์', 'กล้อง', 'อื่นๆ'][index % 5]
          },
          images: [{
            id: `img-${index + 1}`,
            url: `https://picsum.photos/400/300?random=${index + 1}`,
            thumbnailUrl: `https://picsum.photos/150/100?random=${index + 1}`,
            mediumUrl: `https://picsum.photos/300/200?random=${index + 1}`
          }],
          createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
          updatedAt: new Date()
        }));

        setEquipment(mockEquipment);
        
        // Cache the results
        setCachedEquipmentList(debouncedFilters, 1, {
          equipment: mockEquipment,
          pagination: { currentPage: 1, hasNextPage: false, totalItems: mockEquipment.length }
        });

        PerformanceMetrics.endMeasure('equipment-data-fetch');
      } catch (error) {
        console.error('Error loading equipment:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEquipment();
  }, [debouncedFilters, getCachedEquipmentList, setCachedEquipmentList]);

  // Event handlers
  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleEquipmentClick = (equipment) => {
    console.log('Equipment clicked:', equipment);
  };

  const handleEquipmentEdit = (equipment) => {
    console.log('Equipment edit:', equipment);
  };

  const handleEquipmentDelete = (equipment) => {
    console.log('Equipment delete:', equipment);
  };

  const handleSelectionChange = (newSelection) => {
    setSelectedItems(newSelection);
    setShowBulkOperations(newSelection.length > 0);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  // Render components
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการอุปกรณ์</h1>
          <p className="text-gray-600">
            {loading ? 'กำลังโหลด...' : `พบ ${memoizedEquipment.length} รายการ`}
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAdvancedSearch(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ค้นหาขั้นสูง
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            เพิ่มอุปกรณ์
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Suspense fallback={<EquipmentSearchSkeleton />}>
            <LazyEquipmentComponents.EquipmentSearch
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="ค้นหาอุปกรณ์..."
            />
          </Suspense>
        </div>
        
        <div>
          <Suspense fallback={<EquipmentFiltersSkeleton />}>
            <LazyEquipmentComponents.EquipmentFilters
              filters={filters}
              onChange={handleFiltersChange}
            />
          </Suspense>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-700">มุมมอง:</span>
          <div className="flex rounded-lg border border-gray-300">
            <button
              onClick={() => handleViewModeChange('grid')}
              className={`px-3 py-1 text-sm rounded-l-lg ${
                viewMode === 'grid' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              ตาราง
            </button>
            <button
              onClick={() => handleViewModeChange('list')}
              className={`px-3 py-1 text-sm rounded-r-lg ${
                viewMode === 'list' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              รายการ
            </button>
          </div>
        </div>

        {selectedItems.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">
              เลือก {selectedItems.length} รายการ
            </span>
            <button
              onClick={() => setShowBulkOperations(true)}
              className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
            >
              จัดการแบบกลุ่ม
            </button>
          </div>
        )}
      </div>

      {/* Equipment Grid */}
      <OptimizedEquipmentGrid
        equipment={memoizedEquipment}
        loading={loading}
        onEquipmentClick={handleEquipmentClick}
        onEquipmentEdit={handleEquipmentEdit}
        onEquipmentDelete={handleEquipmentDelete}
        selectedItems={selectedItems}
        onSelectionChange={handleSelectionChange}
        viewMode={viewMode}
        itemsPerRow={viewMode === 'grid' ? 3 : 1}
        enableVirtualScrolling={enableVirtualScrolling}
        enableLazyLoading={enableLazyLoading}
      />

      {/* Advanced Search Modal */}
      {showAdvancedSearch && (
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">กำลังโหลด...</div>}>
          <LazyEquipmentComponents.AdvancedSearchModal
            isOpen={showAdvancedSearch}
            onClose={() => setShowAdvancedSearch(false)}
            onSearch={(criteria) => {
              console.log('Advanced search:', criteria);
              setShowAdvancedSearch(false);
            }}
          />
        </Suspense>
      )}

      {/* Bulk Operations Modal */}
      {showBulkOperations && (
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">กำลังโหลด...</div>}>
          <LazyEquipmentComponents.BulkOperationsContainer
            selectedItems={selectedItems}
            onClose={() => {
              setShowBulkOperations(false);
              setSelectedItems([]);
            }}
            onComplete={() => {
              setShowBulkOperations(false);
              setSelectedItems([]);
              // Refresh data
            }}
          />
        </Suspense>
      )}
    </div>
  );
};

export default PerformanceOptimizedContainer;