# Requirements Document

## Introduction

ปรับปรุงหน้า Admin Settings โดยรวมการตั้งค่า "กฎการยืมและการจอง" (LoanRulesTab) และ "การยืมตามประเภทผู้ใช้" (UserTypeLimitsTab) ให้อยู่ในหน้าเดียวกัน เพื่อลดความสับสนของ admin และทำให้การตั้งค่าง่ายขึ้น โดยแสดงความสัมพันธ์ระหว่างค่าเริ่มต้นของระบบและค่าที่กำหนดตามประเภทผู้ใช้อย่างชัดเจน

## Glossary

- **Admin_Settings_Page**: หน้าการตั้งค่าระบบสำหรับผู้ดูแลระบบ
- **Unified_Loan_Settings_Tab**: แท็บการตั้งค่าการยืมแบบรวม ที่รวมกฎการยืมและการยืมตามประเภทผู้ใช้ไว้ด้วยกัน
- **Global_Loan_Rules**: กฎการยืมเริ่มต้นของระบบ (ระยะเวลาการยืมสูงสุด, การจองล่วงหน้าสูงสุด)
- **User_Type_Limits**: ค่าจำกัดการยืมตามประเภทผู้ใช้ (อาจารย์, เจ้าหน้าที่, นักศึกษา)
- **Settings_Context**: Context ที่จัดการ state ของการตั้งค่าทั้งหมด

## Requirements

### Requirement 1

**User Story:** As an admin, I want to see loan rules and user type limits on the same page, so that I can understand the relationship between global settings and user-specific settings without switching tabs.

#### Acceptance Criteria

1. WHEN an admin navigates to the loan settings tab THEN the Admin_Settings_Page SHALL display both global loan rules and user type limits in a single unified view
2. WHEN the unified tab loads THEN the Admin_Settings_Page SHALL show global loan rules section at the top followed by user type limits section below
3. WHEN displaying the unified tab THEN the Admin_Settings_Page SHALL use visual hierarchy to distinguish between global settings and user-specific settings

### Requirement 2

**User Story:** As an admin, I want to configure global loan rules (max loan duration, max advance booking days), so that I can set default values for all users.

#### Acceptance Criteria

1. WHEN an admin enters a value for max loan duration THEN the Unified_Loan_Settings_Tab SHALL validate that the value is between 1 and 365 days
2. WHEN an admin enters a value for max advance booking days THEN the Unified_Loan_Settings_Tab SHALL validate that the value is between 1 and 365 days
3. WHEN an admin saves global loan rules THEN the Unified_Loan_Settings_Tab SHALL persist the values to Firestore immediately
4. WHEN global loan rules are saved THEN the Unified_Loan_Settings_Tab SHALL display a success notification

### Requirement 3

**User Story:** As an admin, I want to configure loan limits per user type (teacher, staff, student), so that I can set different borrowing privileges for different user groups.

#### Acceptance Criteria

1. WHEN an admin enables user type limits THEN the Unified_Loan_Settings_Tab SHALL allow configuration of max items, max days, and max advance booking days per user type
2. WHEN an admin toggles a user type active/inactive THEN the Unified_Loan_Settings_Tab SHALL enable or disable the input fields for that user type
3. WHEN user type limits are saved THEN the Unified_Loan_Settings_Tab SHALL persist the values to Firestore immediately
4. WHEN a user type limit exceeds the global limit THEN the Unified_Loan_Settings_Tab SHALL display a warning message indicating the conflict

### Requirement 4

**User Story:** As an admin, I want to see clear visual indicators showing the relationship between global and user-specific settings, so that I can avoid configuration conflicts.

#### Acceptance Criteria

1. WHEN user type limits are enabled THEN the Unified_Loan_Settings_Tab SHALL display a visual comparison between global limits and user type limits
2. WHEN a user type limit exceeds the corresponding global limit THEN the Unified_Loan_Settings_Tab SHALL highlight the conflicting value with a warning color
3. WHEN displaying user type cards THEN the Unified_Loan_Settings_Tab SHALL show the effective limit (minimum of global and user type limit) for each setting

### Requirement 5

**User Story:** As an admin, I want to save all loan settings with a single action, so that I can efficiently manage the configuration.

#### Acceptance Criteria

1. WHEN an admin clicks the save button THEN the Unified_Loan_Settings_Tab SHALL save both global loan rules and user type limits in a single operation
2. WHEN saving settings THEN the Unified_Loan_Settings_Tab SHALL display a loading indicator during the save operation
3. IF an error occurs during save THEN the Unified_Loan_Settings_Tab SHALL display an error message and preserve the unsaved changes
4. WHEN settings are successfully saved THEN the Unified_Loan_Settings_Tab SHALL reset the "has changes" state

### Requirement 6

**User Story:** As an admin, I want the unified settings page to be responsive, so that I can manage settings on both desktop and mobile devices.

#### Acceptance Criteria

1. WHEN viewing on desktop THEN the Unified_Loan_Settings_Tab SHALL display user type cards in a 3-column grid layout
2. WHEN viewing on mobile THEN the Unified_Loan_Settings_Tab SHALL display user type cards in a single-column stacked layout
3. WHEN viewing on tablet THEN the Unified_Loan_Settings_Tab SHALL display user type cards in a 2-column grid layout

### Requirement 7

**User Story:** As an admin, I want to see helpful guidance about the settings, so that I can make informed decisions about configuration values.

#### Acceptance Criteria

1. WHEN displaying the unified tab THEN the Unified_Loan_Settings_Tab SHALL include tooltips explaining each setting field
2. WHEN displaying the unified tab THEN the Unified_Loan_Settings_Tab SHALL include a collapsible help section with recommended values and examples
3. WHEN a conflict is detected THEN the Unified_Loan_Settings_Tab SHALL explain the impact of the conflict in the warning message
