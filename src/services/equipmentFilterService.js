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
import { db } from '../config/firebase';
import EquipmentSearchService from './equipmentSearchService';

class EquipmentFilterService {
  static COLLECTION_NAME = 'equipmentManagement'; // Correct collection name where data exists

  /**
   * Apply filters and get paginated results
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Object>} Filtered results with pagination
   */
  static async getFilteredEquipment(filters = {}) {
    try {
      const {
        search = '',
        categories = [],
        statuses = [],
        dateRange = { start: '', end: '' },
        priceRange = { min: '', max: '' },
        location = { building: '', floor: '', room: '' },
        responsiblePerson = '',
        tags = [],
        sortBy = 'updatedAt',
        sortOrder = 'desc',
        page = 1,
        pageSize = 20,
        lastDoc = null
      } = filters;

      // Build base query
      let equipmentQuery = collection(db, this.COLLECTION_NAME);
      const queryConstraints = [];

      // Always filter active equipment
      queryConstraints.push(where('isActive', '==', true));

      // Text search using keywords
      if (search && search.length >= 2) {
        const searchKeywords = EquipmentSearchService.generateSearchKeywords(search);
        if (searchKeywords && searchKeywords.length > 0) {
          queryConstraints.push(where('searchKeywords', 'array-contains-any', searchKeywords));
        }
      }

      // Category filter
      if (categories.length > 0) {
        if (categories.length === 1) {
          queryConstraints.push(where('category.id', '==', categories[0]));
        } else {
          queryConstraints.push(where('category.id', 'in', categories.slice(0, 10))); // Firestore limit
        }
      }

      // Status filter
      if (statuses.length > 0) {
        if (statuses.length === 1) {
          queryConstraints.push(where('status', '==', statuses[0]));
        } else {
          queryConstraints.push(where('status', 'in', statuses));
        }
      }

      // Date range filter
      if (dateRange.start) {
        queryConstraints.push(where('purchaseDate', '>=', new Date(dateRange.start)));
      }
      if (dateRange.end) {
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999); // End of day
        queryConstraints.push(where('purchaseDate', '<=', endDate));
      }

      // Price range filter
      if (priceRange.min !== undefined && priceRange.min !== '') {
        queryConstraints.push(where('purchasePrice', '>=', Number(priceRange.min)));
      }
      if (priceRange.max !== undefined && priceRange.max !== '') {
        queryConstraints.push(where('purchasePrice', '<=', Number(priceRange.max)));
      }

      // Location filter (building only for Firestore query)
      if (location.building) {
        queryConstraints.push(where('location.building', '==', location.building));
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

      // Add pagination
      if (lastDoc) {
        queryConstraints.push(startAfter(lastDoc));
      }
      queryConstraints.push(limit(pageSize + 1)); // Get one extra to check if there's next page

      // Build and execute query
      equipmentQuery = query(equipmentQuery, ...queryConstraints);
      const querySnapshot = await getDocs(equipmentQuery);
      
      let equipment = [];
      let hasNextPage = false;
      let newLastDoc = null;

      querySnapshot.forEach((doc, index) => {
        if (index < pageSize) {
          equipment.push({
            id: doc.id,
            ...doc.data()
          });
        } else {
          hasNextPage = true;
        }
      });

      // Set last document for next page
      if (equipment.length > 0) {
        newLastDoc = querySnapshot.docs[Math.min(equipment.length - 1, pageSize - 1)];
      }

      // Apply client-side filters for complex conditions
      equipment = this.applyClientSideFilters(equipment, {
        location: location,
        search: search
      });

      // Get total count (approximate for performance)
      let totalCount = equipment.length;
      if (page === 1) {
        try {
          const countQuery = query(
            collection(db, this.COLLECTION_NAME),
            ...queryConstraints.slice(0, -2) // Remove pagination constraints
          );
          const countSnapshot = await getCountFromServer(countQuery);
          totalCount = countSnapshot.data().count;
        } catch (error) {
          console.warn('Could not get exact count, using approximate:', error);
          totalCount = hasNextPage ? (page * pageSize) + 1 : equipment.length;
        }
      }

      return {
        equipment,
        pagination: {
          currentPage: page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
          hasNextPage,
          hasPreviousPage: page > 1
        },
        lastDoc: newLastDoc,
        filters: filters
      };
    } catch (error) {
      console.error('Error in getFilteredEquipment:', error);
      throw error;
    }
  }

  /**
   * Apply client-side filters for complex conditions
   * @param {Array} equipment - Equipment array
   * @param {Object} filters - Additional filters
   * @returns {Array} Filtered equipment
   */
  static applyClientSideFilters(equipment, filters) {
    const { location, search } = filters;

    return equipment.filter(item => {
      // Location filters (floor and room)
      if (location.floor && item.location?.floor !== location.floor) {
        return false;
      }
      if (location.room && item.location?.room !== location.room) {
        return false;
      }

      // Additional text search in fields not covered by keywords
      if (search && search.length >= 2) {
        const searchLower = search.toLowerCase();
        const searchableText = [
          item.name,
          item.brand,
          item.model,
          item.equipmentNumber,
          item.description,
          item.category?.name,
          item.location?.building,
          item.location?.floor,
          item.location?.room,
          item.responsiblePerson?.name,
          ...(item.tags || [])
        ].filter(Boolean).join(' ').toLowerCase();

        if (!searchableText.includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Get filter statistics
   * @param {Object} baseFilters - Base filters to apply
   * @returns {Promise<Object>} Filter statistics
   */
  static async getFilterStatistics(baseFilters = {}) {
    try {
      // Get all equipment with base filters
      const results = await this.getFilteredEquipment({
        ...baseFilters,
        pageSize: 1000 // Get more items for statistics
      });

      const equipment = results.equipment;
      const stats = {
        total: equipment.length,
        categories: {},
        statuses: {},
        priceRanges: {
          '0-10000': 0,
          '10000-50000': 0,
          '50000-100000': 0,
          '100000-500000': 0,
          '500000+': 0
        },
        locations: {},
        dateRanges: {
          'thisMonth': 0,
          'last3Months': 0,
          'last6Months': 0,
          'lastYear': 0,
          'older': 0
        }
      };

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const last3Months = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      const last6Months = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), 1);

      equipment.forEach(item => {
        // Category stats
        if (item.category?.name) {
          stats.categories[item.category.name] = (stats.categories[item.category.name] || 0) + 1;
        }

        // Status stats
        if (item.status) {
          stats.statuses[item.status] = (stats.statuses[item.status] || 0) + 1;
        }

        // Price range stats
        const price = item.purchasePrice || 0;
        if (price < 10000) {
          stats.priceRanges['0-10000']++;
        } else if (price < 50000) {
          stats.priceRanges['10000-50000']++;
        } else if (price < 100000) {
          stats.priceRanges['50000-100000']++;
        } else if (price < 500000) {
          stats.priceRanges['100000-500000']++;
        } else {
          stats.priceRanges['500000+']++;
        }

        // Location stats
        if (item.location?.building) {
          const locationKey = item.location.building;
          stats.locations[locationKey] = (stats.locations[locationKey] || 0) + 1;
        }

        // Date range stats
        if (item.purchaseDate) {
          const purchaseDate = item.purchaseDate.toDate ? item.purchaseDate.toDate() : new Date(item.purchaseDate);
          if (purchaseDate >= thisMonth) {
            stats.dateRanges.thisMonth++;
          } else if (purchaseDate >= last3Months) {
            stats.dateRanges.last3Months++;
          } else if (purchaseDate >= last6Months) {
            stats.dateRanges.last6Months++;
          } else if (purchaseDate >= lastYear) {
            stats.dateRanges.lastYear++;
          } else {
            stats.dateRanges.older++;
          }
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting filter statistics:', error);
      return {
        total: 0,
        categories: {},
        statuses: {},
        priceRanges: {},
        locations: {},
        dateRanges: {}
      };
    }
  }

  /**
   * Get available filter options
   * @returns {Promise<Object>} Available filter options
   */
  static async getFilterOptions() {
    try {
      const [categoriesSnapshot, equipmentSnapshot] = await Promise.all([
        getDocs(query(
          collection(db, 'equipmentCategories'),
          where('isActive', '==', true),
          orderBy('name')
        )),
        getDocs(query(
          collection(db, this.COLLECTION_NAME),
          where('isActive', '==', true),
          limit(1000)
        ))
      ]);

      const categories = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const equipment = equipmentSnapshot.docs.map(doc => doc.data());

      // Extract unique values
      const brands = [...new Set(equipment.map(item => item.brand).filter(Boolean))].sort();
      const locations = [...new Set(equipment.map(item => item.location?.building).filter(Boolean))].sort();
      const responsiblePersons = [...new Set(
        equipment.map(item => item.responsiblePerson?.name).filter(Boolean)
      )].sort();
      const tags = [...new Set(equipment.flatMap(item => item.tags || []))].sort();

      // Price range
      const prices = equipment.map(item => item.purchasePrice || 0).filter(price => price > 0);
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

      // Date range
      const dates = equipment.map(item => {
        if (item.purchaseDate) {
          return item.purchaseDate.toDate ? item.purchaseDate.toDate() : new Date(item.purchaseDate);
        }
        return null;
      }).filter(Boolean);
      
      const minDate = dates.length > 0 ? new Date(Math.min(...dates)) : null;
      const maxDate = dates.length > 0 ? new Date(Math.max(...dates)) : null;

      return {
        categories,
        brands,
        locations,
        responsiblePersons,
        tags,
        priceRange: {
          min: minPrice,
          max: maxPrice
        },
        dateRange: {
          min: minDate,
          max: maxDate
        }
      };
    } catch (error) {
      console.error('Error getting filter options:', error);
      // Return empty arrays and default values on error
      return {
        categories: [],
        brands: [],
        locations: [],
        responsiblePersons: [],
        tags: [],
        priceRange: { min: 0, max: 0 },
        dateRange: { min: null, max: null }
      };
    }
  }

  /**
   * Save filter preset
   * @param {string} name - Preset name
   * @param {Object} filters - Filter configuration
   * @param {string} userId - User ID
   * @returns {Promise<string>} Preset ID
   */
  static async saveFilterPreset(name, filters, userId) {
    const preset = {
      id: Date.now().toString(),
      name: name.trim(),
      filters,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to localStorage for now (could be moved to Firestore later)
    const existingPresets = JSON.parse(localStorage.getItem('equipment-filter-presets') || '[]');
    const newPresets = [...existingPresets, preset];
    localStorage.setItem('equipment-filter-presets', JSON.stringify(newPresets));

    return preset.id;
  }

  /**
   * Get filter presets for user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Filter presets
   */
  static async getFilterPresets(userId) {
    try {
      const presets = JSON.parse(localStorage.getItem('equipment-filter-presets') || '[]');
      return presets.filter(preset => preset.userId === userId);
    } catch (error) {
      console.error('Error getting filter presets:', error);
      return [];
    }
  }

  /**
   * Delete filter preset
   * @param {string} presetId - Preset ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  static async deleteFilterPreset(presetId, userId) {
    try {
      const presets = JSON.parse(localStorage.getItem('equipment-filter-presets') || '[]');
      const newPresets = presets.filter(preset => 
        !(preset.id === presetId && preset.userId === userId)
      );
      localStorage.setItem('equipment-filter-presets', JSON.stringify(newPresets));
      return true;
    } catch (error) {
      console.error('Error deleting filter preset:', error);
      return false;
    }
  }
}

export default EquipmentFilterService;