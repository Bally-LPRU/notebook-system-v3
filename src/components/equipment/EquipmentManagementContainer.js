import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import EquipmentManagementService from '../../services/equipmentManagementService';
import EquipmentCategoryService from '../../services/equipmentCategoryService';
import { getCategoryId } from '../../utils/equipmentHelpers';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import EquipmentStatusBadge from './EquipmentStatusBadge';

const EquipmentManagementContainer = ({
  onAddEquipment,
  onEditEquipment,
  onViewEquipment,
  className = ''
}) => {
  const { isAdmin, refreshToken } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPermissionError, setIsPermissionError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState([]);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Memoized filtered equipment calculation
  const filteredEquipment = useMemo(() => {
    let filtered = [...equipment];

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(search) ||
        item.brand?.toLowerCase().includes(search) ||
        item.model?.toLowerCase().includes(search) ||
        item.equipmentNumber?.toLowerCase().includes(search) ||
        item.serialNumber?.toLowerCase().includes(search)
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => {
        const itemCategory = getCategoryId(item.category);
        return itemCategory === selectedCategory;
      });
    }

    // Apply status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(item => item.status === selectedStatus);
    }

    return filtered;
  }, [equipment, searchTerm, selectedCategory, selectedStatus]);
  
  // Memoized pagination calculations
  const { totalPages, startIndex, endIndex, paginatedEquipment } = useMemo(() => {
    const total = Math.ceil(filteredEquipment.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginated = filteredEquipment.slice(start, end);
    
    return {
      totalPages: total,
      startIndex: start,
      endIndex: end,
      paginatedEquipment: paginated
    };
  }, [filteredEquipment, currentPage, itemsPerPage]);

  // Load categories from Firebase
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await EquipmentCategoryService.getCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };

    loadCategories();
  }, []);

  // Memoized loadEquipment function
  const loadEquipment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setIsPermissionError(false);
      
      console.log('🔄 กำลังโหลดข้อมูลอุปกรณ์...');
      const result = await EquipmentManagementService.getEquipmentList({});
      console.log('📦 ผลลัพธ์จาก getEquipmentList:', result);
      console.log('📊 จำนวนอุปกรณ์:', result.equipment?.length || 0);
      
      if (result.equipment && result.equipment.length > 0) {
        console.log('✅ พบอุปกรณ์:', result.equipment);
      } else {
        console.warn('⚠️  ไม่พบอุปกรณ์ในผลลัพธ์');
      }
      
      const equipmentData = result.equipment || [];
      setEquipment(equipmentData);
    } catch (error) {
      console.error('❌ Error loading equipment:', error);
      console.error('   Error code:', error.code);
      console.error('   Error message:', error.message);
      
      // Check if it's a permission error
      if (error.code === 'permission-denied' || error.message.includes('permission') || error.message.includes('Missing or insufficient permissions')) {
        setIsPermissionError(true);
        setError('ไม่มีสิทธิ์เข้าถึงข้อมูลอุปกรณ์ อาจเป็นเพราะ auth token หมดอายุ');
      } else {
        setError('ไม่สามารถโหลดข้อมูลอุปกรณ์ได้: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Load equipment data on mount
  useEffect(() => {
    loadEquipment();
  }, [loadEquipment]);

  const handleRefreshToken = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      setIsPermissionError(false);
      
      console.log('🔄 กำลัง refresh token...');
      await refreshToken();
      
      // Wait a moment for token to propagate
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reload equipment after token refresh
      console.log('📥 กำลังโหลดข้อมูลอุปกรณ์ใหม่...');
      await loadEquipment();
      
      console.log('✅ Refresh token และโหลดข้อมูลสำเร็จ');
    } catch (error) {
      console.error('Error refreshing token:', error);
      setError('ไม่สามารถ refresh token ได้: ' + error.message);
      console.error('❌ Refresh token ล้มเหลว:', error.message);
    } finally {
      setRefreshing(false);
    }
  }, [refreshToken, loadEquipment]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedStatus]);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedStatus('all');
  }, []);

  // Memoized handlers for pagination
  const handlePreviousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  const handlePageClick = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-600">กำลังโหลดข้อมูลอุปกรณ์...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-lg font-medium text-red-900">เกิดข้อผิดพลาด</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
          
          {isPermissionError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-medium text-yellow-900 mb-2">💡 วิธีแก้ไข:</h4>
              <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                <li>คลิกปุ่ม "Refresh Token" ด้านล่าง</li>
                <li>หรือลองออกจากระบบแล้วเข้าสู่ระบบใหม่</li>
                <li>หรือรีเฟรชหน้าเว็บ (F5)</li>
              </ul>
            </div>
          )}
          
          <div className="flex gap-3">
            {isPermissionError && (
              <button
                onClick={handleRefreshToken}
                disabled={refreshing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
              >
                {refreshing ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลัง Refresh...
                  </>
                ) : (
                  <>
                    🔄 Refresh Token
                  </>
                )}
              </button>
            )}
            <button
              onClick={loadEquipment}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการอุปกรณ์</h1>
          <p className="text-gray-600">จัดการข้อมูลอุปกรณ์ในระบบ</p>
        </div>
        
        {/* Add Equipment Button */}
        {isAdmin && onAddEquipment && (
          <button
            onClick={onAddEquipment}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            เพิ่มอุปกรณ์
          </button>
        )}
      </div>

      {/* Search and Filters */}
      {equipment.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                ค้นหา
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ค้นหาชื่อ, ยี่ห้อ, รุ่น, หมายเลข..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                ประเภท
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">ทั้งหมด</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                สถานะ
              </label>
              <select
                id="status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">ทั้งหมด</option>
                <option value="available">พร้อมใช้งาน</option>
                <option value="borrowed">ถูกยืม</option>
                <option value="maintenance">ซ่อมบำรุง</option>
                <option value="retired">เลิกใช้งาน</option>
              </select>
            </div>
          </div>

          {/* Active Filters Summary */}
          {(searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all') && (
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600">ตัวกรองที่ใช้:</span>
                {searchTerm && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    ค้นหา: "{searchTerm}"
                  </span>
                )}
                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    ประเภท: {document.querySelector(`#category option[value="${selectedCategory}"]`)?.text}
                  </span>
                )}
                {selectedStatus !== 'all' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    สถานะ: {document.querySelector(`#status option[value="${selectedStatus}"]`)?.text}
                  </span>
                )}
              </div>
              <button
                onClick={handleClearFilters}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                ล้างตัวกรอง
              </button>
            </div>
          )}
        </div>
      )}

      {/* Equipment List */}
      {equipment.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
          title="ยังไม่มีอุปกรณ์ในระบบ"
          description="เริ่มต้นด้วยการเพิ่มอุปกรณ์ใหม่"
          action={
            isAdmin && onAddEquipment && (
              <button
                onClick={onAddEquipment}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                เพิ่มอุปกรณ์แรก
              </button>
            )
          }
        />
      ) : filteredEquipment.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">ไม่พบอุปกรณ์ที่ตรงกับเงื่อนไข</h3>
          <p className="mt-2 text-gray-500">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
          <button
            onClick={handleClearFilters}
            className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            ล้างตัวกรอง
          </button>
        </div>
      ) : (
        <>
          {/* Equipment Cards Grid */}
          <div className="space-y-4">
            {paginatedEquipment.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="flex">
                  {/* Equipment Image */}
                  <div className="w-32 h-32 flex-shrink-0 bg-gray-100 relative">
                    {item.images && item.images.length > 0 ? (
                      <>
                        <img
                          src={item.images[0].thumbnailUrl || item.images[0].url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="absolute inset-0 hidden items-center justify-center" style={{ display: 'none' }}>
                          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </>
                    ) : item.imageURL ? (
                      <>
                        <img
                          src={item.imageURL}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="absolute inset-0 hidden items-center justify-center" style={{ display: 'none' }}>
                          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Image Count Badge */}
                    {item.images && item.images.length > 1 && (
                      <div className="absolute bottom-2 left-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-black bg-opacity-50 text-white">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {item.images.length}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Equipment Info */}
                  <div className="flex-1 p-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-base font-semibold text-gray-900 truncate">
                          {item.name}
                        </h3>
                        <EquipmentStatusBadge 
                          status={item.status} 
                          size="sm"
                          className="whitespace-nowrap"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
                        <span>
                          <span className="font-medium text-gray-700">ยี่ห้อ:</span> {item.brand || '-'}
                        </span>
                        <span>
                          <span className="font-medium text-gray-700">รุ่น:</span> {item.model || '-'}
                        </span>
                        <span>
                          <span className="font-medium text-gray-700">หมายเลข:</span> 
                          <span className="font-mono ml-1">{item.equipmentNumber || item.serialNumber || '-'}</span>
                        </span>
                        <span>
                          <span className="font-medium text-gray-700">สถานที่:</span> {
                            typeof item.location === 'object' 
                              ? `${item.location.building || ''} ${item.location.room || ''}`.trim() || '-'
                              : item.location || '-'
                          }
                        </span>
                        
                        {/* Purchase Price */}
                        {item.purchasePrice && (
                          <span>
                            <span className="font-medium text-gray-700">ราคาซื้อ:</span> {
                              typeof item.purchasePrice === 'number' 
                                ? item.purchasePrice.toLocaleString('th-TH') 
                                : item.purchasePrice
                            } บาท
                          </span>
                        )}
                        
                        {/* Supplier/Vendor */}
                        {(item.supplier || item.vendor) && (
                          <span>
                            <span className="font-medium text-gray-700">ผู้จำหน่าย:</span> {item.supplier || item.vendor}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 ml-4">
                      {onViewEquipment && (
                        <button
                          onClick={() => onViewEquipment(item)}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          title="ดูรายละเอียด"
                        >
                          ดูรายละเอียด
                        </button>
                      )}
                      {isAdmin && onEditEquipment && (
                        <button
                          onClick={() => onEditEquipment(item)}
                          className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          title="แก้ไข"
                        >
                          แก้ไข
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ก่อนหน้า
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ถัดไป
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    แสดง <span className="font-medium">{startIndex + 1}</span> ถึง{' '}
                    <span className="font-medium">{Math.min(endIndex, filteredEquipment.length)}</span> จาก{' '}
                    <span className="font-medium">{filteredEquipment.length}</span> รายการ
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">ก่อนหน้า</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Page Numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageClick(page)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                              currentPage === page
                                ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <span
                            key={page}
                            className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300"
                          >
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                    
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">ถัดไป</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EquipmentManagementContainer;