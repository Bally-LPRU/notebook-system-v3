import { useState, useEffect } from 'react';
import { NetworkStatusManager, OfflineDataManager } from '../../utils/serviceWorkerRegistration';

const OfflineIndicator = ({ 
  className = '',
  showPendingCount = true,
  onSyncClick 
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingUploads, setPendingUploads] = useState(0);
  const [pendingActions, setPendingActions] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [offlineManager, setOfflineManager] = useState(null);

  useEffect(() => {
    const netManager = new NetworkStatusManager();
    const offManager = new OfflineDataManager();
    
    setOfflineManager(offManager);
    
    // Update online status
    setIsOnline(netManager.getStatus());
    
    // Listen for network changes
    netManager.onOnline(() => {
      setIsOnline(true);
      handleAutoSync();
    });
    
    netManager.onOffline(() => {
      setIsOnline(false);
    });
    
    // Load pending data counts
    loadPendingCounts(offManager);
    
    // Set up periodic count updates
    const interval = setInterval(() => {
      loadPendingCounts(offManager);
    }, 30000); // Update every 30 seconds
    
    return () => {
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPendingCounts = async (manager) => {
    try {
      const uploads = await manager.getPendingUploads();
      const actions = await manager.getOfflineActions();
      
      setPendingUploads(uploads.length);
      setPendingActions(actions.length);
    } catch (error) {
      console.error('Failed to load pending counts:', error);
    }
  };

  const handleAutoSync = async () => {
    if (!isOnline || isSyncing) return;
    
    setIsSyncing(true);
    
    try {
      // Trigger background sync
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('equipment-upload');
        await registration.sync.register('image-upload');
      }
      
      // Wait a bit for sync to complete
      setTimeout(() => {
        loadPendingCounts(offlineManager);
        setIsSyncing(false);
      }, 2000);
      
    } catch (error) {
      console.error('Auto sync failed:', error);
      setIsSyncing(false);
    }
  };

  const handleManualSync = async () => {
    if (!isOnline || isSyncing) return;
    
    setIsSyncing(true);
    
    try {
      await handleAutoSync();
      
      if (onSyncClick) {
        onSyncClick();
      }
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const totalPending = pendingUploads + pendingActions;

  // Don't show if online and no pending items
  if (isOnline && totalPending === 0) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <div 
        className={`bg-white rounded-lg shadow-lg border transition-all duration-300 ${
          isExpanded ? 'w-80' : 'w-auto'
        } ${
          isOnline 
            ? 'border-yellow-200 bg-yellow-50' 
            : 'border-red-200 bg-red-50'
        }`}
      >
        {/* Main indicator */}
        <div 
          className="flex items-center p-3 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex-shrink-0 mr-3">
            {isOnline ? (
              <div className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse mr-2"></div>
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            ) : (
              <div className="flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2v6m0 8v6m-6-6h6m8 0h6" />
                </svg>
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${
              isOnline ? 'text-yellow-800' : 'text-red-800'
            }`}>
              {isOnline ? 'มีข้อมูลรอซิงค์' : 'ออฟไลน์'}
            </p>
            {showPendingCount && totalPending > 0 && (
              <p className={`text-xs ${
                isOnline ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {totalPending} รายการรอดำเนินการ
              </p>
            )}
          </div>
          
          <div className="flex-shrink-0 ml-2">
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              } ${isOnline ? 'text-yellow-600' : 'text-red-600'}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div className="border-t border-gray-200 p-3">
            <div className="space-y-3">
              {/* Status details */}
              <div className="text-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">สถานะเครือข่าย:</span>
                  <span className={`font-medium ${
                    isOnline ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {isOnline ? 'เชื่อมต่อแล้ว' : 'ไม่มีการเชื่อมต่อ'}
                  </span>
                </div>
                
                {totalPending > 0 && (
                  <>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-gray-600">รอการอัปโหลด:</span>
                      <span className="font-medium text-gray-900">{pendingUploads} รายการ</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">รอดำเนินการ:</span>
                      <span className="font-medium text-gray-900">{pendingActions} รายการ</span>
                    </div>
                  </>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex space-x-2">
                {isOnline && totalPending > 0 && (
                  <button
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSyncing ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        กำลังซิงค์...
                      </div>
                    ) : (
                      <>
                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        ซิงค์ข้อมูล
                      </>
                    )}
                  </button>
                )}
                
                <button
                  onClick={() => setIsExpanded(false)}
                  className="px-3 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
                >
                  ปิด
                </button>
              </div>

              {/* Offline tips */}
              {!isOnline && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        โหมดออฟไลน์
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>คุณยังสามารถ:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>ดูข้อมูลอุปกรณ์ที่แคชไว้</li>
                          <li>เพิ่มอุปกรณ์ใหม่ (จะซิงค์เมื่อออนไลน์)</li>
                          <li>ถ่ายรูปและบันทึกข้อมูล</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfflineIndicator;