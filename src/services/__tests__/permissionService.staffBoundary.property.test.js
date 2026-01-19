/**
 * Property-based tests for Staff Permission Boundary
 * 
 * **Feature: staff-role-system, Property 1: Staff Permission Boundary**
 * **Validates: Requirements 2.1, 2.2, 2.3**
 * 
 * Property: For any user with Staff role, checking any permission in the granted list
 * SHALL return true, and checking any permission NOT in the granted list SHALL return false.
 */

import fc from 'fast-check';
import PermissionService from '../permissionService';

// Define the exact permissions that Staff should have (from Requirements 2.1)
const STAFF_GRANTED_PERMISSIONS = [
  PermissionService.PERMISSIONS.LOAN_REQUEST_VIEW,
  PermissionService.PERMISSIONS.LOAN_REQUEST_APPROVE,
  PermissionService.PERMISSIONS.LOAN_REQUEST_REJECT,
  PermissionService.PERMISSIONS.LOAN_RETURN_PROCESS,
  PermissionService.PERMISSIONS.LOAN_RETURN_VERIFY,
  PermissionService.PERMISSIONS.EQUIPMENT_VIEW,
  PermissionService.PERMISSIONS.OVERDUE_VIEW,
  PermissionService.PERMISSIONS.OVERDUE_NOTIFY,
  PermissionService.PERMISSIONS.CATEGORY_VIEW,
  PermissionService.PERMISSIONS.REPORT_VIEW
];

// Get the restricted permissions from the service itself (from Requirements 2.2)
// This ensures the test stays in sync with the actual implementation
const STAFF_RESTRICTED_PERMISSIONS = PermissionService.getStaffRestrictedPermissions();

// Generator for Staff user objects with random but valid user data
const staffUserGenerator = fc.record({
  uid: fc.uuid(),
  email: fc.emailAddress(),
  displayName: fc.string({ minLength: 1, maxLength: 50 }),
  role: fc.constant('staff'),
  status: fc.constant('approved')
});

// Generator for granted permissions
const grantedPermissionGenerator = fc.constantFrom(...STAFF_GRANTED_PERMISSIONS);

// Generator for restricted permissions
const restrictedPermissionGenerator = fc.constantFrom(...STAFF_RESTRICTED_PERMISSIONS);

// Generator for all permissions (to test boundary)
const allPermissionsGenerator = fc.constantFrom(
  ...Object.values(PermissionService.PERMISSIONS)
);

describe('Staff Permission Boundary Property Tests', () => {
  /**
   * **Feature: staff-role-system, Property 1: Staff Permission Boundary**
   * **Validates: Requirements 2.1, 2.2, 2.3**
   */
  describe('Property 1: Staff Permission Boundary', () => {
    
    // Test that Staff has all granted permissions
    it('For any Staff user and any granted permission, hasPermission SHALL return true', () => {
      fc.assert(
        fc.property(
          staffUserGenerator,
          grantedPermissionGenerator,
          (staffUser, permission) => {
            const result = PermissionService.hasPermission(staffUser, permission);
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Test that Staff does NOT have restricted permissions
    it('For any Staff user and any restricted permission, hasPermission SHALL return false', () => {
      fc.assert(
        fc.property(
          staffUserGenerator,
          restrictedPermissionGenerator,
          (staffUser, permission) => {
            const result = PermissionService.hasPermission(staffUser, permission);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Test the complete boundary: permission is granted IFF it's in the granted list
    it('For any Staff user and any permission, hasPermission returns true IFF permission is in granted list', () => {
      fc.assert(
        fc.property(
          staffUserGenerator,
          allPermissionsGenerator,
          (staffUser, permission) => {
            const result = PermissionService.hasPermission(staffUser, permission);
            const shouldBeGranted = STAFF_GRANTED_PERMISSIONS.includes(permission);
            
            expect(result).toBe(shouldBeGranted);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Test that getUserPermissions returns exactly the granted permissions
    it('getUserPermissions for Staff SHALL return exactly the granted permissions set', () => {
      const staffPermissions = PermissionService.getUserPermissions('staff');
      
      // All granted permissions should be present
      STAFF_GRANTED_PERMISSIONS.forEach(permission => {
        expect(staffPermissions).toContain(permission);
      });
      
      // No restricted permissions should be present
      STAFF_RESTRICTED_PERMISSIONS.forEach(permission => {
        expect(staffPermissions).not.toContain(permission);
      });
      
      // The count should match
      expect(staffPermissions.length).toBe(STAFF_GRANTED_PERMISSIONS.length);
    });

    // Test that Staff-specific helper methods align with permission checks
    it('Staff-specific helper methods SHALL align with hasPermission results', () => {
      fc.assert(
        fc.property(
          staffUserGenerator,
          (staffUser) => {
            // canApproveLoan should match LOAN_REQUEST_APPROVE permission
            expect(PermissionService.canApproveLoan(staffUser)).toBe(
              PermissionService.hasPermission(staffUser, PermissionService.PERMISSIONS.LOAN_REQUEST_APPROVE)
            );
            
            // canRejectLoan should match LOAN_REQUEST_REJECT permission
            expect(PermissionService.canRejectLoan(staffUser)).toBe(
              PermissionService.hasPermission(staffUser, PermissionService.PERMISSIONS.LOAN_REQUEST_REJECT)
            );
            
            // canProcessReturn should match LOAN_RETURN_PROCESS permission
            expect(PermissionService.canProcessReturn(staffUser)).toBe(
              PermissionService.hasPermission(staffUser, PermissionService.PERMISSIONS.LOAN_RETURN_PROCESS)
            );
            
            // canViewOverdue should match OVERDUE_VIEW permission
            expect(PermissionService.canViewOverdue(staffUser)).toBe(
              PermissionService.hasPermission(staffUser, PermissionService.PERMISSIONS.OVERDUE_VIEW)
            );
            
            // canNotifyOverdue should match OVERDUE_NOTIFY permission
            expect(PermissionService.canNotifyOverdue(staffUser)).toBe(
              PermissionService.hasPermission(staffUser, PermissionService.PERMISSIONS.OVERDUE_NOTIFY)
            );
            
            // canViewLoanRequests should match LOAN_REQUEST_VIEW permission
            expect(PermissionService.canViewLoanRequests(staffUser)).toBe(
              PermissionService.hasPermission(staffUser, PermissionService.PERMISSIONS.LOAN_REQUEST_VIEW)
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    // Test that isStaffRestrictedPermission correctly identifies restricted permissions
    it('isStaffRestrictedPermission SHALL correctly identify all restricted permissions', () => {
      fc.assert(
        fc.property(
          allPermissionsGenerator,
          (permission) => {
            const isRestricted = PermissionService.isStaffRestrictedPermission(permission);
            const serviceRestrictedList = PermissionService.getStaffRestrictedPermissions();
            const shouldBeRestricted = serviceRestrictedList.includes(permission);
            
            // The service's isStaffRestrictedPermission should match its own restricted list
            expect(isRestricted).toBe(shouldBeRestricted);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Test that getStaffRestrictedPermissions returns a subset of all permissions
    it('getStaffRestrictedPermissions SHALL return permissions that Staff does not have', () => {
      const restrictedByService = PermissionService.getStaffRestrictedPermissions();
      const staffPermissions = PermissionService.getUserPermissions('staff');
      
      // No overlap between restricted and granted
      restrictedByService.forEach(permission => {
        expect(staffPermissions).not.toContain(permission);
      });
    });
  });

  /**
   * Additional boundary tests for edge cases
   */
  describe('Staff Permission Boundary Edge Cases', () => {
    
    // Test with various user statuses (only approved should work)
    it('Staff permissions SHALL only apply when user status is approved', () => {
      const statuses = ['pending', 'rejected', 'suspended'];
      
      statuses.forEach(status => {
        const staffUser = {
          uid: 'test-staff',
          email: 'staff@test.com',
          role: 'staff',
          status: status
        };
        
        // For non-approved users, validateEquipmentAccess should deny
        const result = PermissionService.validateEquipmentAccess(staffUser, 'view');
        expect(result.allowed).toBe(false);
      });
    });

    // Test that null/undefined user returns false for all permissions
    it('hasPermission SHALL return false for null or undefined user', () => {
      fc.assert(
        fc.property(
          allPermissionsGenerator,
          (permission) => {
            expect(PermissionService.hasPermission(null, permission)).toBe(false);
            expect(PermissionService.hasPermission(undefined, permission)).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });

    // Test that user without role returns false for all permissions
    it('hasPermission SHALL return false for user without role', () => {
      fc.assert(
        fc.property(
          fc.record({
            uid: fc.uuid(),
            email: fc.emailAddress(),
            status: fc.constant('approved')
            // Note: no role field
          }),
          allPermissionsGenerator,
          (userWithoutRole, permission) => {
            expect(PermissionService.hasPermission(userWithoutRole, permission)).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
