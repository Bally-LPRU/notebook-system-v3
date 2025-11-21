# Equipment Management System Setup

This document describes the setup and configuration of the Equipment Management System that has been implemented as part of Task 1.

## Overview

The Equipment Management System is a comprehensive solution for managing organizational equipment with features including:

- Equipment data management with images
- Category-based organization
- Search and filtering capabilities
- Audit trail and history tracking
- QR code generation
- Export functionality

## Components Implemented

### 1. Data Models and Types

**File:** `src/types/equipmentManagement.js`

- Equipment Management data structures
- Category definitions
- History tracking types
- Form validation rules
- Status constants and labels

### 2. Services

**Equipment Management Service:** `src/services/equipmentManagementService.js`
- CRUD operations for equipment
- Image processing and storage
- Search keyword generation
- Audit logging
- Bulk operations support

**Category Service:** `src/services/equipmentCategoryService.js`
- Category management
- Hierarchical category support
- Custom fields per category

### 3. Firestore Collections

The following collections have been configured:

#### equipmentManagement
- Main equipment data storage
- Includes images, specifications, and metadata
- Full-text search support via keywords array

#### equipmentCategories
- Equipment category definitions
- Hierarchical structure support
- Custom fields configuration

#### equipmentHistory
- Audit trail for all equipment changes
- User activity tracking
- Change details logging

#### equipmentTemplates
- Reusable equipment templates
- Category-specific templates
- Default values and field configurations

### 4. Firebase Storage Structure

```
/equipment-images/
  /{equipmentNumber}/
    /original/
      /{imageId}.{ext}          // Original images
    /thumbnails/
      /{imageId}_thumb.webp     // Thumbnail images
    /medium/
      /{imageId}_medium.webp    // Medium-sized images
```

### 5. Security Rules

**Firestore Rules:** Updated `firestore.rules`
- Admin-only write access for equipment management
- Approved user read access
- Proper validation functions
- History logging permissions

**Storage Rules:** `storage.rules`
- Image upload restrictions
- File type and size validation
- Admin-only write permissions

### 6. Utilities and Helpers

**File:** `src/utils/equipmentManagementUtils.js`

Utility functions for:
- Equipment number formatting and validation
- Currency and location formatting
- Age calculation and warranty checking
- Search suggestions
- CSV export functionality
- QR code data generation

### 7. Default Data

**File:** `src/data/defaultEquipmentCategories.js`
- Pre-defined equipment categories
- Thai and English category names
- Custom fields configuration
- Hierarchical category structure

## Configuration Details

### Equipment Status Types
- `active` - ใช้งานได้
- `maintenance` - ซ่อมบำรุง  
- `retired` - เสื่อมสภาพ
- `lost` - สูญหาย

### Image Processing
- Supported formats: JPEG, PNG, WebP
- Maximum file size: 5MB per image
- Automatic thumbnail generation
- Multiple sizes (original, medium, thumbnail)
- WebP compression for optimized storage

### Search Functionality
- Full-text search using keyword arrays
- Multi-field search (name, brand, model, description)
- Thai language support
- Minimum 2-character search terms
- Real-time search suggestions

### Validation Rules
- Equipment numbers: Alphanumeric with hyphens, 1-50 characters
- Required fields: Equipment number, name, category, status
- Image validation: Type, size, and count limits
- Location structure validation

## Setup Instructions

### 1. Database Initialization

Run the setup script to create default categories:

```bash
node scripts/setup-equipment-management.js
```

Note: This requires admin authentication in Firebase.

### 2. Security Rules Deployment

Deploy the updated Firestore and Storage rules:

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

### 3. Testing

Run the test suites to verify implementation:

```bash
npm test -- --testPathPattern=equipmentManagement --watchAll=false
```

## Usage Examples

### Creating Equipment

```javascript
import EquipmentManagementService from './services/equipmentManagementService';

const equipmentData = {
  equipmentNumber: 'EQ001',
  name: 'Dell Laptop',
  category: { id: 'cat1', name: 'Computer' },
  brand: 'Dell',
  model: 'Inspiron 15',
  status: 'active',
  location: {
    building: 'A',
    floor: '2',
    room: '201'
  }
};

const imageFiles = [/* File objects */];
const createdBy = 'user-uid';

const equipment = await EquipmentManagementService.createEquipment(
  equipmentData, 
  imageFiles, 
  createdBy
);
```

### Searching Equipment

```javascript
const filters = {
  search: 'laptop',
  categories: ['cat1'],
  statuses: ['active'],
  sortBy: 'name',
  sortOrder: 'asc'
};

const result = await EquipmentManagementService.getEquipmentList(filters);
```

### Exporting Data

```javascript
import { exportToCSV, downloadFile } from './utils/equipmentManagementUtils';

const csvData = exportToCSV(equipmentList);
downloadFile(csvData, 'equipment-export.csv', 'text/csv');
```

## API Reference

### EquipmentManagementService Methods

- `createEquipment(data, images, userId)` - Create new equipment
- `updateEquipment(id, data, images, removeImages, userId)` - Update equipment
- `deleteEquipment(id, userId)` - Delete equipment
- `getEquipmentById(id)` - Get single equipment
- `getEquipmentList(filters)` - Get filtered equipment list
- `isEquipmentNumberUnique(number, excludeId)` - Check uniqueness

### EquipmentCategoryService Methods

- `createCategory(data, userId)` - Create new category
- `getCategories()` - Get all categories
- `getCategoryById(id)` - Get single category

## Testing Coverage

The implementation includes comprehensive tests for:

- Utility functions (22 tests)
- Service methods (12 tests)
- Data validation
- Error handling
- Edge cases

All tests are passing and provide good coverage of the core functionality.

## Next Steps

This completes Task 1 of the Equipment Management System implementation. The foundation is now in place for:

- Image management system (Task 2)
- Category management UI (Task 3)
- Equipment forms and validation (Task 4)
- Search and filtering interfaces (Task 5)

The data models, services, and security rules are ready to support the full equipment management workflow.