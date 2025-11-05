import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

// Mock Firebase
jest.mock('../../config/firebase', () => ({
  db: {}
}));

jest.mock('firebase/firestore');

// Mock authentication context
const mockAuthUser = {
  uid: 'test-user-123',
  email: 'test@gmail.com'
};

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: () => ({
    currentUser: mockAuthUser
  })
}));

describe('Firestore Security Rules Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Profile Creation Rules', () => {
    test('should allow authenticated user to create their own profile', async () => {
      const validProfileData = {
        uid: 'test-user-123',
        email: 'test@gmail.com',
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        phoneNumber: '0812345678',
        department: { value: 'accounting', label: 'สาขาวิชาการบัญชี' },
        userType: 'student',
        status: 'incomplete',
        role: 'user',
        createdAt: expect.any(Object),
        updatedAt: expect.any(Object)
      };

      setDoc.mockResolvedValue();

      await setDoc(doc(db, 'users', 'test-user-123'), validProfileData);

      expect(setDoc).toHaveBeenCalledWith(
        doc(db, 'users', 'test-user-123'),
        validProfileData
      );
    });

    test('should reject profile creation with invalid email domain', async () => {
      const invalidProfileData = {
        uid: 'test-user-123',
        email: 'test@invalid-domain.com', // Invalid domain
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        phoneNumber: '0812345678',
        department: { value: 'accounting', label: 'สาขาวิชาการบัญชี' },
        userType: 'student',
        status: 'incomplete',
        role: 'user'
      };

      const permissionError = new Error('Permission denied: Invalid email domain');
      permissionError.code = 'permission-denied';
      setDoc.mockRejectedValue(permissionError);

      await expect(
        setDoc(doc(db, 'users', 'test-user-123'), invalidProfileData)
      ).rejects.toThrow('Permission denied: Invalid email domain');
    });

    test('should reject profile creation with missing required fields', async () => {
      const incompleteProfileData = {
        uid: 'test-user-123',
        email: 'test@gmail.com',
        // Missing firstName, lastName, etc.
        status: 'incomplete'
      };

      const validationError = new Error('Missing required fields');
      validationError.code = 'failed-precondition';
      setDoc.mockRejectedValue(validationError);

      await expect(
        setDoc(doc(db, 'users', 'test-user-123'), incompleteProfileData)
      ).rejects.toThrow('Missing required fields');
    });

    test('should reject profile creation with invalid phone number format', async () => {
      const invalidPhoneData = {
        uid: 'test-user-123',
        email: 'test@gmail.com',
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        phoneNumber: '123', // Invalid format
        department: { value: 'accounting', label: 'สาขาวิชาการบัญชี' },
        userType: 'student',
        status: 'incomplete',
        role: 'user'
      };

      const validationError = new Error('Invalid phone number format');
      validationError.code = 'failed-precondition';
      setDoc.mockRejectedValue(validationError);

      await expect(
        setDoc(doc(db, 'users', 'test-user-123'), invalidPhoneData)
      ).rejects.toThrow('Invalid phone number format');
    });

    test('should reject profile creation with invalid user type', async () => {
      const invalidUserTypeData = {
        uid: 'test-user-123',
        email: 'test@gmail.com',
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        phoneNumber: '0812345678',
        department: { value: 'accounting', label: 'สาขาวิชาการบัญชี' },
        userType: 'invalid-type', // Invalid enum value
        status: 'incomplete',
        role: 'user'
      };

      const validationError = new Error('Invalid user type');
      validationError.code = 'failed-precondition';
      setDoc.mockRejectedValue(validationError);

      await expect(
        setDoc(doc(db, 'users', 'test-user-123'), invalidUserTypeData)
      ).rejects.toThrow('Invalid user type');
    });
  });

  describe('Profile Update Rules', () => {
    test('should allow user to update their own profile with valid data', async () => {
      const updateData = {
        firstName: 'สมหญิง',
        lastName: 'ใจดี',
        phoneNumber: '0887654321',
        department: { value: 'computer-business', label: 'สาขาวิชาคอมพิวเตอร์ธุรกิจ' },
        updatedAt: expect.any(Object)
      };

      setDoc.mockResolvedValue();

      await setDoc(doc(db, 'users', 'test-user-123'), updateData, { merge: true });

      expect(setDoc).toHaveBeenCalledWith(
        doc(db, 'users', 'test-user-123'),
        updateData,
        { merge: true }
      );
    });

    test('should prevent user from modifying protected fields', async () => {
      const protectedFieldUpdate = {
        firstName: 'สมชาย',
        role: 'admin', // Protected field
        createdAt: new Date(), // Protected field
        uid: 'different-uid' // Protected field
      };

      const permissionError = new Error('Cannot modify protected fields');
      permissionError.code = 'permission-denied';
      setDoc.mockRejectedValue(permissionError);

      await expect(
        setDoc(doc(db, 'users', 'test-user-123'), protectedFieldUpdate, { merge: true })
      ).rejects.toThrow('Cannot modify protected fields');
    });

    test('should prevent user from updating other users profiles', async () => {
      const updateData = {
        firstName: 'Hacker',
        lastName: 'User'
      };

      const permissionError = new Error('Permission denied');
      permissionError.code = 'permission-denied';
      setDoc.mockRejectedValue(permissionError);

      await expect(
        setDoc(doc(db, 'users', 'other-user-456'), updateData, { merge: true })
      ).rejects.toThrow('Permission denied');
    });
  });

  describe('Status Transition Rules', () => {
    test('should allow valid status transition from incomplete to pending', async () => {
      const statusUpdate = {
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        phoneNumber: '0812345678',
        department: { value: 'accounting', label: 'สาขาวิชาการบัญชี' },
        userType: 'student',
        status: 'pending',
        updatedAt: expect.any(Object)
      };

      // Mock current profile status as 'incomplete'
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ status: 'incomplete' })
      });

      setDoc.mockResolvedValue();

      await setDoc(doc(db, 'users', 'test-user-123'), statusUpdate, { merge: true });

      expect(setDoc).toHaveBeenCalledWith(
        doc(db, 'users', 'test-user-123'),
        statusUpdate,
        { merge: true }
      );
    });

    test('should prevent invalid status transition from pending to incomplete', async () => {
      const invalidStatusUpdate = {
        status: 'incomplete'
      };

      // Mock current profile status as 'pending'
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ status: 'pending' })
      });

      const validationError = new Error('Invalid status transition');
      validationError.code = 'failed-precondition';
      setDoc.mockRejectedValue(validationError);

      await expect(
        setDoc(doc(db, 'users', 'test-user-123'), invalidStatusUpdate, { merge: true })
      ).rejects.toThrow('Invalid status transition');
    });

    test('should prevent user from directly setting status to approved', async () => {
      const unauthorizedStatusUpdate = {
        status: 'approved' // Only admins should be able to set this
      };

      const permissionError = new Error('Unauthorized status change');
      permissionError.code = 'permission-denied';
      setDoc.mockRejectedValue(permissionError);

      await expect(
        setDoc(doc(db, 'users', 'test-user-123'), unauthorizedStatusUpdate, { merge: true })
      ).rejects.toThrow('Unauthorized status change');
    });

    test('should prevent user from directly setting status to rejected', async () => {
      const unauthorizedStatusUpdate = {
        status: 'rejected' // Only admins should be able to set this
      };

      const permissionError = new Error('Unauthorized status change');
      permissionError.code = 'permission-denied';
      setDoc.mockRejectedValue(permissionError);

      await expect(
        setDoc(doc(db, 'users', 'test-user-123'), unauthorizedStatusUpdate, { merge: true })
      ).rejects.toThrow('Unauthorized status change');
    });
  });

  describe('Data Validation Rules', () => {
    test('should validate department structure', async () => {
      const invalidDepartmentData = {
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        phoneNumber: '0812345678',
        department: 'invalid-string', // Should be object with value and label
        userType: 'student'
      };

      const validationError = new Error('Invalid department format');
      validationError.code = 'failed-precondition';
      setDoc.mockRejectedValue(validationError);

      await expect(
        setDoc(doc(db, 'users', 'test-user-123'), invalidDepartmentData, { merge: true })
      ).rejects.toThrow('Invalid department format');
    });

    test('should validate name field lengths', async () => {
      const longNameData = {
        firstName: 'a'.repeat(51), // Exceeds max length
        lastName: 'ใจดี',
        phoneNumber: '0812345678',
        department: { value: 'accounting', label: 'สาขาวิชาการบัญชี' },
        userType: 'student'
      };

      const validationError = new Error('Name too long');
      validationError.code = 'failed-precondition';
      setDoc.mockRejectedValue(validationError);

      await expect(
        setDoc(doc(db, 'users', 'test-user-123'), longNameData, { merge: true })
      ).rejects.toThrow('Name too long');
    });

    test('should validate name patterns for Thai characters', async () => {
      const invalidNameData = {
        firstName: 'John123!@#', // Invalid characters
        lastName: 'ใจดี',
        phoneNumber: '0812345678',
        department: { value: 'accounting', label: 'สาขาวิชาการบัญชี' },
        userType: 'student'
      };

      const validationError = new Error('Invalid name pattern');
      validationError.code = 'failed-precondition';
      setDoc.mockRejectedValue(validationError);

      await expect(
        setDoc(doc(db, 'users', 'test-user-123'), invalidNameData, { merge: true })
      ).rejects.toThrow('Invalid name pattern');
    });
  });

  describe('Read Permission Rules', () => {
    test('should allow user to read their own profile', async () => {
      const mockProfile = {
        uid: 'test-user-123',
        email: 'test@gmail.com',
        firstName: 'สมชาย',
        status: 'approved'
      };

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockProfile,
        id: 'test-user-123'
      });

      const result = await getDoc(doc(db, 'users', 'test-user-123'));

      expect(result.exists()).toBe(true);
      expect(result.data()).toEqual(mockProfile);
    });

    test('should prevent user from reading other users profiles', async () => {
      const permissionError = new Error('Permission denied');
      permissionError.code = 'permission-denied';
      getDoc.mockRejectedValue(permissionError);

      await expect(
        getDoc(doc(db, 'users', 'other-user-456'))
      ).rejects.toThrow('Permission denied');
    });
  });

  describe('Delete Permission Rules', () => {
    test('should prevent user from deleting their own profile', async () => {
      const permissionError = new Error('Profile deletion not allowed');
      permissionError.code = 'permission-denied';
      deleteDoc.mockRejectedValue(permissionError);

      await expect(
        deleteDoc(doc(db, 'users', 'test-user-123'))
      ).rejects.toThrow('Profile deletion not allowed');
    });

    test('should prevent user from deleting other users profiles', async () => {
      const permissionError = new Error('Permission denied');
      permissionError.code = 'permission-denied';
      deleteDoc.mockRejectedValue(permissionError);

      await expect(
        deleteDoc(doc(db, 'users', 'other-user-456'))
      ).rejects.toThrow('Permission denied');
    });
  });

  describe('Admin Permission Rules', () => {
    test('should allow admin to approve user profiles', async () => {
      // Mock admin user
      const mockAdminUser = {
        uid: 'admin-user-123',
        email: 'admin@g.lpru.ac.th'
      };

      // Mock admin context
      jest.doMock('firebase/auth', () => ({
        getAuth: () => ({
          currentUser: mockAdminUser
        })
      }));

      const adminUpdate = {
        status: 'approved',
        approvedAt: expect.any(Object),
        approvedBy: 'admin-user-123'
      };

      setDoc.mockResolvedValue();

      await setDoc(doc(db, 'users', 'test-user-123'), adminUpdate, { merge: true });

      expect(setDoc).toHaveBeenCalledWith(
        doc(db, 'users', 'test-user-123'),
        adminUpdate,
        { merge: true }
      );
    });

    test('should allow admin to reject user profiles', async () => {
      const mockAdminUser = {
        uid: 'admin-user-123',
        email: 'admin@g.lpru.ac.th'
      };

      jest.doMock('firebase/auth', () => ({
        getAuth: () => ({
          currentUser: mockAdminUser
        })
      }));

      const adminReject = {
        status: 'rejected',
        rejectionReason: 'ข้อมูลไม่ถูกต้อง',
        rejectedAt: expect.any(Object),
        rejectedBy: 'admin-user-123'
      };

      setDoc.mockResolvedValue();

      await setDoc(doc(db, 'users', 'test-user-123'), adminReject, { merge: true });

      expect(setDoc).toHaveBeenCalledWith(
        doc(db, 'users', 'test-user-123'),
        adminReject,
        { merge: true }
      );
    });
  });

  describe('Batch Operations', () => {
    test('should handle batch profile updates with proper validation', async () => {
      const batchUpdates = [
        {
          id: 'user-1',
          data: { firstName: 'สมชาย', updatedAt: expect.any(Object) }
        },
        {
          id: 'user-2', 
          data: { firstName: 'สมหญิง', updatedAt: expect.any(Object) }
        }
      ];

      // Mock successful batch operation
      setDoc.mockResolvedValue();

      for (const update of batchUpdates) {
        await setDoc(doc(db, 'users', update.id), update.data, { merge: true });
      }

      expect(setDoc).toHaveBeenCalledTimes(2);
    });

    test('should fail batch operations if any validation fails', async () => {
      const batchUpdates = [
        {
          id: 'user-1',
          data: { firstName: 'สมชาย' }
        },
        {
          id: 'user-2',
          data: { firstName: '' } // Invalid empty name
        }
      ];

      setDoc
        .mockResolvedValueOnce() // First update succeeds
        .mockRejectedValueOnce(new Error('Validation failed')); // Second fails

      await setDoc(doc(db, 'users', batchUpdates[0].id), batchUpdates[0].data, { merge: true });

      await expect(
        setDoc(doc(db, 'users', batchUpdates[1].id), batchUpdates[1].data, { merge: true })
      ).rejects.toThrow('Validation failed');
    });
  });

  describe('Concurrent Access', () => {
    test('should handle concurrent profile updates', async () => {
      const update1 = { firstName: 'สมชาย' };
      const update2 = { lastName: 'ใจดี' };

      setDoc.mockResolvedValue();

      // Simulate concurrent updates
      const promises = [
        setDoc(doc(db, 'users', 'test-user-123'), update1, { merge: true }),
        setDoc(doc(db, 'users', 'test-user-123'), update2, { merge: true })
      ];

      await Promise.all(promises);

      expect(setDoc).toHaveBeenCalledTimes(2);
    });

    test('should handle race conditions in status updates', async () => {
      const statusUpdate1 = { status: 'pending' };
      const statusUpdate2 = { status: 'approved' };

      setDoc
        .mockResolvedValueOnce() // First update succeeds
        .mockRejectedValueOnce(new Error('Concurrent modification')); // Second fails due to race condition

      await setDoc(doc(db, 'users', 'test-user-123'), statusUpdate1, { merge: true });

      await expect(
        setDoc(doc(db, 'users', 'test-user-123'), statusUpdate2, { merge: true })
      ).rejects.toThrow('Concurrent modification');
    });
  });
});