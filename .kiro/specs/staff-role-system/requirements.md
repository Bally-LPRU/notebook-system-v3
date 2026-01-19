# Requirements Document

## Introduction

ระบบเพิ่มบทบาทผู้ใช้งานใหม่ "เจ้าหน้าที่ให้บริการยืม-คืน" (Staff) ซึ่งเป็นบทบาทระดับกลางระหว่างผู้ใช้งานทั่วไป (User) และผู้ดูแลระบบ (Admin) โดยมีสิทธิ์เฉพาะในการอนุมัติและจัดการคำขอยืม-คืนอุปกรณ์ แต่ไม่สามารถเข้าถึงระบบจัดการอื่นๆ ได้

## Glossary

- **Staff**: เจ้าหน้าที่ให้บริการยืม-คืน - บทบาทผู้ใช้งานที่มีสิทธิ์จัดการคำขอยืม-คืนอุปกรณ์
- **Admin**: ผู้ดูแลระบบ - บทบาทที่มีสิทธิ์เต็มในการจัดการระบบทั้งหมด
- **User**: ผู้ใช้งานทั่วไป - บทบาทที่สามารถยืมอุปกรณ์และดูข้อมูลได้
- **Permission_Service**: บริการจัดการสิทธิ์การเข้าถึงระบบ
- **Loan_Request**: คำขอยืมอุปกรณ์
- **Loan_Return**: การคืนอุปกรณ์
- **Role_Hierarchy**: ลำดับชั้นของบทบาท (User < Staff < Admin)

## Requirements

### Requirement 1: การกำหนดบทบาท Staff ในระบบ

**User Story:** As a system administrator, I want to define a new Staff role in the permission system, so that I can assign limited administrative privileges to loan service officers.

#### Acceptance Criteria

1. THE Permission_Service SHALL define a new role "staff" in the ROLES enumeration
2. THE Permission_Service SHALL position the Staff role between User and Admin in the Role_Hierarchy
3. THE Permission_Service SHALL store the Staff role value as "staff" in the database
4. WHEN a user has the Staff role, THE System SHALL display "เจ้าหน้าที่ให้บริการ" as the role name in Thai

### Requirement 2: การกำหนดสิทธิ์สำหรับ Staff

**User Story:** As a system administrator, I want to define specific permissions for the Staff role, so that staff members can only access loan management features.

#### Acceptance Criteria

1. THE Permission_Service SHALL grant Staff the following permissions:
   - loan_request:view - ดูคำขอยืมทั้งหมด
   - loan_request:approve - อนุมัติคำขอยืม
   - loan_request:reject - ปฏิเสธคำขอยืม
   - loan_return:process - ดำเนินการรับคืนอุปกรณ์
   - loan_return:verify - ตรวจสอบสภาพอุปกรณ์ที่คืน
   - equipment:view - ดูข้อมูลอุปกรณ์
   - overdue:view - ดูรายการค้างคืน
   - overdue:notify - ส่งการแจ้งเตือนค้างคืน
2. THE Permission_Service SHALL NOT grant Staff the following permissions:
   - user:manage - จัดการผู้ใช้
   - equipment:create - สร้างอุปกรณ์
   - equipment:update - แก้ไขอุปกรณ์
   - equipment:delete - ลบอุปกรณ์
   - category:manage - จัดการหมวดหมู่
   - reservation:manage - จัดการการจอง
   - settings:manage - ตั้งค่าระบบ
   - intelligence:access - เข้าถึงระบบ Intelligence
3. WHEN checking Staff permissions, THE Permission_Service SHALL return false for any permission not explicitly granted

### Requirement 3: การเข้าถึงหน้าจัดการคำขอยืม

**User Story:** As a staff member, I want to access the loan request management page, so that I can approve or reject loan requests.

#### Acceptance Criteria

1. WHEN a Staff user logs in, THE System SHALL display a "จัดการคำขอยืม" menu item in the navigation
2. WHEN a Staff user accesses the loan request page, THE System SHALL display all pending loan requests
3. WHEN a Staff user views a loan request, THE System SHALL display borrower information, equipment details, and loan period
4. THE System SHALL allow Staff to filter loan requests by status (pending, approved, rejected, returned)
5. THE System SHALL allow Staff to search loan requests by borrower name or equipment name

### Requirement 4: การอนุมัติและปฏิเสธคำขอยืม

**User Story:** As a staff member, I want to approve or reject loan requests, so that I can manage equipment lending operations.

#### Acceptance Criteria

1. WHEN a Staff user clicks "อนุมัติ" on a pending loan request, THE System SHALL change the request status to "approved"
2. WHEN a Staff user clicks "ปฏิเสธ" on a pending loan request, THE System SHALL prompt for a rejection reason
3. WHEN a Staff user provides a rejection reason and confirms, THE System SHALL change the request status to "rejected" and store the reason
4. WHEN a loan request status changes, THE System SHALL send a notification to the borrower
5. WHEN a loan request is approved, THE System SHALL update the equipment availability status
6. IF a Staff user attempts to approve a request for unavailable equipment, THEN THE System SHALL display an error message and prevent the approval

### Requirement 5: การดำเนินการรับคืนอุปกรณ์

**User Story:** As a staff member, I want to process equipment returns, so that I can complete the lending cycle.

#### Acceptance Criteria

1. WHEN a Staff user accesses the return processing page, THE System SHALL display all active loans
2. WHEN a Staff user selects a loan to process return, THE System SHALL display a return form with condition assessment options
3. THE System SHALL allow Staff to record the equipment condition upon return (good, damaged, missing parts)
4. WHEN a Staff user confirms the return, THE System SHALL update the loan status to "returned"
5. WHEN a return is processed, THE System SHALL update the equipment availability status
6. IF equipment is returned damaged, THEN THE System SHALL create a damage report and notify the Admin

### Requirement 6: การจัดการรายการค้างคืน

**User Story:** As a staff member, I want to view and manage overdue loans, so that I can follow up with borrowers.

#### Acceptance Criteria

1. WHEN a Staff user accesses the overdue management page, THE System SHALL display all overdue loans
2. THE System SHALL display days overdue, borrower contact information, and equipment details for each overdue loan
3. WHEN a Staff user clicks "ส่งการแจ้งเตือน" on an overdue loan, THE System SHALL send a reminder notification to the borrower
4. THE System SHALL log all overdue notifications sent by Staff
5. THE System SHALL NOT allow Staff to modify overdue penalties or settings

### Requirement 7: การจำกัดการเข้าถึงระบบอื่น

**User Story:** As a system administrator, I want to restrict Staff access to administrative systems, so that sensitive operations remain protected.

#### Acceptance Criteria

1. WHEN a Staff user attempts to access the User Management page, THE System SHALL redirect to the dashboard with an "access denied" message
2. WHEN a Staff user attempts to access the Equipment Management page, THE System SHALL redirect to the dashboard with an "access denied" message
3. WHEN a Staff user attempts to access the Category Management page, THE System SHALL redirect to the dashboard with an "access denied" message
4. WHEN a Staff user attempts to access the Reservation Management page, THE System SHALL redirect to the dashboard with an "access denied" message
5. WHEN a Staff user attempts to access the System Settings page, THE System SHALL redirect to the dashboard with an "access denied" message
6. WHEN a Staff user attempts to access the Intelligence Dashboard, THE System SHALL redirect to the dashboard with an "access denied" message
7. THE System SHALL NOT display menu items for restricted pages to Staff users

### Requirement 8: การแต่งตั้ง Staff โดย Admin

**User Story:** As an administrator, I want to assign the Staff role to users, so that I can delegate loan management responsibilities.

#### Acceptance Criteria

1. WHEN an Admin accesses the User Management page, THE System SHALL display a role selection dropdown including "staff" option
2. WHEN an Admin changes a user's role to "staff", THE System SHALL update the user's permissions immediately
3. WHEN an Admin changes a user's role from "staff" to another role, THE System SHALL revoke Staff permissions immediately
4. THE System SHALL log all role changes in the audit log
5. THE System SHALL NOT allow Staff users to change other users' roles

### Requirement 9: Staff Dashboard

**User Story:** As a staff member, I want to see a dashboard with relevant statistics, so that I can monitor loan operations at a glance.

#### Acceptance Criteria

1. WHEN a Staff user logs in, THE System SHALL display a Staff-specific dashboard
2. THE Dashboard SHALL display the count of pending loan requests
3. THE Dashboard SHALL display the count of active loans
4. THE Dashboard SHALL display the count of overdue loans
5. THE Dashboard SHALL display recent loan activity (last 10 transactions)
6. THE Dashboard SHALL NOT display administrative statistics (user counts, equipment inventory, system health)

### Requirement 10: การบันทึก Audit Log สำหรับ Staff Actions

**User Story:** As a system administrator, I want to track all Staff actions, so that I can audit loan management activities.

#### Acceptance Criteria

1. WHEN a Staff user approves a loan request, THE System SHALL log the action with timestamp, staff ID, and request ID
2. WHEN a Staff user rejects a loan request, THE System SHALL log the action with timestamp, staff ID, request ID, and rejection reason
3. WHEN a Staff user processes a return, THE System SHALL log the action with timestamp, staff ID, loan ID, and condition assessment
4. WHEN a Staff user sends an overdue notification, THE System SHALL log the action with timestamp, staff ID, and loan ID
5. THE System SHALL allow Admin to view all Staff audit logs
6. THE System SHALL NOT allow Staff to view or modify audit logs

### Requirement 11: Admin สามารถทำงานแทน Staff ได้

**User Story:** As an administrator, I want to perform all Staff functions, so that I can manage loan operations when Staff is unavailable.

#### Acceptance Criteria

1. THE Permission_Service SHALL grant Admin all permissions that Staff has
2. WHEN no Staff is assigned in the system, THE Admin SHALL be able to perform all loan management operations
3. WHEN a Staff is unavailable, THE Admin SHALL be able to approve/reject loan requests
4. WHEN a Staff is unavailable, THE Admin SHALL be able to process equipment returns
5. WHEN a Staff is unavailable, THE Admin SHALL be able to send overdue notifications
6. THE System SHALL log Admin actions on loan management with the same detail level as Staff actions
7. THE Role_Hierarchy SHALL ensure Admin permissions always include Staff permissions (Admin > Staff > User)

### Requirement 12: การแจ้งเตือน Admin เมื่อ Staff ทำงาน

**User Story:** As an administrator, I want to be notified of all Staff actions in real-time, so that I can monitor loan operations and ensure quality service.

#### Acceptance Criteria

1. WHEN a Staff approves a loan request, THE System SHALL send a notification to all Admin users
2. WHEN a Staff rejects a loan request, THE System SHALL send a notification to all Admin users with the rejection reason
3. WHEN a Staff processes an equipment return, THE System SHALL send a notification to all Admin users with condition assessment
4. WHEN a Staff sends an overdue notification to a borrower, THE System SHALL send a notification to all Admin users
5. THE Admin notification SHALL include: Staff name, action type, timestamp, and relevant details (borrower, equipment, etc.)
6. THE System SHALL provide Admin with a "Staff Activity" section in the Admin Dashboard showing recent Staff actions
7. THE System SHALL allow Admin to filter Staff activity by date range, Staff member, and action type
8. WHEN equipment is returned with damage, THE System SHALL send a priority notification to Admin
9. THE System SHALL aggregate Staff activity into daily summary reports for Admin review

### Requirement 13: การแสดงผลเมนูตามบทบาท

**User Story:** As a system user, I want to see only the menu items relevant to my role, so that I can navigate the system efficiently.

#### Acceptance Criteria

1. WHEN a User logs in, THE System SHALL display only user-level menu items (ยืมอุปกรณ์, คำขอของฉัน, ประวัติการยืม)
2. WHEN a Staff logs in, THE System SHALL display Staff menu items (จัดการคำขอยืม, รับคืนอุปกรณ์, รายการค้างคืน) plus user-level items
3. WHEN an Admin logs in, THE System SHALL display all menu items including Staff functions and administrative functions
4. THE System SHALL visually distinguish Staff menu section from User menu section
5. THE System SHALL NOT display administrative menu items (จัดการผู้ใช้, จัดการอุปกรณ์, ตั้งค่าระบบ) to Staff users
