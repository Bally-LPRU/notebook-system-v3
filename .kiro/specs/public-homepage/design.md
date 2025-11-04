# Design Document - Public Homepage

## Overview

การออกแบบหน้าแรกสาธารณะแบบ Dashboard Style ที่แสดงสถิติอุปกรณ์ในรูปแบบ cards พร้อมระบบ navigation และ authentication ที่เรียบง่ายและใช้งานง่าย

## Architecture

### Component Structure
```
PublicHomepage
├── Header (Navigation + Login Button)
├── HeroSection (Welcome Message + System Title)
├── StatsSection (4 Statistics Cards)
├── Footer (Contact Information)
└── AuthModal (Google Login Integration)
```

### Data Flow
1. **Page Load**: โหลดข้อมูลสถิติจาก Firestore
2. **Statistics Display**: แสดงผลในรูปแบบ cards
3. **Authentication**: เชื่อมต่อกับ Google OAuth
4. **Redirect**: นำทางไปยัง dashboard หลัง login สำเร็จ

## Components and Interfaces

### 1. PublicHomepage Component
```javascript
interface PublicHomepageProps {
  // No props needed - standalone page
}

interface EquipmentStats {
  totalEquipment: number;
  availableEquipment: number;
  borrowedEquipment: number;
  pendingReservations: number;
}
```

### 2. Header Component
```javascript
interface HeaderProps {
  onLoginClick: () => void;
  isLoading?: boolean;
}
```

### 3. StatsCard Component
```javascript
interface StatsCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  color: 'blue' | 'green' | 'orange' | 'purple';
  loading?: boolean;
}
```

### 4. HeroSection Component
```javascript
interface HeroSectionProps {
  title: string;
  subtitle: string;
  onGetStarted: () => void;
}
```

## Data Models

### Equipment Statistics Model
```javascript
interface EquipmentStatistics {
  totalEquipment: number;        // จำนวนอุปกรณ์ทั้งหมด
  availableEquipment: number;    // อุปกรณ์ที่พร้อมใช้งาน
  borrowedEquipment: number;     // อุปกรณ์ที่กำลังถูกยืม
  pendingReservations: number;   // การจองที่รอดำเนินการ
  lastUpdated: Date;            // เวลาอัปเดตล่าสุด
}
```

### Statistics Service Interface
```javascript
interface StatisticsService {
  getPublicStats(): Promise<EquipmentStatistics>;
  subscribeToStats(callback: (stats: EquipmentStatistics) => void): () => void;
}
```

## Visual Design

### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│ Header: Logo + Navigation + Login Button                │
├─────────────────────────────────────────────────────────┤
│ Hero Section: Welcome Message + System Description      │
├─────────────────────────────────────────────────────────┤
│ Statistics Cards (2x2 Grid on Desktop, 1x4 on Mobile) │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│ │ Total   │ │Available│ │Borrowed │ │Pending  │        │
│ │Equipment│ │Equipment│ │Equipment│ │Reserves │        │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
├─────────────────────────────────────────────────────────┤
│ Footer: Contact Info + Help Links                       │
└─────────────────────────────────────────────────────────┘
```

### Color Scheme
- **Primary**: Blue (#3B82F6) - สำหรับปุ่มหลักและ links
- **Success**: Green (#10B981) - สำหรับอุปกรณ์ที่พร้อมใช้งาน
- **Warning**: Orange (#F59E0B) - สำหรับอุปกรณ์ที่ถูกยืม
- **Info**: Purple (#8B5CF6) - สำหรับการจอง
- **Background**: Gray (#F9FAFB) - พื้นหลังหลัก
- **Cards**: White (#FFFFFF) - พื้นหลัง cards

### Typography
- **Headings**: Inter font, Bold (600-700)
- **Body**: Inter font, Regular (400)
- **Numbers**: Inter font, Semi-bold (600)

### Responsive Breakpoints
- **Mobile**: 320px - 767px (1 column layout)
- **Tablet**: 768px - 1023px (2 column layout)
- **Desktop**: 1024px+ (4 column layout)

## Error Handling

### Data Loading States
1. **Loading**: แสดง skeleton cards ขณะโหลดข้อมูล
2. **Error**: แสดงข้อความ "ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง"
3. **Empty**: แสดงค่า 0 พร้อมข้อความ "ยังไม่มีข้อมูล"
4. **Offline**: แสดงข้อมูลที่ cache ไว้ล่าสุด

### Authentication Errors
1. **Popup Blocked**: แจ้งให้อนุญาต popup
2. **Network Error**: แจ้งตรวจสอบการเชื่อมต่อ
3. **Domain Restriction**: แจ้งใช้อีเมลที่ได้รับอนุญาต
4. **General Error**: แจ้งข้อผิดพลาดทั่วไป

## Performance Considerations

### Loading Optimization
- ใช้ React.lazy() สำหรับ code splitting
- Preload critical resources
- Optimize images และ icons
- ใช้ CDN สำหรับ static assets

### Data Fetching
- Cache statistics data สำหรับ 30 วินาที
- ใช้ real-time listeners เฉพาะเมื่อจำเป็น
- Implement retry logic สำหรับ failed requests
- ใช้ skeleton loading แทน loading spinners

### Bundle Size
- Tree shake unused dependencies
- ใช้ dynamic imports สำหรับ non-critical components
- Minimize CSS และ JavaScript
- ใช้ modern image formats (WebP, AVIF)

## Testing Strategy

### Unit Tests
- Test individual components (StatsCard, Header, etc.)
- Test data fetching functions
- Test error handling scenarios
- Test responsive behavior

### Integration Tests
- Test complete user flow from homepage to login
- Test statistics data loading and display
- Test error states and recovery
- Test cross-browser compatibility

### E2E Tests
- Test full authentication flow
- Test responsive design on different devices
- Test performance on slow networks
- Test accessibility compliance

## Security Considerations

### Data Exposure
- แสดงเฉพาะข้อมูลสถิติที่ไม่ sensitive
- ไม่แสดงรายละเอียดผู้ใช้หรืออุปกรณ์เฉพาะ
- ใช้ Firestore security rules เพื่อจำกัดการเข้าถึง

### Authentication
- ใช้ Firebase Authentication สำหรับความปลอดภัย
- Validate email domains ที่ได้รับอนุญาต
- Implement proper session management
- ใช้ HTTPS สำหรับการเชื่อมต่อทั้งหมด

## Implementation Notes

### File Structure
```
src/
├── components/
│   ├── public/
│   │   ├── PublicHomepage.js
│   │   ├── Header.js
│   │   ├── HeroSection.js
│   │   ├── StatsCard.js
│   │   └── Footer.js
│   └── auth/
│       └── LoginModal.js
├── services/
│   └── statisticsService.js
├── hooks/
│   └── usePublicStats.js
└── styles/
    └── public-homepage.css
```

### Key Dependencies
- React Router สำหรับ navigation
- Firebase SDK สำหรับ authentication และ data
- Tailwind CSS สำหรับ styling
- React Icons สำหรับ iconography

### Development Approach
1. สร้าง static layout ก่อน
2. เพิ่ม data fetching และ state management
3. Implement authentication integration
4. เพิ่ม error handling และ loading states
5. Optimize performance และ responsive design
6. เพิ่ม tests และ documentation