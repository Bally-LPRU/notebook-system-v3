import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  serverTimestamp,
  orderBy 
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
      const userDocRef = doc(db, 'users', userId);
      
      await updateDoc(userDocRef, {
        status: 'approved',
        approvedBy: approvedBy,
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Send notification to user
      try {
        const { default: NotificationService } = await import('./notificationService');
        await NotificationService.notifyUserApprovalStatus(userId, true, approvedBy);
      } catch (notificationError) {
        console.error('Error sending approval notification:', notificationError);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error approving user:', error);
      throw error;
    }
  }

  // Reject a user
  static async rejectUser(userId, rejectedBy, reason = '') {
    try {
      const userDocRef = doc(db, 'users', userId);
      
      await updateDoc(userDocRef, {
        status: 'rejected',
        rejectedBy: rejectedBy,
        rejectionReason: reason,
        rejectedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Send notification to user
      try {
        const { default: NotificationService } = await import('./notificationService');
        await NotificationService.notifyUserApprovalStatus(userId, false, rejectedBy, reason);
      } catch (notificationError) {
        console.error('Error sending rejection notification:', notificationError);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error rejecting user:', error);
      throw error;
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
      
      return {
        total: allUsersSnapshot.size,
        pending: pendingUsersSnapshot.size,
        approved: approvedUsersSnapshot.size,
        suspended: suspendedUsersSnapshot.size
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }
}

export default UserService;