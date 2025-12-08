import React from 'react';
import { logError } from '../../utils/errorLogger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      eventId: null,
      errorType: null,
      isRecoverable: false,
      retryCount: 0,
      isRetrying: false
    };
    this.retryTimeouts = [];
  }

  static getDerivedStateFromError(error) {
    // Analyze error type and determine if it's recoverable
    const errorAnalysis = ErrorBoundary.analyzeError(error);
    
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      errorType: errorAnalysis.type,
      isRecoverable: errorAnalysis.isRecoverable
    };
  }

  static analyzeError(error) {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code || '';

    // Firebase configuration errors
    if (errorMessage.includes('firebase configuration') || 
        errorMessage.includes('missing required environment') ||
        errorMessage.includes('invalid environment variables')) {
      return {
        type: 'firebase_config',
        isRecoverable: false,
        category: 'configuration'
      };
    }

    // Firebase Analytics/Performance errors
    if (errorMessage.includes('analytics') || 
        errorMessage.includes('performance') ||
        errorCode.includes('analytics') ||
        errorCode.includes('performance') ||
        errorMessage.includes('optional service')) {
      return {
        type: 'firebase_optional',
        isRecoverable: true,
        category: 'optional_services'
      };
    }

    // Firebase initialization errors
    if (errorMessage.includes('firebase') && 
        (errorMessage.includes('initialization') || 
         errorMessage.includes('failed to initialize') ||
         errorCode.startsWith('app/'))) {
      return {
        type: 'firebase_init',
        isRecoverable: true,
        category: 'initialization'
      };
    }

    // Firebase Authentication errors
    if ((typeof errorCode === 'string' && errorCode.startsWith('auth/')) || 
        errorMessage.includes('authentication') ||
        errorMessage.includes('google auth')) {
      return {
        type: 'firebase_auth',
        isRecoverable: true,
        category: 'authentication'
      };
    }

    // Network connectivity errors
    if (errorMessage.includes('network') || 
        errorMessage.includes('fetch') ||
        errorMessage.includes('connection') ||
        errorCode === 'unavailable') {
      return {
        type: 'network',
        isRecoverable: true,
        category: 'connectivity'
      };
    }

    if (errorMessage.includes('unknown error') ||
        errorMessage.includes('unexpected error')) {
      return {
        type: 'unknown',
        isRecoverable: true,
        category: 'general'
      };
    }

    // React/Component errors
    if (errorMessage.includes('component') ||
      errorMessage.includes('render') ||
      errorMessage.includes('hook') ||
      errorMessage.includes('cannot read') ||
        errorMessage.includes('undefined')) {
      return {
        type: 'react_component',
        isRecoverable: true,
        category: 'component'
      };
    }

    // Default unknown error
    return {
      type: 'unknown',
      isRecoverable: true,
      category: 'general'
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details with enhanced Firebase-specific information
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    const errorAnalysis = ErrorBoundary.analyzeError(error);
    
    this.setState({
      error,
      errorInfo,
      errorType: errorAnalysis.type,
      isRecoverable: errorAnalysis.isRecoverable
    });

    // Log to error logger
    logError({
      type: 'component_error',
      error: error,
      errorInfo: errorInfo,
      errorAnalysis: errorAnalysis,
      context: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        retryCount: this.state.retryCount
      },
      severity: errorAnalysis.isRecoverable ? 'medium' : 'high',
      category: errorAnalysis.category
    });

    // Auto-retry for recoverable errors
    if (errorAnalysis.isRecoverable && errorAnalysis.category !== 'configuration') {
      setTimeout(() => {
        this.handleAutoRetry();
      }, 1000);
    }

    // Enhanced logging for Firebase errors
    if (errorAnalysis.category === 'configuration') {
      console.error('🚨 Firebase Configuration Error - Check environment variables');
    } else if (errorAnalysis.category === 'initialization') {
      console.error('🚨 Firebase Initialization Error - Service may be unavailable');
    } else if (errorAnalysis.category === 'authentication') {
      console.error('🚨 Firebase Authentication Error - Login functionality affected');
    } else if (errorAnalysis.category === 'optional_services') {
      console.warn('⚠️  Firebase Optional Service Error - Core functionality unaffected');
    }

    // Log to external service (e.g., Sentry, LogRocket, etc.)
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorAnalysis);
    }

    // Log to Firebase Analytics or other analytics service (if available)
    if (window.gtag && errorAnalysis.category !== 'optional_services') {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: !errorAnalysis.isRecoverable,
        error_type: errorAnalysis.type,
        error_category: errorAnalysis.category
      });
    }
  }

  componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.children !== this.props.children) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        eventId: null,
        errorType: null,
        isRecoverable: false
      });
    }
  }

  handleRetry = () => {
    const newRetryCount = this.state.retryCount + 1;
    
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      eventId: null,
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
    const maxAutoRetries = 2;
    const retryDelay = 2000; // 2 seconds
    
    if (this.state.retryCount < maxAutoRetries && this.state.isRecoverable) {
      this.setState({ isRetrying: true });
      
      const timeout = setTimeout(() => {
        this.handleRetry();
      }, retryDelay);
      
      this.retryTimeouts.push(timeout);
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  getFirebaseErrorMessage = (errorType, error) => {
    const errorMessages = {
      firebase_config: {
        title: 'ปัญหาการตั้งค่าระบบ',
        message: 'ระบบไม่สามารถเชื่อมต่อกับฐานข้อมูลได้ เนื่องจากการตั้งค่าไม่ถูกต้อง',
        details: 'กรุณาติดต่อผู้ดูแลระบบเพื่อตรวจสอบการตั้งค่า Firebase',
        icon: '⚙️',
        recoverable: false
      },
      firebase_init: {
        title: 'ปัญหาการเชื่อมต่อระบบ',
        message: 'ไม่สามารถเชื่อมต่อกับระบบฐานข้อมูลได้ในขณะนี้',
        details: 'กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองใหม่อีกครั้ง',
        icon: '🔌',
        recoverable: true
      },
      firebase_auth: {
        title: 'ปัญหาการเข้าสู่ระบบ',
        message: 'เกิดข้อผิดพลาดในระบบการเข้าสู่ระบบ',
        details: 'กรุณาลองเข้าสู่ระบบใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบหากปัญหายังคงเกิดขึ้น',
        icon: '🔐',
        recoverable: true
      },
      firebase_optional: {
        title: 'บริการเสริมไม่พร้อมใช้งาน',
        message: 'บริการเสริมบางส่วนไม่สามารถใช้งานได้ แต่ระบบหลักยังคงทำงานปกติ',
        details: 'คุณสามารถใช้งานระบบต่อไปได้ตามปกติ',
        icon: '📊',
        recoverable: true
      },
      network: {
        title: 'ปัญหาการเชื่อมต่ออินเทอร์เน็ต',
        message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
        details: 'กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองใหม่อีกครั้ง',
        icon: '🌐',
        recoverable: true
      },
      react_component: {
        title: 'ปัญหาการแสดงผล',
        message: 'เกิดข้อผิดพลาดในการแสดงผลหน้าเว็บ',
        details: 'กรุณารีโหลดหน้าเว็บหรือลองใหม่อีกครั้ง',
        icon: '⚛️',
        recoverable: true
      },
      unknown: {
        title: 'เกิดข้อผิดพลาด',
        message: 'ขออภัย เกิดข้อผิดพลาดที่ไม่คาดคิด',
        details: 'กรุณาลองใหม่อีกครั้ง หากปัญหายังคงเกิดขึ้น กรุณาติดต่อผู้ดูแลระบบ',
        icon: '❗',
        recoverable: true
      }
    };

    return errorMessages[errorType] || errorMessages.unknown;
  };

  render() {
    if (this.state.isRetrying) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
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
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.errorInfo, this.handleRetry);
      }

      // Default fallback UI with Firebase-specific error handling
      const errorInfo = this.getFirebaseErrorMessage(this.state.errorType, this.state.error);
      
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="mx-auto h-16 w-16 text-red-500 mb-6 flex items-center justify-center">
              {this.state.errorType === 'firebase_config' ? (
                <div className="text-4xl">{errorInfo.icon}</div>
              ) : this.state.errorType === 'firebase_auth' ? (
                <div className="text-4xl">{errorInfo.icon}</div>
              ) : this.state.errorType === 'network' ? (
                <div className="text-4xl">{errorInfo.icon}</div>
              ) : (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              )}
            </div>
            
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
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

                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-left">
                    <h3 className="text-sm font-medium text-red-800 mb-2">
                      Error Details (Development Mode):
                    </h3>
                    <pre className="text-xs text-red-700 whitespace-pre-wrap overflow-auto max-h-32">
                      {this.state.error.toString()}
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {this.state.isRecoverable && (
                    <button
                      onClick={this.handleRetry}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                    className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
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

                  {this.state.errorType === 'firebase_config' && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            ปัญหานี้ต้องการการแก้ไขจากผู้ดูแลระบบ การรีโหลดหน้าเว็บอาจไม่สามารถแก้ไขปัญหาได้
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 text-sm text-gray-500">
                  {this.state.retryCount > 0 && (
                    <p className="mb-2 text-blue-600">
                      ระบบได้ลองแก้ไขปัญหาแล้ว {this.state.retryCount} ครั้ง
                    </p>
                  )}
                  <p>
                    หากปัญหายังคงเกิดขึ้น กรุณาติดต่อผู้ดูแลระบบ
                  </p>
                  {this.state.eventId && (
                    <p className="mt-2 font-mono text-xs">
                      Error ID: {this.state.eventId}
                    </p>
                  )}
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

// Higher-order component for functional components
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Hook for error handling in functional components
export const useErrorHandler = () => {
  const handleError = (error, errorInfo) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo);
    
    // Log to external service
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      });
    }
  };

  return handleError;
};

// Async error boundary for handling promise rejections
export class AsyncErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AsyncErrorBoundary caught an error:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentDidMount() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  handleUnhandledRejection = (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    this.setState({
      hasError: true,
      error: new Error(`Unhandled promise rejection: ${event.reason}`)
    });
    
    // Prevent the default browser behavior
    event.preventDefault();
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                เกิดข้อผิดพลาดในการโหลดข้อมูล
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>กรุณาลองใหม่อีกครั้ง หากปัญหายังคงเกิดขึ้น กรุณาติดต่อผู้ดูแลระบบ</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;