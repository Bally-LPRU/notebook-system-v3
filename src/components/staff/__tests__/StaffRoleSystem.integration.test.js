/**
 * Staff Role System Integration Tests
 * 
 * Final Checkpoint - Integration Testing
 * Tests the complete Staff role system flow including:
 * - Staff login and dashboard access
 * - Staff approve/reject loan requests
 * - Staff process equipment returns
 * - Staff send overdue notifications
 * - Admin receives notifications
 * - Admin views Staff activity
 * 
 * Requirements: All Staff Role System requirements
 */

import PermissionService from '../../../services/permissionService';
import { LOAN_REQUEST_STATUS } from '../../../types/loanRequest';
import { EQUIPMENT_STATUS } from '../../../types/equipment';

// Mock users for testing
const mockStaffUser = {
  uid: 'staff-user-123',
  email: 'staff@example.com',
  displayName: 'Test Staff',
  role: 'staff',
  status: 'approved'
};

const mockAdminUser = {
  uid: 'admin-user-123',
  email: 'admin@example.com',
  displayName: 'Test Admin',
  role: 'admin',
  status: 'approved'
};

const mockBasicUser = {
  uid: 'basic-user-123',
  email: 'user@example.com',
  displayName: 'Test User',
  role: 'user',
  status: 'approved'
};

const mockEditorUser = {
  uid: 'editor-user-123',
  email: 'editor@example.com',
  displayName: 'Test Editor',
  role: 'editor',
  status: 'approved'
};

describe('Staff Role System Integration Tests', () => {
  
  // ============================================================================
  // Test 1: Staff Login and Dashboard Access
  // Requirements: 1.1, 9.1
  // ============================================================================
  
  describe('Staff Login and Dashboard Access', () => {
    test('Staff user should have staff role', () => {
      expect(mockStaffUser.role).toBe('staff');
      expect(PermissionService.isStaff(mockStaffUser)).toBe(true);
    });

    test('Staff should be able to perform staff functions', () => {
      expect(PermissionService.canPerformStaffFunctions(mockStaffUser)).toBe(true);
    });

    test('Staff should have correct display info', () => {
      const displayInfo = PermissionService.getRoleDisplayInfo('staff');
      expect(displayInfo.name).toBe('เจ้าหน้าที่ให้บริการ');
      expect(displayInfo.color).toBe('indigo');
    });

    test('Staff should have loan management permissions for dashboard', () => {
      expect(PermissionService.canViewLoanRequests(mockStaffUser)).toBe(true);
      expect(PermissionService.canViewOverdue(mockStaffUser)).toBe(true);
    });
  });

  // ============================================================================
  // Test 2: Staff Approve/Reject Loan Requests
  // Requirements: 2.1, 4.1, 4.3
  // ============================================================================
  
  describe('Staff Approve/Reject Loan Requests', () => {
    test('Staff should have permission to approve loan requests', () => {
      expect(PermissionService.canApproveLoan(mockStaffUser)).toBe(true);
      expect(PermissionService.hasPermission(mockStaffUser, PermissionService.PERMISSIONS.LOAN_REQUEST_APPROVE)).toBe(true);
    });

    test('Staff should have permission to reject loan requests', () => {
      expect(PermissionService.canRejectLoan(mockStaffUser)).toBe(true);
      expect(PermissionService.hasPermission(mockStaffUser, PermissionService.PERMISSIONS.LOAN_REQUEST_REJECT)).toBe(true);
    });

    test('Basic user should NOT have permission to approve/reject', () => {
      expect(PermissionService.canApproveLoan(mockBasicUser)).toBe(false);
      expect(PermissionService.canRejectLoan(mockBasicUser)).toBe(false);
    });

    test('Editor should NOT have permission to approve/reject', () => {
      expect(PermissionService.canApproveLoan(mockEditorUser)).toBe(false);
      expect(PermissionService.canRejectLoan(mockEditorUser)).toBe(false);
    });
  });

  // ============================================================================
  // Test 3: Staff Process Equipment Returns
  // Requirements: 5.1, 5.2, 5.3, 5.4
  // ============================================================================
  
  describe('Staff Process Equipment Returns', () => {
    test('Staff should have permission to process returns', () => {
      expect(PermissionService.canProcessReturn(mockStaffUser)).toBe(true);
      expect(PermissionService.hasPermission(mockStaffUser, PermissionService.PERMISSIONS.LOAN_RETURN_PROCESS)).toBe(true);
    });

    test('Staff should have permission to verify returns', () => {
      expect(PermissionService.canVerifyReturn(mockStaffUser)).toBe(true);
      expect(PermissionService.hasPermission(mockStaffUser, PermissionService.PERMISSIONS.LOAN_RETURN_VERIFY)).toBe(true);
    });

    test('Basic user should NOT have permission to process returns', () => {
      expect(PermissionService.canProcessReturn(mockBasicUser)).toBe(false);
      expect(PermissionService.canVerifyReturn(mockBasicUser)).toBe(false);
    });
  });

  // ============================================================================
  // Test 4: Staff Send Overdue Notifications
  // Requirements: 6.1, 6.3
  // ============================================================================
  
  describe('Staff Send Overdue Notifications', () => {
    test('Staff should have permission to view overdue loans', () => {
      expect(PermissionService.canViewOverdue(mockStaffUser)).toBe(true);
      expect(PermissionService.hasPermission(mockStaffUser, PermissionService.PERMISSIONS.OVERDUE_VIEW)).toBe(true);
    });

    test('Staff should have permission to send overdue notifications', () => {
      expect(PermissionService.canNotifyOverdue(mockStaffUser)).toBe(true);
      expect(PermissionService.hasPermission(mockStaffUser, PermissionService.PERMISSIONS.OVERDUE_NOTIFY)).toBe(true);
    });

    test('Basic user should NOT have permission to manage overdue', () => {
      expect(PermissionService.canViewOverdue(mockBasicUser)).toBe(false);
      expect(PermissionService.canNotifyOverdue(mockBasicUser)).toBe(false);
    });
  });

  // ============================================================================
  // Test 5: Admin Receives Notifications (Role Hierarchy)
  // Requirements: 11.1, 11.7, 12.1-12.5
  // ============================================================================
  
  describe('Admin Receives Notifications (Role Hierarchy)', () => {
    test('Admin should have all Staff permissions', () => {
      const staffPermissions = PermissionService.getUserPermissions('staff');
      staffPermissions.forEach(permission => {
        expect(PermissionService.hasPermission(mockAdminUser, permission)).toBe(true);
      });
    });

    test('Admin should be able to perform staff functions', () => {
      expect(PermissionService.canPerformStaffFunctions(mockAdminUser)).toBe(true);
    });

    test('Admin should have higher role than Staff', () => {
      expect(PermissionService.hasHigherOrEqualRole('admin', 'staff')).toBe(true);
      expect(PermissionService.hasHigherOrEqualRole('staff', 'admin')).toBe(false);
    });

    test('Admin should have all loan management permissions', () => {
      expect(PermissionService.canApproveLoan(mockAdminUser)).toBe(true);
      expect(PermissionService.canRejectLoan(mockAdminUser)).toBe(true);
      expect(PermissionService.canProcessReturn(mockAdminUser)).toBe(true);
      expect(PermissionService.canViewOverdue(mockAdminUser)).toBe(true);
      expect(PermissionService.canNotifyOverdue(mockAdminUser)).toBe(true);
    });
  });

  // ============================================================================
  // Test 6: Admin Views Staff Activity
  // Requirements: 12.6, 12.7
  // ============================================================================
  
  describe('Admin Views Staff Activity', () => {
    test('Admin should have audit view permission', () => {
      expect(PermissionService.hasPermission(mockAdminUser, PermissionService.PERMISSIONS.AUDIT_VIEW)).toBe(true);
    });

    test('Staff should NOT have audit view permission', () => {
      expect(PermissionService.hasPermission(mockStaffUser, PermissionService.PERMISSIONS.AUDIT_VIEW)).toBe(false);
    });

    test('Admin should be able to access audit logs', () => {
      expect(PermissionService.canAccessAuditLogs(mockAdminUser)).toBe(true);
    });

    test('Staff should NOT be able to access audit logs', () => {
      expect(PermissionService.canAccessAuditLogs(mockStaffUser)).toBe(false);
    });
  });

  // ============================================================================
  // Test 7: Staff Access Restrictions
  // Requirements: 7.1-7.6
  // ============================================================================
  
  describe('Staff Access Restrictions', () => {
    test('Staff should NOT have user management permission', () => {
      expect(PermissionService.hasPermission(mockStaffUser, PermissionService.PERMISSIONS.USER_MANAGE)).toBe(false);
    });

    test('Staff should NOT have equipment management permissions', () => {
      expect(PermissionService.hasPermission(mockStaffUser, PermissionService.PERMISSIONS.EQUIPMENT_CREATE)).toBe(false);
      expect(PermissionService.hasPermission(mockStaffUser, PermissionService.PERMISSIONS.EQUIPMENT_UPDATE)).toBe(false);
      expect(PermissionService.hasPermission(mockStaffUser, PermissionService.PERMISSIONS.EQUIPMENT_DELETE)).toBe(false);
    });

    test('Staff should NOT have category management permission', () => {
      expect(PermissionService.hasPermission(mockStaffUser, PermissionService.PERMISSIONS.CATEGORY_MANAGE)).toBe(false);
    });

    test('Staff should NOT have reservation management permission', () => {
      expect(PermissionService.hasPermission(mockStaffUser, PermissionService.PERMISSIONS.RESERVATION_MANAGE)).toBe(false);
    });

    test('Staff should NOT have system settings permission', () => {
      expect(PermissionService.hasPermission(mockStaffUser, PermissionService.PERMISSIONS.SYSTEM_SETTINGS)).toBe(false);
      expect(PermissionService.canManageSystem(mockStaffUser)).toBe(false);
    });

    test('Staff should NOT have intelligence access permission', () => {
      expect(PermissionService.hasPermission(mockStaffUser, PermissionService.PERMISSIONS.INTELLIGENCE_ACCESS)).toBe(false);
    });

    test('All restricted permissions should be correctly identified', () => {
      const restrictedPermissions = PermissionService.getStaffRestrictedPermissions();
      
      restrictedPermissions.forEach(permission => {
        expect(PermissionService.hasPermission(mockStaffUser, permission)).toBe(false);
        expect(PermissionService.isStaffRestrictedPermission(permission)).toBe(true);
      });
    });
  });

  // ============================================================================
  // Test 8: Role Assignment by Admin
  // Requirements: 8.1, 8.5
  // ============================================================================
  
  describe('Role Assignment by Admin', () => {
    test('Staff role should be available in all roles list', () => {
      const allRoles = PermissionService.getAllRoles();
      const staffRole = allRoles.find(r => r.value === 'staff');
      
      expect(staffRole).toBeDefined();
      expect(staffRole.name).toBe('เจ้าหน้าที่ให้บริการ');
    });

    test('Admin should have user management permission', () => {
      expect(PermissionService.hasPermission(mockAdminUser, PermissionService.PERMISSIONS.USER_MANAGE)).toBe(true);
    });

    test('Staff should NOT have user management permission', () => {
      expect(PermissionService.hasPermission(mockStaffUser, PermissionService.PERMISSIONS.USER_MANAGE)).toBe(false);
    });
  });

  // ============================================================================
  // Test 9: Menu Visibility by Role
  // Requirements: 13.1-13.5
  // ============================================================================
  
  describe('Menu Visibility by Role', () => {
    test('Staff should have equipment view permission (for menu)', () => {
      expect(PermissionService.hasPermission(mockStaffUser, PermissionService.PERMISSIONS.EQUIPMENT_VIEW)).toBe(true);
    });

    test('Staff should have report view permission (for menu)', () => {
      expect(PermissionService.hasPermission(mockStaffUser, PermissionService.PERMISSIONS.REPORT_VIEW)).toBe(true);
    });

    test('Staff should have category view permission (for menu)', () => {
      expect(PermissionService.hasPermission(mockStaffUser, PermissionService.PERMISSIONS.CATEGORY_VIEW)).toBe(true);
    });

    test('Basic user should only have equipment view permission', () => {
      const userPermissions = PermissionService.getUserPermissions('user');
      expect(userPermissions).toContain(PermissionService.PERMISSIONS.EQUIPMENT_VIEW);
      expect(userPermissions.length).toBe(1);
    });
  });

  // ============================================================================
  // Test 10: Complete Permission Set Verification
  // ============================================================================
  
  describe('Complete Permission Set Verification', () => {
    test('Staff should have exactly the expected permissions', () => {
      const staffPermissions = PermissionService.getUserPermissions('staff');
      
      const expectedPermissions = [
        PermissionService.PERMISSIONS.EQUIPMENT_VIEW,
        PermissionService.PERMISSIONS.CATEGORY_VIEW,
        PermissionService.PERMISSIONS.LOAN_REQUEST_VIEW,
        PermissionService.PERMISSIONS.LOAN_REQUEST_APPROVE,
        PermissionService.PERMISSIONS.LOAN_REQUEST_REJECT,
        PermissionService.PERMISSIONS.LOAN_RETURN_PROCESS,
        PermissionService.PERMISSIONS.LOAN_RETURN_VERIFY,
        PermissionService.PERMISSIONS.OVERDUE_VIEW,
        PermissionService.PERMISSIONS.OVERDUE_NOTIFY,
        PermissionService.PERMISSIONS.REPORT_VIEW
      ];

      // Check all expected permissions are present
      expectedPermissions.forEach(permission => {
        expect(staffPermissions).toContain(permission);
      });

      // Check no extra permissions
      expect(staffPermissions.length).toBe(expectedPermissions.length);
    });

    test('Admin should have all permissions including Staff permissions', () => {
      const adminPermissions = PermissionService.getUserPermissions('admin');
      const staffPermissions = PermissionService.getUserPermissions('staff');

      // Admin should have all Staff permissions
      staffPermissions.forEach(permission => {
        expect(adminPermissions).toContain(permission);
      });

      // Admin should have additional permissions
      expect(adminPermissions).toContain(PermissionService.PERMISSIONS.USER_MANAGE);
      expect(adminPermissions).toContain(PermissionService.PERMISSIONS.EQUIPMENT_CREATE);
      expect(adminPermissions).toContain(PermissionService.PERMISSIONS.SYSTEM_SETTINGS);
      expect(adminPermissions).toContain(PermissionService.PERMISSIONS.INTELLIGENCE_ACCESS);
    });
  });
});
