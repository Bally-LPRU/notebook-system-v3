# Loan System Documentation

เอกสารเกี่ยวกับระบบยืม-คืนอุปกรณ์ (Loan Management System)

## 📁 เอกสารในโฟลเดอร์นี้

### การใช้งานและ Implementation
- `LOAN_REQUESTS_IMPLEMENTATION.md` - การพัฒนาระบบคำขอยืม
- `RESERVATIONS_IMPLEMENTATION.md` - การพัฒนาระบบจอง
- `REPORTS_IMPLEMENTATION.md` - การพัฒนาระบบรายงาน

### การแก้ไขและปรับปรุง
- `LOAN_REQUESTS_PAGE_FIX.md` - แก้ไขหน้าคำขอยืม
- `LOAN_REQUESTS_PAGE_IMPROVEMENTS.md` - ปรับปรุงหน้าคำขอยืม
- `LOAN_SYSTEM_PERFORMANCE_FIX.md` - แก้ไขประสิทธิภาพ

### การเกินกำหนด (Overdue)
- `OVERDUE_MANAGEMENT_IMPLEMENTATION.md` - การพัฒนาระบบจัดการเกินกำหนด
- `OVERDUE_MANAGEMENT_QUICK_START.md` - Quick Start สำหรับระบบเกินกำหนด

### รายงานและการตรวจสอบ
- `LOAN_SYSTEM_AUDIT_REPORT.md` - รายงานการตรวจสอบระบบ
- `LOAN_SYSTEM_OPTIMIZATION_REPORT.md` - รายงานการปรับปรุงประสิทธิภาพ

## 🔗 เอกสารที่เกี่ยวข้อง

- [Migration Guide](../deployment/MIGRATION_GUIDE.md)
- [Performance Guide](../performance/)

## 🔧 Scripts ที่เกี่ยวข้อง

- `scripts/migrate-loan-denormalized-fields.js` - Migration สำหรับ denormalized fields
- `scripts/migrate-loan-request-denormalization.js` - Migration สำหรับ loan requests
- `scripts/migrate-loan-request-search-keywords.js` - Migration สำหรับ search keywords

## ⚡ Functions

- `functions/checkOverdueLoans.js` - Cloud Function ตรวจสอบการเกินกำหนด
