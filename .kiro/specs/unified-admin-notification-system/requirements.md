# Requirements Document

## Introduction

ระบบ Unified Admin Notification System เป็นการรวมระบบแจ้งเตือนทั้งหมดสำหรับ Admin ไว้ที่เดียว โดยรวม:
1. **Action Items** - งานที่ต้องดำเนินการ (คำขอรออนุมัติ, เกินกำหนด)
2. **Personal Notifications** - แจ้งเตือนส่วนตัว (ผลการดำเนินการ, ข้อความจากระบบ)
3. **History** - ประวัติการแจ้งเตือนและการดำเนินการ

ระบบนี้จะช่วยให้ Admin ไม่พลาดการแจ้งเตือนสำคัญ และจัดการงานได้อย่างมีประสิทธิภาพจากที่เดียว

## Glossary

- **Unified_Notification_System**: ระบบแจ้งเตือนรวมที่รวบรวมข้อมูลจากหลายแหล่งสำหรับ Admin
- **Action_Item**: รายการที่ต้องดำเนินการ เช่น คำขอยืมรออนุมัติ, ผู้ใช้รออนุมัติ
- **Personal_Notification**: การแจ้งเตือนส่วนตัวที่ส่งถึง Admin โดยตรง
- **Notification_Bell**: ไอคอนระฆังที่แสดงจำนวนการแจ้งเตือนที่ยังไม่ได้อ่าน
- **Notification_Center**: หน้าศูนย์รวมการแจ้งเตือนที่ `/admin/notifications`
- **Priority**: ระดับความสำคัญของการแจ้งเตือน (urgent, high, medium, low)
- **Category**: หมวดหมู่ของการแจ้งเตือน (users, loans, reservations, system)

## Requirements

### Requirement 1: Unified Data Source

**User Story:** As an admin, I want all notifications from different sources to be combined into a single data source, so that I can view everything in one place without switching between different screens.

#### Acceptance Criteria

1. WHEN the Unified_Notification_System initializes THEN the system SHALL fetch data from users collection (pending status), loanRequests collection (pending and overdue), reservations collection (pending), and notifications collection (admin's personal notifications)
2. WHEN data from any source updates THEN the Unified_Notification_System SHALL reflect the changes in real-time within 2 seconds
3. WHEN combining notifications from multiple sources THEN the system SHALL assign appropriate priority levels (urgent for overdue, high for pending loans, medium for pending users and reservations)
4. WHEN sorting combined notifications THEN the system SHALL order by priority first (urgent > high > medium > low), then by creation date (newest first)

### Requirement 2: Enhanced Notification Bell for Admin

**User Story:** As an admin, I want the notification bell to show combined count from both action items and personal notifications, so that I can quickly see if there are items requiring my attention.

#### Acceptance Criteria

1. WHEN an admin views the Notification_Bell THEN the system SHALL display the total count of unread action items plus unread personal notifications
2. WHEN the admin clicks the Notification_Bell THEN the system SHALL display a dropdown showing the 5 most recent items from combined sources
3. WHEN displaying items in the dropdown THEN the system SHALL show visual indicators for item type (action item vs personal notification) and priority level
4. WHEN the admin clicks "ดูทั้งหมด" in the dropdown THEN the system SHALL navigate to the Notification_Center page

### Requirement 3: Tabbed Notification Center

**User Story:** As an admin, I want the notification center to have separate tabs for action items, personal notifications, and history, so that I can focus on specific types of notifications when needed.

#### Acceptance Criteria

1. WHEN an admin visits the Notification_Center THEN the system SHALL display three tabs: "งานรอดำเนินการ", "แจ้งเตือนส่วนตัว", and "ประวัติ"
2. WHEN the admin selects the "งานรอดำเนินการ" tab THEN the system SHALL display only action items (pending users, pending loans, overdue loans, pending reservations)
3. WHEN the admin selects the "แจ้งเตือนส่วนตัว" tab THEN the system SHALL display only personal notifications from the notifications collection
4. WHEN the admin selects the "ประวัติ" tab THEN the system SHALL display completed action items and read notifications from the past 30 days
5. WHEN switching between tabs THEN the system SHALL preserve filter and search state within each tab

### Requirement 4: Mark as Read Functionality

**User Story:** As an admin, I want to mark notifications as read, so that I can track which items I have already reviewed.

#### Acceptance Criteria

1. WHEN an admin clicks on a notification item THEN the system SHALL mark that item as read and update the visual state
2. WHEN an admin clicks "อ่านทั้งหมด" button THEN the system SHALL mark all visible notifications as read
3. WHEN a notification is marked as read THEN the Notification_Bell count SHALL decrease accordingly
4. WHEN marking action items as read THEN the system SHALL store the read state in a separate collection (adminNotificationState) to avoid modifying source documents

### Requirement 5: Quick Actions from Notifications

**User Story:** As an admin, I want to perform quick actions directly from notifications, so that I can handle items efficiently without navigating to separate pages.

#### Acceptance Criteria

1. WHEN viewing a pending user notification THEN the system SHALL display "อนุมัติ" and "ปฏิเสธ" quick action buttons
2. WHEN viewing a pending loan request notification THEN the system SHALL display "อนุมัติ" and "ปฏิเสธ" quick action buttons
3. WHEN the admin clicks a quick action button THEN the system SHALL execute the action and move the item to history
4. IF a quick action fails THEN the system SHALL display an error message and keep the item in the current state

### Requirement 6: Notification Filtering and Search

**User Story:** As an admin, I want to filter and search notifications, so that I can quickly find specific items.

#### Acceptance Criteria

1. WHEN the admin enters text in the search box THEN the system SHALL filter notifications by title, description, user name, or equipment name
2. WHEN the admin selects a category filter THEN the system SHALL display only notifications of that category
3. WHEN the admin selects a priority filter THEN the system SHALL display only notifications of that priority level
4. WHEN the admin selects a date range filter THEN the system SHALL display only notifications within that date range
5. WHEN filters are applied THEN the system SHALL update the notification count to reflect filtered results

### Requirement 7: Summary Dashboard

**User Story:** As an admin, I want to see a summary of notification counts by category, so that I can quickly understand the current workload.

#### Acceptance Criteria

1. WHEN the admin views the Notification_Center THEN the system SHALL display summary cards showing counts for each category (pending users, pending loans, overdue, pending reservations, personal notifications)
2. WHEN the admin clicks a summary card THEN the system SHALL filter the notification list to show only that category
3. WHEN counts change THEN the summary cards SHALL update in real-time

### Requirement 8: Mobile Responsive Design

**User Story:** As an admin using a mobile device, I want the notification system to work well on small screens, so that I can manage notifications on the go.

#### Acceptance Criteria

1. WHEN viewing on a mobile device THEN the Notification_Bell dropdown SHALL be full-width and scrollable
2. WHEN viewing the Notification_Center on mobile THEN the tabs SHALL be horizontally scrollable
3. WHEN viewing notification items on mobile THEN the quick action buttons SHALL be accessible via swipe or tap menu
4. WHEN the screen width is less than 640px THEN the summary cards SHALL stack vertically

### Requirement 9: Notification State Persistence

**User Story:** As an admin, I want my notification read states to persist across sessions, so that I do not lose track of what I have already reviewed.

#### Acceptance Criteria

1. WHEN an admin marks a notification as read THEN the system SHALL persist the read state to Firestore
2. WHEN an admin logs in THEN the system SHALL restore the read states from Firestore
3. WHEN the same notification is viewed on different devices THEN the read state SHALL be synchronized

### Requirement 10: Performance Optimization

**User Story:** As an admin, I want the notification system to load quickly, so that I can access important information without delay.

#### Acceptance Criteria

1. WHEN the Notification_Center loads THEN the initial data SHALL be displayed within 1 second
2. WHEN fetching notifications THEN the system SHALL limit queries to 50 items per category to prevent performance issues
3. WHEN the admin scrolls to the bottom of the list THEN the system SHALL load more items using pagination
4. WHEN real-time listeners are active THEN the system SHALL use efficient query patterns to minimize Firestore reads
