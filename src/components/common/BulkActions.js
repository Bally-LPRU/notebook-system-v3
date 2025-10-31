import { useState } from 'react';
import { EQUIPMENT_STATUS } from '../../types/equipment';
import { LOAN_REQUEST_STATUS } from '../../types/loanRequest';
import { RESERVATION_STATUS } from '../../types/reservation';

const BulkActions = ({
  selectedItems = [],
  onSelectAll,
  onDeselectAll,
  totalItems = 0,
  itemType = 'equipment', // equipment, loans, reservations, users
  onBulkAction,
  availableActions = [],
  loading = false
}) => {
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionData, setActionData] = useState({});

  const selectedCount = selectedItems.length;
  const isAllSelected = selectedCount === totalItems && totalItems > 0;
  const isPartiallySelected = selectedCount > 0 && selectedCount < totalItems;

  const getDefaultActions = () => {
    switch (itemType) {
      case 'equipment':
        return [
          { id: 'updateStatus', label: 'เปลี่ยนสถานะ', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
          { id: 'updateLocation', label: 'เปลี่ยนสถานที่', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
          { id: 'export', label: 'ส่งออกข้อมูล', icon: 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
          { id: 'delete', label: 'ลบ', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16', danger: true }
        ];
      case 'loans':
        return [
          { id: 'approve', label: 'อนุมัติ', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
          { id: 'reject', label: 'ปฏิเสธ', icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z', danger: true },
          { id: 'markReturned', label: 'บันทึกการคืน', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
          { id: 'sendReminder', label: 'ส่งการแจ้งเตือน', icon: 'M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h8v-2H4v2zM4 11h8V9H4v2z' },
          { id: 'export', label: 'ส่งออกข้อมูล', icon: 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }
        ];
      case 'reservations':
        return [
          { id: 'approve', label: 'อนุมัติ', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
          { id: 'cancel', label: 'ยกเลิก', icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z', danger: true },
          { id: 'markCompleted', label: 'ทำเครื่องหมายเสร็จสิ้น', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
          { id: 'sendReminder', label: 'ส่งการแจ้งเตือน', icon: 'M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h8v-2H4v2zM4 11h8V9H4v2z' },
          { id: 'export', label: 'ส่งออกข้อมูล', icon: 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }
        ];
      case 'users':
        return [
          { id: 'approve', label: 'อนุมัติ', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
          { id: 'suspend', label: 'ระงับ', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728', danger: true },
          { id: 'activate', label: 'เปิดใช้งาน', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
          { id: 'export', label: 'ส่งออกข้อมูล', icon: 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }
        ];
      default:
        return [];
    }
  };

  const actions = availableActions.length > 0 ? availableActions : getDefaultActions();

  const handleSelectAll = () => {
    if (isAllSelected) {
      onDeselectAll();
    } else {
      onSelectAll();
    }
  };

  const handleActionClick = (action) => {
    setShowActionMenu(false);
    
    if (action.requiresConfirmation !== false) {
      setConfirmAction(action);
    } else {
      executeAction(action);
    }
  };

  const executeAction = async (action, data = {}) => {
    try {
      await onBulkAction(action.id, selectedItems, { ...actionData, ...data });
      setConfirmAction(null);
      setActionData({});
    } catch (error) {
      console.error('Bulk action error:', error);
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  const renderActionForm = () => {
    if (!confirmAction) return null;

    switch (confirmAction.id) {
      case 'updateStatus':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เปลี่ยนเป็นสถานะ
              </label>
              <select
                value={actionData.status || ''}
                onChange={(e) => setActionData({ ...actionData, status: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">เลือกสถานะ</option>
                {itemType === 'equipment' && Object.entries(EQUIPMENT_STATUS).map(([key, value]) => (
                  <option key={key} value={value}>{value}</option>
                ))}
                {itemType === 'loans' && Object.entries(LOAN_REQUEST_STATUS).map(([key, value]) => (
                  <option key={key} value={value}>{value}</option>
                ))}
                {itemType === 'reservations' && Object.entries(RESERVATION_STATUS).map(([key, value]) => (
                  <option key={key} value={value}>{value}</option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'updateLocation':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                สถานที่ใหม่
              </label>
              <input
                type="text"
                placeholder="ระบุสถานที่..."
                value={actionData.location || ''}
                onChange={(e) => setActionData({ ...actionData, location: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        );

      case 'reject':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เหตุผลในการปฏิเสธ
              </label>
              <textarea
                placeholder="ระบุเหตุผล..."
                value={actionData.reason || ''}
                onChange={(e) => setActionData({ ...actionData, reason: e.target.value })}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        );

      case 'sendReminder':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ข้อความแจ้งเตือน
              </label>
              <textarea
                placeholder="ข้อความที่ต้องการส่ง..."
                value={actionData.message || ''}
                onChange={(e) => setActionData({ ...actionData, message: e.target.value })}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Select All Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={(input) => {
                  if (input) input.indeterminate = isPartiallySelected;
                }}
                onChange={handleSelectAll}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                เลือกทั้งหมด
              </label>
            </div>

            {/* Selected Count */}
            <div className="text-sm text-blue-800">
              เลือกแล้ว {selectedCount} รายการ
              {totalItems > 0 && ` จาก ${totalItems} รายการ`}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Deselect All */}
            <button
              onClick={onDeselectAll}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              ยกเลิกการเลือก
            </button>

            {/* Actions Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowActionMenu(!showActionMenu)}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังดำเนินการ...
                  </>
                ) : (
                  <>
                    การดำเนินการ
                    <svg className="ml-2 -mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </button>

              {showActionMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1">
                    {actions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleActionClick(action)}
                        className={`group flex items-center px-4 py-2 text-sm w-full text-left hover:bg-gray-100 ${
                          action.danger ? 'text-red-700 hover:bg-red-50' : 'text-gray-700'
                        }`}
                      >
                        <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                        </svg>
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center mb-4">
                <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${
                  confirmAction.danger ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  <svg className={`h-6 w-6 ${confirmAction.danger ? 'text-red-600' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={confirmAction.icon} />
                  </svg>
                </div>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
                {confirmAction.label}
              </h3>
              
              <p className="text-sm text-gray-500 text-center mb-4">
                คุณต้องการ{confirmAction.label.toLowerCase()}รายการที่เลือกไว้ {selectedCount} รายการหรือไม่?
              </p>

              {renderActionForm()}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setConfirmAction(null);
                    setActionData({});
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => executeAction(confirmAction, actionData)}
                  disabled={loading}
                  className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                    confirmAction.danger
                      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                      : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                  }`}
                >
                  {loading ? 'กำลังดำเนินการ...' : 'ยืนยัน'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {showActionMenu && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowActionMenu(false)}
        />
      )}
    </>
  );
};

export default BulkActions;