# Archived Scripts

This directory contains scripts that were used for one-time fixes and debugging during development. These scripts are kept for historical reference but are no longer actively maintained.

## Debug Scripts

### Authentication & Login Issues

- **`debug-admin-login.js`** - Debugged admin login issues
  - Checked Firebase auth state
  - Verified user profiles
  - Detected duplicate profiles
  - Used during initial authentication setup

- **`debug-auth-issues.js`** - General authentication debugging guide
  - Popup blocker detection
  - Third-party cookies issues
  - Firebase configuration validation
  - Browser-specific troubleshooting

- **`debug-login-button.js`** - Debugged login button functionality
  - Used to troubleshoot login UI issues

- **`test-auth-function.js`** - Tested authentication functions
  - Validated auth flow
  - Tested token generation

### Equipment Access Issues

- **`debug-equipment-access.js`** - Debugged equipment page access
  - Checked Firestore permissions
  - Validated user roles
  - Tested collection access
  - Resolved permission-denied errors

## Fix Scripts

### Profile & User Management

- **`fix-duplicate-profiles.js`** - Fixed duplicate user profiles
  - Removed duplicate user documents
  - Kept correct profile (matching UID)
  - Cleaned up orphaned profiles
  - **Issue resolved**: Duplicate profile prevention implemented

- **`fix-profile-and-admin.js`** - Fixed profile setup and admin access
  - Updated Firestore rules
  - Set first admin user
  - Resolved profile creation issues
  - **Issue resolved**: Profile setup flow improved

- **`force-admin-redirect.js`** - Forced redirect to admin dashboard
  - Updated user role to admin
  - Changed status to approved
  - Redirected to admin page
  - **Issue resolved**: Proper routing implemented

### Equipment Data Fixes

- **`fix-equipment-data.js`** - Fixed equipment data structure
  - Ensured array fields are arrays
  - Added missing required fields
  - Fixed timestamps
  - Generated search keywords
  - **Issue resolved**: Data validation added to forms

- **`fix-equipment-arrays.js`** - Fixed null array fields
  - Converted null to empty arrays
  - Fixed images, tags, searchKeywords
  - **Issue resolved**: Schema validation implemented

- **`fix-equipment-schema.js`** - Fixed equipment schema structure
  - Updated category structure
  - Fixed status values
  - Added location and responsiblePerson
  - **Issue resolved**: Proper schema enforced in code

- **`fix-equipment-schema-client.js`** - Client-side schema fixes
  - Fixed schema mismatches in UI
  - **Issue resolved**: Form validation improved

- **`fix-equipment-status.js`** - Fixed invalid equipment status values
  - Mapped old status values to new ones
  - Standardized status field
  - **Issue resolved**: Status enum enforced

- **`fix-equipment-access.js`** - Fixed equipment access permissions
  - Refreshed auth tokens
  - Updated user documents
  - **Issue resolved**: Permission system redesigned

### Authentication Fixes

- **`fix-popup-blocker.js`** - Guide for fixing popup blocker issues
  - Browser-specific instructions
  - Testing procedures
  - **Issue resolved**: Redirect auth implemented as fallback

## Test Scripts

- **`test-equipment-data.js`** - Tested equipment data operations
  - Validated CRUD operations
  - Tested data integrity

- **`test-incognito-mode.js`** - Tested incognito mode compatibility
  - Verified auth in private browsing
  - Tested cookie handling

## HTML Utilities

- **`quick-fix-equipment-access.html`** - Browser-based quick fix tool
  - Provided UI for common fixes
  - Allowed manual data corrections
  - **Replaced by**: Admin dashboard tools

## Why These Scripts Are Archived

### Issues Resolved

All issues these scripts addressed have been permanently fixed through:

1. **Improved Data Validation**: Forms now validate data before submission
2. **Better Schema Design**: Proper TypeScript types and validation
3. **Enhanced Auth Flow**: Redirect auth as fallback, better error handling
4. **Firestore Rules**: Proper security rules prevent bad data
5. **UI Improvements**: Better user feedback and error messages

### Code Improvements

The root causes have been addressed:

- **Profile Creation**: Robust profile setup flow with validation
- **Equipment Schema**: Enforced schema with proper defaults
- **Authentication**: Multiple auth methods with fallbacks
- **Permissions**: Clear role-based access control
- **Data Integrity**: Validation at multiple layers

### When to Use These Scripts

These scripts should **NOT** be used in production. They are kept only for:

- Historical reference
- Understanding past issues
- Learning from solutions
- Emergency recovery (with caution)

If you need to use any of these scripts:

1. Review the current codebase first
2. Check if the issue still exists
3. Consider if a better solution is available
4. Test thoroughly in development
5. Update the script if needed

## Migration Notes

If you're maintaining this codebase and encounter similar issues:

1. **Don't use these scripts** - They may be outdated
2. **Check the current implementation** - Issues are likely fixed
3. **Review recent changes** - Solutions may be in place
4. **Consult documentation** - Proper procedures documented
5. **Ask for help** - Don't guess with production data

## Historical Context

These scripts were created during:

- Initial development (2024)
- Authentication system setup
- Equipment management implementation
- Production deployment troubleshooting
- User feedback response

They represent learning experiences and evolution of the system.

## Cleanup Policy

Scripts remain archived if:

- They document important historical issues
- They might be needed for emergency recovery
- They provide insight into system evolution

Scripts should be deleted if:

- They're completely obsolete
- The code they reference no longer exists
- They could cause harm if run accidentally
- They contain sensitive information

## Security Warning

⚠️ **WARNING**: These scripts may:

- Modify production data
- Bypass security rules
- Create inconsistent state
- Cause data loss

**Never run archived scripts without**:

- Understanding what they do
- Testing in development first
- Having a backup
- Reviewing current codebase
- Consulting with team

## Support

For questions about archived scripts:

1. Check git history for context
2. Review related documentation
3. Examine current implementation
4. Consult with senior developers
5. Consider modern alternatives

---

**Last Updated**: November 2025  
**Status**: Archived - Do Not Use in Production
