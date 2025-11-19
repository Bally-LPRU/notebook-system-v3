/**
 * Loan Status Badge Component
 * 
 * Unified status badge for loan requests with consistent styling.
 * Replaces duplicate status displays and provides clear visual feedback.
 */

import React from 'react';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  TruckIcon,
  ArrowUturnLeftIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { LOAN_REQUEST_STATUS, LOAN_REQUEST_STATUS_LABELS } from '../../types/loanRequest';

/**
 * Get status configuration (color, icon, label)
 * @param {string} status - Loan request status
 * @returns {Object} Status configuration
 */
const getStatusConfig = (status) => {
  const configs = {
    [LOAN_REQUEST_STATUS.PENDING]: {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: ClockIcon,
      label: LOAN_REQUEST_STATUS_LABELS[LOAN_REQUEST_STATUS.PENDING],
      description: 'รอผู้ดูแลระบบพิจารณา'
    },
    [LOAN_REQUEST_STATUS.APPROVED]: {
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircleIcon,
      label: LOAN_REQUEST_STATUS_LABELS[LOAN_REQUEST_STATUS.APPROVED],
      description: 'พร้อมรับอุปกรณ์'
    },
    [LOAN_REQUEST_STATUS.REJECTED]: {
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: XCircleIcon,
      label: LOAN_REQUEST_STATUS_LABELS[LOAN_REQUEST_STATUS.REJECTED],
      description: 'คำขอถูกปฏิเสธ'
    },
    [LOAN_REQUEST_STATUS.BORROWED]: {
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: TruckIcon,
      label: LOAN_REQUEST_STATUS_LABELS[LOAN_REQUEST_STATUS.BORROWED],
      description: 'กำลังยืมอยู่'
    },
    [LOAN_REQUEST_STATUS.RETURNED]: {
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: ArrowUturnLeftIcon,
      label: LOAN_REQUEST_STATUS_LABELS[LOAN_REQUEST_STATUS.RETURNED],
      description: 'คืนแล้ว'
    },
    [LOAN_REQUEST_STATUS.OVERDUE]: {
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: ExclamationTriangleIcon,
      label: LOAN_REQUEST_STATUS_LABELS[LOAN_REQUEST_STATUS.OVERDUE],
      description: 'เกินกำหนดคืน'
    }
  };

  return configs[status] || {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: ClockIcon,
    label: 'ไม่ทราบสถานะ',
    description: ''
  };
};

/**
 * LoanStatusBadge Component
 * @param {Object} props - Component props
 * @param {string} props.status - Loan request status
 * @param {boolean} props.showIcon - Show status icon (default: true)
 * @param {boolean} props.showDescription - Show status description (default: false)
 * @param {'sm'|'md'|'lg'} props.size - Badge size (default: 'md')
 * @param {string} props.className - Additional CSS classes
 */
const LoanStatusBadge = ({ 
  status, 
  showIcon = true, 
  showDescription = false,
  size = 'md',
  className = '' 
}) => {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  if (showDescription) {
    return (
      <div className={`inline-flex flex-col ${className}`}>
        <span className={`inline-flex items-center rounded-md font-medium border ${config.color} ${sizeClasses[size]}`}>
          {showIcon && <Icon className={`${iconSizes[size]} mr-1.5`} />}
          {config.label}
        </span>
        {config.description && (
          <span className="text-xs text-gray-500 mt-1">
            {config.description}
          </span>
        )}
      </div>
    );
  }

  return (
    <span className={`inline-flex items-center rounded-md font-medium border ${config.color} ${sizeClasses[size]} ${className}`}>
      {showIcon && <Icon className={`${iconSizes[size]} mr-1.5`} />}
      {config.label}
    </span>
  );
};

export default LoanStatusBadge;
