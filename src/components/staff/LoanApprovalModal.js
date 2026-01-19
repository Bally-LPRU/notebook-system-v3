/**
 * LoanApprovalModal Component
 * Modal for confirming loan request approval
 * Requirements: 4.1
 */
import { useState } from 'react';

const LoanApprovalModal = ({ isOpen, request, onConfirm, onClose }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !request) return null;

  // Helper functions
  const formatDate = (date) => {
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const calculateLoanDuration = () => {
    if (request.borrowDate && request.expectedReturnDate) {
      const borrowDate = request.borrowDate.toDate ? request.borrowDate.toDate() : new Date(request.borrowDate);
      const returnDate = request.expectedReturnDate.toDate ? request.expectedReturnDate.toDate() : new Date(request.expectedReturnDate);
      const diffTime = returnDate.getTime() - borrowDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    }
    return 0;
  };

  const equipmentName = request.equipment?.name || request._equipmentName || request.equipmentSnapshot?.name || 'ไม่ทราบชื่ออุปกรณ์';
  const userName = request.user?.displayName || request._userName || request.userSnapshot?.displayName || 'ไม่ทราบชื่อ';

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl animate-fade-in">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">ยืนยันการอนุมัติ</h3>
                <p className="text-sm text-gray-500">คำขอยืมอุปกรณ์</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              disabled={isProcessing}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Request Summary */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {(request.equipment?.imageURL || request.equipmentSnapshot?.imageUrl) ? (
                  <img
                    src={request.equipment?.imageURL || request.equipmentSnapshot?.imageUrl}
                    alt={equipmentName}
                    className="w-14 h-14 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-14 h-14 bg-gray-200 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">{equipmentName}</p>
                  <p className="text-sm text-gray-600">ผู้ยืม: {userName}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500">วันที่ยืม</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(request.borrowDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">กำหนดคืน</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(request.expectedReturnDate)}</p>
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">ระยะเวลายืม</p>
                <p className="text-sm font-medium text-gray-900">{calculateLoanDuration()} วัน</p>
              </div>
              
              {request.purpose && (
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">วัตถุประสงค์</p>
                  <p className="text-sm text-gray-700 mt-1">{request.purpose}</p>
                </div>
              )}
            </div>
          </div>

          {/* Info Message */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-emerald-700">
                <p className="font-medium">เมื่ออนุมัติแล้ว:</p>
                <ul className="mt-1 list-disc list-inside text-emerald-600">
                  <li>ผู้ยืมจะได้รับการแจ้งเตือน</li>
                  <li>สถานะคำขอจะเปลี่ยนเป็น "อนุมัติแล้ว"</li>
                  <li>ผู้ยืมสามารถมารับอุปกรณ์ได้</li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  กำลังอนุมัติ...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  ยืนยันอนุมัติ
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanApprovalModal;
