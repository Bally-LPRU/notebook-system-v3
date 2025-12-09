# Design Document: Unified Admin Notification System

## Overview

ระบบ Unified Admin Notification System รวมการแจ้งเตือนทั้งหมดสำหรับ Admin ไว้ที่เดียว โดยใช้ React hooks และ Firestore real-time listeners เพื่อรวมข้อมูลจากหลายแหล่ง แสดงผลใน UI ที่ใช้งานง่าย พร้อม Tab-based navigation และ Quick Actions

### Key Design Decisions

1. **Single Hook Architecture** - ใช้ `useAdminUnifiedNotifications` hook เดียวเป็น single source of truth
2. **Read State Separation** - เก็บ read state แยกใน `adminNotificationState` collection เพื่อไม่แก้ไข source documents
3. **Tab-based UI** - แบ่ง UI เป็น 3 tabs ชัดเจน
4. **Optimistic Updates** - อัพเดท UI ก่อน แล้วค่อย sync กับ server

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Components                          │
├─────────────────────────────────────────────────────────────────┤
│  NotificationBell (Enhanced)  │  UnifiedNotificationCenter      │
│  - Combined count badge       │  - Tabbed interface             │
│  - Mixed dropdown items       │  - Action Items tab             │
│  - Quick preview              │  - Personal Notifications tab   │
│                               │  - History tab                  │
│                               │  - Summary cards                │
│                               │  - Quick actions                │
└───────────────┬───────────────┴───────────────┬─────────────────┘
                │                               │
                ▼                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                 useAdminUnifiedNotifications Hook                │
├─────────────────────────────────────────────────────────────────┤
│  - Combines data from multiple sources                          │
│  - Manages read states                                          │
│  - Provides filtering and sorting                               │
│  - Handles real-time updates                                    │
└───────────────┬───────────────────────────────┬─────────────────┘
                │                               │
                ▼                               ▼
┌───────────────────────────────┐ ┌───────────────────────────────┐
│   adminNotificationService    │ │   Existing Services           │
├───────────────────────────────┤ ├───────────────────────────────┤
│  - markAsRead()               │ │  - userService                │
│  - markAllAsRead()            │ │  - loanRequestService         │
│  - getReadStates()            │ │  - reservationService         │
│  - executeQuickAction()       │ │  - notificationService        │
└───────────────┬───────────────┘ └───────────────┬───────────────┘
                │                               │
                ▼                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Firestore                                │
├─────────────────────────────────────────────────────────────────┤
│  users (pending)          │  adminNotificationState (NEW)       │
│  loanRequests (pending)   │  - adminId                          │
│  loanRequests (overdue)   │  - notificationId                   │
│  reservations (pending)   │  - sourceType                       │
│  notifications (admin)    │  - isRead                           │
│                           │  - readAt                           │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. useAdminUnifiedNotifications Hook

```typescript
interface UnifiedNotification {
  id: string;
  sourceType: 'user_registration' | 'loan_request' | 'overdue_loan' | 'reservation_request' | 'personal';
  category: 'users' | 'loans' | 'reservations' | 'system';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  detail?: string;
  link: string;
  icon: string;
  iconBg: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  sourceData: any; // Original document data
  quickActions?: QuickAction[];
}

interface QuickAction {
  label: string;
  action: 'approve' | 'reject' | 'view';
  variant: 'primary' | 'danger' | 'secondary';
}

interface UseAdminUnifiedNotificationsReturn {
  // Data
  allNotifications: UnifiedNotification[];
  actionItems: UnifiedNotification[];
  personalNotifications: UnifiedNotification[];
  historyItems: UnifiedNotification[];
  
  // Counts
  counts: {
    total: number;
    unread: number;
    actionItems: number;
    personal: number;
    users: number;
    loans: number;
    overdue: number;
    reservations: number;
  };
  
  // Actions
  markAsRead: (notificationId: string, sourceType: string) => Promise<void>;
  markAllAsRead: (tab: 'action' | 'personal' | 'all') => Promise<void>;
  executeQuickAction: (notification: UnifiedNotification, action: string) => Promise<void>;
  
  // Filtering
  setFilter: (filter: NotificationFilter) => void;
  setSearchTerm: (term: string) => void;
  
  // State
  loading: boolean;
  error: string | null;
  
  // Pagination
  loadMore: () => void;
  hasMore: boolean;
}
```

### 2. AdminNotificationService

```typescript
interface AdminNotificationService {
  // Read state management
  markAsRead(adminId: string, notificationId: string, sourceType: string): Promise<void>;
  markAllAsRead(adminId: string, sourceType?: string): Promise<void>;
  getReadStates(adminId: string): Promise<Map<string, ReadState>>;
  
  // Quick actions
  approveUser(userId: string): Promise<void>;
  rejectUser(userId: string, reason?: string): Promise<void>;
  approveLoan(loanId: string): Promise<void>;
  rejectLoan(loanId: string, reason?: string): Promise<void>;
  approveReservation(reservationId: string): Promise<void>;
  rejectReservation(reservationId: string, reason?: string): Promise<void>;
  
  // History
  getHistory(adminId: string, limit: number): Promise<HistoryItem[]>;
  addToHistory(adminId: string, item: HistoryItem): Promise<void>;
}
```

### 3. Enhanced NotificationBell Component

```typescript
interface EnhancedNotificationBellProps {
  // No props needed - uses context/hooks internally
}

// Features:
// - Shows combined count (action items + personal unread)
// - Dropdown shows mixed items sorted by priority/date
// - Visual indicators for item type
// - "ดูทั้งหมด" link to /admin/notifications
```

### 4. UnifiedNotificationCenter Component

```typescript
interface UnifiedNotificationCenterProps {
  defaultTab?: 'action' | 'personal' | 'history';
}

// Features:
// - Three tabs with counts
// - Summary cards at top
// - Filter bar (category, priority, date range)
// - Search box
// - Notification list with quick actions
// - Pagination/infinite scroll
```

## Data Models

### adminNotificationState Collection (NEW)

```typescript
interface AdminNotificationState {
  id: string; // Auto-generated
  adminId: string; // Admin user ID
  notificationId: string; // Source document ID
  sourceType: 'user_registration' | 'loan_request' | 'overdue_loan' | 'reservation_request' | 'personal';
  sourceCollection: string; // 'users' | 'loanRequests' | 'reservations' | 'notifications'
  isRead: boolean;
  readAt: Timestamp | null;
  createdAt: Timestamp;
}

// Firestore indexes needed:
// - adminId + sourceType + isRead
// - adminId + createdAt (desc)
```

### adminNotificationHistory Collection (NEW)

```typescript
interface AdminNotificationHistory {
  id: string;
  adminId: string;
  action: 'approved' | 'rejected' | 'viewed' | 'dismissed';
  sourceType: string;
  sourceId: string;
  sourceData: any; // Snapshot of original data
  actionAt: Timestamp;
  note?: string;
}

// Firestore indexes needed:
// - adminId + actionAt (desc)
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Priority Assignment Correctness
*For any* notification from a source collection, the system SHALL assign the correct priority: urgent for overdue_loan, high for loan_request, medium for user_registration and reservation_request, and the original priority for personal notifications
**Validates: Requirements 1.3**

### Property 2: Priority Sorting Correctness
*For any* list of notifications, items with higher priority (urgent > high > medium > low) SHALL appear before items with lower priority, and within the same priority level, newer items (by createdAt) SHALL appear first
**Validates: Requirements 1.4**

### Property 3: Notification Count Consistency
*For any* admin user, the total unread count displayed in the Notification_Bell SHALL equal the sum of unread action items plus unread personal notifications, and this count SHALL decrease by exactly 1 when a single notification is marked as read
**Validates: Requirements 2.1, 4.3**

### Property 4: Tab Filtering Correctness
*For any* notification displayed in the "งานรอดำเนินการ" tab, its sourceType SHALL be one of: user_registration, loan_request, overdue_loan, or reservation_request. *For any* notification displayed in the "แจ้งเตือนส่วนตัว" tab, its sourceType SHALL be "personal"
**Validates: Requirements 3.2, 3.3**

### Property 5: Mark as Read State Persistence
*For any* notification that is marked as read and persisted to Firestore, when the read states are restored, that notification SHALL be marked as read with the same readAt timestamp
**Validates: Requirements 9.1, 9.2**

### Property 6: Quick Action State Transition
*For any* action item that receives a successful quick action (approve/reject), the item SHALL be removed from the action items list and a corresponding history entry SHALL be created
**Validates: Requirements 5.3**

### Property 7: Filter Correctness
*For any* applied filter (search term, category, priority, or date range), all displayed notifications SHALL match the filter criteria. Specifically:
- Search: notification title, description, userName, or equipmentName contains the search term
- Category: notification category equals the selected category
- Priority: notification priority equals the selected priority
- Date range: notification createdAt falls within the selected range
**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

### Property 8: Filter Count Consistency
*For any* set of applied filters, the displayed notification count SHALL equal the length of the filtered notification list
**Validates: Requirements 6.5**

### Property 9: Pagination Data Integrity
*For any* paginated list, loading more items SHALL not introduce duplicate notification IDs and SHALL maintain the correct priority-then-date sort order across all loaded pages
**Validates: Requirements 10.3**

### Property 10: History Date Range Correctness
*For any* notification displayed in the "ประวัติ" tab, its actionAt or readAt timestamp SHALL be within the past 30 days from the current date
**Validates: Requirements 3.4**

## Error Handling

### Network Errors
- Display toast notification with retry option
- Cache last known state locally
- Show stale data indicator when offline

### Permission Errors
- Redirect to login if session expired
- Show permission denied message for non-admin users

### Quick Action Failures
- Show error toast with specific message
- Keep item in current state
- Log error for debugging

### Data Inconsistency
- If source document deleted, remove from notification list
- If read state orphaned, clean up on next load

## Testing Strategy

### Unit Tests
- Test notification sorting logic
- Test filter functions
- Test count calculations
- Test data transformation functions

### Property-Based Tests
Using fast-check library:

1. **Priority Sorting Property Test**
   - Generate random notifications with various priorities
   - Verify sorted output maintains priority order

2. **Count Consistency Property Test**
   - Generate random read/unread states
   - Verify counts match actual data

3. **Filter Correctness Property Test**
   - Generate random notifications and filter criteria
   - Verify filtered results match criteria

4. **Tab Separation Property Test**
   - Generate mixed notifications
   - Verify each tab contains only appropriate types

### Integration Tests
- Test real-time updates with Firestore emulator
- Test quick actions end-to-end
- Test mark as read persistence

### E2E Tests
- Test complete user flow: view notifications → quick action → verify history
- Test mobile responsive behavior
- Test tab switching and filter persistence
