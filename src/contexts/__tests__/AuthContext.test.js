import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { jest } from '@jest/globals';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock Firebase
jest.mock('../../config/firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: jest.fn()
  }
}));

jest.mock('../../services/authService', () => ({
  signInWithGoogle: jest.fn(),
  signOut: jest.fn(),
  getUserProfile: jest.fn(),
  createUserProfile: jest.fn(),
  updateUserProfile: jest.fn()
}));

// Test component to access auth context
const TestComponent = () => {
  const {
    user,
    userProfile,
    isAuthenticated,
    loading,
    isAdmin,
    signInWithGoogle,
    signOut,
    createProfile,
    updateProfile,
    needsProfileSetup
  } = useAuth();

  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="is-admin">{isAdmin ? 'admin' : 'not-admin'}</div>
      <div data-testid="user">{user ? user.displayName : 'no-user'}</div>
      <div data-testid="profile">{userProfile ? userProfile.firstName : 'no-profile'}</div>
      <div data-testid="needs-setup">{needsProfileSetup() ? 'needs-setup' : 'no-setup'}</div>
      <button onClick={signInWithGoogle} data-testid="sign-in">Sign In</button>
      <button onClick={signOut} data-testid="sign-out">Sign Out</button>
      <button onClick={() => createProfile({ firstName: 'Test' })} data-testid="create-profile">
        Create Profile
      </button>
      <button onClick={() => updateProfile({ firstName: 'Updated' })} data-testid="update-profile">
        Update Profile
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  let mockOnAuthStateChanged;
  let mockAuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    const { auth } = require('../../config/firebase');
    mockOnAuthStateChanged = jest.fn();
    auth.onAuthStateChanged = mockOnAuthStateChanged;
    
    mockAuthService = require('../../services/authService');
  });

  describe('Initial State', () => {
    it('should provide initial loading state', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('loading');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('is-admin')).toHaveTextContent('not-admin');
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      expect(screen.getByTestId('profile')).toHaveTextContent('no-profile');
    });

    it('should set up auth state listener on mount', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(mockOnAuthStateChanged).toHaveBeenCalled();
    });
  });

  describe('Authentication State Changes', () => {
    it('should update state when user signs in', async () => {
      const mockUser = {
        uid: 'user1',
        email: 'test@gmail.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg'
      };

      const mockProfile = {
        uid: 'user1',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        status: 'approved'
      };

      mockAuthService.getUserProfile.mockResolvedValue(mockProfile);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Simulate auth state change
      const authStateCallback = mockOnAuthStateChanged.mock.calls[0][0];
      
      await act(async () => {
        await authStateCallback(mockUser);
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
        expect(screen.getByTestId('user')).toHaveTextContent('Test User');
        expect(screen.getByTestId('profile')).toHaveTextContent('Test');
        expect(screen.getByTestId('is-admin')).toHaveTextContent('not-admin');
      });
    });

    it('should update state when user signs out', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Simulate auth state change to null (sign out)
      const authStateCallback = mockOnAuthStateChanged.mock.calls[0][0];
      
      await act(async () => {
        await authStateCallback(null);
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
        expect(screen.getByTestId('user')).toHaveTextContent('no-user');
        expect(screen.getByTestId('profile')).toHaveTextContent('no-profile');
      });
    });

    it('should identify admin users correctly', async () => {
      const mockUser = {
        uid: 'admin1',
        email: 'admin@gmail.com',
        displayName: 'Admin User'
      };

      const mockProfile = {
        uid: 'admin1',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        status: 'approved'
      };

      mockAuthService.getUserProfile.mockResolvedValue(mockProfile);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const authStateCallback = mockOnAuthStateChanged.mock.calls[0][0];
      
      await act(async () => {
        await authStateCallback(mockUser);
      });

      await waitFor(() => {
        expect(screen.getByTestId('is-admin')).toHaveTextContent('admin');
      });
    });
  });

  describe('Profile Setup Detection', () => {
    it('should detect when profile setup is needed', async () => {
      const mockUser = {
        uid: 'user1',
        email: 'test@gmail.com',
        displayName: 'Test User'
      };

      // No profile found
      mockAuthService.getUserProfile.mockResolvedValue(null);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const authStateCallback = mockOnAuthStateChanged.mock.calls[0][0];
      
      await act(async () => {
        await authStateCallback(mockUser);
      });

      await waitFor(() => {
        expect(screen.getByTestId('needs-setup')).toHaveTextContent('needs-setup');
      });
    });

    it('should detect when profile setup is not needed', async () => {
      const mockUser = {
        uid: 'user1',
        email: 'test@gmail.com',
        displayName: 'Test User'
      };

      const mockProfile = {
        uid: 'user1',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        status: 'approved'
      };

      mockAuthService.getUserProfile.mockResolvedValue(mockProfile);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const authStateCallback = mockOnAuthStateChanged.mock.calls[0][0];
      
      await act(async () => {
        await authStateCallback(mockUser);
      });

      await waitFor(() => {
        expect(screen.getByTestId('needs-setup')).toHaveTextContent('no-setup');
      });
    });
  });

  describe('Auth Actions', () => {
    it('should handle sign in with Google', async () => {
      const mockUser = {
        uid: 'user1',
        email: 'test@gmail.com',
        displayName: 'Test User'
      };

      mockAuthService.signInWithGoogle.mockResolvedValue(mockUser);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const signInButton = screen.getByTestId('sign-in');
      
      await act(async () => {
        signInButton.click();
      });

      expect(mockAuthService.signInWithGoogle).toHaveBeenCalled();
    });

    it('should handle sign out', async () => {
      mockAuthService.signOut.mockResolvedValue();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const signOutButton = screen.getByTestId('sign-out');
      
      await act(async () => {
        signOutButton.click();
      });

      expect(mockAuthService.signOut).toHaveBeenCalled();
    });

    it('should handle profile creation', async () => {
      const mockUser = {
        uid: 'user1',
        email: 'test@gmail.com',
        displayName: 'Test User'
      };

      const mockProfile = {
        uid: 'user1',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        status: 'pending'
      };

      mockAuthService.createUserProfile.mockResolvedValue(mockProfile);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Set up user first
      const authStateCallback = mockOnAuthStateChanged.mock.calls[0][0];
      await act(async () => {
        await authStateCallback(mockUser);
      });

      const createProfileButton = screen.getByTestId('create-profile');
      
      await act(async () => {
        createProfileButton.click();
      });

      expect(mockAuthService.createUserProfile).toHaveBeenCalledWith(
        mockUser,
        { firstName: 'Test' }
      );
    });

    it('should handle profile update', async () => {
      const mockUser = {
        uid: 'user1',
        email: 'test@gmail.com',
        displayName: 'Test User'
      };

      const mockProfile = {
        uid: 'user1',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        status: 'approved'
      };

      mockAuthService.getUserProfile.mockResolvedValue(mockProfile);
      mockAuthService.updateUserProfile.mockResolvedValue();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Set up user first
      const authStateCallback = mockOnAuthStateChanged.mock.calls[0][0];
      await act(async () => {
        await authStateCallback(mockUser);
      });

      const updateProfileButton = screen.getByTestId('update-profile');
      
      await act(async () => {
        updateProfileButton.click();
      });

      expect(mockAuthService.updateUserProfile).toHaveBeenCalledWith(
        'user1',
        { firstName: 'Updated' }
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle sign in errors gracefully', async () => {
      const mockError = new Error('Sign in failed');
      mockAuthService.signInWithGoogle.mockRejectedValue(mockError);

      // Mock console.error to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const signInButton = screen.getByTestId('sign-in');
      
      await act(async () => {
        signInButton.click();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Sign in error:', mockError);
      
      consoleSpy.mockRestore();
    });

    it('should handle profile fetch errors gracefully', async () => {
      const mockUser = {
        uid: 'user1',
        email: 'test@gmail.com',
        displayName: 'Test User'
      };

      const mockError = new Error('Profile fetch failed');
      mockAuthService.getUserProfile.mockRejectedValue(mockError);

      // Mock console.error to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const authStateCallback = mockOnAuthStateChanged.mock.calls[0][0];
      
      await act(async () => {
        await authStateCallback(mockUser);
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error fetching user profile:', mockError);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Context Usage', () => {
    it('should throw error when used outside provider', () => {
      // Mock console.error to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });
});