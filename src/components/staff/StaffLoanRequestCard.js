/**
 * StaffLoanRequestCard Component
 * Card component for displaying loan request details with action buttons
 * Requirements: 3.3
 */
import { useState } from 'react';
import { 
  LOAN_REQUEST_STATUS_LABELS, 
  LOAN_REQUEST_STATUS_COLORS,
  LOAN_REQUEST_STATUS 
} from '../../types/loanRequest';

const StaffLoanRequestCard = ({ 
  request, 
  onApprove, 
  onReject,
  onMarkAsPickedUp,
  onMarkAsReturned
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnCondition, setReturnCondition] = useState('good');
  const [returnNotes, setReturnNotes] = useState('');

  // Helper functions
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
      yellow: 'bg-amber-100 text-amber-800 border-amber-200',
      green: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      red: 'bg-rose-100 text-rose-800 border-rose-200',
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

  // Action handlers
  const handleApprove = async (e) => {
    e.stopPropagation();
    if (onApprove) {
      onApprove(request);
    }
  };

  const handleReject = async (e) => {
    e.stopPropagation();
    if (onReject) {
      onReject(request);
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

  // Status checks
  const isPending = request.status === LOAN_REQUEST_STATUS.PENDING;
  const isApproved = request.status === LOAN_REQUEST_STATUS.APPROVED;
  const isBorrowed = request.status === LOAN_REQUEST_STATUS.BORROWED;
  const isOverdue = request.status === LOAN_REQUEST_STATUS.OVERDUE;
  
  // Get display names
  const equipmentName = request.equipment?.name || request._equipmentName || request.equipmentSnapshot?.name || 'ไม่ทราบชื่ออุปกรณ์';
  const userName = request.user?.displayName || request.user?.firstName 
    ? `${request.user?.firstName || ''} ${request.user?.lastName || ''}`.trim() 
    : request._userName || request.userSnapshot?.displayName || 'ไม่ทราบชื่อ';

  return (
    <>
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
        {/* Card Header - Always Visible */}
        <div className="p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-start gap-3">
            {/* Equipment Image */}
            {(request.equipment?.imageURL || request.equipmentSnapshot?.imageUrl) ? (
              <img
                src={request.equipment?.imageURL || request.equipmentSnapshot?.imageUrl}
                alt={equipmentName}
                className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-xl flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            )}

            {/* Main Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate max-w-[180px] sm:max-w-none">
                  {equipmentName}
                </h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                  {LOAN_REQUEST_STATUS_LABELS[request.status]}
                </span>
              </div>
              
              {/* Quick Info Row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-600">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="truncate max-w-[120px] sm:max-w-[180px]">{userName}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(request.borrowDate)} - {formatDate(request.expectedReturnDate)}
                </span>
                <span className="hidden sm:flex items-center gap-1 text-gray-500">
                  ({calculateLoanDuration()} วัน)
                </span>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
              {isPending && (
                <>
                  <button
                    onClick={handleApprove}
                    disabled={isProcessing}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    อนุมัติ
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isProcessing}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  {isProcessing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  {isProcessing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      บันทึกคืนอุปกรณ์
                    </>
                  )}
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className={`w-5 h-5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Mobile Expand Icon */}
            <div className="sm:hidden flex-shrink-0">
              <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Mobile Actions */}
          {isPending && (
            <div className="sm:hidden flex gap-2 mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                อนุมัติ
              </button>
              <button
                onClick={handleReject}
                disabled={isProcessing}
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                ปฏิเสธ
              </button>
            </div>
          )}
          {isApproved && onMarkAsPickedUp && (
            <div className="sm:hidden flex gap-2 mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={handleMarkAsPickedUp}
                disabled={isProcessing}
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    บันทึกรับอุปกรณ์
                  </>
                )}
              </button>
            </div>
          )}
          {(isBorrowed || isOverdue) && onMarkAsReturned && (
            <div className="sm:hidden flex gap-2 mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={handleMarkAsReturned}
                disabled={isProcessing}
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-xl text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="px-4 pb-4 border-t border-gray-100">
            <div className="pt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Equipment Info */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ข้อมูลอุปกรณ์</h4>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    {(request.equipment?.imageURL || request.equipmentSnapshot?.imageUrl) && (
                      <img
                        src={request.equipment?.imageURL || request.equipmentSnapshot?.imageUrl}
                        alt={equipmentName}
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0 text-sm">
                      <p className="font-medium text-gray-900">{equipmentName}</p>
                      {(request.equipment?.brand || request.equipment?.model || request.equipmentSnapshot?.brand) && (
                        <p className="text-gray-600">
                          {request.equipment?.brand || request.equipmentSnapshot?.brand} {request.equipment?.model || request.equipmentSnapshot?.model}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 font-mono mt-1">
                        รหัส: {formatText(request.equipment?.serialNumber || request.equipment?.equipmentNumber || request.equipmentNumber || request.equipmentSnapshot?.equipmentNumber)}
                      </p>
                      {request.equipment?.location && (
                        <p className="text-xs text-gray-500 mt-1">สถานที่: {formatLocation(request.equipment.location)}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* User Info */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ข้อมูลผู้ขอยืม</h4>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    {request.user?.photoURL && (
                      <img
                        src={request.user.photoURL}
                        alt={userName}
                        className="w-12 h-12 rounded-full flex-shrink-0"
                      />
                    )}
                    {!request.user?.photoURL && (
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0 text-sm">
                      <p className="font-medium text-gray-900">{userName}</p>
                      <p className="text-gray-600 truncate">{formatText(request.user?.email || request.userSnapshot?.email)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatText(request.user?.department || request.userSnapshot?.department)} 
                        {(request.user?.userType || request.userSnapshot?.studentId) && ` (${formatText(request.user?.userType || request.userSnapshot?.studentId)})`}
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
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="block text-xs text-gray-500 mb-1">วันที่ส่งคำขอ</span>
                <span className="font-medium text-gray-900">{formatDateTime(request.createdAt)}</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="block text-xs text-gray-500 mb-1">วันที่ยืม</span>
                <span className="font-medium text-gray-900">{formatDate(request.borrowDate)}</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="block text-xs text-gray-500 mb-1">กำหนดคืน</span>
                <span className="font-medium text-gray-900">{formatDate(request.expectedReturnDate)}</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="block text-xs text-gray-500 mb-1">ระยะเวลา</span>
                <span className="font-medium text-gray-900">{calculateLoanDuration()} วัน</span>
              </div>
            </div>

            {/* Picked Up Info */}
            {request.pickedUpAt && (isBorrowed || isOverdue || request.status === LOAN_REQUEST_STATUS.RETURNED) && (
              <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  <span className="font-medium text-blue-700">รับอุปกรณ์เมื่อ:</span>
                  <span className="text-blue-600">{formatDateTime(request.pickedUpAt)}</span>
                </div>
              </div>
            )}

            {/* Actual Return Date */}
            {request.actualReturnDate && (
              <div className="mt-4 p-4 bg-emerald-50 rounded-xl">
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium text-emerald-700">คืนอุปกรณ์เมื่อ:</span>
                  <span className="text-emerald-600">{formatDateTime(request.actualReturnDate)}</span>
                </div>
                {request.returnCondition && (
                  <div className="mt-2 text-sm text-emerald-700">
                    <span className="font-medium">สภาพอุปกรณ์:</span>{' '}
                    {request.returnCondition === 'good' ? 'ปกติ' : 
                     request.returnCondition === 'damaged' ? 'ชำรุด' : 
                     request.returnCondition === 'needs_repair' ? 'ต้องซ่อม' : request.returnCondition}
                  </div>
                )}
                {request.returnNotes && (
                  <div className="mt-1 text-sm text-emerald-600">
                    <span className="font-medium">หมายเหตุการคืน:</span> {request.returnNotes}
                  </div>
                )}
              </div>
            )}

            {/* Purpose */}
            <div className="mt-4">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">วัตถุประสงค์</span>
              <p className="mt-2 text-sm text-gray-700 bg-gray-50 rounded-xl p-4">{request.purpose || '-'}</p>
            </div>

            {/* Notes */}
            {request.notes && (
              <div className="mt-4">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">หมายเหตุ</span>
                <p className="mt-2 text-sm text-gray-700 bg-gray-50 rounded-xl p-4">{request.notes}</p>
              </div>
            )}

            {/* Approval/Rejection Info */}
            {request.approvedAt && (
              <div className={`mt-4 p-4 rounded-xl ${request.status === LOAN_REQUEST_STATUS.REJECTED ? 'bg-rose-50' : 'bg-blue-50'}`}>
                <div className="text-sm">
                  <span className={`font-medium ${request.status === LOAN_REQUEST_STATUS.REJECTED ? 'text-rose-700' : 'text-blue-700'}`}>
                    {request.status === LOAN_REQUEST_STATUS.REJECTED ? 'ปฏิเสธเมื่อ:' : 'อนุมัติเมื่อ:'}
                  </span>
                  <span className={`ml-2 ${request.status === LOAN_REQUEST_STATUS.REJECTED ? 'text-rose-600' : 'text-blue-600'}`}>
                    {formatDateTime(request.approvedAt)}
                  </span>
                  {request.rejectionReason && (
                    <div className="mt-2">
                      <span className="font-medium text-rose-700">เหตุผล:</span>
                      <p className="text-rose-600 mt-1">{request.rejectionReason}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">รับคืนอุปกรณ์</h3>
                <button
                  onClick={() => { setShowReturnModal(false); setReturnCondition('good'); setReturnNotes(''); }}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                  disabled={isProcessing}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  สภาพอุปกรณ์ <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'good', label: 'สมบูรณ์ดี', icon: '✓', color: 'emerald' },
                    { value: 'damaged', label: 'มีความเสียหาย', icon: '⚠', color: 'amber' },
                    { value: 'needs_repair', label: 'ต้องซ่อมแซม', icon: '✕', color: 'rose' }
                  ].map(option => (
                    <label 
                      key={option.value}
                      className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        returnCondition === option.value 
                          ? `border-${option.color}-500 bg-${option.color}-50` 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="returnCondition"
                        value={option.value}
                        checked={returnCondition === option.value}
                        onChange={(e) => setReturnCondition(e.target.value)}
                        className="sr-only"
                        disabled={isProcessing}
                      />
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                        returnCondition === option.value 
                          ? `bg-${option.color}-100 text-${option.color}-600` 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {option.icon}
                      </span>
                      <span className={`font-medium ${returnCondition === option.value ? 'text-gray-900' : 'text-gray-600'}`}>
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="returnNotes" className="block text-sm font-medium text-gray-700 mb-2">
                  หมายเหตุ
                </label>
                <textarea
                  id="returnNotes"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  rows={3}
                  placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all"
                  disabled={isProcessing}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowReturnModal(false); setReturnCondition('good'); setReturnNotes(''); }}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleConfirmReturn}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      กำลังบันทึก...
                    </span>
                  ) : (
                    'ยืนยันการรับคืน'
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

export default StaffLoanRequestCard;
