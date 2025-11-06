# User Management for Testing

## Overview
This guide explains how to delete user data for testing purposes, allowing you to test the complete user registration flow from scratch.

## Methods to Delete User Data

### Method 1: Firebase Console (Recommended)

#### Delete from Firebase Authentication:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: `equipment-lending-system-41b49`
3. Navigate to **Authentication** → **Users**
4. Find the user you want to delete
5. Click the **Delete user** button
6. Confirm deletion

#### Delete from Firestore Database:
1. Go to **Firestore Database** → **Data**
2. Navigate to the `users` collection
3. Find the document with the same UID as the deleted user
4. Click **Delete document**
5. Confirm deletion

### Method 2: Using the Delete Script

#### Prerequisites:
1. **Firebase Admin SDK Key**:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save as `firebase-admin-key.json` in project root
   - **⚠️ Never commit this file to git!**

2. **Install dependencies**:
   ```bash
   npm install firebase-admin
   ```

#### Usage:

**List all users:**
```bash
node scripts/delete-user-for-testing.js --list
```

**Delete specific user:**
```bash
node scripts/delete-user-for-testing.js user@gmail.com
```

**Examples:**
```bash
# Delete a test user
node scripts/delete-user-for-testing.js test@gmail.com

# Delete an admin user
node scripts/delete-user-for-testing.js admin@g.lpru.ac.th

# List all users to see who's in the system
node scripts/delete-user-for-testing.js --list
```

### Method 3: Browser Developer Tools (Quick)

For quick testing, you can also clear browser data:

1. **Clear Browser Storage**:
   - Open Developer Tools (F12)
   - Go to **Application** tab
   - Under **Storage**, click **Clear storage**
   - Click **Clear site data**

2. **Clear Firebase Auth Cache**:
   - In Console, run: `localStorage.clear(); sessionStorage.clear();`
   - Refresh the page

## Testing Scenarios

### 1. New User Registration Flow
1. Delete user data using one of the methods above
2. Go to the application
3. Click "เข้าสู่ระบบ"
4. Login with Google
5. Should see profile setup page
6. Fill in profile information
7. Should see "รอการอนุมัติ" status

### 2. Admin Approval Flow
1. Login as admin
2. Go to admin dashboard
3. Approve the new user
4. User should now be able to access the system

### 3. Role Testing
1. Create user with different roles:
   - Regular user: `role: 'user'`
   - Admin user: `role: 'admin'`
2. Test different access levels

## User Data Structure

When a user is created, the following data is stored:

**Firebase Authentication:**
- UID (unique identifier)
- Email
- Display name
- Photo URL
- Creation time

**Firestore Document (`users/{uid}`):**
```javascript
{
  uid: "user-uid",
  email: "user@example.com",
  displayName: "User Name",
  photoURL: "https://...",
  role: "user", // or "admin"
  status: "incomplete", // "pending", "approved", "rejected"
  firstName: "First",
  lastName: "Last",
  phoneNumber: "0123456789",
  department: "Department Name",
  userType: "student", // or "staff"
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Security Notes

1. **Firebase Admin Key**: Never commit the service account key to version control
2. **Production Data**: Never delete production user data
3. **Backup**: Always backup important data before deletion
4. **Testing Environment**: Use separate Firebase projects for testing when possible

## Troubleshooting

### Script Issues:
- **"Firebase service account key not found"**: Download the key from Firebase Console
- **"Permission denied"**: Ensure the service account has proper permissions
- **"User not found"**: The user might already be deleted

### Authentication Issues:
- **Still logged in after deletion**: Clear browser cache and localStorage
- **Profile data persists**: Check if Firestore document was properly deleted
- **Can't register again**: Wait a few minutes for Firebase to sync

## Common Commands

```bash
# Quick user deletion (replace with actual email)
node scripts/delete-user-for-testing.js test@gmail.com

# See all users in system
node scripts/delete-user-for-testing.js --list

# Clear browser data (run in browser console)
localStorage.clear(); sessionStorage.clear(); location.reload();
```