import PermissionService from '../permissionService';

describe('PermissionService', () => {
  const mockUser = {
    uid: 'test-user-123',
    email: 'test@example.com',
    role: 'editor',
    status: 'approved'
  };

  const mockAdmin = {
    uid: 'admin-user-123',
    email: 'admin@example.com',
    role: 'admin',
    status: 'approved'
  };

  const mockViewer = {
    uid: 'viewer-user-123',
    email: 'viewer@example.com',
    role: 'viewer',
    status: 'approved'
  };

  const mockStaff = {
    uid: 'staff-user-123',
    email: 'staff@example.com',
    role: 'staff',
    status: 'approved'
  };

  const mockBasicUser = {
    uid: 'basic-user-123',
    email: 'user@example.com',
    role: 'user',
    status: 'approved'
  };

  describe('getUserPermissions', () => {
    test('should return correct permissions for viewer role', () => {
      const permissions = PermissionService.getUserPermissions('viewer');
      
      expect(permissions).toContain(PermissionService.PERMISSIONS.EQUIPMENT_VIEW);
      expect(permissions).toContain(PermissionService.PERMISSIONS.CATEGORY_VIEW);
      expect(permissions).toContain(PermissionService.PERMISSIONS.REPORT_VIEW);
      expect(permissions).not.toContain(PermissionService.PERMISSIONS.EQUIPMENT_CREATE);
    });

    test('should return correct permissions for editor role', () => {
      const permissions = PermissionService.getUserPermissions('editor');
      
      expect(permissions).toContain(PermissionService.PERMISSIONS.EQUIPMENT_VIEW);
      expect(permissions).toContain(PermissionService.PERMISSIONS.EQUIPMENT_CREATE);
      expect(permissions).toContain(PermissionService.PERMISSIONS.EQUIPMENT_UPDATE);
      expect(permissions).not.toContain(PermissionService.PERMISSIONS.EQUIPMENT_DELETE);
    });

    test('should return all permissions for admin role', () => {
      const permissions = PermissionService.getUserPermissions('admin');
      
      expect(permissions).toContain(PermissionService.PERMISSIONS.EQUIPMENT_VIEW);
      expect(permissions).toContain(PermissionService.PERMISSIONS.EQUIPMENT_CREATE);
      expect(permissions).toContain(PermissionService.PERMISSIONS.EQUIPMENT_UPDATE);
      expect(permissions).toContain(PermissionService.PERMISSIONS.EQUIPMENT_DELETE);
      expect(permissions).toContain(PermissionService.PERMISSIONS.AUDIT_VIEW);
    });

    test('should return empty array for invalid role', () => {
      const permissions = PermissionService.getUserPermissions('invalid');
      expect(permissions).toEqual([]);
    });
  });

  describe('hasPermission', () => {
    test('should return true for valid permission', () => {
      const hasPermission = PermissionService.hasPermission(
        mockUser, 
        PermissionService.PERMISSIONS.EQUIPMENT_CREATE
      );
      expect(hasPermission).toBe(true);
    });

    test('should return false for invalid permission', () => {
      const hasPermission = PermissionService.hasPermission(
        mockViewer, 
        PermissionService.PERMISSIONS.EQUIPMENT_CREATE
      );
      expect(hasPermission).toBe(false);
    });

    test('should return true for admin with any permission', () => {
      const hasPermission = PermissionService.hasPermission(
        mockAdmin, 
        PermissionService.PERMISSIONS.EQUIPMENT_DELETE
      );
      expect(hasPermission).toBe(true);
    });

    test('should return false for user without role', () => {
      const userWithoutRole = { uid: 'test', email: 'test@example.com' };
      const hasPermission = PermissionService.hasPermission(
        userWithoutRole, 
        PermissionService.PERMISSIONS.EQUIPMENT_VIEW
      );
      expect(hasPermission).toBe(false);
    });
  });

  describe('validateEquipmentAccess', () => {
    const mockEquipment = {
      id: 'equipment-123',
      equipmentNumber: 'EQ001',
      name: 'Test Equipment',
      createdBy: 'test-user-123'
    };

    test('should allow view access for approved user', () => {
      const result = PermissionService.validateEquipmentAccess(mockUser, 'view');
      
      expect(result.allowed).toBe(true);
      expect(result.reason).toBeNull();
    });

    test('should deny access for unauthenticated user', () => {
      const result = PermissionService.validateEquipmentAccess(null, 'view');
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('ผู้ใช้ไม่ได้เข้าสู่ระบบ');
    });

    test('should deny access for unapproved user', () => {
      const unapprovedUser = { ...mockUser, status: 'pending' };
      const result = PermissionService.validateEquipmentAccess(unapprovedUser, 'view');
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('บัญชีผู้ใช้ยังไม่ได้รับการอนุมัติ');
    });

    test('should allow editor to update own equipment', () => {
      const result = PermissionService.validateEquipmentAccess(mockUser, 'update', mockEquipment);
      
      expect(result.allowed).toBe(true);
    });

    test('should deny editor to update others equipment', () => {
      const otherEquipment = { ...mockEquipment, createdBy: 'other-user' };
      const result = PermissionService.validateEquipmentAccess(mockUser, 'update', otherEquipment);
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('คุณสามารถแก้ไขได้เฉพาะอุปกรณ์ที่คุณสร้างเท่านั้น');
    });

    test('should allow admin to update any equipment', () => {
      const otherEquipment = { ...mockEquipment, createdBy: 'other-user' };
      const result = PermissionService.validateEquipmentAccess(mockAdmin, 'update', otherEquipment);
      
      expect(result.allowed).toBe(true);
    });

    test('should deny viewer to create equipment', () => {
      const result = PermissionService.validateEquipmentAccess(mockViewer, 'create');
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('คุณไม่มีสิทธิ์ในการดำเนินการนี้');
    });
  });

  describe('validateBulkAccess', () => {
    const mockEquipmentList = [
      { id: 'eq1', createdBy: 'test-user-123' },
      { id: 'eq2', createdBy: 'test-user-123' },
      { id: 'eq3', createdBy: 'other-user' }
    ];

    test('should allow admin to access all items', () => {
      const result = PermissionService.validateBulkAccess(mockAdmin, 'bulk_edit', mockEquipmentList);
      
      expect(result.allowed).toBe(true);
      expect(result.allowedItems).toEqual(['eq1', 'eq2', 'eq3']);
      expect(result.deniedItems).toEqual([]);
    });

    test('should allow editor to access only own items', () => {
      const result = PermissionService.validateBulkAccess(mockUser, 'bulk_edit', mockEquipmentList);
      
      expect(result.allowed).toBe(true);
      expect(result.allowedItems).toEqual(['eq1', 'eq2']);
      expect(result.deniedItems).toEqual(['eq3']);
      expect(result.reason).toContain('คุณไม่มีสิทธิ์แก้ไขอุปกรณ์ 1 รายการ');
    });

    test('should deny viewer bulk operations', () => {
      const result = PermissionService.validateBulkAccess(mockViewer, 'bulk_edit', mockEquipmentList);
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('คุณไม่มีสิทธิ์ในการดำเนินการนี้');
    });
  });

  describe('getRoleDisplayInfo', () => {
    test('should return correct display info for viewer role', () => {
      const info = PermissionService.getRoleDisplayInfo('viewer');
      
      expect(info.name).toBe('ผู้ดู');
      expect(info.color).toBe('blue');
      expect(info.icon).toBe('eye');
    });

    test('should return correct display info for admin role', () => {
      const info = PermissionService.getRoleDisplayInfo('admin');
      
      expect(info.name).toBe('ผู้ดูแลระบบ');
      expect(info.color).toBe('red');
      expect(info.icon).toBe('shield');
    });

    test('should return default info for unknown role', () => {
      const info = PermissionService.getRoleDisplayInfo('unknown');
      
      expect(info.name).toBe('ไม่ระบุ');
      expect(info.color).toBe('gray');
      expect(info.icon).toBe('user');
    });
  });

  describe('getEffectivePermissions', () => {
    test('should return structured permissions object', () => {
      const permissions = PermissionService.getEffectivePermissions(mockUser);
      
      expect(permissions.equipment).toBeDefined();
      expect(permissions.equipment.view).toBe(true);
      expect(permissions.equipment.create).toBe(true);
      expect(permissions.equipment.delete).toBeUndefined();
    });

    test('should return empty object for user without role', () => {
      const userWithoutRole = { uid: 'test', email: 'test@example.com' };
      const permissions = PermissionService.getEffectivePermissions(userWithoutRole);
      
      expect(permissions).toEqual({});
    });
  });

  // ==================== Staff Role Tests ====================
  // Tests for Requirements 1.1, 1.2, 2.1, 2.2, 2.3, 11.1, 11.7

  describe('Staff Role - Permission Boundary', () => {
    // Validates: Requirements 2.1, 2.2, 2.3
    
    test('should return correct permissions for staff role', () => {
      const permissions = PermissionService.getUserPermissions('staff');
      
      // Staff should have loan management permissions
      expect(permissions).toContain(PermissionService.PERMISSIONS.LOAN_REQUEST_VIEW);
      expect(permissions).toContain(PermissionService.PERMISSIONS.LOAN_REQUEST_APPROVE);
      expect(permissions).toContain(PermissionService.PERMISSIONS.LOAN_REQUEST_REJECT);
      expect(permissions).toContain(PermissionService.PERMISSIONS.LOAN_RETURN_PROCESS);
      expect(permissions).toContain(PermissionService.PERMISSIONS.LOAN_RETURN_VERIFY);
      expect(permissions).toContain(PermissionService.PERMISSIONS.OVERDUE_VIEW);
      expect(permissions).toContain(PermissionService.PERMISSIONS.OVERDUE_NOTIFY);
      expect(permissions).toContain(PermissionService.PERMISSIONS.EQUIPMENT_VIEW);
      expect(permissions).toContain(PermissionService.PERMISSIONS.REPORT_VIEW);
    });

    test('should NOT have restricted permissions for staff role', () => {
      const permissions = PermissionService.getUserPermissions('staff');
      
      // Staff should NOT have these permissions
      expect(permissions).not.toContain(PermissionService.PERMISSIONS.USER_MANAGE);
      expect(permissions).not.toContain(PermissionService.PERMISSIONS.EQUIPMENT_CREATE);
      expect(permissions).not.toContain(PermissionService.PERMISSIONS.EQUIPMENT_UPDATE);
      expect(permissions).not.toContain(PermissionService.PERMISSIONS.EQUIPMENT_DELETE);
      expect(permissions).not.toContain(PermissionService.PERMISSIONS.CATEGORY_MANAGE);
      expect(permissions).not.toContain(PermissionService.PERMISSIONS.RESERVATION_MANAGE);
      expect(permissions).not.toContain(PermissionService.PERMISSIONS.SYSTEM_SETTINGS);
      expect(permissions).not.toContain(PermissionService.PERMISSIONS.INTELLIGENCE_ACCESS);
      expect(permissions).not.toContain(PermissionService.PERMISSIONS.AUDIT_VIEW);
      expect(permissions).not.toContain(PermissionService.PERMISSIONS.AUDIT_MANAGE);
    });

    test('should return false for restricted permissions when checking staff', () => {
      const restrictedPermissions = PermissionService.getStaffRestrictedPermissions();
      
      restrictedPermissions.forEach(permission => {
        expect(PermissionService.hasPermission(mockStaff, permission)).toBe(false);
      });
    });
  });

  describe('Staff Role - Loan Management Permissions', () => {
    // Validates: Requirements 2.1
    
    test('canApproveLoan should return true for staff', () => {
      expect(PermissionService.canApproveLoan(mockStaff)).toBe(true);
    });

    test('canRejectLoan should return true for staff', () => {
      expect(PermissionService.canRejectLoan(mockStaff)).toBe(true);
    });

    test('canProcessReturn should return true for staff', () => {
      expect(PermissionService.canProcessReturn(mockStaff)).toBe(true);
    });

    test('canVerifyReturn should return true for staff', () => {
      expect(PermissionService.canVerifyReturn(mockStaff)).toBe(true);
    });

    test('canViewOverdue should return true for staff', () => {
      expect(PermissionService.canViewOverdue(mockStaff)).toBe(true);
    });

    test('canNotifyOverdue should return true for staff', () => {
      expect(PermissionService.canNotifyOverdue(mockStaff)).toBe(true);
    });

    test('canViewLoanRequests should return true for staff', () => {
      expect(PermissionService.canViewLoanRequests(mockStaff)).toBe(true);
    });

    test('basic user should NOT have loan management permissions', () => {
      expect(PermissionService.canApproveLoan(mockBasicUser)).toBe(false);
      expect(PermissionService.canRejectLoan(mockBasicUser)).toBe(false);
      expect(PermissionService.canProcessReturn(mockBasicUser)).toBe(false);
      expect(PermissionService.canViewOverdue(mockBasicUser)).toBe(false);
      expect(PermissionService.canNotifyOverdue(mockBasicUser)).toBe(false);
    });
  });

  describe('Staff Role - Role Hierarchy', () => {
    // Validates: Requirements 11.1, 11.7
    
    test('admin should have all staff permissions', () => {
      const staffPermissions = PermissionService.getUserPermissions('staff');
      
      staffPermissions.forEach(permission => {
        expect(PermissionService.hasPermission(mockAdmin, permission)).toBe(true);
      });
    });

    test('admin canApproveLoan should return true', () => {
      expect(PermissionService.canApproveLoan(mockAdmin)).toBe(true);
    });

    test('admin canRejectLoan should return true', () => {
      expect(PermissionService.canRejectLoan(mockAdmin)).toBe(true);
    });

    test('admin canProcessReturn should return true', () => {
      expect(PermissionService.canProcessReturn(mockAdmin)).toBe(true);
    });

    test('admin canViewOverdue should return true', () => {
      expect(PermissionService.canViewOverdue(mockAdmin)).toBe(true);
    });

    test('admin canNotifyOverdue should return true', () => {
      expect(PermissionService.canNotifyOverdue(mockAdmin)).toBe(true);
    });

    test('hasHigherOrEqualRole should correctly compare roles', () => {
      // Admin > Staff > Editor > Viewer > User
      expect(PermissionService.hasHigherOrEqualRole('admin', 'staff')).toBe(true);
      expect(PermissionService.hasHigherOrEqualRole('admin', 'admin')).toBe(true);
      expect(PermissionService.hasHigherOrEqualRole('staff', 'admin')).toBe(false);
      expect(PermissionService.hasHigherOrEqualRole('staff', 'editor')).toBe(true);
      expect(PermissionService.hasHigherOrEqualRole('staff', 'user')).toBe(true);
      expect(PermissionService.hasHigherOrEqualRole('editor', 'staff')).toBe(false);
      expect(PermissionService.hasHigherOrEqualRole('user', 'staff')).toBe(false);
    });
  });

  describe('Staff Role - isStaff and canPerformStaffFunctions', () => {
    // Validates: Requirements 1.1
    
    test('isStaff should return true for staff user', () => {
      expect(PermissionService.isStaff(mockStaff)).toBe(true);
    });

    test('isStaff should return false for admin user', () => {
      expect(PermissionService.isStaff(mockAdmin)).toBe(false);
    });

    test('isStaff should return false for basic user', () => {
      expect(PermissionService.isStaff(mockBasicUser)).toBe(false);
    });

    test('canPerformStaffFunctions should return true for staff', () => {
      expect(PermissionService.canPerformStaffFunctions(mockStaff)).toBe(true);
    });

    test('canPerformStaffFunctions should return true for admin', () => {
      expect(PermissionService.canPerformStaffFunctions(mockAdmin)).toBe(true);
    });

    test('canPerformStaffFunctions should return false for basic user', () => {
      expect(PermissionService.canPerformStaffFunctions(mockBasicUser)).toBe(false);
    });

    test('canPerformStaffFunctions should return false for editor', () => {
      expect(PermissionService.canPerformStaffFunctions(mockUser)).toBe(false);
    });
  });

  describe('Staff Role - Display Info', () => {
    // Validates: Requirements 1.4
    
    test('should return correct display info for staff role', () => {
      const info = PermissionService.getRoleDisplayInfo('staff');
      
      expect(info.name).toBe('เจ้าหน้าที่ให้บริการ');
      expect(info.description).toBe('สามารถอนุมัติและจัดการคำขอยืม-คืนอุปกรณ์ได้');
      expect(info.color).toBe('indigo');
      expect(info.icon).toBe('clipboard-document-list');
    });

    test('getAllRoles should include staff role', () => {
      const allRoles = PermissionService.getAllRoles();
      const staffRole = allRoles.find(r => r.value === 'staff');
      
      expect(staffRole).toBeDefined();
      expect(staffRole.name).toBe('เจ้าหน้าที่ให้บริการ');
    });
  });

  describe('Staff Role - Restricted Permissions Helper', () => {
    test('getStaffRestrictedPermissions should return correct list', () => {
      const restricted = PermissionService.getStaffRestrictedPermissions();
      
      expect(restricted).toContain(PermissionService.PERMISSIONS.USER_MANAGE);
      expect(restricted).toContain(PermissionService.PERMISSIONS.EQUIPMENT_CREATE);
      expect(restricted).toContain(PermissionService.PERMISSIONS.EQUIPMENT_UPDATE);
      expect(restricted).toContain(PermissionService.PERMISSIONS.EQUIPMENT_DELETE);
      expect(restricted).toContain(PermissionService.PERMISSIONS.CATEGORY_MANAGE);
      expect(restricted).toContain(PermissionService.PERMISSIONS.RESERVATION_MANAGE);
      expect(restricted).toContain(PermissionService.PERMISSIONS.SYSTEM_SETTINGS);
      expect(restricted).toContain(PermissionService.PERMISSIONS.INTELLIGENCE_ACCESS);
    });

    test('isStaffRestrictedPermission should return true for restricted permissions', () => {
      expect(PermissionService.isStaffRestrictedPermission(PermissionService.PERMISSIONS.USER_MANAGE)).toBe(true);
      expect(PermissionService.isStaffRestrictedPermission(PermissionService.PERMISSIONS.SYSTEM_SETTINGS)).toBe(true);
    });

    test('isStaffRestrictedPermission should return false for allowed permissions', () => {
      expect(PermissionService.isStaffRestrictedPermission(PermissionService.PERMISSIONS.LOAN_REQUEST_VIEW)).toBe(false);
      expect(PermissionService.isStaffRestrictedPermission(PermissionService.PERMISSIONS.LOAN_REQUEST_APPROVE)).toBe(false);
    });
  });
});