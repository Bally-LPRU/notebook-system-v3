import React, { useState, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
// Optimized imports for better tree shaking
import ComputerDesktopIcon from '@heroicons/react/24/outline/ComputerDesktopIcon';
import CheckCircleIcon from '@heroicons/react/24/outline/CheckCircleIcon';
import ClockIcon from '@heroicons/react/24/outline/ClockIcon';
import CalendarDaysIcon from '@heroicons/react/24/outline/CalendarDaysIcon';
import { useAuth } from '../../contexts/AuthContext';
import Header from './Header';
import HeroSection from './HeroSection';
import Footer from './Footer';
import StatsCard from './StatsCard';
import usePublicStats from '../../hooks/usePublicStats';
import useLunchBreak from '../../hooks/useLunchBreak';
import PublicHomepageErrorBoundary from './PublicHomepageErrorBoundary';
import { 
  OfflineIndicator, 
  LoadingOverlay,
  StatsSectionSkeleton 
} from './LoadingSkeleton';
import performanceMonitor from '../../utils/performanceMonitor';

const PublicHomepageContent = memo(() => {
  const navigate = useNavigate();
  const { 
    stats, 
    loading, 
    error, 
    isRefreshing, 
    isOnline, 
    wasOffline, 
    refreshStats, 
    retryWhenOnline 
  } = usePublicStats();
  const { signIn, user, userProfile, needsProfileSetup } = useAuth();
  const { lunchBreak, lunchBreakDisplay, lunchBreakMessage, loading: lunchBreakLoading } = useLunchBreak();
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Performance monitoring
  useEffect(() => {
    performanceMonitor.startTiming('public_homepage_mount');
    
    return () => {
      performanceMonitor.endTiming('public_homepage_mount');
    };
  }, []);

  const handleLoginClick = async () => {
    try {
      setAuthLoading(true);
      setAuthError(null);
      
      console.log('🔐 Login button clicked');
      
      // Call signIn directly without AuthFixer
      await signIn();
      
      console.log('✅ SignIn called successfully');
      
      // Redirect logic after successful authentication
      // If user is already authenticated, redirect based on their status
      if (user) {
        if (needsProfileSetup()) {
          // User will be redirected to profile setup by App.js
          return;
        } else if (userProfile?.status === 'approved') {
          navigate('/');
        } else {
          // User will see pending approval screen handled by App.js
          return;
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle specific authentication error scenarios
      let errorMessage = error.message;
      let errorType = 'error';
      
      // Check for authentication cancelled scenarios
      if (error.message?.includes('popup') && error.message?.includes('blocked')) {
        errorMessage = 'หน้าต่างการเข้าสู่ระบบถูกบล็อก';
        errorType = 'popup-blocked';
      }
      // Check for popup closed by user
      else if (error.message?.includes('popup') && error.message?.includes('closed')) {
        errorMessage = 'หน้าต่างการเข้าสู่ระบบถูกปิด กรุณาลองใหม่';
        errorType = 'popup-closed';
      }
      // Check for authentication cancelled
      else if (error.message?.includes('cancelled') || error.message?.includes('ยกเลิก')) {
        errorMessage = 'การเข้าสู่ระบบถูกยกเลิก';
        errorType = 'cancelled';
      }
      // Check for email domain validation
      else if (
        error.message?.includes('อีเมล') && (
          error.message?.includes('อนุญาต') ||
          error.message?.includes('@gmail.com') ||
          error.message?.includes('@g.lpru.ac.th')
        )
      ) {
        errorMessage = error.message; // Use the specific domain validation message
        errorType = 'domain-validation';
      }
      // Check for network errors
      else if (error.message?.includes('network') || error.message?.includes('เชื่อมต่อ')) {
        errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองใหม่';
        errorType = 'network';
      }
      
      setAuthError({ message: errorMessage, type: errorType });
    } finally {
      setAuthLoading(false);
    }
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  // Statistics card configurations - memoized for performance
  const statsCards = React.useMemo(() => [
    {
      title: 'อุปกรณ์ทั้งหมด',
      value: stats?.totalEquipment || 0,
      icon: <ComputerDesktopIcon className="w-6 h-6" />,
      color: 'blue'
    },
    {
      title: 'พร้อมใช้งาน',
      value: stats?.availableEquipment || 0,
      icon: <CheckCircleIcon className="w-6 h-6" />,
      color: 'green'
    },
    {
      title: 'กำลังถูกยืม',
      value: stats?.borrowedEquipment || 0,
      icon: <ClockIcon className="w-6 h-6" />,
      color: 'orange'
    },
    {
      title: 'รอการอนุมัติ',
      value: stats?.pendingReservations || 0,
      icon: <CalendarDaysIcon className="w-6 h-6" />,
      color: 'purple'
    }
  ], [stats]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      <Header onLoginClick={handleLoginClick} isLoading={authLoading} />
      
      <main className="flex-1 relative">
        <HeroSection 
          title="ระบบยืม-คืนอุปกรณ์"
          subtitle="จัดการการยืม-คืนอุปกรณ์อย่างมีประสิทธิภาพ ตรวจสอบสถานะอุปกรณ์และจองล่วงหน้าได้ง่ายๆ"
        />
        
        {/* Lunch Break Notice - แสดงเวลาพักกลางวันอย่างชัดเจน */}
        {!lunchBreakLoading && lunchBreak.enabled && (
          <section className="py-4 px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-orange-400 rounded-r-xl shadow-sm overflow-hidden">
                <div className="p-4 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-orange-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <h3 className="text-lg sm:text-xl font-bold text-orange-800">
                          🍽️ เวลาพักกลางวัน
                        </h3>
                        <div className="inline-flex items-center px-3 py-1.5 bg-orange-100 rounded-full">
                          <svg className="w-4 h-4 text-orange-600 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm sm:text-base font-semibold text-orange-700">
                            {lunchBreakDisplay || '12:00 - 13:00 น.'}
                          </span>
                        </div>
                      </div>
                      <p className="mt-2 text-sm sm:text-base text-orange-700">
                        {lunchBreakMessage || `ห้องให้บริการยืม-คืนอุปกรณ์ปิดให้บริการในช่วงเวลาพักกลางวัน ${lunchBreakDisplay || '12:00 - 13:00 น.'}`}
                      </p>
                      <p className="mt-1 text-xs sm:text-sm text-orange-600">
                        {'กรุณาวางแผนการรับ-คืนอุปกรณ์ให้อยู่นอกช่วงเวลาดังกล่าว'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
        
        {/* Authentication Error Display */}
        {authError && (
          <section className="py-3 sm:py-4 px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className={`border rounded-xl p-3 sm:p-4 shadow-sm ${
                authError.type === 'domain-validation' 
                  ? 'bg-yellow-50 border-yellow-200' 
                  : authError.type === 'cancelled'
                  ? 'bg-gray-50 border-gray-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {authError.type === 'domain-validation' ? (
                      <svg className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    ) : authError.type === 'cancelled' ? (
                      <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-2 sm:ml-3 flex-1 min-w-0">
                    <p className={`text-xs sm:text-sm ${
                      authError.type === 'domain-validation' 
                        ? 'text-yellow-800' 
                        : authError.type === 'cancelled'
                        ? 'text-gray-800'
                        : 'text-red-800'
                    }`}>
                      {authError.message}
                    </p>
                    
                    {/* Additional help text for specific error types */}
                    
                    {authError.type === 'domain-validation' && (
                      <div className="mt-1 sm:mt-2">
                        <p className="text-xs text-yellow-600">
                          อีเมลที่ได้รับอนุญาต: @gmail.com หรือ @g.lpru.ac.th
                        </p>
                      </div>
                    )}
                    
                    {authError.type === 'popup-blocked' && (
                      <div className="mt-1 sm:mt-2 space-y-1">
                        <p className="text-xs text-gray-600">
                          คลิกที่ไอคอนป๊อปอัพที่ถูกบล็อกบริเวณแถบที่อยู่ แล้วเลือกอนุญาตป๊อปอัพจากระบบนี้
                        </p>
                        <p className="text-xs text-gray-600">
                          หากยังไม่สามารถเข้าสู่ระบบได้ ให้ปิดตัวบล็อกป๊อปอัพหรือเปิดหน้าเว็บนี้ในหน้าต่างใหม่
                        </p>
                      </div>
                    )}

                    {authError.type === 'network' && (
                      <div className="mt-1 sm:mt-2">
                        <button
                          onClick={handleLoginClick}
                          className="text-xs text-blue-600 hover:text-blue-800 underline font-medium transition-colors duration-200"
                        >
                          ลองเข้าสู่ระบบอีกครั้ง
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="ml-2 sm:ml-3 flex-shrink-0">
                    <button
                      onClick={clearAuthError}
                      aria-label="Close notification | ปิดข้อความแจ้งเตือน"
                      className={`inline-flex p-1 rounded-lg transition-colors duration-200 ${
                        authError.type === 'domain-validation' 
                          ? 'text-yellow-400 hover:text-yellow-600 hover:bg-yellow-100' 
                          : authError.type === 'cancelled'
                          ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                          : 'text-red-400 hover:text-red-600 hover:bg-red-100'
                      }`}
                    >
                      <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
        
        {/* Statistics section */}
        <section id="stats" className="py-8 sm:py-10 md:py-12 lg:py-16 px-3 sm:px-4 md:px-6 lg:px-8 bg-gray-50 relative">
          {/* Loading overlay for refresh */}
          {isRefreshing && (
            <LoadingOverlay message="กำลังอัปเดตข้อมูล..." />
          )}
          
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-6 sm:mb-8 md:mb-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                สถิติอุปกรณ์
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                ข้อมูลภาพรวมของระบบยืม-คืนอุปกรณ์
              </p>
              
              {/* Offline indicator */}
              {!isOnline && (
                <div className="mt-4 sm:mt-6 max-w-2xl mx-auto">
                  <OfflineIndicator 
                    message="ไม่มีการเชื่อมต่ออินเทอร์เน็ต - แสดงข้อมูลล่าสุดที่มีอยู่"
                    onRetry={() => retryWhenOnline(refreshStats)}
                  />
                </div>
              )}
              
              {/* Reconnection indicator */}
              {wasOffline && isOnline && (
                <div className="mt-4 sm:mt-6 max-w-2xl mx-auto">
                  <div className="bg-green-50 border-l-4 border-green-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-green-700">
                          เชื่อมต่ออินเทอร์เน็ตแล้ว - กำลังอัปเดตข้อมูล
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Error indicator */}
              {error && !loading && (
                <div className="mt-4 sm:mt-6 max-w-2xl mx-auto">
                  <div className={`p-3 sm:p-4 rounded-lg border ${
                    stats?.isOffline 
                      ? 'bg-yellow-50 border-yellow-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className={`h-5 w-5 ${
                          stats?.isOffline ? 'text-yellow-400' : 'text-red-400'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className={`text-sm sm:text-base ${
                          stats?.isOffline ? 'text-yellow-800' : 'text-red-800'
                        }`}>
                          {error}
                        </p>
                        <div className="mt-2">
                          <button 
                            onClick={refreshStats}
                            disabled={isRefreshing}
                            className={`text-sm font-medium underline transition-colors duration-200 ${
                              stats?.isOffline 
                                ? 'text-yellow-600 hover:text-yellow-800' 
                                : 'text-red-600 hover:text-red-800'
                            } ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {isRefreshing ? 'กำลังลองใหม่...' : 'ลองใหม่'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Statistics cards or loading skeleton */}
            {loading && !stats ? (
              <StatsSectionSkeleton />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                  {statsCards.map((card, index) => (
                    <StatsCard
                      key={index}
                      title={card.title}
                      value={card.value}
                      icon={card.icon}
                      color={card.color}
                      loading={loading}
                      error={stats?.hasError}
                      offline={stats?.isOffline}
                      degradedMode={stats?.degradedMode}
                      dataAge={stats?.dataAge}
                      errorType={stats?.errorType}
                    />
                  ))}
                </div>
                
                {/* Last updated info */}
                {stats?.lastUpdated && !loading && (
                  <div className="text-center">
                    <p className={`text-xs sm:text-sm bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 inline-block border ${
                      stats.isOffline 
                        ? 'text-yellow-600 border-yellow-200' 
                        : stats.hasError 
                        ? 'text-orange-600 border-orange-200'
                        : 'text-gray-500 border-gray-200'
                    }`}>
                      {stats.isOffline && '📱 '}
                      {stats.hasError && !stats.isOffline && '⚠️ '}
                      อัปเดตล่าสุด: {new Intl.DateTimeFormat('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }).format(stats.lastUpdated)}
                      {stats.isOffline && ' (ออฟไลน์)'}
                      {stats.hasError && !stats.isOffline && ' (ข้อมูลเก่า)'}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
});

// Main component with error boundary
const PublicHomepage = () => {
  const handleError = (error, errorInfo, errorAnalysis) => {
    console.error('PublicHomepage Error:', { error, errorInfo, errorAnalysis });
    
    // Log to analytics if available
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: `PublicHomepage: ${error.toString()}`,
        fatal: false,
        error_type: errorAnalysis.type,
        error_category: errorAnalysis.category
      });
    }
  };

  const handleRetry = (retryCount) => {
    console.log(`PublicHomepage retry attempt: ${retryCount}`);
  };

  return (
    <PublicHomepageErrorBoundary 
      onError={handleError}
      onRetry={handleRetry}
    >
      <PublicHomepageContent />
    </PublicHomepageErrorBoundary>
  );
};

export default PublicHomepage;