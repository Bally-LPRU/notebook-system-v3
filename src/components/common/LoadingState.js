import React from 'react';

const LoadingState = ({ 
  type = 'spinner', 
  size = 'medium', 
  message = 'กำลังโหลด...', 
  showMessage = true,
  className = '',
  color = 'primary'
}) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-6 w-6',
    large: 'h-8 w-8',
    xlarge: 'h-12 w-12'
  };

  const colorClasses = {
    primary: 'border-primary-600',
    white: 'border-white',
    gray: 'border-gray-600',
    green: 'border-green-600',
    red: 'border-red-600'
  };

  const SpinnerLoader = () => (
    <div className={`animate-spin rounded-full border-2 border-t-transparent ${sizeClasses[size]} ${colorClasses[color]} ${className}`}></div>
  );

  const DotsLoader = () => (
    <div className={`flex space-x-1 ${className}`}>
      <div className={`rounded-full bg-current animate-pulse ${size === 'small' ? 'w-2 h-2' : size === 'large' ? 'w-4 h-4' : 'w-3 h-3'}`} style={{ animationDelay: '0ms' }}></div>
      <div className={`rounded-full bg-current animate-pulse ${size === 'small' ? 'w-2 h-2' : size === 'large' ? 'w-4 h-4' : 'w-3 h-3'}`} style={{ animationDelay: '150ms' }}></div>
      <div className={`rounded-full bg-current animate-pulse ${size === 'small' ? 'w-2 h-2' : size === 'large' ? 'w-4 h-4' : 'w-3 h-3'}`} style={{ animationDelay: '300ms' }}></div>
    </div>
  );

  const PulseLoader = () => (
    <div className={`animate-pulse bg-current rounded ${sizeClasses[size]} ${className}`}></div>
  );

  const BarsLoader = () => (
    <div className={`flex space-x-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`bg-current animate-pulse ${size === 'small' ? 'w-1 h-4' : size === 'large' ? 'w-2 h-8' : 'w-1.5 h-6'}`}
          style={{ 
            animationDelay: `${i * 100}ms`,
            animationDuration: '1s',
            animationIterationCount: 'infinite'
          }}
        ></div>
      ))}
    </div>
  );

  const renderLoader = () => {
    switch (type) {
      case 'dots':
        return <DotsLoader />;
      case 'pulse':
        return <PulseLoader />;
      case 'bars':
        return <BarsLoader />;
      case 'spinner':
      default:
        return <SpinnerLoader />;
    }
  };

  return (
    <div className="flex items-center justify-center space-x-2">
      {renderLoader()}
      {showMessage && message && (
        <span className={`text-sm ${color === 'white' ? 'text-white' : 'text-gray-600'}`}>
          {message}
        </span>
      )}
    </div>
  );
};

// Specific loading states for common use cases
export const ButtonLoadingState = ({ message = 'กำลังบันทึก...', className = '' }) => (
  <LoadingState 
    type="spinner" 
    size="small" 
    message={message} 
    color="white" 
    className={className}
  />
);

export const FormLoadingState = ({ message = 'กำลังบันทึกข้อมูล...', className = '' }) => (
  <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
    <LoadingState 
      type="spinner" 
      size="large" 
      message={message} 
      showMessage={true}
    />
    <p className="mt-2 text-xs text-gray-500">กรุณารอสักครู่...</p>
  </div>
);

export const AutoSaveIndicator = ({ status, lastSaved, className = '' }) => {
  const getStatusDisplay = () => {
    switch (status) {
      case 'saving':
        return (
          <div className="flex items-center text-blue-600">
            <LoadingState type="dots" size="small" showMessage={false} className="mr-2" />
            <span className="text-xs">กำลังบันทึก...</span>
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center text-green-600">
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-xs">บันทึกแล้ว</span>
            {lastSaved && (
              <span className="text-xs text-gray-500 ml-1">
                ({new Date(lastSaved).toLocaleTimeString('th-TH', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })})
              </span>
            )}
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center text-red-600">
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs">บันทึกไม่สำเร็จ</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`${className}`}>
      {getStatusDisplay()}
    </div>
  );
};

export default LoadingState;