/**
 * LoanRejectionModal Component
 * Modal for rejecting loan request with reason input
 * Requirements: 4.2, 4.3
 */
import { useState } from 'react';

const LoanRejectionModal = ({ isOpen, request, onConfirm, onClose }) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

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

  const equipmentName = request.equipment?.name || request._equipmentName || request.equipmentSnapshot?.name || 'ไม่ทราบชื่ออุปกรณ์';
  const userName = request.user?.displayName || request._userName || request.userSnapshot?.displayName || 'ไม่ทราบชื่อ';

  // Common rejection reasons
  const commonReasons = [
    'อุปกรณ์ไม่พร้อมใช้งานในช่วงเวลาที่ต้องการ',
    'ผู้ยืมมีรายการค้างคืนอยู่',
    'ข้อมูลการยืมไม่ครบถ้วน',
    'ระยะเวลายืมเกินกำหนด',
    'อุปกรณ์อยู่ระหว่างการซ่อมบำรุง'
  ];

  const handleSelectReason = (reason) => {
    setRejectionReason(reason);
    setError('');
  };

  const handleConfirm = async () => {
    if (!rejectionReason.trim()) {
      setError('กรุณาระบุเหตุผลในการปฏิเสธ');
      return;
    }

    if (rejectionReason.trim().length < 10) {
      setError('เหตุผลต้องมีความยาวอย่างน้อย 10 ตัวอักษร');
      return;
    }

    setIsProcessing(true);
    setError('');
    try {
      await onConfirm(rejectionReason.trim());
      setRejectionReason('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setRejectionReason('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl animate-fade-in">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">ปฏิเสธคำขอยืม</h3>
                <p className="text-sm text-gray-500">กรุณาระบุเหตุผล</p>
              </div>
            </div>
            <button
              onClick={handleClose}
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
            <div className="flex items-center gap-3">
              {(request.equipment?.imageURL || request.equipmentSnapshot?.imageUrl) ? (
                <img
                  src={request.equipment?.imageURL || request.equipmentSnapshot?.imageUrl}
                  alt={equipmentName}
                  className="w-12 h-12 object-cover rounded-lg"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{equipmentName}</p>
                <p className="text-sm text-gray-600">ผู้ยืม: {userName}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(request.borrowDate)} - {formatDate(request.expectedReturnDate)}
                </p>
              </div>
            </div>
          </div>

          {/* Common Reasons */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เลือกเหตุผลที่พบบ่อย
            </label>
            <div className="flex flex-wrap gap-2">
              {commonReasons.map((reason, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectReason(reason)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                    rejectionReason === reason
                      ? 'bg-rose-100 border-rose-300 text-rose-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                  disabled={isProcessing}
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>

          {/* Rejection Reason Input */}
          <div className="mb-6">
            <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-2">
              เหตุผลในการปฏิเสธ <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => { setRejectionReason(e.target.value); setError(''); }}
              rows={4}
              placeholder="กรุณาระบุเหตุผลในการปฏิเสธคำขอยืม..."
              className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm transition-all ${
                error ? 'border-rose-300 bg-rose-50' : 'border-gray-200'
              }`}
              disabled={isProcessing}
            />
            <div className="flex justify-between items-center mt-2">
              {error ? (
                <p className="text-xs text-rose-600">{error}</p>
              ) : (
                <p className="text-xs text-gray-500">ขั้นต่ำ 10 ตัวอักษร</p>
              )}
              <p className="text-xs text-gray-400">{rejectionReason.length}/500</p>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="text-sm text-amber-700">
                <p className="font-medium">โปรดทราบ:</p>
                <p className="mt-1 text-amber-600">
                  ผู้ยืมจะได้รับการแจ้งเตือนพร้อมเหตุผลที่ระบุ กรุณาตรวจสอบข้อความก่อนยืนยัน
                </p>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleConfirm}
              disabled={isProcessing || !rejectionReason.trim()}
              className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  กำลังปฏิเสธ...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  ยืนยันปฏิเสธ
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanRejectionModal;
