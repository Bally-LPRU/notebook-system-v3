/**
 * Property-based tests for AdminSettingsPage
 * Tests access control enforcement across different user types
 * 
 * **Feature: admin-settings-system, Property 2: Access control enforcement**
 * **Validates: Requirements 1.3**
 */

import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import fc from 'fast-check';
import AdminSettingsPage from '../AdminSettingsPage';
import { AuthProvider } from '../../../../contexts/AuthContext';
import { SettingsProvider } from '../../../../contexts/SettingsContext';
import { NotificationProvider } from '../../../../contexts/NotificationContext';

// Mock the contexts to control user roles
jest.mock('../../../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../../../contexts/AuthContext'),
  useAuth: jest.fn()
}));

jest.mock('../../../../contexts/SettingsContext', () => ({
  ...jest.requireActual('../../../../contexts/SettingsContext'),
  useSettings: jest.fn()
}));

// Mock Layout component to simplify testing
jest.mock('../../../layout', () => ({
  Layout: ({ children }) => <div data-testid="layout">{children}</div>
}));

// Mock Navigate component to track redirects
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: ({ to, replace }) => {
    mockNavigate(to, replace);
    return <div data-testid="navigate-redirect">Redirecting to {to}</div>;
  }
}));

const { useAuth } = require('../../../../contexts/AuthContext');
const { useSettings } = require('../../../../contexts/SettingsContext');

// Generator for user profiles with different roles
const userProfileGenerator = fc.record({
  uid: fc.string({ minLength: 10, maxLength: 30 }),
  email: fc.emailAddress(),
  displayName: fc.string({ minLength: 3, maxLength: 50 }),
  role: fc.constantFrom('user', 'staff', 'moderator', 'viewer'),
  status: fc.constantFrom('approved', 'pending', 'incomplete', 'rejected'),
  firstName: fc.string({ minLength: 2, maxLength: 30 }),
  lastName: fc.string({ minLength: 2, maxLength: 30 }),
  phoneNumber: fc.string({ minLength: 10, maxLength: 15 }),
  department: fc.string({ minLength: 3, maxLength: 50 }),
  userType: fc.constantFrom('student', 'staff', 'faculty')
});

// Generator for admin user profiles
const adminProfileGenerator = fc.record({
  uid: fc.string({ minLength: 10, maxLength: 30 }),
  email: fc.emailAddress(),
  displayName: fc.string({ minLength: 3, maxLength: 50 }),
  role: fc.constant('admin'),
  status: fc.constant('approved'),
  firstName: fc.string({ minLength: 2, maxLength: 30 }),
  lastName: fc.string({ minLength: 2, maxLength: 30 }),
  phoneNumber: fc.string({ minLength: 10, maxLength: 15 }),
  department: fc.string({ minLength: 3, maxLength: 50 }),
  userType: fc.constantFrom('staff', 'faculty')
});

// Mock settings data
const mockSettings = {
  maxLoanDuration: 14,
  maxAdvanceBookingDays: 30,
  defaultCategoryLimit: 3,
  discordWebhookUrl: null,
  discordEnabled: false
};

describe('AdminSettingsPage - Property-based Access Control Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    cleanup();
    
    // Default mock for settings
    useSettings.mockReturnValue({
      settings: mockSettings,
      loading: false,
      error: null,
      updateSetting: jest.fn(),
      updateMultipleSettings: jest.fn(),
      refreshSettings: jest.fn(),
      getSetting: jest.fn((key, defaultValue) => mockSettings[key] || defaultValue)
    });
  });

  afterEach(() => {
    cleanup();
  });

  // **Feature: admin-settings-system, Property 2: Access control enforcement**
  // **Validates: Requirements 1.3**
  describe('Property 2: Access control enforcement', () => {
    it('should deny access and redirect for any non-admin user', () => {
      fc.assert(
        fc.property(
          userProfileGenerator,
          (userProfile) => {
            // Mock non-admin user
            useAuth.mockReturnValue({
              user: { uid: userProfile.uid, email: userProfile.email },
              userProfile: userProfile,
              loading: false,
              authInitialized: true,
              isAdmin: false,
              isAuthenticated: true,
              isApproved: userProfile.status === 'approved'
            });

            // Render component
            render(
              <BrowserRouter>
                <AdminSettingsPage />
              </BrowserRouter>
            );

            // Verify redirect occurred
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard', true);
            
            // Verify settings page content is not rendered
            expect(screen.queryByText('การตั้งค่าระบบ')).not.toBeInTheDocument();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow access for any admin user', () => {
      fc.assert(
        fc.property(
          adminProfileGenerator,
          (adminProfile) => {
            // Clean up before each property test iteration
            cleanup();
            mockNavigate.mockClear();
            
            // Mock admin user
            useAuth.mockReturnValue({
              user: { uid: adminProfile.uid, email: adminProfile.email },
              userProfile: adminProfile,
              loading: false,
              authInitialized: true,
              isAdmin: true,
              isAuthenticated: true,
              isApproved: true
            });

            // Render component
            const { container } = render(
              <BrowserRouter>
                <AdminSettingsPage />
              </BrowserRouter>
            );

            // Verify no redirect occurred
            expect(mockNavigate).not.toHaveBeenCalled();
            
            // Verify settings page content is rendered
            expect(screen.getByText('การตั้งค่าระบบ')).toBeInTheDocument();
            expect(screen.getByText(/จัดการการตั้งค่าต่างๆ ของระบบยืม-คืนอุปกรณ์/)).toBeInTheDocument();
            
            // Clean up after test
            cleanup();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should show loading state while authentication is being checked', () => {
      fc.assert(
        fc.property(
          fc.oneof(userProfileGenerator, adminProfileGenerator),
          (profile) => {
            // Clean up before each property test iteration
            cleanup();
            mockNavigate.mockClear();
            
            // Mock loading state
            useAuth.mockReturnValue({
              user: null,
              userProfile: null,
              loading: true,
              authInitialized: false,
              isAdmin: false,
              isAuthenticated: false,
              isApproved: false
            });

            // Render component
            render(
              <BrowserRouter>
                <AdminSettingsPage />
              </BrowserRouter>
            );

            // Verify loading state is shown
            expect(screen.getByText('กำลังตรวจสอบสิทธิ์...')).toBeInTheDocument();
            
            // Verify no redirect occurred during loading
            expect(mockNavigate).not.toHaveBeenCalled();
            
            // Verify settings page content is not rendered
            expect(screen.queryByText('การตั้งค่าระบบ')).not.toBeInTheDocument();
            
            // Clean up after test
            cleanup();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should consistently enforce access control regardless of user properties', () => {
      fc.assert(
        fc.property(
          fc.record({
            profile: fc.oneof(userProfileGenerator, adminProfileGenerator),
            isAdmin: fc.boolean()
          }),
          ({ profile, isAdmin }) => {
            // Clean up before each property test iteration
            cleanup();
            mockNavigate.mockClear();
            
            // The isAdmin flag should be the sole determinant of access
            // regardless of other profile properties
            useAuth.mockReturnValue({
              user: { uid: profile.uid, email: profile.email },
              userProfile: profile,
              loading: false,
              authInitialized: true,
              isAdmin: isAdmin,
              isAuthenticated: true,
              isApproved: true
            });

            // Render component
            render(
              <BrowserRouter>
                <AdminSettingsPage />
              </BrowserRouter>
            );

            if (isAdmin) {
              // Admin should have access
              expect(mockNavigate).not.toHaveBeenCalled();
              expect(screen.getByText('การตั้งค่าระบบ')).toBeInTheDocument();
            } else {
              // Non-admin should be redirected
              expect(mockNavigate).toHaveBeenCalledWith('/dashboard', true);
              expect(screen.queryByText('การตั้งค่าระบบ')).not.toBeInTheDocument();
            }
            
            // Clean up after test
            cleanup();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should log warning when non-admin attempts access', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      fc.assert(
        fc.property(
          userProfileGenerator,
          (userProfile) => {
            // Mock non-admin user
            useAuth.mockReturnValue({
              user: { uid: userProfile.uid, email: userProfile.email },
              userProfile: userProfile,
              loading: false,
              authInitialized: true,
              isAdmin: false,
              isAuthenticated: true,
              isApproved: true
            });

            // Clear previous calls
            consoleWarnSpy.mockClear();

            // Render component
            render(
              <BrowserRouter>
                <AdminSettingsPage />
              </BrowserRouter>
            );

            // Verify warning was logged
            expect(consoleWarnSpy).toHaveBeenCalledWith(
              'Non-admin user attempted to access settings page'
            );
          }
        ),
        { numRuns: 50 }
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Edge cases for access control', () => {
    it('should handle null user profile gracefully', () => {
      useAuth.mockReturnValue({
        user: { uid: 'test-uid', email: 'test@example.com' },
        userProfile: null,
        loading: false,
        authInitialized: true,
        isAdmin: false,
        isAuthenticated: true,
        isApproved: false
      });

      render(
        <BrowserRouter>
          <AdminSettingsPage />
        </BrowserRouter>
      );

      // Should redirect when user profile is null and not admin
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', true);
    });

    it('should handle undefined isAdmin flag as false', () => {
      useAuth.mockReturnValue({
        user: { uid: 'test-uid', email: 'test@example.com' },
        userProfile: { role: 'user', status: 'approved' },
        loading: false,
        authInitialized: true,
        isAdmin: undefined,
        isAuthenticated: true,
        isApproved: true
      });

      render(
        <BrowserRouter>
          <AdminSettingsPage />
        </BrowserRouter>
      );

      // Should redirect when isAdmin is undefined
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', true);
    });
  });
});
