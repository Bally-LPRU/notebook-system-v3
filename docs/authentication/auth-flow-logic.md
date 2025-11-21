# Authentication Flow Logic

## Overview
This document describes the complete authentication flow logic for the Equipment Lending System.

## Authentication States and Flow

### 1. Loading State
- **Condition**: `loading === true`
- **Display**: Loading spinner with "กำลังโหลด..." message
- **Purpose**: While Firebase auth state is being determined

### 2. Not Authenticated
- **Condition**: `!user`
- **Routes Available**:
  - `/` → PublicHomepage
  - `/login` → LoginPage
  - `/pending-approval` → Redirect to `/login`
  - `/account-rejected` → Redirect to `/login`
  - `*` → Redirect to `/`

### 3. Profile Setup Required
- **Condition**: `user && needsProfileSetup()`
- **Display**: ProfileSetupPage
- **Purpose**: New users must complete their profile information

### 4. Pending Approval
- **Condition**: `user && userProfile?.status !== 'approved'`
- **Display**: ProfileStatusDisplay
- **Possible Status Values**:
  - `incomplete` → User needs to complete profile
  - `pending` → Waiting for admin approval
  - `rejected` → Account was rejected

### 5. Approved Users
- **Condition**: `user && userProfile?.status === 'approved'`
- **Routing Logic**:

#### 5a. Admin Users
- **Condition**: `userProfile?.role === 'admin'`
- **Behavior**: 
  - Accessing `/` → Redirect to `/admin`
  - Can access all admin routes (`/admin`, `/admin/users`)
  - Can also access regular user routes

#### 5b. Regular Users
- **Condition**: `userProfile?.role === 'user'`
- **Available Routes**:
  - `/` → Dashboard
  - `/equipment` → Equipment List
  - `/my-requests` → My Requests
  - `/reservations` → Reservations
  - `/reports` → Reports

## Route Protection

### ProtectedRoute Component
- Ensures user is authenticated and approved
- `requireAdmin={true}` → Additional check for admin role

### Admin Routes
- `/admin` → Admin Dashboard (admin only)
- `/admin/users` → User Approval List (admin only)

### User Routes
- All other routes are accessible by both admin and regular users

## Key Functions

### needsProfileSetup()
Returns `true` if:
- No userProfile exists
- `userProfile.status === 'incomplete'`
- Missing required fields: firstName, lastName, phoneNumber, department, userType

### Role-based Access
- **Admin**: Can access everything
- **User**: Can access user routes only

## Error Handling

### Firebase Connection Issues
- Handled by FirebaseLoadingBoundary
- Shows retry option on connection failure

### Authentication Errors
- Handled by AuthContext with enhanced error handling
- Provides user-friendly error messages
- Includes retry mechanisms

## Security Considerations

1. **Email Domain Validation**: Only @gmail.com and @g.lpru.ac.th allowed
2. **Role-based Access Control**: Admin routes protected by ProtectedRoute
3. **Status Validation**: Only approved users can access main application
4. **Profile Completion**: Users must complete profile before approval

## Debug Tools

### Development Mode
- `window.authDebugger.runFullDiagnostic()` - Full auth diagnostic
- `window.authFixer.runAllFixes()` - Auto-fix common issues
- `window.authDebugger.getAuthLogs()` - View auth attempt logs

## Common Issues and Solutions

### Issue: Admin not redirecting to admin dashboard
- **Cause**: Role not set correctly in Firestore
- **Solution**: Ensure `role: 'admin'` in user document

### Issue: Stuck on loading screen
- **Cause**: Firebase connection issues
- **Solution**: Check network, clear cache, retry connection

### Issue: Profile setup loop
- **Cause**: Required fields not being saved
- **Solution**: Check form validation and Firestore write permissions

### Issue: Popup blocked during login
- **Cause**: Browser blocking authentication popup
- **Solution**: Allow popups for the domain, use AuthFixer

## Testing Scenarios

1. **New User Flow**:
   - Login → Profile Setup → Pending Approval → Approved → Dashboard

2. **Admin Flow**:
   - Login → (if approved) → Redirect to Admin Dashboard

3. **Rejected User Flow**:
   - Login → Account Rejected Message → Contact Admin

4. **Incomplete Profile Flow**:
   - Login → Profile Setup → Save → Pending Approval

## Configuration

### Firebase Rules
- Users can read/write their own profile
- Admins can read/write all profiles
- Authentication required for all operations

### Environment Variables
- Firebase configuration in `src/config/firebase.js`
- No sensitive data in client-side code