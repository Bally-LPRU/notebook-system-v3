# My Requests Not Showing Loan Requests – Fix Notes (2025-11-25)

## Symptoms
- หน้า `my-requests` แสดงว่าไม่มีคำขอ ทั้งที่มีเอกสาร `loanRequests` ใน Firestore (ตรวจสอบแล้ว).
- หลังส่งคำขอยืมสำเร็จ ระบบแจ้งเตือน/รายการล่าสุดใน Dashboard แสดงถูกต้อง แต่หน้า `my-requests` ว่าง.

## Root Causes
1) Hook `useLoanRequests` เรียกคิวรีก่อน `userId` พร้อม ทำให้คิวรีผู้ใช้ส่งค่า `userId = undefined` แล้วไม่โหลดข้อมูล.  
2) คิวรีหลักของ `getLoanRequests` (มี pagination/orderBy) บางกรณีคืนผลลัพธ์ว่างสำหรับมุมมองผู้ใช้ แม้มีข้อมูลจริงในคอลเล็กชัน.

## Fixes Applied
- `useLoanRequests`: รอให้ `userId` พร้อมก่อนยิงคิวรี และ refresh เมื่อ initialFilters เปลี่ยน (เช่น uid มาแล้ว).
- `getLoanRequests`: เพิ่ม fallback query (`where userId == <uid>`) หากคิวรีหลักได้ผลลัพธ์ว่าง เพื่อดึงคำขอผู้ใช้ให้แสดงทันที.
- `LoanRequestForm`: ส่ง `createdRequest` กลับไปให้ caller เพื่ออัปเดต UI ได้ทันทีหลังส่งคำขอ.
- หน้า Equipment: โหลดคำขอที่ยังค้างของผู้ใช้และบล็อกปุ่มยืม/จองซ้ำ; หลังส่งคำขอยืมสำเร็จนำไป `my-requests`.

## Verification
- ส่งคำขอยืมใหม่ → หน้า `my-requests` แสดงรายการทันที (หรือหลังรีเฟรช).
- Dashboard “กิจกรรมล่าสุด” แสดงคำขอถูกต้องเช่นเดิม.

## Notes
- Push ยังไม่ทำในสภาพแวดล้อมนี้; ให้ `git push origin main` จากเครื่องที่มี credentials.
