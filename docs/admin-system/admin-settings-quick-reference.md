# Admin Settings System - Quick Reference

## Quick Links

- **User Guide:** `docs/admin-settings-guide.md`
- **Migration Guide:** `docs/admin-settings-migration-guide.md`
- **Deployment Checklist:** `docs/admin-settings-deployment-checklist.md`
- **Technical Docs:** `docs/admin-settings-infrastructure.md`

## Common Commands

### Initialization
```bash
# Initialize settings infrastructure
node scripts/initialize-settings.js
```

### Deployment
```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes

# Deploy everything
firebase deploy
```

### Testing
```bash
# Test security rules
node scripts/test-settings-security-rules.js

# Test indexes
node scripts/test-settings-indexes.js

# Run all tests
npm test
```

### Monitoring
```bash
# Check index status
firebase firestore:indexes

# View Firebase logs
firebase functions:log
```

## Default Values

| Setting | Default | Range | Unit |
|---------|---------|-------|------|
| Max Loan Duration | 14 | 1-365 | days |
| Max Advance Booking | 30 | 1-365 | days |
| Default Category Limit | 3 | 1-100 | items |

## Collections

| Collection | Purpose | Access |
|------------|---------|--------|
| `settings` | System settings | Admin write, All read |
| `closedDates` | Closed dates | Admin write, All read |
| `categoryLimits` | Category limits | Admin write, All read |
| `settingsAuditLog` | Change history | Admin read only |
| `systemNotifications` | Announcements | Admin write, All read/update |

## API Quick Reference

### Settings Service

```javascript
import { settingsService } from './services/settingsService';

// Get all settings
const settings = await settingsService.getSettings();

// Update a setting
await settingsService.updateSetting('maxLoanDuration', 14);

// Add closed date
await settingsService.addClosedDate(date, 'Holiday');

// Check if date is closed
const isClosed = await settingsService.isDateClosed(date);

// Set category limit
await settingsService.setCategoryLimit('categoryId', 5);
```

### React Hooks

```javascript
import { useSettings } from './hooks/useSettings';
import { useClosedDates } from './hooks/useClosedDates';
import { useCategoryLimits } from './hooks/useCategoryLimits';

// In component
const { settings, loading, error } = useSettings();
const { isDateClosed } = useClosedDates();
const { getCategoryLimit } = useCategoryLimits();
```

## Troubleshooting Quick Fixes

### Settings Not Loading
```javascript
// Check if SettingsProvider is wrapping your app
<SettingsProvider>
  <App />
</SettingsProvider>
```

### Permission Denied
```bash
# Verify user role in Firestore
# Check: users/{userId}.role === 'admin'
```

### Cache Issues
```javascript
// Force refresh settings
const { refreshSettings } = useSettings();
await refreshSettings();
```

### Index Building
```bash
# Check status
firebase firestore:indexes

# Wait for: "State: READY"
```

## Emergency Contacts

- **Technical Lead:** [Name/Email]
- **DevOps:** [Name/Email]
- **On-Call:** [Phone/Slack]

## Rollback Command

```bash
# Quick rollback
git revert HEAD && git push origin main && npm run deploy
```

## Support Resources

- **Firebase Console:** https://console.firebase.google.com
- **Documentation:** `/docs` folder
- **Issue Tracker:** [Link to your issue tracker]
- **Team Chat:** [Link to Slack/Discord]

---

**Last Updated:** 2024  
**Version:** 1.0
