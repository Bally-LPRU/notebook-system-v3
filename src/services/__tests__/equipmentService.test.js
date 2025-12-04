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

const firestore = jest.requireMock('firebase/firestore');
const storage = jest.requireMock('firebase/storage');

const createDocumentSnapshot = (data = {}, overrides = {}) => {
  const id = overrides.id || data.id || 'doc-id';
  return {
    id,
    data: () => ({ ...data }),
    exists: () => overrides.exists ?? true,
    ref: overrides.ref || { id }
  };
};

const createQuerySnapshot = (docs = []) => ({
  docs,
  forEach: (callback) => docs.forEach(callback),
  size: docs.length,
  empty: docs.length === 0
});

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

      const docs = mockEquipment.map(eq => {
        const { id, ...data } = eq;
        return createDocumentSnapshot(data, { id });
      });

      firestore.collection.mockReturnValue('equipment');
      firestore.query.mockReturnValue('query');
      firestore.orderBy.mockReturnValue('orderBy');
      firestore.where.mockReturnValue('where');
      firestore.limit.mockReturnValue('limit');
      firestore.getDocs.mockResolvedValue(createQuerySnapshot(docs));

      const result = await EquipmentService.getEquipmentList();

      expect(result.equipment).toHaveLength(2);
      expect(result.equipment[0]).toEqual(mockEquipment[0]);
      expect(result.pagination).toBeDefined();
    });

    it('should handle empty equipment list', async () => {
      firestore.collection.mockReturnValue('equipment');
      firestore.query.mockReturnValue('query');
      firestore.where.mockReturnValue('where');
      firestore.limit.mockReturnValue('limit');
      firestore.getDocs.mockResolvedValue(createQuerySnapshot());

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
      const docs = [
        createDocumentSnapshot({
          name: 'Dell XPS',
          category: 'laptop',
          status: EQUIPMENT_STATUS.AVAILABLE,
          brand: 'Dell',
          model: 'XPS 13',
          serialNumber: 'DL001'
        }, { id: 'eq1' }),
        createDocumentSnapshot({
          name: 'iPad',
          category: 'tablet',
          status: EQUIPMENT_STATUS.BORROWED,
          brand: 'Apple',
          model: 'Pro',
          serialNumber: 'AP001'
        }, { id: 'eq2' })
      ];

      firestore.collection.mockReturnValue('equipment');
      firestore.query.mockReturnValue('query');
      firestore.where.mockReturnValue('where');
      firestore.limit.mockReturnValue('limit');
      firestore.getDocs.mockResolvedValue(createQuerySnapshot(docs));

      const result = await EquipmentService.getEquipmentList(filters);

      expect(result.equipment).toHaveLength(1);
      expect(result.equipment[0].id).toBe('eq1');
    });

    it('should handle service errors', async () => {
      firestore.collection.mockReturnValue('equipment');
      firestore.query.mockReturnValue('query');
      firestore.where.mockReturnValue('where');
      firestore.limit.mockReturnValue('limit');
      firestore.getDocs.mockRejectedValue(new Error('Database error'));

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

      firestore.doc.mockReturnValue({ id: 'eq1' });
      firestore.getDoc.mockResolvedValue(
        createDocumentSnapshot({
          name: mockEquipment.name,
          category: mockEquipment.category,
          status: mockEquipment.status
        }, { id: 'eq1' })
      );

      const result = await EquipmentService.getEquipmentById('eq1');

      expect(result).toEqual(mockEquipment);
    });

    it('should return null for non-existent equipment', async () => {
      firestore.getDoc.mockResolvedValue(createDocumentSnapshot({}, { exists: false }));

      const result = await EquipmentService.getEquipmentById('non-existent');

      expect(result).toBeNull();
    });

    it('should handle service errors', async () => {
      firestore.doc.mockReturnValue({ id: 'eq1' });
      firestore.getDoc.mockRejectedValue(new Error('Database error'));

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
        status: EQUIPMENT_STATUS.AVAILABLE,
        location: 'Lab 1'
      };

      const mockDocRef = { id: 'new-eq-id' };
      const serialSpy = jest.spyOn(EquipmentService, 'isSerialNumberUnique').mockResolvedValue(true);
      firestore.collection.mockReturnValue('equipment');
      firestore.addDoc.mockResolvedValue(mockDocRef);
      firestore.serverTimestamp.mockReturnValue('timestamp');

      const result = await EquipmentService.createEquipment(equipmentData, null, 'user-id');

      expect(firestore.addDoc).toHaveBeenCalledWith('equipment', expect.objectContaining({
        name: 'New Laptop',
        createdBy: 'user-id'
      }));
      expect(result).toMatchObject({
        id: 'new-eq-id',
        name: 'New Laptop',
        createdBy: 'user-id'
      });

      serialSpy.mockRestore();
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        name: 'Laptop'
        // Missing required fields
      };

      await expect(EquipmentService.createEquipment(incompleteData, null, 'user-id'))
        .rejects.toThrow();
    });

    it('should handle creation errors', async () => {
      const equipmentData = {
        name: 'Laptop',
        category: 'laptop',
        brand: 'Dell',
        model: 'XPS',
        serialNumber: 'LP001',
        status: EQUIPMENT_STATUS.AVAILABLE,
        location: 'Lab 2'
      };
      const serialSpy = jest.spyOn(EquipmentService, 'isSerialNumberUnique').mockResolvedValue(true);
      firestore.collection.mockReturnValue('equipment');
      firestore.addDoc.mockRejectedValue(new Error('Creation failed'));

      await expect(EquipmentService.createEquipment(equipmentData, null, 'user-id'))
        .rejects.toThrow('Creation failed');

      serialSpy.mockRestore();
    });
  });

  describe('updateEquipment', () => {
    const baseCurrentEquipment = {
      id: 'eq1',
      name: 'Laptop',
      category: 'laptop',
      brand: 'Dell',
      model: 'XPS',
      serialNumber: 'DL001',
      description: '',
      imageURL: null,
      status: EQUIPMENT_STATUS.AVAILABLE,
      location: 'Lab 1'
    };

    it('should update equipment successfully', async () => {
      const updateData = {
        name: 'Updated Laptop',
        category: 'laptop',
        brand: 'Dell',
        model: 'XPS 15',
        serialNumber: 'DL001',
        description: 'Updated',
        status: EQUIPMENT_STATUS.MAINTENANCE,
        location: 'Lab 2'
      };

      const equipmentSpy = jest.spyOn(EquipmentService, 'getEquipmentById').mockResolvedValue(baseCurrentEquipment);
      const serialSpy = jest.spyOn(EquipmentService, 'isSerialNumberUnique').mockResolvedValue(true);

      firestore.doc.mockReturnValue({ id: 'eq1' });
      firestore.updateDoc.mockResolvedValue();
      firestore.serverTimestamp.mockReturnValue('timestamp');

      const result = await EquipmentService.updateEquipment('eq1', updateData, null, 'admin-id');

      expect(firestore.updateDoc).toHaveBeenCalledWith(
        { id: 'eq1' },
        expect.objectContaining({
          name: 'Updated Laptop',
          updatedBy: 'admin-id'
        })
      );
      expect(result).toMatchObject({ id: 'eq1', name: 'Updated Laptop' });

      equipmentSpy.mockRestore();
      serialSpy.mockRestore();
    });

    it('should handle update errors', async () => {
      const equipmentSpy = jest.spyOn(EquipmentService, 'getEquipmentById').mockResolvedValue(baseCurrentEquipment);
      firestore.doc.mockReturnValue({ id: 'eq1' });
      firestore.updateDoc.mockRejectedValue(new Error('Update failed'));

      await expect(EquipmentService.updateEquipment('eq1', {
        name: 'Updated',
        category: 'laptop',
        brand: 'Dell',
        model: 'XPS',
        serialNumber: 'DL001',
        description: '',
        status: EQUIPMENT_STATUS.AVAILABLE,
        location: 'Lab 1'
      }, null, 'admin-id')).rejects.toThrow('Update failed');

      equipmentSpy.mockRestore();
    });
  });

  describe('deleteEquipment', () => {
    it('should delete equipment successfully', async () => {
      const equipmentSpy = jest.spyOn(EquipmentService, 'getEquipmentById').mockResolvedValue({
        id: 'eq1',
        status: EQUIPMENT_STATUS.AVAILABLE,
        imageURL: null
      });
      const deleteImageSpy = jest.spyOn(EquipmentService, 'deleteEquipmentImage').mockResolvedValue(true);

      firestore.doc.mockReturnValue({ id: 'eq1' });
      firestore.deleteDoc.mockResolvedValue();

      const result = await EquipmentService.deleteEquipment('eq1');

      expect(result).toBe(true);
      expect(firestore.deleteDoc).toHaveBeenCalledWith({ id: 'eq1' });

      equipmentSpy.mockRestore();
      deleteImageSpy.mockRestore();
    });

    it('should handle deletion errors', async () => {
      jest.spyOn(EquipmentService, 'getEquipmentById').mockResolvedValue({
        id: 'eq1',
        status: EQUIPMENT_STATUS.AVAILABLE,
        imageURL: null
      });
      firestore.doc.mockReturnValue({ id: 'eq1' });
      firestore.deleteDoc.mockRejectedValue(new Error('Deletion failed'));

      await expect(EquipmentService.deleteEquipment('eq1')).rejects.toThrow('Deletion failed');
    });
  });

  describe('searchEquipment', () => {
    it('should search equipment by name', async () => {
      const docs = [
        createDocumentSnapshot({ name: 'Dell Laptop', category: 'laptop' }, { id: 'eq1' })
      ];

      firestore.collection.mockReturnValue('equipment');
      firestore.query.mockReturnValue('query');
      firestore.where.mockReturnValue('where');
      firestore.orderBy.mockReturnValue('orderBy');
      firestore.limit.mockReturnValue('limit');
      firestore.getDocs.mockResolvedValue(createQuerySnapshot(docs));

      const results = await EquipmentService.searchEquipment('Dell', 10);

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('eq1');
    });

    it('should handle empty search results', async () => {
      firestore.collection.mockReturnValue('equipment');
      firestore.query.mockReturnValue('query');
      firestore.where.mockReturnValue('where');
      firestore.orderBy.mockReturnValue('orderBy');
      firestore.limit.mockReturnValue('limit');
      firestore.getDocs.mockResolvedValue(createQuerySnapshot());

      const results = await EquipmentService.searchEquipment('NonExistent', 10);

      expect(results).toHaveLength(0);
    });

    it('should handle search errors', async () => {
      firestore.collection.mockReturnValue('equipment');
      firestore.query.mockReturnValue('query');
      firestore.where.mockReturnValue('where');
      firestore.orderBy.mockReturnValue('orderBy');
      firestore.limit.mockReturnValue('limit');
      firestore.getDocs.mockRejectedValue(new Error('Search failed'));

      await expect(EquipmentService.searchEquipment('Dell', 10)).rejects.toThrow('Search failed');
    });
  });

  describe('getEquipmentStats', () => {
    it('should get equipment statistics successfully', async () => {
      const docs = [
        createDocumentSnapshot({ status: EQUIPMENT_STATUS.AVAILABLE, category: 'laptop' }, { id: 'eq1' }),
        createDocumentSnapshot({ status: EQUIPMENT_STATUS.BORROWED, category: 'laptop' }, { id: 'eq2' }),
        createDocumentSnapshot({ status: EQUIPMENT_STATUS.AVAILABLE, category: 'tablet' }, { id: 'eq3' }),
        createDocumentSnapshot({ status: EQUIPMENT_STATUS.MAINTENANCE, category: 'laptop' }, { id: 'eq4' })
      ];

      firestore.collection.mockReturnValue('equipment');
      firestore.query.mockReturnValue('query');
      firestore.getDocs.mockResolvedValue(createQuerySnapshot(docs));

      const stats = await EquipmentService.getEquipmentStats();

      expect(stats.total).toBe(4);
      expect(stats.available).toBe(2);
      expect(stats.borrowed).toBe(1);
      expect(stats.maintenance).toBe(1);
      expect(stats.byCategory.laptop).toBe(3);
      expect(stats.byCategory.tablet).toBe(1);
    });

    it('should handle empty equipment collection', async () => {
      firestore.collection.mockReturnValue('equipment');
      firestore.query.mockReturnValue('query');
      firestore.getDocs.mockResolvedValue(createQuerySnapshot());

      const stats = await EquipmentService.getEquipmentStats();

      expect(stats.total).toBe(0);
      expect(stats.available).toBe(0);
      expect(stats.borrowed).toBe(0);
    });

    it('should handle stats calculation errors', async () => {
      firestore.collection.mockReturnValue('equipment');
      firestore.query.mockReturnValue('query');
      firestore.getDocs.mockRejectedValue(new Error('Stats calculation failed'));

      await expect(EquipmentService.getEquipmentStats()).rejects.toThrow('Stats calculation failed');
    });
  });

  describe('uploadEquipmentImage', () => {
    it('should upload image successfully', async () => {
      const mockFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });
      const mockDownloadURL = 'https://example.com/image.jpg';

      storage.ref.mockReturnValue('storage-ref');
      storage.uploadBytes.mockResolvedValue({ ref: 'storage-ref' });
      storage.getDownloadURL.mockResolvedValue(mockDownloadURL);

      const result = await EquipmentService.uploadEquipmentImage(mockFile, 'EQ001');

      expect(storage.uploadBytes).toHaveBeenCalledWith('storage-ref', mockFile);
      expect(storage.getDownloadURL).toHaveBeenCalledWith('storage-ref');
      expect(result).toBe(mockDownloadURL);
    });

    it('should handle upload errors', async () => {
      const mockFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });
      storage.uploadBytes.mockRejectedValue(new Error('Upload failed'));

      await expect(EquipmentService.uploadEquipmentImage(mockFile, 'EQ001')).rejects.toThrow('Upload failed');
    });
  });
});