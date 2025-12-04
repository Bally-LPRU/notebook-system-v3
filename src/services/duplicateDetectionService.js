import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { logFirebaseError } from '../utils/errorLogger';

/**
 * Service for detecting and preventing duplicate user profiles
 * Implements requirements 8.1, 8.2, 8.3, 8.4
 */
class DuplicateDetectionService {
  /**
   * Check if a profile exists for the given email address
   * @param {string} email - Email address to check
   * @returns {Promise<Object|null>} - User profile if exists, null otherwise
   */
  static async checkProfileByEmail(email) {
    try {
      if (!email) {
        throw new Error('Email is required for duplicate detection');
      }

      const normalizedEmail = email.toLowerCase().trim();
      console.log('🔍 Checking for existing profile with email:', normalizedEmail);

      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('email', '==', normalizedEmail),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const profile = { id: userDoc.id, ...userDoc.data() };
        
        console.log('✅ Found existing profile:', {
          uid: profile.uid,
          email: profile.email,
          status: profile.status,
          hasCompleteProfile: this.hasCompleteProfile(profile)
        });
        
        return profile;
      }
      
      console.log('ℹ️ No existing profile found for email:', email);
      return null;
    } catch (error) {
      console.error('🚨 Error checking profile by email:', error);

      logFirebaseError(error, 'firestore', 'checkProfileByEmail', { email });
      throw error;
    }
  }

  /**
   * Check if a profile exists for the given phone number
   * @param {string} phoneNumber - Phone number to check
   * @returns {Promise<Object|null>} - User profile if exists, null otherwise
   */
  static async checkProfileByPhone(phoneNumber) {
    try {
      if (!phoneNumber) {
        return null;
      }

      const cleanPhone = phoneNumber.replace(/[-\s]/g, '');
      console.log('🔍 Checking for existing profile with phone:', cleanPhone);

      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('phoneNumber', '==', cleanPhone),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const profile = { id: userDoc.id, ...userDoc.data() };
        
        console.log('✅ Found existing profile with phone:', {
          uid: profile.uid,
          email: profile.email,
          status: profile.status
        });
        
        return profile;
      }
      
      return null;
    } catch (error) {
      console.error('🚨 Error checking profile by phone:', error);
      logFirebaseError(error, 'firestore', 'checkProfileByPhone', { phoneNumber });
      throw error;
    }
  }

  /**
   * Comprehensive duplicate detection check
   * @param {string} email - Email address to check
   * @param {string} phoneNumber - Phone number to check (optional)
   * @returns {Promise<Object>} - Detection result with profile info and recommendations
   */
  static async detectDuplicates(email, phoneNumber = null) {
    try {
      const results = {
        hasDuplicate: false,
        duplicateType: null,
        existingProfile: null,
        recommendedAction: null,
        message: null
      };

      // Check by email (primary check)
      const emailProfile = await this.checkProfileByEmail(email);
      if (emailProfile) {
        results.hasDuplicate = true;
        results.duplicateType = 'email';
        results.existingProfile = emailProfile;
        results.recommendedAction = this.getRecommendedAction(emailProfile);
        results.message = this.getDuplicateMessage(emailProfile);
        return results;
      }

      // Check by phone number (secondary check)
      if (phoneNumber) {
        const phoneProfile = await this.checkProfileByPhone(phoneNumber);
        if (phoneProfile) {
          results.hasDuplicate = true;
          results.duplicateType = 'phone';
          results.existingProfile = phoneProfile;
          results.recommendedAction = 'contact_admin';
          results.message = 'พบเบอร์โทรศัพท์นี้ในระบบแล้ว กรุณาติดต่อผู้ดูแลระบบ';
          return results;
        }
      }

      return results;
    } catch (error) {
      console.error('🚨 Error in duplicate detection:', error);
      // Return no duplicate result instead of throwing to allow profile creation
      console.warn('⚠️ Duplicate detection failed, allowing profile creation to continue');
      return {
        hasDuplicate: false,
        duplicateType: null,
        existingProfile: null,
        recommendedAction: null,
        message: null
      };
    }
  }

  /**
   * Check if a profile has complete information
   * @param {Object} profile - User profile object
   * @returns {boolean} - True if profile is complete
   */
  static hasCompleteProfile(profile) {
    if (!profile) return false;
    
    return !!(
      profile.firstName &&
      profile.lastName &&
      profile.phoneNumber &&
      profile.department &&
      profile.userType &&
      profile.status !== 'incomplete'
    );
  }

  /**
   * Get recommended action based on existing profile status
   * @param {Object} profile - Existing user profile
   * @returns {string} - Recommended action
   */
  static getRecommendedAction(profile) {
    if (!profile) return 'create_new';

    switch (profile.status) {
      case 'incomplete':
        return 'complete_profile';
      case 'pending':
        return 'show_pending_status';
      case 'approved':
        return 'redirect_to_dashboard';
      case 'rejected':
        return 'show_rejected_status';
      default:
        return 'contact_admin';
    }
  }

  /**
   * Get appropriate message for duplicate profile
   * @param {Object} profile - Existing user profile
   * @returns {string} - User-friendly message in Thai
   */
  static getDuplicateMessage(profile) {
    if (!profile) return '';

    switch (profile.status) {
      case 'incomplete':
        return 'พบบัญชีของคุณในระบบแล้ว กรุณาเข้าสู่ระบบเพื่อกรอกข้อมูลให้ครบถ้วน';
      case 'pending':
        return 'บัญชีของคุณอยู่ระหว่างการตรวจสอบ กรุณารอการอนุมัติจากผู้ดูแลระบบ';
      case 'approved':
        return 'บัญชีของคุณได้รับการอนุมัติแล้ว กรุณาเข้าสู่ระบบเพื่อใช้งาน';
      case 'rejected':
        return 'บัญชีของคุณไม่ได้รับการอนุมัติ กรุณาติดต่อผู้ดูแลระบบสำหรับข้อมูลเพิ่มเติม';
      default:
        return 'พบบัญชีของคุณในระบบแล้ว กรุณาติดต่อผู้ดูแลระบบ';
    }
  }

  /**
   * Get dashboard route based on user profile status
   * @param {Object} profile - User profile object
   * @returns {string} - Route path to redirect to
   */
  static getDashboardRoute(profile) {
    if (!profile) return '/';

    switch (profile.status) {
      case 'incomplete':
        return '/profile-setup';
      case 'pending':
        return '/pending-approval';
      case 'approved':
        return profile.role === 'admin' ? '/admin' : '/dashboard';
      case 'rejected':
        return '/account-rejected';
      default:
        return '/';
    }
  }

  /**
   * Get status display information for UI
   * @param {Object} profile - User profile object
   * @returns {Object} - Status display information
   */
  static getStatusDisplayInfo(profile) {
    if (!profile) {
      return {
        status: 'unknown',
        title: 'ไม่พบข้อมูล',
        message: 'ไม่พบข้อมูลผู้ใช้ในระบบ',
        color: 'gray',
        icon: 'question-mark-circle',
        nextSteps: ['กรุณาติดต่อผู้ดูแลระบบ']
      };
    }

    switch (profile.status) {
      case 'incomplete':
        return {
          status: 'incomplete',
          title: 'ข้อมูลไม่ครบถ้วน',
          message: 'กรุณากรอกข้อมูลโปรไฟล์ให้ครบถ้วนเพื่อใช้งานระบบ',
          color: 'yellow',
          icon: 'exclamation-triangle',
          nextSteps: [
            'กรอกข้อมูลส่วนตัวให้ครบถ้วน',
            'เลือกสังกัดและประเภทผู้ใช้',
            'บันทึกข้อมูลเพื่อส่งขออนุมัติ'
          ]
        };
      case 'pending':
        return {
          status: 'pending',
          title: 'รอการอนุมัติ',
          message: 'บัญชีของคุณอยู่ระหว่างการตรวจสอบจากผู้ดูแลระบบ',
          color: 'blue',
          icon: 'clock',
          nextSteps: [
            'รอการอนุมัติจากผู้ดูแลระบบ (1-2 วันทำการ)',
            'ตรวจสอบสถานะอีกครั้งในภายหลัง',
            'ติดต่อผู้ดูแลระบบหากมีคำถาม'
          ]
        };
      case 'approved':
        return {
          status: 'approved',
          title: 'บัญชีได้รับการอนุมัติ',
          message: 'ยินดีต้อนรับ! คุณสามารถใช้งานระบบได้แล้ว',
          color: 'green',
          icon: 'check-circle',
          nextSteps: [
            'เข้าสู่ระบบเพื่อใช้งาน',
            'ดูรายการอุปกรณ์ที่สามารถยืมได้',
            'ทำการจองและยืมอุปกรณ์'
          ]
        };
      case 'rejected':
        return {
          status: 'rejected',
          title: 'บัญชีไม่ได้รับการอนุมัติ',
          message: 'บัญชีของคุณไม่ได้รับการอนุมัติ กรุณาติดต่อผู้ดูแลระบบ',
          color: 'red',
          icon: 'x-circle',
          nextSteps: [
            'ติดต่อผู้ดูแลระบบเพื่อสอบถามเหตุผล',
            'แก้ไขข้อมูลตามที่แนะนำ',
            'ส่งคำขออนุมัติใหม่หากจำเป็น'
          ]
        };
      default:
        return {
          status: 'unknown',
          title: 'สถานะไม่ทราบ',
          message: 'ไม่สามารถระบุสถานะบัญชีได้ กรุณาติดต่อผู้ดูแลระบบ',
          color: 'gray',
          icon: 'question-mark-circle',
          nextSteps: ['กรุณาติดต่อผู้ดูแลระบบ']
        };
    }
  }

  /**
   * Get simplified profile status summary for duplicate detection workflows
   * @param {Object} profile
   * @returns {{status: string, isComplete: boolean, canEdit: boolean, nextSteps: string[]}}
   */
  static getProfileStatus(profile) {
    if (!profile) {
      return {
        status: 'unknown',
        isComplete: false,
        canEdit: false,
        nextSteps: ['กรุณากรอกข้อมูลโปรไฟล์ให้ครบถ้วน']
      };
    }

    const status = profile.status || 'unknown';
    const isComplete = this.hasCompleteProfile(profile);

    switch (status) {
      case 'approved':
        return {
          status,
          isComplete,
          canEdit: true,
          nextSteps: []
        };
      case 'pending':
        return {
          status,
          isComplete,
          canEdit: false,
          nextSteps: ['รอการอนุมัติจากผู้ดูแลระบบ']
        };
      case 'incomplete':
        return {
          status,
          isComplete,
          canEdit: true,
          nextSteps: ['กรอกข้อมูลให้ครบถ้วน']
        };
      case 'rejected':
        return {
          status,
          isComplete,
          canEdit: true,
          nextSteps: [
            `แก้ไขข้อมูลตามที่แจ้ง: ${profile.rejectionReason || 'กรุณาตรวจสอบรายละเอียด'}`,
            'ส่งคำขออนุมัติใหม่'
          ]
        };
      default:
        return {
          status,
          isComplete,
          canEdit: true,
          nextSteps: ['ติดต่อผู้ดูแลระบบ']
        };
    }
  }
}

export default DuplicateDetectionService;