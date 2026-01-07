/**
 * CurrentLoansCard Component
 * แสดงอุปกรณ์ที่กำลังยืมอยู่ หรือ อุปกรณ์ที่เคยยืมล่าสุด
 */

import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { LOAN_REQUEST_STATUS } from '../../types/loanRequest';

const formatDate = (date) => {
  if (!date) return '-';
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
};

const CurrentLoansCard = ({ currentLoans, recentLoan, loading, error }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
        <div className="h-16 bg-gray-200 rounded"></div>
      </div>
    );
  }

  // Show error if any
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

  const isOverdue = displayLoan.status === LOAN_REQUEST_STATUS.OVERDUE;
  const isBorrowed = displayLoan.status === LOAN_REQUEST_STATUS.BORROWED;
  const isReturned = displayLoan.status === LOAN_REQUEST_STATUS.RETURNED;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-900">
          {hasCurrentLoans ? 'กำลังยืมอยู่' : 'ยืมล่าสุด'}
        </h3>
        {hasCurrentLoans && currentLoans.length > 1 && (
          <span className="text-xs text-gray-500">+{currentLoans.length - 1} รายการ</span>
        )}
      </div>

      <div className={`p-3 rounded-lg border ${
        isOverdue ? 'bg-red-50 border-red-200' : 
        isBorrowed ? 'bg-blue-50 border-blue-200' : 
        'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-start gap-3">
          {/* Equipment Image */}
          <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
            {displayLoan.equipmentSnapshot?.imageURL ? (
              <img 
                src={displayLoan.equipmentSnapshot.imageURL} 
                alt={displayLoan.equipmentName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Equipment Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {displayLoan.equipmentName || displayLoan.equipmentSnapshot?.name || 'ไม่ระบุชื่อ'}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-1.5 py-0.5 rounded text-xs ${
                isOverdue ? 'bg-red-100 text-red-700' :
                isBorrowed ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {isOverdue ? 'เกินกำหนด' : isBorrowed ? 'กำลังยืม' : 'คืนแล้ว'}
              </span>
              {(isBorrowed || isOverdue) && displayLoan.expectedReturnDate && (
                <span className="text-xs text-gray-500">
                  คืน {formatDate(displayLoan.expectedReturnDate)}
                </span>
              )}
              {isReturned && displayLoan.actualReturnDate && (
                <span className="text-xs text-gray-500">
                  คืนเมื่อ {formatDate(displayLoan.actualReturnDate)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        {isReturned && displayLoan.equipmentId && (
          <Link
            to={`/equipment?id=${displayLoan.equipmentId}`}
            className="mt-2 w-full inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
          >
            ยืมอีกครั้ง
          </Link>
        )}
      </div>

      {hasCurrentLoans && currentLoans.length > 1 && (
        <Link to="/my-requests" className="mt-2 inline-block text-xs text-blue-600 hover:underline">
          ดูทั้งหมด →
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
