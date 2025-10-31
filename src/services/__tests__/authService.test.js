import { jest } from '@jest/globals';
import AuthService from '../authService';

// Mock Firebase
jest.mock('../../config/firebase', () => ({
  auth: {
    currentUser: null,
    signInWithPopup: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn()
  },
  googleProvider: {}
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: Date.now() / 1000 }))
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signInWithGoogle', () => {
    it('should sign in user with Google successfully', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@gmail.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg'
      };

      const mockResult = {
        user: mockUser
      };

      const { auth, googleProvider } = require('../../config/firebase');
      auth.signInWithPopup.mockResolvedValue(mockResult);

      const result = await AuthService.signInWithGoogle();

      expect(auth.signInWithPopup).toHaveBeenCalledWith(googleProvider);
      expect(result).toEqual(mockUser);
    });

    it('should handle sign in errors', async () => {
      const mockError = new Error('Sign in failed');
      const { auth } = require('../../config/firebase');
      auth.signInWithPopup.mockRejectedValue(mockError);

      await expect(AuthService.signInWithGoogle()).rejects.toThrow('Sign in failed');
    });

    it('should reject non-allowed email domains', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User'
      };

      const mockResult = {
        user: mockUser
      };

      const { auth } = require('../../config/firebase');
      auth.signInWithPopup.mockResolvedValue(mockResult);

      await expect(AuthService.signInWithGoogle()).rejects.toThrow(
        'อีเมลต้องเป็น @gmail.com หรือ @g.lpru.ac.th เท่านั้น'
      );
    });
  });

  describe('signOut', () => {
    it('should sign out user successfully', async () => {
      const { auth } = require('../../config/firebase');
      auth.signOut.mockResolvedValue();

      await AuthService.signOut();

      expect(auth.signOut).toHaveBeenCalled();
    });

    it('should handle sign out errors', async () => {
      const mockError = new Error('Sign out failed');
      const { auth } = require('../../config/firebase');
      auth.signOut.mockRejectedValue(mockError);

      await expect(AuthService.signOut()).rejects.toThrow('Sign out failed');
    });
  });

  describe('createUserProfile', () => {
    it('should create user profile successfully', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@gmail.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg'
      };

      const mockProfileData = {
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '0123456789',
        department: 'IT',
        userType: 'staff'
      };

      const { doc, setDoc, serverTimestamp } = require('firebase/firestore');
      doc.mockReturnValue({ id: 'test-uid' });
      setDoc.mockResolvedValue();
      serverTimestamp.mockReturnValue({ seconds: Date.now() / 1000 });

      const result = await AuthService.createUserProfile(mockUser, mockProfileData);

      expect(setDoc).toHaveBeenCalled();
      expect(result).toEqual({
        uid: mockUser.uid,
        email: mockUser.email,
        displayName: mockUser.displayName,
        photoURL: mockUser.photoURL,
        ...mockProfileData,
        role: 'user',
        status: 'pending',
        createdAt: expect.any(Object),
        updatedAt: expect.any(Object)
      });
    });

    it('should handle profile creation errors', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@gmail.com'
      };

      const mockProfileData = {
        firstName: 'Test',
        lastName: 'User'
      };

      const { setDoc } = require('firebase/firestore');
      setDoc.mockRejectedValue(new Error('Profile creation failed'));

      await expect(AuthService.createUserProfile(mockUser, mockProfileData))
        .rejects.toThrow('Profile creation failed');
    });
  });

  describe('getUserProfile', () => {
    it('should get user profile successfully', async () => {
      const mockProfile = {
        uid: 'test-uid',
        email: 'test@gmail.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        status: 'approved'
      };

      const { doc, getDoc } = require('firebase/firestore');
      doc.mockReturnValue({ id: 'test-uid' });
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockProfile
      });

      const result = await AuthService.getUserProfile('test-uid');

      expect(getDoc).toHaveBeenCalled();
      expect(result).toEqual(mockProfile);
    });

    it('should return null for non-existent profile', async () => {
      const { doc, getDoc } = require('firebase/firestore');
      doc.mockReturnValue({ id: 'test-uid' });
      getDoc.mockResolvedValue({
        exists: () => false
      });

      const result = await AuthService.getUserProfile('test-uid');

      expect(result).toBeNull();
    });

    it('should handle profile fetch errors', async () => {
      const { getDoc } = require('firebase/firestore');
      getDoc.mockRejectedValue(new Error('Profile fetch failed'));

      await expect(AuthService.getUserProfile('test-uid'))
        .rejects.toThrow('Profile fetch failed');
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name'
      };

      const { doc, updateDoc, serverTimestamp } = require('firebase/firestore');
      doc.mockReturnValue({ id: 'test-uid' });
      updateDoc.mockResolvedValue();
      serverTimestamp.mockReturnValue({ seconds: Date.now() / 1000 });

      await AuthService.updateUserProfile('test-uid', updateData);

      expect(updateDoc).toHaveBeenCalledWith(
        { id: 'test-uid' },
        {
          ...updateData,
          updatedAt: expect.any(Object)
        }
      );
    });

    it('should handle profile update errors', async () => {
      const { updateDoc } = require('firebase/firestore');
      updateDoc.mockRejectedValue(new Error('Profile update failed'));

      await expect(AuthService.updateUserProfile('test-uid', {}))
        .rejects.toThrow('Profile update failed');
    });
  });

  describe('isValidEmail', () => {
    it('should validate gmail.com emails', () => {
      expect(AuthService.isValidEmail('test@gmail.com')).toBe(true);
    });

    it('should validate g.lpru.ac.th emails', () => {
      expect(AuthService.isValidEmail('test@g.lpru.ac.th')).toBe(true);
    });

    it('should reject other email domains', () => {
      expect(AuthService.isValidEmail('test@example.com')).toBe(false);
      expect(AuthService.isValidEmail('test@yahoo.com')).toBe(false);
      expect(AuthService.isValidEmail('test@hotmail.com')).toBe(false);
    });

    it('should handle invalid email formats', () => {
      expect(AuthService.isValidEmail('invalid-email')).toBe(false);
      expect(AuthService.isValidEmail('')).toBe(false);
      expect(AuthService.isValidEmail(null)).toBe(false);
      expect(AuthService.isValidEmail(undefined)).toBe(false);
    });
  });
});