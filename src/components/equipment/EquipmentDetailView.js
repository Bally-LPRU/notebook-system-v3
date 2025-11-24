import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { EQUIPMENT_STATUS } from '../../types/equipment';
import { getCategoryName } from '../../utils/equipmentHelpers';
import ImageGallery from './ImageGallery';
import LoadingSpinner from '../common/LoadingSpinner';
import QRCodeGenerator from './QRCodeGenerator';
import EquipmentStatusBadge from './EquipmentStatusBadge';

const EquipmentDetailView = ({
  equipmentId,
  equipment: initialEquipment,
  onEdit,
  onDelete,
  onClose,
  showEditHistory = true,
  showAuditLog = true,
  showQRCode = true,
  showPrintButton = true,
  className = ''
}) => {
  const { isAdmin, user } = useAuth();
  const [equipment, setEquipment] = useState(initialEquipment);
  const [loading, setLoading] = useState(!initialEquipment);
  const [error, setError] = useState(null);
  const [editHistory, setEditHistory] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [activeTab, setActiveTab] = useState('details');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const printRef = useRef();

  // Load equipment data if not provided
  useEffect(() => {
    if (!equipment && equipmentId) {
      loadEquipment();
    }
  }, [equipmentId, equipment, loadEquipment]);



  const loadEquipment = async () => {
    setLoading(true);
    try {
      // This would be replaced with actual service call
      // const equipmentData = await EquipmentService.getEquipment(equipmentId);
      // setEquipment(equipmentData);
      console.log('Loading equipment:', equipmentId);
    } catch (error) {
      console.error('Error loading equipment:', error);
      setError('ไม่สามารถโหลดข้อมูลอุปกรณ์ได้');
    } finally {
      setLoading(false);
    }
  };

  const loadEditHistory = async () => {
    if (!equipment || !showEditHistory) return;
    
    setHistoryLoading(true);
    try {
      // This would be replaced with actual service call
      // const history = await EquipmentService.getEditHistory(equipment.id);
      // setEditHistory(history);
      
      // Mock data for demonstration
      const mockHistory = [
        {
          id: '1',
          action: 'updated',
          field: 'status',
          oldValue: 'available',
          newValue: 'maintenance',
          timestamp: new Date(Date.now() - 86400000), // 1 day ago
          userId: 'user1',
          userName: 'Admin User',
          reason: 'ส่งซ่อมบำรุงประจำปี'
        },
        {
          id: '2',
          action: 'updated',
          field: 'location',
          oldValue: 'ห้อง 101',
          newValue: 'ห้อง 102',
          timestamp: new Date(Date.now() - 172800000), // 2 days ago
          userId: 'user2',
          userName: 'Staff User',
          reason: 'ย้ายตำแหน่งอุปกรณ์'
        },
        {
          id: '3',
          action: 'created',
          timestamp: new Date(Date.now() - 2592000000), // 30 days ago
          userId: 'user1',
          userName: 'Admin User',
          reason: 'เพิ่มอุปกรณ์ใหม่เข้าระบบ'
        }
      ];
      setEditHistory(mockHistory);
    } catch (error) {
      console.error('Error loading edit history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadAuditLog = async () => {
    if (!equipment || !showAuditLog) return;
    
    setAuditLoading(true);
    try {
      // This would be replaced with actual service call
      // const audit = await EquipmentService.getAuditLog(equipment.id);
      // setAuditLog(audit);
      
      // Mock data for demonstration
      const mockAudit = [
        {
          id: '1',
          action: 'view',
          timestamp: new Date(Date.now() - 3600000), // 1 hour ago
          userId: user?.uid || 'user3',
          userName: user?.displayName || 'Current User',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0...'
        },
        {
          id: '2',
          action: 'borrow_request',
          timestamp: new Date(Date.now() - 7200000), // 2 hours ago
          userId: 'user4',
          userName: 'Student User',
          ipAddress: '192.168.1.101',
          details: 'ส่งคำขอยืมอุปกรณ์'
        }
      ];
      setAuditLog(mockAudit);
    } catch (error) {
      console.error('Error loading audit log:', error);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleQRCodeGenerated = (qrCodeData) => {
    // Update equipment state with new QR code data
    setEquipment(prev => ({
      ...prev,
      qrCode: qrCodeData
    }));
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); // Reload to restore event listeners
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'history' && editHistory.length === 0) {
      loadEditHistory();
    }
    if (tab === 'audit' && auditLog.length === 0) {
      loadAuditLog();
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(equipment);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(equipment);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-lg text-gray-600">กำลังโหลดข้อมูลอุปกรณ์...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
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
          </div>
        </div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">ไม่พบข้อมูลอุปกรณ์</p>
      </div>
    );
  }

  const images = equipment.images || (equipment.imageURL ? [{ url: equipment.imageURL, id: 'main' }] : []);

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900">{equipment.name}</h2>
            <EquipmentStatusBadge status={equipment.status} size="lg" />
          </div>
          
          <div className="flex items-center space-x-2">
            {showPrintButton && (
              <button
                onClick={handlePrint}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                พิมพ์
              </button>
            )}
            
            {isAdmin && (
              <>
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  แก้ไข
                </button>
                
                <button
                  onClick={handleDelete}
                  disabled={equipment.status === EQUIPMENT_STATUS.BORROWED}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  ลบ
                </button>
              </>
            )}
            
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 px-6">
          <button
            onClick={() => handleTabChange('details')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            รายละเอียด
          </button>
          
          {showEditHistory && (
            <button
              onClick={() => handleTabChange('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ประวัติการแก้ไข
            </button>
          )}
          
          {showAuditLog && isAdmin && (
            <button
              onClick={() => handleTabChange('audit')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'audit'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              บันทึกการใช้งาน
            </button>
          )}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Details Tab */}
        {activeTab === 'details' && (
          <div ref={printRef} className="print:p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Images */}
              <div>
                {images.length > 0 ? (
                  <ImageGallery
                    images={images}
                    showThumbnails={true}
                    className="w-full"
                  />
                ) : (
                  <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-500">ไม่มีรูปภาพ</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Equipment Information */}
              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">ข้อมูลพื้นฐาน</h3>
                  <dl className="grid grid-cols-1 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">ชื่ออุปกรณ์</dt>
                      <dd className="mt-1 text-sm text-gray-900">{equipment.name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">ประเภท</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {getCategoryName(equipment.category)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">ยี่ห้อ</dt>
                      <dd className="mt-1 text-sm text-gray-900">{equipment.brand}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">รุ่น</dt>
                      <dd className="mt-1 text-sm text-gray-900">{equipment.model}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">หมายเลขซีเรียล</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-mono">{equipment.serialNumber}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">สถานะ</dt>
                      <dd className="mt-1">
                        <EquipmentStatusBadge status={equipment.status} size="md" />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">สถานที่</dt>
                      <dd className="mt-1 text-sm text-gray-900">{equipment.location}</dd>
                    </div>
                  </dl>
                </div>

                {/* Additional Information */}
                {(equipment.purchaseDate || equipment.purchasePrice || equipment.vendor || equipment.supplier) && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">ข้อมูลการจัดซื้อ</h3>
                    <dl className="grid grid-cols-1 gap-4">
                      {equipment.purchaseDate && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">วันที่ซื้อ</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {equipment.purchaseDate.toDate ? 
                              equipment.purchaseDate.toDate().toLocaleDateString('th-TH') :
                              new Date(equipment.purchaseDate).toLocaleDateString('th-TH')
                            }
                          </dd>
                        </div>
                      )}
                      {equipment.purchasePrice && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">ราคาซื้อ</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {typeof equipment.purchasePrice === 'number' 
                              ? equipment.purchasePrice.toLocaleString('th-TH') 
                              : equipment.purchasePrice} บาท
                          </dd>
                        </div>
                      )}
                      {(equipment.vendor || equipment.supplier) && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">ผู้จำหน่าย</dt>
                          <dd className="mt-1 text-sm text-gray-900">{equipment.vendor || equipment.supplier}</dd>
                        </div>
                      )}
                      {equipment.warrantyExpiry && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">วันหมดประกัน</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {equipment.warrantyExpiry.toDate ? 
                              equipment.warrantyExpiry.toDate().toLocaleDateString('th-TH') :
                              new Date(equipment.warrantyExpiry).toLocaleDateString('th-TH')
                            }
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}

                {/* Description */}
                {equipment.description && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">รายละเอียด</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{equipment.description}</p>
                  </div>
                )}

                {/* QR Code */}
                {showQRCode && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">QR Code</h3>
                    <QRCodeGenerator
                      equipment={equipment}
                      onGenerated={handleQRCodeGenerated}
                      size="large"
                      showControls={isAdmin}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit History Tab */}
        {activeTab === 'history' && showEditHistory && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">ประวัติการแก้ไข</h3>
            
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="md" />
                <span className="ml-2 text-gray-600">กำลังโหลดประวัติ...</span>
              </div>
            ) : editHistory.length > 0 ? (
              <div className="flow-root">
                <ul className="-mb-8">
                  {editHistory.map((entry, index) => (
                    <li key={entry.id}>
                      <div className="relative pb-8">
                        {index !== editHistory.length - 1 && (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                              entry.action === 'created' ? 'bg-green-500' :
                              entry.action === 'updated' ? 'bg-blue-500' :
                              entry.action === 'deleted' ? 'bg-red-500' :
                              'bg-gray-500'
                            }`}>
                              {entry.action === 'created' && (
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              )}
                              {entry.action === 'updated' && (
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              )}
                              {entry.action === 'deleted' && (
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500">
                                <span className="font-medium text-gray-900">{entry.userName}</span>
                                {' '}
                                {entry.action === 'created' && 'สร้างอุปกรณ์'}
                                {entry.action === 'updated' && entry.field && (
                                  <>
                                    แก้ไข{entry.field === 'status' ? 'สถานะ' : 
                                           entry.field === 'location' ? 'สถานที่' :
                                           entry.field === 'name' ? 'ชื่อ' : entry.field}
                                    {entry.oldValue && entry.newValue && (
                                      <span className="block mt-1">
                                        จาก <span className="font-medium">{entry.oldValue}</span>
                                        {' '}เป็น <span className="font-medium">{entry.newValue}</span>
                                      </span>
                                    )}
                                  </>
                                )}
                                {entry.action === 'deleted' && 'ลบอุปกรณ์'}
                              </p>
                              {entry.reason && (
                                <p className="mt-1 text-sm text-gray-600">
                                  เหตุผล: {entry.reason}
                                </p>
                              )}
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              <time dateTime={entry.timestamp.toISOString()}>
                                {entry.timestamp.toLocaleDateString('th-TH', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </time>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-2 text-sm text-gray-500">ไม่มีประวัติการแก้ไข</p>
              </div>
            )}
          </div>
        )}

        {/* Audit Log Tab */}
        {activeTab === 'audit' && showAuditLog && isAdmin && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">บันทึกการใช้งาน</h3>
            
            {auditLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="md" />
                <span className="ml-2 text-gray-600">กำลังโหลดบันทึก...</span>
              </div>
            ) : auditLog.length > 0 ? (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        การดำเนินการ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ผู้ใช้
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        เวลา
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IP Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        รายละเอียด
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {auditLog.map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {entry.action === 'view' && 'ดูรายละเอียด'}
                          {entry.action === 'borrow_request' && 'ขอยืม'}
                          {entry.action === 'edit' && 'แก้ไข'}
                          {entry.action === 'delete' && 'ลบ'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.userName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {entry.timestamp.toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                          {entry.ipAddress}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {entry.details || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="mt-2 text-sm text-gray-500">ไม่มีบันทึกการใช้งาน</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EquipmentDetailView;