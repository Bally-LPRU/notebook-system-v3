import { jest } from '@jest/globals';
import EquipmentService from '../equipmentService';
import { EQUIPMENT_STATUS } from '../../types/equipment';

// Mock Firebase
jest.mock('../../config/firebase', () => ({
  db: {},
  storage: {}
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: Date.now() / 1000 }))
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn()
}));

describe('EquipmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEquipmentList', () => {
    it('should get equipment list successfully', async () => {
      const mockEquipment = [
        {
          id: 'eq1',
          name: 'Laptop Dell',
          category: 'laptop',
          status: EQUIPMENT_STATUS.AVAILABLE,
          brand: 'Dell',
          model: 'Inspiron 15',
          serialNumber: 'DL001'
        },
        {
          id: 'eq2',
          name: 'iPad Pro',
          category: 'tablet',
          status: EQUIPMENT_STATUS.BORROWED,
          brand: 'Apple',
          model: 'iPad Pro 12.9',
          serialNumber: 'AP001'
        }
      ];

      const mockSnapshot = {
        docs: mockEquipment.map(eq => ({
          id: eq.id,
          data: () => ({ ...eq, id: undefined }),
          exists: () => true
        })),
        empty: false
      };

      const { collection, getDocs, query, orderBy } = require('firebase/firestore');
      collection.mockReturnValue('equipment');
      query.mockReturnValue('query');
      orderBy.mockReturnValue('orderBy');
      getDocs.mockResolvedValue(mockSnapshot);

      const result = await EquipmentService.getEquipmentList();

      expect(result.equipment).toHaveLength(2);
      expect(result.equipment[0]).toEqual(mockEquipment[0]);
      expect(result.pagination).toBeDefined();
    });

    it('should handle empty equipment list', async () => {
      const mockSnapshot = {
        docs: [],
        empty: true
      };

      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue(mockSnapshot);

      const result = await EquipmentService.getEquipmentList();

      expect(result.equipment).toHaveLength(0);
      expect(result.pagination.totalItems).toBe(0);
    });

    it('should apply filters correctly', async () => {
      const filters = {
        category: 'laptop',
        status: EQUIPMENT_STATUS.AVAILABLE,
        search: 'Dell'
      };

      const { where } = require('firebase/firestore');
      where.mockReturnValue('where');

      await EquipmentService.getEquipmentList(filters);

      expect(where).toHaveBeenCalledWith('category', '==', 'laptop');
      expect(where).toHaveBeenCalledWith('status', '==', EQUIPMENT_STATUS.AVAILABLE);
    });

    it('should handle service errors', async () => {
      const { getDocs } = require('firebase/firestore');
      getDocs.mockRejectedValue(new Error('Database error'));

      await expect(EquipmentService.getEquipmentList())
        .rejects.toThrow('Database error');
    });
  });

  describe('getEquipmentById', () => {
    it('should get equipment by ID successfully', async () => {
      const mockEquipment = {
        id: 'eq1',
        name: 'Laptop Dell',
        category: 'laptop',
        status: EQUIPMENT_STATUS.AVAILABLE
      };

      const mockDoc = {
        exists: () => true,
        data: () => ({ ...mockEquipment, id: undefined }),
        id: 'eq1'
      };

      const { doc, getDoc } = require('firebase/firestore');
      doc.mockReturnValue({ id: 'eq1' });
      getDoc.mockResolvedValue(mockDoc);

      const result = await EquipmentService.getEquipmentById('eq1');

      expect(result).toEqual(mockEquipment);
    });

    it('should return null for non-existent equipment', async () => {
      const mockDoc = {
        exists: () => false
      };

      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue(mockDoc);

      const result = await EquipmentService.getEquipmentById('non-existent');

      expect(result).toBeNull();
    });

    it('should handle service errors', async () => {
      const { getDoc } = require('firebase/firestore');
      getDoc.mockRejectedValue(new Error('Database error'));

      await expect(EquipmentService.getEquipmentById('eq1'))
        .rejects.toThrow('Database error');
    });
  });

  describe('createEquipment', () => {
    it('should create equipment successfully', async () => {
      const equipmentData = {
        name: 'New Laptop',
        category: 'laptop',
        brand: 'HP',
        model: 'EliteBook',
        serialNumber: 'HP001',
        status: EQUIPMENT_STATUS.AVAILABLE
      };

      const mockDocRef = { id: 'new-eq-id' };

      const { collection, addDoc, serverTimestamp } = require('firebase/firestore');
      collection.mockReturnValue('equipment');
      addDoc.mockResolvedValue(mockDocRef);
      serverTimestamp.mockReturnValue({ seconds: Date.now() / 1000 });

      const result = await EquipmentService.createEquipment(equipmentData, 'user-id');

      expect(addDoc).toHaveBeenCalledWith('equipment', {
        ...equipmentData,
        createdAt: expect.any(Object),
        updatedAt: expect.any(Object),
        createdBy: 'user-id'
      });
      expect(result).toBe('new-eq-id');
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        name: 'Laptop'
        // Missing required fields
      };

      await expect(EquipmentService.createEquipment(incompleteData, 'user-id'))
        .rejects.toThrow();
    });

    it('should handle creation errors', async () => {
      const equipmentData = {
        name: 'Laptop',
        category: 'laptop',
        serialNumber: 'LP001'
      };

      const { addDoc } = require('firebase/firestore');
      addDoc.mockRejectedValue(new Error('Creation failed'));

      await expect(EquipmentService.createEquipment(equipmentData, 'user-id'))
        .rejects.toThrow('Creation failed');
    });
  });

  describe('updateEquipment', () => {
    it('should update equipment successfully', async () => {
      const updateData = {
        name: 'Updated Laptop',
        status: EQUIPMENT_STATUS.MAINTENANCE
      };

      const { doc, updateDoc, serverTimestamp } = require('firebase/firestore');
      doc.mockReturnValue({ id: 'eq1' });
      updateDoc.mockResolvedValue();
      serverTimestamp.mockReturnValue({ seconds: Date.now() / 1000 });

      await EquipmentService.updateEquipment('eq1', updateData);

      expect(updateDoc).toHaveBeenCalledWith(
        { id: 'eq1' },
        {
          ...updateData,
          updatedAt: expect.any(Object)
        }
      );
    });

    it('should handle update errors', async () => {
      const { updateDoc } = require('firebase/firestore');
      updateDoc.mockRejectedValue(new Error('Update failed'));

      await expect(EquipmentService.updateEquipment('eq1', {}))
        .rejects.toThrow('Update failed');
    });
  });

  describe('deleteEquipment', () => {
    it('should delete equipment successfully', async () => {
      const { doc, deleteDoc } = require('firebase/firestore');
      doc.mockReturnValue({ id: 'eq1' });
      deleteDoc.mockResolvedValue();

      await EquipmentService.deleteEquipment('eq1');

      expect(deleteDoc).toHaveBeenCalledWith({ id: 'eq1' });
    });

    it('should handle deletion errors', async () => {
      const { deleteDoc } = require('firebase/firestore');
      deleteDoc.mockRejectedValue(new Error('Deletion failed'));

      await expect(EquipmentService.deleteEquipment('eq1'))
        .rejects.toThrow('Deletion failed');
    });
  });

  describe('searchEquipment', () => {
    it('should search equipment by name', async () => {
      const mockResults = [
        {
          id: 'eq1',
          name: 'Dell Laptop',
          category: 'laptop'
        }
      ];

      const mockSnapshot = {
        docs: mockResults.map(eq => ({
          id: eq.id,
          data: () => ({ ...eq, id: undefined })
        }))
      };

      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue(mockSnapshot);

      const results = await EquipmentService.searchEquipment('Dell', 10);

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Dell Laptop');
    });

    it('should handle empty search results', async () => {
      const mockSnapshot = {
        docs: []
      };

      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue(mockSnapshot);

      const results = await EquipmentService.searchEquipment('NonExistent', 10);

      expect(results).toHaveLength(0);
    });

    it('should handle search errors', async () => {
      const { getDocs } = require('firebase/firestore');
      getDocs.mockRejectedValue(new Error('Search failed'));

      await expect(EquipmentService.searchEquipment('Dell', 10))
        .rejects.toThrow('Search failed');
    });
  });

  describe('getEquipmentStats', () => {
    it('should get equipment statistics successfully', async () => {
      const mockEquipment = [
        { status: EQUIPMENT_STATUS.AVAILABLE, category: 'laptop' },
        { status: EQUIPMENT_STATUS.BORROWED, category: 'laptop' },
        { status: EQUIPMENT_STATUS.AVAILABLE, category: 'tablet' },
        { status: EQUIPMENT_STATUS.MAINTENANCE, category: 'laptop' }
      ];

      const mockSnapshot = {
        docs: mockEquipment.map((eq, index) => ({
          id: `eq${index}`,
          data: () => eq
        }))
      };

      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue(mockSnapshot);

      const stats = await EquipmentService.getEquipmentStats();

      expect(stats.total).toBe(4);
      expect(stats.available).toBe(2);
      expect(stats.borrowed).toBe(1);
      expect(stats.maintenance).toBe(1);
      expect(stats.byCategory.laptop).toBe(3);
      expect(stats.byCategory.tablet).toBe(1);
    });

    it('should handle empty equipment collection', async () => {
      const mockSnapshot = {
        docs: []
      };

      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue(mockSnapshot);

      const stats = await EquipmentService.getEquipmentStats();

      expect(stats.total).toBe(0);
      expect(stats.available).toBe(0);
      expect(stats.borrowed).toBe(0);
    });

    it('should handle stats calculation errors', async () => {
      const { getDocs } = require('firebase/firestore');
      getDocs.mockRejectedValue(new Error('Stats calculation failed'));

      await expect(EquipmentService.getEquipmentStats())
        .rejects.toThrow('Stats calculation failed');
    });
  });

  describe('uploadEquipmentImage', () => {
    it('should upload image successfully', async () => {
      const mockFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });
      const mockDownloadURL = 'https://example.com/image.jpg';

      const { ref, uploadBytes, getDownloadURL } = require('firebase/storage');
      ref.mockReturnValue('storage-ref');
      uploadBytes.mockResolvedValue({ ref: 'storage-ref' });
      getDownloadURL.mockResolvedValue(mockDownloadURL);

      const result = await EquipmentService.uploadEquipmentImage(mockFile, 'eq1');

      expect(uploadBytes).toHaveBeenCalledWith('storage-ref', mockFile);
      expect(getDownloadURL).toHaveBeenCalledWith('storage-ref');
      expect(result).toBe(mockDownloadURL);
    });

    it('should handle upload errors', async () => {
      const mockFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });

      const { uploadBytes } = require('firebase/storage');
      uploadBytes.mockRejectedValue(new Error('Upload failed'));

      await expect(EquipmentService.uploadEquipmentImage(mockFile, 'eq1'))
        .rejects.toThrow('Upload failed');
    });
  });
});