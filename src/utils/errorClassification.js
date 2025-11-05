/**
 * Comprehensive Error Classification System
 * Provides error type categorization, Thai language messages, and retry logic
 * for profile management operations
 */

// Error types for comprehensive categorization
export const ERROR_TYPES = {
  // Network related errors
  NETWORK: 'network',
  NETWORK_TIMEOUT: 'network_timeout',
  NETWORK_OFFLINE: 'network_offline',
  
  // Permission and authentication errors
  PERMISSION: 'permission',
  PERMISSION_DENIED: 'permission_denied',
  AUTH_REQUIRED: 'auth_required',
  AUTH_EXPIRED: 'auth_expired',
  
  // Validation errors
  VALIDATION: 'validation',
  VALIDATION_REQUIRED: 'validation_required',
  VALIDATION_FORMAT: 'validation_format',
  VALIDATION_DUPLICATE: 'validation_duplicate',
  
  // Firestore specific errors
  FIRESTORE: 'firestore',
  FIRESTORE_UNAVAILABLE: 'firestore_unavailable',
  FIRESTORE_QUOTA: 'firestore_quota',
  FIRESTORE_RULES: 'firestore_rules',
  
  // Profile specific errors
  PROFILE: 'profile',
  PROFILE_NOT_FOUND: 'profile_not_found',
  PROFILE_INCOMPLETE: 'profile_incomplete',
  PROFILE_DUPLICATE: 'profile_duplicate',
  
  // Unknown/Generic errors
  UNKNOWN: 'unknown',
  SYSTEM: 'system'
};

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Thai language error messages for user-friendly display
export const ERROR_MESSAGES = {
  // Network errors
  [ERROR_TYPES.NETWORK]: {
    title: 'ปัญหาการเชื่อมต่อ',
    message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต',
    suggestion: 'ตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองใหม่อีกครั้ง',
    icon: '🌐'
  },
  [ERROR_TYPES.NETWORK_TIMEOUT]: {
    title: 'การเชื่อมต่อหมดเวลา',
    message: 'การเชื่อมต่อใช้เวลานานเกินไป',
    suggestion: 'ตรวจสอบความเร็วอินเทอร์เน็ตและลองใหม่อีกครั้ง',
    icon: '⏱️'
  },
  [ERROR_TYPES.NETWORK_OFFLINE]: {
    title: 'ไม่มีการเชื่อมต่ออินเทอร์เน็ต',
    message: 'อุปกรณ์ของคุณไม่ได้เชื่อมต่อกับอินเทอร์เน็ต',
    suggestion: 'เชื่อมต่อกับ Wi-Fi หรือเปิดข้อมูลมือถือ',
    icon: '📶'
  },
  
  // Permission errors
  [ERROR_TYPES.PERMISSION]: {
    title: 'ไม่มีสิทธิ์การเข้าถึง',
    message: 'คุณไม่มีสิทธิ์ในการดำเนินการนี้',
    suggestion: 'ติดต่อผู้ดูแลระบบหากคุณคิดว่านี่เป็นข้อผิดพลาด',
    icon: '🔒'
  },
  [ERROR_TYPES.PERMISSION_DENIED]: {
    title: 'การเข้าถึงถูกปฏิเสธ',
    message: 'ระบบปฏิเสธการเข้าถึงข้อมูลนี้',
    suggestion: 'ลองออกจากระบบและเข้าสู่ระบบใหม่',
    icon: '🚫'
  },
  [ERROR_TYPES.AUTH_REQUIRED]: {
    title: 'จำเป็นต้องเข้าสู่ระบบ',
    message: 'กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ',
    suggestion: 'คลิกปุ่มเข้าสู่ระบบด้วย Google',
    icon: '🔐'
  },
  [ERROR_TYPES.AUTH_EXPIRED]: {
    title: 'เซสชันหมดอายุ',
    message: 'เซสชันการเข้าสู่ระบบของคุณหมดอายุแล้ว',
    suggestion: 'กรุณาเข้าสู่ระบบใหม่อีกครั้ง',
    icon: '⏰'
  },
  
  // Validation errors
  [ERROR_TYPES.VALIDATION]: {
    title: 'ข้อมูลไม่ถูกต้อง',
    message: 'กรุณาตรวจสอบข้อมูลที่กรอกและแก้ไข',
    suggestion: 'ตรวจสอบฟิลด์ที่มีสีแดงและกรอกข้อมูลให้ถูกต้อง',
    icon: '⚠️'
  },
  [ERROR_TYPES.VALIDATION_REQUIRED]: {
    title: 'ข้อมูลไม่ครบถ้วน',
    message: 'กรุณากรอกข้อมูลในฟิลด์ที่จำเป็น',
    suggestion: 'ฟิลด์ที่มีเครื่องหมาย * จำเป็นต้องกรอก',
    icon: '📝'
  },
  [ERROR_TYPES.VALIDATION_FORMAT]: {
    title: 'รูปแบบข้อมูลไม่ถูกต้อง',
    message: 'ข้อมูลที่กรอกไม่ตรงตามรูปแบบที่กำหนด',
    suggestion: 'ตรวจสอบรูปแบบข้อมูลตามตัวอย่างที่แสดง',
    icon: '🔤'
  },
  [ERROR_TYPES.VALIDATION_DUPLICATE]: {
    title: 'ข้อมูลซ้ำ',
    message: 'ข้อมูลนี้มีอยู่ในระบบแล้ว',
    suggestion: 'ตรวจสอบข้อมูลหรือใช้ข้อมูลอื่น',
    icon: '🔄'
  },
  
  // Firestore errors
  [ERROR_TYPES.FIRESTORE]: {
    title: 'ปัญหาฐานข้อมูล',
    message: 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล',
    suggestion: 'ลองใหม่อีกครั้ง หากปัญหายังคงเกิดขึ้น กรุณาติดต่อผู้ดูแลระบบ',
    icon: '🗄️'
  },
  [ERROR_TYPES.FIRESTORE_UNAVAILABLE]: {
    title: 'ฐานข้อมูลไม่พร้อมใช้งาน',
    message: 'ฐานข้อมูลไม่สามารถใช้งานได้ในขณะนี้',
    suggestion: 'รอสักครู่แล้วลองใหม่อีกครั้ง',
    icon: '🔧'
  },
  [ERROR_TYPES.FIRESTORE_QUOTA]: {
    title: 'เกินขีดจำกัดการใช้งาน',
    message: 'การใช้งานเกินขีดจำกัดที่กำหนด',
    suggestion: 'ลองใหม่ในภายหลัง หรือติดต่อผู้ดูแลระบบ',
    icon: '📊'
  },
  [ERROR_TYPES.FIRESTORE_RULES]: {
    title: 'ข้อจำกัดของระบบ',
    message: 'การดำเนินการนี้ไม่ได้รับอนุญาตจากกฎของระบบ',
    suggestion: 'ตรวจสอบสิทธิ์การเข้าถึงหรือติดต่อผู้ดูแลระบบ',
    icon: '📋'
  },
  
  // Profile errors
  [ERROR_TYPES.PROFILE]: {
    title: 'ปัญหาโปรไฟล์',
    message: 'เกิดข้อผิดพลาดในการจัดการโปรไฟล์',
    suggestion: 'ลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ',
    icon: '👤'
  },
  [ERROR_TYPES.PROFILE_NOT_FOUND]: {
    title: 'ไม่พบโปรไฟล์',
    message: 'ไม่พบข้อมูลโปรไฟล์ของคุณในระบบ',
    suggestion: 'กรุณาสร้างโปรไฟล์ใหม่',
    icon: '🔍'
  },
  [ERROR_TYPES.PROFILE_INCOMPLETE]: {
    title: 'โปรไฟล์ไม่สมบูรณ์',
    message: 'ข้อมูลโปรไฟล์ของคุณยังไม่ครบถ้วน',
    suggestion: 'กรุณากรอกข้อมูลให้ครบถ้วนเพื่อใช้งานระบบ',
    icon: '📝'
  },
  [ERROR_TYPES.PROFILE_DUPLICATE]: {
    title: 'โปรไฟล์ซ้ำ',
    message: 'พบโปรไฟล์ของคุณในระบบแล้ว',
    suggestion: 'ไปที่หน้าแดชบอร์ดเพื่อดูสถานะโปรไฟล์',
    icon: '👥'
  },
  
  // Generic errors
  [ERROR_TYPES.UNKNOWN]: {
    title: 'เกิดข้อผิดพลาด',
    message: 'เกิดข้อผิดพลาดที่ไม่คาดคิด',
    suggestion: 'ลองใหม่อีกครั้ง หากปัญหายังคงเกิดขึ้น กรุณาติดต่อผู้ดูแลระบบ',
    icon: '❗'
  },
  [ERROR_TYPES.SYSTEM]: {
    title: 'ปัญหาระบบ',
    message: 'เกิดข้อผิดพลาดของระบบ',
    suggestion: 'ผู้ดูแลระบบได้รับแจ้งแล้ว กรุณาลองใหม่ในภายหลัง',
    icon: '⚙️'
  }
};

/**
 * Error Classification Engine
 * Analyzes errors and provides comprehensive classification
 */
export class ErrorClassifier {
  /**
   * Classify error based on error object, context, and operation
   */
  static classify(error, context = {}) {
    const classification = {
      type: ERROR_TYPES.UNKNOWN,
      severity: ERROR_SEVERITY.MEDIUM,
      retryable: false,
      retryDelay: 1000,
      maxRetries: 3,
      category: 'general',
      originalError: error,
      context,
      timestamp: new Date().toISOString()
    };

    if (!error) {
      return classification;
    }

    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code || '';

    // Network errors
    if (this._isNetworkError(error, errorMessage, errorCode)) {
      return this._classifyNetworkError(error, errorMessage, errorCode, classification);
    }

    // Authentication and permission errors
    if (this._isAuthError(error, errorMessage, errorCode)) {
      return this._classifyAuthError(error, errorMessage, errorCode, classification);
    }

    // Firestore errors
    if (this._isFirestoreError(error, errorMessage, errorCode)) {
      return this._classifyFirestoreError(error, errorMessage, errorCode, classification);
    }

    // Validation errors
    if (this._isValidationError(error, errorMessage, context)) {
      return this._classifyValidationError(error, errorMessage, context, classification);
    }

    // Profile specific errors
    if (this._isProfileError(error, errorMessage, context)) {
      return this._classifyProfileError(error, errorMessage, context, classification);
    }

    // Default classification for unknown errors
    classification.type = ERROR_TYPES.UNKNOWN;
    classification.severity = ERROR_SEVERITY.MEDIUM;
    classification.retryable = true;
    classification.category = 'unknown';

    return classification;
  }

  // Network error detection
  static _isNetworkError(error, errorMessage, errorCode) {
    return (
      errorCode === 'auth/network-request-failed' ||
      errorCode === 'unavailable' ||
      errorMessage.includes('network') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('offline') ||
      !navigator.onLine
    );
  }

  // Network error classification
  static _classifyNetworkError(error, errorMessage, errorCode, classification) {
    classification.category = 'network';
    classification.retryable = true;
    classification.maxRetries = 5;
    classification.severity = ERROR_SEVERITY.HIGH;

    if (!navigator.onLine) {
      classification.type = ERROR_TYPES.NETWORK_OFFLINE;
      classification.retryDelay = 5000;
      classification.severity = ERROR_SEVERITY.CRITICAL;
    } else if (errorMessage.includes('timeout')) {
      classification.type = ERROR_TYPES.NETWORK_TIMEOUT;
      classification.retryDelay = 3000;
    } else {
      classification.type = ERROR_TYPES.NETWORK;
      classification.retryDelay = 2000;
    }

    return classification;
  }

  // Authentication error detection
  static _isAuthError(error, errorMessage, errorCode) {
    return (
      errorCode?.startsWith('auth/') ||
      errorMessage.includes('authentication') ||
      errorMessage.includes('permission') ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('access denied')
    );
  }

  // Authentication error classification
  static _classifyAuthError(error, errorMessage, errorCode, classification) {
    classification.category = 'authentication';
    classification.retryable = true;
    classification.maxRetries = 2;

    switch (errorCode) {
      case 'auth/popup-blocked':
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        classification.type = ERROR_TYPES.AUTH_REQUIRED;
        classification.severity = ERROR_SEVERITY.MEDIUM;
        classification.retryDelay = 1000;
        break;
      
      case 'auth/network-request-failed':
        classification.type = ERROR_TYPES.NETWORK;
        classification.severity = ERROR_SEVERITY.HIGH;
        classification.retryDelay = 2000;
        break;
      
      case 'auth/user-token-expired':
      case 'auth/id-token-expired':
        classification.type = ERROR_TYPES.AUTH_EXPIRED;
        classification.severity = ERROR_SEVERITY.HIGH;
        classification.retryable = false;
        break;
      
      case 'permission-denied':
        classification.type = ERROR_TYPES.PERMISSION_DENIED;
        classification.severity = ERROR_SEVERITY.HIGH;
        classification.retryDelay = 1000;
        break;
      
      default:
        classification.type = ERROR_TYPES.PERMISSION;
        classification.severity = ERROR_SEVERITY.MEDIUM;
        break;
    }

    return classification;
  }

  // Firestore error detection
  static _isFirestoreError(error, errorMessage, errorCode) {
    return (
      errorCode?.startsWith('firestore/') ||
      errorCode === 'unavailable' ||
      errorCode === 'resource-exhausted' ||
      errorCode === 'failed-precondition' ||
      errorMessage.includes('firestore') ||
      errorMessage.includes('document') ||
      errorMessage.includes('collection')
    );
  }

  // Firestore error classification
  static _classifyFirestoreError(error, errorMessage, errorCode, classification) {
    classification.category = 'firestore';
    classification.retryable = true;
    classification.maxRetries = 3;

    switch (errorCode) {
      case 'unavailable':
        classification.type = ERROR_TYPES.FIRESTORE_UNAVAILABLE;
        classification.severity = ERROR_SEVERITY.HIGH;
        classification.retryDelay = 3000;
        classification.maxRetries = 5;
        break;
      
      case 'resource-exhausted':
        classification.type = ERROR_TYPES.FIRESTORE_QUOTA;
        classification.severity = ERROR_SEVERITY.CRITICAL;
        classification.retryDelay = 10000;
        classification.maxRetries = 2;
        break;
      
      case 'failed-precondition':
      case 'permission-denied':
        classification.type = ERROR_TYPES.FIRESTORE_RULES;
        classification.severity = ERROR_SEVERITY.HIGH;
        classification.retryDelay = 1000;
        break;
      
      default:
        classification.type = ERROR_TYPES.FIRESTORE;
        classification.severity = ERROR_SEVERITY.MEDIUM;
        classification.retryDelay = 2000;
        break;
    }

    return classification;
  }

  // Validation error detection
  static _isValidationError(error, errorMessage, context) {
    return (
      context.operation === 'validation' ||
      errorMessage.includes('validation') ||
      errorMessage.includes('required') ||
      errorMessage.includes('invalid') ||
      errorMessage.includes('format') ||
      errorMessage.includes('กรุณา') ||
      errorMessage.includes('ไม่ถูกต้อง')
    );
  }

  // Validation error classification
  static _classifyValidationError(error, errorMessage, context, classification) {
    classification.category = 'validation';
    classification.retryable = false;
    classification.severity = ERROR_SEVERITY.LOW;

    if (errorMessage.includes('required') || errorMessage.includes('กรุณา')) {
      classification.type = ERROR_TYPES.VALIDATION_REQUIRED;
    } else if (errorMessage.includes('format') || errorMessage.includes('รูปแบบ')) {
      classification.type = ERROR_TYPES.VALIDATION_FORMAT;
    } else if (errorMessage.includes('duplicate') || errorMessage.includes('ซ้ำ')) {
      classification.type = ERROR_TYPES.VALIDATION_DUPLICATE;
    } else {
      classification.type = ERROR_TYPES.VALIDATION;
    }

    return classification;
  }

  // Profile error detection
  static _isProfileError(error, errorMessage, context) {
    return (
      context.operation?.includes('profile') ||
      errorMessage.includes('profile') ||
      errorMessage.includes('โปรไฟล์') ||
      errorMessage.includes('user not found') ||
      errorMessage.includes('incomplete')
    );
  }

  // Profile error classification
  static _classifyProfileError(error, errorMessage, context, classification) {
    classification.category = 'profile';
    classification.retryable = true;
    classification.maxRetries = 2;
    classification.severity = ERROR_SEVERITY.MEDIUM;

    if (errorMessage.includes('not found') || errorMessage.includes('ไม่พบ')) {
      classification.type = ERROR_TYPES.PROFILE_NOT_FOUND;
      classification.retryable = false;
    } else if (errorMessage.includes('incomplete') || errorMessage.includes('ไม่สมบูรณ์')) {
      classification.type = ERROR_TYPES.PROFILE_INCOMPLETE;
      classification.retryable = false;
    } else if (errorMessage.includes('duplicate') || errorMessage.includes('ซ้ำ')) {
      classification.type = ERROR_TYPES.PROFILE_DUPLICATE;
      classification.retryable = false;
    } else {
      classification.type = ERROR_TYPES.PROFILE;
    }

    return classification;
  }

  /**
   * Get user-friendly error message
   */
  static getErrorMessage(classification) {
    const errorInfo = ERROR_MESSAGES[classification.type] || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN];
    
    return {
      ...errorInfo,
      severity: classification.severity,
      retryable: classification.retryable,
      timestamp: classification.timestamp
    };
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  static calculateRetryDelay(baseDelay, attemptNumber, maxDelay = 30000) {
    const exponentialDelay = baseDelay * Math.pow(2, attemptNumber - 1);
    const jitteredDelay = exponentialDelay + (Math.random() * 1000); // Add jitter
    return Math.min(jitteredDelay, maxDelay);
  }

  /**
   * Check if error should be retried
   */
  static shouldRetry(classification, currentAttempt) {
    return (
      classification.retryable &&
      currentAttempt < classification.maxRetries &&
      classification.severity !== ERROR_SEVERITY.CRITICAL
    );
  }
}

export default ErrorClassifier;