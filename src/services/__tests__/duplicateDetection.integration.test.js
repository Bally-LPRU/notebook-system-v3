import DuplicateDetectionService from '../duplicateDetectionService';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';

// Mock Firebase config
jest.mock('../../config/firebase', () => ({
  db: {}
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => {
  const mockCollection = jest.fn(() => ({}));
  const mockQuery = jest.fn((...args) => ({ __type: 'query', args }));
  const mockWhere = jest.fn((...args) => ({ __type: 'where', args }));
  const mockGetDocs = jest.fn();
  const mockLimit = jest.fn((count) => ({ __type: 'limit', count }));

  return {
    collection: mockCollection,
    query: mockQuery,
    where: mockWhere,
    getDocs: mockGetDocs,
    limit: mockLimit
  };
});

jest.mock('../../utils/errorLogger');

describe('Duplicate Detection Service Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    collection.mockImplementation(() => ({}));
    query.mockImplementation((...args) => ({ __type: 'query', args }));
    where.mockImplementation((...args) => ({ __type: 'where', args }));
    limit.mockImplementation((count) => ({ __type: 'limit', count }));
  });

  describe('checkProfileByEmail', () => {
    test('should find existing profile by email', async () => {
      const mockProfile = {
        uid: 'existing-user-123',
        email: 'existing@gmail.com',
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        status: 'approved',
        createdAt: { seconds: Date.now() / 1000 }
      };

      const mockQuerySnapshot = {
        empty: false,
        docs: [{
          id: 'existing-user-123',
          data: () => mockProfile
        }]
      };

      getDocs.mockResolvedValue(mockQuerySnapshot);

      const result = await DuplicateDetectionService.checkProfileByEmail('existing@gmail.com');

      expect(result).toEqual({
        id: 'existing-user-123',
        ...mockProfile
      });

      expect(collection).toHaveBeenCalledWith(db, 'users');
      expect(query).toHaveBeenCalledWith(
        expect.anything(),
        where('email', '==', 'existing@gmail.com'),
        limit(1)
      );
      expect(getDocs).toHaveBeenCalled();
    });

    test('should return null when no profile exists', async () => {
      const mockQuerySnapshot = {
        empty: true,
        docs: []
      };

      getDocs.mockResolvedValue(mockQuerySnapshot);

      const result = await DuplicateDetectionService.checkProfileByEmail('nonexistent@gmail.com');

      expect(result).toBeNull();
      expect(getDocs).toHaveBeenCalled();
    });

    test('should handle email normalization', async () => {
      const mockQuerySnapshot = {
        empty: true,
        docs: []
      };

      getDocs.mockResolvedValue(mockQuerySnapshot);

      // Test with uppercase and whitespace
      await DuplicateDetectionService.checkProfileByEmail('  TEST@GMAIL.COM  ');

      expect(query).toHaveBeenCalledWith(
        expect.anything(),
        where('email', '==', 'test@gmail.com'),
        limit(1)
      );
    });

    test('should throw error for missing email', async () => {
      await expect(
        DuplicateDetectionService.checkProfileByEmail('')
      ).rejects.toThrow('Email is required for duplicate detection');

      await expect(
        DuplicateDetectionService.checkProfileByEmail(null)
      ).rejects.toThrow('Email is required for duplicate detection');

      await expect(
        DuplicateDetectionService.checkProfileByEmail(undefined)
      ).rejects.toThrow('Email is required for duplicate detection');
    });

    test('should handle Firestore errors gracefully', async () => {
      const firestoreError = new Error('Firestore unavailable');
      firestoreError.code = 'unavailable';

      getDocs.mockRejectedValue(firestoreError);

      await expect(
        DuplicateDetectionService.checkProfileByEmail('test@gmail.com')
      ).rejects.toThrow('Firestore unavailable');
    });
  });

  describe('checkProfileByPhone', () => {
    test('should find existing profile by phone number', async () => {
      const mockProfile = {
        uid: 'existing-user-123',
        email: 'existing@gmail.com',
        phoneNumber: '0812345678',
        status: 'approved'
      };

      const mockQuerySnapshot = {
        empty: false,
        docs: [{
          id: 'existing-user-123',
          data: () => mockProfile
        }]
      };

      getDocs.mockResolvedValue(mockQuerySnapshot);

      const result = await DuplicateDetectionService.checkProfileByPhone('0812345678');

      expect(result).toEqual({
        id: 'existing-user-123',
        ...mockProfile
      });

      expect(query).toHaveBeenCalledWith(
        expect.anything(),
        where('phoneNumber', '==', '0812345678'),
        limit(1)
      );
    });

    test('should return null when no profile exists for phone', async () => {
      const mockQuerySnapshot = {
        empty: true,
        docs: []
      };

      getDocs.mockResolvedValue(mockQuerySnapshot);

      const result = await DuplicateDetectionService.checkProfileByPhone('0887654321');

      expect(result).toBeNull();
    });

    test('should handle phone number normalization', async () => {
      const mockQuerySnapshot = {
        empty: true,
        docs: []
      };

      getDocs.mockResolvedValue(mockQuerySnapshot);

      // Test with different formats
      await DuplicateDetectionService.checkProfileByPhone(' 081-234-5678 ');

      expect(query).toHaveBeenCalledWith(
        expect.anything(),
        where('phoneNumber', '==', '0812345678'),
        limit(1)
      );
    });
  });

  describe('hasCompleteProfile', () => {
    test('should return true for complete profile', () => {
      const completeProfile = {
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        phoneNumber: '0812345678',
        department: { value: 'accounting', label: 'สาขาวิชาการบัญชี' },
        userType: 'student'
      };

      const result = DuplicateDetectionService.hasCompleteProfile(completeProfile);
      expect(result).toBe(true);
    });

    test('should return false for incomplete profile', () => {
      const incompleteProfile = {
        firstName: 'สมชาย',
        lastName: '', // Missing
        phoneNumber: '0812345678',
        department: null, // Missing
        userType: 'student'
      };

      const result = DuplicateDetectionService.hasCompleteProfile(incompleteProfile);
      expect(result).toBe(false);
    });

    test('should handle null/undefined profile', () => {
      expect(DuplicateDetectionService.hasCompleteProfile(null)).toBe(false);
      expect(DuplicateDetectionService.hasCompleteProfile(undefined)).toBe(false);
      expect(DuplicateDetectionService.hasCompleteProfile({})).toBe(false);
    });
  });

  describe('getProfileStatus', () => {
    test('should return correct status for different profile states', () => {
      const approvedProfile = {
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        phoneNumber: '0812345678',
        department: { value: 'accounting', label: 'สาขาวิชาการบัญชี' },
        userType: 'student',
        status: 'approved'
      };

      const result = DuplicateDetectionService.getProfileStatus(approvedProfile);
      expect(result).toEqual({
        status: 'approved',
        isComplete: true,
        canEdit: true,
        nextSteps: []
      });
    });

    test('should return correct status for pending profile', () => {
      const pendingProfile = {
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        phoneNumber: '0812345678',
        department: { value: 'accounting', label: 'สาขาวิชาการบัญชี' },
        userType: 'student',
        status: 'pending'
      };

      const result = DuplicateDetectionService.getProfileStatus(pendingProfile);
      expect(result).toEqual({
        status: 'pending',
        isComplete: true,
        canEdit: false,
        nextSteps: ['รอการอนุมัติจากผู้ดูแลระบบ']
      });
    });

    test('should return correct status for incomplete profile', () => {
      const incompleteProfile = {
        firstName: 'สมชาย',
        lastName: '',
        phoneNumber: '',
        department: null,
        userType: '',
        status: 'incomplete'
      };

      const result = DuplicateDetectionService.getProfileStatus(incompleteProfile);
      expect(result.status).toBe('incomplete');
      expect(result.isComplete).toBe(false);
      expect(result.canEdit).toBe(true);
      expect(result.nextSteps).toContain('กรอกข้อมูลให้ครบถ้วน');
    });

    test('should return correct status for rejected profile', () => {
      const rejectedProfile = {
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        phoneNumber: '0812345678',
        department: { value: 'accounting', label: 'สาขาวิชาการบัญชี' },
        userType: 'student',
        status: 'rejected',
        rejectionReason: 'ข้อมูลไม่ถูกต้อง'
      };

      const result = DuplicateDetectionService.getProfileStatus(rejectedProfile);
      expect(result).toEqual({
        status: 'rejected',
        isComplete: true,
        canEdit: true,
        nextSteps: ['แก้ไขข้อมูลตามที่แจ้ง: ข้อมูลไม่ถูกต้อง', 'ส่งคำขออนุมัติใหม่']
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle malformed profile data', async () => {
      const malformedProfile = {
        // Missing required fields
        email: 'malformed@gmail.com'
      };

      const mockQuerySnapshot = {
        empty: false,
        docs: [{
          id: 'malformed-user',
          data: () => malformedProfile
        }]
      };

      getDocs.mockResolvedValue(mockQuerySnapshot);

      const result = await DuplicateDetectionService.checkProfileByEmail('malformed@gmail.com');

      expect(result).toEqual({
        id: 'malformed-user',
        ...malformedProfile
      });

      // Should still return the profile even if malformed
      expect(result.id).toBe('malformed-user');
    });

    test('should handle network timeouts', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.code = 'timeout';

      getDocs.mockRejectedValue(timeoutError);

      await expect(
        DuplicateDetectionService.checkProfileByEmail('test@gmail.com')
      ).rejects.toThrow('Request timeout');
    });

    test('should handle permission denied errors', async () => {
      const permissionError = new Error('Permission denied');
      permissionError.code = 'permission-denied';

      getDocs.mockRejectedValue(permissionError);

      await expect(
        DuplicateDetectionService.checkProfileByEmail('test@gmail.com')
      ).rejects.toThrow('Permission denied');
    });

    test('should handle quota exceeded errors', async () => {
      const quotaError = new Error('Quota exceeded');
      quotaError.code = 'resource-exhausted';

      getDocs.mockRejectedValue(quotaError);

      await expect(
        DuplicateDetectionService.checkProfileByEmail('test@gmail.com')
      ).rejects.toThrow('Quota exceeded');
    });
  });

  describe('Performance and Optimization', () => {
    test('should use proper query limits', async () => {
      const mockQuerySnapshot = {
        empty: true,
        docs: []
      };

      getDocs.mockResolvedValue(mockQuerySnapshot);

      await DuplicateDetectionService.checkProfileByEmail('test@gmail.com');

      expect(query).toHaveBeenCalledWith(
        expect.anything(),
        where('email', '==', 'test@gmail.com'),
        limit(1) // Should limit to 1 for efficiency
      );
    });

    test('should handle large result sets efficiently', async () => {
      // Mock a scenario where multiple profiles might match (shouldn't happen but test anyway)
      const mockProfiles = Array.from({ length: 100 }, (_, i) => ({
        id: `user-${i}`,
        data: () => ({
          uid: `user-${i}`,
          email: 'test@gmail.com',
          firstName: `User${i}`
        })
      }));

      const mockQuerySnapshot = {
        empty: false,
        docs: mockProfiles
      };

      getDocs.mockResolvedValue(mockQuerySnapshot);

      const result = await DuplicateDetectionService.checkProfileByEmail('test@gmail.com');

      // Should only return the first match due to limit(1)
      expect(result.id).toBe('user-0');
    });
  });

  describe('Data Consistency', () => {
    test('should handle profiles with different email cases', async () => {
      const mockProfile = {
        uid: 'test-user',
        email: 'Test@Gmail.Com', // Mixed case in database
        firstName: 'สมชาย'
      };

      const mockQuerySnapshot = {
        empty: false,
        docs: [{
          id: 'test-user',
          data: () => mockProfile
        }]
      };

      getDocs.mockResolvedValue(mockQuerySnapshot);

      // Search with lowercase
      const result = await DuplicateDetectionService.checkProfileByEmail('test@gmail.com');

      expect(result).toBeDefined();
      expect(result.email).toBe('Test@Gmail.Com'); // Should return original case from database
    });

    test('should handle profiles with whitespace in data', async () => {
      const mockProfile = {
        uid: 'test-user',
        email: ' test@gmail.com ', // Whitespace in database
        firstName: ' สมชาย ',
        lastName: ' ใจดี '
      };

      const mockQuerySnapshot = {
        empty: false,
        docs: [{
          id: 'test-user',
          data: () => mockProfile
        }]
      };

      getDocs.mockResolvedValue(mockQuerySnapshot);

      const result = await DuplicateDetectionService.checkProfileByEmail('test@gmail.com');

      expect(result).toBeDefined();
      expect(result.firstName).toBe(' สมชาย '); // Should return original data
    });
  });
});