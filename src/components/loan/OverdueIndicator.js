/**
 * Overdue Indicator Component
 * 
 * Displays overdue status for loan requests with visual indicators.
 * Shows days overdue with appropriate color coding based on severity.
 */

import React from 'react';
import { ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';
import OverdueManagementService from '../../services/overdueManagementService';

/**
 * OverdueIndicator Component
 * @param {Object} props - Component props
 * @param {Object} props.loanRequest - Loan request object
 * @param {boolean} props.showIcon - Show warning icon (default: true)
 * @param {boolean} props.showDueSoon - Show "due soon" indicator (default: true)
 * @param {'badge'|'text'|'full'} props.variant - Display variant (default: 'badge')
 */
const OverdueIndicator = ({ 
  loanRequest, 
  showIcon = true, 
  showDueSoon = true,
  variant = 'badge' 
}) => {
  if (!loanRequest) {
    return null;
  }

  const isOverdue = OverdueManagementService.isOverdue(loanRequest);
  const daysOverdue = OverdueManagementService.calculateDaysOverdue(loanRequest.expectedReturnDate);
  const daysUntilDue = OverdueManagementService.calculateDaysUntilDue(loanRequest.expectedReturnDate);
  
  // Show overdue indicator
  if (isOverdue) {
    const overdueLabel = OverdueManagementService.getOverdueStatusLabel(loanRequest);
    const colorClass = OverdueManagementService.getOverdueColorClass(daysOverdue);
    const badgeClass = OverdueManagementService.getOverdueBadgeClass(daysOverdue);

    if (variant === 'badge') {
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
          {showIcon && <ExclamationTriangleIcon className="w-4 h-4 mr-1" />}
          {overdueLabel}
        </span>
      );
    }

    if (variant === 'text') {
      return (
        <span className={`inline-flex items-center text-sm font-medium ${colorClass}`}>
          {showIcon && <ExclamationTriangleIcon className="w-4 h-4 mr-1" />}
          {overdueLabel}
        </span>
      );
    }

    if (variant === 'full') {
      return (
        <div className={`flex items-start p-3 rounded-lg ${daysOverdue > 7 ? 'bg-red-50' : 'bg-orange-50'}`}>
          {showIcon && (
            <ExclamationTriangleIcon className={`w-5 h-5 mr-2 flex-shrink-0 ${daysOverdue > 7 ? 'text-red-600' : 'text-orange-600'}`} />
          )}
          <div>
            <p className={`text-sm font-medium ${daysOverdue > 7 ? 'text-red-800' : 'text-orange-800'}`}>
              {overdueLabel}
            </p>
            <p className={`text-xs mt-1 ${daysOverdue > 7 ? 'text-red-600' : 'text-orange-600'}`}>
              กำหนดคืน: {OverdueManagementService.formatOverdueDate(loanRequest.expectedReturnDate)}
            </p>
          </div>
        </div>
      );
    }
  }

  // Show "due soon" indicator
  if (showDueSoon && daysUntilDue >= 0 && daysUntilDue <= 3) {
    const dueSoonLabel = OverdueManagementService.getDueSoonLabel(loanRequest);
    
    if (!dueSoonLabel) {
      return null;
    }

    if (variant === 'badge') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          {showIcon && <ClockIcon className="w-4 h-4 mr-1" />}
          {dueSoonLabel}
        </span>
      );
    }

    if (variant === 'text') {
      return (
        <span className="inline-flex items-center text-sm font-medium text-yellow-700">
          {showIcon && <ClockIcon className="w-4 h-4 mr-1" />}
          {dueSoonLabel}
        </span>
      );
    }

    if (variant === 'full') {
      return (
        <div className="flex items-start p-3 rounded-lg bg-yellow-50">
          {showIcon && (
            <ClockIcon className="w-5 h-5 mr-2 flex-shrink-0 text-yellow-600" />
          )}
          <div>
            <p className="text-sm font-medium text-yellow-800">
              {dueSoonLabel}
            </p>
            <p className="text-xs mt-1 text-yellow-600">
              กำหนดคืน: {OverdueManagementService.formatOverdueDate(loanRequest.expectedReturnDate)}
            </p>
          </div>
        </div>
      );
    }
  }

  return null;
};

export default OverdueIndicator;
