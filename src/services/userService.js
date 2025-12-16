import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  getDoc,
  serverTimestamp,
  orderBy,
  limit as firestoreLimit,
  startAfter
} from 'firebase/firestore';
import { db } from '../config/firebase';

class UserService {
  // Get all users with pending approval
  static async getPendingUsers() {
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef, 
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const users = [];
      
      querySnapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return users;
    } catch (error) {
      console.error('Error getting pending users:', error);
      throw error;
    }
  }

  // Get all users (for admin management)
  static async getAllUsers() {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'));
      
      const querySnapshot = await getDocs(q);
      const users = [];
      
      querySnapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return users;
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  // Approve a user
  static async approveUser(userId, approvedBy) {
    try {
      console.log('✅ Approving user:', userId);
      const userDocRef = doc(db, 'users', userId);
      
      // Update user status
      await updateDoc(userDocRef, {
        status: 'approved',
        approvedBy: approvedBy,
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ User approved successfully:', userId);
      
      // Send notification to user (non-blocking)
      try {
        const { default: NotificationService } = await import('./notificationService');
        await NotificationService.notifyUserApprovalStatus(userId, true, approvedBy);
        console.log('✅ Approval notification sent');
      } catch (notificationError) {
        console.error('⚠️ Error sending approval notification (non-critical):', notificationError);
        // Don't throw - notification failure shouldn't fail the approval
      }
      
      // Send Discord notification (non-blocking)
      try {
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.exists() ? userDoc.data() : {};
        const { default: discordWebhookService } = await import('./discordWebhookService');
        await discordWebhookService.notifyUserApproved(userData, approvedBy);
        console.log('✅ Discord approval notification sent');
      } catch (discordError) {
        console.error('⚠️ Error sending Discord notification (non-critical):', discordError);
      }
      
      return { success: true, message: 'อนุมัติผู้ใช้สำเร็จ' };
    } catch (error) {
      console.error('❌ Error approving user:', error);
      throw new Error(`ไม่สามารถอนุมัติผู้ใช้ได้: ${error.message}`);
    }
  }

  // Reject a user
  static async rejectUser(userId, rejectedBy, reason = '') {
    try {
      console.log('❌ Rejecting user:', userId);
      const userDocRef = doc(db, 'users', userId);
      
      await updateDoc(userDocRef, {
        status: 'rejected',
        rejectedBy: rejectedBy,
        rejectionReason: reason,
        rejectedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('❌ User rejected successfully:', userId);
      
      // Send notification to user (non-blocking)
      try {
        const { default: NotificationService } = await import('./notificationService');
        await NotificationService.notifyUserApprovalStatus(userId, false, rejectedBy, reason);
        console.log('✅ Rejection notification sent');
      } catch (notificationError) {
        console.error('⚠️ Error sending rejection notification (non-critical):', notificationError);
        // Don't throw - notification failure shouldn't fail the rejection
      }
      
      // Send Discord notification (non-blocking)
      try {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.exists() ? userDoc.data() : {};
        const { default: discordWebhookService } = await import('./discordWebhookService');
        await discordWebhookService.notifyUserRejected(userData, rejectedBy, reason);
        console.log('✅ Discord rejection notification sent');
      } catch (discordError) {
        console.error('⚠️ Error sending Discord notification (non-critical):', discordError);
      }
      
      return { success: true, message: 'ปฏิเสธผู้ใช้สำเร็จ' };
    } catch (error) {
      console.error('❌ Error rejecting user:', error);
      throw new Error(`ไม่สามารถปฏิเสธผู้ใช้ได้: ${error.message}`);
    }
  }

  // Suspend a user
  static async suspendUser(userId, suspendedBy, reason = '') {
    try {
      const userDocRef = doc(db, 'users', userId);
      
      await updateDoc(userDocRef, {
        status: 'suspended',
        suspendedBy: suspendedBy,
        suspensionReason: reason,
        suspendedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error suspending user:', error);
      throw error;
    }
  }

  // Reactivate a suspended user
  static async reactivateUser(userId, reactivatedBy) {
    try {
      const userDocRef = doc(db, 'users', userId);
      
      await updateDoc(userDocRef, {
        status: 'approved',
        reactivatedBy: reactivatedBy,
        reactivatedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Clear suspension fields
        suspendedBy: null,
        suspensionReason: null,
        suspendedAt: null
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error reactivating user:', error);
      throw error;
    }
  }

  // Update user role
  static async updateUserRole(userId, newRole, updatedBy) {
    try {
      const userDocRef = doc(db, 'users', userId);
      
      await updateDoc(userDocRef, {
        role: newRole,
        roleUpdatedBy: updatedBy,
        roleUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  // Get user statistics
  static async getUserStats() {
    try {
      const usersRef = collection(db, 'users');
      
      // Get all users
      const allUsersQuery = query(usersRef);
      const allUsersSnapshot = await getDocs(allUsersQuery);
      
      // Get pending users
      const pendingUsersQuery = query(usersRef, where('status', '==', 'pending'));
      const pendingUsersSnapshot = await getDocs(pendingUsersQuery);
      
      // Get approved users
      const approvedUsersQuery = query(usersRef, where('status', '==', 'approved'));
      const approvedUsersSnapshot = await getDocs(approvedUsersQuery);
      
      // Get suspended users
      const suspendedUsersQuery = query(usersRef, where('status', '==', 'suspended'));
      const suspendedUsersSnapshot = await getDocs(suspendedUsersQuery);
      
      // Get rejected users
      const rejectedUsersQuery = query(usersRef, where('status', '==', 'rejected'));
      const rejectedUsersSnapshot = await getDocs(rejectedUsersQuery);
      
      return {
        total: allUsersSnapshot.size,
        pending: pendingUsersSnapshot.size,
        approved: approvedUsersSnapshot.size,
        suspended: suspendedUsersSnapshot.size,
        rejected: rejectedUsersSnapshot.size
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  // Get users by status with pagination
  static async getUsersByStatus(status = 'all', limit = 20, lastDoc = null) {
    try {
      const usersRef = collection(db, 'users');
      const queryConstraints = [];

      // Add status filter
      if (status !== 'all') {
        queryConstraints.push(where('status', '==', status));
      }

      // Add ordering
      queryConstraints.push(orderBy('createdAt', 'desc'));

      // Add pagination
      if (lastDoc) {
        queryConstraints.push(startAfter(lastDoc));
      }
      queryConstraints.push(firestoreLimit(limit));

      // Build query once
      const q = query(usersRef, ...queryConstraints);

      const querySnapshot = await getDocs(q);
      const users = [];
      let lastVisible = null;

      querySnapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          ...doc.data()
        });
        lastVisible = doc;
      });

      return {
        users,
        lastDoc: lastVisible,
        hasMore: querySnapshot.size === limit
      };
    } catch (error) {
      console.error('Error getting users by status:', error);
      throw error;
    }
  }

  // Search users
  static async searchUsers(searchTerm, status = 'all') {
    try {
      const usersRef = collection(db, 'users');
      let q;

      if (status === 'all') {
        q = query(usersRef, orderBy('createdAt', 'desc'));
      } else {
        q = query(
          usersRef,
          where('status', '==', status),
          orderBy('createdAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const users = [];

      querySnapshot.forEach((doc) => {
        const userData = { id: doc.id, ...doc.data() };
        const searchLower = searchTerm.toLowerCase();

        // Search in name, email, department
        if (
          userData.displayName?.toLowerCase().includes(searchLower) ||
          userData.email?.toLowerCase().includes(searchLower) ||
          userData.firstName?.toLowerCase().includes(searchLower) ||
          userData.lastName?.toLowerCase().includes(searchLower) ||
          userData.department?.label?.toLowerCase().includes(searchLower) ||
          userData.department?.toLowerCase().includes(searchLower)
        ) {
          users.push(userData);
        }
      });

      return users;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  // Update user profile (can be used by user themselves or admin)
  static async updateUserProfile(userId, updates, updatedBy = null) {
    try {
      const userDocRef = doc(db, 'users', userId);

      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      // Only add updatedBy if provided (for admin updates)
      if (updatedBy) {
        updateData.updatedBy = updatedBy;
      }

      await updateDoc(userDocRef, updateData);

      return { success: true };
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Get user by ID
  static async getUserById(userId) {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        return {
          id: userDoc.id,
          ...userDoc.data()
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }

  // Delete user (soft delete - set status to deleted)
  static async deleteUser(userId, deletedBy) {
    try {
      console.log('🗑️ Deleting user:', userId);
      const userDocRef = doc(db, 'users', userId);
      
      // Check if user exists
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        throw new Error('ไม่พบผู้ใช้ที่ต้องการลบ');
      }

      // Soft delete - update status to deleted
      await updateDoc(userDocRef, {
        status: 'deleted',
        deletedBy: deletedBy,
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: false
      });
      
      console.log('✅ User deleted successfully:', userId);
      return { success: true, message: 'ลบผู้ใช้สำเร็จ' };
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      throw new Error(`ไม่สามารถลบผู้ใช้ได้: ${error.message}`);
    }
  }

  // Hard delete user (permanently remove from database)
  static async hardDeleteUser(userId, deletedBy) {
    try {
      console.log('🗑️ Permanently deleting user:', userId);
      const userDocRef = doc(db, 'users', userId);
      
      // Check if user exists
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        throw new Error('ไม่พบผู้ใช้ที่ต้องการลบ');
      }

      // Hard delete
      await deleteDoc(userDocRef);
      
      console.log('✅ User permanently deleted:', userId);
      return { success: true, message: 'ลบผู้ใช้ถาวรสำเร็จ' };
    } catch (error) {
      console.error('❌ Error permanently deleting user:', error);
      throw new Error(`ไม่สามารถลบผู้ใช้ถาวรได้: ${error.message}`);
    }
  }
}

export default UserService;