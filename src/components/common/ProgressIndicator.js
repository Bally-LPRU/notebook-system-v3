import React from 'react';

const ProgressIndicator = ({ 
  currentStep = 0, 
  totalSteps = 5, 
  completedFields = [], 
  requiredFields = [],
  showFieldProgress = true,
  className = '' 
}) => {
  const progressPercentage = Math.round((completedFields.length / requiredFields.length) * 100);
  
  const getStepStatus = (stepIndex) => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'current';
    return 'upcoming';
  };

  const steps = [
    { name: 'ข้อมูลส่วนตัว', description: 'ชื่อ-นามสกุล' },
    { name: 'ข้อมูลติดต่อ', description: 'เบอร์โทรศัพท์' },
    { name: 'สังกัด', description: 'แผนก/หน่วยงาน' },
    { name: 'ประเภทผู้ใช้', description: 'นักศึกษา/อาจารย์/เจ้าหน้าที่' },
    { name: 'ตรวจสอบ', description: 'ยืนยันข้อมูล' }
  ];

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      {/* Overall Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">ความคืบหน้าการสมัคร</h3>
          <span className="text-sm text-gray-500">{progressPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Field Completion Status */}
      {showFieldProgress && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-700 mb-2">สถานะการกรอกข้อมูล</h4>
          <div className="grid grid-cols-2 gap-2">
            {requiredFields.map((field) => {
              const isCompleted = completedFields.includes(field.name);
              return (
                <div key={field.name} className="flex items-center text-xs">
                  <div className={`w-3 h-3 rounded-full mr-2 flex items-center justify-center ${
                    isCompleted ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {isCompleted ? (
                      <svg className="w-2 h-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    )}
                  </div>
                  <span className={isCompleted ? 'text-green-700' : 'text-gray-500'}>
                    {field.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step Progress */}
      <div className="space-y-2">
        {steps.slice(0, totalSteps).map((step, index) => {
          const status = getStepStatus(index);
          return (
            <div key={index} className="flex items-center">
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                status === 'completed' 
                  ? 'bg-green-100 text-green-800' 
                  : status === 'current'
                  ? 'bg-primary-100 text-primary-800'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {status === 'completed' ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className={`text-sm font-medium ${
                  status === 'completed' 
                    ? 'text-green-900' 
                    : status === 'current'
                    ? 'text-primary-900'
                    : 'text-gray-500'
                }`}>
                  {step.name}
                </p>
                <p className={`text-xs ${
                  status === 'completed' 
                    ? 'text-green-600' 
                    : status === 'current'
                    ? 'text-primary-600'
                    : 'text-gray-400'
                }`}>
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Next Steps */}
      {progressPercentage < 100 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <div className="flex">
            <svg className="flex-shrink-0 h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                ขั้นตอนถัดไป
              </h3>
              <div className="mt-1 text-sm text-blue-700">
                <p>กรอกข้อมูลที่เหลือให้ครบถ้วนเพื่อส่งคำขอสมัครสมาชิก</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Completion Message */}
      {progressPercentage === 100 && (
        <div className="mt-4 p-3 bg-green-50 rounded-md">
          <div className="flex">
            <svg className="flex-shrink-0 h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                พร้อมส่งคำขอ!
              </h3>
              <div className="mt-1 text-sm text-green-700">
                <p>ข้อมูลครบถ้วนแล้ว คลิกปุ่ม "บันทึกข้อมูล" เพื่อส่งคำขอสมัครสมาชิก</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressIndicator;