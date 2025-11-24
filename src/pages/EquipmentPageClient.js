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
  const [selectedEquipment, setSelectedEquipment] = useState(null);

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
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Equipment Image */}
              <div className="h-48 bg-gray-100 relative">
                {item.images && item.images.length > 0 ? (
                  <img
                    src={item.images[0].url || item.images[0].thumbnailUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : item.imageURL ? (
                  <img
                    src={item.imageURL}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="absolute inset-0 flex items-center justify-center" style={{ display: (item.images?.length > 0 || item.imageURL) ? 'none' : 'flex' }}>
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                
                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  <span className={`inline-block px-2 py-1 text-xs rounded shadow-sm ${
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

                {/* Image Count */}
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
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {item.name}
                </h3>
                
                <div className="space-y-1 text-sm text-gray-600 mb-3">
                  <p><span className="font-medium">ยี่ห้อ:</span> {item.brand || '-'}</p>
                  <p><span className="font-medium">รุ่น:</span> {item.model || '-'}</p>
                  <p><span className="font-medium">Serial:</span> {item.serialNumber || item.equipmentNumber || '-'}</p>
                  <p><span className="font-medium">สถานที่:</span> {
                    typeof item.location === 'object' 
                      ? `${item.location.building || ''} ${item.location.room || ''}`.trim() || '-'
                      : item.location || '-'
                  }</p>
                  
                  {/* Purchase Price */}
                  {item.purchasePrice && (
                    <p><span className="font-medium">ราคาซื้อ:</span> {
                      typeof item.purchasePrice === 'number' 
                        ? item.purchasePrice.toLocaleString('th-TH') 
                        : item.purchasePrice
                    } บาท</p>
                  )}
                  
                  {/* Supplier/Vendor */}
                  {(item.supplier || item.vendor) && (
                    <p><span className="font-medium">ผู้จำหน่าย:</span> {item.supplier || item.vendor}</p>
                  )}
                </div>

                {/* View Detail Button */}
                <button
                  onClick={() => setSelectedEquipment(item)}
                  className="w-full px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                >
                  ดูรายละเอียด
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Equipment Detail Modal */}
      {selectedEquipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedEquipment(null)}>
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{selectedEquipment.name}</h2>
                <button
                  onClick={() => setSelectedEquipment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Images */}
                <div>
                  {selectedEquipment.images && selectedEquipment.images.length > 0 ? (
                    <div className="space-y-2">
                      <img
                        src={selectedEquipment.images[0].url || selectedEquipment.images[0].mediumUrl}
                        alt={selectedEquipment.name}
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      {selectedEquipment.images.length > 1 && (
                        <div className="grid grid-cols-4 gap-2">
                          {selectedEquipment.images.slice(1, 5).map((img, idx) => (
                            <img
                              key={idx}
                              src={img.thumbnailUrl || img.url}
                              alt={`${selectedEquipment.name} ${idx + 2}`}
                              className="w-full h-16 object-cover rounded"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : selectedEquipment.imageURL ? (
                    <img
                      src={selectedEquipment.imageURL}
                      alt={selectedEquipment.name}
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
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">ข้อมูลพื้นฐาน</h3>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">ยี่ห้อ:</dt>
                        <dd className="text-gray-900 font-medium">{selectedEquipment.brand || '-'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">รุ่น:</dt>
                        <dd className="text-gray-900 font-medium">{selectedEquipment.model || '-'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Serial/รหัส:</dt>
                        <dd className="text-gray-900 font-medium font-mono text-xs">{selectedEquipment.serialNumber || selectedEquipment.equipmentNumber || '-'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">สถานที่:</dt>
                        <dd className="text-gray-900 font-medium">{
                          typeof selectedEquipment.location === 'object' 
                            ? `${selectedEquipment.location.building || ''} ${selectedEquipment.location.room || ''}`.trim() || '-'
                            : selectedEquipment.location || '-'
                        }</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">สถานะ:</dt>
                        <dd>
                          <span className={`inline-block px-2 py-1 text-xs rounded ${
                            selectedEquipment.status === 'available' 
                              ? 'bg-green-100 text-green-800' 
                              : selectedEquipment.status === 'borrowed'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedEquipment.status === 'available' ? 'พร้อมใช้งาน' : 
                             selectedEquipment.status === 'borrowed' ? 'ถูกยืม' : 
                             selectedEquipment.status === 'maintenance' ? 'ซ่อมบำรุง' : selectedEquipment.status}
                          </span>
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* Purchase Information */}
                  {(selectedEquipment.purchaseDate || selectedEquipment.purchasePrice || selectedEquipment.supplier || selectedEquipment.vendor) && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">ข้อมูลการจัดซื้อ</h3>
                      <dl className="space-y-2 text-sm">
                        {selectedEquipment.purchaseDate && (
                          <div className="flex justify-between">
                            <dt className="text-gray-500">วันที่ซื้อ:</dt>
                            <dd className="text-gray-900 font-medium">
                              {selectedEquipment.purchaseDate.toDate 
                                ? selectedEquipment.purchaseDate.toDate().toLocaleDateString('th-TH')
                                : new Date(selectedEquipment.purchaseDate).toLocaleDateString('th-TH')}
                            </dd>
                          </div>
                        )}
                        {selectedEquipment.purchasePrice && (
                          <div className="flex justify-between">
                            <dt className="text-gray-500">ราคาซื้อ:</dt>
                            <dd className="text-gray-900 font-medium">
                              {typeof selectedEquipment.purchasePrice === 'number' 
                                ? selectedEquipment.purchasePrice.toLocaleString('th-TH') 
                                : selectedEquipment.purchasePrice} บาท
                            </dd>
                          </div>
                        )}
                        {(selectedEquipment.supplier || selectedEquipment.vendor) && (
                          <div className="flex justify-between">
                            <dt className="text-gray-500">ผู้จำหน่าย:</dt>
                            <dd className="text-gray-900 font-medium">{selectedEquipment.supplier || selectedEquipment.vendor}</dd>
                          </div>
                        )}
                        {selectedEquipment.warrantyExpiry && (
                          <div className="flex justify-between">
                            <dt className="text-gray-500">วันหมดประกัน:</dt>
                            <dd className="text-gray-900 font-medium">
                              {selectedEquipment.warrantyExpiry.toDate 
                                ? selectedEquipment.warrantyExpiry.toDate().toLocaleDateString('th-TH')
                                : new Date(selectedEquipment.warrantyExpiry).toLocaleDateString('th-TH')}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}

                  {/* Description */}
                  {selectedEquipment.description && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">รายละเอียด</h3>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedEquipment.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
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
