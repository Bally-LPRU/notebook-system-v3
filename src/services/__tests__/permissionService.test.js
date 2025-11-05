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
});