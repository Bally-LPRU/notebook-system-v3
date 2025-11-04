import { renderHook, act, waitFor } from '@testing-library/react';
import usePublicStats from '../usePublicStats';

// Mock dependencies
jest.mock('../services/statisticsService', () => ({
  getPublicStats: jest.fn(),
  subscribeToStats: jest.fn(),
  clearCache: jest.fn(),
  getFallbackStats: jest.fn()
}));

jest.mock('../useOfflineDetection', () => ({
  __esModule: true,
  default: jest.fn()
}));

describe('usePublicStats', () => {
  const mockStatisticsService = require('../services/statisticsService');
  const mockUseOfflineDetection = require('../useOfflineDetection').default;

  const mockStats = {
    totalEquipment: 100,
    availableEquipment: 75,
    borrowedEquipment: 20,
    pendingReservations: 5,
    lastUpdated: new Date(),
    hasError: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockUseOfflineDetection.mockReturnValue({
      isOnline: true,
      wasOffline: false,
      getOfflineMessage: jest.fn(() => null),
      retryWhenOnline: jest.fn()
    });

    mockStatisticsService.getPublicStats.mockResolvedValue(mockStats);
    mockStatisticsService.subscribeToStats.mockReturnValue(jest.fn());
    mockStatisticsService.getFallbackStats.mockReturnValue({
      totalEquipment: 0,
      availableEquipment: 0,
      borrowedEquipment: 0,
      pendingReservations: 0,
      hasError: true,
      errorMessage: 'Fallback data'
    });
  });

  describe('Initial Loading', () => {
    it('should start with loading state', () => {
      const { result } = renderHook(() => usePublicStats());

      expect(result.current.loading).toBe(true);
      expect(result.current.stats).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should load stats on mount', async () => {
      const { result } = renderHook(() => usePublicStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockStatisticsService.getPublicStats).toHaveBeenCalledWith(false);
      expect(result.current.stats).toEqual(mockStats);
      expect(result.current.error).toBe(null);
    });

    it('should handle loading errors', async () => {
      const error = new Error('Failed to load stats');
      mockStatisticsService.getPublicStats.mockRejectedValue(error);

      const { result } = renderHook(() => usePublicStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockStatisticsService.getFallbackStats).toHaveBeenCalledWith(error);
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Refresh Functionality', () => {
    it('should refresh stats when refreshStats is called', async () => {
      const { result } = renderHook(() => usePublicStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.refreshStats();
      });

      expect(result.current.isRefreshing).toBe(true);
      expect(mockStatisticsService.clearCache).toHaveBeenCalled();

      await waitFor(() => {
        expect(result.current.isRefreshing).toBe(false);
      });

      expect(mockStatisticsService.getPublicStats).toHaveBeenCalledWith(true);
    });

    it('should handle refresh errors', async () => {
      const { result } = renderHook(() => usePublicStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const error = new Error('Refresh failed');
      mockStatisticsService.getPublicStats.mockRejectedValueOnce(error);

      act(() => {
        result.current.refreshStats();
      });

      await waitFor(() => {
        expect(result.current.isRefreshing).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });

    it('should reload from cache when offline during refresh', async () => {
      mockUseOfflineDetection.mockReturnValue({
        isOnline: false,
        wasOffline: false,
        getOfflineMessage: jest.fn(() => 'Offline'),
        retryWhenOnline: jest.fn()
      });

      const { result } = renderHook(() => usePublicStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.refreshStats();
      });

      await waitFor(() => {
        expect(result.current.isRefreshing).toBe(false);
      });

      // Should not clear cache when offline
      expect(mockStatisticsService.clearCache).not.toHaveBeenCalled();
      expect(mockStatisticsService.getPublicStats).toHaveBeenCalledWith(false);
    });
  });

  describe('Offline Handling', () => {
    it('should return offline message when offline', () => {
      const offlineMessage = 'No internet connection';
      mockUseOfflineDetection.mockReturnValue({
        isOnline: false,
        wasOffline: false,
        getOfflineMessage: jest.fn(() => offlineMessage),
        retryWhenOnline: jest.fn()
      });

      const { result } = renderHook(() => usePublicStats());

      expect(result.current.error).toBe(offlineMessage);
    });

    it('should combine error and offline messages', () => {
      const offlineMessage = 'No internet connection';
      const errorMessage = 'Failed to load';
      
      mockUseOfflineDetection.mockReturnValue({
        isOnline: false,
        wasOffline: false,
        getOfflineMessage: jest.fn(() => offlineMessage),
        retryWhenOnline: jest.fn()
      });

      mockStatisticsService.getPublicStats.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => usePublicStats());

      expect(result.current.error).toBe(`${errorMessage} (${offlineMessage})`);
    });

    it('should refresh when coming back online', async () => {
      let wasOffline = false;
      
      mockUseOfflineDetection.mockReturnValue({
        isOnline: true,
        wasOffline,
        getOfflineMessage: jest.fn(() => null),
        retryWhenOnline: jest.fn()
      });

      const { rerender } = renderHook(() => usePublicStats());

      await waitFor(() => {
        expect(mockStatisticsService.getPublicStats).toHaveBeenCalledTimes(1);
      });

      // Simulate coming back online
      wasOffline = true;
      mockUseOfflineDetection.mockReturnValue({
        isOnline: true,
        wasOffline: true,
        getOfflineMessage: jest.fn(() => null),
        retryWhenOnline: jest.fn()
      });

      // Trigger network reconnection event
      act(() => {
        window.dispatchEvent(new Event('network-reconnected'));
      });

      await waitFor(() => {
        expect(mockStatisticsService.clearCache).toHaveBeenCalled();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should subscribe to real-time updates when online and stats loaded', async () => {
      const mockUnsubscribe = jest.fn();
      mockStatisticsService.subscribeToStats.mockReturnValue(mockUnsubscribe);

      const { result, unmount } = renderHook(() => usePublicStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockStatisticsService.subscribeToStats).toHaveBeenCalled();

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should not subscribe when offline', async () => {
      mockUseOfflineDetection.mockReturnValue({
        isOnline: false,
        wasOffline: false,
        getOfflineMessage: jest.fn(() => 'Offline'),
        retryWhenOnline: jest.fn()
      });

      const { result } = renderHook(() => usePublicStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockStatisticsService.subscribeToStats).not.toHaveBeenCalled();
    });

    it('should not subscribe when there are errors', async () => {
      mockStatisticsService.getPublicStats.mockResolvedValue({
        ...mockStats,
        hasError: true
      });

      const { result } = renderHook(() => usePublicStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockStatisticsService.subscribeToStats).not.toHaveBeenCalled();
    });

    it('should update stats when real-time data is received', async () => {
      let subscribeCallback;
      mockStatisticsService.subscribeToStats.mockImplementation((callback) => {
        subscribeCallback = callback;
        return jest.fn();
      });

      const { result } = renderHook(() => usePublicStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const updatedStats = {
        ...mockStats,
        totalEquipment: 150
      };

      act(() => {
        subscribeCallback(updatedStats);
      });

      expect(result.current.stats).toEqual(updatedStats);
    });
  });

  describe('Error Handling', () => {
    it('should set error when stats have error flag', async () => {
      const statsWithError = {
        ...mockStats,
        hasError: true,
        errorMessage: 'Database connection failed'
      };

      mockStatisticsService.getPublicStats.mockResolvedValue(statsWithError);

      const { result } = renderHook(() => usePublicStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Database connection failed');
      expect(result.current.stats).toEqual(statsWithError);
    });

    it('should clear error when data loads successfully', async () => {
      // First load with error
      mockStatisticsService.getPublicStats.mockRejectedValueOnce(new Error('Initial error'));

      const { result } = renderHook(() => usePublicStats());

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      // Then successful load
      mockStatisticsService.getPublicStats.mockResolvedValue(mockStats);

      act(() => {
        result.current.refreshStats();
      });

      await waitFor(() => {
        expect(result.current.error).toBe(null);
      });
    });

    it('should use fallback stats when service throws error', async () => {
      const error = new Error('Service unavailable');
      const fallbackStats = {
        totalEquipment: 0,
        availableEquipment: 0,
        borrowedEquipment: 0,
        pendingReservations: 0,
        hasError: true,
        errorMessage: 'Service temporarily unavailable'
      };

      mockStatisticsService.getPublicStats.mockRejectedValue(error);
      mockStatisticsService.getFallbackStats.mockReturnValue(fallbackStats);

      const { result } = renderHook(() => usePublicStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockStatisticsService.getFallbackStats).toHaveBeenCalledWith(error);
      expect(result.current.stats).toEqual(fallbackStats);
      expect(result.current.error).toBe('Service temporarily unavailable');
    });
  });

  describe('Return Values', () => {
    it('should return all expected properties', async () => {
      const { result } = renderHook(() => usePublicStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current).toHaveProperty('stats');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('isRefreshing');
      expect(result.current).toHaveProperty('isOnline');
      expect(result.current).toHaveProperty('wasOffline');
      expect(result.current).toHaveProperty('refreshStats');
      expect(result.current).toHaveProperty('retryWhenOnline');
    });

    it('should pass through offline detection values', () => {
      const offlineValues = {
        isOnline: false,
        wasOffline: true,
        getOfflineMessage: jest.fn(() => 'Offline'),
        retryWhenOnline: jest.fn()
      };

      mockUseOfflineDetection.mockReturnValue(offlineValues);

      const { result } = renderHook(() => usePublicStats());

      expect(result.current.isOnline).toBe(false);
      expect(result.current.wasOffline).toBe(true);
      expect(result.current.retryWhenOnline).toBe(offlineValues.retryWhenOnline);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup subscriptions on unmount', async () => {
      const mockUnsubscribe = jest.fn();
      mockStatisticsService.subscribeToStats.mockReturnValue(mockUnsubscribe);

      const { result, unmount } = renderHook(() => usePublicStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockStatisticsService.subscribeToStats).toHaveBeenCalled();

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should cleanup event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => usePublicStats());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('network-reconnected', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });
});