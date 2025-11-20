# Requirements Document

## Introduction

ระบบการตั้งค่าแบบรวมศูนย์ (Admin Settings System) เป็นฟีเจอร์ที่ให้ผู้ดูแลระบบสามารถจัดการการตั้งค่าต่างๆ ของระบบยืม-คืนอุปกรณ์ได้จากที่เดียว รวมถึงการกำหนดวันปิดทำการ, จำนวนวันที่สามารถยืมได้, การจองล่วงหน้า, การแจ้งเตือนผ่าน Discord Webhook, และการจำกัดจำนวนอุปกรณ์ที่ยืมได้

## Glossary

- **Admin Settings System**: ระบบการตั้งค่าแบบรวมศูนย์สำหรับผู้ดูแลระบบ
- **System Administrator**: ผู้ดูแลระบบที่มีสิทธิ์ในการเข้าถึงและแก้ไขการตั้งค่าระบบ
- **Closed Date**: วันที่ปิดทำการซึ่งไม่สามารถยืม-คืนหรือจองอุปกรณ์ได้
- **Loan Duration**: จำนวนวันที่สามารถยืมอุปกรณ์ได้
- **Advance Booking Period**: จำนวนวันล่วงหน้าที่สามารถจองอุปกรณ์ได้
- **Discord Webhook**: URL สำหรับส่งข้อความแจ้งเตือนไปยัง Discord
- **Equipment Category Limit**: จำนวนอุปกรณ์สูงสุดที่ผู้ใช้สามารถยืมได้ในแต่ละประเภท
- **System Notification**: ข้อความแจ้งเตือนที่ส่งให้ผู้ใช้ทั้งหมด
- **Settings Collection**: คอลเลกชันใน Firestore ที่เก็บการตั้งค่าระบบ

## Requirements

### Requirement 1

**User Story:** ในฐานะผู้ดูแลระบบ ฉันต้องการเข้าถึงหน้าการตั้งค่าแบบรวมศูนย์ เพื่อที่ฉันจะได้จัดการการตั้งค่าทั้งหมดของระบบได้จากที่เดียว

#### Acceptance Criteria

1. WHEN a system administrator navigates to the admin settings page THEN the System SHALL display a centralized settings interface with organized sections
2. WHEN the settings page loads THEN the System SHALL retrieve and display all current system settings from the Settings Collection
3. WHEN a non-administrator user attempts to access the settings page THEN the System SHALL deny access and redirect to an appropriate page
4. WHEN the settings interface is displayed THEN the System SHALL organize settings into logical categories for easy navigation
5. WHEN settings are modified THEN the System SHALL validate changes before allowing submission

### Requirement 2

**User Story:** ในฐานะผู้ดูแลระบบ ฉันต้องการกำหนดวันปิดทำการ เพื่อป้องกันผู้ใช้ยืม-คืนหรือจองอุปกรณ์ในวันที่เจ้าหน้าที่ไม่มาทำงาน

#### Acceptance Criteria

1. WHEN a system administrator adds a closed date THEN the System SHALL store the date in the Settings Collection with appropriate metadata
2. WHEN a user attempts to select a closed date for borrowing THEN the System SHALL prevent the selection and display an informative message
3. WHEN a user attempts to select a closed date for returning equipment THEN the System SHALL prevent the selection and display an informative message
4. WHEN a user attempts to select a closed date for reservation THEN the System SHALL prevent the selection and display an informative message
5. WHEN a system administrator views closed dates THEN the System SHALL display all configured closed dates in chronological order
6. WHEN a system administrator removes a closed date THEN the System SHALL delete the date from the Settings Collection and update the interface
7. WHEN a closed date is added or removed THEN the System SHALL immediately apply the changes to all date selection interfaces

### Requirement 3

**User Story:** ในฐานะผู้ดูแลระบบ ฉันต้องการกำหนดจำนวนวันที่สามารถยืมอุปกรณ์ได้ เพื่อควบคุมระยะเวลาการยืมให้เหมาะสม

#### Acceptance Criteria

1. WHEN a system administrator sets the maximum loan duration THEN the System SHALL store the value in the Settings Collection
2. WHEN a user creates a loan request THEN the System SHALL enforce the maximum loan duration by limiting the return date selection
3. WHEN the maximum loan duration is updated THEN the System SHALL apply the new limit to all new loan requests immediately
4. WHEN a system administrator enters an invalid loan duration value THEN the System SHALL reject the input and display a validation error
5. WHEN the loan duration setting is displayed THEN the System SHALL show the current value with appropriate units

### Requirement 4

**User Story:** ในฐานะผู้ดูแลระบบ ฉันต้องการกำหนดจำนวนวันที่สามารถจองล่วงหน้าได้ เพื่อป้องกันผู้ใช้จองอุปกรณ์ไว้นานเกินไป

#### Acceptance Criteria

1. WHEN a system administrator sets the maximum advance booking period THEN the System SHALL store the value in the Settings Collection
2. WHEN a user creates a reservation THEN the System SHALL limit the reservation start date to within the advance booking period
3. WHEN the advance booking period is updated THEN the System SHALL apply the new limit to all new reservations immediately
4. WHEN a system administrator enters an invalid advance booking value THEN the System SHALL reject the input and display a validation error
5. WHEN a user attempts to book beyond the advance booking period THEN the System SHALL prevent the selection and display the maximum allowed date

### Requirement 5

**User Story:** ในฐานะผู้ดูแลระบบ ฉันต้องการตั้งค่า Discord Webhook เพื่อรับการแจ้งเตือนเหตุการณ์สำคัญของระบบผ่าน Discord

#### Acceptance Criteria

1. WHEN a system administrator enters a Discord Webhook URL THEN the System SHALL validate the URL format before saving
2. WHEN a Discord Webhook URL is saved THEN the System SHALL store the URL securely in the Settings Collection
3. WHEN a significant system event occurs THEN the System SHALL send a notification message to the configured Discord Webhook
4. WHEN a system administrator tests the Discord Webhook THEN the System SHALL send a test message and display the result
5. WHEN the Discord Webhook URL is invalid or unreachable THEN the System SHALL log the error and notify the administrator
6. WHEN a system administrator removes the Discord Webhook URL THEN the System SHALL stop sending notifications to Discord

### Requirement 6

**User Story:** ในฐานะผู้ดูแลระบบ ฉันต้องการกำหนดจำนวนอุปกรณ์ที่ผู้ใช้สามารถยืมได้ในแต่ละประเภท เพื่อควบคุมการกระจายอุปกรณ์อย่างเป็นธรรม

#### Acceptance Criteria

1. WHEN a system administrator sets a category limit THEN the System SHALL store the category ID and limit value in the Settings Collection
2. WHEN a user attempts to borrow equipment THEN the System SHALL check the current borrowed count against the category limit
3. WHEN a user exceeds the category limit THEN the System SHALL prevent the loan request and display the limit information
4. WHEN a system administrator updates a category limit THEN the System SHALL apply the new limit to all subsequent loan requests
5. WHEN a system administrator views category limits THEN the System SHALL display all configured limits with category names
6. WHEN a category limit is not set THEN the System SHALL apply a default system-wide limit

### Requirement 7

**User Story:** ในฐานะผู้ดูแลระบบ ฉันต้องการสร้างและส่งข้อความแจ้งเตือนให้ผู้ใช้ทั้งหมด เพื่อสื่อสารข้อมูลสำคัญหรือขอข้อเสนอแนะ

#### Acceptance Criteria

1. WHEN a system administrator creates a system notification THEN the System SHALL provide a form to compose the message with title and content
2. WHEN a system notification is submitted THEN the System SHALL store the notification in the Settings Collection with timestamp and author information
3. WHEN a system notification is created THEN the System SHALL send the notification to all active users through the notification system
4. WHEN a user logs in THEN the System SHALL display any unread system notifications
5. WHEN a system administrator views notification history THEN the System SHALL display all sent notifications with delivery statistics
6. WHEN a system notification includes a feedback request THEN the System SHALL provide a mechanism for users to respond

### Requirement 8

**User Story:** ในฐานะผู้ดูแลระบบ ฉันต้องการบันทึกและติดตามการเปลี่ยนแปลงการตั้งค่า เพื่อตรวจสอบประวัติและความรับผิดชอบ

#### Acceptance Criteria

1. WHEN a system administrator modifies any setting THEN the System SHALL create an audit log entry with the change details
2. WHEN an audit log entry is created THEN the System SHALL record the administrator ID, timestamp, setting name, old value, and new value
3. WHEN a system administrator views the audit log THEN the System SHALL display all setting changes in reverse chronological order
4. WHEN the audit log is displayed THEN the System SHALL include filtering options by date range, administrator, and setting type
5. WHEN a critical setting is changed THEN the System SHALL send a notification to all system administrators

### Requirement 9

**User Story:** ในฐานะผู้ดูแลระบบ ฉันต้องการนำเข้าและส่งออกการตั้งค่า เพื่อสำรองข้อมูลหรือย้ายการตั้งค่าไปยังระบบอื่น

#### Acceptance Criteria

1. WHEN a system administrator exports settings THEN the System SHALL generate a JSON file containing all current settings
2. WHEN a system administrator imports settings THEN the System SHALL validate the JSON file format before applying changes
3. WHEN settings are imported THEN the System SHALL create a backup of current settings before applying the import
4. WHEN an import fails validation THEN the System SHALL display specific error messages and preserve current settings
5. WHEN settings are exported THEN the System SHALL exclude sensitive information such as webhook URLs unless explicitly requested

### Requirement 10

**User Story:** ในฐานะระบบ ฉันต้องการแคชการตั้งค่าที่ใช้บ่อย เพื่อลดการเรียกใช้ฐานข้อมูลและเพิ่มประสิทธิภาพ

#### Acceptance Criteria

1. WHEN the System starts THEN the System SHALL load frequently accessed settings into memory cache
2. WHEN a setting is updated THEN the System SHALL invalidate the relevant cache entries immediately
3. WHEN a setting is requested THEN the System SHALL return the cached value if available and valid
4. WHEN the cache expires THEN the System SHALL refresh the cache from the Settings Collection
5. WHEN multiple instances of the System are running THEN the System SHALL synchronize cache invalidation across all instances
