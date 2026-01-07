/**
 * CurrentLoansCard Component
 * แสดงอุปกรณ์ที่กำลังยืมอยู่ หรือ อุปกรณ์ที่เคยยืมล่าสุด
 * Updated with pastel colors and animations
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
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded-full w-1/3 mb-4"></div>
          <div className="flex gap-4">
            <div className="w-20 h-20 bg-gray-200 rounded-xl"></div>
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-6 bg-gray-200 rounded-full w-24"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 rounded-2xl shadow-sm border border-rose-200 p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-rose-800">เกิดข้อผิดพลาด</h3>
            <p className="text-xs text-rose-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const hasCurrentLoans = currentLoans && currentLoans.length > 0;
  const displayLoan = hasCurrentLoans ? currentLoans[0] : recentLoan;

  if (!displayLoan) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
          อุปกรณ์ของฉัน
        </h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-500 mb-4">ยังไม่มีประวัติการยืมอุปกรณ์</p>
          <Link 
            to="/equipment" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl font-medium hover:bg-blue-200 transition-all duration-300 hover:scale-105"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            ดูรายการอุปกรณ์
          </Link>
        </div>
      </div>
    );
  }

  const isOverdue = displayLoan.status === LOAN_REQUEST_STATUS.OVERDUE || displayLoan.status === 'overdue';
  const isBorrowed = displayLoan.status === LOAN_REQUEST_STATUS.BORROWED || displayLoan.status === 'borrowed';
  const isReturned = displayLoan.status === LOAN_REQUEST_STATUS.RETURNED || displayLoan.status === 'returned';

  const equipmentName = displayLoan.equipmentName || displayLoan.equipmentSnapshot?.name || 'ไม่ระบุชื่อ';
  const equipmentNumber = displayLoan.equipmentNumber || displayLoan.equipmentSnapshot?.equipmentNumber || displayLoan.equipmentSnapshot?.serialNumber || '-';
  const imageUrl = displayLoan.equipmentSnapshot?.imageUrl || displayLoan.equipmentSnapshot?.imageURL || null;

  const statusConfig = {
    overdue: { bg: 'bg-rose-50', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-700', icon: '⚠️', text: 'เกินกำหนด', dot: 'bg-rose-400' },
    borrowed: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', icon: '📦', text: 'กำลังยืม', dot: 'bg-blue-400' },
    returned: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', icon: '✅', text: 'คืนแล้ว', dot: 'bg-emerald-400' }
  };

  const status = isOverdue ? 'overdue' : isBorrowed ? 'borrowed' : 'returned';
  const config = statusConfig[status];

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span className={`w-2 h-2 ${config.dot} rounded-full ${(isBorrowed || isOverdue) ? 'animate-pulse' : ''}`}></span>
          {hasCurrentLoans ? 'กำลังยืมอยู่' : 'ยืมล่าสุด'}
        </h3>
        {hasCurrentLoans && currentLoans.length > 1 && (
          <span className="px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
            +{currentLoans.length - 1} รายการ
          </span>
        )}
      </div>

      <div className={`p-4 rounded-xl border transition-all duration-300 hover:shadow-md ${config.bg} ${config.border}`}>
        <div className="flex gap-4">
          {/* Equipment Thumbnail */}
          <div className="w-20 h-20 bg-white rounded-xl flex-shrink-0 overflow-hidden border border-gray-200 shadow-sm group">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={equipmentName}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className={`w-full h-full items-center justify-center bg-gray-100 ${imageUrl ? 'hidden' : 'flex'}`}>
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          {/* Equipment Info */}
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-gray-900 truncate mb-1">{equipmentName}</p>
            <p className="text-sm text-gray-500 mb-3">
              <span className="font-medium">หมายเลข:</span> {equipmentNumber}
            </p>

            {/* Status Badge */}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.badge}`}>
              {config.icon} {config.text}
            </span>

            {/* Date Information */}
            <div className="mt-3 text-sm text-gray-600">
              {(isBorrowed || isOverdue) && displayLoan.expectedReturnDate && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className={isOverdue ? 'text-rose-600 font-semibold' : ''}>
                    กำหนดคืน: {formatDateTime(displayLoan.expectedReturnDate)}
                  </span>
                </div>
              )}
              {isReturned && displayLoan.borrowDate && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-xl hover:bg-blue-200 transition-all duration-300 hover:scale-[1.02]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            ยืมอีกครั้ง
          </Link>
        )}
      </div>

      {/* Link to view all */}
      {hasCurrentLoans && currentLoans.length > 1 && (
        <Link 
          to="/my-requests" 
          className="mt-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium group"
        >
          ดูทั้งหมด ({currentLoans.length} รายการ)
          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
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
