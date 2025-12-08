# Requirements Document

## Introduction

ระบบปรับปรุงสถานะผู้ใช้ (User Status System Improvement) เป็นการพัฒนาปรับปรุงระบบจัดการสถานะผู้ใช้ทั้งหมดให้สอดคล้องกับระบบ Admin Settings System ที่มีอยู่ โดยมุ่งเน้นการบูรณาการ User Type Limits ที่กำหนดใน Admin Settings เข้ากับหน้าต่างๆ ที่ผู้ใช้เข้าถึง

### หน้าที่เกี่ยวข้องกับสถานะ User (จากการวิเคราะห์ระบบ)

**หน้าสำหรับผู้ใช้ทั่วไป (User Routes):**
1. `/dashboard` - Dashboard หลัก แสดงสถานะบัญชี, บทบาท, และข้อมูลผู้ใช้
2. `/equipment` - หน้าดูอุปกรณ์และส่งคำขอยืม
3. `/my-requests` - หน้าติดตามคำขอยืมของตัวเอง
4. `/reservations` - หน้าจองอุปกรณ์ล่วงหน้า
5. `/profile` - หน้าโปรไฟล์ แสดงข้อมูลส่วนตัว, สถานะ, และบทบาท
6. `/notifications` - หน้าการแจ้งเตือน
7. `/loan-history` - หน้าประวัติการยืม-คืนอุปกรณ์ (ใหม่)
8. `/notification-history` - หน้าประวัติการแจ้งเตือน (ใหม่)

**หน้าแสดงสถานะ (Status Pages):**
- `ProfileStatusDisplay` - แสดงเมื่อผู้ใช้ยังไม่ได้รับการอนุมัติ (pending/rejected/incomplete)
- `ProfileSetupPage` - แสดงเมื่อผู้ใช้ต้องกรอกข้อมูลโปรไฟล์

**การตั้งค่าที่เกี่ยวข้องจาก Admin Settings:**
- `userTypeLimitsEnabled` - เปิด/ปิดการจำกัดตามประเภทผู้ใช้
- `userTypeLimits` - กำหนด maxItems, maxDays, maxAdvanceBookingDays ตาม userType (teacher/staff/student)
- `closedDates` - วันปิดทำการที่ไม่สามารถยืม/คืนได้
- `categoryLimits` - จำกัดจำนวนอุปกรณ์ตามหมวดหมู่

## Glossary

- **User Status System**: ระบบจัดการสถานะผู้ใช้ในระบบยืม-คืนอุปกรณ์
- **User Status**: สถานะของผู้ใช้ ได้แก่ incomplete, pending, approved, rejected, suspended, deleted
- **User Type**: ประเภทผู้ใช้ ได้แก่ teacher (อาจารย์), staff (เจ้าหน้าที่), student (นักศึกษา)
- **User Role**: บทบาทของผู้ใช้ ได้แก่ admin (ผู้ดูแลระบบ), user (ผู้ใช้ทั่วไป)
- **User Type Limits**: การจำกัดสิทธิ์การยืมตามประเภทผู้ใช้ (จำนวนอุปกรณ์, จำนวนวัน, วันจองล่วงหน้า)
- **Settings Collection**: คอลเลกชันใน Firestore ที่เก็บการตั้งค่าระบบ
- **Admin Settings System**: ระบบการตั้งค่าแบบรวมศูนย์สำหรับผู้ดูแลระบบ
- **Status Transition**: การเปลี่ยนแปลงสถานะผู้ใช้ตามกฎที่กำหนด

## Requirements

### Requirement 1

**User Story:** ในฐานะผู้ใช้ ฉันต้องการเห็นสิทธิ์การยืมและกฎระเบียบการยืม-คืนในหน้า Dashboard เพื่อทราบข้อกำหนดและข้อจำกัดในการใช้งานระบบ

#### Acceptance Criteria

1. WHEN a user views the dashboard page THEN the System SHALL display their user type (teacher/staff/student) and applicable borrowing limits
2. WHEN user type limits are enabled in settings THEN the System SHALL show max items, max loan duration, and max advance booking days for the user's type
3. WHEN user type limits are disabled in settings THEN the System SHALL show the default system-wide limits
4. WHEN displaying borrowing limits THEN the System SHALL show the current borrowed count and remaining quota
5. WHEN a user's borrowing limits change THEN the System SHALL reflect the updated limits immediately on the dashboard
6. WHEN displaying the dashboard THEN the System SHALL show a "กฎระเบียบการยืม-คืน" section with rules from admin settings
7. WHEN displaying loan rules THEN the System SHALL show loan return time restrictions (loanReturnStartTime, loanReturnEndTime) if configured
8. WHEN displaying loan rules THEN the System SHALL show upcoming closed dates from admin settings
9. WHEN displaying reservation rules THEN the System SHALL show the maximum advance booking period allowed
10. WHEN admin updates the rules in settings THEN the System SHALL reflect the changes immediately on user dashboards

### Requirement 2

**User Story:** ในฐานะผู้ใช้ ฉันต้องการให้ระบบบังคับใช้สิทธิ์การยืมตามประเภทผู้ใช้ของฉัน เพื่อให้การยืมอุปกรณ์เป็นไปตามกฎที่กำหนด

#### Acceptance Criteria

1. WHEN a user creates a loan request THEN the System SHALL check the user's type and enforce the corresponding limits from settings
2. WHEN a user exceeds their max items limit THEN the System SHALL prevent the loan request and display a message showing current count and limit
3. WHEN a user selects a return date beyond their max days limit THEN the System SHALL prevent the selection and display the maximum allowed duration
4. WHEN a user attempts to book beyond their max advance booking days THEN the System SHALL prevent the selection and display the maximum allowed date
5. WHEN user type limits are disabled in settings THEN the System SHALL apply the default system-wide limits to all users

### Requirement 3

**User Story:** ในฐานะผู้ใช้ ฉันต้องการเห็นสิทธิ์การยืมในหน้าโปรไฟล์ เพื่อทราบข้อจำกัดการยืมของตัวเอง

#### Acceptance Criteria

1. WHEN a user views their profile page THEN the System SHALL display their user type with Thai label (อาจารย์/เจ้าหน้าที่/นักศึกษา)
2. WHEN user type limits are enabled THEN the System SHALL display a section showing borrowing limits for the user's type
3. WHEN displaying borrowing limits THEN the System SHALL show max items, max loan duration, and max advance booking days
4. WHEN a user's type is not set THEN the System SHALL display a message prompting them to update their profile
5. WHEN the user type is changed THEN the System SHALL immediately reflect the new limits on the profile page

### Requirement 4

**User Story:** ในฐานะผู้ใช้ ฉันต้องการให้ฟอร์มยืมอุปกรณ์แสดงข้อจำกัดการยืมตามประเภทผู้ใช้ของฉัน เพื่อให้ฉันทราบก่อนส่งคำขอ

#### Acceptance Criteria

1. WHEN a user opens the loan request form THEN the System SHALL display their borrowing limits based on user type
2. WHEN selecting a return date THEN the System SHALL limit the date picker to the maximum loan duration for the user's type
3. WHEN the user has reached their max items limit THEN the System SHALL display a warning and disable the submit button
4. WHEN displaying limits in the form THEN the System SHALL show remaining quota (e.g., "คุณยืมได้อีก 2 ชิ้น จากทั้งหมด 5 ชิ้น")
5. WHEN user type limits are disabled THEN the System SHALL use the default system-wide limits in the form

### Requirement 5

**User Story:** ในฐานะผู้ใช้ ฉันต้องการให้หน้าจองอุปกรณ์ล่วงหน้าบังคับใช้ข้อจำกัดตามประเภทผู้ใช้ เพื่อให้การจองเป็นไปตามกฎที่กำหนด

#### Acceptance Criteria

1. WHEN a user opens the reservation page THEN the System SHALL check their user type and apply the corresponding advance booking limit
2. WHEN selecting a reservation date THEN the System SHALL limit the date picker to the maximum advance booking days for the user's type
3. WHEN a user attempts to reserve beyond their limit THEN the System SHALL display a message showing the maximum allowed date
4. WHEN displaying the reservation form THEN the System SHALL show the user's advance booking limit
5. WHEN user type limits are disabled THEN the System SHALL use the default maxAdvanceBookingDays from system settings

### Requirement 6

**User Story:** ในฐานะผู้ใช้ ฉันต้องการเห็นสถานะคำขอยืมของฉันพร้อมข้อมูลที่เกี่ยวข้องกับสิทธิ์การยืม เพื่อติดตามการใช้งานของตัวเอง

#### Acceptance Criteria

1. WHEN a user views the my-requests page THEN the System SHALL display a summary of their current borrowing status
2. WHEN displaying borrowing summary THEN the System SHALL show current borrowed count, pending requests count, and remaining quota
3. WHEN the user has active loans THEN the System SHALL display the total count against their max items limit
4. WHEN the user has pending requests THEN the System SHALL include them in the quota calculation
5. WHEN displaying the summary THEN the System SHALL use the user's type-specific limits if enabled, otherwise use default limits

### Requirement 7

**User Story:** ในฐานะระบบ ฉันต้องการสร้าง hook สำหรับดึงข้อมูล user type limits เพื่อให้ components ต่างๆ สามารถใช้งานได้ง่าย

#### Acceptance Criteria

1. WHEN a component needs user type limits THEN the System SHALL provide a useUserTypeLimits hook that returns the limits for the current user
2. WHEN the hook is called THEN the System SHALL check if userTypeLimitsEnabled is true in settings
3. WHEN user type limits are enabled THEN the System SHALL return the limits for the user's type from settings
4. WHEN user type limits are disabled THEN the System SHALL return the default system-wide limits
5. WHEN the user's type is not set THEN the System SHALL return the default limits with a warning flag

### Requirement 8

**User Story:** ในฐานะผู้ดูแลระบบ ฉันต้องการเห็นข้อมูล user type และ limits ในหน้าจัดการผู้ใช้ เพื่อให้การจัดการผู้ใช้มีประสิทธิภาพ

#### Acceptance Criteria

1. WHEN an administrator views the user management table THEN the System SHALL display the user type column with Thai labels
2. WHEN an administrator views user details THEN the System SHALL show the applicable borrowing limits for that user's type
3. WHEN an administrator edits a user THEN the System SHALL allow changing the user type with a dropdown selector
4. WHEN the user type is changed THEN the System SHALL display the new limits that will apply to the user
5. WHEN user type limits are disabled in settings THEN the System SHALL indicate that default limits apply to all users


### Requirement 9

**User Story:** ในฐานะผู้ใช้ ฉันต้องการดูประวัติการยืม-คืนอุปกรณ์ของตัวเอง เพื่อติดตามและตรวจสอบการใช้งานที่ผ่านมา

#### Acceptance Criteria

1. WHEN a user accesses the loan history page THEN the System SHALL display all completed loan transactions in reverse chronological order
2. WHEN displaying loan history THEN the System SHALL show equipment name, borrow date, return date, loan duration, and status for each transaction
3. WHEN a user filters loan history THEN the System SHALL support filtering by date range, equipment category, and loan status
4. WHEN displaying loan history THEN the System SHALL show statistics summary including total loans, average loan duration, and on-time return rate
5. WHEN a user searches loan history THEN the System SHALL allow searching by equipment name or serial number

### Requirement 10

**User Story:** ในฐานะผู้ใช้ ฉันต้องการดูประวัติการแจ้งเตือนของตัวเอง เพื่อตรวจสอบการแจ้งเตือนที่ได้รับในอดีต

#### Acceptance Criteria

1. WHEN a user accesses the notification history page THEN the System SHALL display all notifications in reverse chronological order
2. WHEN displaying notification history THEN the System SHALL show notification title, content, type, timestamp, and read status
3. WHEN a user filters notification history THEN the System SHALL support filtering by notification type (system, loan, approval, reminder)
4. WHEN displaying notification history THEN the System SHALL group notifications by date for easier navigation
5. WHEN a user marks notifications as read THEN the System SHALL update the read status and reflect the change in the notification count
