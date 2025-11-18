import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import CacheService from './cacheService';

class EquipmentSearchService {
  static COLLECTION_NAME = 'equipmentManagement'; // Correct collection name where data exists
  static CATEGORIES_COLLECTION = 'equipmentCategories';

  /**
   * Perform text search with suggestions
   * @param {string} searchQuery - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results with suggestions
   */
  static async searchWithSuggestions(searchQuery, options = {}) {
    try {
      const {
        limit: searchLimit = 20,
        includeSuggestions = true,
        includeCategories = true,
        includeBrands = true
      } = options;

      const results = {
        equipment: [],
        suggestions: [],
        totalCount: 0
      };

      if (!searchQuery || searchQuery.length < 2) {
        return results;
      }

      // Check cache first
      const cacheKey = { query: searchQuery, options };
      const cachedResults = CacheService.getCachedSearchResults(searchQuery, cacheKey);
      if (cachedResults) {
        return cachedResults;
      }

      // Generate search keywords
      const searchKeywords = this.generateSearchKeywords(searchQuery);
      
      // Search equipment
      const equipmentQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('isActive', '==', true),
        where('searchKeywords', 'array-contains-any', searchKeywords),
        orderBy('updatedAt', 'desc'),
        limit(searchLimit)
      );

      const equipmentSnapshot = await getDocs(equipmentQuery);
      results.equipment = equipmentSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      results.totalCount = results.equipment.length;

      // Generate suggestions if requested
      if (includeSuggestions) {
        results.suggestions = await this.generateSuggestions(
          searchQuery, 
          results.equipment,
          { includeCategories, includeBrands }
        );
      }

      // Cache the results
      CacheService.setCachedSearchResults(searchQuery, cacheKey, results);

      return results;
    } catch (error) {
      console.error('Error in searchWithSuggestions:', error);
      throw error;
    }
  }

  /**
   * Perform advanced search
   * @param {Object} criteria - Advanced search criteria
   * @returns {Promise<Object>} Search results
   */
  static async advancedSearch(criteria) {
    try {
      const {
        query: textQuery = '',
        equipmentNumber = '',
        name = '',
        brand = '',
        model = '',
        description = '',
        categories = [],
        statuses = [],
        location = {},
        purchaseDateRange = {},
        priceRange = {},
        responsiblePerson = '',
        tags = [],
        operator = 'AND',
        sortBy = 'updatedAt',
        sortOrder = 'desc',
        limit: searchLimit = 50
      } = criteria;

      // Check cache first
      const cachedResults = CacheService.getCachedSearchResults(textQuery, criteria);
      if (cachedResults) {
        return cachedResults;
      }

      let equipmentQuery = collection(db, this.COLLECTION_NAME);
      const queryConstraints = [];

      // Always filter active equipment
      queryConstraints.push(where('isActive', '==', true));

      // Text-based searches
      if (textQuery && textQuery.length >= 2) {
        const searchKeywords = this.generateSearchKeywords(textQuery);
        queryConstraints.push(where('searchKeywords', 'array-contains-any', searchKeywords));
      }

      if (equipmentNumber) {
        queryConstraints.push(where('equipmentNumber', '>=', equipmentNumber.toUpperCase()));
        queryConstraints.push(where('equipmentNumber', '<=', equipmentNumber.toUpperCase() + '\uf8ff'));
      }

      // Category filter
      if (categories.length > 0) {
        queryConstraints.push(where('category.id', 'in', categories));
      }

      // Status filter
      if (statuses.length > 0) {
        queryConstraints.push(where('status', 'in', statuses));
      }

      // Location filters
      if (location.building) {
        queryConstraints.push(where('location.building', '==', location.building));
      }

      // Date range filter
      if (purchaseDateRange.start) {
        queryConstraints.push(where('purchaseDate', '>=', new Date(purchaseDateRange.start)));
      }
      if (purchaseDateRange.end) {
        queryConstraints.push(where('purchaseDate', '<=', new Date(purchaseDateRange.end)));
      }

      // Price range filter
      if (priceRange.min !== undefined && priceRange.min !== '') {
        queryConstraints.push(where('purchasePrice', '>=', Number(priceRange.min)));
      }
      if (priceRange.max !== undefined && priceRange.max !== '') {
        queryConstraints.push(where('purchasePrice', '<=', Number(priceRange.max)));
      }

      // Responsible person filter
      if (responsiblePerson) {
        queryConstraints.push(where('responsiblePerson.uid', '==', responsiblePerson));
      }

      // Tags filter
      if (tags.length > 0) {
        queryConstraints.push(where('tags', 'array-contains-any', tags));
      }

      // Add sorting
      queryConstraints.push(orderBy(sortBy, sortOrder));
      queryConstraints.push(limit(searchLimit));

      // Build and execute query
      equipmentQuery = query(equipmentQuery, ...queryConstraints);
      const querySnapshot = await getDocs(equipmentQuery);
      
      let equipment = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Apply client-side filters for fields that can't be queried directly
      equipment = this.applyClientSideFilters(equipment, {
        name,
        brand,
        model,
        description,
        location,
        operator
      });

      const results = {
        equipment,
        totalCount: equipment.length,
        criteria
      };

      // Cache the results
      CacheService.setCachedSearchResults(textQuery, criteria, results);

      return results;
    } catch (error) {
      console.error('Error in advancedSearch:', error);
      throw error;
    }
  }

  /**
   * Apply client-side filters for complex queries
   * @param {Array} equipment - Equipment array
   * @param {Object} filters - Filters to apply
   * @returns {Array} Filtered equipment
   */
  static applyClientSideFilters(equipment, filters) {
    const { name, brand, model, description, location, operator } = filters;

    return equipment.filter(item => {
      const conditions = [];

      if (name) {
        conditions.push(item.name?.toLowerCase().includes(name.toLowerCase()));
      }
      if (brand) {
        conditions.push(item.brand?.toLowerCase().includes(brand.toLowerCase()));
      }
      if (model) {
        conditions.push(item.model?.toLowerCase().includes(model.toLowerCase()));
      }
      if (description) {
        conditions.push(item.description?.toLowerCase().includes(description.toLowerCase()));
      }
      if (location.floor) {
        conditions.push(item.location?.floor === location.floor);
      }
      if (location.room) {
        conditions.push(item.location?.room === location.room);
      }

      if (conditions.length === 0) return true;

      return operator === 'AND' 
        ? conditions.every(condition => condition)
        : conditions.some(condition => condition);
    });
  }

  /**
   * Generate search suggestions
   * @param {string} query - Search query
   * @param {Array} searchResults - Current search results
   * @param {Object} options - Suggestion options
   * @returns {Promise<Array>} Suggestions array
   */
  static async generateSuggestions(query, searchResults = [], options = {}) {
    try {
      const { includeCategories = true, includeBrands = true } = options;
      const suggestions = [];
      const queryLower = query.toLowerCase();

      // Equipment name suggestions from search results
      const equipmentSuggestions = searchResults
        .filter(item => item.name.toLowerCase().includes(queryLower))
        .slice(0, 5)
        .map(item => ({
          type: 'equipment',
          name: item.name,
          description: `${item.brand} ${item.model}`.trim(),
          query: item.name
        }));

      suggestions.push(...equipmentSuggestions);

      // Brand suggestions from search results
      if (includeBrands) {
        const brands = [...new Set(
          searchResults
            .filter(item => item.brand && item.brand.toLowerCase().includes(queryLower))
            .map(item => item.brand)
        )].slice(0, 3);

        const brandSuggestions = brands.map(brand => ({
          type: 'brand',
          name: brand,
          description: 'ยี่ห้อ',
          query: brand
        }));

        suggestions.push(...brandSuggestions);
      }

      // Category suggestions
      if (includeCategories) {
        const categorySuggestions = await this.getCategorySuggestions(queryLower);
        suggestions.push(...categorySuggestions);
      }

      // Equipment number suggestions
      const equipmentNumberSuggestions = searchResults
        .filter(item => item.equipmentNumber.toLowerCase().includes(queryLower))
        .slice(0, 3)
        .map(item => ({
          type: 'equipment',
          name: item.equipmentNumber,
          description: item.name,
          query: item.equipmentNumber
        }));

      suggestions.push(...equipmentNumberSuggestions);

      // Remove duplicates and limit results
      const uniqueSuggestions = suggestions
        .filter((suggestion, index, self) => 
          index === self.findIndex(s => s.query === suggestion.query)
        )
        .slice(0, 10);

      return uniqueSuggestions;
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return [];
    }
  }

  /**
   * Get category suggestions
   * @param {string} query - Search query
   * @returns {Promise<Array>} Category suggestions
   */
  static async getCategorySuggestions(query) {
    try {
      const categoriesQuery = query(
        collection(db, this.CATEGORIES_COLLECTION),
        where('isActive', '==', true),
        orderBy('name')
      );

      const categoriesSnapshot = await getDocs(categoriesQuery);
      const categories = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return categories
        .filter(category => category.name.toLowerCase().includes(query))
        .slice(0, 5)
        .map(category => ({
          type: 'category',
          name: category.name,
          description: 'ประเภทอุปกรณ์',
          query: category.name,
          count: category.equipmentCount || 0
        }));
    } catch (error) {
      console.error('Error getting category suggestions:', error);
      return [];
    }
  }

  /**
   * Get search autocomplete suggestions
   * @param {string} query - Partial search query
   * @returns {Promise<Array>} Autocomplete suggestions
   */
  static async getAutocompleteSuggestions(query) {
    try {
      if (!query || query.length < 2) {
        return [];
      }

      const suggestions = [];
      const queryLower = query.toLowerCase();

      // Get equipment suggestions
      const equipmentQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('isActive', '==', true),
        orderBy('name'),
        limit(10)
      );

      const equipmentSnapshot = await getDocs(equipmentQuery);
      const equipment = equipmentSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter and format equipment suggestions
      equipment
        .filter(item => 
          item.name.toLowerCase().includes(queryLower) ||
          item.brand?.toLowerCase().includes(queryLower) ||
          item.equipmentNumber.toLowerCase().includes(queryLower)
        )
        .forEach(item => {
          if (item.name.toLowerCase().includes(queryLower)) {
            suggestions.push({
              type: 'equipment',
              text: item.name,
              description: `${item.brand} ${item.model}`.trim()
            });
          }
          if (item.brand?.toLowerCase().includes(queryLower)) {
            suggestions.push({
              type: 'brand',
              text: item.brand,
              description: 'ยี่ห้อ'
            });
          }
          if (item.equipmentNumber.toLowerCase().includes(queryLower)) {
            suggestions.push({
              type: 'equipment',
              text: item.equipmentNumber,
              description: item.name
            });
          }
        });

      // Remove duplicates
      const uniqueSuggestions = suggestions
        .filter((suggestion, index, self) => 
          index === self.findIndex(s => s.text === suggestion.text)
        )
        .slice(0, 8);

      return uniqueSuggestions;
    } catch (error) {
      console.error('Error getting autocomplete suggestions:', error);
      return [];
    }
  }

  /**
   * Generate search keywords from text
   * @param {string} text - Text to generate keywords from
   * @returns {Array<string>} Search keywords
   */
  static generateSearchKeywords(text) {
    if (!text) return [];
    
    const keywords = new Set();
    
    // Split text into words and clean them
    const words = text.toLowerCase()
      .replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length >= 2);
    
    words.forEach(word => {
      keywords.add(word);
      
      // Add partial matches for longer words
      if (word.length > 3) {
        for (let i = 2; i <= word.length - 1; i++) {
          keywords.add(word.substring(0, i));
        }
      }
    });
    
    return Array.from(keywords);
  }

  /**
   * Get popular search terms
   * @returns {Array<string>} Popular search terms
   */
  static getPopularSearchTerms() {
    const history = JSON.parse(localStorage.getItem('equipment-search-history') || '[]');
    const termCounts = {};
    
    history.forEach(term => {
      termCounts[term] = (termCounts[term] || 0) + 1;
    });
    
    return Object.entries(termCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([term]) => term);
  }

  /**
   * Clear search history
   */
  static clearSearchHistory() {
    localStorage.removeItem('equipment-search-history');
    localStorage.removeItem('equipment-advanced-searches');
  }
}

export default EquipmentSearchService;