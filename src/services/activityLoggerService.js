import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  getDocs,
  serverTimestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Activity Logger Service
 * Handles audit trail and activity logging for the equipment management system
 */
class ActivityLoggerService {
  static COLLECTION_NAME = 'equipmentAuditLog';
  static USER_ACTIVITY_COLLECTION = 'userActivityLog';

  // Activity types
  static ACTIVITY_TYPES = {
    // Equipment activities
    EQUIPMENT_CREATED: 'equipment_created',
    EQUIPMENT_UPDATED: 'equipment_updated',
    EQUIPMENT_DELETED: 'equipment_deleted',
    EQUIPMENT_VIEWED: 'equipment_viewed',
    EQUIPMENT_EXPORTED: 'equipment_exported',
    
    // Bulk operations
    BULK_UPDATE: 'bulk_update',
    BULK_DELETE: 'bulk_delete',
    BULK_EXPORT: 'bulk_export',
    
    // Image operations
    IMAGE_UPLOADED: 'image_uploaded',
    IMAGE_DELETED: 'image_deleted',
    
    // Category operations
    CATEGORY_CREATED: 'category_created',
    CATEGORY_UPDATED: 'category_updated',
    CATEGORY_DELETED: 'category_deleted',
    
    // Report operations
    REPORT_GENERATED: 'report_generated',
    REPORT_EXPORTED: 'report_exported',
    
    // System activities
    USER_LOGIN: 'user_login',
    USER_LOGOUT: 'user_logout',
    PERMISSION_DENIED: 'permission_denied',
    SYSTEM_ERROR: 'system_error'
  };

  // Severity levels
  static SEVERITY_LEVELS = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  };

  /**
   * Log equipment activity
   * @param {string} activityType - Type of activity
   * @param {Object} data - Activity data
   * @param {string} userId - User ID performing the action
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<string>} Activity log ID
   */
  static async logEquipmentActivity(activityType, data, userId, metadata = {}) {
    try {
      const activity = {
        activityType,
        resourceType: 'equipment',
        resourceId: data.equipmentId || null,
        userId,
        timestamp: serverTimestamp(),
        
        // Activity details
        details: {
          equipmentNumber: data.equipmentNumber || null,
          equipmentName: data.equipmentName || null,
          changes: data.changes || null,
          previousValues: data.previousValues || null,
          newValues: data.newValues || null,
          affectedFields: data.affectedFields || [],
          reason: data.reason || null
        },
        
        // Technical metadata
        metadata: {
          ipAddress: this.getClientIP(),
          userAgent: navigator.userAgent,
          sessionId: this.getSessionId(),
          browserInfo: this.getBrowserInfo(),
          timestamp: new Date().toISOString(),
          ...metadata
        },
        
        // Severity and classification
        severity: this.getSeverityLevel(activityType),
        category: this.getActivityCategory(activityType),
        
        // Search and filtering
        searchKeywords: this.generateSearchKeywords(data),
        tags: data.tags || []
      };

      // Add user information
      const userInfo = await this.getUserInfo(userId);
      if (userInfo) {
        activity.userInfo = {
          displayName: userInfo.displayName || userInfo.firstName + ' ' + userInfo.lastName,
          email: userInfo.email,
          role: userInfo.role,
          department: userInfo.department
        };
      }

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), activity);
      
      // Also log to user activity collection for user-specific tracking
      await this.logUserActivity(userId, activityType, {
        resourceType: 'equipment',
        resourceId: data.equipmentId,
        activityLogId: docRef.id
      });

      return docRef.id;
    } catch (error) {
      console.error('Error logging equipment activity:', error);
      // Don't throw error to avoid breaking main functionality
      return null;
    }
  }

  /**
   * Log user activity
   * @param {string} userId - User ID
   * @param {string} activityType - Type of activity
   * @param {Object} data - Activity data
   * @returns {Promise<string>} Activity log ID
   */
  static async logUserActivity(userId, activityType, data = {}) {
    try {
      const activity = {
        userId,
        activityType,
        timestamp: serverTimestamp(),
        data,
        metadata: {
          ipAddress: this.getClientIP(),
          userAgent: navigator.userAgent,
          sessionId: this.getSessionId()
        }
      };

      const docRef = await addDoc(collection(db, this.USER_ACTIVITY_COLLECTION), activity);
      return docRef.id;
    } catch (error) {
      console.error('Error logging user activity:', error);
      return null;
    }
  }

  /**
   * Log permission denied attempt
   * @param {string} userId - User ID
   * @param {string} attemptedAction - Action that was attempted
   * @param {string} resource - Resource that was accessed
   * @param {string} reason - Reason for denial
   */
  static async logPermissionDenied(userId, attemptedAction, resource, reason) {
    await this.logEquipmentActivity(
      this.ACTIVITY_TYPES.PERMISSION_DENIED,
      {
        attemptedAction,
        resource,
        reason
      },
      userId,
      {
        severity: this.SEVERITY_LEVELS.MEDIUM,
        requiresReview: true
      }
    );
  }

  /**
   * Log system error
   * @param {Error} error - Error object
   * @param {string} context - Context where error occurred
   * @param {string} userId - User ID (optional)
   */
  static async logSystemError(error, context, userId = null) {
    await this.logEquipmentActivity(
      this.ACTIVITY_TYPES.SYSTEM_ERROR,
      {
        errorMessage: error.message,
        errorStack: error.stack,
        context
      },
      userId || 'system',
      {
        severity: this.SEVERITY_LEVELS.HIGH,
        requiresReview: true
      }
    );
  }

  /**
   * Get audit log entries with filters
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Object>} Audit log entries with pagination
   */
  static async getAuditLog(filters = {}) {
    try {
      const {
        userId = null,
        resourceId = null,
        activityTypes = [],
        dateRange = null,
        severity = null,
        category = null,
        searchQuery = '',
        sortBy = 'timestamp',
        sortOrder = 'desc',
        pageSize = 50,
        lastDoc = null
      } = filters;

      let auditQuery = collection(db, this.COLLECTION_NAME);
      const queryConstraints = [];

      // Add filters
      if (userId) {
        queryConstraints.push(where('userId', '==', userId));
      }

      if (resourceId) {
        queryConstraints.push(where('resourceId', '==', resourceId));
      }

      if (activityTypes.length > 0) {
        queryConstraints.push(where('activityType', 'in', activityTypes));
      }

      if (severity) {
        queryConstraints.push(where('severity', '==', severity));
      }

      if (category) {
        queryConstraints.push(where('category', '==', category));
      }

      if (dateRange) {
        if (dateRange.start) {
          queryConstraints.push(where('timestamp', '>=', dateRange.start));
        }
        if (dateRange.end) {
          queryConstraints.push(where('timestamp', '<=', dateRange.end));
        }
      }

      // Add search filter
      if (searchQuery && searchQuery.length >= 2) {
        const searchKeywords = this.generateSearchKeywords({ searchQuery });
        queryConstraints.push(where('searchKeywords', 'array-contains-any', searchKeywords));
      }

      // Add sorting and pagination
      queryConstraints.push(orderBy(sortBy, sortOrder));
      
      if (lastDoc) {
        queryConstraints.push(startAfter(lastDoc));
      }
      
      queryConstraints.push(limit(pageSize + 1)); // Get one extra to check if there's next page

      // Build and execute query
      auditQuery = query(auditQuery, ...queryConstraints);
      const querySnapshot = await getDocs(auditQuery);
      
      const entries = [];
      let hasNextPage = false;
      
      querySnapshot.forEach((doc, index) => {
        if (index < pageSize) {
          const data = doc.data();
          entries.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate() || new Date()
          });
        } else {
          hasNextPage = true;
        }
      });

      return {
        entries,
        pagination: {
          hasNextPage,
          totalItems: entries.length,
          pageSize
        },
        lastDoc: entries.length > 0 ? querySnapshot.docs[Math.min(entries.length - 1, pageSize - 1)] : null
      };
    } catch (error) {
      console.error('Error getting audit log:', error);
      throw error;
    }
  }

  /**
   * Get user activity summary
   * @param {string} userId - User ID
   * @param {Object} dateRange - Date range filter
   * @returns {Promise<Object>} Activity summary
   */
  static async getUserActivitySummary(userId, dateRange = null) {
    try {
      let activityQuery = collection(db, this.COLLECTION_NAME);
      const queryConstraints = [where('userId', '==', userId)];

      if (dateRange) {
        if (dateRange.start) {
          queryConstraints.push(where('timestamp', '>=', dateRange.start));
        }
        if (dateRange.end) {
          queryConstraints.push(where('timestamp', '<=', dateRange.end));
        }
      }

      queryConstraints.push(orderBy('timestamp', 'desc'));
      queryConstraints.push(limit(1000)); // Reasonable limit for summary

      activityQuery = query(activityQuery, ...queryConstraints);
      const querySnapshot = await getDocs(activityQuery);

      const summary = {
        totalActivities: 0,
        activityBreakdown: {},
        severityBreakdown: {},
        recentActivities: [],
        mostActiveDay: null,
        activityTrend: []
      };

      const dailyActivity = {};

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const timestamp = data.timestamp?.toDate() || new Date();
        const dayKey = timestamp.toISOString().split('T')[0];

        summary.totalActivities++;

        // Activity type breakdown
        summary.activityBreakdown[data.activityType] = 
          (summary.activityBreakdown[data.activityType] || 0) + 1;

        // Severity breakdown
        summary.severityBreakdown[data.severity] = 
          (summary.severityBreakdown[data.severity] || 0) + 1;

        // Daily activity tracking
        dailyActivity[dayKey] = (dailyActivity[dayKey] || 0) + 1;

        // Recent activities (first 10)
        if (summary.recentActivities.length < 10) {
          summary.recentActivities.push({
            id: doc.id,
            activityType: data.activityType,
            timestamp: timestamp,
            details: data.details
          });
        }
      });

      // Find most active day
      let maxActivity = 0;
      Object.entries(dailyActivity).forEach(([day, count]) => {
        if (count > maxActivity) {
          maxActivity = count;
          summary.mostActiveDay = { date: day, count };
        }
      });

      // Activity trend (last 7 days)
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayKey = date.toISOString().split('T')[0];
        last7Days.push({
          date: dayKey,
          count: dailyActivity[dayKey] || 0
        });
      }
      summary.activityTrend = last7Days;

      return summary;
    } catch (error) {
      console.error('Error getting user activity summary:', error);
      throw error;
    }
  }

  /**
   * Get system activity statistics
   * @param {Object} dateRange - Date range filter
   * @returns {Promise<Object>} System statistics
   */
  static async getSystemActivityStats(dateRange = null) {
    try {
      let statsQuery = collection(db, this.COLLECTION_NAME);
      const queryConstraints = [];

      if (dateRange) {
        if (dateRange.start) {
          queryConstraints.push(where('timestamp', '>=', dateRange.start));
        }
        if (dateRange.end) {
          queryConstraints.push(where('timestamp', '<=', dateRange.end));
        }
      }

      queryConstraints.push(orderBy('timestamp', 'desc'));
      queryConstraints.push(limit(5000)); // Reasonable limit for stats

      statsQuery = query(statsQuery, ...queryConstraints);
      const querySnapshot = await getDocs(statsQuery);

      const stats = {
        totalActivities: 0,
        uniqueUsers: new Set(),
        activityTypes: {},
        severityLevels: {},
        topUsers: {},
        errorCount: 0,
        permissionDeniedCount: 0,
        dailyActivity: {}
      };

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const timestamp = data.timestamp?.toDate() || new Date();
        const dayKey = timestamp.toISOString().split('T')[0];

        stats.totalActivities++;
        stats.uniqueUsers.add(data.userId);

        // Activity type breakdown
        stats.activityTypes[data.activityType] = 
          (stats.activityTypes[data.activityType] || 0) + 1;

        // Severity breakdown
        stats.severityLevels[data.severity] = 
          (stats.severityLevels[data.severity] || 0) + 1;

        // Top users
        stats.topUsers[data.userId] = (stats.topUsers[data.userId] || 0) + 1;

        // Error tracking
        if (data.activityType === this.ACTIVITY_TYPES.SYSTEM_ERROR) {
          stats.errorCount++;
        }

        if (data.activityType === this.ACTIVITY_TYPES.PERMISSION_DENIED) {
          stats.permissionDeniedCount++;
        }

        // Daily activity
        stats.dailyActivity[dayKey] = (stats.dailyActivity[dayKey] || 0) + 1;
      });

      // Convert unique users set to count
      stats.uniqueUsers = stats.uniqueUsers.size;

      // Sort top users
      stats.topUsers = Object.entries(stats.topUsers)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .reduce((obj, [userId, count]) => {
          obj[userId] = count;
          return obj;
        }, {});

      return stats;
    } catch (error) {
      console.error('Error getting system activity stats:', error);
      throw error;
    }
  }

  // Helper methods

  /**
   * Get user information
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} User information
   */
  static async getUserInfo(userId) {
    try {
      if (!userId || userId === 'system') return null;
      
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data();
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  }

  /**
   * Get severity level for activity type
   * @param {string} activityType - Activity type
   * @returns {string} Severity level
   */
  static getSeverityLevel(activityType) {
    const severityMap = {
      [this.ACTIVITY_TYPES.EQUIPMENT_VIEWED]: this.SEVERITY_LEVELS.LOW,
      [this.ACTIVITY_TYPES.EQUIPMENT_CREATED]: this.SEVERITY_LEVELS.MEDIUM,
      [this.ACTIVITY_TYPES.EQUIPMENT_UPDATED]: this.SEVERITY_LEVELS.MEDIUM,
      [this.ACTIVITY_TYPES.EQUIPMENT_DELETED]: this.SEVERITY_LEVELS.HIGH,
      [this.ACTIVITY_TYPES.BULK_DELETE]: this.SEVERITY_LEVELS.HIGH,
      [this.ACTIVITY_TYPES.PERMISSION_DENIED]: this.SEVERITY_LEVELS.MEDIUM,
      [this.ACTIVITY_TYPES.SYSTEM_ERROR]: this.SEVERITY_LEVELS.HIGH
    };

    return severityMap[activityType] || this.SEVERITY_LEVELS.LOW;
  }

  /**
   * Get activity category
   * @param {string} activityType - Activity type
   * @returns {string} Activity category
   */
  static getActivityCategory(activityType) {
    if (activityType.startsWith('equipment_')) return 'equipment';
    if (activityType.startsWith('bulk_')) return 'bulk_operation';
    if (activityType.startsWith('category_')) return 'category';
    if (activityType.startsWith('report_')) return 'report';
    if (activityType.startsWith('user_')) return 'user';
    return 'system';
  }

  /**
   * Generate search keywords for activity
   * @param {Object} data - Activity data
   * @returns {Array<string>} Search keywords
   */
  static generateSearchKeywords(data) {
    const keywords = new Set();
    
    // Add keywords from various fields
    if (data.equipmentNumber) {
      keywords.add(data.equipmentNumber.toLowerCase());
    }
    
    if (data.equipmentName) {
      data.equipmentName.toLowerCase().split(' ').forEach(word => {
        if (word.length >= 2) keywords.add(word);
      });
    }
    
    if (data.searchQuery) {
      data.searchQuery.toLowerCase().split(' ').forEach(word => {
        if (word.length >= 2) keywords.add(word);
      });
    }
    
    return Array.from(keywords);
  }

  /**
   * Get client IP address (placeholder - would need backend implementation)
   * @returns {string} IP address
   */
  static getClientIP() {
    // This would typically be handled by the backend
    return 'unknown';
  }

  /**
   * Get session ID
   * @returns {string} Session ID
   */
  static getSessionId() {
    // Generate or retrieve session ID
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2);
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  /**
   * Get browser information
   * @returns {Object} Browser information
   */
  static getBrowserInfo() {
    return {
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }
}

export default ActivityLoggerService;