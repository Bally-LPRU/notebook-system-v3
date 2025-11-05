/**
 * Enhanced Error Boundary with Retry Functionality
 * Provides comprehensive error handling with manual retry buttons and form data preservation
 */

import React from 'react';
import { ErrorClassifier, ERROR_TYPES } from '../../utils/errorClassification';
import { RetryHandler } from '../../utils/retryHandler';
import { logError } from '../../utils/errorLogger';

class EnhancedErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      classification: null,
      errorMessage: null,
      retryCount: 0,
      isRetrying: false,
      preservedData: null
    };
    
    this.retryHandler = new RetryHandler();
    this.retryTimeouts = [];
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('EnhancedErrorBoundary caught an error:', error, errorInfo);
    
    // Classify the error
    const classification = ErrorClassifier.classify(error, {
      operation: this.props.operation || 'component_render',
      component: this.props.componentName || 'unknown'
    });
    
    const errorMessage = ErrorClassifier.getErrorMessage(classification);
    
    this.setState({
      error,
      errorInfo,
      classification,
      errorMessage
    });

    // Preserve form data if available
    this._preserveFormData();

    // Log the error
    logError({
      type: 'enhanced_error_boundary',
      error: error,
      errorInfo: errorInfo,
      context: {
        componentStack: errorInfo.componentStack,
        classification,
        retryCount: this.state.retryCount,
        componentName: this.props.componentName
      },
      severity: classification.severity,
      category: classification.category
    });

    // Auto-retry for certain error types
    if (this._shouldAutoRetry(classification)) {
      setTimeout(() => {
        this._handleAutoRetry();
      }, classification.retryDelay || 2000);
    }

    // Call onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo, classification);
    }
  }

  componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  /**
   * Preserve form data from context or props
   */
  _preserveFormData() {
    try {
      // Try to get form data from props
      if (this.props.formData) {
        this.setState({ preservedData: this.props.formData });
        return;
      }

      // Try to get form data from DOM
      const forms = document.querySelectorAll('form');
      if (forms.length > 0) {
        const formData = {};
        const form = forms[0]; // Get first form
        
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
          if (input.name && input.value) {
            formData[input.name] = input.value;
          }
        });
        
        if (Object.keys(formData).length > 0) {
          this.setState({ preservedData: formData });
          
          // Store in localStorage as backup
          localStorage.setItem('preserved_form_data', JSON.stringify({
            data: formData,
            timestamp: Date.now(),
            component: this.props.componentName
          }));
        }
      }
    } catch (preserveError) {
      console.warn('Failed to preserve form data:', preserveError);
    }
  }

  /**
   * Check if error should be auto-retried
   */
  _shouldAutoRetry(classification) {
    return (
      classification.retryable &&
      this.state.retryCount < 2 && // Max 2 auto-retries
      (classification.type === ERROR_TYPES.NETWORK ||
       classification.type === ERROR_TYPES.FIRESTORE_UNAVAILABLE)
    );
  }

  /**
   * Handle automatic retry
   */
  _handleAutoRetry = () => {
    if (this.state.retryCount >= 2) {
      return;
    }

    this.setState({ 
      isRetrying: true,
      retryCount: this.state.retryCount + 1
    });

    const timeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        classification: null,
        errorMessage: null,
        isRetrying: false
      });

      // Call onRetry prop if provided
      if (this.props.onRetry) {
        this.props.onRetry(this.state.retryCount + 1, 'auto');
      }
    }, 1000);

    this.retryTimeouts.push(timeout);
  };

  /**
   * Handle manual retry
   */
  _handleManualRetry = () => {
    const newRetryCount = this.state.retryCount + 1;
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      classification: null,
      errorMessage: null,
      retryCount: newRetryCount,
      isRetrying: false
    });

    // Restore form data if available
    if (this.state.preservedData && this.props.onDataRestore) {
      this.props.onDataRestore(this.state.preservedData);
    }

    // Call onRetry prop if provided
    if (this.props.onRetry) {
      this.props.onRetry(newRetryCount, 'manual');
    }
  };

  /**
   * Handle page reload
   */
  _handleReload = () => {
    // Store preserved data before reload
    if (this.state.preservedData) {
      localStorage.setItem('preserved_form_data_reload', JSON.stringify({
        data: this.state.preservedData,
        timestamp: Date.now(),
        component: this.props.componentName
      }));
    }
    
    window.location.reload();
  };

  /**
   * Handle navigation back
   */
  _handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  /**
   * Render retry loading state
   */
  _renderRetryingState() {
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
              
              <p className="text-gray-600 mb-2">
                ระบบกำลังพยายามแก้ไขปัญหาโดยอัตโนมัติ
              </p>
              
              <p className="text-sm text-gray-500">
                ครั้งที่ {this.state.retryCount + 1} จาก 3 ครั้ง
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Render error state with retry options
   */
  _renderErrorState() {
    const { classification, errorMessage, retryCount, preservedData } = this.state;
    
    if (!classification || !errorMessage) {
      return this._renderGenericError();
    }

    const showManualRetry = classification.retryable && retryCount < 5;
    const showDataPreservation = preservedData && Object.keys(preservedData).length > 0;

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-lg">
          <div className="mx-auto h-16 w-16 text-red-500 mb-6 flex items-center justify-center">
            <div className="text-4xl">{errorMessage.icon}</div>
          </div>
          
          <div className="bg-white py-8 px-6 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {errorMessage.title}
              </h2>
              
              <p className="text-gray-600 mb-4">
                {errorMessage.message}
              </p>

              <p className="text-sm text-gray-500 mb-6">
                {errorMessage.suggestion}
              </p>

              {/* Network status indicator */}
              {classification.type === ERROR_TYPES.NETWORK && (
                <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`h-3 w-3 rounded-full ${navigator.onLine ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    </div>
                    <div className="ml-3 text-sm">
                      <span className="text-yellow-800">
                        สถานะการเชื่อมต่อ: {navigator.onLine ? 'เชื่อมต่อแล้ว' : 'ไม่ได้เชื่อมต่อ'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Data preservation notice */}
              {showDataPreservation && (
                <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        ข้อมูลที่คุณกรอกได้ถูกเก็บไว้แล้ว และจะถูกกู้คืนเมื่อลองใหม่
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Development error details */}
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

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {showManualRetry && (
                  <button
                    onClick={this._handleManualRetry}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    ลองใหม่
                    {retryCount > 0 && (
                      <span className="ml-1 text-xs opacity-75">
                        ({retryCount})
                      </span>
                    )}
                  </button>
                )}
                
                <button
                  onClick={this._handleReload}
                  className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 ${
                    showManualRetry 
                      ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50' 
                      : 'border-transparent text-white bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  รีโหลดหน้า
                </button>

                <button
                  onClick={this._handleGoBack}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  กลับ
                </button>
              </div>

              {/* Additional information */}
              <div className="mt-6 text-sm text-gray-500">
                {retryCount > 0 && (
                  <p className="mb-2 text-blue-600">
                    ระบบได้ลองแก้ไขปัญหาแล้ว {retryCount} ครั้ง
                  </p>
                )}
                <p>
                  หากปัญหายังคงเกิดขึ้น กรุณาติดต่อผู้ดูแลระบบ
                </p>
                {classification.timestamp && (
                  <p className="mt-2 font-mono text-xs text-gray-400">
                    เวลา: {new Date(classification.timestamp).toLocaleString('th-TH')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Render generic error fallback
   */
  _renderGenericError() {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 text-red-500 mb-6 flex items-center justify-center">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                เกิดข้อผิดพลาด
              </h2>
              
              <p className="text-gray-600 mb-6">
                ขออภัย เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this._handleManualRetry}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  ลองใหม่
                </button>
                
                <button
                  onClick={this._handleReload}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  รีโหลดหน้า
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  render() {
    if (this.state.isRetrying) {
      return this._renderRetryingState();
    }

    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(
          this.state.error, 
          this.state.errorInfo, 
          this._handleManualRetry,
          this.state.classification,
          this.state.preservedData
        );
      }

      return this._renderErrorState();
    }

    return this.props.children;
  }
}

export default EnhancedErrorBoundary;