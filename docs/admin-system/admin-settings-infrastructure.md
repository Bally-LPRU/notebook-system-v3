# Admin Settings System Infrastructure

## Overview

This document describes the infrastructure setup for the Admin Settings System, including Firestore collections, data models, security rules, and indexes.

## Firestore Collections

### 1. `settings` Collection

Stores system-wide settings in a single document.

**Document ID:** `systemSettings`

**Structure:**
```javascript
{
  maxLoanDuration: 14,              // days
  maxAdvanceBookingDays: 30,        // days
  defaultCategoryLimit: 3,          // items per category
  discordWebhookUrl: "https://...", // or null
  discordEnabled: true,
  lastUpdated: Timestamp,
  lastUpdatedBy: "adminUserId",
  version: 1
}
```

**Access:**
- Read: All authenticated users
- Write: Admins only

### 2. `closedDates` Collection

Stores dates when the system is closed for borrowing/returning/reservations.

**Document ID:** Auto-generated

**Structure:**
```javascript
{
  date: Timestamp,
  reason: "วันหยุดราชการ",
  createdAt: Timestamp,
  createdBy: "adminUserId",
  isRecurring: false,
  recurringPattern: null  // e.g., "yearly"
}
```

**Access:**
- Read: All authenticated users
- Write: Admins only

**Indexes:**
- `date` (ascending) - for chronological queries

### 3. `categoryLimits` Collection

Stores borrowing limits for each equipment category.

**Document ID:** Category ID

**Structure:**
```javascript
{
  categoryId: "category123",
  categoryName: "กล้อง",
  limit: 2,
  updatedAt: Timestamp,
  updatedBy: "adminUserId"
}
```

**Access:**
- Read: All authenticated users
- Write: Admins only

### 4. `settingsAuditLog` Collection

Stores audit trail of all settings changes.

**Document ID:** Auto-generated

**Structure:**
```javascript
{
  timestamp: Timestamp,
  adminId: "adminUserId",
  adminName: "Admin Name",
  action: "update",  // create, update, delete
  settingType: "maxLoanDuration",
  settingPath: "systemSettings.maxLoanDuration",
  oldValue: 7,
  newValue: 14,
  reason: "เพิ่มระยะเวลาตามคำขอของผู้ใช้",
  ipAddress: "192.168.1.1",
  userAgent: "Mozilla/5.0..."
}
```

**Access:**
- Read: Admins only
- Write: Server/Admin service only (security rules prevent direct writes)

**Indexes:**
- `timestamp` (descending) - for recent changes
- `adminId` + `timestamp` (descending) - for admin-specific queries
- `settingType` + `timestamp` (descending) - for setting-specific queries
- `adminId` + `settingType` + `timestamp` (descending) - for combined filters

### 5. `systemNotifications` Collection

Stores system-wide notifications sent to all users.

**Document ID:** Auto-generated

**Structure:**
```javascript
{
  title: "ประกาศ: ปิดระบบชั่วคราว",
  content: "ระบบจะปิดปรับปรุงในวันที่...",
  type: "announcement",  // announcement, feedback_request, alert
  priority: "high",      // low, medium, high
  createdAt: Timestamp,
  createdBy: "adminUserId",
  expiresAt: Timestamp,  // or null
  feedbackEnabled: true,
  feedbackQuestion: "คุณพอใจกับระบบหรือไม่?",
  sentTo: ["userId1", "userId2"],
  readBy: ["userId1"],
  responses: [
    {
      userId: "userId1",
      response: "พอใจมาก",
      timestamp: Timestamp
    }
  ]
}
```

**Access:**
- Read: All authenticated users
- Write: Admins only
- Update (limited): Users can update `readBy` and `responses` arrays

**Indexes:**
- `createdAt` (descending) - for recent notifications
- `type` + `createdAt` (descending) - for filtering by type
- `priority` + `createdAt` (descending) - for filtering by priority

## Security Rules

All settings collections follow these security patterns:

1. **Authentication Required:** All operations require authentication
2. **Admin-Only Writes:** Only users with `role: 'admin'` can write
3. **Public Read (Authenticated):** All authenticated users can read settings
4. **Audit Log Protection:** Audit log is read-only for admins, write-protected from direct access
5. **Limited User Updates:** Users can update their own read status and responses in notifications

## Data Models

All data models are defined in `src/types/settings.js`:

- `SystemSettings` - Main settings document structure
- `ClosedDate` - Closed date document structure
- `CategoryLimit` - Category limit document structure
- `SystemNotification` - System notification document structure
- `SettingsAuditLog` - Audit log entry structure

## Services

### `settingsService.js`

Main service for all settings operations:

- CRUD operations for settings
- Closed dates management
- Category limits management
- System notifications
- Audit logging
- Import/export functionality

### `settingsCache.js`

In-memory caching utility:

- TTL-based caching (5 minutes default)
- Cache invalidation on updates
- Subscription support for real-time updates
- Cache statistics and cleanup

### `settingsValidation.js`

Validation utilities:

- Loan duration validation (1-365 days)
- Advance booking validation (1-365 days)
- Category limit validation (1-100 items)
- Discord webhook URL validation
- Date and reason validation
- Notification content validation

## Constants

Defined in `src/types/settings.js`:

- `SETTINGS_VALIDATION` - Validation rules and ranges
- `NOTIFICATION_TYPES` - Notification type constants
- `NOTIFICATION_PRIORITIES` - Priority level constants
- `AUDIT_ACTIONS` - Audit action type constants
- `CRITICAL_SETTINGS` - Settings that trigger admin notifications
- `SETTINGS_CACHE_CONFIG` - Cache TTL and refresh intervals
- `DEFAULT_SETTINGS` - Default values for all settings

## Deployment

### Firestore Rules

Deploy security rules:
```bash
firebase deploy --only firestore:rules
```

### Firestore Indexes

Deploy indexes:
```bash
firebase deploy --only firestore:indexes
```

## Testing

Settings infrastructure includes:

1. **Unit Tests** - For validation functions and cache operations
2. **Property-Based Tests** - For settings persistence and validation
3. **Integration Tests** - For Firestore operations

## Next Steps

After infrastructure setup, the following tasks will implement:

1. Core settings service operations (Task 2)
2. Settings context and caching (Task 3)
3. Admin settings UI components (Task 4)
4. Feature-specific implementations (Tasks 5-12)

## References

- Design Document: `.kiro/specs/admin-settings-system/design.md`
- Requirements Document: `.kiro/specs/admin-settings-system/requirements.md`
- Tasks Document: `.kiro/specs/admin-settings-system/tasks.md`
