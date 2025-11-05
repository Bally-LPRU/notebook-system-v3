import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PermissionService from '../services/permissionService';

/**
 * Custom hook for permission management
 * Provides easy access to user permissions and validation functions
 */
export const usePermissions = () => {
  const { userProfile } = useAuth();

  // Memoize permissions to avoid recalculation
  const permissions = useMemo(() => {
    if (!userProfile) {
      return {
        role: null,
        permissions: [],
        effectivePermissions: {},
        hasPermission: () => false,
        hasAnyPermission: () => false,
        hasAllPermissions: () => false,
        canViewEquipment: false,
        canCreateEquipment: false,
        canUpdateEquipment: false,
        canDeleteEquipment: false,
        canBulkEdit: false,
        canBulkDelete: false,
        canExportEquipment: false,
        canManageCategories: false,
        canViewReports: false,
        canGenerateReports: false,
        canViewAudit: false,
        canManageAudit: false,
        canManageUsers: false,
        canManageSystem: false,
        validateEquipmentAccess: () => ({ allowed: false, reason: 'ไม่ได้เข้าสู่ระบบ' }),
        validateBulkAccess: () => ({ allowed: false, reason: 'ไม่ได้เข้าสู่ระบบ' }),
        getRoleDisplayInfo: () => PermissionService.getRoleDisplayInfo(null)
      };
    }

    const userPermissions = PermissionService.getUserPermissions(userProfile.role);
    const effectivePermissions = PermissionService.getEffectivePermissions(userProfile);

    return {
      role: userProfile.role,
      permissions: userPermissions,
      effectivePermissions,
      
      // Permission checking functions
      hasPermission: (permission) => PermissionService.hasPermission(userProfile, permission),
      hasAnyPermission: (permissionList) => PermissionService.hasAnyPermission(userProfile, permissionList),
      hasAllPermissions: (permissionList) => PermissionService.hasAllPermissions(userProfile, permissionList),
      
      // Equipment permissions
      canViewEquipment: PermissionService.hasPermission(userProfile, PermissionService.PERMISSIONS.EQUIPMENT_VIEW),
      canCreateEquipment: PermissionService.hasPermission(userProfile, PermissionService.PERMISSIONS.EQUIPMENT_CREATE),
      canUpdateEquipment: PermissionService.hasPermission(userProfile, PermissionService.PERMISSIONS.EQUIPMENT_UPDATE),
      canDeleteEquipment: PermissionService.hasPermission(userProfile, PermissionService.PERMISSIONS.EQUIPMENT_DELETE),
      canBulkEdit: PermissionService.hasPermission(userProfile, PermissionService.PERMISSIONS.EQUIPMENT_BULK_EDIT),
      canBulkDelete: PermissionService.hasPermission(userProfile, PermissionService.PERMISSIONS.EQUIPMENT_BULK_DELETE),
      canExportEquipment: PermissionService.hasPermission(userProfile, PermissionService.PERMISSIONS.EQUIPMENT_EXPORT),
      
      // Category permissions
      canManageCategories: PermissionService.hasPermission(userProfile, PermissionService.PERMISSIONS.CATEGORY_MANAGE),
      
      // Report permissions
      canViewReports: PermissionService.hasPermission(userProfile, PermissionService.PERMISSIONS.REPORT_VIEW),
      canGenerateReports: PermissionService.hasPermission(userProfile, PermissionService.PERMISSIONS.REPORT_GENERATE),
      
      // Audit permissions
      canViewAudit: PermissionService.hasPermission(userProfile, PermissionService.PERMISSIONS.AUDIT_VIEW),
      canManageAudit: PermissionService.hasPermission(userProfile, PermissionService.PERMISSIONS.AUDIT_MANAGE),
      
      // User management permissions
      canManageUsers: PermissionService.hasPermission(userProfile, PermissionService.PERMISSIONS.USER_MANAGE),
      
      // System permissions
      canManageSystem: PermissionService.hasPermission(userProfile, PermissionService.PERMISSIONS.SYSTEM_SETTINGS),
      
      // Validation functions
      validateEquipmentAccess: (operation, equipment) => 
        PermissionService.validateEquipmentAccess(userProfile, operation, equipment),
      
      validateBulkAccess: (operation, equipmentList) => 
        PermissionService.validateBulkAccess(userProfile, operation, equipmentList),
      
      // Display functions
      getRoleDisplayInfo: () => PermissionService.getRoleDisplayInfo(userProfile.role)
    };
  }, [userProfile]);

  return permissions;
};

/**
 * Hook for equipment-specific permissions
 * @param {Object} equipment - Equipment object (optional)
 */
export const useEquipmentPermissions = (equipment = null) => {
  const { userProfile } = useAuth();
  const permissions = usePermissions();

  const equipmentPermissions = useMemo(() => {
    if (!userProfile) {
      return {
        canView: false,
        canEdit: false,
        canDelete: false,
        canUpdate: false,
        editReason: 'ไม่ได้เข้าสู่ระบบ',
        deleteReason: 'ไม่ได้เข้าสู่ระบบ'
      };
    }

    const viewAccess = PermissionService.validateEquipmentAccess(userProfile, 'view', equipment);
    const editAccess = PermissionService.validateEquipmentAccess(userProfile, 'update', equipment);
    const deleteAccess = PermissionService.validateEquipmentAccess(userProfile, 'delete', equipment);

    return {
      canView: viewAccess.allowed,
      canEdit: editAccess.allowed,
      canDelete: deleteAccess.allowed,
      canUpdate: editAccess.allowed, // Alias for canEdit
      editReason: editAccess.reason,
      deleteReason: deleteAccess.reason,
      viewAccess,
      editAccess,
      deleteAccess
    };
  }, [userProfile, equipment]);

  return {
    ...permissions,
    equipment: equipmentPermissions
  };
};

/**
 * Hook for bulk operation permissions
 * @param {Array} equipmentList - List of equipment
 */
export const useBulkPermissions = (equipmentList = []) => {
  const { userProfile } = useAuth();
  const permissions = usePermissions();

  const bulkPermissions = useMemo(() => {
    if (!userProfile || !equipmentList.length) {
      return {
        canBulkEdit: false,
        canBulkDelete: false,
        editValidation: { allowed: false, reason: 'ไม่มีข้อมูลที่เลือก' },
        deleteValidation: { allowed: false, reason: 'ไม่มีข้อมูลที่เลือก' }
      };
    }

    const editValidation = PermissionService.validateBulkAccess(userProfile, 'bulk_edit', equipmentList);
    const deleteValidation = PermissionService.validateBulkAccess(userProfile, 'bulk_delete', equipmentList);

    return {
      canBulkEdit: editValidation.allowed,
      canBulkDelete: deleteValidation.allowed,
      editValidation,
      deleteValidation
    };
  }, [userProfile, equipmentList]);

  return {
    ...permissions,
    bulk: bulkPermissions
  };
};

export default usePermissions;