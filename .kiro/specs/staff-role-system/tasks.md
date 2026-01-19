# Implementation Plan: Staff Role System

## Overview

แผนการพัฒนาระบบบทบาท Staff สำหรับเจ้าหน้าที่ให้บริการยืม-คืน โดยขยายระบบสิทธิ์ที่มีอยู่และสร้าง UI components ใหม่สำหรับการจัดการคำขอยืม-คืน

## Tasks

- [x] 1. ขยายระบบสิทธิ์ (Permission System Extension)
  - [x] 1.1 เพิ่ม Staff role และ permissions ใน permissionService.js
    - เพิ่ม ROLES.STAFF = 'staff'
    - เพิ่ม permissions: LOAN_REQUEST_VIEW, LOAN_REQUEST_APPROVE, LOAN_REQUEST_REJECT, LOAN_RETURN_PROCESS, LOAN_RETURN_VERIFY, OVERDUE_VIEW, OVERDUE_NOTIFY
    - กำหนด ROLE_PERMISSIONS สำหรับ Staff
    - _Requirements: 1.1, 1.2, 2.1, 2.2_

  - [x] 1.2 เขียน property test สำหรับ Staff permission boundary

    - **Property 1: Staff Permission Boundary**
    - **Validates: Requirements 2.1, 2.2, 2.3**

  - [x] 1.3 เพิ่ม getRoleDisplayInfo สำหรับ Staff
    - แสดงชื่อ "เจ้าหน้าที่ให้บริการ" เป็นภาษาไทย
    - กำหนด color และ icon
    - _Requirements: 1.4_

  - [x] 1.4 เขียน property test สำหรับ Role hierarchy

    - **Property 2: Role Hierarchy Inheritance**
    - **Validates: Requirements 11.1, 11.7**

- [x] 2. อัปเดต usePermissions hook
  - [x] 2.1 เพิ่ม Staff-specific permission checks
    - canApproveLoan, canRejectLoan, canProcessReturn, canViewOverdue, canNotifyOverdue
    - _Requirements: 2.1_

  - [x] 2.2 เพิ่ม isStaff property
    - ตรวจสอบว่าผู้ใช้มี role เป็น staff หรือไม่
    - _Requirements: 1.1_

- [x] 3. Checkpoint - ทดสอบระบบสิทธิ์
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. อัปเดต AuthContext
  - [x] 4.1 เพิ่ม isStaff property
    - เพิ่มใน value object ของ AuthContext
    - _Requirements: 1.1_

  - [x] 4.2 อัปเดต getDashboardRoute สำหรับ Staff
    - Staff redirect ไปยัง /staff/dashboard
    - _Requirements: 9.1_

- [x] 5. สร้าง Staff Dashboard
  - [x] 5.1 สร้าง StaffDashboard.js component
    - แสดงสถิติ: pendingRequests, activeLoans, overdueLoans, todayReturns
    - แสดง recentActivity (10 รายการล่าสุด)
    - ใช้ layout เดียวกับ AdminDashboard
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 5.2 เขียน property test สำหรับ Dashboard statistics

    - **Property 14: Staff Dashboard Statistics Accuracy**
    - **Validates: Requirements 9.2, 9.3, 9.4**

  - [x] 5.3 สร้าง StaffStatsCard component
    - Reuse pattern จาก AdminDashboard
    - _Requirements: 9.2, 9.3, 9.4_

  - [x] 5.4 สร้าง StaffRecentActivity component
    - แสดงกิจกรรมล่าสุดของ Staff
    - _Requirements: 9.5_

- [x] 6. สร้างหน้าจัดการคำขอยืม
  - [x] 6.1 สร้าง StaffLoanRequestList.js
    - แสดงรายการคำขอยืมทั้งหมด
    - รองรับ filter ตามสถานะ
    - รองรับ search ตามชื่อผู้ยืมหรืออุปกรณ์
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

  - [x] 6.2 เขียน property test สำหรับ loan request filtering

    - **Property: Loan Request Filter Accuracy**
    - **Validates: Requirements 3.4, 3.5**

  - [x] 6.3 สร้าง StaffLoanRequestCard.js
    - แสดงข้อมูลผู้ยืม, อุปกรณ์, ระยะเวลา
    - ปุ่มอนุมัติ/ปฏิเสธ/ดูรายละเอียด
    - _Requirements: 3.3_

  - [x] 6.4 สร้าง LoanApprovalModal.js
    - Modal ยืนยันการอนุมัติ
    - _Requirements: 4.1_

  - [x] 6.5 สร้าง LoanRejectionModal.js
    - Modal กรอกเหตุผลการปฏิเสธ
    - _Requirements: 4.2, 4.3_

- [x] 7. Checkpoint - ทดสอบหน้าจัดการคำขอยืม
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. สร้าง Loan Management Service Extension
  - [x] 8.1 เพิ่มฟังก์ชัน approveLoanRequest
    - เปลี่ยนสถานะเป็น approved
    - อัปเดต equipment availability
    - ส่ง notification ให้ผู้ยืม
    - บันทึก audit log
    - _Requirements: 4.1, 4.4, 4.5, 10.1_

  - [x] 8.2 เขียน property test สำหรับ loan approval

    - **Property 3: Loan Approval State Transition**
    - **Validates: Requirements 4.1, 4.4, 4.5, 10.1**

  - [x] 8.3 เพิ่มฟังก์ชัน rejectLoanRequest
    - เปลี่ยนสถานะเป็น rejected
    - บันทึกเหตุผล
    - ส่ง notification ให้ผู้ยืม
    - บันทึก audit log
    - _Requirements: 4.3, 4.4, 10.2_

  - [ ]* 8.4 เขียน property test สำหรับ loan rejection
    - **Property 4: Loan Rejection State Transition**
    - **Validates: Requirements 4.3, 4.4, 10.2**

  - [x] 8.5 เพิ่มการตรวจสอบ equipment availability ก่อนอนุมัติ
    - ป้องกันการอนุมัติอุปกรณ์ที่ไม่ว่าง
    - _Requirements: 4.6_

  - [ ]* 8.6 เขียน property test สำหรับ unavailable equipment prevention
    - **Property 12: Unavailable Equipment Approval Prevention**
    - **Validates: Requirements 4.6**

- [x] 9. สร้างหน้ารับคืนอุปกรณ์
  - [x] 9.1 สร้าง StaffReturnList.js
    - แสดงรายการที่กำลังยืม
    - รองรับ search
    - _Requirements: 5.1_

  - [x] 9.2 สร้าง ReturnProcessModal.js
    - Form ตรวจสภาพอุปกรณ์ (good, damaged, missing_parts)
    - ช่องหมายเหตุ
    - _Requirements: 5.2, 5.3_

  - [x] 9.3 เพิ่มฟังก์ชัน processReturn ใน service
    - เปลี่ยนสถานะเป็น returned
    - อัปเดต equipment availability
    - บันทึก condition
    - บันทึก audit log
    - _Requirements: 5.4, 5.5, 10.3_

  - [ ]* 9.4 เขียน property test สำหรับ return processing
    - **Property 5: Return Processing State Transition**
    - **Validates: Requirements 5.4, 5.5, 10.3**

  - [x] 9.5 เพิ่มการสร้าง damage report เมื่ออุปกรณ์เสียหาย
    - สร้าง damage report
    - ส่ง priority notification ให้ Admin
    - _Requirements: 5.6_

  - [ ]* 9.6 เขียน property test สำหรับ damage report creation
    - **Property 6: Damaged Equipment Report Creation**
    - **Validates: Requirements 5.6, 12.8**

- [x] 10. Checkpoint - ทดสอบหน้ารับคืนอุปกรณ์
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. สร้างหน้าจัดการรายการค้างคืน
  - [x] 11.1 สร้าง StaffOverdueList.js
    - แสดงรายการค้างคืนทั้งหมด
    - แสดงจำนวนวันค้าง, ข้อมูลติดต่อผู้ยืม
    - _Requirements: 6.1, 6.2_

  - [ ]* 11.2 เขียน property test สำหรับ overdue query
    - **Property 13: Overdue Loan Query Accuracy**
    - **Validates: Requirements 6.1**

  - [x] 11.3 เพิ่มฟังก์ชัน sendOverdueNotification
    - ส่งการแจ้งเตือนให้ผู้ยืม
    - บันทึก log
    - _Requirements: 6.3, 6.4_

  - [x] 11.4 ป้องกัน Staff แก้ไข penalty settings
    - ไม่แสดงปุ่มแก้ไข penalty
    - _Requirements: 6.5_

- [x] 12. สร้างระบบ Access Control สำหรับ Staff
  - [x] 12.1 สร้าง StaffRoute component
    - ตรวจสอบสิทธิ์ Staff
    - Redirect ไป dashboard หากไม่มีสิทธิ์
    - _Requirements: 7.1-7.6_

  - [ ]* 12.2 เขียน property test สำหรับ access restriction
    - **Property 7: Staff Access Restriction**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6**

  - [x] 12.3 อัปเดต Sidebar.js สำหรับ Staff menu
    - แสดงเฉพาะเมนูที่ Staff มีสิทธิ์
    - ซ่อนเมนู admin
    - _Requirements: 7.7, 13.1-13.5_

  - [ ]* 12.4 เขียน property test สำหรับ menu visibility
    - **Property 8: Menu Visibility by Role**
    - **Validates: Requirements 7.7, 13.4, 13.5**

- [x] 13. Checkpoint - ทดสอบ Access Control
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. สร้างระบบแจ้งเตือน Admin
  - [x] 14.1 สร้าง staffActivityNotificationService.js
    - ส่ง notification ให้ Admin เมื่อ Staff ทำงาน
    - รองรับ priority notification
    - _Requirements: 12.1-12.5_

  - [ ]* 14.2 เขียน property test สำหรับ Admin notification
    - **Property 9: Admin Notification for Staff Actions**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5**

  - [x] 14.3 เพิ่ม Staff Activity section ใน Admin Dashboard
    - แสดงกิจกรรม Staff ล่าสุด
    - รองรับ filter ตามวันที่, Staff, action type
    - _Requirements: 12.6, 12.7_

  - [x] 14.4 สร้าง Staff Daily Summary report
    - สรุปกิจกรรม Staff รายวัน
    - _Requirements: 12.9_

- [x] 15. สร้างระบบ Audit Log สำหรับ Staff
  - [x] 15.1 เพิ่ม Staff action logging
    - บันทึกทุก action ของ Staff
    - _Requirements: 10.1-10.4_

  - [ ]* 15.2 เขียน property test สำหรับ audit logging
    - **Property 10: Staff Action Audit Logging**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4**

  - [x] 15.3 ป้องกัน Staff ดู/แก้ไข audit logs
    - ซ่อน audit log menu จาก Staff
    - _Requirements: 10.5, 10.6_

- [x] 16. อัปเดต User Management สำหรับ Admin
  - [x] 16.1 เพิ่ม Staff option ใน role dropdown
    - Admin สามารถเลือก role "staff" ได้
    - _Requirements: 8.1_

  - [x] 16.2 เพิ่มการบันทึก staffAssignedAt และ staffAssignedBy
    - บันทึกเมื่อ assign Staff role
    - _Requirements: 8.4_

  - [ ]* 16.3 เขียน property test สำหรับ role change
    - **Property 11: Role Change Permission Update**
    - **Validates: Requirements 8.2, 8.3**

  - [x] 16.4 ป้องกัน Staff เปลี่ยน role ผู้อื่น
    - ซ่อน role dropdown จาก Staff
    - _Requirements: 8.5_

- [x] 17. อัปเดต App.js Routes
  - [x] 17.1 เพิ่ม Staff routes
    - /staff/dashboard
    - /staff/loan-requests
    - /staff/returns
    - /staff/overdue
    - _Requirements: 3.1, 5.1, 6.1, 9.1_

  - [x] 17.2 เพิ่ม route protection สำหรับ Staff pages
    - ใช้ StaffRoute component
    - _Requirements: 7.1-7.6_

- [x] 18. Final Checkpoint - Integration Testing
  - Ensure all tests pass, ask the user if questions arise.
  - ทดสอบ flow การทำงานทั้งหมด:
    - Staff login และเห็น dashboard
    - Staff อนุมัติ/ปฏิเสธคำขอยืม
    - Staff รับคืนอุปกรณ์
    - Staff ส่งการแจ้งเตือนค้างคืน
    - Admin ได้รับ notification
    - Admin ดู Staff activity

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- ใช้ components ที่มีอยู่แล้วให้มากที่สุด (LoanRequestCard, LoanStatusBadge, etc.)
- ออกแบบ UI ให้สอดคล้องกับระบบหลัก (Tailwind CSS, color scheme)
