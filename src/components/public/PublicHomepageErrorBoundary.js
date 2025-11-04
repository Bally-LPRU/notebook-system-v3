import React from 'react';
import { logError } from '../../utils/errorLogger';

/**
 * Specialized error boundary for the public homepage
 * Provides user-friendly error messages and recovery options
 */
class PublicHomepageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorType: null,
      isRecoverable: false,
      retryCount: 0,
      isRetrying: false
    };
    this.retryTimeouts = [];
  }

  static getDerivedStateFromError(error) {
    const errorAnalysis = PublicHomepageErrorBoundary.analyzeError(error);
    
    return { 
      hasError: true,
      errorType: errorAnalysis.type,
      isRecoverable: errorAnalysis.isRecoverable
    };
  }

  static analyzeError(error) {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code || '';
    const errorStack = error?.stack?.toLowerCase() || '';
    const errorName = error?.name?.toLowerCase() || '';

    // Critical system errors (less recoverable)
    if (errorMessage.includes('out of memory') || 
        errorMessage.includes('maximum call stack') ||
        errorName === 'rangeerror') {
      return {
        type: 'system_critical',
        isRecoverable: false,
        category: 'system',
        severity: 'critical'
      };
    }

    // Statistics service errors
    if (errorMessage.includes('statistics') || 
        errorMessage.includes('สถิติ') ||
        errorStack.includes('statisticsservice')) {
      return {
        type: 'statistics_service',
        isRecoverable: true,
        category: 'data_loading',
        severity: 'medium'
      };
    }

    // Firebase/Firestore errors with specific handling
    if (errorCode.startsWith('firestore/') || 
        errorMessage.includes('firestore') ||
        errorMessage.includes('firebase')) {
      
      // Permission denied errors
      if (errorCode === 'firestore/permission-denied') {
        return {
          type: 'firebase_permission',
          isRecoverable: false,
          category: 'security',
          severity: 'high'
        };
      }
      
      // Quota exceeded errors
      if (errorCode === 'firestore/resource-exhausted') {
        return {
          type: 'firebase_quota',
          isRecoverable: true,
          category: 'resource',
          severity: 'high'
        };
      }
      
      // General Firebase errors
      return {
        type: 'firebase_data',
        isRecoverable: true,
        category: 'data_loading',
        severity: 'medium'
      };
    }

    // Network connectivity errors
    if (errorMessage.includes('network') || 
        errorMessage.includes('fetch') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('timeout') ||
        errorCode === 'unavailable') {
      return {
        type: 'network',
        isRecoverable: true,
        category: 'connectivity',
        severity: 'medium'
      };
    }

    // Authentication errors (should be handled gracefully)
    if (errorCode.startsWith('auth/') || 
        errorMessage.includes('authentication')) {
      return {
        type: 'authentication',
        isRecoverable: true,
        category: 'authentication',
        severity: 'low'
      };
    }

    // Component rendering errors
    if (errorStack.includes('react') || 
        errorMessage.includes('component') ||
        errorMessage.includes('render') ||
        errorMessage.includes('cannot read prop')) {
      return {
        type: 'component_render',
        isRecoverable: true,
        category: 'rendering',
        severity: 'medium'
      };
    }

    // JavaScript runtime errors
    if (errorName === 'typeerror' || 
        errorName === 'referenceerror' ||
        errorMessage.includes('undefined') ||
        errorMessage.includes('null')) {
      return {
        type: 'javascript_runtime',
        isRecoverable: true,
        category: 'runtime',
        severity: 'medium'
      };
    }

    // Chunk loading errors (common in SPAs)
    if (errorMessage.includes('loading chunk') ||
        errorMessage.includes('loading css chunk')) {
      return {
        type: 'chunk_loading',
        isRecoverable: true,
        category: 'loading',
        severity: 'medium'
      };
    }

    // Default unknown error
    return {
      type: 'unknown',
      isRecoverable: true,
      category: 'general',
      severity: 'medium'
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('PublicHomepageErrorBoundary caught an error:', error, errorInfo);
    
    const errorAnalysis = PublicHomepageErrorBoundary.analyzeError(error);
    
    this.setState({
      error,
      errorInfo,
      errorType: errorAnalysis.type,
      isRecoverable: errorAnalysis.isRecoverable
    });

    // Log error with context
    logError({
      type: 'public_homepage_error',
      error: error,
      errorInfo: errorInfo,
      errorAnalysis: errorAnalysis,
      context: {
        componentStack: errorInfo.componentStack,
        errorBoundary: 'PublicHomepageErrorBoundary',
        retryCount: this.state.retryCount,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        onlineStatus: navigator.onLine,
        localStorage: this.getLocalStorageInfo(),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      },
      severity: errorAnalysis.isRecoverable ? 'medium' : 'high',
      category: errorAnalysis.category
    });

    // Auto-retry for recoverable errors with exponential backoff
    if (errorAnalysis.isRecoverable && this.state.retryCount < 3) {
      const retryDelay = Math.min(2000 * Math.pow(2, this.state.retryCount), 10000);
      setTimeout(() => {
        this.handleAutoRetry();
      }, retryDelay);
    }

    // Call onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorAnalysis);
    }
  }

  getLocalStorageInfo() {
    try {
      const equipmentStats = localStorage.getItem('equipmentStats');
      return {
        hasEquipmentStats: !!equipmentStats,
        equipmentStatsSize: equipmentStats ? equipmentStats.length : 0,
        storageAvailable: typeof Storage !== 'undefined'
      };
    } catch (e) {
      return {
        hasEquipmentStats: false,
        equipmentStatsSize: 0,
        storageAvailable: false,
        error: e.message
      };
    }
  }

  componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  handleRetry = () => {
    const newRetryCount = this.state.retryCount + 1;
    
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorType: null,
      isRecoverable: false,
      retryCount: newRetryCount,
      isRetrying: false
    });

    // Call onRetry prop if provided
    if (this.props.onRetry) {
      this.props.onRetry(newRetryCount);
    }
  };

  handleAutoRetry = () => {
    if (this.state.retryCount < 2 && this.state.isRecoverable) {
      this.setState({ isRetrying: true });
      
      const timeout = setTimeout(() => {
        this.handleRetry();
      }, 1000);
      
      this.retryTimeouts.push(timeout);
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  getErrorMessage = (errorType) => {
    const errorMessages = {
      system_critical: {
        title: 'ระบบขัดข้อง',
        message: 'เกิดข้อผิดพลาดร้ายแรงในระบบ',
        details: 'กรุณารีโหลดหน้าเว็บ หากปัญหายังคงเกิดขึ้น กรุณาปิดแท็บนี้และเปิดใหม่',
        icon: '🚨',
        recoverable: false,
        actions: ['reload', 'contact']
      },
      statistics_service: {
        title: 'ไม่สามารถโหลดข้อมูลสถิติได้',
        message: 'เกิดปัญหาในการโหลดข้อมูลสถิติอุปกรณ์',
        details: 'ระบบจะแสดงข้อมูลล่าสุดที่มีอยู่ กรุณาลองรีเฟรชหน้าเว็บ',
        icon: '📊',
        recoverable: true,
        actions: ['retry', 'reload']
      },
      firebase_data: {
        title: 'ปัญหาการเชื่อมต่อฐานข้อมูล',
        message: 'ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้ในขณะนี้',
        details: 'กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองใหม่อีกครั้ง',
        icon: '🔌',
        recoverable: true,
        actions: ['retry', 'reload']
      },
      firebase_permission: {
        title: 'ไม่มีสิทธิ์เข้าถึงข้อมูล',
        message: 'ระบบไม่อนุญาตให้เข้าถึงข้อมูลในขณะนี้',
        details: 'อาจเป็นปัญหาชั่วคราว กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ',
        icon: '🔒',
        recoverable: false,
        actions: ['reload', 'contact']
      },
      firebase_quota: {
        title: 'ระบบใช้งานหนักเกินไป',
        message: 'ระบบมีผู้ใช้งานจำนวนมากในขณะนี้',
        details: 'กรุณารอสักครู่แล้วลองใหม่ หรือลองใช้งานในเวลาอื่น',
        icon: '⏳',
        recoverable: true,
        actions: ['retry', 'reload']
      },
      network: {
        title: 'ปัญหาการเชื่อมต่ออินเทอร์เน็ต',
        message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
        details: 'กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองใหม่อีกครั้ง',
        icon: '🌐',
        recoverable: true,
        actions: ['retry', 'reload']
      },
      authentication: {
        title: 'ปัญหาระบบการเข้าสู่ระบบ',
        message: 'เกิดข้อผิดพลาดในระบบการเข้าสู่ระบบ',
        details: 'คุณยังสามารถดูข้อมูลสถิติได้ แต่การเข้าสู่ระบบอาจไม่ทำงาน',
        icon: '🔐',
        recoverable: true,
        actions: ['retry']
      },
      component_render: {
        title: 'ปัญหาการแสดงผล',
        message: 'เกิดข้อผิดพลาดในการแสดงผลหน้าเว็บ',
        details: 'กรุณารีโหลดหน้าเว็บเพื่อแก้ไขปัญหา',
        icon: '⚛️',
        recoverable: true,
        actions: ['retry', 'reload']
      },
      javascript_runtime: {
        title: 'ข้อผิดพลาดในการทำงาน',
        message: 'เกิดข้อผิดพลาดในการประมวลผลข้อมูล',
        details: 'กรุณาลองรีโหลดหน้าเว็บ หรือลองใช้เบราว์เซอร์อื่น',
        icon: '⚙️',
        recoverable: true,
        actions: ['retry', 'reload']
      },
      chunk_loading: {
        title: 'ปัญหาการโหลดไฟล์',
        message: 'ไม่สามารถโหลดไฟล์ระบบได้สมบูรณ์',
        details: 'กรุณารีโหลดหน้าเว็บเพื่อโหลดไฟล์ใหม่',
        icon: '📦',
        recoverable: true,
        actions: ['reload']
      },
      unknown: {
        title: 'เกิดข้อผิดพลาด',
        message: 'ขออภัย เกิดข้อผิดพลาดที่ไม่คาดคิด',
        details: 'กรุณาลองรีโหลดหน้าเว็บ หากปัญหายังคงเกิดขึ้น กรุณาติดต่อผู้ดูแลระบบ',
        icon: '❗',
        recoverable: true,
        actions: ['retry', 'reload', 'contact']
      }
    };

    return errorMessages[errorType] || errorMessages.unknown;
  };

  render() {
    if (this.state.isRetrying) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center py-12 px-4">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 py-8 px-6">
              <div className="text-center">
                <div className="mx-auto mb-6">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
                
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  กำลังลองแก้ไขปัญหา...
                </h2>
                
                <p className="text-gray-600">
                  ระบบกำลังพยายามแก้ไขปัญหาโดยอัตโนมัติ กรุณารอสักครู่
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (this.state.hasError) {
      const errorInfo = this.getErrorMessage(this.state.errorType);
      
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center py-12 px-4">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">{errorInfo.icon}</div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 py-8 px-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {errorInfo.title}
                </h2>
                
                <p className="text-gray-600 mb-4">
                  {errorInfo.message}
                </p>

                <p className="text-sm text-gray-500 mb-6">
                  {errorInfo.details}
                </p>

                {/* Show retry count if there have been attempts */}
                {this.state.retryCount > 0 && (
                  <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      ระบบได้ลองแก้ไขปัญหาแล้ว {this.state.retryCount} ครั้ง
                    </p>
                  </div>
                )}

                {/* Development mode error details */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-left">
                    <h3 className="text-sm font-medium text-red-800 mb-2">
                      Error Details (Development Mode):
                    </h3>
                    <pre className="text-xs text-red-700 whitespace-pre-wrap overflow-auto max-h-32">
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {this.state.isRecoverable && (
                    <button
                      onClick={this.handleRetry}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      ลองใหม่
                      {this.state.retryCount > 0 && (
                        <span className="ml-1 text-xs opacity-75">
                          ({this.state.retryCount})
                        </span>
                      )}
                    </button>
                  )}
                  
                  <button
                    onClick={this.handleReload}
                    className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 ${
                      this.state.isRecoverable 
                        ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50' 
                        : 'border-transparent text-white bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    รีโหลดหน้า
                  </button>
                </div>

                {/* Additional help for specific error types */}
                {this.state.errorType === 'network' && (
                  <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          ตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของคุณ หรือลองใช้เครือข่ายอื่น
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 text-sm text-gray-500">
                  <p>
                    หากปัญหายังคงเกิดขึ้น กรุณาติดต่อผู้ดูแลระบบ
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default PublicHomepageErrorBoundary;