import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Layout } from '../layout';
import { useEquipment } from '../../hooks/useEquipment';
import EquipmentCard from './EquipmentCard';
import EquipmentFilters from './EquipmentFilters';
import BulkActions from '../common/BulkActions';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import LoanRequestForm from '../loans/LoanRequestForm';
import EquipmentService from '../../services/equipmentService';

const EquipmentList = () => {
  const { isAdmin } = useAuth();
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const {
    equipment,
    loading,
    error,
    pagination,
    filters,
    loadMore,
    updateFilters,
    resetFilters,
    refreshEquipment
  } = useEquipment({
    limit: 12
  });

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
  const handleLoanRequestSuccess = () => {
    closeModals();
    refreshEquipment(); // Refresh equipment list to update status
    // Show success message (could be implemented with a toast notification)
    alert('ส่งคำขอยืมเรียบร้อยแล้ว รอการอนุมัติจากผู้ดูแลระบบ');
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">รายการอุปกรณ์</h1>
              <p className="mt-2 text-gray-600">
                ดูและค้นหาอุปกรณ์ที่พร้อมให้ยืม
              </p>
            </div>
            
            {isAdmin && (
              <button
                onClick={() => {/* Navigate to add equipment form */}}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                เพิ่มอุปกรณ์
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <EquipmentFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onReset={resetFilters}
          loading={loading}
        />

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
            {equipment.length === 0 && !loading ? (
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
                    : "ยังไม่มีอุปกรณ์ในระบบ"
                }
                action={
                  (filters.search || filters.category || filters.status || filters.location) ? (
                    <button
                      onClick={resetFilters}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      ล้างตัวกรอง
                    </button>
                  ) : null
                }
              />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {equipment.map((item) => (
                    <EquipmentCard
                      key={item.id}
                      equipment={item}
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

                {/* Load More Button */}
                {pagination.hasNextPage && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={loading}
                      className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24">
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
                  <div className="flex justify-center items-center py-12">
                    <LoadingSpinner size="lg" />
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Results Summary */}
        {equipment.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-500">
            แสดง {equipment.length} รายการ
            {pagination.hasNextPage && ' (มีรายการเพิ่มเติม)'}
          </div>
        )}
      </div>

      {/* Loan Request Modal */}
      {showBorrowModal && selectedEquipment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto max-w-2xl">
            <LoanRequestForm
              equipmentId={selectedEquipment.id}
              onSuccess={handleLoanRequestSuccess}
              onCancel={closeModals}
            />
          </div>
        </div>
      )}

      {showReserveModal && selectedEquipment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">จองอุปกรณ์</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  ฟีเจอร์การจองจะพัฒนาในขั้นตอนถัดไป
                </p>
                <p className="text-sm font-medium text-gray-900 mt-2">
                  {selectedEquipment.name}
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={closeModals}
                  className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedEquipment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">รายละเอียดอุปกรณ์</h3>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedEquipment.imageURL && (
                  <div className="md:col-span-2">
                    <img
                      src={selectedEquipment.imageURL}
                      alt={selectedEquipment.name}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>
                )}
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">ชื่ออุปกรณ์</label>
                    <p className="text-gray-900">{selectedEquipment.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">ประเภท</label>
                    <p className="text-gray-900">{selectedEquipment.category}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">ยี่ห้อ</label>
                    <p className="text-gray-900">{selectedEquipment.brand}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">รุ่น</label>
                    <p className="text-gray-900">{selectedEquipment.model}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">หมายเลขซีเรียล</label>
                    <p className="text-gray-900 font-mono text-sm">{selectedEquipment.serialNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">สถานะ</label>
                    <p className="text-gray-900">{selectedEquipment.status}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">สถานที่</label>
                    <p className="text-gray-900">{selectedEquipment.location}</p>
                  </div>
                </div>
                
                {selectedEquipment.description && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">รายละเอียด</label>
                    <p className="text-gray-900 mt-1">{selectedEquipment.description}</p>
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