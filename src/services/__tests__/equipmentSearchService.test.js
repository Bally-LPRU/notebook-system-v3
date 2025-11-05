import EquipmentSearchService from '../equipmentSearchService';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs 
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
  getDocs: jest.fn()
}));

describe('EquipmentSearchService', () => {
  const mockEquipment = [
    {
      id: '1',
      equipmentNumber: 'EQ001',
      name: 'Test Laptop',
      brand: 'Dell',
      model: 'Inspiron',
      category: { id: 'cat1', name: 'Computer' },
      status: 'active',
      searchKeywords: ['test', 'laptop', 'dell', 'inspiron', 'computer'],
      isActive: true
    },
    {
      id: '2',
      equipmentNumber: 'EQ002',
      name: 'Test Printer',
      brand: 'HP',
      model: 'LaserJet',
      category: { id: 'cat2', name: 'Printer' },
      status: 'maintenance',
      searchKeywords: ['test', 'printer', 'hp', 'laserjet'],
      isActive: true
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSearchKeywords', () => {
    test('should generate keywords from text', () => {
      const keywords = EquipmentSearchService.generateSearchKeywords('Test Laptop Computer');
      
      expect(keywords).toContain('test');
      expect(keywords).toContain('laptop');
      expect(keywords).toContain('computer');
    });

    test('should handle Thai text', () => {
      const keywords = EquipmentSearchService.generateSearchKeywords('คอมพิวเตอร์ โน็ตบุ๊ค');
      
      expect(keywords).toContain('คอมพิวเตอร์');
      expect(keywords).toContain('โน็ตบุ๊ค');
    });

    test('should filter out short words', () => {
      const keywords = EquipmentSearchService.generateSearchKeywords('A B Test Equipment');
      
      expect(keywords).not.toContain('a');
      expect(keywords).not.toContain('b');
      expect(keywords).toContain('test');
      expect(keywords).toContain('equipment');
    });

    test('should generate partial matches for long words', () => {
      const keywords = EquipmentSearchService.generateSearchKeywords('Computer');
      
      expect(keywords).toContain('computer');
      expect(keywords).toContain('co');
      expect(keywords).toContain('com');
      expect(keywords).toContain('comp');
      expect(keywords).toContain('compu');
      expect(keywords).toContain('comput');
      expect(keywords).toContain('compute');
    });

    test('should handle empty or null text', () => {
      expect(EquipmentSearchService.generateSearchKeywords('')).toEqual([]);
      expect(EquipmentSearchService.generateSearchKeywords(null)).toEqual([]);
      expect(EquipmentSearchService.generateSearchKeywords(undefined)).toEqual([]);
    });

    test('should remove special characters', () => {
      const keywords = EquipmentSearchService.generateSearchKeywords('Test-Equipment@123!');
      
      expect(keywords).toContain('test');
      expect(keywords).toContain('equipment');
      expect(keywords).toContain('123');
    });
  });

  describe('searchWithSuggestions', () => {
    beforeEach(() => {
      const mockSnapshot = {
        docs: mockEquipment.map(item => ({
          id: item.id,
          data: () => item
        }))
      };
      
      getDocs.mockResolvedValue(mockSnapshot);
      query.mockReturnValue('mock-query');
      collection.mockReturnValue('mock-collection');
      where.mockReturnValue('mock-where');
      orderBy.mockReturnValue('mock-orderBy');
      limit.mockReturnValue('mock-limit');
    });

    test('should return empty results for short query', async () => {
      const result = await EquipmentSearchService.searchWithSuggestions('a');
      
      expect(result.equipment).toEqual([]);
      expect(result.suggestions).toEqual([]);
      expect(result.totalCount).toBe(0);
    });

    test('should search equipment with keywords', async () => {
      const result = await EquipmentSearchService.searchWithSuggestions('laptop');
      
      expect(collection).toHaveBeenCalledWith({}, 'equipmentManagement');
      expect(where).toHaveBeenCalledWith('isActive', '==', true);
      expect(where).toHaveBeenCalledWith('searchKeywords', 'array-contains-any', 
        expect.arrayContaining(['laptop']));
      expect(orderBy).toHaveBeenCalledWith('updatedAt', 'desc');
      expect(limit).toHaveBeenCalledWith(20);
      expect(getDocs).toHaveBeenCalled();
      
      expect(result.equipment).toHaveLength(2);
      expect(result.totalCount).toBe(2);
    });

    test('should include suggestions when requested', async () => {
      // Mock category suggestions
      const mockCategorySnapshot = {
        docs: [{
          id: 'cat1',
          data: () => ({ id: 'cat1', name: 'Computer', isActive: true, equipmentCount: 5 })
        }]
      };
      
      getDocs
        .mockResolvedValueOnce({ docs: mockEquipment.map(item => ({ id: item.id, data: () => item })) })
        .mockResolvedValueOnce(mockCategorySnapshot);

      const result = await EquipmentSearchService.searchWithSuggestions('comp', {
        includeSuggestions: true
      });
      
      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    test('should handle search errors', async () => {
      getDocs.mockRejectedValue(new Error('Database error'));
      
      await expect(EquipmentSearchService.searchWithSuggestions('laptop'))
        .rejects.toThrow('Database error');
    });
  });

  describe('advancedSearch', () => {
    beforeEach(() => {
      const mockSnapshot = {
        docs: mockEquipment.map(item => ({
          id: item.id,
          data: () => item
        }))
      };
      
      getDocs.mockResolvedValue(mockSnapshot);
    });

    test('should build query with multiple criteria', async () => {
      const criteria = {
        query: 'laptop',
        categories: ['cat1'],
        statuses: ['active'],
        equipmentNumber: 'EQ001',
        priceRange: { min: 1000, max: 50000 },
        sortBy: 'name',
        sortOrder: 'asc'
      };

      const result = await EquipmentSearchService.advancedSearch(criteria);
      
      expect(where).toHaveBeenCalledWith('isActive', '==', true);
      expect(where).toHaveBeenCalledWith('searchKeywords', 'array-contains-any', 
        expect.arrayContaining(['laptop']));
      expect(where).toHaveBeenCalledWith('category.id', 'in', ['cat1']);
      expect(where).toHaveBeenCalledWith('status', 'in', ['active']);
      expect(where).toHaveBeenCalledWith('purchasePrice', '>=', 1000);
      expect(where).toHaveBeenCalledWith('purchasePrice', '<=', 50000);
      expect(orderBy).toHaveBeenCalledWith('name', 'asc');
      
      expect(result.equipment).toBeDefined();
      expect(result.totalCount).toBeDefined();
      expect(result.criteria).toEqual(criteria);
    });

    test('should apply client-side filters', async () => {
      const criteria = {
        name: 'laptop',
        brand: 'dell',
        operator: 'AND'
      };

      const result = await EquipmentSearchService.advancedSearch(criteria);
      
      // Should filter equipment based on name and brand
      expect(result.equipment.length).toBeLessThanOrEqual(mockEquipment.length);
    });

    test('should handle date range filters', async () => {
      const criteria = {
        purchaseDateRange: {
          start: '2023-01-01',
          end: '2023-12-31'
        }
      };

      await EquipmentSearchService.advancedSearch(criteria);
      
      expect(where).toHaveBeenCalledWith('purchaseDate', '>=', new Date('2023-01-01'));
      expect(where).toHaveBeenCalledWith('purchaseDate', '<=', new Date('2023-12-31'));
    });
  });

  describe('applyClientSideFilters', () => {
    test('should filter by name', () => {
      const filters = { name: 'laptop', location: {} };
      const result = EquipmentSearchService.applyClientSideFilters(mockEquipment, filters);
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toContain('Laptop');
    });

    test('should filter by brand', () => {
      const filters = { brand: 'dell', location: {} };
      const result = EquipmentSearchService.applyClientSideFilters(mockEquipment, filters);
      
      expect(result).toHaveLength(1);
      expect(result[0].brand).toBe('Dell');
    });

    test('should use AND operator by default', () => {
      const filters = { name: 'laptop', brand: 'hp', operator: 'AND', location: {} };
      const result = EquipmentSearchService.applyClientSideFilters(mockEquipment, filters);
      
      expect(result).toHaveLength(0); // No equipment matches both conditions
    });

    test('should use OR operator when specified', () => {
      const filters = { name: 'laptop', brand: 'hp', operator: 'OR', location: {} };
      const result = EquipmentSearchService.applyClientSideFilters(mockEquipment, filters);
      
      expect(result).toHaveLength(2); // Both equipment match at least one condition
    });
  });

  describe('generateSuggestions', () => {
    test('should generate equipment name suggestions', async () => {
      const suggestions = await EquipmentSearchService.generateSuggestions('laptop', mockEquipment);
      
      const equipmentSuggestions = suggestions.filter(s => s.type === 'equipment');
      expect(equipmentSuggestions.length).toBeGreaterThan(0);
      expect(equipmentSuggestions[0].name).toContain('Laptop');
    });

    test('should generate brand suggestions', async () => {
      const suggestions = await EquipmentSearchService.generateSuggestions('dell', mockEquipment, {
        includeBrands: true
      });
      
      const brandSuggestions = suggestions.filter(s => s.type === 'brand');
      expect(brandSuggestions.length).toBeGreaterThan(0);
      expect(brandSuggestions[0].name).toBe('Dell');
    });

    test('should limit suggestions', async () => {
      const suggestions = await EquipmentSearchService.generateSuggestions('test', mockEquipment);
      
      expect(suggestions.length).toBeLessThanOrEqual(10);
    });

    test('should remove duplicate suggestions', async () => {
      const duplicateEquipment = [...mockEquipment, ...mockEquipment];
      const suggestions = await EquipmentSearchService.generateSuggestions('test', duplicateEquipment);
      
      const uniqueQueries = new Set(suggestions.map(s => s.query));
      expect(uniqueQueries.size).toBe(suggestions.length);
    });
  });

  describe('getAutocompleteSuggestions', () => {
    beforeEach(() => {
      const mockSnapshot = {
        docs: mockEquipment.map(item => ({
          id: item.id,
          data: () => item
        }))
      };
      
      getDocs.mockResolvedValue(mockSnapshot);
    });

    test('should return empty array for short query', async () => {
      const suggestions = await EquipmentSearchService.getAutocompleteSuggestions('a');
      
      expect(suggestions).toEqual([]);
    });

    test('should return autocomplete suggestions', async () => {
      const suggestions = await EquipmentSearchService.getAutocompleteSuggestions('laptop');
      
      expect(collection).toHaveBeenCalledWith({}, 'equipmentManagement');
      expect(Array.isArray(suggestions)).toBe(true);
      // The actual suggestions depend on the mock data filtering
    });

    test('should limit suggestions to 8', async () => {
      const suggestions = await EquipmentSearchService.getAutocompleteSuggestions('test');
      
      expect(suggestions.length).toBeLessThanOrEqual(8);
    });
  });

  describe('getPopularSearchTerms', () => {
    beforeEach(() => {
      // Mock localStorage
      const mockHistory = ['laptop', 'printer', 'laptop', 'computer', 'laptop'];
      localStorage.setItem('equipment-search-history', JSON.stringify(mockHistory));
    });

    afterEach(() => {
      localStorage.clear();
    });

    test('should return popular search terms', () => {
      const terms = EquipmentSearchService.getPopularSearchTerms();
      
      expect(terms).toContain('laptop'); // Most frequent
      expect(terms[0]).toBe('laptop'); // Should be first
      expect(terms.length).toBeLessThanOrEqual(5);
    });

    test('should handle empty history', () => {
      localStorage.removeItem('equipment-search-history');
      
      const terms = EquipmentSearchService.getPopularSearchTerms();
      
      expect(terms).toEqual([]);
    });
  });

  describe('clearSearchHistory', () => {
    test('should clear search history from localStorage', () => {
      localStorage.setItem('equipment-search-history', JSON.stringify(['test']));
      localStorage.setItem('equipment-advanced-searches', JSON.stringify(['test']));
      
      EquipmentSearchService.clearSearchHistory();
      
      expect(localStorage.getItem('equipment-search-history')).toBeNull();
      expect(localStorage.getItem('equipment-advanced-searches')).toBeNull();
    });
  });
});