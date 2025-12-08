import { useState } from 'react';
import { Layout } from '../layout';
import EquipmentManagementContainer from '../equipment/EquipmentManagementContainer';
import EquipmentForm from '../equipment/EquipmentForm';
import EquipmentManagementService from '../../services/equipmentManagementService';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Admin Equipment Management Page
 * Provides interface for managing equipment in the system
 */
const AdminEquipmentManagement = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [viewingEquipment, setViewingEquipment] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteModal, setDeleteModal] = useState({ show: false, equipment: null });
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleAddEquipment = () => {
    setEditingEquipment(null);
    setViewingEquipment(null);
    setShowForm(true);
  };

  const handleEditEquipment = (equipment) => {
    setEditingEquipment(equipment);
    setViewingEquipment(null);
    setShowForm(true);
  };

  const handleViewEquipment = (equipment) => {
    setViewingEquipment(equipment);
    setShowForm(false);
  };

  const handleDeleteClick = (equipment) => {
    setDeleteModal({ show: true, equipment });
    setDeleteError('');
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.equipment) return;
    
    setDeleting(true);
    setDeleteError('');
    
    try {
      await EquipmentManagementService.deleteEquipment(
        deleteModal.equipment.id,
        user.uid,
        { role: 'admin' }
      );
      
      setDeleteModal({ show: false, equipment: null });
      setSuccessMessage(`ลบอุปกรณ์ "${deleteModal.equipment.name}" สำเร็จ`);
      setRefreshKey(prev => prev + 1);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting equipment:', error);
      setDeleteError(error.message || 'เกิดข้อผิดพลาดในการลบอุปกรณ์');
    } finally {
      setDeleting(false);
    }
  };

  const handleFormSubmit = async () => {
    try {
      setShowForm(false);
      setEditingEquipment(null);
      setSuccessMessage(editingEquipment ? 'แก้ไขอุปกรณ์สำเร็จ' : 'เพิ่มอุปกรณ์สำเร็จ');
      setRefreshKey(prev => prev + 1);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error handling form submit:', error);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingEquipment(null);
  };

  const handleCloseView = () => {
    setViewingEquipment(null);
  };

  // View Equipment Detail Modal
  if (viewingEquipment) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="mb-6">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-4">
                <li>
                  <button onClick={handleCloseView} className="text-gray-400 hover:text-gray-500">
                    <svg className="flex-shrink-0 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </li>
                <li>
                  <div className="flex items-center">
                    <span className="text-gray-400">/</span>
                    <button onClick={handleCloseView} className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700">
                      จัดการอุปกรณ์
                    </button>
                  </div>
                </li>
                <li>
                  <div className="flex items-center">
                    <span className="text-gray-400">/</span>
                    <span className="ml-4 text-sm font-medium text-gray-900">รายละเอียดอุปกรณ์</span>
                  </div>
                </li>
              </ol>
            </nav>
          </div>

          {/* Equipment Detail Card */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">{viewingEquipment.name}</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditEquipment(viewingEquipment)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  แก้ไข
                </button>
                <button
                  onClick={() => handleDeleteClick(viewingEquipment)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  ลบ
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image */}
                <div>
                  {viewingEquipment.images && viewingEquipment.images.length > 0 ? (
                    <img
                      src={viewingEquipment.images[0].url || viewingEquipment.images[0].thumbnailUrl}
                      alt={viewingEquipment.name}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">หมายเลขครุภัณฑ์</p>
                      <p className="font-mono font-medium">{viewingEquipment.equipmentNumber || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">สถานะ</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        viewingEquipment.status === 'available' ? 'bg-green-100 text-green-800' :
                        viewingEquipment.status === 'borrowed' ? 'bg-yellow-100 text-yellow-800' :
                        viewingEquipment.status === 'maintenance' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {viewingEquipment.status === 'available' ? 'พร้อมใช้งาน' :
                         viewingEquipment.status === 'borrowed' ? 'ถูกยืม' :
                         viewingEquipment.status === 'maintenance' ? 'ซ่อมบำรุง' :
                         viewingEquipment.status === 'retired' ? 'เลิกใช้งาน' : viewingEquipment.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">ยี่ห้อ</p>
                      <p className="font-medium">{viewingEquipment.brand || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">รุ่น</p>
                      <p className="font-medium">{viewingEquipment.model || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">ประเภท</p>
                      <p className="font-medium">{viewingEquipment.category?.name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">ราคาซื้อ</p>
                      <p className="font-medium">
                        {viewingEquipment.purchasePrice ? `${viewingEquipment.purchasePrice.toLocaleString('th-TH')} บาท` : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">สถานที่</p>
                      <p className="font-medium">
                        {typeof viewingEquipment.location === 'object'
                          ? `${viewingEquipment.location.building || ''} ${viewingEquipment.location.floor || ''} ${viewingEquipment.location.room || ''}`.trim() || '-'
                          : viewingEquipment.location || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">ผู้จำหน่าย</p>
                      <p className="font-medium">{viewingEquipment.vendor || '-'}</p>
                    </div>
                  </div>

                  {viewingEquipment.description && (
                    <div>
                      <p className="text-sm text-gray-500">รายละเอียด</p>
                      <p className="text-gray-700">{viewingEquipment.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (showForm) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-4">
                <li>
                  <button onClick={handleFormCancel} className="text-gray-400 hover:text-gray-500">
                    <svg className="flex-shrink-0 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </li>
                <li>
                  <div className="flex items-center">
                    <span className="text-gray-400">/</span>
                    <button onClick={handleFormCancel} className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700">
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
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-700">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Equipment Management Container */}
        <EquipmentManagementContainer
          key={refreshKey}
          onAddEquipment={handleAddEquipment}
          onEditEquipment={handleEditEquipment}
          onViewEquipment={handleViewEquipment}
          onDeleteEquipment={handleDeleteClick}
        />

        {/* Delete Confirmation Modal */}
        {deleteModal.show && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => !deleting && setDeleteModal({ show: false, equipment: null })} />
              <div className="relative bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">ยืนยันการลบอุปกรณ์</h3>
                </div>
                
                <p className="text-gray-600 mb-4">
                  คุณต้องการลบอุปกรณ์ <span className="font-medium">"{deleteModal.equipment?.name}"</span> ใช่หรือไม่?
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  หมายเลขครุภัณฑ์: {deleteModal.equipment?.equipmentNumber || '-'}
                </p>

                {deleteError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{deleteError}</p>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setDeleteModal({ show: false, equipment: null })}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    disabled={deleting}
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={deleting}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {deleting && (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    ลบอุปกรณ์
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminEquipmentManagement;
