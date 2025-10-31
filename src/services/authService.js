import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../config/firebase';

class AuthService {
  // Sign in with Google
  static async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user email is allowed (@gmail.com or @g.lpru.ac.th)
      const allowedDomains = ['gmail.com', 'g.lpru.ac.th'];
      const userDomain = user.email.split('@')[1];
      
      if (!allowedDomains.includes(userDomain)) {
        await this.signOut();
        throw new Error('อีเมลของคุณไม่ได้รับอนุญาตให้เข้าใช้งานระบบ กรุณาใช้อีเมล @gmail.com หรือ @g.lpru.ac.th');
      }
      
      // Check if user exists in Firestore
      const userDoc = await this.getUserProfile(user.uid);
      
      if (!userDoc) {
        // Create new user profile with pending status
        await this.createUserProfile(user);
      }
      
      return user;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  }

  // Sign out
  static async signOut() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  // Get user profile from Firestore
  static async getUserProfile(uid) {
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  // Create user profile in Firestore
  static async createUserProfile(user, additionalData = {}) {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: 'user', // Default role
        status: 'incomplete', // Profile not yet completed
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...additionalData
      };
      
      await setDoc(userDocRef, userData);
      return userData;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  // Check if user needs to complete profile setup
  static needsProfileSetup(userProfile) {
    if (!userProfile) return true;
    
    return (
      userProfile.status === 'incomplete' ||
      !userProfile.firstName ||
      !userProfile.lastName ||
      !userProfile.phoneNumber ||
      !userProfile.department ||
      !userProfile.userType
    );
  }

  // Update user profile
  static async updateUserProfile(uid, data) {
    try {
      const userDocRef = doc(db, 'users', uid);
      const updateData = {
        ...data,
        updatedAt: serverTimestamp()
      };
      
      await setDoc(userDocRef, updateData, { merge: true });
      
      // If this is a profile completion (status changing to pending), notify admins
      if (data.status === 'pending' && data.firstName && data.lastName) {
        try {
          // Import NotificationService dynamically to avoid circular dependency
          const { default: NotificationService } = await import('./notificationService');
          await NotificationService.notifyAdminsNewUser({
            uid,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email || 'ไม่ระบุ'
          });
        } catch (notificationError) {
          console.error('Error sending notification to admins:', notificationError);
          // Don't throw error here as profile update was successful
        }
      }
      
      return updateData;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Listen to auth state changes
  static onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  }

  // Get current user
  static getCurrentUser() {
    return auth.currentUser;
  }
}

export default AuthService;