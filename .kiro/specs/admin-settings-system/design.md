# Design Document

## Overview

ระบบการตั้งค่าแบบรวมศูนย์ (Admin Settings System) เป็นโซลูชันที่ออกแบบมาเพื่อให้ผู้ดูแลระบบสามารถจัดการการตั้งค่าต่างๆ ของระบบยืม-คืนอุปกรณ์ได้อย่างมีประสิทธิภาพ ระบบนี้จะใช้ Firestore เป็นที่เก็บข้อมูล React สำหรับ UI และ Context API สำหรับการจัดการ state

ระบบจะแบ่งการตั้งค่าออกเป็นหมวดหมู่ต่างๆ เพื่อความง่ายในการจัดการ และจะมีระบบ caching เพื่อเพิ่มประสิทธิภาพ การเปลี่ยนแปลงการตั้งค่าจะถูกบันทึกใน audit log และสามารถ export/import ได้

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin Settings UI                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ General      │ │ Loan Rules   │ │ Notifications│        │
│  │ Settings     │ │ Settings     │ │ Settings     │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Settings Context                           │
│  - State Management                                          │
│  - Cache Management                                          │
│  - Real-time Updates                                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Settings Service                           │
│  - CRUD Operations                                           │
│  - Validation                                                │
│  - Audit Logging                                             │
│  - Import/Export                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Firestore Database                         │
│  - settings (collection)                                     │
│  - settingsAuditLog (collection)                            │
└─────────────────────────────────────────────────────────────┘
```

### Integration Points

1. **Loan Request System**: ตรวจสอบ loan duration และ category limits
2. **Reservation System**: ตรวจสอบ advance booking period และ closed dates
3. **Date Picker Components**: ใช้ closed dates เพื่อ disable วันที่
4. **Notification System**: ส่งการแจ้งเตือนผ่าน Discord webhook
5. **User Interface**: แสดงข้อความแจ้งเตือนระบบ

## Components and Interfaces

### 1. Settings Service (`settingsService.js`)

```javascript
class SettingsService {
  // Core CRUD operations
  async getSettings()
  async updateSetting(key, value)
  async updateMultipleSettings(settings)
  
  // Closed dates management
  async addClosedDate(date, reason)
  async removeClosedDate(dateId)
  async getClosedDates()
  async isDateClosed(date)
  
  // Category limits
  async setCategoryLimit(categoryId, limit)
  async getCategoryLimit(categoryId)
  async getAllCategoryLimits()
  
  // Discord webhook
  async setDiscordWebhook(url)
  async testDiscordWebhook()
  async sendDiscordNotification(message)
  
  // System notifications
  async createSystemNotification(notification)
  async getSystemNotifications(filters)
  
  // Audit log
  async logSettingChange(change)
  async getAuditLog(filters)
  
  // Import/Export
  async exportSettings(includeSensitive)
  async importSettings(settingsData)
  async createBackup()
}
```

### 2. Settings Context (`SettingsContext.js`)

```javascript
const SettingsContext = {
  // State
  settings: {
    maxLoanDuration: number,
    maxAdvanceBookingDays: number,
    defaultCategoryLimit: number,
    discordWebhookUrl: string,
    closedDates: Array<ClosedDate>,
    categoryLimits: Map<string, number>
  },
  
  // Loading states
  loading: boolean,
  error: Error | null,
  
  // Actions
  updateSetting: (key, value) => Promise<void>,
  addClosedDate: (date, reason) => Promise<void>,
  removeClosedDate: (dateId) => Promise<void>,
  setCategoryLimit: (categoryId, limit) => Promise<void>,
  sendSystemNotification: (notification) => Promise<void>,
  
  // Utilities
  isDateClosed: (date) => boolean,
  getCategoryLimit: (categoryId) => number,
  refreshSettings: () => Promise<void>
}
```

### 3. Admin Settings Page Component

```javascript
// Main settings page with tabs
<AdminSettingsPage>
  <SettingsTabs>
    <GeneralSettingsTab />
    <LoanRulesTab />
    <ClosedDatesTab />
    <CategoryLimitsTab />
    <NotificationsTab />
    <AuditLogTab />
    <ImportExportTab />
  </SettingsTabs>
</AdminSettingsPage>
```

### 4. Settings Components

- `GeneralSettingsTab`: แสดงการตั้งค่าทั่วไป
- `LoanRulesTab`: จัดการ loan duration และ advance booking
- `ClosedDatesTab`: จัดการวันปิดทำการ
- `CategoryLimitsTab`: จัดการจำนวนการยืมตามประเภท
- `NotificationsTab`: จัดการ Discord webhook และข้อความแจ้งเตือน
- `AuditLogTab`: แสดงประวัติการเปลี่ยนแปลง
- `ImportExportTab`: นำเข้า/ส่งออกการตั้งค่า

## Data Models

### Settings Document Structure

```javascript
{
  // Document ID: 'systemSettings'
  maxLoanDuration: 14, // days
  maxAdvanceBookingDays: 30, // days
  defaultCategoryLimit: 3, // items per category
  discordWebhookUrl: 'https://discord.com/api/webhooks/...',
  discordEnabled: true,
  
  // Metadata
  lastUpdated: Timestamp,
  lastUpdatedBy: 'adminUserId',
  version: 1
}
```

### Closed Date Document

```javascript
{
  // Document ID: auto-generated
  date: Timestamp, // The closed date
  reason: 'วันหยุดราชการ',
  createdAt: Timestamp,
  createdBy: 'adminUserId',
  isRecurring: false, // For annual holidays
  recurringPattern: null // e.g., 'yearly'
}
```

### Category Limit Document

```javascript
{
  // Document ID: categoryId
  categoryId: 'category123',
  categoryName: 'กล้อง',
  limit: 2,
  updatedAt: Timestamp,
  updatedBy: 'adminUserId'
}
```

### System Notification Document

```javascript
{
  // Document ID: auto-generated
  title: 'ประกาศ: ปิดระบบชั่วคราว',
  content: 'ระบบจะปิดปรับปรุงในวันที่...',
  type: 'announcement', // 'announcement', 'feedback_request', 'alert'
  priority: 'high', // 'low', 'medium', 'high'
  createdAt: Timestamp,
  createdBy: 'adminUserId',
  expiresAt: Timestamp | null,
  
  // Feedback request specific
  feedbackEnabled: true,
  feedbackQuestion: 'คุณพอใจกับระบบหรือไม่?',
  
  // Delivery tracking
  sentTo: ['userId1', 'userId2'],
  readBy: ['userId1'],
  responses: [
    {
      userId: 'userId1',
      response: 'พอใจมาก',
      timestamp: Timestamp
    }
  ]
}
```

### Audit Log Document

```javascript
{
  // Document ID: auto-generated
  timestamp: Timestamp,
  adminId: 'adminUserId',
  adminName: 'Admin Name',
  action: 'update', // 'create', 'update', 'delete'
  settingType: 'maxLoanDuration',
  settingPath: 'systemSettings.maxLoanDuration',
  oldValue: 7,
  newValue: 14,
  reason: 'เพิ่มระยะเวลาตามคำขอของผู้ใช้',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...'
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified several areas where properties can be consolidated:

**Consolidation Opportunities:**
1. Properties 2.2, 2.3, 2.4 (closed date prevention for borrow/return/reserve) can be combined into one comprehensive property about closed date enforcement
2. Properties 3.1 and 4.1 (storing settings) follow the same pattern and can be validated by a general settings persistence property
3. Properties 3.3 and 4.3 (immediate application of changes) follow the same pattern
4. Properties 3.4 and 4.4 (validation of invalid inputs) can be combined into a general validation property
5. Properties 6.2 and 6.3 (checking and enforcing category limits) are closely related and can be combined

**Unique Properties Retained:**
- Each property that provides unique validation value has been kept separate
- Properties related to different functional areas (Discord, notifications, audit log) remain distinct
- Round-trip properties for import/export are essential for data integrity

### Core Properties

Property 1: Settings persistence
*For any* valid setting key-value pair, when an administrator saves the setting, the system should store it in the Settings Collection and retrieve the same value when queried
**Validates: Requirements 3.1, 4.1, 5.2, 6.1**

Property 2: Access control enforcement
*For any* user without administrator role, attempting to access the settings page should result in access denial and redirection
**Validates: Requirements 1.3**

Property 3: Settings validation
*For any* invalid setting value (negative numbers, malformed URLs, out-of-range values), the system should reject the input and display a validation error
**Validates: Requirements 3.4, 4.4, 5.1**

Property 4: Closed date enforcement
*For any* date marked as closed, the system should prevent its selection for borrowing, returning, or reserving equipment across all date selection interfaces
**Validates: Requirements 2.2, 2.3, 2.4**

Property 5: Closed date persistence and retrieval
*For any* valid date with reason, when an administrator adds it as a closed date, the system should store it with metadata and display it in chronological order when queried
**Validates: Requirements 2.1, 2.5**

Property 6: Closed date removal
*For any* existing closed date, when an administrator removes it, the date should no longer appear in the closed dates list and should become selectable in date pickers
**Validates: Requirements 2.6, 2.7**

Property 7: Loan duration enforcement
*For any* loan request, the system should limit the return date selection such that the loan duration does not exceed the configured maximum loan duration
**Validates: Requirements 3.2**

Property 8: Immediate settings application
*For any* setting update (loan duration, advance booking period, category limit), the system should immediately apply the new value to all subsequent operations without requiring restart
**Validates: Requirements 3.3, 4.3, 6.4**

Property 9: Advance booking period enforcement
*For any* reservation request, the system should limit the reservation start date such that it falls within the configured advance booking period from the current date
**Validates: Requirements 4.2, 4.5**

Property 10: Discord webhook notification delivery
*For any* significant system event, when a Discord webhook URL is configured, the system should send a properly formatted notification message to that webhook
**Validates: Requirements 5.3**

Property 11: Discord webhook error handling
*For any* failed Discord webhook call (invalid URL, unreachable endpoint), the system should log the error and notify administrators without disrupting normal system operation
**Validates: Requirements 5.5**

Property 12: Category limit enforcement
*For any* user attempting to borrow equipment, when the user's current borrowed count in that category equals or exceeds the category limit, the system should prevent the loan request and display the limit information
**Validates: Requirements 6.2, 6.3**

Property 13: Default category limit application
*For any* equipment category without a specific limit configured, the system should apply the default system-wide limit when checking borrow eligibility
**Validates: Requirements 6.6**

Property 14: System notification persistence and delivery
*For any* system notification created by an administrator, the system should store it with timestamp and author information, and deliver it to all active users through the notification system
**Validates: Requirements 7.2, 7.3**

Property 15: Unread notification display
*For any* user login event, the system should display all system notifications that the user has not yet read
**Validates: Requirements 7.4**

Property 16: Audit log creation
*For any* setting modification, the system should create an audit log entry containing administrator ID, timestamp, setting name, old value, and new value
**Validates: Requirements 8.1, 8.2**

Property 17: Audit log ordering
*For any* audit log query, the system should return entries in reverse chronological order (newest first)
**Validates: Requirements 8.3**

Property 18: Critical setting notifications
*For any* critical setting change (loan duration, category limits, closed dates), the system should send notifications to all system administrators
**Validates: Requirements 8.5**

Property 19: Settings export completeness
*For any* settings export operation, the system should generate a JSON file containing all current settings, excluding sensitive information unless explicitly requested
**Validates: Requirements 9.1, 9.5**

Property 20: Settings import validation and backup
*For any* settings import operation, the system should validate the JSON format, create a backup of current settings before applying changes, and preserve current settings if validation fails
**Validates: Requirements 9.2, 9.3, 9.4**

Property 21: Cache invalidation on update
*For any* setting update, the system should immediately invalidate the relevant cache entries to ensure subsequent reads return the updated value
**Validates: Requirements 10.2**

Property 22: Cache-first retrieval
*For any* setting request, when a valid cached value exists, the system should return the cached value without querying the database
**Validates: Requirements 10.3**

Property 23: Cache refresh on expiration
*For any* expired cache entry, when requested, the system should refresh the value from the Settings Collection before returning it
**Validates: Requirements 10.4**



## Error Handling

### Validation Errors

1. **Invalid Input Values**
   - Negative or zero values for durations and limits
   - Malformed URLs for Discord webhooks
   - Invalid date formats
   - Out-of-range values
   - Response: Display user-friendly error messages with specific guidance

2. **Permission Errors**
   - Non-admin users attempting to access settings
   - Response: Redirect to appropriate page with access denied message

3. **Data Integrity Errors**
   - Conflicting settings values
   - Missing required fields
   - Response: Prevent save and display validation errors

### Network and Database Errors

1. **Firestore Connection Errors**
   - Network timeout
   - Database unavailable
   - Response: Display error message, retry with exponential backoff, use cached values if available

2. **Discord Webhook Errors**
   - Invalid webhook URL
   - Webhook endpoint unreachable
   - Rate limiting
   - Response: Log error, notify admin, continue normal operation

3. **Concurrent Modification**
   - Multiple admins editing same setting
   - Response: Use Firestore transactions, show conflict resolution UI

### Import/Export Errors

1. **Invalid Import File**
   - Malformed JSON
   - Missing required fields
   - Invalid data types
   - Response: Display specific validation errors, preserve current settings

2. **Export Failures**
   - Insufficient permissions
   - Storage quota exceeded
   - Response: Display error message, suggest alternatives

### Recovery Strategies

1. **Automatic Backup**: Create backup before any bulk operation
2. **Rollback Capability**: Allow reverting to previous settings version
3. **Graceful Degradation**: Use default values if settings cannot be loaded
4. **Error Logging**: Log all errors to audit log for troubleshooting

## Testing Strategy

### Unit Testing

Unit tests will verify individual components and functions:

1. **Settings Service Tests**
   - CRUD operations for each setting type
   - Validation logic for different input types
   - Error handling for network failures
   - Cache management functions

2. **Component Tests**
   - Settings form validation
   - Date picker with closed dates
   - Category limit selector
   - Notification composer

3. **Utility Function Tests**
   - Date validation and formatting
   - URL validation
   - JSON import/export parsing

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using **fast-check** library (JavaScript/React). Each test will run a minimum of 100 iterations.

**Test Configuration:**
```javascript
import fc from 'fast-check';

// Configure to run 100+ iterations
fc.assert(
  fc.property(/* generators */, /* test function */),
  { numRuns: 100 }
);
```

**Property Test Requirements:**
- Each property-based test MUST be tagged with a comment referencing the design document property
- Tag format: `// Feature: admin-settings-system, Property {number}: {property_text}`
- Each correctness property MUST be implemented by a SINGLE property-based test

**Property Tests to Implement:**

1. **Settings Persistence Property** (Property 1)
   - Generate random valid settings
   - Save and retrieve
   - Verify values match

2. **Access Control Property** (Property 2)
   - Generate users with different roles
   - Attempt access
   - Verify only admins succeed

3. **Validation Property** (Property 3)
   - Generate invalid inputs (negative, malformed, out-of-range)
   - Attempt to save
   - Verify all are rejected

4. **Closed Date Enforcement Property** (Property 4)
   - Generate random closed dates
   - Attempt to select for borrow/return/reserve
   - Verify all are prevented

5. **Loan Duration Enforcement Property** (Property 7)
   - Generate random loan requests with various durations
   - Verify return date never exceeds max duration

6. **Advance Booking Enforcement Property** (Property 9)
   - Generate random reservation dates
   - Verify start date within booking period

7. **Category Limit Enforcement Property** (Property 12)
   - Generate random borrow attempts with various current counts
   - Verify requests blocked when limit reached

8. **Audit Log Creation Property** (Property 16)
   - Generate random setting changes
   - Verify audit entry created with all required fields

9. **Import/Export Round Trip Property** (Property 19, 20)
   - Generate random settings
   - Export then import
   - Verify settings unchanged

10. **Cache Invalidation Property** (Property 21)
    - Generate random setting updates
    - Verify cache invalidated and fresh value returned

### Integration Testing

Integration tests will verify interactions between components:

1. **Settings Context Integration**
   - Test context provider with multiple consumers
   - Verify state updates propagate correctly
   - Test real-time synchronization

2. **Firestore Integration**
   - Test actual database operations
   - Verify transactions work correctly
   - Test concurrent modifications

3. **Discord Webhook Integration**
   - Test actual webhook calls (with test endpoint)
   - Verify message formatting
   - Test error handling

4. **Date Picker Integration**
   - Test closed dates disable correct dates
   - Test loan duration limits date selection
   - Test advance booking limits

### End-to-End Testing

E2E tests will verify complete user workflows:

1. **Admin Settings Workflow**
   - Login as admin
   - Navigate to settings
   - Modify various settings
   - Verify changes applied

2. **Closed Date Workflow**
   - Add closed dates
   - Attempt to create loan on closed date
   - Verify prevention

3. **Category Limit Workflow**
   - Set category limit
   - Borrow equipment up to limit
   - Attempt to exceed limit
   - Verify prevention

4. **Import/Export Workflow**
   - Export settings
   - Modify settings
   - Import previous settings
   - Verify restoration

## Performance Considerations

### Caching Strategy

1. **In-Memory Cache**
   - Cache frequently accessed settings (loan duration, category limits)
   - TTL: 5 minutes for most settings
   - Invalidate on update

2. **React Query / SWR**
   - Use for component-level caching
   - Automatic background refresh
   - Optimistic updates

3. **Firestore Caching**
   - Enable offline persistence
   - Use cached data when offline

### Optimization Techniques

1. **Lazy Loading**
   - Load audit log on demand
   - Paginate notification history

2. **Debouncing**
   - Debounce search and filter inputs
   - Debounce auto-save operations

3. **Batch Operations**
   - Batch multiple setting updates
   - Batch audit log writes

4. **Index Optimization**
   - Create Firestore indexes for common queries
   - Index audit log by timestamp and admin ID

### Scalability

1. **Horizontal Scaling**
   - Settings service is stateless
   - Can run multiple instances
   - Use Firestore for synchronization

2. **Rate Limiting**
   - Limit Discord webhook calls
   - Throttle audit log queries

3. **Data Archiving**
   - Archive old audit logs
   - Keep recent 6 months in active collection

## Security Considerations

### Authentication and Authorization

1. **Admin-Only Access**
   - Verify admin role on every settings operation
   - Use Firestore security rules to enforce

2. **Audit Trail**
   - Log all setting changes with admin identity
   - Include IP address and user agent

3. **Sensitive Data Protection**
   - Encrypt Discord webhook URLs at rest
   - Exclude from exports by default
   - Mask in UI (show only last 4 characters)

### Input Validation

1. **Server-Side Validation**
   - Validate all inputs on backend
   - Never trust client-side validation alone

2. **SQL Injection Prevention**
   - Use Firestore parameterized queries
   - Sanitize all user inputs

3. **XSS Prevention**
   - Sanitize notification content
   - Escape HTML in user-generated content

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Settings collection - admin only
    match /settings/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Closed dates - admin write, all read
    match /closedDates/{dateId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Category limits - admin write, all read
    match /categoryLimits/{categoryId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Audit log - admin only
    match /settingsAuditLog/{logId} {
      allow read: if request.auth != null && 
                    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow write: if false; // Only server can write
    }
    
    // System notifications - admin write, all read
    match /systemNotifications/{notificationId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      // Allow users to update their read status
      allow update: if request.auth != null && 
                      request.resource.data.diff(resource.data).affectedKeys().hasOnly(['readBy', 'responses']);
    }
  }
}
```

## Implementation Notes

### Technology Stack

- **Frontend**: React with Hooks and Context API
- **State Management**: React Context + custom hooks
- **Database**: Firebase Firestore
- **Caching**: React Query or SWR
- **Validation**: Yup or Zod
- **Date Handling**: date-fns
- **Testing**: Jest, React Testing Library, fast-check
- **UI Components**: Existing component library (Tailwind CSS)

### Dependencies

```json
{
  "dependencies": {
    "date-fns": "^2.30.0",
    "yup": "^1.3.0",
    "react-query": "^3.39.0"
  },
  "devDependencies": {
    "fast-check": "^3.15.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0"
  }
}
```

### File Structure

```
src/
├── components/
│   └── admin/
│       └── settings/
│           ├── AdminSettingsPage.js
│           ├── GeneralSettingsTab.js
│           ├── LoanRulesTab.js
│           ├── ClosedDatesTab.js
│           ├── ClosedDatePicker.js
│           ├── CategoryLimitsTab.js
│           ├── CategoryLimitEditor.js
│           ├── NotificationsTab.js
│           ├── DiscordWebhookConfig.js
│           ├── SystemNotificationComposer.js
│           ├── AuditLogTab.js
│           ├── AuditLogViewer.js
│           ├── ImportExportTab.js
│           └── __tests__/
│               ├── AdminSettingsPage.test.js
│               ├── ClosedDatesTab.property.test.js
│               ├── CategoryLimitsTab.property.test.js
│               └── ImportExport.property.test.js
├── contexts/
│   ├── SettingsContext.js
│   └── __tests__/
│       └── SettingsContext.property.test.js
├── services/
│   ├── settingsService.js
│   ├── discordWebhookService.js
│   └── __tests__/
│       ├── settingsService.test.js
│       ├── settingsService.property.test.js
│       └── discordWebhookService.test.js
├── hooks/
│   ├── useSettings.js
│   ├── useClosedDates.js
│   ├── useCategoryLimits.js
│   └── __tests__/
│       ├── useSettings.property.test.js
│       └── useClosedDates.property.test.js
└── utils/
    ├── settingsValidation.js
    ├── settingsCache.js
    └── __tests__/
        └── settingsValidation.property.test.js
```

### Migration Strategy

1. **Phase 1**: Create settings infrastructure
   - Settings service and context
   - Basic CRUD operations
   - Admin settings page shell

2. **Phase 2**: Implement core features
   - Closed dates management
   - Loan duration settings
   - Advance booking settings

3. **Phase 3**: Add advanced features
   - Category limits
   - Discord webhook integration
   - System notifications

4. **Phase 4**: Add monitoring and maintenance
   - Audit log
   - Import/export
   - Cache optimization

5. **Phase 5**: Integration with existing features
   - Update loan request form
   - Update reservation form
   - Update date pickers

### Backward Compatibility

- Provide default values for all new settings
- Existing functionality continues to work without settings configured
- Gradual migration of hardcoded values to settings
