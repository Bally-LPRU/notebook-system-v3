import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';

// Keep references to firebase auth listeners for assertions
const mockOnAuthStateChanged = jest.fn();
const mockOnIdTokenChanged = jest.fn();
const mockAuthUnsubscribe = jest.fn();
const mockTokenUnsubscribe = jest.fn();

// Mock Firebase config
jest.mock('../../config/firebase', () => ({
  auth: {
    currentUser: null,
    config: {
      authDomain: 'test.firebaseapp.com'
    }
  }
}));

const mockDoc = jest.fn(() => ({ id: 'users/user1' }));
const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockServerTimestamp = jest.fn(() => ({ seconds: Date.now() / 1000 }));

// Mock Firebase auth SDK functions used inside AuthContext
jest.mock('firebase/auth', () => ({
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  onIdTokenChanged: jest.fn()
}));

jest.mock('firebase/firestore', () => {
  const actual = jest.requireActual('firebase/firestore');
  return {
    __esModule: true,
    ...actual,
    doc: mockDoc,
    getDoc: mockGetDoc,
    setDoc: mockSetDoc,
    serverTimestamp: mockServerTimestamp
  };
});

const retryHandler = require('../../utils/retryHandler');
const mockWithRetry = jest.spyOn(retryHandler, 'withRetry');
const mockWithProfileRetry = jest.spyOn(retryHandler, 'withProfileRetry');

const mockedFirebaseAuth = require('firebase/auth');
const mockedFirebaseConfig = require('../../config/firebase');

const { AuthProvider, useAuth } = require('../AuthContext');
jest.mock('../../services/authService', () => ({
  signInWithGoogle: jest.fn(),
  signOut: jest.fn(),
  getUserProfile: jest.fn(),
  createUserProfile: jest.fn(),
  updateUserProfile: jest.fn(),
  validateProfileData: jest.fn(() => ({ isValid: true, errors: [] }))
}));

// Test component to access auth context
const TestComponent = () => {
  const {
    user,
    userProfile,
    isAuthenticated,
    loading,
    isAdmin,
    signIn,
    signOut,
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
      <button
        onClick={() => {
          const result = signIn();
          if (result?.catch) {
            result.catch(() => {});
          }
        }}
        data-testid="sign-in"
      >
        Sign In
      </button>
      <button onClick={signOut} data-testid="sign-out">Sign Out</button>
      <button onClick={() => updateProfile({ firstName: 'Updated' })} data-testid="update-profile">
        Update Profile
      </button>
    </div>
  );
};

const renderAuthProvider = () => render(
  <AuthProvider>
    <TestComponent />
  </AuthProvider>
);

const waitForAuthStateCallback = async () => {
  await waitFor(() => expect(mockOnAuthStateChanged).toHaveBeenCalled());
  return mockOnAuthStateChanged.mock.calls[0][0];
};

describe('AuthContext', () => {
  let mockAuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockWithRetry.mockImplementation(async (operation, ...args) => operation(...args));
    mockWithProfileRetry.mockImplementation(async (operation, ...args) => operation(...args));
    mockAuthService = require('../../services/authService');
    mockAuthService.validateProfileData.mockReturnValue({ isValid: true, errors: [] });
    mockedFirebaseAuth.onAuthStateChanged.mockImplementation((auth, callback, errorCallback) => {
      mockOnAuthStateChanged(callback, errorCallback);
      return () => mockAuthUnsubscribe();
    });

    mockedFirebaseAuth.onIdTokenChanged.mockImplementation((auth, callback) => {
      mockOnIdTokenChanged(callback);
      return () => mockTokenUnsubscribe();
    });

    mockDoc.mockImplementation(() => ({ id: 'users/user1' }));
    mockGetDoc.mockReset();
    mockGetDoc.mockResolvedValue({ exists: () => false });
    mockSetDoc.mockResolvedValue(undefined);
    mockedFirebaseConfig.auth.currentUser = null;
  });

  describe('Initial State', () => {
    it('should provide initial loading state', () => {
      renderAuthProvider();

      expect(screen.getByTestId('loading')).toHaveTextContent('loading');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('is-admin')).toHaveTextContent('not-admin');
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      expect(screen.getByTestId('profile')).toHaveTextContent('no-profile');
    });

    it('should set up auth state listener on mount', async () => {
      renderAuthProvider();

      await waitFor(() => expect(mockOnAuthStateChanged).toHaveBeenCalled());
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

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockProfile
      });

      renderAuthProvider();

      const authStateCallback = await waitForAuthStateCallback();
      
      await act(async () => {
        await authStateCallback(mockUser);
      });

      expect(mockWithProfileRetry).toHaveBeenCalled();
      await waitFor(() => expect(mockGetDoc).toHaveBeenCalled());

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
        expect(screen.getByTestId('user')).toHaveTextContent('Test User');
        expect(screen.getByTestId('profile')).toHaveTextContent('Test');
        expect(screen.getByTestId('is-admin')).toHaveTextContent('not-admin');
      });
    });

    it('should update state when user signs out', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false
      });

      renderAuthProvider();

      const authStateCallback = await waitForAuthStateCallback();
      
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

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockProfile
      });

      renderAuthProvider();

      const authStateCallback = await waitForAuthStateCallback();
      
      await act(async () => {
        await authStateCallback(mockUser);
      });

      await waitFor(() => {
        expect(screen.getByTestId('is-admin')).toHaveTextContent('admin');
      });
    });

    it('should create a profile when one does not exist', async () => {
      const mockUser = {
        uid: 'user1',
        email: 'test@gmail.com',
        displayName: 'Test User'
      };

      mockGetDoc.mockResolvedValueOnce({ exists: () => false });

      renderAuthProvider();

      const authStateCallback = await waitForAuthStateCallback();

      await act(async () => {
        await authStateCallback(mockUser);
      });

      await waitFor(() => expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          uid: 'user1',
          email: 'test@gmail.com',
          role: 'user',
          status: 'incomplete'
        })
      ));
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
      mockGetDoc.mockResolvedValue({ exists: () => false });

      renderAuthProvider();

      const authStateCallback = await waitForAuthStateCallback();
      
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

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockProfile
      });

      renderAuthProvider();

      const authStateCallback = await waitForAuthStateCallback();
      
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

      renderAuthProvider();

      const signInButton = screen.getByTestId('sign-in');
      
      await act(async () => {
        signInButton.click();
      });

      await waitFor(() => expect(mockAuthService.signInWithGoogle).toHaveBeenCalled());
    });

    it('should handle sign out', async () => {
      renderAuthProvider();

      const signOutButton = screen.getByTestId('sign-out');
      
      await act(async () => {
        signOutButton.click();
      });

      await waitFor(() => expect(mockedFirebaseAuth.signOut).toHaveBeenCalled());
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

      mockGetDoc
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockProfile
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ ...mockProfile, firstName: 'Updated' })
        });

      renderAuthProvider();

      const authStateCallback = await waitForAuthStateCallback();
      await act(async () => {
        await authStateCallback(mockUser);
      });
      mockedFirebaseConfig.auth.currentUser = mockUser;

      const updateProfileButton = screen.getByTestId('update-profile');
      
      await act(async () => {
        updateProfileButton.click();
      });

      await waitFor(() => expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          firstName: 'Updated'
        }),
        { merge: true }
      ));
    });
  });

  describe('Error Handling', () => {
    it('should handle sign in errors gracefully', async () => {
      const mockError = new Error('Sign in failed');
      mockAuthService.signInWithGoogle.mockRejectedValue(mockError);

      // Mock console.error to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      renderAuthProvider();

      const signInButton = screen.getByTestId('sign-in');
      
      await act(async () => {
        signInButton.click();
      });

      await waitFor(() => expect(consoleSpy).toHaveBeenCalledWith('❌ SignIn error in AuthContext:', mockError));
      
      consoleSpy.mockRestore();
    });

    it('should handle profile fetch errors gracefully', async () => {
      const mockUser = {
        uid: 'user1',
        email: 'test@gmail.com',
        displayName: 'Test User'
      };

      const mockError = new Error('Profile fetch failed');
      mockGetDoc.mockRejectedValue(mockError);

      // Mock console.error to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      renderAuthProvider();

      const authStateCallback = await waitForAuthStateCallback();
      
      await act(async () => {
        await authStateCallback(mockUser);
      });

      expect(consoleSpy).toHaveBeenCalledWith('❌ Auth state change error:', mockError);
      
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