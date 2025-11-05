import React, { useState } from 'react';
import { 
  EquipmentListContainer,
  EquipmentGrid,
  EquipmentListView,
  EnhancedEquipmentCard,
  EquipmentDetailView,
  ViewModeToggle
} from './index';

/**
 * Example component demonstrating the new equipment display system
 * This shows how to use the enhanced components created in task 5
 */
const EquipmentDisplayExample = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Mock equipment data
  const mockEquipment = [
    {
      id: '1',
      name: 'MacBook Pro 16"',
      category: 'computer',
      brand: 'Apple',
      model: 'MacBook Pro',
      serialNumber: 'MBP2023001',
      status: 'available',
      location: 'ห้อง IT-101',
      description: 'MacBook Pro 16 นิ้ว สำหรับงานกราฟิกและการพัฒนา',
      images: [
        { id: '1', url: 'https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=MacBook+Pro', thumbnailUrl: 'https://via.placeholder.com/100x100/3B82F6/FFFFFF?text=MacBook' },
        { id: '2', url: 'https://via.placeholder.com/400x300/10B981/FFFFFF?text=MacBook+Side', thumbnailUrl: 'https://via.placeholder.com/100x100/10B981/FFFFFF?text=Side' }
      ],
      purchaseDate: new Date('2023-01-15'),
      purchasePrice: 89000,
      createdAt: new Date('2023-01-15')
    },
    {
      id: '2',
      name: 'Canon EOS R5',
      category: 'camera',
      brand: 'Canon',
      model: 'EOS R5',
      serialNumber: 'CAN2023002',
      status: 'borrowed',
      location: 'ห้องสื่อ-201',
      description: 'กล้อง Mirrorless ความละเอียดสูง สำหรับงานถ่ายภาพและวิดีโอ',
      imageURL: 'https://via.placeholder.com/400x300/EF4444/FFFFFF?text=Canon+EOS+R5',
      purchaseDate: new Date('2023-02-20'),
      purchasePrice: 125000,
      createdAt: new Date('2023-02-20')
    },
    {
      id: '3',
      name: 'iPad Pro 12.9"',
      category: 'tablet',
      brand: 'Apple',
      model: 'iPad Pro',
      serialNumber: 'IPD2023003',
      status: 'maintenance',
      location: 'ห้องซ่อม',
      description: 'iPad Pro สำหรับงานออกแบบและนำเสนอ',
      images: [
        { id: '1', url: 'https://via.placeholder.com/400x300/8B5CF6/FFFFFF?text=iPad+Pro', thumbnailUrl: 'https://via.placeholder.com/100x100/8B5CF6/FFFFFF?text=iPad' }
      ],
      purchaseDate: new Date('2023-03-10'),
      purchasePrice: 45000,
      createdAt: new Date('2023-03-10')
    }
  ];

  const mockFilters = {
    search: '',
    category: '',
    status: '',
    location: ''
  };

  const mockPagination = {
    hasNextPage: false,
    currentPage: 1,
    totalPages: 1
  };

  const handleViewDetail = (equipment) => {
    setSelectedEquipment(equipment);
    setShowDetailModal(true);
  };

  const handleEdit = (equipment) => {
    console.log('Edit equipment:', equipment);
    alert(`แก้ไขอุปกรณ์: ${equipment.name}`);
  };

  const handleDelete = (equipment) => {
    console.log('Delete equipment:', equipment);
    if (window.confirm(`คุณต้องการลบอุปกรณ์ "${equipment.name}" หรือไม่?`)) {
      alert('ลบอุปกรณ์เรียบร้อยแล้ว (Demo)');
    }
  };

  const handleBorrow = (equipment) => {
    console.log('Borrow equipment:', equipment);
    alert(`ส่งคำขอยืมอุปกรณ์: ${equipment.name}`);
  };

  const handleReserve = (equipment) => {
    console.log('Reserve equipment:', equipment);
    alert(`จองอุปกรณ์: ${equipment.name}`);
  };

  const handleFiltersChange = (newFilters) => {
    console.log('Filters changed:', newFilters);
  };

  const handleBulkAction = async (actionId, itemIds, actionData) => {
    console.log('Bulk action:', { actionId, itemIds, actionData });
    alert(`ดำเนินการ ${actionId} กับ ${itemIds.length} รายการ`);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          ตัวอย่างระบบแสดงผลอุปกรณ์
        </h1>
        <p className="text-gray-600 mb-8">
          แสดงการใช้งานคอมโพเนนต์ใหม่ที่พัฒนาในงาน Task 5
        </p>
      </div>

      {/* View Mode Toggle Example */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">1. View Mode Toggle</h2>
        <div className="flex items-center justify-between">
          <p className="text-gray-600">สลับระหว่างการแสดงแบบตารางและรายการ</p>
          <ViewModeToggle
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>
      </div>

      {/* Equipment List Container Example */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">2. Equipment List Container (แบบครบครัน)</h2>
        <EquipmentListContainer
          equipment={mockEquipment}
          loading={false}
          error={null}
          pagination={mockPagination}
          filters={mockFilters}
          onFiltersChange={handleFiltersChange}
          onResetFilters={() => console.log('Reset filters')}
          onLoadMore={() => console.log('Load more')}
          onRefresh={() => console.log('Refresh')}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleViewDetail}
          onBorrow={handleBorrow}
          onReserve={handleReserve}
          onBulkAction={handleBulkAction}
          initialViewMode={viewMode}
        />
      </div>

      {/* Individual Components Examples */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Equipment Grid Example */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">3. Equipment Grid</h2>
          <EquipmentGrid
            equipment={mockEquipment}
            loading={false}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleViewDetail}
            onBorrow={handleBorrow}
            onReserve={handleReserve}
            viewMode="grid"
          />
        </div>

        {/* Equipment List View Example */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">4. Equipment List View</h2>
          <EquipmentListView
            equipment={mockEquipment}
            loading={false}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleViewDetail}
            onBorrow={handleBorrow}
            onReserve={handleReserve}
          />
        </div>
      </div>

      {/* Enhanced Equipment Card Examples */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">5. Enhanced Equipment Cards</h2>
        <div className="space-y-6">
          {/* Grid Mode */}
          <div>
            <h3 className="text-lg font-medium mb-3">แบบ Grid (มี Hover Effects และ Image Carousel)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockEquipment.map((item) => (
                <EnhancedEquipmentCard
                  key={item.id}
                  equipment={item}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onViewDetail={handleViewDetail}
                  onBorrow={handleBorrow}
                  onReserve={handleReserve}
                  viewMode="grid"
                  showImageCarousel={true}
                  showQuickActions={true}
                  showStatusBadge={true}
                  showHoverEffects={true}
                />
              ))}
            </div>
          </div>

          {/* List Mode */}
          <div>
            <h3 className="text-lg font-medium mb-3">แบบ List (Compact)</h3>
            <div className="space-y-4">
              {mockEquipment.map((item) => (
                <EnhancedEquipmentCard
                  key={`list-${item.id}`}
                  equipment={item}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onViewDetail={handleViewDetail}
                  onBorrow={handleBorrow}
                  onReserve={handleReserve}
                  viewMode="list"
                  showImageCarousel={false}
                  showQuickActions={true}
                  showStatusBadge={true}
                  showHoverEffects={false}
                />
              ))}
            </div>
          </div>

          {/* Compact Mode */}
          <div>
            <h3 className="text-lg font-medium mb-3">แบบ Compact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {mockEquipment.map((item) => (
                <EnhancedEquipmentCard
                  key={`compact-${item.id}`}
                  equipment={item}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onViewDetail={handleViewDetail}
                  onBorrow={handleBorrow}
                  onReserve={handleReserve}
                  viewMode="compact"
                  showImageCarousel={false}
                  showQuickActions={true}
                  showStatusBadge={true}
                  showHoverEffects={true}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Equipment Detail Modal */}
      {showDetailModal && selectedEquipment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto max-w-6xl">
            <EquipmentDetailView
              equipment={selectedEquipment}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onClose={() => {
                setShowDetailModal(false);
                setSelectedEquipment(null);
              }}
              showEditHistory={true}
              showAuditLog={true}
              showQRCode={true}
              showPrintButton={true}
            />
          </div>
        </div>
      )}

      {/* Features Summary */}
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">✨ คุณสมบัติที่พัฒนาใน Task 5</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-blue-800 mb-2">5.1 Equipment List Components</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• EquipmentGrid - แสดงแบบตาราง responsive</li>
              <li>• EquipmentListView - แสดงแบบรายการ table</li>
              <li>• ViewModeToggle - สลับโหมดการแสดงผล</li>
              <li>• EquipmentListContainer - รวมทุกอย่างเข้าด้วยกัน</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-blue-800 mb-2">5.2 Enhanced Equipment Card</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Image carousel สำหรับรูปหลายรูป</li>
              <li>• Status badges และ visual indicators</li>
              <li>• Quick action buttons</li>
              <li>• Hover effects และ animations</li>
              <li>• รองรับ view modes ต่างๆ</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-blue-800 mb-2">5.3 Equipment Detail View</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Image gallery พร้อม lightbox</li>
              <li>• Edit history และ audit log</li>
              <li>• QR code generation</li>
              <li>• Print functionality</li>
              <li>• Tab-based interface</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-blue-800 mb-2">Responsive Design</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• รองรับทุกขนาดหน้าจอ</li>
              <li>• Mobile-first approach</li>
              <li>• Touch-friendly interface</li>
              <li>• Adaptive layouts</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipmentDisplayExample;