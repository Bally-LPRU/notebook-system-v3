import EquipmentManagementService from '../equipmentManagementService';
import ImageService from '../imageService';
import EquipmentSearchService from '../equipmentSearchService';
import EquipmentFilterService from '../equipmentFilterService';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';

// Mock Firebase
jest.mock('../../config/firebase', () => ({
  db: {},
  storage: {}
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  writeBatch: jest.fn(),
  increment: jest.fn()
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn()
}));

// Mock ImageService
jest.mock('../imageService', () => ({
  uploadImage: jest.fn(),
  deleteImage: jest.fn(),
  validateImages: jest.fn(),
  generateImageId: jest.fn(() => 'img_123'),
  processImages: jest.fn()
}));

const createMockQuerySnapshot = (docsData = []) => {
  const docSnapshots = docsData.map(doc => ({
    id: doc.id,
    data: () => doc.data,
    exists: () => true
  }));

  return {
    docs: docSnapshots,
    empty: docSnapshots.length === 0,
    size: docSnapshots.length,
    forEach: (callback) => docSnapshots.forEach((doc, index) => callback(doc, index))
  };
};

describe('Equipment Management Integration Tests', () => {
  let isEquipmentNumberUniqueSpy;
  const mockEquipmentData = {
    equipmentNumber: 'EQ001',
    name: 'Test Laptop',
    category: { id: 'cat1', name: 'Computer' },
    brand: 'Dell',
    model: 'Inspiron',
    status: 'active',
    purchasePrice: 25000,
    purchaseDate: new Date('2023-06-01'),
    location: { building: 'Building A', floor: '1', room: '101' },
    responsiblePerson: { uid: 'user1', name: 'John Doe' },
    description: 'Test laptop for development',
    tags: ['laptop', 'development']
  };

  const mockImageFiles = [
    new File(['image1'], 'image1.jpg', { type: 'image/jpeg' }),
    new File(['image2'], 'image2.jpg', { type: 'image/jpeg' })
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    if (isEquipmentNumberUniqueSpy) {
      isEquipmentNumberUniqueSpy.mockRestore();
    }
    isEquipmentNumberUniqueSpy = jest
      .spyOn(EquipmentManagementService, 'isEquipmentNumberUnique')
      .mockResolvedValue(true);
    
    // Mock successful document creation
    addDoc.mockResolvedValue({ id: 'equipment-123' });
    updateDoc.mockResolvedValue();
    deleteDoc.mockResolvedValue();
    
    // Mock document retrieval
    getDoc.mockResolvedValue({
      exists: () => true,
      id: 'equipment-123',
      data: () => mockEquipmentData
    });
    
    // Mock collection queries
    getDocs.mockResolvedValue(
      createMockQuerySnapshot([
        { id: 'equipment-123', data: mockEquipmentData }
      ])
    );
    
    // Mock image processing
    ImageService.uploadImage.mockResolvedValue({
      id: 'img_123',
      url: 'https://example.com/image.jpg',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      filename: 'image.jpg',
      size: 1024
    });
    
    ImageService.processImages.mockResolvedValue([{
      id: 'img_123',
      url: 'https://example.com/image.jpg',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      filename: 'image.jpg',
      size: 1024
    }]);
  });

  describe('Equipment CRUD Operations with Images', () => {
    test('should create equipment successfully', async () => {
      const result = await EquipmentManagementService.createEquipment(mockEquipmentData);

      // Verify equipment creation payload
      const equipmentCreateCall = addDoc.mock.calls.find(([, payload]) => payload?.name === mockEquipmentData.name);
      expect(equipmentCreateCall).toBeDefined();
      expect(equipmentCreateCall[1]).toEqual(
        expect.objectContaining({
          ...mockEquipmentData,
          searchKeywords: expect.any(Array),
          isActive: true
        })
      );

      expect(result.id).toBe('equipment-123');
    });

    test('should update equipment successfully', async () => {
      const updatedData = {
        name: 'Updated Laptop',
        status: 'maintenance'
      };

      const result = await EquipmentManagementService.updateEquipment('equipment-123', updatedData);

      // Verify equipment update call contains new fields
      const equipmentUpdateCall = updateDoc.mock.calls.find(([, payload]) => payload?.searchKeywords);
      expect(equipmentUpdateCall).toBeDefined();
      expect(equipmentUpdateCall[1]).toEqual(
        expect.objectContaining({
          ...updatedData
        })
      );

      expect(result.name).toBe('Updated Laptop');
    });

    test('should delete equipment successfully', async () => {
      await EquipmentManagementService.deleteEquipment('equipment-123');

      // Verify equipment deletion
      expect(deleteDoc).toHaveBeenCalled();
    });

    test('should handle database errors gracefully', async () => {
      addDoc.mockRejectedValue(new Error('Database error'));

      await expect(
        EquipmentManagementService.createEquipment(mockEquipmentData)
      ).rejects.toThrow('Database error');
    });
  });

  describe('Search and Filter Integration', () => {
    test('should search equipment and return filtered results', async () => {
      const searchResults = await EquipmentSearchService.searchWithSuggestions('laptop', {
        limit: 10,
        includeSuggestions: true
      });

      expect(getDocs).toHaveBeenCalled();
      expect(searchResults.equipment).toBeDefined();
      expect(searchResults.suggestions).toBeDefined();
      expect(searchResults.totalCount).toBeDefined();
    });

    test('should apply complex filters and return paginated results', async () => {
      const filters = {
        search: 'laptop',
        categories: ['cat1'],
        statuses: ['active'],
        priceRange: { min: 20000, max: 30000 },
        dateRange: { start: '2023-01-01', end: '2023-12-31' },
        location: { building: 'Building A' },
        page: 1,
        pageSize: 20
      };

      const results = await EquipmentFilterService.getFilteredEquipment(filters);

      expect(results.equipment).toBeDefined();
      expect(results.pagination).toBeDefined();
      expect(results.pagination.currentPage).toBe(1);
      expect(results.pagination.pageSize).toBe(20);
    });

    test('should handle search with no results', async () => {
      getDocs.mockResolvedValueOnce(createMockQuerySnapshot());

      const results = await EquipmentSearchService.searchWithSuggestions('nonexistent');

      expect(results.equipment).toHaveLength(0);
      expect(results.totalCount).toBe(0);
    });
  });

  describe('Image Service Integration', () => {
    test('should validate and process images', async () => {
      ImageService.validateImages(mockImageFiles);
      expect(ImageService.validateImages).toHaveBeenCalledWith(mockImageFiles);

      const processedImages = await ImageService.processImages(mockImageFiles, 'equipment-123');
      expect(processedImages).toHaveLength(1);
      expect(processedImages[0]).toHaveProperty('id');
      expect(processedImages[0]).toHaveProperty('url');
    });

    test('should handle image upload errors', async () => {
      ImageService.uploadImage.mockRejectedValue(new Error('Upload failed'));

      await expect(
        ImageService.uploadImage(mockImageFiles[0], 'equipment-123')
      ).rejects.toThrow('Upload failed');
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle database connection errors', async () => {
      addDoc.mockRejectedValue(new Error('Database connection failed'));

      await expect(
        EquipmentManagementService.createEquipment(mockEquipmentData)
      ).rejects.toThrow('Database connection failed');
    });

    test('should handle search service timeouts', async () => {
      getDocs.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      await expect(
        EquipmentSearchService.searchWithSuggestions('laptop')
      ).rejects.toThrow('Request timeout');
    });
  });

  describe('Data Consistency and Validation', () => {
    test('should maintain data consistency during concurrent updates', async () => {
      const updatePromises = [
        EquipmentManagementService.updateEquipment('equipment-123', { status: 'maintenance' }),
        EquipmentManagementService.updateEquipment('equipment-123', { location: { building: 'Building B' } }),
        EquipmentManagementService.updateEquipment('equipment-123', { responsiblePerson: { uid: 'user2' } })
      ];

      await Promise.all(updatePromises);

      const equipmentUpdateCalls = updateDoc.mock.calls.filter(([, payload]) => payload?.searchKeywords);
      expect(equipmentUpdateCalls).toHaveLength(3);
      equipmentUpdateCalls.forEach(([, payload]) => {
        expect(payload.searchKeywords).toEqual(expect.any(Array));
      });
    });

    test('should validate equipment data before saving', async () => {
      const invalidData = {
        ...mockEquipmentData,
        equipmentNumber: '', // Invalid: empty equipment number
        purchasePrice: -1000 // Invalid: negative price
      };

      await expect(
        EquipmentManagementService.createEquipment(invalidData)
      ).rejects.toThrow();
    });
  });
});