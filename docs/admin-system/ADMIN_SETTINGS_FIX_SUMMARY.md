# Admin Settings Permission Fix - Summary

## Problem
The `/admin/settings` page shows an error:
```
เกิดข้อผิดพลาดในการโหลดการตั้งค่า
Missing or insufficient permissions.
```

## Root Cause
The user profile in Firestore doesn't have `role: 'admin'`, which is required by the Firestore Security Rules to access the `settings` collection.

## Quick Fix (5 minutes)

### Step 1: Access Firebase Console
1. Go to https://console.firebase.google.com
2. Select your project: **Equipment Lending System**
3. Navigate to **Firestore Database**

### Step 2: Set User as Admin
1. Open the `users` collection
2. Find your user document (look for your email)
3. Click on the document
4. Edit the following fields:
   - `role`: Change from `"user"` to `"admin"`
   - `status`: Change to `"approved"`
5. Click **"Update"**

### Step 3: Create Settings Document (if not exists)
1. Check if `settings` collection exists
2. If not, create it:
   - Collection ID: `settings`
   - Document ID: `systemSettings`
   - Add fields:
     ```json
     {
       "maxLoanDuration": 7,
       "maxAdvanceBookingDays": 30,
       "defaultCategoryLimit": 3,
       "discordEnabled": false,
       "discordWebhookUrl": "",
       "lastUpdated": <server_timestamp>,
       "lastUpdatedBy": "system"
     }
     ```

### Step 4: Test
1. Sign out from the website
2. Clear browser cache (Ctrl+Shift+Delete)
3. Close and reopen browser
4. Sign in again
5. Navigate to Admin Settings page

## Alternative Methods

### Method 1: Using Script (Requires serviceAccountKey.json)
```bash
node scripts/check-admin-status.js
node scripts/check-admin-status.js --set-admin <USER_ID>
```

### Method 2: Using Client Script (No serviceAccountKey needed)
```bash
node scripts/check-admin-status-client.js
```

## Technical Details

### Firestore Security Rules
```javascript
match /settings/{document} {
  allow read: if isAuthenticated();
  allow write: if isAdmin();
}

function isAdmin() {
  return isAuthenticated() && 
         exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

### AuthContext Check
```javascript
isAdmin: userProfile?.role === 'admin'
```

## Files Created

1. **QUICK_FIX_ADMIN_SETTINGS.md** - Step-by-step guide in Thai
2. **ADMIN_SETTINGS_PERMISSION_FIX.md** - Detailed troubleshooting guide
3. **scripts/check-admin-status.js** - Admin SDK script
4. **scripts/check-admin-status-client.js** - Client SDK script
5. **แก้ไข-Admin-Settings.txt** - Quick reference in Thai
6. **README.md** - Updated with troubleshooting section

## Important Notes

- ⚠️ Only set the first admin manually
- ✅ Subsequent admins can be set through User Management page
- 🔒 Don't grant admin access to untrusted users
- 📊 Changes take effect immediately after re-login

## Related Documentation

- [Admin Settings Guide](docs/admin-settings-guide.md)
- [Admin Settings Infrastructure](docs/admin-settings-infrastructure.md)
- [Firestore Security Rules](firestore.rules)
- [Settings Service](src/services/settingsService.js)
- [Auth Context](src/contexts/AuthContext.js)

## Support

If you still encounter issues after following these steps:
1. Check browser console (F12) for error messages
2. Verify Firebase configuration in `.env.local`
3. Check Firestore Security Rules are deployed
4. Contact the development team with error details
