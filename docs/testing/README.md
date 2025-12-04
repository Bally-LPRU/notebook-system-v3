# Testing Documentation

เอกสารเกี่ยวกับการทดสอบระบบ

## 📁 เอกสารในโฟลเดอร์นี้

### คู่มือการทดสอบ
- `production-testing-guide.md` - คู่มือทดสอบ Production
- `user-management-testing.md` - คู่มือทดสอบการจัดการผู้ใช้

## 🧪 ประเภทการทดสอบ

### 1. Unit Testing
ทดสอบ function และ component แยกส่วน

**ตัวอย่าง:**
```javascript
// src/utils/__tests__/equipmentHelpers.test.js
// src/components/__tests__/EquipmentCard.test.js
```

### 2. Integration Testing
ทดสอบการทำงานร่วมกันของหลาย component

**ตัวอย่าง:**
```javascript
// src/components/__tests__/SearchFilter.integration.test.js
// src/services/__tests__/equipmentManagement.integration.test.js
```

### 3. Property-Based Testing
ทดสอบด้วย random inputs

**ตัวอย่าง:**
```javascript
// src/hooks/__tests__/useEquipmentFilters.property.test.js
// src/services/__tests__/settingsService.property.test.js
```

#### รัน Property Tests พร้อม Firebase Emulator
1. ติดตั้ง/อัปเดต Firebase CLI (`npm install -g firebase-tools`)
2. รันคำสั่ง
  ```bash
  npm run test:property
  ```
  คำสั่งนี้จะ:
  - เปิด Auth/Firestore/Storage Emulator ตามค่าใน `firebase.json`
  - ใส่ environment variables (`REACT_APP_USE_FIREBASE_EMULATORS=true` และ host/port) ให้อัตโนมัติก่อนรัน Jest
  - รันเฉพาะไฟล์ `*.property.test.js` แบบ `--runInBand` เพื่อหลีกเลี่ยง race condition
3. ปิด emulator โดยอัตโนมัติหลังเทสต์จบ (เพราะใช้ `firebase emulators:exec`)

### 4. E2E Testing
ทดสอบ user flow ทั้งหมด

**ตัวอย่าง:**
```javascript
// src/components/public/__tests__/PublicHomepage.e2e.test.js
```

### 5. Performance Testing
ทดสอบประสิทธิภาพ

**ตัวอย่าง:**
```javascript
// src/components/__tests__/RenderPerformance.profile.test.js
```

## 🔧 เครื่องมือทดสอบ

### Testing Framework
- **Jest** - Test runner
- **React Testing Library** - Component testing
- **fast-check** - Property-based testing

### Scripts
- `scripts/run-production-tests.js` - ทดสอบ production
- `scripts/production-test-suite.js` - Test suite
- `scripts/security-performance-audit.js` - Audit
- `scripts/mobile-device-testing.js` - ทดสอบ mobile

## 📋 Test Checklist

### ก่อน Deploy
- [ ] Unit tests ผ่านทั้งหมด
- [ ] Integration tests ผ่าน
- [ ] E2E tests ผ่าน
- [ ] Performance tests ผ่าน
- [ ] Security audit ผ่าน
- [ ] Mobile testing ผ่าน

### หลัง Deploy
- [ ] Smoke testing
- [ ] User acceptance testing
- [ ] Performance monitoring
- [ ] Error tracking

## 🎯 Coverage Goals

### Target Coverage
- Unit Tests: **80%+**
- Integration Tests: **70%+**
- E2E Tests: **Critical paths**

### Current Coverage
ตรวจสอบด้วย:
```bash
npm run test:coverage
```

## 🚀 การรัน Tests

### รัน Tests ทั้งหมด
```bash
npm test
```

### รัน Tests แบบ Watch
```bash
npm run test:watch
```

### รัน Tests เฉพาะไฟล์
```bash
npm test -- EquipmentCard
```

### รัน Tests แบบ Coverage
```bash
npm run test:coverage
```

## 📝 การเขียน Tests

### Best Practices
1. **Arrange-Act-Assert** pattern
2. ตั้งชื่อ test ให้ชัดเจน
3. Test edge cases
4. Mock external dependencies
5. Keep tests simple

### ตัวอย่าง
```javascript
describe('EquipmentCard', () => {
  it('should display equipment name', () => {
    // Arrange
    const equipment = { name: 'Laptop' };
    
    // Act
    render(<EquipmentCard equipment={equipment} />);
    
    // Assert
    expect(screen.getByText('Laptop')).toBeInTheDocument();
  });
});
```

## 🔗 เอกสารที่เกี่ยวข้อง

- [Deployment](../deployment/)
- [Performance](../performance/)
- [Architecture](../ARCHITECTURE.md)

## 🐛 Debugging Tests

### ดู Test Output
```bash
npm test -- --verbose
```

### Debug ใน VS Code
ใช้ configuration:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal"
}
```

## 📊 Test Reports

### Generate Report
```bash
npm run test:coverage
```

### View Report
เปิดไฟล์: `coverage/lcov-report/index.html`
