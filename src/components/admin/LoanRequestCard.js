import { useState } from 'react';
import { 
  LOAN_REQUEST_STATUS_LABELS, 
  LOAN_REQUEST_STATUS_COLORS,
  LOAN_REQUEST_STATUS 
} from '../../types/loanRequest';

const LoanRequestCard = ({ 
  request, 
  onApprove, 
  onReject,
  isSelectable = false,
  isSelected = false,
  onSelect
}) => {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectChange = (e) => {
    if (onSelect) {
      onSelect(e.target.checked);
    }
  };

  const getStatusColor = (status) => {
    const colorMap = {
      yellow: 'bg-yellow-100 text-yellow-800',
      green: 'bg-green-100 text-green-800',
      red: 'bg-red-100 text-red-800',
      blue: 'bg-blue-100 text-blue-800',
      gray: 'bg-gray-100 text-gray-800'
    };
    return colorMap[LOAN_REQUEST_STATUS_COLORS[status]] || colorMap.gray;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleApprove = async () => {
    if (window.confirm('คุณต้องการอนุมัติคำขอยืมนี้หรือไม่?')) {
      setIsProcessing(true);
      try {
        await onApprove(request.id);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('กรุณาระบุเหตุผลในการปฏิเสธ');
      return;
    }

    setIsProcessing(true);
    try {
      await onReject(request.id, rejectionReason.trim());
      setShowRejectModal(false);
      setRejectionReason('');
    } finally {
      setIsProcessing(false);
    }
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

  const isPending = request.status === LOAN_REQUEST_STATUS.PENDING;

  return (
    <>
      <div className={`bg-white rounded-lg shadow-sm border p-6 transition-all duration-200 ${
        isSelected 
          ? 'border-blue-500 shadow-md ring-2 ring-blue-200' 
          : 'border-gray-200'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {/* Selection Checkbox */}
            {isSelectable && (
              <div className="mt-1">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={handleSelectChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            )}
            
            <div className="flex-1">
              {/* Header */}
              <div className="flex items-center space-x-3 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {request.equipment?.name || 'อุปกรณ์ที่ไม่พบ'}
                </h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                {LOAN_REQUEST_STATUS_LABELS[request.status]}
              </span>
              {isPending && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  รอดำเนินการ
                </span>
              )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Equipment Info */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">ข้อมูลอุปกรณ์</h4>
                {request.equipment ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      {request.equipment.imageURL && (
                        <img
                          src={request.equipment.imageURL}
                          alt={request.equipment.name}
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{request.equipment.name}</p>
                        <p className="text-sm text-gray-600">{request.equipment.brand} {request.equipment.model}</p>
                        <p className="text-xs text-gray-500 font-mono">รหัส: {request.equipment.serialNumber}</p>
                        <p className="text-xs text-gray-500">สถานที่: {request.equipment.location}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 rounded-lg p-4">
                    <p className="text-sm text-red-600">ไม่พบข้อมูลอุปกรณ์</p>
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">ข้อมูลผู้ขอยืม</h4>
                {request.user ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      {request.user.photoURL && (
                        <img
                          src={request.user.photoURL}
                          alt={`${request.user.firstName} ${request.user.lastName}`}
                          className="w-12 h-12 rounded-full flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {request.user.firstName} {request.user.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{request.user.email}</p>
                        <p className="text-xs text-gray-500">
                          {request.user.department} ({request.user.userType})
                        </p>
                        {request.user.phoneNumber && (
                          <p className="text-xs text-gray-500">โทร: {request.user.phoneNumber}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 rounded-lg p-4">
                    <p className="text-sm text-red-600">ไม่พบข้อมูลผู้ใช้</p>
                  </div>
                )}
              </div>
            </div>

            {/* Request Details */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">วันที่ส่งคำขอ:</span>
                <p className="text-gray-600">{formatDateTime(request.createdAt)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">วันที่ต้องการยืม:</span>
                <p className="text-gray-600">{formatDate(request.borrowDate)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">วันที่คาดว่าจะคืน:</span>
                <p className="text-gray-600">{formatDate(request.expectedReturnDate)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">ระยะเวลายืม:</span>
                <p className="text-gray-600">{calculateLoanDuration()} วัน</p>
              </div>
            </div>

            {/* Purpose */}
            <div className="mt-4">
              <span className="font-medium text-gray-700">วัตถุประสงค์การใช้งาน:</span>
              <p className="text-gray-600 mt-1 bg-gray-50 rounded-lg p-3">{request.purpose}</p>
            </div>

            {/* Notes */}
            {request.notes && (
              <div className="mt-3">
                <span className="font-medium text-gray-700">หมายเหตุเพิ่มเติม:</span>
                <p className="text-gray-600 mt-1 bg-gray-50 rounded-lg p-3">{request.notes}</p>
              </div>
            )}

            {/* Approval/Rejection Info */}
            {request.approvedAt && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm">
                  <span className="font-medium text-blue-700">
                    {request.status === LOAN_REQUEST_STATUS.REJECTED ? 'ปฏิเสธเมื่อ:' : 'อนุมัติเมื่อ:'}
                  </span>
                  <p className="text-blue-600">{formatDateTime(request.approvedAt)}</p>
                  {request.rejectionReason && (
                    <>
                      <span className="font-medium text-red-700 block mt-2">เหตุผลที่ปฏิเสธ:</span>
                      <p className="text-red-600">{request.rejectionReason}</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          {isPending && (
            <div className="ml-6 flex-shrink-0 space-y-2">
              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    อนุมัติ
                  </>
                )}
              </button>
              
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={isProcessing}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                ปฏิเสธ
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">ปฏิเสธคำขอยืม</h3>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={isProcessing}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-2">
                  เหตุผลในการปฏิเสธ <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  placeholder="กรุณาระบุเหตุผลในการปฏิเสธคำขอยืมนี้..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  disabled={isProcessing}
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  {rejectionReason.length}/500 ตัวอักษร
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  disabled={isProcessing}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleReject}
                  disabled={isProcessing || !rejectionReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      กำลังดำเนินการ...
                    </div>
                  ) : (
                    'ปฏิเสธคำขอ'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LoanRequestCard;