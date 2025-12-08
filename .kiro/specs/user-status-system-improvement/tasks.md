# Implementation Plan

- [x] 1. สร้าง useUserTypeLimits Hook






  - [x] 1.1 สร้างไฟล์ src/hooks/useUserTypeLimits.js

    - สร้าง hook ที่ดึงข้อมูล user type limits จาก SettingsContext
    - รวม logic สำหรับ check userTypeLimitsEnabled
    - คำนวณ currentBorrowedCount, pendingRequestsCount, remainingQuota
    - Return limits object พร้อม loading, error states
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_


  - [x] 1.2 Write property test for useUserTypeLimits hook

    - **Property 1: User Type Limits Return Correct Values**
    - **Property 2: Default Limits Fallback**
    - **Validates: Requirements 1.2, 1.3, 7.3, 7.4**

  - [x] 1.3 Write property test for remaining quota calculation


    - **Property 3: Remaining Quota Calculation**
    - **Validates: Requirements 1.4, 6.2, 6.4**

- [x] 2. ปรับปรุงหน้า Dashboard





  - [x] 2.1 สร้าง BorrowingLimitsCard component


    - สร้างไฟล์ src/components/dashboard/BorrowingLimitsCard.js
    - แสดง user type, maxItems, maxDays, maxAdvanceBookingDays
    - แสดง currentBorrowedCount และ remainingQuota
    - รองรับทั้งกรณี userTypeLimitsEnabled และ disabled
    - _Requirements: 1.1, 1.2, 1.3, 1.4_


  - [x] 2.2 สร้าง LoanRulesSection component

    - สร้างไฟล์ src/components/dashboard/LoanRulesSection.js
    - แสดงกฎระเบียบการยืม-คืนจาก settings
    - แสดง loanReturnStartTime, loanReturnEndTime ถ้ามี
    - แสดง upcoming closedDates
    - แสดง maxAdvanceBookingDays
    - _Requirements: 1.6, 1.7, 1.8, 1.9_

  - [x] 2.3 อัปเดต Dashboard.js


    - เพิ่ม BorrowingLimitsCard และ LoanRulesSection
    - ใช้ useUserTypeLimits hook
    - _Requirements: 1.1, 1.5, 1.10_


  - [x] 2.4 Write property test for user type label mapping

    - **Property 7: User Type Label Mapping**
    - **Validates: Requirements 3.1, 8.1**

- [x] 3. Checkpoint - ตรวจสอบ tests





  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. ปรับปรุงหน้า Profile






  - [x] 4.1 อัปเดต ProfilePage.js

    - เพิ่มส่วนแสดง user type พร้อม Thai label
    - เพิ่มส่วนแสดง borrowing limits
    - แสดง warning ถ้า user type ไม่ได้ตั้งค่า
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5. ปรับปรุง Loan Request Form




  - [x] 5.1 อัปเดต EnhancedLoanRequestForm.js

    - ใช้ useUserTypeLimits hook
    - แสดง borrowing limits ในฟอร์ม
    - จำกัด date picker ตาม maxDays
    - แสดง remaining quota
    - Disable submit ถ้าเกิน maxItems
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_


  - [x] 5.2 Write property test for loan duration enforcement

    - **Property 4: Loan Duration Enforcement**
    - **Validates: Requirements 2.3, 4.2**


  - [x] 5.3 Write property test for max items enforcement

    - **Property 6: Max Items Enforcement**
    - **Validates: Requirements 2.2, 4.3**

- [x] 6. ปรับปรุง Reservation Page






  - [x] 6.1 อัปเดต ReservationPage.js และ ReservationForm.js

    - ใช้ useUserTypeLimits hook
    - จำกัด date picker ตาม maxAdvanceBookingDays
    - แสดง advance booking limit
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_


  - [x] 6.2 Write property test for advance booking enforcement

    - **Property 5: Advance Booking Enforcement**
    - **Validates: Requirements 2.4, 5.2**

- [x] 7. Checkpoint - ตรวจสอบ tests





  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. ปรับปรุงหน้า My Requests






  - [x] 8.1 อัปเดต MyRequests.js

    - เพิ่มส่วนแสดง borrowing summary
    - แสดง currentBorrowedCount, pendingRequestsCount, remainingQuota
    - ใช้ useUserTypeLimits hook
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 9. สร้างหน้าประวัติการยืม-คืน






  - [x] 9.1 สร้าง useLoanHistory hook

    - สร้างไฟล์ src/hooks/useLoanHistory.js
    - ดึงข้อมูลประวัติการยืมจาก loanRequests collection
    - รองรับ filtering และ search
    - คำนวณ statistics
    - _Requirements: 9.1, 9.3, 9.4, 9.5_


  - [x] 9.2 สร้าง LoanHistoryPage component

    - สร้างไฟล์ src/components/loan/LoanHistoryPage.js
    - แสดงรายการประวัติการยืม-คืน
    - แสดง filters และ search
    - แสดง statistics summary
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_


  - [x] 9.3 เพิ่ม route สำหรับ LoanHistoryPage

    - เพิ่ม /loan-history route ใน App.js
    - _Requirements: 9.1_


  - [x] 9.4 Write property test for loan history filtering

    - **Property 8: Loan History Filtering**
    - **Validates: Requirements 9.3**


  - [x] 9.5 Write property test for loan history statistics





    - **Property 9: Loan History Statistics Calculation**
    - **Validates: Requirements 9.4**

- [x] 10. Checkpoint - ตรวจสอบ tests





  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. สร้างหน้าประวัติการแจ้งเตือน




  - [x] 11.1 สร้าง useNotificationHistory hook

    - สร้างไฟล์ src/hooks/useNotificationHistory.js
    - ดึงข้อมูลประวัติการแจ้งเตือนจาก notifications collection
    - รองรับ filtering และ grouping by date
    - รองรับ markAsRead และ markAllAsRead
    - _Requirements: 10.1, 10.3, 10.4, 10.5_


  - [x] 11.2 สร้าง NotificationHistoryPage component

    - สร้างไฟล์ src/components/notifications/NotificationHistoryPage.js
    - แสดงรายการประวัติการแจ้งเตือน grouped by date
    - แสดง filters
    - รองรับ mark as read
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_


  - [x] 11.3 เพิ่ม route สำหรับ NotificationHistoryPage

    - เพิ่ม /notification-history route ใน App.js
    - _Requirements: 10.1_


  - [x] 11.4 Write property test for notification grouping

    - **Property 10: Notification Grouping by Date**
    - **Validates: Requirements 10.4**


  - [x] 11.5 Write property test for notification read status

    - **Property 11: Notification Read Status Update**
    - **Validates: Requirements 10.5**

- [x] 12. ปรับปรุงหน้า Admin User Management





  - [x] 12.1 อัปเดต UserManagementTable.js


    - เพิ่ม column แสดง user type พร้อม Thai label
    - _Requirements: 8.1_


  - [x] 12.2 อัปเดต UserEditModal.js

    - เพิ่ม dropdown สำหรับเลือก user type
    - แสดง borrowing limits ที่จะ apply
    - _Requirements: 8.2, 8.3, 8.4, 8.5_

- [x] 13. อัปเดต Navigation






  - [x] 13.1 อัปเดต Sidebar.js

    - เพิ่มเมนู "ประวัติการยืม-คืน" สำหรับ user
    - เพิ่มเมนู "ประวัติการแจ้งเตือน" สำหรับ user
    - _Requirements: 9.1, 10.1_

- [x] 14. Final Checkpoint - ตรวจสอบ tests ทั้งหมด





  - Ensure all tests pass, ask the user if questions arise.
