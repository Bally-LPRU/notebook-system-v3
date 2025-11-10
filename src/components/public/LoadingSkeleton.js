import React from 'react';

/**
 * Loading skeleton components for the public homepage
 */

// Stats card skeleton
export const StatsCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4 mb-2 sm:mb-3"></div>
        <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/2"></div>
      </div>
      <div className="ml-3 sm:ml-4 flex-shrink-0">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-xl"></div>
      </div>
    </div>
    <div className="mt-3 sm:mt-4 flex items-center justify-between">
      <div className="h-2 bg-gray-200 rounded w-1/3"></div>
      <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
    </div>
  </div>
);

// Enhanced stats card skeleton with more sophisticated loading states
export const EnhancedStatsCardSkeleton = ({ 
  delay = 0, 
  showPulse = true, 
  showShimmer = true 
}) => (
  <div 
    className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 overflow-hidden relative"
    style={{ animationDelay: `${delay}ms` }}
  >
    {/* Shimmer overlay */}
    {showShimmer && (
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
    )}
    
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <div className={`h-3 sm:h-4 bg-gray-200 rounded w-3/4 mb-2 sm:mb-3 ${
          showPulse ? 'animate-pulse' : ''
        }`}></div>
        <div className={`h-6 sm:h-8 bg-gray-200 rounded w-1/2 ${
          showPulse ? 'animate-pulse' : ''
        }`} style={{ animationDelay: `${delay + 200}ms` }}></div>
      </div>
      <div className="ml-3 sm:ml-4 flex-shrink-0">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-xl ${
          showPulse ? 'animate-pulse' : ''
        }`} style={{ animationDelay: `${delay + 400}ms` }}></div>
      </div>
    </div>
    <div className="mt-3 sm:mt-4 flex items-center justify-between">
      <div className={`h-2 bg-gray-200 rounded w-1/3 ${
        showPulse ? 'animate-pulse' : ''
      }`} style={{ animationDelay: `${delay + 600}ms` }}></div>
      <div className={`w-2 h-2 bg-gray-200 rounded-full ${
        showPulse ? 'animate-pulse' : ''
      }`} style={{ animationDelay: `${delay + 800}ms` }}></div>
    </div>
  </div>
);

// Stats section skeleton with enhanced loading states
export const StatsSectionSkeleton = ({ showPulse = true, showShimmer = true }) => (
  <section className="py-8 sm:py-10 md:py-12 lg:py-16 px-3 sm:px-4 md:px-6 lg:px-8 bg-gray-50">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-6 sm:mb-8 md:mb-10">
        <div className={`h-8 sm:h-10 md:h-12 bg-gray-200 rounded w-1/2 mx-auto mb-3 sm:mb-4 ${
          showPulse ? 'animate-pulse' : ''
        } ${showShimmer ? 'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer' : ''}`}></div>
        <div className={`h-4 sm:h-5 md:h-6 bg-gray-200 rounded w-3/4 mx-auto ${
          showPulse ? 'animate-pulse' : ''
        } ${showShimmer ? 'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer' : ''}`}></div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {[...Array(4)].map((_, index) => (
          <EnhancedStatsCardSkeleton 
            key={index} 
            delay={index * 100}
            showPulse={showPulse}
            showShimmer={showShimmer}
          />
        ))}
      </div>
      
      <div className="text-center">
        <div className={`h-4 bg-gray-200 rounded w-1/3 mx-auto ${
          showPulse ? 'animate-pulse' : ''
        } ${showShimmer ? 'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer' : ''}`}></div>
      </div>
      
      {/* Loading progress indicator */}
      <div className="mt-6 flex justify-center">
        <div className="flex space-x-1">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 bg-blue-400 rounded-full animate-bounce`}
              style={{ animationDelay: `${index * 0.1}s` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

// Hero section skeleton
export const HeroSectionSkeleton = () => (
  <section className="relative py-12 sm:py-16 md:py-20 lg:py-24 px-3 sm:px-4 md:px-6 lg:px-8 overflow-hidden">
    <div className="max-w-4xl mx-auto text-center relative z-10">
      <div className="h-12 sm:h-16 md:h-20 bg-gray-200 rounded w-3/4 mx-auto mb-4 sm:mb-6 animate-pulse"></div>
      <div className="space-y-2 mb-6 sm:mb-8">
        <div className="h-4 sm:h-5 md:h-6 bg-gray-200 rounded w-full mx-auto animate-pulse"></div>
        <div className="h-4 sm:h-5 md:h-6 bg-gray-200 rounded w-2/3 mx-auto animate-pulse"></div>
      </div>
      <div className="h-12 sm:h-14 bg-gray-200 rounded-lg w-48 mx-auto animate-pulse"></div>
    </div>
  </section>
);

// Header skeleton
export const HeaderSkeleton = () => (
  <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="flex justify-between items-center h-14 sm:h-16">
        <div className="flex items-center">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
    </div>
  </header>
);

// Full page skeleton
export const PublicHomepageSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
    <HeaderSkeleton />
    <main className="flex-1 relative">
      <HeroSectionSkeleton />
      <StatsSectionSkeleton />
    </main>
    <footer className="bg-white border-t border-gray-200 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="text-center space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-1/4 mx-auto animate-pulse"></div>
        </div>
      </div>
    </footer>
  </div>
);

// Error state component with enhanced graceful degradation
export const ErrorState = ({ 
  title = 'เกิดข้อผิดพลาด',
  message = 'ไม่สามารถโหลดข้อมูลได้',
  onRetry,
  showRetry = true,
  icon = '❗',
  errorType = 'general',
  hasData = false,
  dataAge = null,
  isRetrying = false
}) => {
  const getErrorIcon = (type) => {
    const icons = {
      network: '🌐',
      firestore: '🔌',
      permission: '🔒',
      quota: '⏳',
      general: '❗'
    };
    return icons[type] || icons.general;
  };



  return (
    <div className="text-center py-8 sm:py-12">
      <div className="text-4xl mb-4">{icon || getErrorIcon(errorType)}</div>
      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-gray-600 mb-4 max-w-md mx-auto">
        {message}
      </p>
      
      {/* Data availability indicator */}
      {hasData && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg max-w-md mx-auto">
          <div className="flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-700">
              แสดงข้อมูลล่าสุดที่มีอยู่
              {dataAge && (
                <span className="block text-xs text-blue-600 mt-1">
                  อัปเดตเมื่อ {new Intl.DateTimeFormat('th-TH', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }).format(new Date(Date.now() - dataAge))}
                </span>
              )}
            </p>
          </div>
        </div>
      )}
      
      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white transition-colors duration-200 ${
              isRetrying 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            {isRetrying ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                กำลังลองใหม่...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                ลองใหม่
              </>
            )}
          </button>
        )}
        
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          รีโหลดหน้า
        </button>
      </div>
      
      {/* Error type specific help */}
      {errorType === 'network' && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md mx-auto">
          <p className="text-sm text-yellow-700">
            💡 ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต หรือลองใช้เครือข่ายอื่น
          </p>
        </div>
      )}
      
      {errorType === 'quota' && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md mx-auto">
          <p className="text-sm text-yellow-700">
            ⏰ ระบบมีผู้ใช้งานจำนวนมาก กรุณาลองใหม่ในอีกสักครู่
          </p>
        </div>
      )}
    </div>
  );
};

// Offline indicator component
export const OfflineIndicator = ({ message, onRetry }) => (
  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
    <div className="flex">
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="ml-3 flex-1">
        <p className="text-sm text-yellow-700">
          {message}
        </p>
        {onRetry && (
          <div className="mt-2">
            <button
              onClick={onRetry}
              className="text-sm text-yellow-600 hover:text-yellow-800 underline font-medium transition-colors duration-200"
            >
              ลองเชื่อมต่อใหม่
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
);

// Loading overlay component
export const LoadingOverlay = ({ message = 'กำลังโหลด...' }) => (
  <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  </div>
);

const LoadingSkeleton = {
  StatsCardSkeleton,
  StatsSectionSkeleton,
  HeroSectionSkeleton,
  HeaderSkeleton,
  PublicHomepageSkeleton,
  ErrorState,
  OfflineIndicator,
  LoadingOverlay
};

export default LoadingSkeleton;