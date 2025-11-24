import { useState } from 'react';
import { useEquipment } from '../hooks/useEquipment';

/**
 * Equipment Page Content (Client-side only)
 * This component is dynamically imported to ensure client-side rendering
 */
const EquipmentPageClient = () => {
  const { equipment, loading, error } = useEquipment({ limit: 50 });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Simple client-side filtering
  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = !searchTerm || 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูลอุปกรณ์...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-900">เกิดข้อผิดพลาด</h3>
          <p className="text-red-700 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">รายการอุปกรณ์</h1>
        <p className="text-gray-600 mt-2">ดูรายการอุปกรณ์ที่พร้อมให้บริการ</p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ค้นหา
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อ, ยี่ห้อ, รุ่น..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              สถานะ
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">ทั้งหมด</option>
              <option value="available">พร้อมใช้งาน</option>
              <option value="borrowed">ถูกยืม</option>
              <option value="maintenance">ซ่อมบำรุง</option>
            </select>
          </div>
        </div>
      </div>

      {/* Equipment Grid */}
      {filteredEquipment.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="mt-4 text-gray-600">ไม่พบอุปกรณ์</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEquipment.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {item.name}
              </h3>
              
              <div className="space-y-1 text-sm text-gray-600 mb-3">
                <p><span className="font-medium">ยี่ห้อ:</span> {item.brand || '-'}</p>
                <p><span className="font-medium">รุ่น:</span> {item.model || '-'}</p>
                <p><span className="font-medium">Serial:</span> {item.serialNumber || '-'}</p>
                <p><span className="font-medium">สถานที่:</span> {item.location || '-'}</p>
              </div>

              <div className="flex items-center justify-between">
                <span className={`inline-block px-2 py-1 text-xs rounded ${
                  item.status === 'available' 
                    ? 'bg-green-100 text-green-800' 
                    : item.status === 'borrowed'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {item.status === 'available' ? 'พร้อมใช้งาน' : 
                   item.status === 'borrowed' ? 'ถูกยืม' : 
                   item.status === 'maintenance' ? 'ซ่อมบำรุง' : item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results Count */}
      <div className="mt-6 text-center text-sm text-gray-500">
        แสดง {filteredEquipment.length} รายการ
        {searchTerm || selectedStatus !== 'all' ? ` (จากทั้งหมด ${equipment.length} รายการ)` : ''}
      </div>
    </div>
  );
};

export default EquipmentPageClient;
