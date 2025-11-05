/**
 * Network Status Monitor Component
 * Monitors network connectivity and provides user feedback
 */

import React, { useState, useEffect } from 'react';
import { logError } from '../../utils/errorLogger';

const NetworkStatusMonitor = ({ children, onNetworkChange }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
      setReconnectAttempts(0);
      
      logError({
        type: 'network_status_change',
        context: {
          status: 'online',
          message: 'Network connection restored'
        },
        severity: 'info'
      });

      if (onNetworkChange) {
        onNetworkChange(true);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
      
      logError({
        type: 'network_status_change',
        context: {
          status: 'offline',
          message: 'Network connection lost'
        },
        severity: 'high'
      });

      if (onNetworkChange) {
        onNetworkChange(false);
      }
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status
    if (!navigator.onLine) {
      setShowOfflineMessage(true);
    }

    // Periodic connectivity check
    const connectivityCheck = setInterval(() => {
      if (!navigator.onLine && isOnline) {
        handleOffline();
      } else if (navigator.onLine && !isOnline) {
        handleOnline();
      }
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(connectivityCheck);
    };
  }, [isOnline, onNetworkChange]);

  const handleRetryConnection = async () => {
    setReconnectAttempts(prev => prev + 1);
    
    try {
      // Try to fetch a small resource to test connectivity
      const response = await fetch('/favicon.ico', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        setIsOnline(true);
        setShowOfflineMessage(false);
        setReconnectAttempts(0);
      }
    } catch (error) {
      console.warn('Connection retry failed:', error);
    }
  };

  const dismissOfflineMessage = () => {
    setShowOfflineMessage(false);
  };

  return (
    <>
      {/* Offline notification banner */}
      {showOfflineMessage && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white">
          <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between flex-wrap">
              <div className="w-0 flex-1 flex items-center">
                <span className="flex p-2 rounded-lg bg-red-800">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <p className="ml-3 font-medium text-white">
                  <span className="md:hidden">
                    ไม่มีการเชื่อมต่ออินเทอร์เน็ต
                  </span>
                  <span className="hidden md:inline">
                    ไม่มีการเชื่อมต่ออินเทอร์เน็ต - ข้อมูลอาจไม่เป็นปัจจุบันและการบันทึกอาจไม่สำเร็จ
                  </span>
                </p>
              </div>
              <div className="order-3 mt-2 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto">
                <button
                  onClick={handleRetryConnection}
                  className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-red-50 transition-colors duration-200"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  ลองเชื่อมต่อใหม่
                  {reconnectAttempts > 0 && (
                    <span className="ml-1 text-xs">
                      ({reconnectAttempts})
                    </span>
                  )}
                </button>
              </div>
              <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-3">
                <button
                  type="button"
                  onClick={dismissOfflineMessage}
                  className="-mr-1 flex p-2 rounded-md hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-white sm:-mr-2"
                >
                  <span className="sr-only">ปิด</span>
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection restored notification */}
      {isOnline && reconnectAttempts > 0 && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-green-600 text-white">
          <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between flex-wrap">
              <div className="w-0 flex-1 flex items-center">
                <span className="flex p-2 rounded-lg bg-green-800">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <p className="ml-3 font-medium text-white">
                  การเชื่อมต่อกลับมาแล้ว - คุณสามารถใช้งานระบบได้ตามปกติ
                </p>
              </div>
              <div className="order-2 flex-shrink-0 sm:ml-3">
                <button
                  type="button"
                  onClick={() => setReconnectAttempts(0)}
                  className="-mr-1 flex p-2 rounded-md hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-white sm:-mr-2"
                >
                  <span className="sr-only">ปิด</span>
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content with potential top margin for notifications */}
      <div className={showOfflineMessage || (isOnline && reconnectAttempts > 0) ? 'pt-16' : ''}>
        {children}
      </div>
    </>
  );
};

export default NetworkStatusMonitor;