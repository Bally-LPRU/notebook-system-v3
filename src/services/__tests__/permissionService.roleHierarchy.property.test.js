/**
 * Property-based tests for Role Hierarchy Inheritance
 * 
 * **Feature: staff-role-system, Property 2: Role Hierarchy Inheritance**
 * **Validates: Requirements 11.1, 11.7**
 * 
 * Property: For any Admin user, checking any Staff permission SHALL return true.
 * The permission set of Admin SHALL be a superset of Staff permissions.
 */

import fc from 'fast-check';
import PermissionService from '../permissionService';

// Get Staff permissions from the service
const STAFF_PERMISSIONS = PermissionService.getUserPermissions(PermissionService.ROLES.STAFF);

// Get Admin permissions from the service
const ADMIN_PERMISSIONS = PermissionService.getUserPermissions(PermissionService.ROLES.ADMIN);

// Generator for Admin user objects with random but valid user data
const adminUserGenerator = fc.record({
  uid: fc.uuid(),
  email: fc.emailAddress(),
  displayName: fc.string({ minLength: 1, maxLength: 50 }),
  role: fc.constant('admin'),
  status: fc.constant('approved')
});

// Generator for Staff user objects
const staffUserGenerator = fc.record({
  uid: fc.uuid(),
  email: fc.emailAddress(),
  displayName: fc.string({ minLength: 1, maxLength: 50 }),
  role: fc.constant('staff'),
  status: fc.constant('approved')
});

// Generator for Staff permissions
const staffPermissionGenerator = fc.constantFrom(...STAFF_PERMISSIONS);

// Generator for all permissions
const allPermissionsGenerator = fc.constantFrom(
  ...Object.values(PermissionService.PERMISSIONS)
);

// Generator for all roles
const allRolesGenerator = fc.constantFrom(
  ...Object.values(PermissionService.ROLES)
);

describe('Role Hierarchy Inheritance Property Tests', () => {
  /**
   * **Feature: staff-role-system, Property 2: Role Hierarchy Inheritance**
   * **Validates: Requirements 11.1, 11.7**
   */
  describe('Property 2: Role Hierarchy Inheritance', () => {
    
    // Test that Admin has all Staff permissions (Requirement 11.1)
    it('For any Admin user and any Staff permission, hasPermission SHALL return true', () => {
      fc.assert(
        fc.property(
          adminUserGenerator,
          staffPermissionGenerator,
          (adminUser, permission) => {
            const result = PermissionService.hasPermission(adminUser, permission);
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Test that Admin permissions are a superset of Staff permissions (Requirement 11.7)
    it('Admin permission set SHALL be a superset of Staff permission set', () => {
      // Every Staff permission should be in Admin permissions
      STAFF_PERMISSIONS.forEach(permission => {
        expect(ADMIN_PERMISSIONS).toContain(permission);
      });
    });

    // Test that Admin has all permissions (special case in hasPermission)
    it('For any Admin user and any permission, hasPermission SHALL return true', () => {
      fc.assert(
        fc.property(
          adminUserGenerator,
          allPermissionsGenerator,
          (adminUser, permission) => {
            const result = PermissionService.hasPermission(adminUser, permission);
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Test that Admin can perform all Staff functions
    it('Admin SHALL be able to perform all Staff functions', () => {
      fc.assert(
        fc.property(
          adminUserGenerator,
          (adminUser) => {
            // Admin should pass canPerformStaffFunctions
            expect(PermissionService.canPerformStaffFunctions(adminUser)).toBe(true);
            
            // Admin should have all Staff-specific capabilities
            expect(PermissionService.canApproveLoan(adminUser)).toBe(true);
            expect(PermissionService.canRejectLoan(adminUser)).toBe(true);
            expect(PermissionService.canProcessReturn(adminUser)).toBe(true);
            expect(PermissionService.canVerifyReturn(adminUser)).toBe(true);
            expect(PermissionService.canViewOverdue(adminUser)).toBe(true);
            expect(PermissionService.canNotifyOverdue(adminUser)).toBe(true);
            expect(PermissionService.canViewLoanRequests(adminUser)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Test role hierarchy comparison function
    it('hasHigherOrEqualRole SHALL correctly compare Admin and Staff roles', () => {
      // Admin should be higher than or equal to Staff
      expect(PermissionService.hasHigherOrEqualRole('admin', 'staff')).toBe(true);
      
      // Staff should NOT be higher than or equal to Admin
      expect(PermissionService.hasHigherOrEqualRole('staff', 'admin')).toBe(false);
      
      // Admin should be higher than or equal to all roles
      Object.values(PermissionService.ROLES).forEach(role => {
        expect(PermissionService.hasHigherOrEqualRole('admin', role)).toBe(true);
      });
    });

    // Test that Staff permissions are a proper subset (Admin has more)
    it('Admin SHALL have additional permissions beyond Staff permissions', () => {
      const adminOnlyPermissions = ADMIN_PERMISSIONS.filter(
        permission => !STAFF_PERMISSIONS.includes(permission)
      );
      
      // Admin should have at least some permissions that Staff doesn't have
      expect(adminOnlyPermissions.length).toBeGreaterThan(0);
      
      // These should include administrative permissions
      expect(adminOnlyPermissions).toContain(PermissionService.PERMISSIONS.USER_MANAGE);
      expect(adminOnlyPermissions).toContain(PermissionService.PERMISSIONS.SYSTEM_SETTINGS);
      expect(adminOnlyPermissions).toContain(PermissionService.PERMISSIONS.EQUIPMENT_CREATE);
      expect(adminOnlyPermissions).toContain(PermissionService.PERMISSIONS.EQUIPMENT_UPDATE);
      expect(adminOnlyPermissions).toContain(PermissionService.PERMISSIONS.EQUIPMENT_DELETE);
    });

    // Test that for any permission Staff has, Admin also has it
    it('For any permission that Staff has, Admin SHALL also have it', () => {
      fc.assert(
        fc.property(
          staffUserGenerator,
          adminUserGenerator,
          staffPermissionGenerator,
          (staffUser, adminUser, permission) => {
            const staffHas = PermissionService.hasPermission(staffUser, permission);
            const adminHas = PermissionService.hasPermission(adminUser, permission);
            
            // If Staff has the permission, Admin must also have it
            if (staffHas) {
              expect(adminHas).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional hierarchy tests for complete role chain
   */
  describe('Complete Role Hierarchy Chain', () => {
    
    // Test the complete hierarchy: User < Viewer < Editor < Staff < Admin
    it('Role hierarchy SHALL follow User < Viewer < Editor < Staff < Admin', () => {
      const hierarchy = ['user', 'viewer', 'editor', 'staff', 'admin'];
      
      // For each pair of adjacent roles, higher role should have >= permissions
      for (let i = 0; i < hierarchy.length - 1; i++) {
        const lowerRole = hierarchy[i];
        const higherRole = hierarchy[i + 1];
        
        expect(PermissionService.hasHigherOrEqualRole(higherRole, lowerRole)).toBe(true);
        expect(PermissionService.hasHigherOrEqualRole(lowerRole, higherRole)).toBe(false);
      }
    });

    // Test that Admin is at the top of hierarchy
    it('Admin SHALL be at the top of the role hierarchy', () => {
      fc.assert(
        fc.property(
          allRolesGenerator,
          (role) => {
            // Admin should be higher than or equal to any role
            expect(PermissionService.hasHigherOrEqualRole('admin', role)).toBe(true);
            
            // Only Admin should be higher than or equal to Admin
            if (role !== 'admin') {
              expect(PermissionService.hasHigherOrEqualRole(role, 'admin')).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Test that Staff is positioned correctly in hierarchy
    it('Staff SHALL be positioned between Editor and Admin in hierarchy', () => {
      // Staff should be higher than Editor
      expect(PermissionService.hasHigherOrEqualRole('staff', 'editor')).toBe(true);
      expect(PermissionService.hasHigherOrEqualRole('editor', 'staff')).toBe(false);
      
      // Staff should be lower than Admin
      expect(PermissionService.hasHigherOrEqualRole('admin', 'staff')).toBe(true);
      expect(PermissionService.hasHigherOrEqualRole('staff', 'admin')).toBe(false);
      
      // Staff should be higher than User and Viewer
      expect(PermissionService.hasHigherOrEqualRole('staff', 'user')).toBe(true);
      expect(PermissionService.hasHigherOrEqualRole('staff', 'viewer')).toBe(true);
    });

    // Test invalid roles return false for hierarchy comparison
    it('hasHigherOrEqualRole SHALL return false for invalid roles', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(
            s => !Object.values(PermissionService.ROLES).includes(s)
          ),
          allRolesGenerator,
          (invalidRole, validRole) => {
            expect(PermissionService.hasHigherOrEqualRole(invalidRole, validRole)).toBe(false);
            expect(PermissionService.hasHigherOrEqualRole(validRole, invalidRole)).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Edge cases for role hierarchy
   */
  describe('Role Hierarchy Edge Cases', () => {
    
    // Test that each role is equal to itself
    it('Each role SHALL be higher than or equal to itself', () => {
      fc.assert(
        fc.property(
          allRolesGenerator,
          (role) => {
            expect(PermissionService.hasHigherOrEqualRole(role, role)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Test that getUserPermissions returns consistent results
    it('getUserPermissions SHALL return consistent results for same role', () => {
      fc.assert(
        fc.property(
          allRolesGenerator,
          (role) => {
            const permissions1 = PermissionService.getUserPermissions(role);
            const permissions2 = PermissionService.getUserPermissions(role);
            
            expect(permissions1).toEqual(permissions2);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Test that invalid role returns empty permissions
    it('getUserPermissions SHALL return empty array for invalid role', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(
            s => !Object.values(PermissionService.ROLES).includes(s)
          ),
          (invalidRole) => {
            const permissions = PermissionService.getUserPermissions(invalidRole);
            expect(permissions).toEqual([]);
          }
        ),
        { numRuns: 50 }
      );
    });

    // Test null/undefined role handling
    it('getUserPermissions SHALL return empty array for null or undefined role', () => {
      expect(PermissionService.getUserPermissions(null)).toEqual([]);
      expect(PermissionService.getUserPermissions(undefined)).toEqual([]);
    });
  });
});
