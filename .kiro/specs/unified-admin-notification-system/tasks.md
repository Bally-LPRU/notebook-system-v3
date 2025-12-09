# Implementation Plan

## 1. Setup Data Models and Firestore Collections

- [x] 1.1 Create TypeScript interfaces for unified notification types
  - Define `UnifiedNotification`, `QuickAction`, `ReadState`, `HistoryItem` interfaces
  - Create type guards for source type validation
  - _Requirements: 1.1, 1.3_

- [x] 1.2 Write property test for priority assignment
  - **Property 1: Priority Assignment Correctness**
  - **Validates: Requirements 1.3**

- [x] 1.3 Create Firestore security rules for new collections
  - Add rules for `adminNotificationState` collection (admin read/write only)
  - Add rules for `adminNotificationHistory` collection (admin read/write only)
  - _Requirements: 4.4, 9.1_

- [x] 1.4 Create Firestore indexes for new collections
  - Index: `adminNotificationState` - adminId + sourceType + isRead
  - Index: `adminNotificationState` - adminId + createdAt (desc)
  - Index: `adminNotificationHistory` - adminId + actionAt (desc)
  - _Requirements: 10.2, 10.4_

## 2. Implement Admin Notification Service

- [x] 2.1 Create `adminNotificationService.js` with read state management
  - Implement `markAsRead(adminId, notificationId, sourceType)`
  - Implement `markAllAsRead(adminId, sourceType?)`
  - Implement `getReadStates(adminId)`
  - _Requirements: 4.1, 4.2, 9.1_

- [x] 2.2 Write property test for mark as read persistence
  - **Property 5: Mark as Read State Persistence**
  - **Validates: Requirements 9.1, 9.2**

- [x] 2.3 Implement quick action methods in service
  - Implement `approveUser(userId)` - calls existing userService
  - Implement `rejectUser(userId, reason?)`
  - Implement `approveLoan(loanId)` - calls existing loanRequestService
  - Implement `rejectLoan(loanId, reason?)`
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 2.4 Implement history management in service
  - Implement `addToHistory(adminId, item)`
  - Implement `getHistory(adminId, limit, startAfter?)`
  - _Requirements: 3.4, 5.3_

- [x] 2.5 Write property test for quick action state transition
  - **Property 6: Quick Action State Transition**
  - **Validates: Requirements 5.3**

## 3. Checkpoint - Ensure service layer tests pass

- [x] 3. Ensure all tests pass, ask the user if questions arise.

## 4. Implement useAdminUnifiedNotifications Hook

- [x] 4.1 Create base hook structure with Firestore listeners
  - Set up listeners for users (pending), loanRequests (pending/approved), reservations (pending)
  - Set up listener for notifications collection (admin's personal)
  - Set up listener for adminNotificationState (read states)
  - _Requirements: 1.1, 1.2_

- [x] 4.2 Implement notification transformation and combination logic
  - Transform source documents to UnifiedNotification format
  - Assign priorities based on source type
  - Combine all sources into single array
  - _Requirements: 1.1, 1.3_

- [x] 4.3 Write property test for priority sorting
  - **Property 2: Priority Sorting Correctness**
  - **Validates: Requirements 1.4**

- [x] 4.4 Implement sorting logic
  - Sort by priority (urgent > high > medium > low)
  - Within same priority, sort by createdAt (newest first)
  - _Requirements: 1.4_

- [x] 4.5 Implement filtering logic
  - Filter by tab (action items vs personal vs history)
  - Filter by category, priority, date range
  - Filter by search term
  - _Requirements: 3.2, 3.3, 6.1, 6.2, 6.3, 6.4_

- [x] 4.6 Write property test for tab filtering
  - **Property 4: Tab Filtering Correctness**
  - **Validates: Requirements 3.2, 3.3**

- [x] 4.7 Write property test for filter correctness
  - **Property 7: Filter Correctness**
  - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

- [x] 4.8 Implement count calculations
  - Calculate total, unread, actionItems, personal counts
  - Calculate category-specific counts (users, loans, overdue, reservations)
  - _Requirements: 2.1, 7.1_

- [x] 4.9 Write property test for count consistency
  - **Property 3: Notification Count Consistency**
  - **Validates: Requirements 2.1, 4.3**

- [x] 4.10 Write property test for filter count consistency
  - **Property 8: Filter Count Consistency**
  - **Validates: Requirements 6.5**

- [x] 4.11 Implement pagination support
  - Add loadMore function
  - Track hasMore state
  - Maintain sort order across pages
  - _Requirements: 10.2, 10.3_

- [x] 4.12 Write property test for pagination data integrity
  - **Property 9: Pagination Data Integrity**
  - **Validates: Requirements 10.3**

## 5. Checkpoint - Ensure hook tests pass

- [x] 5. Ensure all tests pass, ask the user if questions arise.

## 6. Implement Enhanced NotificationBell Component

- [x] 6.1 Update NotificationBell to use unified hook for admin users
  - Detect if user is admin
  - Use useAdminUnifiedNotifications for admin, existing hook for regular users
  - Display combined unread count
  - _Requirements: 2.1_

- [x] 6.2 Update dropdown to show mixed notification items
  - Show top 5 items from combined sources
  - Add visual indicators for item type (action vs personal)
  - Add priority indicators
  - _Requirements: 2.2, 2.3_

- [x] 6.3 Add "ดูทั้งหมด" link to notification center
  - Navigate to /admin/notifications
  - _Requirements: 2.4_

- [x] 6.4 Write unit tests for NotificationBell admin mode
  - Test combined count display
  - Test dropdown item rendering
  - _Requirements: 2.1, 2.2_

## 7. Implement UnifiedNotificationCenter Component

- [x] 7.1 Create base component structure with tabs
  - Create tab navigation (งานรอดำเนินการ, แจ้งเตือนส่วนตัว, ประวัติ)
  - Add tab counts
  - Handle tab switching
  - _Requirements: 3.1, 3.5_

- [x] 7.2 Implement summary cards section
  - Display counts for each category
  - Make cards clickable to filter
  - _Requirements: 7.1, 7.2_

- [x] 7.3 Implement filter bar
  - Add search input
  - Add category filter dropdown
  - Add priority filter buttons
  - Add date range picker
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 7.4 Implement notification list with quick actions
  - Display notification items
  - Add quick action buttons (อนุมัติ/ปฏิเสธ) for action items
  - Handle quick action execution
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 7.5 Implement mark as read functionality
  - Mark as read on click
  - Add "อ่านทั้งหมด" button
  - Update visual state
  - _Requirements: 4.1, 4.2_

- [x] 7.6 Implement history tab
  - Display completed actions and read notifications
  - Filter to past 30 days
  - _Requirements: 3.4_

- [x] 7.7 Write property test for history date range
  - **Property 10: History Date Range Correctness**
  - **Validates: Requirements 3.4**

- [x] 7.8 Implement pagination/infinite scroll
  - Add load more trigger
  - Display loading state
  - _Requirements: 10.3_

- [x] 7.9 Write unit tests for UnifiedNotificationCenter
  - Test tab switching
  - Test filter application
  - Test quick action execution
  - _Requirements: 3.1, 6.1, 5.3_

## 8. Implement Mobile Responsive Design

- [x] 8.1 Make NotificationBell dropdown responsive
  - Full-width on mobile
  - Scrollable content
  - _Requirements: 8.1_

- [x] 8.2 Make tabs horizontally scrollable on mobile
  - Add horizontal scroll for tabs
  - _Requirements: 8.2_

- [x] 8.3 Make summary cards stack on mobile
  - Stack vertically when width < 640px
  - _Requirements: 8.4_

- [x] 8.4 Add mobile-friendly quick actions
  - Swipe or tap menu for actions
  - _Requirements: 8.3_

## 9. Update Routing and Navigation

- [x] 9.1 Update App.js routes
  - Ensure /admin/notifications uses new UnifiedNotificationCenter
  - _Requirements: 2.4_

- [x] 9.2 Update Sidebar navigation
  - Update notification center link
  - _Requirements: 2.4_

## 10. Final Checkpoint - Ensure all tests pass

- [x] 10. Ensure all tests pass, ask the user if questions arise.

## 11. Cleanup and Documentation

- [x] 11.1 Remove deprecated notification components/hooks if any
  - Review and remove unused code
  - Update imports

- [x] 11.2 Update documentation
  - Add JSDoc comments to new components and hooks
  - Update README if needed
