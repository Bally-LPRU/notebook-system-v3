import { useState } from 'react';
import { Layout } from '../layout';
import EquipmentManagementContainer from '../equipment/EquipmentManagementContainer';
import EquipmentForm from '../equipment/EquipmentForm';

/**
 * Admin Equipment Management Page
 * Provides interface for managing equipment in the system
 */
const AdminEquipmentManagement = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAddEquipment = () => {
    setEditingEquipment(null);
    setShowForm(true);
  };

  const handleEditEquipment = (equipment) => {
    setEditingEquipment(equipment);
    setShowForm(true);
  };

  const handleViewEquipment = (equipment) => {
    // For now, just edit the equipment
    handleEditEquipment(equipment);
  };

  const handleFormSubmit = async () => {
    try {
      // Form will handle the save
      setShowForm(false);
      setEditingEquipment(null);
      // Trigger refresh by updating key
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error handling form submit:', error);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingEquipment(null);
  };

  if (showForm) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto">
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
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Equipment Management Container */}
        <EquipmentManagementContainer
          key={refreshKey}
          onAddEquipment={handleAddEquipment}
          onEditEquipment={handleEditEquipment}
          onViewEquipment={handleViewEquipment}
        />
      </div>
    </Layout>
  );
};

export default AdminEquipmentManagement;
