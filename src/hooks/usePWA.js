import { useState, useEffect, useCallback } from 'react';
import { PWAInstaller, NetworkStatusManager, OfflineDataManager } from '../utils/serviceWorkerRegistration';
import { useBackgroundSync } from '../services/backgroundSyncService';

export const usePWA = () => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingUploads, setPendingUploads] = useState({ equipment: 0, images: 0, total: 0 });
  const [installer, setInstaller] = useState(null);
  const [networkManager, setNetworkManager] = useState(null);
  const [offlineManager, setOfflineManager] = useState(null);
  
  const backgroundSync = useBackgroundSync();

  useEffect(() => {
    // Initialize PWA installer
    const pwaInstaller = new PWAInstaller();
    setInstaller(pwaInstaller);
    setIsInstalled(pwaInstaller.isAppInstalled());
    setIsInstallable(pwaInstaller.canInstall());

    // Initialize network manager
    const netManager = new NetworkStatusManager();
    setNetworkManager(netManager);
    setIsOnline(netManager.getStatus());

    // Initialize offline manager
    const offManager = new OfflineDataManager();
    setOfflineManager(offManager);

    // Listen for PWA events
    const handleInstallable = () => setIsInstallable(true);
    const handleInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
    };

    window.addEventListener('pwa-installable', handleInstallable);
    window.addEventListener('pwa-installed', handleInstalled);

    // Listen for network events
    netManager.onOnline(() => {
      setIsOnline(true);
      // Trigger sync when coming back online
      backgroundSync.forceSyncAll().catch(console.error);
    });

    netManager.onOffline(() => {
      setIsOnline(false);
    });

    // Load initial pending uploads count
    loadPendingUploads();

    // Set up periodic updates
    const interval = setInterval(loadPendingUploads, 30000);

    // Listen for sync completion
    const handleSyncComplete = () => {
      loadPendingUploads();
    };

    window.addEventListener('sync-complete', handleSyncComplete);

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
      window.removeEventListener('pwa-installed', handleInstalled);
      window.removeEventListener('sync-complete', handleSyncComplete);
      clearInterval(interval);
    };
  }, [backgroundSync, loadPendingUploads]);

  const loadPendingUploads = useCallback(async () => {
    try {
      const counts = await backgroundSync.getPendingUploadsCount();
      setPendingUploads(counts);
    } catch (error) {
      console.error('Failed to load pending uploads:', error);
    }
  }, [backgroundSync]);

  const install = useCallback(async () => {
    if (!installer || !installer.canInstall()) {
      throw new Error('Installation not available');
    }
    
    return await installer.install();
  }, [installer]);

  const syncAll = useCallback(async () => {
    if (!isOnline) {
      throw new Error('Cannot sync while offline');
    }
    
    return await backgroundSync.forceSyncAll();
  }, [isOnline, backgroundSync]);

  const addEquipmentOffline = useCallback(async (equipmentData) => {
    const uploadId = await backgroundSync.addEquipmentOffline(equipmentData);
    await loadPendingUploads();
    return uploadId;
  }, [backgroundSync, loadPendingUploads]);

  const updateEquipmentOffline = useCallback(async (equipmentId, updateData) => {
    const uploadId = await backgroundSync.updateEquipmentOffline(equipmentId, updateData);
    await loadPendingUploads();
    return uploadId;
  }, [backgroundSync, loadPendingUploads]);

  const addImageUploadOffline = useCallback(async (equipmentId, imageFile, metadata) => {
    const uploadId = await backgroundSync.addImageUploadOffline(equipmentId, imageFile, metadata);
    await loadPendingUploads();
    return uploadId;
  }, [backgroundSync, loadPendingUploads]);

  const getOfflineActions = useCallback(async () => {
    return await backgroundSync.getOfflineActions();
  }, [backgroundSync]);

  const clearOfflineData = useCallback(async () => {
    await backgroundSync.clearAllOfflineData();
    await loadPendingUploads();
  }, [backgroundSync, loadPendingUploads]);

  return {
    // Installation state
    isInstalled,
    isInstallable,
    install,
    
    // Network state
    isOnline,
    
    // Offline data
    pendingUploads,
    
    // Sync operations
    syncAll,
    addEquipmentOffline,
    updateEquipmentOffline,
    addImageUploadOffline,
    getOfflineActions,
    clearOfflineData,
    
    // Utilities
    loadPendingUploads
  };
};

export const useOfflineCapable = () => {
  const { isOnline, addEquipmentOffline, updateEquipmentOffline, addImageUploadOffline } = usePWA();
  
  return {
    isOnline,
    canWorkOffline: true,
    addEquipmentOffline,
    updateEquipmentOffline,
    addImageUploadOffline
  };
};

export const useInstallPrompt = () => {
  const { isInstalled, isInstallable, install } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);
  
  useEffect(() => {
    if (isInstallable && !isInstalled) {
      // Show prompt after a delay
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled]);
  
  const handleInstall = useCallback(async () => {
    try {
      await install();
      setShowPrompt(false);
    } catch (error) {
      console.error('Installation failed:', error);
    }
  }, [install]);
  
  const dismissPrompt = useCallback(() => {
    setShowPrompt(false);
  }, []);
  
  return {
    showPrompt,
    isInstallable,
    isInstalled,
    handleInstall,
    dismissPrompt
  };
};

export default usePWA;