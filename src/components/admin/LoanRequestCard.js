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
  onMarkAsPickedUp,
  onMarkAsReturned,
  isSelectable = false,
  isSelected = false,
  onSelect,
  compact = false
}) => {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [returnCondition, setReturnCondition] = useState('good');
  const [returnNotes, setReturnNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleSelectChange = (e) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(e.target.checked);
    }
  };

  const formatText = (value) => {
    if (!value) return '-';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      return value.value || value.label || value.name || value.id || JSON.stringify(value);
    }
    return String(value);
  };

  const formatLocation = (loc) => {
    if (!loc) return '-';
    if (typeof loc === 'string') return loc;
    if (typeof loc === 'object') {
      const parts = [loc.building, loc.floor, loc.room].filter(Boolean);
      if (parts.length > 0) return parts.join(' / ');
      return loc.description || loc.note || '-';
    }
    return String(loc);
  };

  const getStatusColor = (status) => {
    const colorMap = {
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colorMap[LOAN_REQUEST_STATUS_COLORS[status]] || colorMap.gray;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: '2-digit'
    });
  };

  const formatDateTime = (date) => {
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleApprove = async (e) => {
    e.stopPropagation();
    if (window.confirm('คุณต้องการอนุมัติคำขอยืมนี้หรือไม่?')) {
      setIsProcessing(true);
      try {
        await onApprove(request.id);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleMarkAsPickedUp = async (e) => {
    e.stopPropagation();
    if (window.confirm('ยืนยันว่าผู้ใช้ได้รับอุปกรณ์แล้ว?')) {
      setIsProcessing(true);
      try {
        await onMarkAsPickedUp(request.id);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleMarkAsReturned = async (e) => {
    e.stopPropagation();
    setShowReturnModal(true);
  };

  const handleConfirmReturn = async () => {
    setIsProcessing(true);
    try {
      await onMarkAsReturned(request.id, {
        condition: returnCondition,
        notes: returnNotes.trim()
      });
      setShowReturnModal(false);
      setReturnCondition('good');
      setReturnNotes('');
    } finally {
      setIsProcessing(false);
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
  const isApproved = request.status === LOAN_REQUEST_STATUS.APPROVED;
  const isBorrowed = request.status === LOAN_REQUEST_STATUS.BORROWED;
  const isOverdue = request.status === LOAN_REQUEST_STATUS.OVERDUE;
  const equipmentName = request.equipment?.name || request._equipmentName || 'ไม่ทราบชื่ออุปกรณ์';
  const userName = request.user?.displayName || request.user?.firstName 
    ? `${request.user?.firstName || ''} ${request.user?.lastName || ''}`.trim() 
    : request._userName || 'ไม่ทราบชื่อ';

  return (
    <>
      <div 
        className={`bg-white rounded-lg shadow-sm border transition-all duration-200 ${
          isSelected 
            ? 'border-blue-500 ring-2 ring-blue-200' 
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        {/* Compact Header - Always Visible */}
        <div 
          className="p-3 sm:p-4 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-start gap-2 sm:gap-3">
            {/* Checkbox */}
            {isSelectable && (
              <div className="pt-1 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={handleSelectChange}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            )}

            {/* Equipment Image - Mobile: smaller */}
            {request.equipment?.imageURL && (
              <img
                src={request.equipment.imageURL}
                alt={equipmentName}
                className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-lg flex-shrink-0"
              />
            )}
            {!request.equipment?.imageURL && (
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            )}

            {/* Main Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate max-w-[150px] sm:max-w-none">
                  {equipmentName}
                </h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                  {LOAN_REQUEST_STATUS_LABELS[request.status]}
                </span>
              </div>
              
              {/* Quick Info Row */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="truncate max-w-[100px] sm:max-w-[150px]">{userName}</span>
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(request.borrowDate)} - {formatDate(request.expectedReturnDate)}
                </span>
                <span className="hidden sm:flex items-center gap-1 text-gray-500">
                  ({calculateLoanDuration()} วัน)
                </span>
              </div>
            </div>

            {/* Actions - Desktop */}
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
              {isPending && (
                <>
                  <button
                    onClick={handleApprove}
                    disabled={isProcessing}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isProcessing ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        อนุมัติ
                      </>
                    )}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowRejectModal(true); }}
                    disabled={isProcessing}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    ปฏิเสธ
                  </button>
                </>
              )}
              {isApproved && onMarkAsPickedUp && (
                <button
                  onClick={handleMarkAsPickedUp}
                  disabled={isProcessing}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                      บันทึกรับอุปกรณ์
                    </>
                  )}
                </button>
              )}
              {(isBorrowed || isOverdue) && onMarkAsReturned && (
                <button
                  onClick={handleMarkAsReturned}
                  disabled={isProcessing}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      บันทึกคืนอุปกรณ์
                    </>
                  )}
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Expand Icon - Mobile */}
            <div className="sm:hidden flex-shrink-0">
              <svg className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Mobile Actions */}
          {isPending && (
            <div className="sm:hidden flex gap-2 mt-3 pt-3 border-t border-gray-100">
              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                onClick={(e) => { e.stopPropagation(); setShowRejectModal(true); }}
                disabled={isProcessing}
                className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                ปฏิเสธ
              </button>
            </div>
          )}
          {isApproved && onMarkAsPickedUp && (
            <div className="sm:hidden flex gap-2 mt-3 pt-3 border-t border-gray-100">
              <button
                onClick={handleMarkAsPickedUp}
                disabled={isProcessing}
                className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    บันทึกรับอุปกรณ์
                  </>
                )}
              </button>
            </div>
          )}
          {(isBorrowed || isOverdue) && onMarkAsReturned && (
            <div className="sm:hidden flex gap-2 mt-3 pt-3 border-t border-gray-100">
              <button
                onClick={handleMarkAsReturned}
                disabled={isProcessing}
                className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    บันทึกคืนอุปกรณ์
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t border-gray-100">
            <div className="pt-3 sm:pt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Equipment Info */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ข้อมูลอุปกรณ์</h4>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    {request.equipment?.imageURL && (
                      <img
                        src={request.equipment.imageURL}
                        alt={equipmentName}
                        className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0 text-sm">
                      <p className="font-medium text-gray-900">{equipmentName}</p>
                      {(request.equipment?.brand || request.equipment?.model) && (
                        <p className="text-gray-600">{request.equipment?.brand} {request.equipment?.model}</p>
                      )}
                      <p className="text-xs text-gray-500 font-mono">
                        รหัส: {formatText(request.equipment?.serialNumber || request.equipment?.equipmentNumber || request.equipmentNumber)}
                      </p>
                      {request.equipment?.location && (
                        <p className="text-xs text-gray-500">สถานที่: {formatLocation(request.equipment.location)}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* User Info */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ข้อมูลผู้ขอยืม</h4>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    {request.user?.photoURL && (
                      <img
                        src={request.user.photoURL}
                        alt={userName}
                        className="w-10 h-10 rounded-full flex-shrink-0"
                      />
                    )}
                    {!request.user?.photoURL && (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0 text-sm">
                      <p className="font-medium text-gray-900">{userName}</p>
                      <p className="text-gray-600 truncate">{formatText(request.user?.email)}</p>
                      <p className="text-xs text-gray-500">
                        {formatText(request.user?.department)} {request.user?.userType && `(${formatText(request.user.userType)})`}
                      </p>
                      {request.user?.phoneNumber && (
                        <p className="text-xs text-gray-500">โทร: {formatText(request.user.phoneNumber)}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Request Details */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-2.5">
                <span className="block text-xs text-gray-500">วันที่ส่งคำขอ</span>
                <span className="font-medium text-gray-900">{formatDateTime(request.createdAt)}</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-2.5">
                <span className="block text-xs text-gray-500">วันที่ยืม</span>
                <span className="font-medium text-gray-900">{formatDate(request.borrowDate)}</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-2.5">
                <span className="block text-xs text-gray-500">กำหนดคืน</span>
                <span className="font-medium text-gray-900">{formatDateTime(request.expectedReturnDate)}</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-2.5">
                <span className="block text-xs text-gray-500">ระยะเวลา</span>
                <span className="font-medium text-gray-900">{calculateLoanDuration()} วัน</span>
              </div>
            </div>

            {/* Picked Up Info - Show when borrowed */}
            {request.pickedUpAt && (isBorrowed || isOverdue || request.status === LOAN_REQUEST_STATUS.RETURNED) && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  <span className="font-medium text-blue-700">รับอุปกรณ์เมื่อ:</span>
                  <span className="text-blue-600">{formatDateTime(request.pickedUpAt)}</span>
                </div>
              </div>
            )}

            {/* Actual Return Date - Show when returned */}
            {request.actualReturnDate && (
              <div className="mt-3 p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium text-green-700">คืนอุปกรณ์เมื่อ:</span>
                  <span className="text-green-600">{formatDateTime(request.actualReturnDate)}</span>
                </div>
                {request.returnCondition && (
                  <div className="mt-2 text-sm text-green-700">
                    <span className="font-medium">สภาพอุปกรณ์:</span>{' '}
                    {request.returnCondition === 'good' ? 'ปกติ' : 
                     request.returnCondition === 'damaged' ? 'ชำรุด' : 
                     request.returnCondition === 'needs_repair' ? 'ต้องซ่อม' : request.returnCondition}
                  </div>
                )}
                {request.returnNotes && (
                  <div className="mt-1 text-sm text-green-600">
                    <span className="font-medium">หมายเหตุการคืน:</span> {request.returnNotes}
                  </div>
                )}
              </div>
            )}

            {/* Purpose */}
            <div className="mt-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">วัตถุประสงค์</span>
              <p className="mt-1 text-sm text-gray-700 bg-gray-50 rounded-lg p-2.5">{request.purpose || '-'}</p>
            </div>

            {/* Notes */}
            {request.notes && (
              <div className="mt-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">หมายเหตุ</span>
                <p className="mt-1 text-sm text-gray-700 bg-gray-50 rounded-lg p-2.5">{request.notes}</p>
              </div>
            )}

            {/* Approval/Rejection Info */}
            {request.approvedAt && (
              <div className={`mt-3 p-3 rounded-lg ${request.status === LOAN_REQUEST_STATUS.REJECTED ? 'bg-red-50' : 'bg-blue-50'}`}>
                <div className="text-sm">
                  <span className={`font-medium ${request.status === LOAN_REQUEST_STATUS.REJECTED ? 'text-red-700' : 'text-blue-700'}`}>
                    {request.status === LOAN_REQUEST_STATUS.REJECTED ? 'ปฏิเสธเมื่อ:' : 'อนุมัติเมื่อ:'}
                  </span>
                  <span className={`ml-2 ${request.status === LOAN_REQUEST_STATUS.REJECTED ? 'text-red-600' : 'text-blue-600'}`}>
                    {formatDateTime(request.approvedAt)}
                  </span>
                  {request.rejectionReason && (
                    <div className="mt-2">
                      <span className="font-medium text-red-700">เหตุผล:</span>
                      <p className="text-red-600 mt-1">{request.rejectionReason}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">ปฏิเสธคำขอยืม</h3>
                <button
                  onClick={() => { setShowRejectModal(false); setRejectionReason(''); }}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  disabled={isProcessing}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  rows={3}
                  placeholder="กรุณาระบุเหตุผล..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                  disabled={isProcessing}
                  required
                />
                <p className="mt-1 text-xs text-gray-500">{rejectionReason.length}/500</p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowRejectModal(false); setRejectionReason(''); }}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleReject}
                  disabled={isProcessing || !rejectionReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      กำลังดำเนินการ...
                    </span>
                  ) : (
                    'ปฏิเสธคำขอ'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Return Equipment Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">บันทึกการคืนอุปกรณ์</h3>
                <button
                  onClick={() => { setShowReturnModal(false); setReturnCondition('good'); setReturnNotes(''); }}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  disabled={isProcessing}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Equipment Info */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{equipmentName}</p>
                <p className="text-xs text-gray-500">ผู้ยืม: {userName}</p>
                <p className="text-xs text-gray-500">กำหนดคืน: {formatDate(request.expectedReturnDate)}</p>
              </div>
              
              {/* Condition Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  สภาพอุปกรณ์ <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="returnCondition"
                      value="good"
                      checked={returnCondition === 'good'}
                      onChange={(e) => setReturnCondition(e.target.value)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500"
                    />
                    <span className="ml-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">ปกติ</span>
                      <span className="text-xs text-gray-500">- อุปกรณ์อยู่ในสภาพดี พร้อมใช้งาน</span>
                    </span>
                  </label>
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="returnCondition"
                      value="needs_repair"
                      checked={returnCondition === 'needs_repair'}
                      onChange={(e) => setReturnCondition(e.target.value)}
                      className="h-4 w-4 text-yellow-600 focus:ring-yellow-500"
                    />
                    <span className="ml-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">ต้องซ่อม</span>
                      <span className="text-xs text-gray-500">- ต้องส่งซ่อมก่อนใช้งานต่อ</span>
                    </span>
                  </label>
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="returnCondition"
                      value="damaged"
                      checked={returnCondition === 'damaged'}
                      onChange={(e) => setReturnCondition(e.target.value)}
                      className="h-4 w-4 text-red-600 focus:ring-red-500"
                    />
                    <span className="ml-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">ชำรุด</span>
                      <span className="text-xs text-gray-500">- อุปกรณ์เสียหาย ใช้งานไม่ได้</span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label htmlFor="returnNotes" className="block text-sm font-medium text-gray-700 mb-2">
                  หมายเหตุการคืน
                </label>
                <textarea
                  id="returnNotes"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  rows={2}
                  placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  disabled={isProcessing}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowReturnModal(false); setReturnCondition('good'); setReturnNotes(''); }}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleConfirmReturn}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      กำลังบันทึก...
                    </span>
                  ) : (
                    'บันทึกการคืน'
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
