import { useState, useEffect } from 'react';
import { PWAInstaller } from '../../utils/serviceWorkerRegistration';

const PWAInstallPrompt = ({ 
  className = '',
  showAsModal = false,
  autoShow = true,
  onInstall,
  onDismiss 
}) => {
  const [installer, setInstaller] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const pwaInstaller = new PWAInstaller();
    setInstaller(pwaInstaller);
    
    // Check initial state
    setIsInstallable(pwaInstaller.canInstall());
    setIsInstalled(pwaInstaller.isAppInstalled());
    
    // Listen for PWA events
    const handleInstallable = () => {
      setIsInstallable(true);
      if (autoShow) {
        setShowPrompt(true);
      }
    };
    
    const handleInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowPrompt(false);
      setIsInstalling(false);
      
      if (onInstall) {
        onInstall();
      }
    };
    
    window.addEventListener('pwa-installable', handleInstallable);
    window.addEventListener('pwa-installed', handleInstalled);
    
    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
      window.removeEventListener('pwa-installed', handleInstalled);
    };
  }, [autoShow, onInstall]);

  const handleInstall = async () => {
    if (!installer || !installer.canInstall()) {
      return;
    }
    
    setIsInstalling(true);
    
    try {
      const result = await installer.install();
      console.log('PWA installation result:', result);
      
      if (result.outcome === 'accepted') {
        setShowPrompt(false);
      }
    } catch (error) {
      console.error('PWA installation failed:', error);
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  // Don't show if already installed or not installable
  if (isInstalled || !isInstallable || !showPrompt) {
    return null;
  }

  const promptContent = (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 max-w-sm mx-auto">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            ติดตั้งแอป Equipment Manager
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            ติดตั้งแอปบนอุปกรณ์ของคุณเพื่อการเข้าถึงที่รวดเร็วและใช้งานแบบออฟไลน์
          </p>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              ใช้งานแบบออฟไลน์ได้
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              เข้าถึงได้รวดเร็วจากหน้าจอหลัก
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              ประสบการณ์การใช้งานแบบแอปพลิเคชัน
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isInstalling ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  กำลังติดตั้ง...
                </div>
              ) : (
                'ติดตั้ง'
              )}
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              ไม่ใช่ตอนนี้
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (showAsModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="relative">
          {promptContent}
          <button
            onClick={handleDismiss}
            className="absolute -top-2 -right-2 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 left-4 right-4 z-40 ${className}`}>
      {promptContent}
    </div>
  );
};

// Install button component for manual installation
export const PWAInstallButton = ({ 
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  onInstall,
  onNotAvailable 
}) => {
  const [installer, setInstaller] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const pwaInstaller = new PWAInstaller();
    setInstaller(pwaInstaller);
    
    setIsInstallable(pwaInstaller.canInstall());
    setIsInstalled(pwaInstaller.isAppInstalled());
    
    const handleInstallable = () => setIsInstallable(true);
    const handleInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setIsInstalling(false);
      if (onInstall) onInstall();
    };
    
    window.addEventListener('pwa-installable', handleInstallable);
    window.addEventListener('pwa-installed', handleInstalled);
    
    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
      window.removeEventListener('pwa-installed', handleInstalled);
    };
  }, [onInstall]);

  const handleClick = async () => {
    if (!installer || !installer.canInstall()) {
      if (onNotAvailable) {
        onNotAvailable();
      }
      return;
    }
    
    setIsInstalling(true);
    
    try {
      await installer.install();
    } catch (error) {
      console.error('PWA installation failed:', error);
      setIsInstalling(false);
    }
  };

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      onClick={handleClick}
      disabled={!isInstallable || isInstalling}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {isInstalling ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          กำลังติดตั้ง...
        </>
      ) : (
        <>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          {children || 'ติดตั้งแอป'}
        </>
      )}
    </button>
  );
};

export default PWAInstallPrompt;