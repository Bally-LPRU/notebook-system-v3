import React from 'react';
import DuplicateDetectionService from '../../services/duplicateDetectionService';

/**
 * Enhanced Profile Status Tracker Component
 * Implements requirements 2.1, 2.4, 2.5
 * 
 * Features:
 * - Visual progress indicators for registration steps
 * - Status-specific messaging and guidance
 * - Estimated approval time display
 * - Registration completion tracking
 */
const ProfileStatusTracker = ({ 
  profile, 
  className = '',
  showDetailedProgress = true,
  showEstimatedTime = true,
  compact = false 
}) => {
  if (!profile) {
    return null;
  }

  const statusInfo = DuplicateDetectionService.getStatusDisplayInfo(profile);

  // Calculate registration progress
  const getRegistrationProgress = () => {
    const requiredFields = ['firstName', 'lastName', 'phoneNumber', 'department', 'userType'];
    const completedFields = requiredFields.filter(field => {
      if (field === 'department') {
        return profile[field] && (profile[field].value || profile[field]);
      }
      return profile[field] && profile[field].trim() !== '';
    });

    const progressPercentage = Math.round((completedFields.length / requiredFields.length) * 100);
    
    return {
      percentage: progressPercentage,
      completedFields: completedFields.length,
      totalFields: requiredFields.length,
      isComplete: progressPercentage === 100
    };
  };

  // Get registration steps with status
  const getRegistrationSteps = () => {
    const steps = [
      {
        id: 'personal',
        name: 'ข้อมูลส่วนตัว',
        description: 'ชื่อ-นามสกุล',
        fields: ['firstName', 'lastName'],
        icon: 'user'
      },
      {
        id: 'contact',
        name: 'ข้อมูลติดต่อ',
        description: 'เบอร์โทรศัพท์',
        fields: ['phoneNumber'],
        icon: 'phone'
      },
      {
        id: 'department',
        name: 'สังกัด',
        description: 'แผนก/หน่วยงาน',
        fields: ['department'],
        icon: 'building'
      },
      {
        id: 'userType',
        name: 'ประเภทผู้ใช้',
        description: 'นักศึกษา/อาจารย์/เจ้าหน้าที่',
        fields: ['userType'],
        icon: 'identification'
      },
      {
        id: 'review',
        name: 'ตรวจสอบ',
        description: 'ยืนยันข้อมูล',
        fields: [],
        icon: 'check'
      }
    ];

    return steps.map(step => {
      const isCompleted = step.fields.every(field => {
        if (field === 'department') {
          return profile[field] && (profile[field].value || profile[field]);
        }
        return profile[field] && profile[field].trim() !== '';
      });

      return {
        ...step,
        isCompleted,
        status: isCompleted ? 'completed' : 'pending'
      };
    });
  };

  // Get status-specific timeline
  const getStatusTimeline = () => {
    const baseSteps = getRegistrationSteps();
    
    switch (profile.status) {
      case 'incomplete':
        return baseSteps;
      case 'pending':
        return [
          ...baseSteps.map(step => ({ ...step, isCompleted: true, status: 'completed' })),
          {
            id: 'submitted',
            name: 'ส่งคำขอแล้ว',
            description: 'รอการตรวจสอบ',
            isCompleted: true,
            status: 'completed',
            icon: 'document-check'
          },
          {
            id: 'review',
            name: 'การตรวจสอบ',
            description: 'ผู้ดูแลระบบกำลังตรวจสอบ',
            isCompleted: false,
            status: 'current',
            icon: 'clock'
          }
        ];
      case 'approved':
        return [
          ...baseSteps.map(step => ({ ...step, isCompleted: true, status: 'completed' })),
          {
            id: 'submitted',
            name: 'ส่งคำขอแล้ว',
            description: 'รอการตรวจสอบ',
            isCompleted: true,
            status: 'completed',
            icon: 'document-check'
          },
          {
            id: 'approved',
            name: 'อนุมัติแล้ว',
            description: 'พร้อมใช้งาน',
            isCompleted: true,
            status: 'completed',
            icon: 'check-circle'
          }
        ];
      case 'rejected':
        return [
          ...baseSteps.map(step => ({ ...step, isCompleted: true, status: 'completed' })),
          {
            id: 'submitted',
            name: 'ส่งคำขอแล้ว',
            description: 'รอการตรวจสอบ',
            isCompleted: true,
            status: 'completed',
            icon: 'document-check'
          },
          {
            id: 'rejected',
            name: 'ไม่อนุมัติ',
            description: 'ติดต่อผู้ดูแลระบบ',
            isCompleted: true,
            status: 'rejected',
            icon: 'x-circle'
          }
        ];
      default:
        return baseSteps;
    }
  };

  // Get estimated approval time
  const getEstimatedApprovalTime = () => {
    if (profile.status !== 'pending') return null;

    const submittedAt = profile.updatedAt || profile.createdAt;
    if (!submittedAt) return '1-2 วันทำการ';

    const submittedDate = submittedAt.toDate ? submittedAt.toDate() : new Date(submittedAt);
    const now = new Date();
    const hoursPassed = Math.floor((now - submittedDate) / (1000 * 60 * 60));

    if (hoursPassed < 24) {
      return 'ภายใน 1-2 วันทำการ';
    } else if (hoursPassed < 48) {
      return 'ภายใน 1 วันทำการ';
    } else {
      return 'กำลังตรวจสอบ';
    }
  };

  // Icon components
  const getIcon = (iconName, className = 'w-4 h-4') => {
    const icons = {
      user: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      phone: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      building: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      identification: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
        </svg>
      ),
      check: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      'document-check': (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      clock: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      'check-circle': (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      'x-circle': (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    };

    return icons[iconName] || icons.check;
  };

  const progress = getRegistrationProgress();
  const timeline = getStatusTimeline();
  const estimatedTime = getEstimatedApprovalTime();

  if (compact) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        {/* Compact Progress Bar */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">สถานะการสมัคร</h3>
          <span className={`text-sm font-medium ${
            statusInfo.status === 'approved' ? 'text-green-600' :
            statusInfo.status === 'pending' ? 'text-blue-600' :
            statusInfo.status === 'rejected' ? 'text-red-600' :
            'text-yellow-600'
          }`}>
            {statusInfo.title}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              statusInfo.status === 'approved' ? 'bg-green-500' :
              statusInfo.status === 'pending' ? 'bg-blue-500' :
              statusInfo.status === 'rejected' ? 'bg-red-500' :
              'bg-yellow-500'
            }`}
            style={{ 
              width: statusInfo.status === 'incomplete' ? `${progress.percentage}%` : '100%'
            }}
          />
        </div>

        {/* Estimated Time */}
        {showEstimatedTime && estimatedTime && (
          <p className="text-xs text-gray-500 text-center">
            ⏱️ {estimatedTime}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900">สถานะการสมัครสมาชิก</h2>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            statusInfo.status === 'approved' ? 'bg-green-100 text-green-800' :
            statusInfo.status === 'pending' ? 'bg-blue-100 text-blue-800' :
            statusInfo.status === 'rejected' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {statusInfo.title}
          </span>
        </div>
        
        <p className="text-gray-600">{statusInfo.message}</p>
      </div>

      {/* Overall Progress (for incomplete status) */}
      {profile.status === 'incomplete' && showDetailedProgress && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900">ความคืบหน้าการกรอกข้อมูล</h3>
            <span className="text-sm text-gray-500">
              {progress.completedFields}/{progress.totalFields} ({progress.percentage}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-500 h-3 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">ขั้นตอนการสมัคร</h3>
        
        {timeline.map((step, index) => {
          const isLast = index === timeline.length - 1;
          
          return (
            <div key={step.id} className="relative">
              {/* Connector Line */}
              {!isLast && (
                <div className={`absolute left-4 top-8 w-0.5 h-8 ${
                  step.isCompleted ? 'bg-green-300' : 'bg-gray-200'
                }`} />
              )}
              
              {/* Step Content */}
              <div className="flex items-start">
                {/* Step Icon */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  step.status === 'completed' ? 'bg-green-100 text-green-600' :
                  step.status === 'current' ? 'bg-blue-100 text-blue-600' :
                  step.status === 'rejected' ? 'bg-red-100 text-red-600' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {step.isCompleted && step.status !== 'rejected' ? (
                    getIcon('check', 'w-4 h-4')
                  ) : (
                    getIcon(step.icon, 'w-4 h-4')
                  )}
                </div>
                
                {/* Step Details */}
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-medium ${
                      step.status === 'completed' ? 'text-green-900' :
                      step.status === 'current' ? 'text-blue-900' :
                      step.status === 'rejected' ? 'text-red-900' :
                      'text-gray-500'
                    }`}>
                      {step.name}
                    </h4>
                    
                    {/* Status Badge */}
                    {step.status === 'current' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        กำลังดำเนินการ
                      </span>
                    )}
                  </div>
                  
                  <p className={`text-sm mt-1 ${
                    step.status === 'completed' ? 'text-green-600' :
                    step.status === 'current' ? 'text-blue-600' :
                    step.status === 'rejected' ? 'text-red-600' :
                    'text-gray-400'
                  }`}>
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Estimated Approval Time */}
      {showEstimatedTime && estimatedTime && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {getIcon('clock', 'w-5 h-5 text-blue-600')}
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-900">
                ระยะเวลาการอนุมัติ
              </h4>
              <p className="text-sm text-blue-700">
                {estimatedTime}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Next Steps */}
      {statusInfo.nextSteps && statusInfo.nextSteps.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            ขั้นตอนถัดไป:
          </h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {statusInfo.nextSteps.map((step, index) => (
              <li key={index} className="flex items-start">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-300 text-white text-xs flex items-center justify-center mr-2 mt-0.5 font-medium">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Last Updated */}
      {profile.updatedAt && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            อัปเดตล่าสุด: {new Date(
              profile.updatedAt.toDate ? profile.updatedAt.toDate() : profile.updatedAt
            ).toLocaleString('th-TH')}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProfileStatusTracker;