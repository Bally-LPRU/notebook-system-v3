# Admin Settings System - Deployment Checklist

## Overview

This checklist ensures a smooth deployment of the Admin Settings System to production. Follow each step carefully and mark items as complete.

## Pre-Deployment

### Documentation Review
- [ ] Read `docs/admin-settings-guide.md` (user guide)
- [ ] Read `docs/admin-settings-migration-guide.md` (migration guide)
- [ ] Review `docs/admin-settings-infrastructure.md` (technical docs)
- [ ] Understand rollback procedures

### Environment Preparation
- [ ] Backup production database
- [ ] Verify Firebase CLI is installed (`firebase --version`)
- [ ] Verify correct Firebase project is selected (`firebase use`)
- [ ] Test environment is ready for validation
- [ ] Maintenance window scheduled (if needed)
- [ ] User communication prepared

### Code Review
- [ ] All code changes reviewed and approved
- [ ] All tests passing locally
- [ ] No console errors or warnings
- [ ] Property-based tests completed
- [ ] Integration tests verified

## Deployment Steps

### Step 1: Initialize Settings Infrastructure

```bash
# Run the initialization script
node scripts/initialize-settings.js
```

**Verify:**
- [ ] `settings` collection created in Firestore
- [ ] `closedDates` collection created
- [ ] `categoryLimits` collection created
- [ ] `settingsAuditLog` collection created
- [ ] `systemNotifications` collection created
- [ ] Default values are set correctly

### Step 2: Deploy Firestore Security Rules

```bash
# Test rules first (dry run)
node scripts/deploy-settings-security-rules.js

# Or manually:
firebase deploy --only firestore:rules --dry-run

# If dry run passes, deploy
firebase deploy --only firestore:rules
```

**Verify:**
- [ ] Rules deployed successfully
- [ ] No deployment errors
- [ ] Check Firebase Console → Firestore → Rules
- [ ] Rules version updated

**Test Rules:**
```bash
node scripts/test-settings-security-rules.js
```

- [ ] All security rule tests pass
- [ ] Admin can read/write settings
- [ ] Users can read settings
- [ ] Non-admins cannot write settings

### Step 3: Deploy Firestore Indexes

```bash
# Deploy indexes
node scripts/deploy-settings-indexes.js

# Or manually:
firebase deploy --only firestore:indexes
```

**Verify:**
- [ ] Indexes deployed successfully
- [ ] Check Firebase Console → Firestore → Indexes
- [ ] Index building started (may take time)

**Monitor Index Building:**
```bash
firebase firestore:indexes
```

- [ ] Check index status periodically
- [ ] Wait for all indexes to complete building (optional but recommended)

**Test Indexes:**
```bash
node scripts/test-settings-indexes.js
```

- [ ] All index tests pass
- [ ] Query performance is acceptable

### Step 4: Deploy Application Code

```bash
# Build the application
npm run build

# Deploy to your hosting platform
# (Vercel, Firebase Hosting, etc.)
```

**Verify:**
- [ ] Build completed successfully
- [ ] No build errors or warnings
- [ ] Deployment successful
- [ ] Application is accessible

### Step 5: Configure Default Settings

**Via Admin UI:**
1. [ ] Log in as administrator
2. [ ] Navigate to Admin Settings page
3. [ ] Configure each setting:
   - [ ] Max Loan Duration (default: 14 days)
   - [ ] Max Advance Booking Days (default: 30 days)
   - [ ] Default Category Limit (default: 3 items)
   - [ ] Discord Webhook (if using)
4. [ ] Save all settings
5. [ ] Verify settings are saved (check Firestore)

**Or via Import:**
1. [ ] Prepare settings JSON file
2. [ ] Import via Admin Settings → Import/Export
3. [ ] Verify import successful

### Step 6: Add Initial Closed Dates

- [ ] Add upcoming holidays
- [ ] Add planned maintenance dates
- [ ] Verify dates appear in date pickers
- [ ] Test that dates are disabled correctly

### Step 7: Configure Category Limits

- [ ] Review equipment categories
- [ ] Set appropriate limits for each category
- [ ] Test limit enforcement
- [ ] Verify error messages are clear

### Step 8: Test Discord Integration (if using)

- [ ] Configure Discord webhook URL
- [ ] Test webhook connection
- [ ] Verify test message received in Discord
- [ ] Test actual notifications (loan request, overdue, etc.)

## Post-Deployment Verification

### Functional Testing

**Settings Management:**
- [ ] Admin can access settings page
- [ ] Non-admin cannot access settings page
- [ ] Settings can be updated
- [ ] Changes are saved correctly
- [ ] Audit log records changes

**Closed Dates:**
- [ ] Closed dates appear in list
- [ ] Dates are disabled in loan form
- [ ] Dates are disabled in reservation form
- [ ] Tooltips show reason for closure
- [ ] Can add new closed dates
- [ ] Can remove closed dates

**Loan Rules:**
- [ ] Max loan duration is enforced
- [ ] Date picker limits return date
- [ ] Error message shows max duration
- [ ] Changes apply immediately

**Advance Booking:**
- [ ] Max advance booking is enforced
- [ ] Date picker limits reservation date
- [ ] Error message shows max period
- [ ] Changes apply immediately

**Category Limits:**
- [ ] Limits are enforced on loan requests
- [ ] Error message shows current count and limit
- [ ] Default limit applies when no specific limit set
- [ ] Changes apply immediately

**System Notifications:**
- [ ] Can create notifications
- [ ] Notifications appear on user login
- [ ] Users can mark as read
- [ ] Feedback collection works (if enabled)
- [ ] Notification history is visible

**Audit Log:**
- [ ] All changes are logged
- [ ] Log shows correct information
- [ ] Filtering works correctly
- [ ] Pagination works
- [ ] Critical changes notify admins

**Import/Export:**
- [ ] Can export settings
- [ ] Export file is valid JSON
- [ ] Can import settings
- [ ] Backup is created before import
- [ ] Validation works correctly

### Performance Testing

- [ ] Settings load quickly (< 1 second)
- [ ] Cache is working
- [ ] No excessive database queries
- [ ] Real-time updates work
- [ ] Audit log queries are fast
- [ ] No performance degradation

### Security Testing

- [ ] Non-admins cannot access settings page
- [ ] Non-admins cannot modify settings
- [ ] Audit log is admin-only
- [ ] Sensitive data is protected
- [ ] Security rules are enforced

### Integration Testing

- [ ] Loan request form uses settings
- [ ] Reservation form uses settings
- [ ] Date pickers use closed dates
- [ ] Category limits are checked
- [ ] Discord notifications work
- [ ] System notifications appear

## Monitoring

### First 24 Hours

- [ ] Monitor error logs
- [ ] Check for permission errors
- [ ] Monitor query performance
- [ ] Check user reports
- [ ] Verify audit log entries
- [ ] Monitor Discord notifications (if using)

### First Week

- [ ] Review audit log daily
- [ ] Check for unexpected changes
- [ ] Monitor performance metrics
- [ ] Collect user feedback
- [ ] Address any issues promptly

### Ongoing

- [ ] Export settings weekly (backup)
- [ ] Review audit log monthly
- [ ] Update closed dates in advance
- [ ] Adjust limits based on usage
- [ ] Archive old audit logs (> 2 years)

## Rollback Procedures

### If Issues Occur

**Immediate Rollback (< 1 hour):**

1. **Revert Code:**
   ```bash
   git revert HEAD
   git push origin main
   npm run deploy
   ```

2. **Restore Database:**
   ```bash
   gcloud firestore import gs://your-backup-bucket/backup-YYYYMMDD
   ```

3. **Revert Security Rules:**
   ```bash
   git checkout HEAD~1 firestore.rules
   firebase deploy --only firestore:rules
   ```

**Partial Rollback:**

- Disable specific features via settings
- Revert specific components
- Keep infrastructure in place

**Communication:**
- [ ] Notify users of rollback
- [ ] Explain what happened
- [ ] Provide timeline for fix
- [ ] Update status page (if applicable)

## Troubleshooting

### Common Issues

**Settings Not Loading:**
- Check Firestore connection
- Verify settings collection exists
- Check browser console for errors
- Verify SettingsProvider is wrapping app

**Permission Denied:**
- Verify user has admin role
- Check Firestore security rules
- Verify rules were deployed
- Check user document in Firestore

**Changes Not Applying:**
- Check cache invalidation
- Verify real-time listeners
- Clear browser cache
- Restart application

**Indexes Not Working:**
- Check index building status
- Wait for indexes to complete
- Verify indexes were deployed
- Check Firebase Console

**Discord Not Working:**
- Verify webhook URL
- Test webhook in Discord
- Check network/firewall
- Review error logs

## Success Criteria

Deployment is successful when:

- [ ] All tests pass
- [ ] No errors in logs
- [ ] Settings can be managed via admin UI
- [ ] Loan rules are enforced
- [ ] Closed dates work correctly
- [ ] Category limits are enforced
- [ ] Audit log is recording changes
- [ ] Performance is acceptable
- [ ] Users can use the system normally
- [ ] No user complaints

## Documentation

### Update After Deployment

- [ ] Document any issues encountered
- [ ] Update troubleshooting guide
- [ ] Record actual deployment time
- [ ] Note any deviations from plan
- [ ] Update runbook with lessons learned

### Share with Team

- [ ] Deployment summary
- [ ] Known issues (if any)
- [ ] Monitoring instructions
- [ ] Support procedures
- [ ] Contact information

## Sign-Off

**Deployed By:** ___________________  
**Date:** ___________________  
**Time:** ___________________  
**Environment:** Production / Staging  
**Version:** ___________________  

**Verified By:** ___________________  
**Date:** ___________________  

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Next Review:** After deployment
