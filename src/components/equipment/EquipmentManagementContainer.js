import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import EquipmentManagementService from '../../services/equipmentManagementService';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';

const EquipmentManagementContainer = ({
  onAddEquipment,
  onEditEquipment,
  onViewEquipment,
  className = ''
}) => {
  const { isAdmin } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load equipment data
  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await EquipmentManagementService.getEquipmentList({});
      setEquipment(result.equipment || []);
    } catch (error) {
      console.error('Error loading equipment:', error);
      setError('ไม่สามารถโหลดข้อมูลอุปกรณ์ได้: ' + error.message);
    } finally {
      setLoading(false);
    }
  };



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
          <div className="flex items-center">
            <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-lg font-medium text-red-900">เกิดข้อผิดพลาด</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={loadEquipment}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            ลองใหม่อีกครั้ง
          </button>
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {equipment.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  item.status === 'available' ? 'bg-green-100 text-green-800' :
                  item.status === 'borrowed' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {item.status === 'available' ? 'พร้อมใช้งาน' :
                   item.status === 'borrowed' ? 'ถูกยืม' : item.status}
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <p><span className="font-medium">ยี่ห้อ:</span> {item.brand || '-'}</p>
                <p><span className="font-medium">รุ่น:</span> {item.model || '-'}</p>
                <p><span className="font-medium">หมายเลข:</span> {item.serialNumber || '-'}</p>
              </div>

              <div className="flex gap-2">
                {onViewEquipment && (
                  <button
                    onClick={() => onViewEquipment(item)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    ดูรายละเอียด
                  </button>
                )}
                {isAdmin && onEditEquipment && (
                  <button
                    onClick={() => onEditEquipment(item)}
                    className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    แก้ไข
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results Summary */}
      {equipment.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          แสดง {equipment.length} รายการ
        </div>
      )}
    </div>
  );
};

export default EquipmentManagementContainer;