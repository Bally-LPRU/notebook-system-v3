import EquipmentFilterService from '../equipmentFilterService';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  getDocs,
  getCountFromServer
} from 'firebase/firestore';

// Mock Firebase
jest.mock('../../config/firebase', () => ({
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
  getDocs: jest.fn(),
  getCountFromServer: jest.fn()
}));

jest.mock('../equipmentSearchService', () => ({
  generateSearchKeywords: jest.fn((text) => text ? text.toLowerCase().split(' ') : [])
}));

describe('EquipmentFilterService', () => {
  const mockEquipment = [
    {
      id: '1',
      equipmentNumber: 'EQ001',
      name: 'Test Laptop',
      brand: 'Dell',
      category: { id: 'cat1', name: 'Computer' },
      status: 'active',
      purchasePrice: 25000,
      purchaseDate: new Date('2023-06-01'),
      location: { building: 'Building A', floor: '1', room: '101' },
      responsiblePerson: { uid: 'user1', name: 'John Doe' },
      tags: ['laptop', 'portable'],
      isActive: true
    },
    {
      id: '2',
      equipmentNumber: 'EQ002',
      name: 'Test Printer',
      brand: 'HP',
      category: { id: 'cat2', name: 'Printer' },
      status: 'maintenance',
      purchasePrice: 15000,
      purchaseDate: new Date('2023-03-01'),
      location: { building: 'Building B', floor: '2', room: '201' },
      responsiblePerson: { uid: 'user2', name: 'Jane Smith' },
      tags: ['printer', 'office'],
      isActive: true
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getFilteredEquipment', () => {
    beforeEach(() => {
      const mockSnapshot = {
        docs: mockEquipment.map((item, index) => ({
          id: item.id,
          data: () => item
        })),
        forEach: jest.fn((callback) => {
          mockEquipment.forEach((item, index) => {
            callback({ id: item.id, data: () => item }, index);
          });
        })
      };
      
      getDocs.mockResolvedValue(mockSnapshot);
      getCountFromServer.mockResolvedValue({ data: () => ({ count: 2 }) });
      query.mockReturnValue('mock-query');
      collection.mockReturnValue('mock-collection');
      where.mockReturnValue('mock-where');
      orderBy.mockReturnValue('mock-orderBy');
      limit.mockReturnValue('mock-limit');
      startAfter.mockReturnValue('mock-startAfter');
    });

    test('should return filtered equipment with default parameters', async () => {
      const result = await EquipmentFilterService.getFilteredEquipment();
      
      expect(collection).toHaveBeenCalledWith({}, 'equipmentManagement');
      expect(where).toHaveBeenCalledWith('isActive', '==', true);
      expect(orderBy).toHaveBeenCalledWith('updatedAt', 'desc');
      expect(limit).toHaveBeenCalledWith(21); // pageSize + 1
      
      expect(result.equipment).toHaveLength(2);
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.pageSize).toBe(20);
      expect(result.pagination.totalCount).toBe(2);
    });

    test('should apply search filter', async () => {
      const filters = { search: 'laptop' };
      
      await EquipmentFilterService.getFilteredEquipment(filters);
      
      expect(where).toHaveBeenCalledWith('searchKeywords', 'array-contains-any', 
        expect.arrayContaining(['laptop']));
    });

    test('should apply category filter', async () => {
      const filters = { categories: ['cat1'] };
      
      await EquipmentFilterService.getFilteredEquipment(filters);
      
      expect(where).toHaveBeenCalledWith('category.id', '==', 'cat1');
    });

    test('should apply multiple category filter', async () => {
      const filters = { categories: ['cat1', 'cat2'] };
      
      await EquipmentFilterService.getFilteredEquipment(filters);
      
      expect(where).toHaveBeenCalledWith('category.id', 'in', ['cat1', 'cat2']);
    });

    test('should apply status filter', async () => {
      const filters = { statuses: ['active', 'maintenance'] };
      
      await EquipmentFilterService.getFilteredEquipment(filters);
      
      expect(where).toHaveBeenCalledWith('status', 'in', ['active', 'maintenance']);
    });

    test('should apply date range filter', async () => {
      const filters = {
        dateRange: {
          start: '2023-01-01',
          end: '2023-12-31'
        }
      };
      
      await EquipmentFilterService.getFilteredEquipment(filters);
      
      expect(where).toHaveBeenCalledWith('purchaseDate', '>=', new Date('2023-01-01'));
      expect(where).toHaveBeenCalledWith('purchaseDate', '<=', expect.any(Date));
    });

    test('should apply price range filter', async () => {
      const filters = {
        priceRange: {
          min: 10000,
          max: 30000
        }
      };
      
      await EquipmentFilterService.getFilteredEquipment(filters);
      
      expect(where).toHaveBeenCalledWith('purchasePrice', '>=', 10000);
      expect(where).toHaveBeenCalledWith('purchasePrice', '<=', 30000);
    });

    test('should apply location filter', async () => {
      const filters = {
        location: { building: 'Building A' }
      };
      
      await EquipmentFilterService.getFilteredEquipment(filters);
      
      expect(where).toHaveBeenCalledWith('location.building', '==', 'Building A');
    });

    test('should apply responsible person filter', async () => {
      const filters = { responsiblePerson: 'user1' };
      
      await EquipmentFilterService.getFilteredEquipment(filters);
      
      expect(where).toHaveBeenCalledWith('responsiblePerson.uid', '==', 'user1');
    });

    test('should apply tags filter', async () => {
      const filters = { tags: ['laptop', 'portable'] };
      
      await EquipmentFilterService.getFilteredEquipment(filters);
      
      expect(where).toHaveBeenCalledWith('tags', 'array-contains-any', ['laptop', 'portable']);
    });

    test('should apply custom sorting', async () => {
      const filters = {
        sortBy: 'name',
        sortOrder: 'asc'
      };
      
      await EquipmentFilterService.getFilteredEquipment(filters);
      
      expect(orderBy).toHaveBeenCalledWith('name', 'asc');
    });

    test('should handle pagination', async () => {
      const mockLastDoc = { id: 'last-doc' };
      const filters = {
        page: 2,
        pageSize: 10,
        lastDoc: mockLastDoc
      };
      
      await EquipmentFilterService.getFilteredEquipment(filters);
      
      expect(startAfter).toHaveBeenCalledWith(mockLastDoc);
      expect(limit).toHaveBeenCalledWith(11); // pageSize + 1
    });

    test('should detect next page availability', async () => {
      // Mock more items than page size
      const moreItems = Array(25).fill().map((_, i) => ({
        id: `item-${i}`,
        ...mockEquipment[0]
      }));
      
      const mockSnapshot = {
        docs: moreItems.map(item => ({ id: item.id, data: () => item })),
        forEach: jest.fn((callback) => {
          moreItems.forEach((item, index) => {
            callback({ id: item.id, data: () => item }, index);
          });
        })
      };
      
      getDocs.mockResolvedValue(mockSnapshot);
      
      const result = await EquipmentFilterService.getFilteredEquipment({ pageSize: 20 });
      
      expect(result.pagination.hasNextPage).toBe(true);
      expect(result.equipment).toHaveLength(20); // Should limit to pageSize
    });

    test('should handle errors gracefully', async () => {
      getDocs.mockRejectedValue(new Error('Database error'));
      
      await expect(EquipmentFilterService.getFilteredEquipment())
        .rejects.toThrow('Database error');
    });
  });

  describe('applyClientSideFilters', () => {
    test('should filter by location floor and room', () => {
      const filters = {
        location: { floor: '1', room: '101' }
      };
      
      const result = EquipmentFilterService.applyClientSideFilters(mockEquipment, filters);
      
      expect(result).toHaveLength(1);
      expect(result[0].location.floor).toBe('1');
      expect(result[0].location.room).toBe('101');
    });

    test('should apply additional text search', () => {
      const filters = { search: 'dell', location: {} };
      
      const result = EquipmentFilterService.applyClientSideFilters(mockEquipment, filters);
      
      expect(result).toHaveLength(1);
      expect(result[0].brand).toBe('Dell');
    });

    test('should return all items when no filters', () => {
      const result = EquipmentFilterService.applyClientSideFilters(mockEquipment, { location: {} });
      
      expect(result).toHaveLength(2);
    });
  });

  describe('getFilterStatistics', () => {
    beforeEach(() => {
      // Mock getFilteredEquipment to return our test data
      jest.spyOn(EquipmentFilterService, 'getFilteredEquipment').mockResolvedValue({
        equipment: mockEquipment,
        pagination: { totalCount: 2 }
      });
    });

    test('should calculate category statistics', async () => {
      const stats = await EquipmentFilterService.getFilterStatistics();
      
      expect(stats.categories.Computer).toBe(1);
      expect(stats.categories.Printer).toBe(1);
    });

    test('should calculate status statistics', async () => {
      const stats = await EquipmentFilterService.getFilterStatistics();
      
      expect(stats.statuses.active).toBe(1);
      expect(stats.statuses.maintenance).toBe(1);
    });

    test('should calculate price range statistics', async () => {
      const stats = await EquipmentFilterService.getFilterStatistics();
      
      expect(stats.priceRanges['10000-50000']).toBe(2);
    });

    test('should calculate location statistics', async () => {
      const stats = await EquipmentFilterService.getFilterStatistics();
      
      expect(stats.locations['Building A']).toBe(1);
      expect(stats.locations['Building B']).toBe(1);
    });

    test('should calculate date range statistics', async () => {
      const stats = await EquipmentFilterService.getFilterStatistics();
      
      expect(stats.dateRanges).toHaveProperty('thisMonth');
      expect(stats.dateRanges).toHaveProperty('last3Months');
      expect(stats.dateRanges).toHaveProperty('last6Months');
      expect(stats.dateRanges).toHaveProperty('lastYear');
      expect(stats.dateRanges).toHaveProperty('older');
    });

    test('should handle errors gracefully', async () => {
      jest.spyOn(EquipmentFilterService, 'getFilteredEquipment').mockRejectedValue(new Error('Error'));
      
      const stats = await EquipmentFilterService.getFilterStatistics();
      
      expect(stats.total).toBe(0);
      expect(stats.categories).toEqual({});
    });
  });

  describe('getFilterOptions', () => {
    beforeEach(() => {
      const mockCategoriesSnapshot = {
        docs: [
          { id: 'cat1', data: () => ({ id: 'cat1', name: 'Computer', isActive: true }) },
          { id: 'cat2', data: () => ({ id: 'cat2', name: 'Printer', isActive: true }) }
        ]
      };
      
      const mockEquipmentSnapshot = {
        docs: mockEquipment.map(item => ({ data: () => item }))
      };
      
      getDocs
        .mockResolvedValueOnce(mockCategoriesSnapshot)
        .mockResolvedValueOnce(mockEquipmentSnapshot);
    });

    test('should return filter options', async () => {
      const options = await EquipmentFilterService.getFilterOptions();
      
      expect(options.categories).toHaveLength(2);
      expect(options.brands).toContain('Dell');
      expect(options.brands).toContain('HP');
      expect(options.locations).toContain('Building A');
      expect(options.locations).toContain('Building B');
      expect(options.responsiblePersons).toContain('John Doe');
      expect(options.responsiblePersons).toContain('Jane Smith');
      expect(options.tags).toContain('laptop');
      expect(options.tags).toContain('printer');
    });

    test('should calculate price range', async () => {
      const options = await EquipmentFilterService.getFilterOptions();
      
      expect(options.priceRange.min).toBe(15000);
      expect(options.priceRange.max).toBe(25000);
    });

    test('should calculate date range', async () => {
      const options = await EquipmentFilterService.getFilterOptions();
      
      expect(options.dateRange.min).toBeInstanceOf(Date);
      expect(options.dateRange.max).toBeInstanceOf(Date);
    });

    test('should handle errors gracefully', async () => {
      getDocs.mockRejectedValue(new Error('Database error'));
      
      const options = await EquipmentFilterService.getFilterOptions();
      
      expect(options.categories).toEqual([]);
      expect(options.brands).toEqual([]);
      expect(options.priceRange).toEqual({ min: 0, max: 0 });
    });
  });

  describe('Filter Presets', () => {
    const mockUserId = 'user123';
    const mockFilters = {
      categories: ['cat1'],
      statuses: ['active'],
      search: 'laptop'
    };

    beforeEach(() => {
      localStorage.clear();
    });

    describe('saveFilterPreset', () => {
      test('should save filter preset to localStorage', async () => {
        const presetId = await EquipmentFilterService.saveFilterPreset('My Preset', mockFilters, mockUserId);
        
        expect(presetId).toBeDefined();
        
        const savedPresets = JSON.parse(localStorage.getItem('equipment-filter-presets'));
        expect(savedPresets).toHaveLength(1);
        expect(savedPresets[0].name).toBe('My Preset');
        expect(savedPresets[0].filters).toEqual(mockFilters);
        expect(savedPresets[0].userId).toBe(mockUserId);
      });

      test('should trim preset name', async () => {
        await EquipmentFilterService.saveFilterPreset('  My Preset  ', mockFilters, mockUserId);
        
        const savedPresets = JSON.parse(localStorage.getItem('equipment-filter-presets'));
        expect(savedPresets[0].name).toBe('My Preset');
      });
    });

    describe('getFilterPresets', () => {
      test('should return presets for specific user', async () => {
        // Save presets for different users
        await EquipmentFilterService.saveFilterPreset('User1 Preset', mockFilters, 'user1');
        await EquipmentFilterService.saveFilterPreset('User2 Preset', mockFilters, 'user2');
        
        const user1Presets = await EquipmentFilterService.getFilterPresets('user1');
        const user2Presets = await EquipmentFilterService.getFilterPresets('user2');
        
        expect(user1Presets).toHaveLength(1);
        expect(user1Presets[0].name).toBe('User1 Preset');
        expect(user2Presets).toHaveLength(1);
        expect(user2Presets[0].name).toBe('User2 Preset');
      });

      test('should return empty array for user with no presets', async () => {
        const presets = await EquipmentFilterService.getFilterPresets('nonexistent-user');
        
        expect(presets).toEqual([]);
      });

      test('should handle localStorage errors', async () => {
        // Mock localStorage to throw error
        jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
          throw new Error('localStorage error');
        });
        
        const presets = await EquipmentFilterService.getFilterPresets(mockUserId);
        
        expect(presets).toEqual([]);
      });
    });

    describe('deleteFilterPreset', () => {
      test('should delete specific preset', async () => {
        const presetId1 = await EquipmentFilterService.saveFilterPreset('Preset 1', mockFilters, mockUserId);
        const presetId2 = await EquipmentFilterService.saveFilterPreset('Preset 2', mockFilters, mockUserId);
        
        const success = await EquipmentFilterService.deleteFilterPreset(presetId1, mockUserId);
        
        expect(success).toBe(true);
        
        const remainingPresets = await EquipmentFilterService.getFilterPresets(mockUserId);
        expect(remainingPresets).toHaveLength(1);
        expect(remainingPresets[0].name).toBe('Preset 2');
      });

      test('should not delete preset from different user', async () => {
        const presetId = await EquipmentFilterService.saveFilterPreset('User1 Preset', mockFilters, 'user1');
        
        const success = await EquipmentFilterService.deleteFilterPreset(presetId, 'user2');
        
        expect(success).toBe(true); // Method returns true even if nothing was deleted
        
        const user1Presets = await EquipmentFilterService.getFilterPresets('user1');
        expect(user1Presets).toHaveLength(1); // Preset should still exist
      });

      test('should handle localStorage errors', async () => {
        jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
          throw new Error('localStorage error');
        });
        
        const success = await EquipmentFilterService.deleteFilterPreset('preset-id', mockUserId);
        
        expect(success).toBe(false);
      });
    });
  });
});