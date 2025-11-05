import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const BulkActionBar = ({
  selectedItems = [],
  totalItems = 0,
  onBulkEdit,
  onBulkDelete,
  onBulkExport,
  onBulkStatusUpdate,
  onBulkLocationUpdate,
  onGenerateQRCodes,
  onPrintLabels,
  onClearSelection,
  className = ''
}) => {
  const { isAdmin } = useAuth();
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

  const selectedCount = selectedItems.length;

  if (selectedCount === 0) {
    return null;
  }

  const handleAction = (actionFn) => {
    if (actionFn) {
      actionFn(selectedItems);
    }
    setIsActionMenuOpen(false);
  };

  const bulkActions = [
    {
      id: 'edit',
      label: 'แก้ไขหลายรายการ',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      action: () => handleAction(onBulkEdit),
      adminOnly: true,
      color: 'text-blue-600 hover:bg-blue-50'
    },
    {
      id: 'status',
      label: 'อัปเดตสถานะ',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      action: () => handleAction(onBulkStatusUpdate),
      adminOnly: true,
      color: 'text-green-600 hover:bg-green-50'
    },
    {
      id: 'location',
      label: 'เปลี่ยนสถานที่',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      action: () => handleAction(onBulkLocationUpdate),
      adminOnly: true,
      color: 'text-purple-600 hover:bg-purple-50'
    },
    {
      id: 'export',
      label: 'ส่งออกข้อมูล',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      action: () => handleAction(onBulkExport),
      adminOnly: false,
      color: 'text-indigo-600 hover:bg-indigo-50'
    },
    {
      id: 'qr',
      label: 'สร้าง QR Code',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
      ),
      action: () => handleAction(onGenerateQRCodes),
      adminOnly: false,
      color: 'text-gray-600 hover:bg-gray-50'
    },
    {
      id: 'print',
      label: 'พิมพ์ป้ายชื่อ',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
      ),
      action: () => handleAction(onPrintLabels),
      adminOnly: false,
      color: 'text-gray-600 hover:bg-gray-50'
    },
    {
      id: 'delete',
      label: 'ลบหลายรายการ',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      action: () => handleAction(onBulkDelete),
      adminOnly: true,
      color: 'text-red-600 hover:bg-red-50'
    }
  ];

  // Filter actions based on user role and available handlers
  const availableActions = bulkActions.filter(action => {
    if (action.adminOnly && !isAdmin) return false;
    
    // Check if handler is available
    switch (action.id) {
      case 'edit': return !!onBulkEdit;
      case 'status': return !!onBulkStatusUpdate;
      case 'location': return !!onBulkLocationUpdate;
      case 'export': return !!onBulkExport;
      case 'qr': return !!onGenerateQRCodes;
      case 'print': return !!onPrintLabels;
      case 'delete': return !!onBulkDelete;
      default: return true;
    }
  });

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Selection Info */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-blue-900">
              เลือกแล้ว {selectedCount} จาก {totalItems} รายการ
            </span>
          </div>
          
          {/* Clear Selection */}
          <button
            onClick={onClearSelection}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            ยกเลิกการเลือก
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Quick Actions (first 3 actions) */}
          {availableActions.slice(0, 3).map((action) => (
            <button
              key={action.id}
              onClick={action.action}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md border border-transparent transition-colors ${action.color} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
              title={action.label}
            >
              {action.icon}
              <span className="ml-2 hidden sm:inline">{action.label}</span>
            </button>
          ))}

          {/* More Actions Dropdown */}
          {availableActions.length > 3 && (
            <div className="relative">
              <button
                onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
                <span className="ml-2 hidden sm:inline">เพิ่มเติม</span>
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isActionMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                  <div className="py-1">
                    {availableActions.slice(3).map((action) => (
                      <button
                        key={action.id}
                        onClick={action.action}
                        className={`group flex items-center w-full px-4 py-2 text-sm transition-colors ${action.color}`}
                      >
                        {action.icon}
                        <span className="ml-3">{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar (if needed) */}
      {/* This can be shown during bulk operations */}
      {/* <div className="mt-3">
        <div className="bg-blue-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: '45%' }}></div>
        </div>
        <p className="text-xs text-blue-700 mt-1">กำลังประมวลผล... 45%</p>
      </div> */}
    </div>
  );
};

export default BulkActionBar;