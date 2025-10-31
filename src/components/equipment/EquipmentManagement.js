import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Layout } from '../layout';
import { useEquipment } from '../../hooks/useEquipment';
import EquipmentService from '../../services/equipmentService';
import EquipmentCard from './EquipmentCard';
import EquipmentFilters from './EquipmentFilters';
import EquipmentForm from './EquipmentForm';
import ConfirmDialog from '../common/ConfirmDialog';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import { canDeleteEquipment } from '../../utils/equipmentValidation';

const EquipmentManagement = () => {
  const { user, isAdmin } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [deletingEquipment, setDeletingEquipment] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

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
    addEquipment,
    updateEquipment: updateEquipmentInList,
    removeEquipment
  } = useEquipment({
    limit: 12
  });

  // Redirect non-admin users
  useEffect(() => {
    if (!isAdmin) {
      // In a real app, you would redirect to unauthorized page
      console.warn('Access denied: Admin privileges required');
    }
  }, [isAdmin]);

  const handleAddEquipment = () => {
    setEditingEquipment(null);
    setShowForm(true);
  };

  const handleEditEquipment = (equipment) => {
    setEditingEquipment(equipment);
    setShowForm(true);
  };

  const handleDeleteEquipment = (equipment) => {
    const deleteCheck = canDeleteEquipment(equipment);
    if (!deleteCheck.canDelete) {
      alert(deleteCheck.reason);
      return;
    }

    setDeletingEquipment(equipment);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deletingEquipment) return;

    setDeleteLoading(true);
    try {
      await EquipmentService.deleteEquipment(deletingEquipment.id);
      removeEquipment(deletingEquipment.id);
      setShowDeleteDialog(false);
      setDeletingEquipment(null);
    } catch (error) {
      console.error('Error deleting equipment:', error);
      alert('เกิดข้อผิดพลาดในการลบอุปกรณ์: ' + error.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleFormSubmit = async (equipmentData) => {
    try {
      if (editingEquipment) {
        // Update existing equipment
        updateEquipmentInList(editingEquipment.id, equipmentData);
      } else {
        // Add new equipment
        addEquipment(equipmentData);
      }
      
      setShowForm(false);
      setEditingEquipment(null);
    } catch (error) {
      console.error('Error handling form submit:', error);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingEquipment(null);
  };

  const handleFiltersChange = (newFilters) => {
    updateFilters(newFilters);
  };

  const handleLoadMore = () => {
    if (!loading && pagination.hasNextPage) {
      loadMore();
    }
  };

  // Don't render if not admin
  if (!isAdmin) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่มีสิทธิ์เข้าถึง</h3>
            <p className="mt-1 text-sm text-gray-500">คุณต้องมีสิทธิ์ผู้ดูแลระบบเพื่อเข้าถึงหน้านี้</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {!showForm ? (
          <>
            {/* Header */}
            <div className="mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">จัดการอุปกรณ์</h1>
                  <p className="mt-2 text-gray-600">
                    เพิ่ม แก้ไข และจัดการอุปกรณ์ในระบบ
                  </p>
                </div>
                
                <button
                  onClick={handleAddEquipment}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  เพิ่มอุปกรณ์
                </button>
              </div>
            </div>

            {/* Filters */}
            <EquipmentFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onReset={resetFilters}
              loading={loading}
            />

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
                        : "ยังไม่มีอุปกรณ์ในระบบ เริ่มต้นด้วยการเพิ่มอุปกรณ์ใหม่"
                    }
                    action={
                      (filters.search || filters.category || filters.status || filters.location) ? (
                        <button
                          onClick={resetFilters}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          ล้างตัวกรอง
                        </button>
                      ) : (
                        <button
                          onClick={handleAddEquipment}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          เพิ่มอุปกรณ์แรก
                        </button>
                      )
                    }
                  />
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {equipment.map((item) => (
                        <EquipmentCard
                          key={item.id}
                          equipment={item}
                          onEdit={handleEditEquipment}
                          onDelete={handleDeleteEquipment}
                          onViewDetail={(equipment) => {
                            // Show detail modal or navigate to detail page
                            console.log('View detail:', equipment);
                          }}
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
          </>
        ) : (
          /* Equipment Form */
          <div>
            <div className="mb-6">
              <nav className="flex" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-4">
                  <li>
                    <button
                      onClick={handleFormCancel}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <svg className="flex-shrink-0 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span className="sr-only">กลับ</span>
                    </button>
                  </li>
                  <li>
                    <div className="flex items-center">
                      <span className="text-gray-400">/</span>
                      <button
                        onClick={handleFormCancel}
                        className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                      >
                        จัดการอุปกรณ์
                      </button>
                    </div>
                  </li>
                  <li>
                    <div className="flex items-center">
                      <span className="text-gray-400">/</span>
                      <span className="ml-4 text-sm font-medium text-gray-900">
                        {editingEquipment ? 'แก้ไขอุปกรณ์' : 'เพิ่มอุปกรณ์ใหม่'}
                      </span>
                    </div>
                  </li>
                </ol>
              </nav>
            </div>

            <EquipmentForm
              equipment={editingEquipment}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              isEdit={!!editingEquipment}
            />
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setDeletingEquipment(null);
          }}
          onConfirm={confirmDelete}
          title="ยืนยันการลบอุปกรณ์"
          message={
            deletingEquipment
              ? `คุณแน่ใจหรือไม่ที่จะลบอุปกรณ์ "${deletingEquipment.name}" (${deletingEquipment.serialNumber}) การดำเนินการนี้ไม่สามารถยกเลิกได้`
              : ''
          }
          confirmText="ลบอุปกรณ์"
          cancelText="ยกเลิก"
          type="danger"
          loading={deleteLoading}
        />
      </div>
    </Layout>
  );
};

export default EquipmentManagement;