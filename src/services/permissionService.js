import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Permission Service for Equipment Management System
 * Handles role-based access control and permission validation
 */
class PermissionService {
  // Define roles and their hierarchy
  static ROLES = {
    VIEWER: 'viewer',
    EDITOR: 'editor', 
    ADMIN: 'admin'
  };

  // Define permissions for each role
  static PERMISSIONS = {
    // Equipment permissions
    EQUIPMENT_VIEW: 'equipment:view',
    EQUIPMENT_CREATE: 'equipment:create',
    EQUIPMENT_UPDATE: 'equipment:update',
    EQUIPMENT_DELETE: 'equipment:delete',
    EQUIPMENT_BULK_EDIT: 'equipment:bulk_edit',
    EQUIPMENT_BULK_DELETE: 'equipment:bulk_delete',
    
    // Category permissions
    CATEGORY_VIEW: 'category:view',
    CATEGORY_MANAGE: 'category:manage',
    
    // Report permissions
    REPORT_VIEW: 'report:view',
    REPORT_GENERATE: 'report:generate',
    
    // Audit permissions
    AUDIT_VIEW: 'audit:view',
    AUDIT_MANAGE: 'audit:manage',
    
    // User management permissions
    USER_VIEW: 'user:view',
    USER_MANAGE: 'user:manage',
    
    // System permissions
    SYSTEM_SETTINGS: 'system:settings'
  };

  // Role-permission mapping
  static ROLE_PERMISSIONS = {
    [this.ROLES.VIEWER]: [
      this.PERMISSIONS.EQUIPMENT_VIEW,
      this.PERMISSIONS.CATEGORY_VIEW,
      this.PERMISSIONS.REPORT_VIEW
    ],
    [this.ROLES.EDITOR]: [
      this.PERMISSIONS.EQUIPMENT_VIEW,
      this.PERMISSIONS.EQUIPMENT_CREATE,
      this.PERMISSIONS.EQUIPMENT_UPDATE,
      this.PERMISSIONS.CATEGORY_VIEW,
      this.PERMISSIONS.REPORT_VIEW,
      this.PERMISSIONS.REPORT_GENERATE
    ],
    [this.ROLES.ADMIN]: [
      this.PERMISSIONS.EQUIPMENT_VIEW,
      this.PERMISSIONS.EQUIPMENT_CREATE,
      this.PERMISSIONS.EQUIPMENT_UPDATE,
      this.PERMISSIONS.EQUIPMENT_DELETE,
      this.PERMISSIONS.EQUIPMENT_BULK_EDIT,
      this.PERMISSIONS.EQUIPMENT_BULK_DELETE,
      this.PERMISSIONS.CATEGORY_VIEW,
      this.PERMISSIONS.CATEGORY_MANAGE,
      this.PERMISSIONS.REPORT_VIEW,
      this.PERMISSIONS.REPORT_GENERATE,
      this.PERMISSIONS.AUDIT_VIEW,
      this.PERMISSIONS.AUDIT_MANAGE,
      this.PERMISSIONS.USER_VIEW,
      this.PERMISSIONS.USER_MANAGE,
      this.PERMISSIONS.SYSTEM_SETTINGS
    ]
  };

  /**
   * Get user permissions based on role
   * @param {string} role - User role
   * @returns {Array<string>} Array of permissions
   */
  static getUserPermissions(role) {
    if (!role || !this.ROLE_PERMISSIONS[role]) {
      return [];
    }
    return this.ROLE_PERMISSIONS[role];
  }

  /**
   * Check if user has specific permission
   * @param {Object} user - User object with role
   * @param {string} permission - Permission to check
   * @returns {boolean} True if user has permission
   */
  static hasPermission(user, permission) {
    if (!user || !user.role) {
      return false;
    }

    // Admin has all permissions
    if (user.role === this.ROLES.ADMIN) {
      return true;
    }

    const userPermissions = this.getUserPermissions(user.role);
    return userPermissions.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   * @param {Object} user - User object with role
   * @param {Array<string>} permissions - Array of permissions to check
   * @returns {boolean} True if user has any of the permissions
   */
  static hasAnyPermission(user, permissions) {
    return permissions.some(permission => this.hasPermission(user, permission));
  }

  /**
   * Check if user has all specified permissions
   * @param {Object} user - User object with role
   * @param {Array<string>} permissions - Array of permissions to check
   * @returns {boolean} True if user has all permissions
   */
  static hasAllPermissions(user, permissions) {
    return permissions.every(permission => this.hasPermission(user, permission));
  }

  /**
   * Validate user access to equipment operations
   * @param {Object} user - User object
   * @param {string} operation - Operation type (view, create, update, delete)
   * @param {Object} equipment - Equipment object (optional, for ownership checks)
   * @returns {Object} Validation result
   */
  static validateEquipmentAccess(user, operation, equipment = null) {
    const result = {
      allowed: false,
      reason: null,
      requiredRole: null
    };

    // Check if user is authenticated
    if (!user) {
      result.reason = 'ผู้ใช้ไม่ได้เข้าสู่ระบบ';
      result.requiredRole = this.ROLES.VIEWER;
      return result;
    }

    // Check if user profile is approved (skip for admin)
    if (user.role !== this.ROLES.ADMIN && user.status !== 'approved') {
      result.reason = 'บัญชีผู้ใช้ยังไม่ได้รับการอนุมัติ';
      result.requiredRole = this.ROLES.VIEWER;
      return result;
    }

    // Map operations to permissions
    const operationPermissions = {
      view: this.PERMISSIONS.EQUIPMENT_VIEW,
      create: this.PERMISSIONS.EQUIPMENT_CREATE,
      update: this.PERMISSIONS.EQUIPMENT_UPDATE,
      delete: this.PERMISSIONS.EQUIPMENT_DELETE,
      bulk_edit: this.PERMISSIONS.EQUIPMENT_BULK_EDIT,
      bulk_delete: this.PERMISSIONS.EQUIPMENT_BULK_DELETE
    };

    const requiredPermission = operationPermissions[operation];
    if (!requiredPermission) {
      result.reason = 'การดำเนินการไม่ถูกต้อง';
      return result;
    }

    // Check permission
    if (!this.hasPermission(user, requiredPermission)) {
      result.reason = 'คุณไม่มีสิทธิ์ในการดำเนินการนี้';
      result.requiredRole = this.getMinimumRoleForPermission(requiredPermission);
      return result;
    }

    // Additional checks for specific operations
    if (operation === 'update' || operation === 'delete') {
      // Editors can only modify equipment they created (unless they're admin)
      if (user.role === this.ROLES.EDITOR && equipment && equipment.createdBy !== user.uid) {
        result.reason = 'คุณสามารถแก้ไขได้เฉพาะอุปกรณ์ที่คุณสร้างเท่านั้น';
        result.requiredRole = this.ROLES.ADMIN;
        return result;
      }
    }

    result.allowed = true;
    return result;
  }

  /**
   * Get minimum role required for a permission
   * @param {string} permission - Permission to check
   * @returns {string} Minimum role required
   */
  static getMinimumRoleForPermission(permission) {
    for (const [role, permissions] of Object.entries(this.ROLE_PERMISSIONS)) {
      if (permissions.includes(permission)) {
        return role;
      }
    }
    return this.ROLES.ADMIN;
  }

  /**
   * Check if user can access audit logs
   * @param {Object} user - User object
   * @returns {boolean} True if user can access audit logs
   */
  static canAccessAuditLogs(user) {
    return this.hasPermission(user, this.PERMISSIONS.AUDIT_VIEW);
  }

  /**
   * Check if user can manage system settings
   * @param {Object} user - User object
   * @returns {boolean} True if user can manage system settings
   */
  static canManageSystem(user) {
    return this.hasPermission(user, this.PERMISSIONS.SYSTEM_SETTINGS);
  }

  /**
   * Get user role display information
   * @param {string} role - User role
   * @returns {Object} Role display information
   */
  static getRoleDisplayInfo(role) {
    const roleInfo = {
      [this.ROLES.VIEWER]: {
        name: 'ผู้ดู',
        description: 'สามารถดูข้อมูลอุปกรณ์และรายงานได้',
        color: 'blue',
        icon: 'eye'
      },
      [this.ROLES.EDITOR]: {
        name: 'ผู้แก้ไข',
        description: 'สามารถเพิ่มและแก้ไขข้อมูลอุปกรณ์ได้',
        color: 'green',
        icon: 'edit'
      },
      [this.ROLES.ADMIN]: {
        name: 'ผู้ดูแลระบบ',
        description: 'มีสิทธิ์เต็มในการจัดการระบบทั้งหมด',
        color: 'red',
        icon: 'shield'
      }
    };

    return roleInfo[role] || {
      name: 'ไม่ระบุ',
      description: 'ไม่มีสิทธิ์ในการเข้าถึง',
      color: 'gray',
      icon: 'user'
    };
  }

  /**
   * Validate bulk operations access
   * @param {Object} user - User object
   * @param {string} operation - Bulk operation type
   * @param {Array} equipmentList - List of equipment to operate on
   * @returns {Object} Validation result
   */
  static validateBulkAccess(user, operation, equipmentList = []) {
    const result = {
      allowed: false,
      reason: null,
      allowedItems: [],
      deniedItems: []
    };

    // Map bulk operations to basic operations for permission checking
    const operationMap = {
      bulk_edit: 'update',
      bulk_delete: 'delete'
    };
    
    const baseOperation = operationMap[operation] || operation;
    
    // Check basic permission first
    const basicValidation = this.validateEquipmentAccess(user, baseOperation);
    if (!basicValidation.allowed) {
      result.reason = basicValidation.reason;
      return result;
    }

    // For editors, check ownership of each item
    if (user.role === this.ROLES.EDITOR && operation !== 'view') {
      equipmentList.forEach(equipment => {
        if (equipment.createdBy === user.uid) {
          result.allowedItems.push(equipment.id);
        } else {
          result.deniedItems.push(equipment.id);
        }
      });

      if (result.deniedItems.length > 0) {
        result.reason = `คุณไม่มีสิทธิ์แก้ไขอุปกรณ์ ${result.deniedItems.length} รายการ`;
      }
    } else {
      // Admin can access all items
      result.allowedItems = equipmentList.map(eq => eq.id);
    }

    result.allowed = result.allowedItems.length > 0;
    return result;
  }

  /**
   * Get user's effective permissions (for UI display)
   * @param {Object} user - User object
   * @returns {Object} Effective permissions object
   */
  static getEffectivePermissions(user) {
    if (!user || !user.role) {
      return {};
    }

    const permissions = this.getUserPermissions(user.role);
    const effectivePermissions = {};

    // Convert permission array to object for easier checking
    permissions.forEach(permission => {
      const [resource, action] = permission.split(':');
      if (!effectivePermissions[resource]) {
        effectivePermissions[resource] = {};
      }
      effectivePermissions[resource][action] = true;
    });

    return effectivePermissions;
  }

  /**
   * Refresh user permissions (fetch latest from database)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated user data
   */
  static async refreshUserPermissions(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      }
      
      return null;
    } catch (error) {
      console.error('Error refreshing user permissions:', error);
      throw error;
    }
  }
}

export default PermissionService;