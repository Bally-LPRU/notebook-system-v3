/**
 * CurrentLoansCard Component
 * แสดงอุปกรณ์ที่กำลังยืมอยู่ หรือ อุปกรณ์ที่เคยยืมล่าสุด
 */

import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { LOAN_REQUEST_STATUS } from '../../types/loanRequest';

const formatDateTime = (date) => {
  if (!date) return '-';
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('th-TH', { 
    day: 'numeric', 
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDate = (date) => {
  if (!date) return '-';
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('th-TH', { 
    day: 'numeric', 
    month: 'short',
    year: 'numeric'
  });
};

const CurrentLoansCard = ({ currentLoans, recentLoan, loading, error }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-4">
        <h3 className="text-sm font-medium text-red-900 mb-2">อุปกรณ์ของฉัน</h3>
        <p className="text-xs text-red-600">ไม่สามารถโหลดข้อมูลได้: {error}</p>
      </div>
    );
  }

  const hasCurrentLoans = currentLoans && currentLoans.length > 0;
  const displayLoan = hasCurrentLoans ? currentLoans[0] : recentLoan;

  if (!displayLoan) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">อุปกรณ์ของฉัน</h3>
        <p className="text-xs text-gray-500">ยังไม่มีประวัติการยืมอุปกรณ์</p>
        <Link to="/equipment" className="mt-2 inline-block text-xs text-blue-600 hover:underline">
          ดูรายการอุปกรณ์ →
        </Link>
      </div>
    );
  }

  const isOverdue = displayLoan.status === LOAN_REQUEST_STATUS.OVERDUE || displayLoan.status === 'overdue';
  const isBorrowed = displayLoan.status === LOAN_REQUEST_STATUS.BORROWED || displayLoan.status === 'borrowed';
  const isReturned = displayLoan.status === LOAN_REQUEST_STATUS.RETURNED || displayLoan.status === 'returned';

  // Get equipment info from various possible sources
  const equipmentName = displayLoan.equipmentName || displayLoan.equipmentSnapshot?.name || 'ไม่ระบุชื่อ';
  const equipmentNumber = displayLoan.equipmentNumber || displayLoan.equipmentSnapshot?.equipmentNumber || displayLoan.equipmentSnapshot?.serialNumber || '-';
  const imageUrl = displayLoan.equipmentSnapshot?.imageUrl || displayLoan.equipmentSnapshot?.imageURL || null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">
          {hasCurrentLoans ? '🔄 กำลังยืมอยู่' : '📋 ยืมล่าสุด'}
        </h3>
        {hasCurrentLoans && currentLoans.length > 1 && (
          <span className="text-xs text-blue-600 font-medium">+{currentLoans.length - 1} รายการ</span>
        )}
      </div>

      <div className={`p-3 rounded-lg border ${
        isOverdue ? 'bg-red-50 border-red-200' : 
        isBorrowed ? 'bg-blue-50 border-blue-200' : 
        'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex gap-3">
          {/* Equipment Thumbnail */}
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden border border-gray-200">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={equipmentName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className={`w-full h-full items-center justify-center bg-gray-100 ${imageUrl ? 'hidden' : 'flex'}`}>
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          {/* Equipment Info */}
          <div className="flex-1 min-w-0">
            {/* Equipment Name */}
            <p className="text-sm font-medium text-gray-900 truncate mb-1">
              {equipmentName}
            </p>
            
            {/* Equipment Number */}
            <p className="text-xs text-gray-500 mb-2">
              <span className="font-medium">หมายเลข:</span> {equipmentNumber}
            </p>

            {/* Status Badge & Date Info */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                isOverdue ? 'bg-red-100 text-red-700' :
                isBorrowed ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {isOverdue ? '⚠️ เกินกำหนด' : isBorrowed ? '📦 กำลังยืม' : '✅ คืนแล้ว'}
              </span>
            </div>

            {/* Date Information */}
            <div className="mt-2 text-xs text-gray-600">
              {(isBorrowed || isOverdue) && displayLoan.expectedReturnDate && (
                <div className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                    กำหนดคืน: {formatDateTime(displayLoan.expectedReturnDate)}
                  </span>
                </div>
              )}
              {isReturned && displayLoan.borrowDate && (
                <div className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>ยืมเมื่อ: {formatDate(displayLoan.borrowDate)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Button for returned items */}
        {isReturned && displayLoan.equipmentId && (
          <Link
            to={`/equipment?id=${displayLoan.equipmentId}`}
            className="mt-3 w-full inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            ยืมอีกครั้ง
          </Link>
        )}
      </div>

      {/* Link to view all */}
      {hasCurrentLoans && currentLoans.length > 1 && (
        <Link to="/my-requests" className="mt-3 inline-flex items-center text-xs text-blue-600 hover:underline font-medium">
          ดูทั้งหมด ({currentLoans.length} รายการ) →
        </Link>
      )}
    </div>
  );
};

CurrentLoansCard.propTypes = {
  currentLoans: PropTypes.array,
  recentLoan: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.string
};

export default CurrentLoansCard;
