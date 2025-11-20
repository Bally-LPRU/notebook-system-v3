# Admin Settings System - Migration Guide

## Overview

This guide helps you migrate from hardcoded configuration values to the centralized Admin Settings System. Follow these steps to ensure a smooth transition with minimal disruption to your users.

## Table of Contents

1. [Pre-Migration Checklist](#pre-migration-checklist)
2. [Default Settings Configuration](#default-settings-configuration)
3. [Migration Steps](#migration-steps)
4. [Code Changes Required](#code-changes-required)
5. [Testing the Migration](#testing-the-migration)
6. [Rollback Procedures](#rollback-procedures)
7. [Post-Migration Tasks](#post-migration-tasks)
8. [Troubleshooting](#troubleshooting)

## Pre-Migration Checklist

Before starting the migration, ensure you have:

- [ ] Administrator access to the system
- [ ] Backup of current database
- [ ] List of all hardcoded configuration values
- [ ] Access to the codebase
- [ ] Test environment for validation
- [ ] Scheduled maintenance window (recommended)
- [ ] Communication plan for users
- [ ] Rollback plan prepared

## Default Settings Configuration

### Step 1: Initialize Settings Collection

Run the initialization script to create the settings infrastructure:

```bash
node scripts/initialize-settings.js
```

This script will:
- Create the `settings` collection in Firestore
- Create the `closedDates` collection
- Create the `categoryLimits` collection
- Create the `settingsAuditLog` collection
- Set up initial default values

### Step 2: Configure Default Values

The system will be initialized with these default values:

```javascript
{
  // Loan Rules
  maxLoanDuration: 14,              // days
  maxAdvanceBookingDays: 30,        // days
  
  // Category Limits
  defaultCategoryLimit: 3,          // items per category
  
  // Discord Integration
  discordWebhookUrl: null,          // not configured by default
  discordEnabled: false,
  
  // System Metadata
  version: 1,
  lastUpdated: <current timestamp>,
  lastUpdatedBy: 'system'
}
```

### Step 3: Customize Default Values

If your current hardcoded values differ from the defaults, update them:

1. Log in as an administrator
2. Navigate to Admin Settings
3. Update each setting to match your current configuration
4. Save changes

**Or** use the import feature:

1. Create a JSON file with your settings:

```json
{
  "maxLoanDuration": 7,
  "maxAdvanceBookingDays": 60,
  "defaultCategoryLimit": 5,
  "discordWebhookUrl": "https://discord.com/api/webhooks/YOUR_WEBHOOK",
  "discordEnabled": true
}
```

2. Import via Admin Settings → Import/Export tab

## Migration Steps

### Phase 1: Preparation (Day 1)

#### 1.1 Document Current Configuration

Create a spreadsheet documenting all hardcoded values:

| Setting | Current Location | Current Value | New Location |
|---------|-----------------|---------------|--------------|
| Max Loan Duration | `loanRequestService.js` line 45 | 14 days | Settings Collection |
| Max Advance Booking | `reservationService.js` line 78 | 30 days | Settings Collection |
| Category Limits | `categoryLimitService.js` line 23 | 3 items | Category Limits Collection |

#### 1.2 Identify Code Dependencies

Search your codebase for hardcoded values:

```bash
# Search for hardcoded loan duration
grep -r "maxLoanDuration\|MAX_LOAN_DURATION" src/

# Search for hardcoded booking period
grep -r "maxAdvanceBooking\|MAX_ADVANCE_BOOKING" src/

# Search for hardcoded category limits
grep -r "categoryLimit\|CATEGORY_LIMIT" src/
```

#### 1.3 Create Backup

```bash
# Backup Firestore database
gcloud firestore export gs://your-backup-bucket/backup-$(date +%Y%m%d)

# Backup codebase
git tag pre-settings-migration
git push origin pre-settings-migration
```

### Phase 2: Infrastructure Setup (Day 1-2)

#### 2.1 Deploy Settings Infrastructure

1. Deploy the settings service:
   - `src/services/settingsService.js`
   - `src/contexts/SettingsContext.js`
   - `src/hooks/useSettings.js`
   - `src/hooks/useClosedDates.js`
   - `src/hooks/useCategoryLimits.js`

2. Deploy utility files:
   - `src/utils/settingsValidation.js`
   - `src/utils/settingsCache.js`

3. Deploy admin UI components:
   - `src/components/admin/settings/AdminSettingsPage.js`
   - All tab components

#### 2.2 Update Firestore Security Rules

Deploy the updated security rules (see section below).

#### 2.3 Create Firestore Indexes

Deploy the required indexes (see section below).

#### 2.4 Initialize Settings

Run the initialization script:

```bash
node scripts/initialize-settings.js
```

Verify in Firestore console that collections were created.

### Phase 3: Code Migration (Day 2-3)

#### 3.1 Update Loan Request Form

**Before:**
```javascript
// EnhancedLoanRequestForm.js
const MAX_LOAN_DURATION = 14; // hardcoded

const maxReturnDate = addDays(borrowDate, MAX_LOAN_DURATION);
```

**After:**
```javascript
// EnhancedLoanRequestForm.js
import { useSettings } from '../../hooks/useSettings';

const { settings } = useSettings();
const maxReturnDate = addDays(borrowDate, settings.maxLoanDuration);
```

#### 3.2 Update Reservation Form

**Before:**
```javascript
// ReservationForm.js
const MAX_ADVANCE_BOOKING = 30; // hardcoded

const maxStartDate = addDays(new Date(), MAX_ADVANCE_BOOKING);
```

**After:**
```javascript
// ReservationForm.js
import { useSettings } from '../../hooks/useSettings';

const { settings } = useSettings();
const maxStartDate = addDays(new Date(), settings.maxAdvanceBookingDays);
```

#### 3.3 Update Category Limit Checks

**Before:**
```javascript
// loanRequestService.js
const DEFAULT_CATEGORY_LIMIT = 3; // hardcoded

const limit = categoryLimits[categoryId] || DEFAULT_CATEGORY_LIMIT;
```

**After:**
```javascript
// loanRequestService.js
import { settingsService } from './settingsService';

const settings = await settingsService.getSettings();
const limit = await settingsService.getCategoryLimit(categoryId) || 
              settings.defaultCategoryLimit;
```

#### 3.4 Update Date Pickers

**Before:**
```javascript
// DatePicker.js
// No closed date checking

<DatePicker
  selected={date}
  onChange={setDate}
/>
```

**After:**
```javascript
// DatePicker.js
import { useClosedDates } from '../../hooks/useClosedDates';

const { isDateClosed } = useClosedDates();

<DatePicker
  selected={date}
  onChange={setDate}
  filterDate={(date) => !isDateClosed(date)}
/>
```

### Phase 4: Testing (Day 3-4)

#### 4.1 Unit Testing

Run all unit tests:

```bash
npm test
```

Verify:
- Settings service CRUD operations
- Validation logic
- Cache management
- Hook functionality

#### 4.2 Integration Testing

Test the integration points:

1. **Loan Request Form:**
   - Create loan request with various durations
   - Verify max duration is enforced
   - Test with closed dates

2. **Reservation Form:**
   - Create reservation with various dates
   - Verify advance booking limit is enforced
   - Test with closed dates

3. **Category Limits:**
   - Borrow equipment up to limit
   - Verify limit enforcement
   - Test with different categories

4. **Settings Updates:**
   - Change settings in admin panel
   - Verify immediate application
   - Check audit log entries

#### 4.3 End-to-End Testing

Test complete user workflows:

1. Admin updates max loan duration
2. User creates loan request
3. Verify new limit is applied
4. Check audit log shows the change

### Phase 5: Deployment (Day 4-5)

#### 5.1 Deploy to Staging

1. Deploy code changes to staging environment
2. Run initialization script
3. Configure settings via admin panel
4. Run full test suite
5. Perform manual testing

#### 5.2 Deploy to Production

**Recommended: During low-traffic period**

1. Announce maintenance window to users
2. Deploy code changes
3. Run initialization script
4. Configure production settings
5. Verify all functionality
6. Monitor for errors
7. Announce completion

#### 5.3 Monitor Post-Deployment

Monitor for 24-48 hours:
- Error logs
- User reports
- Performance metrics
- Audit log for unexpected changes

## Code Changes Required

### Files to Modify

#### 1. Loan Request Components

**Files:**
- `src/components/loan/EnhancedLoanRequestForm.js`
- `src/services/loanRequestService.js`

**Changes:**
- Import `useSettings` hook
- Replace hardcoded `MAX_LOAN_DURATION` with `settings.maxLoanDuration`
- Add loading state handling

#### 2. Reservation Components

**Files:**
- `src/components/reservations/ReservationForm.js`
- `src/services/reservationService.js`

**Changes:**
- Import `useSettings` hook
- Replace hardcoded `MAX_ADVANCE_BOOKING` with `settings.maxAdvanceBookingDays`
- Add loading state handling

#### 3. Date Picker Components

**Files:**
- `src/components/equipment/DatePicker.js`
- `src/components/admin/settings/ClosedDatePicker.js`

**Changes:**
- Import `useClosedDates` hook
- Add `filterDate` prop to disable closed dates
- Add tooltip for disabled dates

#### 4. Category Limit Validation

**Files:**
- `src/services/loanRequestService.js`
- `src/hooks/useLoanRequestValidation.js`

**Changes:**
- Import `useCategoryLimits` hook
- Replace hardcoded limits with dynamic limits
- Update error messages to show current limit

#### 5. App Root Component

**File:**
- `src/App.js`

**Changes:**
- Wrap app with `SettingsProvider`

```javascript
import { SettingsProvider } from './contexts/SettingsContext';

function App() {
  return (
    <SettingsProvider>
      {/* existing app content */}
    </SettingsProvider>
  );
}
```

### Example Migration Pattern

**Before:**
```javascript
// Component with hardcoded value
function LoanForm() {
  const MAX_DURATION = 14;
  
  const validateDuration = (days) => {
    return days <= MAX_DURATION;
  };
  
  return <div>Max duration: {MAX_DURATION} days</div>;
}
```

**After:**
```javascript
// Component using settings
import { useSettings } from '../../hooks/useSettings';

function LoanForm() {
  const { settings, loading } = useSettings();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  const validateDuration = (days) => {
    return days <= settings.maxLoanDuration;
  };
  
  return <div>Max duration: {settings.maxLoanDuration} days</div>;
}
```

## Testing the Migration

### Test Checklist

#### Settings Management
- [ ] Can access admin settings page as admin
- [ ] Cannot access as non-admin
- [ ] Can update loan duration
- [ ] Can update advance booking period
- [ ] Can add closed dates
- [ ] Can remove closed dates
- [ ] Can set category limits
- [ ] Can configure Discord webhook
- [ ] Can create system notifications
- [ ] Can view audit log
- [ ] Can export settings
- [ ] Can import settings

#### Loan Request Form
- [ ] Max duration is enforced
- [ ] Closed dates are disabled
- [ ] Category limits are checked
- [ ] Error messages are clear
- [ ] Changes apply immediately

#### Reservation Form
- [ ] Advance booking limit is enforced
- [ ] Closed dates are disabled
- [ ] Error messages are clear
- [ ] Changes apply immediately

#### Performance
- [ ] Settings load quickly (< 1 second)
- [ ] Cache is working
- [ ] No excessive database queries
- [ ] Real-time updates work

#### Audit & Security
- [ ] All changes are logged
- [ ] Audit log shows correct information
- [ ] Non-admins cannot modify settings
- [ ] Sensitive data is protected

## Rollback Procedures

If issues occur during migration, follow these rollback steps:

### Immediate Rollback (< 1 hour after deployment)

#### Option 1: Code Rollback

```bash
# Revert to previous version
git revert HEAD
git push origin main

# Redeploy previous version
npm run deploy
```

#### Option 2: Feature Flag

If you implemented a feature flag:

```javascript
// In your code
const USE_SETTINGS_SYSTEM = false; // disable new system

if (USE_SETTINGS_SYSTEM) {
  // Use settings from database
} else {
  // Use hardcoded values
}
```

### Database Rollback

#### Restore Firestore Backup

```bash
# Restore from backup
gcloud firestore import gs://your-backup-bucket/backup-YYYYMMDD
```

#### Manual Cleanup

If you need to remove settings collections:

```javascript
// Run this script to clean up
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

async function cleanup() {
  // Delete settings collection
  const settingsRef = db.collection('settings');
  const snapshot = await settingsRef.get();
  snapshot.forEach(doc => doc.ref.delete());
  
  // Delete other collections
  // ... similar for closedDates, categoryLimits, settingsAuditLog
}

cleanup();
```

### Gradual Rollback

If only specific features are problematic:

1. **Disable Discord Integration:**
   - Set `discordEnabled` to `false` in settings
   - Or remove webhook URL

2. **Revert Specific Components:**
   - Revert loan form to use hardcoded values
   - Keep other features using settings

3. **Disable Closed Dates:**
   - Remove all closed dates
   - Revert date pickers to original version

## Post-Migration Tasks

### Week 1

- [ ] Monitor error logs daily
- [ ] Review audit log for unexpected changes
- [ ] Collect user feedback
- [ ] Address any issues promptly
- [ ] Document any problems and solutions

### Week 2-4

- [ ] Review settings usage patterns
- [ ] Adjust default values if needed
- [ ] Train additional administrators
- [ ] Update documentation based on feedback
- [ ] Optimize performance if needed

### Month 2-3

- [ ] Remove old hardcoded values from codebase
- [ ] Clean up feature flags
- [ ] Archive migration documentation
- [ ] Conduct retrospective meeting
- [ ] Plan future enhancements

### Ongoing

- [ ] Export settings weekly for backup
- [ ] Review audit log monthly
- [ ] Update category limits based on usage
- [ ] Add closed dates in advance
- [ ] Monitor Discord notifications

## Troubleshooting

### Issue: Settings Not Loading

**Symptoms:**
- Components show loading state indefinitely
- Error: "Cannot read property 'maxLoanDuration' of undefined"

**Solutions:**
1. Check Firestore connection
2. Verify settings collection exists
3. Run initialization script
4. Check browser console for errors
5. Verify SettingsProvider is wrapping the app

### Issue: Changes Not Applying Immediately

**Symptoms:**
- Updated settings don't take effect
- Old values still being used

**Solutions:**
1. Check cache invalidation logic
2. Verify real-time listeners are working
3. Clear browser cache
4. Check for stale closures in components
5. Restart the application

### Issue: Permission Denied Errors

**Symptoms:**
- Error: "Missing or insufficient permissions"
- Cannot save settings

**Solutions:**
1. Verify user has admin role
2. Check Firestore security rules
3. Verify rules were deployed correctly
4. Check user document in Firestore
5. Re-authenticate the user

### Issue: Import Fails

**Symptoms:**
- Import validation errors
- Settings not restored

**Solutions:**
1. Validate JSON syntax
2. Check file structure matches expected format
3. Verify all required fields are present
4. Check value types and ranges
5. Try exporting current settings and compare

### Issue: Audit Log Not Recording

**Symptoms:**
- No entries in audit log
- Missing change history

**Solutions:**
1. Verify audit log collection exists
2. Check settingsService.logSettingChange() is called
3. Verify Firestore security rules allow writes
4. Check for JavaScript errors
5. Verify admin ID is being captured

### Issue: Discord Notifications Not Sending

**Symptoms:**
- Test webhook fails
- No notifications received

**Solutions:**
1. Verify webhook URL is correct
2. Test webhook directly in Discord
3. Check Discord server permissions
4. Verify discordEnabled is true
5. Check network/firewall settings
6. Review error logs

## Additional Resources

### Scripts

- `scripts/initialize-settings.js` - Initialize settings infrastructure
- `scripts/migrate-hardcoded-values.js` - Automated migration helper
- `scripts/validate-settings.js` - Validate settings configuration
- `scripts/backup-settings.js` - Backup settings to file

### Documentation

- `docs/admin-settings-guide.md` - Complete user guide
- `docs/admin-settings-infrastructure.md` - Technical documentation
- `.kiro/specs/admin-settings-system/design.md` - System design
- `.kiro/specs/admin-settings-system/requirements.md` - Requirements

### Support

For additional help:
- Check the troubleshooting section in the user guide
- Review the audit log for clues
- Check browser console for errors
- Contact the development team

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Maintained By:** Development Team
