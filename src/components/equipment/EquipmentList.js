import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Layout } from '../layout';
import { useEquipment } from '../../hooks/useEquipment';
import { useCategories } from '../../contexts/EquipmentCategoriesContext';
import EquipmentCard from './EquipmentCard';
import EquipmentFilters from './EquipmentFilters';
import BulkActions from '../common/BulkActions';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import LoanRequestForm from '../loans/LoanRequestForm';
import EquipmentService from '../../services/equipmentService';
import LoanRequestService from '../../services/loanRequestService';
import { useNavigate } from 'react-router-dom';

const EquipmentList = () => {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [userActiveRequests, setUserActiveRequests] = useState({});
  const [equipmentSearch, setEquipmentSearch] = useState('');

  // Get categories from context
  const { categories, loading: categoriesLoading } = useCategories();

  const {
    equipment,
    loading,
    error,
    pagination,
    filters,
    loadMore,
    updateFilters,
    resetFilters,
    refreshEquipment,
    triggerLoad
  } = useEquipment({
    skipInitialLoad: !isAdmin, // Admin can see all, users need to select category first
    limit: 12,
    filters: { status: isAdmin ? undefined : 'available', category: selectedCategory }
  });

  // Filter equipment by search term (client-side for quick filtering)
  const filteredEquipment = equipment.filter(item => {
    if (!equipmentSearch.trim()) return true;
    const search = equipmentSearch.toLowerCase();
    return (
      item.name?.toLowerCase().includes(search) ||
      item.brand?.toLowerCase().includes(search) ||
      item.model?.toLowerCase().includes(search) ||
      item.serialNumber?.toLowerCase().includes(search) ||
      item.equipmentNumber?.toLowerCase().includes(search)
    );
  });

  // Handle category selection
  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setEquipmentSearch('');
    updateFilters({ status: isAdmin ? undefined : 'available', category: categoryId });
    triggerLoad();
  };

  // Get selected category name
  const getSelectedCategoryName = () => {
    if (!selectedCategory) return null;
    const category = categories.find(c => c.id === selectedCategory);
    return category?.name || null;
  };

  // Handle equipment actions
  const handleBorrow = (equipment) => {
    setSelectedEquipment(equipment);
    setShowBorrowModal(true);
  };

  const handleReserve = (equipment) => {
    setSelectedEquipment(equipment);
    setShowReserveModal(true);
  };

  const handleEdit = (equipment) => {
    // Navigate to edit form (will be implemented in task 4.3)
    console.log('Edit equipment:', equipment);
  };

  const handleDelete = (equipment) => {
    // Show delete confirmation (will be implemented in task 4.3)
    console.log('Delete equipment:', equipment);
  };

  const handleViewDetail = (equipment) => {
    setSelectedEquipment(equipment);
    setShowDetailModal(true);
  };

  const handleFiltersChange = (newFilters) => {
    updateFilters(newFilters);
  };

  const handleLoadMore = () => {
    if (!loading && pagination.hasNextPage) {
      loadMore();
    }
  };

  // Bulk actions handlers
  const handleSelectItem = (equipmentId, isSelected) => {
    if (isSelected) {
      setSelectedItems(prev => [...prev, equipmentId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== equipmentId));
    }
  };

  const handleSelectAll = () => {
    setSelectedItems(equipment.map(item => item.id));
  };

  const handleDeselectAll = () => {
    setSelectedItems([]);
  };

  const handleBulkAction = async (actionId, itemIds, actionData) => {
    setBulkActionLoading(true);
    try {
      switch (actionId) {
        case 'updateStatus':
          if (!actionData.status) {
            throw new Error('กรุณาเลือกสถานะ');
          }
          for (const itemId of itemIds) {
            await EquipmentService.updateEquipment(itemId, { status: actionData.status });
          }
          break;

        case 'updateLocation':
          if (!actionData.location) {
            throw new Error('กรุณาระบุสถานที่');
          }
          for (const itemId of itemIds) {
            await EquipmentService.updateEquipment(itemId, { location: actionData.location });
          }
          break;

        case 'export':
          await exportSelectedEquipment(itemIds);
          break;

        case 'delete':
          for (const itemId of itemIds) {
            await EquipmentService.deleteEquipment(itemId);
          }
          break;

        default:
          throw new Error('การดำเนินการไม่ถูกต้อง');
      }

      // Refresh equipment list
      refreshEquipment();
      setSelectedItems([]);
      alert(`ดำเนินการเรียบร้อยแล้ว (${itemIds.length} รายการ)`);
    } catch (error) {
      console.error('Bulk action error:', error);
      throw error;
    } finally {
      setBulkActionLoading(false);
    }
  };

  const exportSelectedEquipment = async (itemIds) => {
    try {
      const selectedEquipmentData = equipment.filter(item => itemIds.includes(item.id));
      
      const csvData = selectedEquipmentData.map(item => ({
        'ชื่ออุปกรณ์': item.name,
        'ประเภท': item.category,
        'ยี่ห้อ': item.brand,
        'รุ่น': item.model,
        'หมายเลขซีเรียล': item.serialNumber,
        'สถานะ': item.status,
        'สถานที่': item.location,
        'รายละเอียด': item.description,
        'วันที่สร้าง': item.createdAt?.toDate().toLocaleDateString('th-TH')
      }));

      const headers = Object.keys(csvData[0] || {});
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `equipment-export-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export error:', error);
      throw new Error('เกิดข้อผิดพลาดในการส่งออกข้อมูล');
    }
  };

  // Close modals
  const closeModals = () => {
    setShowBorrowModal(false);
    setShowReserveModal(false);
    setShowDetailModal(false);
    setSelectedEquipment(null);
  };

  // Handle successful loan request
  const handleLoanRequestSuccess = (createdRequest) => {
    closeModals();
    refreshEquipment(); // Refresh equipment list to update status
    if (createdRequest?.equipmentId) {
      setUserActiveRequests((prev) => ({
        ...prev,
        [createdRequest.equipmentId]: createdRequest
      }));
    }
    alert('ส่งคำขอยืมเรียบร้อยแล้ว รอการอนุมัติจากผู้ดูแลระบบ');
    navigate('/my-requests');
  };

  const loadUserActiveRequests = useCallback(async () => {
    if (!user || isAdmin) return;
    const active = await LoanRequestService.getActiveRequestsForUser(user.uid);
    const map = {};
    active.forEach((req) => {
      if (req.equipmentId && !map[req.equipmentId]) {
        map[req.equipmentId] = req;
      }
    });
    setUserActiveRequests(map);
  }, [user, isAdmin]);

  useEffect(() => {
    loadUserActiveRequests();
  }, [loadUserActiveRequests]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        {/* Header - Mobile Optimized */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">รายการอุปกรณ์</h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
                ดูและค้นหาอุปกรณ์ที่พร้อมให้ยืม
              </p>
            </div>
            
            {isAdmin && (
              <button
                onClick={() => {/* Navigate to add equipment form */}}
                className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                เพิ่มอุปกรณ์
              </button>
            )}
          </div>
        </div>

        {/* Info Box - Mobile: Collapsible/Compact */}
        {!isAdmin && (
          <div className="mb-4 sm:mb-6 bg-gradient-to-r from-blue-50 to-yellow-50 border border-blue-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h4 className="text-xs sm:text-sm font-semibold text-gray-800 mb-1.5 sm:mb-2">วิธีการขอใช้อุปกรณ์</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                  <div className="flex items-start gap-1.5 sm:gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 bg-blue-600 text-white rounded-full text-xs font-bold flex-shrink-0">1</span>
                    <div>
                      <span className="font-medium text-blue-800">ยืมทันที</span>
                      <p className="text-gray-600 hidden sm:block">ส่งคำขอยืมและรอ admin อนุมัติ</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5 sm:gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 bg-yellow-500 text-white rounded-full text-xs font-bold flex-shrink-0">2</span>
                    <div>
                      <span className="font-medium text-yellow-700">จองล่วงหน้า</span>
                      <p className="text-gray-600 hidden sm:block">เลือกวันและเวลาที่ต้องการใช้</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category Selector - For Users */}
        {!isAdmin && (
          <div className="mb-4 sm:mb-6 bg-white rounded-lg shadow-sm border p-3 sm:p-4">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 bg-blue-600 text-white rounded-full text-xs font-bold">1</span>
              เลือกประเภทอุปกรณ์
            </h3>
            
            {categoriesLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    className={`
                      p-2 sm:p-3 rounded-lg border text-left transition-all
                      ${selectedCategory === category.id
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      {category.icon ? (
                        <span className="text-lg sm:text-xl">{category.icon}</span>
                      ) : (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      )}
                      <span className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                        {category.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {categories.length === 0 && !categoriesLoading && (
              <div className="text-center py-4 text-gray-500 text-sm">
                <p>ไม่มีประเภทอุปกรณ์</p>
              </div>
            )}

            {/* Selected Category Indicator */}
            {selectedCategory && getSelectedCategoryName() && (
              <div className="mt-3 flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
                <span className="text-xs sm:text-sm text-blue-700">
                  กำลังแสดง: <span className="font-semibold">{getSelectedCategoryName()}</span>
                  {equipment.length > 0 && ` (${filteredEquipment.length} รายการ)`}
                </span>
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setEquipmentSearch('');
                    resetFilters();
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  ล้างตัวเลือก
                </button>
              </div>
            )}
          </div>
        )}

        {/* Search box for users (show when category selected and > 5 items) */}
        {!isAdmin && selectedCategory && equipment.length > 5 && (
          <div className="mb-4 sm:mb-6 bg-white rounded-lg shadow-sm border p-3 sm:p-4">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 bg-blue-600 text-white rounded-full text-xs font-bold">2</span>
              ค้นหาอุปกรณ์
            </h3>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="ค้นหาชื่อ, ยี่ห้อ, รุ่น, หมายเลขครุภัณฑ์..."
                value={equipmentSearch}
                onChange={(e) => setEquipmentSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {equipmentSearch && (
                <button
                  onClick={() => setEquipmentSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Filters - Only show for admin or when user has selected category */}
        {(isAdmin || selectedCategory) && (
          <EquipmentFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onReset={resetFilters}
            loading={loading}
          />
        )}

        {/* Bulk Actions */}
        {isAdmin && (
          <BulkActions
            selectedItems={selectedItems}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            totalItems={equipment.length}
            itemType="equipment"
            onBulkAction={handleBulkAction}
            loading={bulkActionLoading}
          />
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">เกิดข้อผิดพลาด</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={refreshEquipment}
                    className="text-sm font-medium text-red-800 hover:text-red-600"
                  >
                    ลองใหม่อีกครั้ง
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Equipment Grid */}
        {!error && (
          <>
            {/* Show prompt to select category for users */}
            {!isAdmin && !selectedCategory && !loading ? (
              <div className="bg-white rounded-lg shadow-sm border p-6 sm:p-8 text-center">
                <svg className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">เลือกประเภทอุปกรณ์</h3>
                <p className="text-sm text-gray-500 mb-4">
                  กรุณาเลือกประเภทอุปกรณ์ด้านบนเพื่อดูรายการอุปกรณ์ที่พร้อมให้ยืม
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {categories.slice(0, 4).map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category.id)}
                      className="px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-xs sm:text-sm font-medium hover:bg-blue-100 transition-colors"
                    >
                      {category.icon && <span className="mr-1">{category.icon}</span>}
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : equipment.length === 0 && !loading ? (
              <EmptyState
                icon={
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
                title="ไม่พบอุปกรณ์"
                description={
                  filters.search || filters.category || filters.status || filters.location
                    ? "ไม่พบอุปกรณ์ที่ตรงกับเงื่อนไขการค้นหา ลองปรับเปลี่ยนตัวกรองหรือคำค้นหา"
                    : selectedCategory
                      ? "ไม่มีอุปกรณ์ที่พร้อมให้ยืมในประเภทนี้"
                      : "ยังไม่มีอุปกรณ์ในระบบ"
                }
                action={
                  (filters.search || filters.category || filters.status || filters.location) ? (
                    <button
                      onClick={() => {
                        setSelectedCategory(null);
                        resetFilters();
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      ล้างตัวกรอง
                    </button>
                  ) : null
                }
              />
            ) : (
              <>
                {/* No results from search */}
                {!isAdmin && filteredEquipment.length === 0 && equipmentSearch && (
                  <div className="bg-white rounded-lg shadow-sm border p-6 sm:p-8 text-center">
                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <h3 className="text-base font-semibold text-gray-900 mb-2">ไม่พบอุปกรณ์ที่ค้นหา</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      ลองค้นหาด้วยคำอื่น หรือล้างการค้นหา
                    </p>
                    <button
                      onClick={() => setEquipmentSearch('')}
                      className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg hover:bg-blue-50"
                    >
                      ล้างการค้นหา
                    </button>
                  </div>
                )}

                {/* Equipment Grid - Mobile: 1 col, Tablet: 2 cols, Desktop: 3-4 cols */}
                {(isAdmin ? equipment : filteredEquipment).length > 0 && (
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                    {(isAdmin ? equipment : filteredEquipment).map((item) => (
                      <EquipmentCard
                        key={item.id}
                        equipment={item}
                        userActiveRequest={userActiveRequests[item.id]}
                        onBorrow={handleBorrow}
                        onReserve={handleReserve}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onViewDetail={handleViewDetail}
                        isSelectable={isAdmin}
                        isSelected={selectedItems.includes(item.id)}
                        onSelect={(isSelected) => handleSelectItem(item.id, isSelected)}
                      />
                    ))}
                  </div>
                )}

                {/* Load More Button - Mobile Optimized */}
                {pagination.hasNextPage && (
                  <div className="mt-6 sm:mt-8 text-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={loading}
                      className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 shadow-sm text-sm sm:text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-gray-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          กำลังโหลด...
                        </>
                      ) : (
                        <>
                          โหลดเพิ่มเติม
                          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Loading Indicator */}
                {loading && equipment.length === 0 && (
                  <div className="flex justify-center items-center py-8 sm:py-12">
                    <LoadingSpinner size="lg" />
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Results Summary - Mobile Optimized */}
        {(isAdmin ? equipment : filteredEquipment).length > 0 && (
          <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-500">
            แสดง {isAdmin ? equipment.length : filteredEquipment.length} รายการ
            {!isAdmin && equipmentSearch && equipment.length !== filteredEquipment.length && (
              <span> (จากทั้งหมด {equipment.length} รายการ)</span>
            )}
            {pagination.hasNextPage && ' (มีรายการเพิ่มเติม)'}
          </div>
        )}
      </div>

      {/* Loan Request Modal - Mobile Full Screen */}
      {showBorrowModal && selectedEquipment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-0 sm:top-4 mx-auto max-w-2xl min-h-screen sm:min-h-0">
            <LoanRequestForm
              equipmentId={selectedEquipment.id}
              onSuccess={handleLoanRequestSuccess}
              onCancel={closeModals}
            />
          </div>
        </div>
      )}

      {/* Reserve Modal - Mobile Optimized */}
      {showReserveModal && selectedEquipment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-end sm:items-center justify-center z-50">
          <div className="w-full sm:max-w-md sm:mx-4 p-4 sm:p-5 border shadow-lg rounded-t-xl sm:rounded-lg bg-white">
            <div className="mt-2 sm:mt-3">
              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 mx-auto bg-yellow-100 rounded-full">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="mt-3 sm:mt-4 text-base sm:text-lg font-medium text-gray-900 text-center">จองอุปกรณ์ล่วงหน้า</h3>
              <div className="mt-3 sm:mt-4 px-2 sm:px-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 sm:p-3 mb-3 sm:mb-4">
                  <p className="text-xs sm:text-sm text-blue-800">
                    <span className="font-semibold">การจองล่วงหน้า</span> ใช้สำหรับจองอุปกรณ์ในวันและเวลาที่ต้องการในอนาคต
                  </p>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1.5 sm:mb-2">อุปกรณ์ที่เลือก:</p>
                <p className="text-xs sm:text-sm font-medium text-gray-900 bg-gray-50 p-2 rounded truncate">
                  {selectedEquipment.name}
                </p>
              </div>
              <div className="mt-4 sm:mt-6 flex gap-2 sm:gap-3 px-2 sm:px-4 pb-2">
                <button
                  onClick={closeModals}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-100 text-gray-700 text-xs sm:text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => {
                    closeModals();
                    navigate('/reservations');
                  }}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-yellow-500 text-white text-xs sm:text-sm font-medium rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                >
                  ไปหน้าจอง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal - Mobile Full Screen */}
      {showDetailModal && selectedEquipment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-end sm:items-center justify-center z-50 overflow-y-auto">
          <div className="w-full sm:max-w-2xl sm:mx-4 p-4 sm:p-5 border shadow-lg rounded-t-xl sm:rounded-lg bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-2 sm:mt-3">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">รายละเอียดอุปกรณ์</h3>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {selectedEquipment.imageURL && (
                  <div className="sm:col-span-2">
                    <img
                      src={selectedEquipment.imageURL}
                      alt={selectedEquipment.name}
                      className="w-full h-40 sm:h-48 md:h-64 object-cover rounded-lg"
                    />
                  </div>
                )}
                
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-500">ชื่ออุปกรณ์</label>
                    <p className="text-sm sm:text-base text-gray-900">{selectedEquipment.name}</p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-500">ประเภท</label>
                    <p className="text-sm sm:text-base text-gray-900">{selectedEquipment.category}</p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-500">ยี่ห้อ</label>
                    <p className="text-sm sm:text-base text-gray-900">{selectedEquipment.brand}</p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-500">รุ่น</label>
                    <p className="text-sm sm:text-base text-gray-900">{selectedEquipment.model}</p>
                  </div>
                </div>
                
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-500">หมายเลขซีเรียล</label>
                    <p className="text-sm sm:text-base text-gray-900 font-mono">{selectedEquipment.serialNumber}</p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-500">สถานะ</label>
                    <p className="text-sm sm:text-base text-gray-900">{selectedEquipment.status}</p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-500">สถานที่</label>
                    <p className="text-sm sm:text-base text-gray-900">{selectedEquipment.location}</p>
                  </div>
                </div>
                
                {selectedEquipment.description && (
                  <div className="sm:col-span-2">
                    <label className="text-xs sm:text-sm font-medium text-gray-500">รายละเอียด</label>
                    <p className="text-sm sm:text-base text-gray-900 mt-1">{selectedEquipment.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default EquipmentList;
