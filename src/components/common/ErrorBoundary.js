import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      eventId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Log to external service (e.g., Sentry, LogRocket, etc.)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to Firebase Analytics or other analytics service
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      });
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      eventId: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.errorInfo, this.handleRetry);
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="mx-auto h-16 w-16 text-red-500 mb-6">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  เกิดข้อผิดพลาด
                </h2>
                
                <p className="text-gray-600 mb-6">
                  ขออภัย เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง
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
                  <button
                    onClick={this.handleRetry}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    ลองใหม่
                  </button>
                  
                  <button
                    onClick={this.handleReload}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    รีโหลดหน้า
                  </button>
                </div>

                <div className="mt-6 text-sm text-gray-500">
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