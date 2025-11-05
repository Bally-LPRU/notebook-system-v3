# เอกสารการออกแบบระบบ - ระบบจัดการอุปกรณ์

## ภาพรวม

ระบบจัดการอุปกรณ์เป็นเว็บแอปพลิเคชันที่พัฒนาด้วย React.js และ Tailwind CSS โดยใช้ Firebase เป็นฐานข้อมูลและ Firebase Storage สำหรับจัดเก็บรูปภาพ ระบบออกแบบให้รองรับการใช้งานทั้งบนเดสก์ท็อปและมือถือ (Mobile-First Responsive Design) และสอดคล้องกับ design system ของระบบโดยรวม

## สถาปัตยกรรมระบบ

### Frontend Architecture
```
┌─────────────────────────────────────────┐
│              React.js App               │
├─────────────────────────────────────────┤
│  Equipment Management Components        │
│  (Tailwind CSS + Shared Design System) │
├─────────────────────────────────────────┤
│         State Management                │
│      (React Context + Hooks)           │
├─────────────────────────────────────────┤
│        Firebase SDK                     │
├─────────────────────────────────────────┤
│  • Firestore (Database)                │
│  • Storage (Images)                     │
│  • Authentication (Existing)           │
└─────────────────────────────────────────┘
```

### Data Flow Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Input    │───▶│   Components    │───▶│   Services      │
│  (Forms/UI)     │    │   (React)       │    │  (Firebase)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Updates    │◀───│   State Mgmt    │◀───│   Firestore     │
│  (Re-render)    │    │   (Context)     │    │   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## คอมโพเนนต์และอินเทอร์เฟซ

### 1. Layout และ Navigation Components

#### EquipmentLayout Component
- **วัตถุประสงค์**: Layout หลักสำหรับหน้าจัดการอุปกรณ์
- **Props**: children, title, actions
- **Features**:
  - Header พร้อม breadcrumb navigation
  - Action buttons (เพิ่มอุปกรณ์, ส่งออกข้อมูล)
  - Responsive sidebar สำหรับ filters
  - Loading states และ error boundaries

#### EquipmentNavigation Component
- **วัตถุประสงค์**: เมนูนำทางสำหรับระบบจัดการอุปกรณ์
- **Props**: activeSection, userRole
- **Features**:
  - รายการอุปกรณ์ทั้งหมด
  - หมวดหมู่อุปกรณ์
  - รายงานและสถิติ
  - การตั้งค่า (สำหรับ admin)

### 2. Equipment List และ Display Components

#### EquipmentGrid Component
- **วัตถุประสงค์**: แสดงรายการอุปกรณ์ในรูปแบบ grid
- **Props**: equipment, loading, onEdit, onDelete, onView
- **State**: selectedItems, viewMode (grid/list)
- **Features**:
  - Responsive grid layout (1-4 columns ตามขนาดหน้าจอ)
  - Bulk selection สำหรับ bulk actions
  - Sort และ filter integration
  - Infinite scroll หรือ pagination
  - Empty state สำหรับเมื่อไม่มีข้อมูล

#### EquipmentCard Component
- **วัตถุประสงค์**: แสดงข้อมูลอุปกรณ์แต่ละชิ้นในรูปแบบ card
- **Props**: equipment, onEdit, onDelete, onView, selectable
- **Features**:
  - รูปภาพอุปกรณ์พร้อม image carousel (หากมีหลายรูป)
  - ข้อมูลสำคัญ: หมายเลขครุภัณฑ์, ชื่อ, ยี่ห้อ, รุ่น
  - Status badge แสดงสถานะอุปกรณ์
  - Quick action buttons (แก้ไข, ลบ, ดูรายละเอียด)
  - Hover effects และ animations
  - QR code สำหรับหมายเลขครุภัณฑ์

#### EquipmentListView Component
- **วัตถุประสงค์**: แสดงรายการอุปกรณ์ในรูปแบบ table
- **Props**: equipment, columns, sortable, onSort
- **Features**:
  - Sortable columns
  - Resizable columns
  - Sticky header
  - Row selection
  - Inline editing (สำหรับฟิลด์บางอย่าง)

### 3. Equipment Form Components

#### EquipmentForm Component
- **วัตถุประสงค์**: ฟอร์มเพิ่ม/แก้ไขอุปกรณ์
- **Props**: equipment (optional), onSubmit, onCancel, mode
- **State**: formData, images, loading, errors, isDirty
- **Features**:
  - Multi-step form สำหรับข้อมูลจำนวนมาก
  - Real-time validation
  - Auto-save draft
  - Image upload และ preview
  - Duplicate detection สำหรับหมายเลขครุภัณฑ์

#### EquipmentFormFields Component
- **วัตถุประสงค์**: กลุ่มฟิลด์สำหรับข้อมูลอุปกรณ์
- **Props**: formData, onChange, errors, disabled
- **Fields**:
  - หมายเลขครุภัณฑ์ (required, unique validation)
  - ชื่ออุปกรณ์ (required)
  - ประเภทอุปกรณ์ (dropdown with search)
  - ยี่ห้อ (autocomplete)
  - รุ่น (text input)
  - รายละเอียด (rich text editor)
  - สถานะ (dropdown)
  - วันที่ซื้อ (date picker)
  - ราคาซื้อ (number input with currency)
  - สถานที่ตั้ง (text input with suggestions)
  - ผู้รับผิดชอบ (user selector)

#### ImageUploadComponent
- **วัตถุประสงค์**: อัปโหลดและจัดการรูปภาพอุปกรณ์
- **Props**: images, onImagesChange, maxImages, maxSize
- **State**: uploading, progress, errors
- **Features**:
  - Drag & drop interface
  - Camera capture สำหรับมือถือ
  - Image preview พร้อม crop/rotate
  - Multiple image upload
  - Progress indicators
  - Image compression และ optimization
  - Error handling สำหรับไฟล์ที่ไม่รองรับ

### 4. Search และ Filter Components

#### EquipmentSearch Component
- **วัตถุประสงค์**: ช่องค้นหาอุปกรณ์
- **Props**: onSearch, placeholder, suggestions
- **State**: query, suggestions, loading
- **Features**:
  - Real-time search พร้อม debouncing
  - Search suggestions
  - Advanced search modal
  - Search history
  - Voice search (สำหรับ browsers ที่รองรับ)

#### EquipmentFilters Component
- **วัตถุประสงค์**: ตัวกรองสำหรับรายการอุปกรณ์
- **Props**: filters, onFiltersChange, categories, statuses
- **State**: activeFilters, expanded
- **Features**:
  - Category filter (multi-select)
  - Status filter (multi-select)
  - Date range picker สำหรับวันที่ซื้อ
  - Price range slider
  - Location filter
  - Responsible person filter
  - Clear all filters button
  - Save filter presets

#### AdvancedSearchModal Component
- **วัตถุประสงค์**: Modal สำหรับการค้นหาขั้นสูง
- **Props**: isOpen, onClose, onSearch
- **Features**:
  - Multiple search criteria
  - Boolean operators (AND, OR, NOT)
  - Field-specific searches
  - Save search queries
  - Export search results

### 5. Equipment Detail Components

#### EquipmentDetailView Component
- **วัตถุประสงค์**: แสดงรายละเอียดอุปกรณ์แบบเต็ม
- **Props**: equipmentId, onEdit, onDelete
- **State**: equipment, loading, error
- **Features**:
  - Image gallery พร้อม lightbox
  - Complete equipment information
  - Edit history และ audit log
  - QR code generation
  - Print-friendly view
  - Share functionality

#### EquipmentImageGallery Component
- **วัตถุประสงค์**: แสดงรูปภาพอุปกรณ์
- **Props**: images, editable, onImagesChange
- **Features**:
  - Image carousel
  - Thumbnail navigation
  - Zoom functionality
  - Full-screen view
  - Image rotation และ basic editing
  - Add/remove images (ถ้า editable)

### 6. Bulk Operations Components

#### BulkActionBar Component
- **วัตถุประสงค์**: แถบสำหรับ bulk operations
- **Props**: selectedItems, onAction, availableActions
- **Features**:
  - Bulk edit (status, location, responsible person)
  - Bulk delete พร้อม confirmation
  - Bulk export
  - Generate QR codes
  - Print labels

#### BulkEditModal Component
- **วัตถุประสงค์**: Modal สำหรับแก้ไขหลายรายการ
- **Props**: selectedItems, onSave, onCancel
- **Features**:
  - Select fields to update
  - Preview changes
  - Validation
  - Progress tracking

### 7. Export และ Report Components

#### ExportModal Component
- **วัตถุประสงค์**: Modal สำหรับส่งออกข้อมูล
- **Props**: equipment, onExport, onCancel
- **State**: format, fields, options, loading
- **Features**:
  - Export format selection (Excel, PDF, CSV)
  - Field selection
  - Include images option
  - Custom templates
  - Progress tracking

#### ReportGenerator Component
- **วัตถุประสงค์**: สร้างรายงานอุปกรณ์
- **Props**: filters, template, onGenerate
- **Features**:
  - Pre-defined report templates
  - Custom report builder
  - Chart และ graph generation
  - Scheduled reports
  - Email delivery

### 8. Mobile-Specific Components

#### MobileEquipmentCard Component
- **วัตถุประสงค์**: Card สำหรับมือถือ (compact version)
- **Props**: equipment, onAction
- **Features**:
  - Compact layout
  - Swipe actions
  - Touch-friendly buttons
  - Essential information only

#### MobileImageCapture Component
- **วัตถุประสงค์**: Camera interface สำหรับมือถือ
- **Props**: onCapture, onCancel
- **Features**:
  - Native camera integration
  - Multiple photo capture
  - Basic image editing
  - GPS location tagging (optional)

## โมเดลข้อมูล (Firestore Collections)

### Equipment Collection
```javascript
{
  id: string,                     // Auto-generated ID
  equipmentNumber: string,        // หมายเลขครุภัณฑ์ (unique, required)
  name: string,                   // ชื่ออุปกรณ์ (required)
  category: {                     // ประเภทอุปกรณ์
    id: string,
    name: string,
    icon: string
  },
  brand: string,                  // ยี่ห้อ
  model: string,                  // รุ่น
  description: string,            // รายละเอียด
  specifications: object,         // ข้อมูลจำเพาะทางเทคนิค
  
  // Status และ Location
  status: string,                 // สถานะ: active, maintenance, retired, lost
  location: {                     // สถานที่ตั้ง
    building: string,
    floor: string,
    room: string,
    description: string
  },
  
  // Purchase Information
  purchaseDate: timestamp,        // วันที่ซื้อ
  purchasePrice: number,          // ราคาซื้อ
  vendor: string,                 // ผู้จำหน่าย
  warrantyExpiry: timestamp,      // วันหมดประกัน
  
  // Responsibility
  responsiblePerson: {            // ผู้รับผิดชอบ
    uid: string,
    name: string,
    email: string,
    department: string
  },
  
  // Images
  images: [{                      // รูปภาพ
    id: string,
    url: string,
    thumbnailUrl: string,
    filename: string,
    size: number,
    uploadedAt: timestamp,
    uploadedBy: string
  }],
  
  // QR Code
  qrCode: {                       // QR Code
    url: string,
    generatedAt: timestamp
  },
  
  // Metadata
  tags: [string],                 // แท็กสำหรับการค้นหา
  notes: string,                  // หมายเหตุเพิ่มเติม
  
  // Audit Trail
  createdAt: timestamp,
  createdBy: string,              // UID ของผู้สร้าง
  updatedAt: timestamp,
  updatedBy: string,              // UID ของผู้แก้ไขล่าสุด
  version: number,                // เวอร์ชันของข้อมูล
  
  // Search และ Indexing
  searchKeywords: [string],       // คำสำหรับการค้นหา
  isActive: boolean,              // สำหรับ soft delete
  
  // Analytics
  viewCount: number,              // จำนวนครั้งที่ดู
  lastViewed: timestamp           // ครั้งล่าสุดที่ดู
}
```

### EquipmentCategories Collection
```javascript
{
  id: string,                     // Auto-generated ID
  name: string,                   // ชื่อหมวดหมู่
  nameEn: string,                 // ชื่อภาษาอังกฤษ
  description: string,            // คำอธิบาย
  icon: string,                   // ไอคอน (icon name หรือ URL)
  color: string,                  // สีประจำหมวดหมู่
  
  // Hierarchy
  parentId: string,               // หมวดหมู่แม่ (nullable)
  level: number,                  // ระดับในลำดับชั้น
  path: string,                   // เส้นทางแบบ "parent/child/grandchild"
  
  // Configuration
  requiredFields: [string],       // ฟิลด์ที่จำเป็นสำหรับหมวดหมู่นี้
  customFields: [{               // ฟิลด์เพิ่มเติมสำหรับหมวดหมู่
    name: string,
    type: string,               // text, number, date, select, etc.
    required: boolean,
    options: [string]           // สำหรับ select type
  }],
  
  // Statistics
  equipmentCount: number,         // จำนวนอุปกรณ์ในหมวดหมู่
  
  // Metadata
  isActive: boolean,
  sortOrder: number,
  createdAt: timestamp,
  createdBy: string,
  updatedAt: timestamp,
  updatedBy: string
}
```

### EquipmentHistory Collection
```javascript
{
  id: string,                     // Auto-generated ID
  equipmentId: string,            // Reference to Equipment
  action: string,                 // ประเภทการเปลี่ยนแปลง: created, updated, deleted, status_changed
  
  // Change Details
  changes: [{                     // รายการการเปลี่ยนแปลง
    field: string,
    oldValue: any,
    newValue: any
  }],
  
  // Context
  reason: string,                 // เหตุผลการเปลี่ยนแปลง
  notes: string,                  // หมายเหตุเพิ่มเติม
  
  // User Information
  userId: string,                 // ผู้ทำการเปลี่ยนแปลง
  userName: string,
  userEmail: string,
  
  // Technical Details
  timestamp: timestamp,
  ipAddress: string,              // IP Address
  userAgent: string,              // Browser/Device info
  sessionId: string               // Session ID
}
```

### EquipmentTemplates Collection
```javascript
{
  id: string,                     // Auto-generated ID
  name: string,                   // ชื่อ template
  description: string,            // คำอธิบาย
  categoryId: string,             // หมวดหมู่ที่เกี่ยวข้อง
  
  // Template Data
  defaultValues: object,          // ค่าเริ่มต้นสำหรับฟิลด์ต่างๆ
  requiredFields: [string],       // ฟิลด์ที่จำเป็น
  fieldOrder: [string],           // ลำดับการแสดงฟิลด์
  
  // Usage
  usageCount: number,             // จำนวนครั้งที่ใช้
  
  // Metadata
  isPublic: boolean,              // ใช้ได้กับทุกคนหรือไม่
  createdAt: timestamp,
  createdBy: string,
  updatedAt: timestamp,
  updatedBy: string
}
```

## การจัดการรูปภาพ (Image Management)

### Image Storage Strategy

#### Firebase Storage Structure
```
/equipment-images/
  /{equipmentId}/
    /original/
      /{imageId}.{ext}          // รูปต้นฉบับ
    /thumbnails/
      /{imageId}_thumb.webp     // รูปย่อ
    /medium/
      /{imageId}_medium.webp    // รูปขนาดกลาง
```

#### Image Processing Pipeline
```javascript
// ImageService.js
class ImageService {
  // อัปโหลดรูปภาพพร้อม processing
  static async uploadImage(file, equipmentId) {
    // 1. Validate file type และ size
    this.validateImage(file);
    
    // 2. Generate unique image ID
    const imageId = this.generateImageId();
    
    // 3. Compress และ optimize รูปภาพ
    const optimizedImage = await this.optimizeImage(file);
    
    // 4. Generate thumbnails
    const thumbnail = await this.generateThumbnail(optimizedImage);
    const medium = await this.generateMediumSize(optimizedImage);
    
    // 5. Upload ทุกขนาดไปยัง Firebase Storage
    const urls = await Promise.all([
      this.uploadToStorage(optimizedImage, `equipment-images/${equipmentId}/original/${imageId}`),
      this.uploadToStorage(thumbnail, `equipment-images/${equipmentId}/thumbnails/${imageId}_thumb`),
      this.uploadToStorage(medium, `equipment-images/${equipmentId}/medium/${imageId}_medium`)
    ]);
    
    // 6. Return image metadata
    return {
      id: imageId,
      url: urls[0],
      thumbnailUrl: urls[1],
      mediumUrl: urls[2],
      filename: file.name,
      size: file.size,
      uploadedAt: serverTimestamp()
    };
  }
  
  // ลบรูปภาพทุกขนาด
  static async deleteImage(equipmentId, imageId) {
    const paths = [
      `equipment-images/${equipmentId}/original/${imageId}`,
      `equipment-images/${equipmentId}/thumbnails/${imageId}_thumb.webp`,
      `equipment-images/${equipmentId}/medium/${imageId}_medium.webp`
    ];
    
    await Promise.all(paths.map(path => this.deleteFromStorage(path)));
  }
}
```

#### Mobile Camera Integration
```javascript
// MobileCameraService.js
class MobileCameraService {
  // เปิดกล้องสำหรับถ่ายรูป
  static async captureImage(options = {}) {
    if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: options.facingMode || 'environment', // กล้องหลัง
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      return this.createCameraInterface(stream);
    } else {
      // Fallback สำหรับ browsers ที่ไม่รองรับ
      return this.createFileInput();
    }
  }
  
  // สร้าง interface สำหรับถ่ายรูป
  static createCameraInterface(stream) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      video.srcObject = stream;
      video.play();
      
      // Interface สำหรับถ่ายรูป
      const captureButton = document.createElement('button');
      captureButton.onclick = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        canvas.toBlob(resolve, 'image/jpeg', 0.8);
        stream.getTracks().forEach(track => track.stop());
      };
    });
  }
}
```

## การค้นหาและการกรอง (Search & Filtering)

### Search Implementation

#### Full-Text Search Strategy
```javascript
// SearchService.js
class SearchService {
  // สร้าง search index เมื่อบันทึกอุปกรณ์
  static generateSearchKeywords(equipment) {
    const keywords = new Set();
    
    // เพิ่มคำจากฟิลด์ต่างๆ
    this.addKeywords(keywords, equipment.equipmentNumber);
    this.addKeywords(keywords, equipment.name);
    this.addKeywords(keywords, equipment.brand);
    this.addKeywords(keywords, equipment.model);
    this.addKeywords(keywords, equipment.description);
    
    // เพิ่มคำจาก category
    if (equipment.category) {
      this.addKeywords(keywords, equipment.category.name);
    }
    
    // เพิ่มคำจาก tags
    if (equipment.tags) {
      equipment.tags.forEach(tag => this.addKeywords(keywords, tag));
    }
    
    return Array.from(keywords).filter(keyword => keyword.length >= 2);
  }
  
  // ค้นหาแบบ real-time
  static async searchEquipment(query, filters = {}) {
    const keywords = this.processSearchQuery(query);
    
    let queryRef = collection(db, 'equipment');
    
    // Apply filters
    if (filters.category) {
      queryRef = query(queryRef, where('category.id', '==', filters.category));
    }
    
    if (filters.status) {
      queryRef = query(queryRef, where('status', 'in', filters.status));
    }
    
    if (filters.dateRange) {
      queryRef = query(queryRef, 
        where('purchaseDate', '>=', filters.dateRange.start),
        where('purchaseDate', '<=', filters.dateRange.end)
      );
    }
    
    // Apply text search
    if (keywords.length > 0) {
      queryRef = query(queryRef, 
        where('searchKeywords', 'array-contains-any', keywords)
      );
    }
    
    const snapshot = await getDocs(queryRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}
```

#### Advanced Filtering
```javascript
// FilterService.js
class FilterService {
  // สร้าง compound queries สำหรับ filters ที่ซับซ้อน
  static buildFilterQuery(filters) {
    const constraints = [];
    
    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      constraints.push(where('category.id', 'in', filters.categories));
    }
    
    // Status filter
    if (filters.statuses && filters.statuses.length > 0) {
      constraints.push(where('status', 'in', filters.statuses));
    }
    
    // Date range filter
    if (filters.purchaseDateRange) {
      constraints.push(
        where('purchaseDate', '>=', filters.purchaseDateRange.start),
        where('purchaseDate', '<=', filters.purchaseDateRange.end)
      );
    }
    
    // Price range filter
    if (filters.priceRange) {
      constraints.push(
        where('purchasePrice', '>=', filters.priceRange.min),
        where('purchasePrice', '<=', filters.priceRange.max)
      );
    }
    
    // Location filter
    if (filters.location) {
      constraints.push(where('location.building', '==', filters.location));
    }
    
    // Responsible person filter
    if (filters.responsiblePerson) {
      constraints.push(where('responsiblePerson.uid', '==', filters.responsiblePerson));
    }
    
    return constraints;
  }
  
  // Save filter presets
  static async saveFilterPreset(userId, name, filters) {
    const preset = {
      name,
      filters,
      userId,
      createdAt: serverTimestamp()
    };
    
    await addDoc(collection(db, 'filterPresets'), preset);
  }
}
```

## การจัดการข้อผิดพลาด (Error Handling)

### Error Handling Strategy

#### Equipment Service Error Handling
```javascript
// EquipmentService.js
class EquipmentService {
  static async createEquipment(equipmentData) {
    try {
      // Validate data
      this.validateEquipmentData(equipmentData);
      
      // Check for duplicate equipment number
      await this.checkDuplicateEquipmentNumber(equipmentData.equipmentNumber);
      
      // Process images
      const processedImages = await this.processImages(equipmentData.images);
      
      // Create equipment document
      const equipment = {
        ...equipmentData,
        images: processedImages,
        searchKeywords: SearchService.generateSearchKeywords(equipmentData),
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser.uid,
        version: 1,
        isActive: true
      };
      
      const docRef = await addDoc(collection(db, 'equipment'), equipment);
      
      // Log activity
      await this.logActivity('equipment_created', docRef.id, equipment);
      
      return { id: docRef.id, ...equipment };
      
    } catch (error) {
      console.error('Error creating equipment:', error);
      
      // Classify error
      if (error.code === 'permission-denied') {
        throw new Error('คุณไม่มีสิทธิ์ในการเพิ่มอุปกรณ์');
      } else if (error.message.includes('duplicate')) {
        throw new Error('หมายเลขครุภัณฑ์นี้มีอยู่ในระบบแล้ว');
      } else if (error.message.includes('validation')) {
        throw new Error('ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่');
      } else {
        throw new Error('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
      }
    }
  }
  
  // Validation methods
  static validateEquipmentData(data) {
    const errors = [];
    
    if (!data.equipmentNumber || data.equipmentNumber.trim() === '') {
      errors.push('หมายเลขครุภัณฑ์เป็นข้อมูลที่จำเป็น');
    }
    
    if (!data.name || data.name.trim() === '') {
      errors.push('ชื่ออุปกรณ์เป็นข้อมูลที่จำเป็น');
    }
    
    if (!data.category || !data.category.id) {
      errors.push('ประเภทอุปกรณ์เป็นข้อมูลที่จำเป็น');
    }
    
    if (data.purchasePrice && (isNaN(data.purchasePrice) || data.purchasePrice < 0)) {
      errors.push('ราคาซื้อต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0');
    }
    
    if (errors.length > 0) {
      throw new Error(`validation: ${errors.join(', ')}`);
    }
  }
}
```

## การปรับปรุงประสิทธิภาพ (Performance Optimization)

### Performance Strategy

#### Data Loading Optimization
```javascript
// EquipmentDataService.js
class EquipmentDataService {
  // Pagination สำหรับรายการอุปกรณ์
  static async getEquipmentPage(pageSize = 20, lastDoc = null, filters = {}) {
    let queryRef = collection(db, 'equipment');
    
    // Apply filters
    const constraints = FilterService.buildFilterQuery(filters);
    constraints.forEach(constraint => {
      queryRef = query(queryRef, constraint);
    });
    
    // Add ordering และ pagination
    queryRef = query(queryRef, 
      orderBy('updatedAt', 'desc'),
      limit(pageSize)
    );
    
    if (lastDoc) {
      queryRef = query(queryRef, startAfter(lastDoc));
    }
    
    const snapshot = await getDocs(queryRef);
    
    return {
      equipment: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      lastDoc: snapshot.docs[snapshot.docs.length - 1],
      hasMore: snapshot.docs.length === pageSize
    };
  }
  
  // Lazy loading สำหรับรูปภาพ
  static async loadEquipmentImages(equipmentId, size = 'medium') {
    const equipment = await this.getEquipment(equipmentId);
    
    if (!equipment.images || equipment.images.length === 0) {
      return [];
    }
    
    // Load เฉพาะขนาดที่ต้องการ
    return equipment.images.map(image => ({
      ...image,
      url: size === 'thumbnail' ? image.thumbnailUrl : 
           size === 'medium' ? image.mediumUrl : image.url
    }));
  }
}
```

#### Caching Strategy
```javascript
// CacheService.js
class CacheService {
  static cache = new Map();
  static cacheTimeout = 5 * 60 * 1000; // 5 minutes
  
  // Cache equipment data
  static async getCachedEquipment(equipmentId) {
    const cacheKey = `equipment_${equipmentId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    const equipment = await EquipmentService.getEquipment(equipmentId);
    
    this.cache.set(cacheKey, {
      data: equipment,
      timestamp: Date.now()
    });
    
    return equipment;
  }
  
  // Invalidate cache เมื่อมีการอัปเดต
  static invalidateEquipmentCache(equipmentId) {
    const cacheKey = `equipment_${equipmentId}`;
    this.cache.delete(cacheKey);
  }
}
```

## การทดสอบ (Testing Strategy)

### Testing Approach

#### Unit Testing
```javascript
// __tests__/EquipmentService.test.js
describe('EquipmentService', () => {
  describe('validateEquipmentData', () => {
    test('should pass validation for valid data', () => {
      const validData = {
        equipmentNumber: 'EQ001',
        name: 'Test Equipment',
        category: { id: 'cat1', name: 'Category 1' },
        purchasePrice: 1000
      };
      
      expect(() => EquipmentService.validateEquipmentData(validData)).not.toThrow();
    });
    
    test('should throw error for missing equipment number', () => {
      const invalidData = {
        name: 'Test Equipment',
        category: { id: 'cat1', name: 'Category 1' }
      };
      
      expect(() => EquipmentService.validateEquipmentData(invalidData))
        .toThrow('หมายเลขครุภัณฑ์เป็นข้อมูลที่จำเป็น');
    });
  });
});
```

#### Integration Testing
```javascript
// __tests__/EquipmentIntegration.test.js
describe('Equipment Integration', () => {
  test('should create equipment with images', async () => {
    const equipmentData = {
      equipmentNumber: 'TEST001',
      name: 'Test Equipment',
      category: { id: 'cat1', name: 'Test Category' }
    };
    
    const mockImageFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    const result = await EquipmentService.createEquipmentWithImages(
      equipmentData, 
      [mockImageFile]
    );
    
    expect(result.id).toBeDefined();
    expect(result.images).toHaveLength(1);
    expect(result.images[0].url).toBeDefined();
  });
});
```

## การปรับใช้และการกำหนดค่า (Deployment)

### Deployment Configuration

#### Firebase Security Rules
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Equipment collection
    match /equipment/{equipmentId} {
      // Read: authenticated users with approved status
      allow read: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.status == 'approved';
      
      // Write: admin users only
      allow create, update: if request.auth != null && 
                               get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' &&
                               validateEquipmentData(request.resource.data);
      
      // Delete: admin users only with confirmation
      allow delete: if request.auth != null && 
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Equipment categories
    match /equipmentCategories/{categoryId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Equipment history (audit log)
    match /equipmentHistory/{historyId} {
      allow read: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
  }
}

// Validation functions
function validateEquipmentData(data) {
  return data.keys().hasAll(['equipmentNumber', 'name', 'category']) &&
         data.equipmentNumber is string && data.equipmentNumber.size() > 0 &&
         data.name is string && data.name.size() > 0 &&
         data.category is map && data.category.keys().hasAll(['id', 'name']);
}
```

#### Firebase Storage Rules
```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Equipment images
    match /equipment-images/{equipmentId}/{allPaths=**} {
      // Read: authenticated users
      allow read: if request.auth != null;
      
      // Write: admin users only
      allow write: if request.auth != null && 
                      isAdmin() &&
                      isValidImageFile();
    }
  }
}

function isAdmin() {
  return firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin';
}

function isValidImageFile() {
  return request.resource.contentType.matches('image/.*') &&
         request.resource.size < 5 * 1024 * 1024; // 5MB limit
}
```

## สรุป

ระบบจัดการอุปกรณ์นี้ออกแบบมาให้มีความยืดหยุ่น ใช้งานง่าย และมีประสิทธิภาพสูง โดยเน้นการใช้งานบนมือถือและการอัปโหลดรูปภาพที่สะดวก พร้อมระบบค้นหาและกรองที่ทรงพลัง และการจัดการข้อมูลที่ครบถ้วน

### จุดเด่นของระบบ:
- **Mobile-First Design**: รองรับการใช้งานบนมือถือเป็นหลัก
- **Image Management**: ระบบจัดการรูปภาพที่ครบถ้วน รองรับการถ่ายรูปจากมือถือ
- **Advanced Search**: ระบบค้นหาและกรองที่ทรงพลัง
- **Real-time Updates**: ข้อมูลอัปเดตแบบ real-time
- **Audit Trail**: ระบบติดตามการเปลี่ยนแปลงข้อมูล
- **Performance Optimized**: ปรับปรุงประสิทธิภาพด้วย caching และ lazy loading
- **Security**: ระบบความปลอดภัยที่แข็งแกร่ง
- **Scalable**: สามารถขยายระบบได้ตามความต้องการ