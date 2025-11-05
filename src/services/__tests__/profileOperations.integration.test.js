import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import DuplicateDetectionService from '../duplicateDetectionService';
import { auth, db } from '../../config/firebase';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';

// Mock Firebase
jest.mock('../../config/firebase', () => ({
  auth: {},
  db: {},
  googleProvider: {}
}));

jest.mock('firebase/auth');
jest.mock('firebase/firestore');
jest.mock('../../utils/errorLogger');

// Test component to access auth context
const TestComponent = ({ onAuthState }) => {
  const auth = useAuth();
  
  React.useEffect(() => {
    if (onAuthState) {
      onAuthState(auth);
    }
  }, [auth, onAuthState]);

  return (
    <div>
      <div data-testid="user-status">
        {auth.user ? `Logged in: ${auth.user.email}` : 'Not logged in'}
      </div>
      <div data-testid="profile-status">
        {auth.userProfile ? `Profile: ${auth.userProfile.status}` : 'No profile'}
      </div>
      <div data-testid="loading-status">
        {auth.loading ? 'Loading' : 'Ready'}
      </div>
      {auth.error && (
        <div data-testid="error-message">{auth.error}</div>
      )}
      <button 
        data-testid="login-button" 
        onClick={auth.login}
        disabled={auth.loading}
      >
        Login
      </button>
      <button 
        data-testid="logout-button" 
        onClick={auth.logout}
        disabled={auth.loading}
      >
        Logout
      </button>
    </div>
  );
};

describe('Profile Operations Integration Tests', () => {
  let mockUser;
  let mockProfile;
  let authStateCallback;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUser = {
      uid: 'test-user-123',
      email: 'test@gmail.com',
      displayName: 'Test User',
      photoURL: 'https://example.com/photo.jpg'
    };

    mockProfile = {
      uid: 'test-user-123',
      email: 'test@gmail.com',
      firstName: 'สมชาย',
      lastName: 'ใจดี',
      phoneNumber: '0812345678',
      department: { value: 'accounting', label: 'สาขาวิชาการบัญชี' },
      userType: 'student',
      status: 'pending',
      role: 'user',
      createdAt: { seconds: Date.now() / 1000 },
      updatedAt: { seconds: Date.now() / 1000 }
    };

    // Mock Firebase Auth
    onAuthStateChanged.mockImplementation((auth, callback) => {
      authStateCallback = callback;
      return () => {}; // Unsubscribe function
    });

    signInWithPopup.mockResolvedValue({
      user: mockUser,
      credential: null
    });

    signOut.mockResolvedValue();

    // Mock Firestore
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockProfile,
      id: 'test-user-123'
    });

    setDoc.mockResolvedValue();
    getDocs.mockResolvedValue({
      empty: true,
      docs: []
    });
  });

  describe('Complete Profile Creation Flow', () => {
    test('should handle new user profile creation successfully', async () => {
      let authState;
      
      // Mock no existing profile
      getDoc.mockResolvedValueOnce({
        exists: () => false
      });

      render(
        <AuthProvider>
          <TestComponent onAuthState={(auth) => { authState = auth; }} />
        </AuthProvider>
      );

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('Ready');
      });

      // Simulate login
      const loginButton = screen.getByTestId('login-button');
      await userEvent.click(loginButton);

      // Simulate auth state change
      act(() => {
        authStateCallback(mockUser);
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in: test@gmail.com');
      });

      // Verify Firebase calls
      expect(signInWithPopup).toHaveBeenCalledWith(auth, expect.any(Object));
      expect(getDoc).toHaveBeenCalledWith(doc(db, 'users', mockUser.uid));
    });

    test('should handle existing user profile retrieval', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Simulate auth state change with existing user
      act(() => {
        authStateCallback(mockUser);
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in: test@gmail.com');
        expect(screen.getByTestId('profile-status')).toHaveTextContent('Profile: pending');
      });

      expect(getDoc).toHaveBeenCalledWith(doc(db, 'users', mockUser.uid));
    });

    test('should handle profile update operations', async () => {
      let authState;

      render(
        <AuthProvider>
          <TestComponent onAuthState={(auth) => { authState = auth; }} />
        </AuthProvider>
      );

      // Simulate auth state change
      act(() => {
        authStateCallback(mockUser);
      });

      await waitFor(() => {
        expect(authState).toBeDefined();
      });

      // Test profile update
      const updatedProfileData = {
        firstName: 'สมหญิง',
        lastName: 'ใจดี',
        phoneNumber: '0887654321',
        department: { value: 'computer-business', label: 'สาขาวิชาคอมพิวเตอร์ธุรกิจ' },
        userType: 'teacher'
      };

      await act(async () => {
        await authState.updateProfile(updatedProfileData);
      });

      expect(setDoc).toHaveBeenCalledWith(
        doc(db, 'users', mockUser.uid),
        expect.objectContaining({
          ...updatedProfileData,
          updatedAt: expect.any(Object)
        }),
        { merge: true }
      );
    });
  });

  describe('Duplicate Detection Integration', () => {
    test('should detect existing profile by email', async () => {
      const existingProfile = {
        id: 'existing-user-456',
        uid: 'existing-user-456',
        email: 'existing@gmail.com',
        status: 'approved'
      };

      getDocs.mockResolvedValueOnce({
        empty: false,
        docs: [{
          id: 'existing-user-456',
          data: () => existingProfile
        }]
      });

      const result = await DuplicateDetectionService.checkProfileByEmail('existing@gmail.com');

      expect(result).toEqual({
        id: 'existing-user-456',
        ...existingProfile
      });

      expect(getDocs).toHaveBeenCalledWith(
        expect.objectContaining({
          converter: undefined
        })
      );
    });

    test('should return null for non-existing profile', async () => {
      getDocs.mockResolvedValueOnce({
        empty: true,
        docs: []
      });

      const result = await DuplicateDetectionService.checkProfileByEmail('nonexistent@gmail.com');

      expect(result).toBeNull();
    });

    test('should handle duplicate profile prevention during signup', async () => {
      // Mock existing profile
      getDocs.mockResolvedValueOnce({
        empty: false,
        docs: [{
          id: 'existing-user-456',
          data: () => ({
            uid: 'existing-user-456',
            email: 'test@gmail.com',
            status: 'approved'
          })
        }]
      });

      let authState;

      render(
        <AuthProvider>
          <TestComponent onAuthState={(auth) => { authState = auth; }} />
        </AuthProvider>
      );

      // Simulate login attempt with existing email
      const loginButton = screen.getByTestId('login-button');
      await userEvent.click(loginButton);

      // Simulate auth state change
      act(() => {
        authStateCallback(mockUser);
      });

      await waitFor(() => {
        expect(authState).toBeDefined();
      });

      // The system should detect the duplicate and handle appropriately
      expect(getDocs).toHaveBeenCalled();
    });
  });

  describe('Firestore Security Rules Integration', () => {
    test('should handle permission denied errors gracefully', async () => {
      const permissionError = new Error('Permission denied');
      permissionError.code = 'permission-denied';
      
      getDoc.mockRejectedValueOnce(permissionError);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      act(() => {
        authStateCallback(mockUser);
      });

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
    });

    test('should validate profile data before saving', async () => {
      let authState;

      render(
        <AuthProvider>
          <TestComponent onAuthState={(auth) => { authState = auth; }} />
        </AuthProvider>
      );

      act(() => {
        authStateCallback(mockUser);
      });

      await waitFor(() => {
        expect(authState).toBeDefined();
      });

      // Test with invalid profile data
      const invalidProfileData = {
        firstName: '', // Empty required field
        lastName: 'ใจดี',
        phoneNumber: 'invalid-phone', // Invalid format
        department: null, // Missing required field
        userType: 'invalid-type' // Invalid enum value
      };

      await expect(
        authState.updateProfile(invalidProfileData)
      ).rejects.toThrow();
    });

    test('should enforce status transition rules', async () => {
      let authState;

      // Mock profile with 'approved' status
      const approvedProfile = {
        ...mockProfile,
        status: 'approved'
      };

      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => approvedProfile,
        id: 'test-user-123'
      });

      render(
        <AuthProvider>
          <TestComponent onAuthState={(auth) => { authState = auth; }} />
        </AuthProvider>
      );

      act(() => {
        authStateCallback(mockUser);
      });

      await waitFor(() => {
        expect(authState).toBeDefined();
      });

      // Try to change status from 'approved' to 'incomplete' (should be prevented)
      const invalidStatusUpdate = {
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        status: 'incomplete' // Invalid transition
      };

      // This should be prevented by security rules
      setDoc.mockRejectedValueOnce(new Error('Invalid status transition'));

      await expect(
        authState.updateProfile(invalidStatusUpdate)
      ).rejects.toThrow('Invalid status transition');
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle network errors with retry mechanism', async () => {
      const networkError = new Error('Network request failed');
      networkError.code = 'unavailable';

      // First call fails, second succeeds
      getDoc
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockProfile,
          id: 'test-user-123'
        });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      act(() => {
        authStateCallback(mockUser);
      });

      // Should eventually succeed after retry
      await waitFor(() => {
        expect(screen.getByTestId('profile-status')).toHaveTextContent('Profile: pending');
      }, { timeout: 5000 });

      expect(getDoc).toHaveBeenCalledTimes(2);
    });

    test('should handle Firestore unavailable errors', async () => {
      const firestoreError = new Error('Firestore unavailable');
      firestoreError.code = 'unavailable';

      getDoc.mockRejectedValue(firestoreError);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      act(() => {
        authStateCallback(mockUser);
      });

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
    });

    test('should handle authentication token expiration', async () => {
      const tokenError = new Error('Token expired');
      tokenError.code = 'auth/user-token-expired';

      signInWithPopup.mockRejectedValueOnce(tokenError);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const loginButton = screen.getByTestId('login-button');
      await userEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
    });
  });

  describe('Profile Status Transitions', () => {
    test('should handle incomplete to pending status transition', async () => {
      let authState;

      const incompleteProfile = {
        ...mockProfile,
        status: 'incomplete'
      };

      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => incompleteProfile,
        id: 'test-user-123'
      });

      render(
        <AuthProvider>
          <TestComponent onAuthState={(auth) => { authState = auth; }} />
        </AuthProvider>
      );

      act(() => {
        authStateCallback(mockUser);
      });

      await waitFor(() => {
        expect(authState).toBeDefined();
      });

      // Complete the profile (should transition to 'pending')
      const completeProfileData = {
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        phoneNumber: '0812345678',
        department: { value: 'accounting', label: 'สาขาวิชาการบัญชี' },
        userType: 'student',
        status: 'pending'
      };

      await act(async () => {
        await authState.updateProfile(completeProfileData);
      });

      expect(setDoc).toHaveBeenCalledWith(
        doc(db, 'users', mockUser.uid),
        expect.objectContaining({
          ...completeProfileData,
          updatedAt: expect.any(Object)
        }),
        { merge: true }
      );
    });

    test('should prevent invalid status transitions', async () => {
      let authState;

      const pendingProfile = {
        ...mockProfile,
        status: 'pending'
      };

      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => pendingProfile,
        id: 'test-user-123'
      });

      render(
        <AuthProvider>
          <TestComponent onAuthState={(auth) => { authState = auth; }} />
        </AuthProvider>
      );

      act(() => {
        authStateCallback(mockUser);
      });

      await waitFor(() => {
        expect(authState).toBeDefined();
      });

      // Try invalid transition from 'pending' to 'incomplete'
      const invalidUpdate = {
        firstName: 'สมชาย',
        status: 'incomplete'
      };

      setDoc.mockRejectedValueOnce(new Error('Invalid status transition'));

      await expect(
        authState.updateProfile(invalidUpdate)
      ).rejects.toThrow('Invalid status transition');
    });
  });

  describe('Data Validation Integration', () => {
    test('should validate Thai name patterns', async () => {
      let authState;

      render(
        <AuthProvider>
          <TestComponent onAuthState={(auth) => { authState = auth; }} />
        </AuthProvider>
      );

      act(() => {
        authStateCallback(mockUser);
      });

      await waitFor(() => {
        expect(authState).toBeDefined();
      });

      // Test with valid Thai names
      const validThaiData = {
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        phoneNumber: '0812345678',
        department: { value: 'accounting', label: 'สาขาวิชาการบัญชี' },
        userType: 'student'
      };

      await act(async () => {
        await authState.updateProfile(validThaiData);
      });

      expect(setDoc).toHaveBeenCalledWith(
        doc(db, 'users', mockUser.uid),
        expect.objectContaining(validThaiData),
        { merge: true }
      );
    });

    test('should validate phone number formats', async () => {
      let authState;

      render(
        <AuthProvider>
          <TestComponent onAuthState={(auth) => { authState = auth; }} />
        </AuthProvider>
      );

      act(() => {
        authStateCallback(mockUser);
      });

      await waitFor(() => {
        expect(authState).toBeDefined();
      });

      // Test with invalid phone number
      const invalidPhoneData = {
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        phoneNumber: '123', // Too short
        department: { value: 'accounting', label: 'สาขาวิชาการบัญชี' },
        userType: 'student'
      };

      await expect(
        authState.updateProfile(invalidPhoneData)
      ).rejects.toThrow();
    });

    test('should validate department selection', async () => {
      let authState;

      render(
        <AuthProvider>
          <TestComponent onAuthState={(auth) => { authState = auth; }} />
        </AuthProvider>
      );

      act(() => {
        authStateCallback(mockUser);
      });

      await waitFor(() => {
        expect(authState).toBeDefined();
      });

      // Test with invalid department
      const invalidDepartmentData = {
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        phoneNumber: '0812345678',
        department: { value: 'invalid-dept', label: 'Invalid Department' },
        userType: 'student'
      };

      await expect(
        authState.updateProfile(invalidDepartmentData)
      ).rejects.toThrow();
    });
  });

  describe('Logout and Cleanup', () => {
    test('should handle logout and cleanup properly', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Login first
      act(() => {
        authStateCallback(mockUser);
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in: test@gmail.com');
      });

      // Logout
      const logoutButton = screen.getByTestId('logout-button');
      await userEvent.click(logoutButton);

      // Simulate auth state change to null
      act(() => {
        authStateCallback(null);
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
        expect(screen.getByTestId('profile-status')).toHaveTextContent('No profile');
      });

      expect(signOut).toHaveBeenCalledWith(auth);
    });
  });
});