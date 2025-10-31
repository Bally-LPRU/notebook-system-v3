import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

class SavedSearchService {
  /**
   * Get all saved searches for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of saved searches
   */
  static async getSavedSearches(userId) {
    try {
      const savedSearchesRef = collection(db, 'savedSearches');
      const q = query(
        savedSearchesRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const savedSearches = [];
      
      querySnapshot.forEach((doc) => {
        savedSearches.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        });
      });
      
      return savedSearches;
    } catch (error) {
      console.error('Error getting saved searches:', error);
      throw error;
    }
  }

  /**
   * Save a new search
   * @param {string} userId - User ID
   * @param {Object} searchData - Search data
   * @returns {Promise<string>} Document ID of the saved search
   */
  static async saveSearch(userId, searchData) {
    try {
      const savedSearchesRef = collection(db, 'savedSearches');
      
      const searchDoc = {
        userId,
        name: searchData.name,
        type: searchData.type,
        filters: searchData.filters,
        description: searchData.description || '',
        isPublic: searchData.isPublic || false,
        tags: searchData.tags || [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(savedSearchesRef, searchDoc);
      return docRef.id;
    } catch (error) {
      console.error('Error saving search:', error);
      throw error;
    }
  }

  /**
   * Update a saved search
   * @param {string} searchId - Search ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<void>}
   */
  static async updateSavedSearch(searchId, updateData) {
    try {
      const searchRef = doc(db, 'savedSearches', searchId);
      
      await updateDoc(searchRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating saved search:', error);
      throw error;
    }
  }

  /**
   * Delete a saved search
   * @param {string} searchId - Search ID
   * @returns {Promise<void>}
   */
  static async deleteSavedSearch(searchId) {
    try {
      const searchRef = doc(db, 'savedSearches', searchId);
      await deleteDoc(searchRef);
    } catch (error) {
      console.error('Error deleting saved search:', error);
      throw error;
    }
  }

  /**
   * Get public saved searches (shared by other users)
   * @param {string} searchType - Type of search (equipment, loans, etc.)
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Array>} Array of public saved searches
   */
  static async getPublicSavedSearches(searchType = null, limit = 20) {
    try {
      const savedSearchesRef = collection(db, 'savedSearches');
      let q = query(
        savedSearchesRef,
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      if (searchType) {
        q = query(
          savedSearchesRef,
          where('isPublic', '==', true),
          where('type', '==', searchType),
          orderBy('createdAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      const publicSearches = [];
      
      querySnapshot.forEach((doc) => {
        publicSearches.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        });
      });
      
      return publicSearches.slice(0, limit);
    } catch (error) {
      console.error('Error getting public saved searches:', error);
      throw error;
    }
  }

  /**
   * Search saved searches by name or tags
   * @param {string} userId - User ID
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Array of matching saved searches
   */
  static async searchSavedSearches(userId, searchTerm) {
    try {
      // Get all user's saved searches first (Firestore doesn't support full-text search)
      const allSearches = await this.getSavedSearches(userId);
      
      // Filter by search term
      const filteredSearches = allSearches.filter(search => {
        const nameMatch = search.name.toLowerCase().includes(searchTerm.toLowerCase());
        const descriptionMatch = search.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const tagMatch = search.tags?.some(tag => 
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        return nameMatch || descriptionMatch || tagMatch;
      });
      
      return filteredSearches;
    } catch (error) {
      console.error('Error searching saved searches:', error);
      throw error;
    }
  }

  /**
   * Get saved searches by type
   * @param {string} userId - User ID
   * @param {string} searchType - Type of search
   * @returns {Promise<Array>} Array of saved searches
   */
  static async getSavedSearchesByType(userId, searchType) {
    try {
      const savedSearchesRef = collection(db, 'savedSearches');
      const q = query(
        savedSearchesRef,
        where('userId', '==', userId),
        where('type', '==', searchType),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const savedSearches = [];
      
      querySnapshot.forEach((doc) => {
        savedSearches.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        });
      });
      
      return savedSearches;
    } catch (error) {
      console.error('Error getting saved searches by type:', error);
      throw error;
    }
  }

  /**
   * Duplicate a saved search
   * @param {string} userId - User ID
   * @param {string} searchId - Search ID to duplicate
   * @param {string} newName - New name for the duplicated search
   * @returns {Promise<string>} Document ID of the new saved search
   */
  static async duplicateSavedSearch(userId, searchId, newName) {
    try {
      // Get the original search
      const originalSearches = await this.getSavedSearches(userId);
      const originalSearch = originalSearches.find(search => search.id === searchId);
      
      if (!originalSearch) {
        throw new Error('ไม่พบการค้นหาที่ต้องการคัดลอก');
      }
      
      // Create a new search with the same filters
      const newSearchData = {
        name: newName,
        type: originalSearch.type,
        filters: { ...originalSearch.filters },
        description: `คัดลอกจาก: ${originalSearch.name}`,
        isPublic: false,
        tags: [...(originalSearch.tags || [])]
      };
      
      return await this.saveSearch(userId, newSearchData);
    } catch (error) {
      console.error('Error duplicating saved search:', error);
      throw error;
    }
  }

  /**
   * Get search statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Search statistics
   */
  static async getSearchStats(userId) {
    try {
      const savedSearches = await this.getSavedSearches(userId);
      
      const stats = {
        total: savedSearches.length,
        byType: {},
        public: savedSearches.filter(search => search.isPublic).length,
        private: savedSearches.filter(search => !search.isPublic).length,
        recentlyUsed: savedSearches.filter(search => {
          const daysSinceUpdate = (new Date() - search.updatedAt) / (1000 * 60 * 60 * 24);
          return daysSinceUpdate <= 7;
        }).length
      };
      
      // Count by type
      savedSearches.forEach(search => {
        stats.byType[search.type] = (stats.byType[search.type] || 0) + 1;
      });
      
      return stats;
    } catch (error) {
      console.error('Error getting search stats:', error);
      throw error;
    }
  }

  /**
   * Export saved searches to JSON
   * @param {string} userId - User ID
   * @returns {Promise<string>} JSON string of saved searches
   */
  static async exportSavedSearches(userId) {
    try {
      const savedSearches = await this.getSavedSearches(userId);
      
      const exportData = {
        exportDate: new Date().toISOString(),
        userId,
        searches: savedSearches.map(search => ({
          name: search.name,
          type: search.type,
          filters: search.filters,
          description: search.description,
          tags: search.tags,
          createdAt: search.createdAt?.toISOString(),
          updatedAt: search.updatedAt?.toISOString()
        }))
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting saved searches:', error);
      throw error;
    }
  }

  /**
   * Import saved searches from JSON
   * @param {string} userId - User ID
   * @param {string} jsonData - JSON string of saved searches
   * @returns {Promise<Array>} Array of imported search IDs
   */
  static async importSavedSearches(userId, jsonData) {
    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.searches || !Array.isArray(importData.searches)) {
        throw new Error('รูปแบบข้อมูลไม่ถูกต้อง');
      }
      
      const importedIds = [];
      
      for (const searchData of importData.searches) {
        try {
          const searchId = await this.saveSearch(userId, {
            name: `${searchData.name} (นำเข้า)`,
            type: searchData.type,
            filters: searchData.filters,
            description: searchData.description,
            tags: searchData.tags || []
          });
          
          importedIds.push(searchId);
        } catch (error) {
          console.error('Error importing search:', searchData.name, error);
        }
      }
      
      return importedIds;
    } catch (error) {
      console.error('Error importing saved searches:', error);
      throw error;
    }
  }
}

export default SavedSearchService;