import React from 'react';
import DuplicateDetectionService from '../../services/duplicateDetectionService';

/**
 * Component for displaying status messages and next steps
 * Implements requirements 8.5, 2.4, 2.5
 */
const StatusMessage = ({ profile, className = '', showNextSteps = true, compact = false }) => {
  if (!profile) {
    return null;
  }

  const statusInfo = DuplicateDetectionService.getStatusDisplayInfo(profile);

  // Icon mapping
  const iconMap = {
    'exclamation-triangle': (
      <svg className={`${compact ? 'w-5 h-5' : 'w-6 h-6'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    'clock': (
      <svg className={`${compact ? 'w-5 h-5' : 'w-6 h-6'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    'check-circle': (
      <svg className={`${compact ? 'w-5 h-5' : 'w-6 h-6'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    'x-circle': (
      <svg className={`${compact ? 'w-5 h-5' : 'w-6 h-6'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    'question-mark-circle': (
      <svg className={`${compact ? 'w-5 h-5' : 'w-6 h-6'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  };

  // Color mapping
  const colorMap = {
    yellow: {
      bg: compact ? 'bg-yellow-50' : 'bg-yellow-100',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: 'text-yellow-600'
    },
    blue: {
      bg: compact ? 'bg-blue-50' : 'bg-blue-100',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: 'text-blue-600'
    },
    green: {
      bg: compact ? 'bg-green-50' : 'bg-green-100',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: 'text-green-600'
    },
    red: {
      bg: compact ? 'bg-red-50' : 'bg-red-100',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: 'text-red-600'
    },
    gray: {
      bg: compact ? 'bg-gray-50' : 'bg-gray-100',
      border: 'border-gray-200',
      text: 'text-gray-800',
      icon: 'text-gray-600'
    }
  };

  const colors = colorMap[statusInfo.color] || colorMap.gray;

  if (compact) {
    return (
      <div className={`${colors.bg} ${colors.border} border rounded-md p-3 ${className}`}>
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${colors.icon}`}>
            {iconMap[statusInfo.icon] || iconMap['question-mark-circle']}
          </div>
          <div className="ml-3">
            <p className={`text-sm font-medium ${colors.text}`}>
              {statusInfo.title}
            </p>
            <p className={`text-sm ${colors.text} opacity-90`}>
              {statusInfo.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${colors.bg} ${colors.border} border rounded-lg p-6 ${className}`}>
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${colors.icon}`}>
          {iconMap[statusInfo.icon] || iconMap['question-mark-circle']}
        </div>
        <div className="ml-4 flex-1">
          <h3 className={`text-lg font-medium ${colors.text}`}>
            {statusInfo.title}
          </h3>
          <p className={`mt-2 text-sm ${colors.text} opacity-90`}>
            {statusInfo.message}
          </p>
          
          {showNextSteps && statusInfo.nextSteps && statusInfo.nextSteps.length > 0 && (
            <div className="mt-4">
              <h4 className={`text-sm font-medium ${colors.text} mb-2`}>
                ขั้นตอนถัดไป:
              </h4>
              <ul className={`text-sm ${colors.text} opacity-90 space-y-1`}>
                {statusInfo.nextSteps.map((step, index) => (
                  <li key={index} className="flex items-start">
                    <span className={`flex-shrink-0 w-5 h-5 rounded-full ${colors.icon} bg-white text-xs flex items-center justify-center mr-2 mt-0.5 font-medium`}>
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Estimated time for pending status */}
          {statusInfo.status === 'pending' && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className={`text-xs ${colors.text} opacity-75`}>
                ⏱️ ระยะเวลาการอนุมัติโดยประมาณ: 1-2 วันทำการ
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusMessage;