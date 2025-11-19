/**
 * Loan Request Search Service
 * 
 * Enhanced search service for loan requests with proper pagination support.
 * Uses Firestore search keywords for efficient server-side filtering.
 */

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  startAfter,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { LOAN_REQUEST_PAGINATION } from '../types/loanRequest';

class LoanRequestSearchService {
  static COLLECTION_NAME = 'loanRequests';

  /**
   * Generate search keywords from loan request data
   * @param {Object} loanRequestData - Loan request data
   * @param {Object} equipment - Equipment data
   * @param {Object} user - User data
   * @returns {Array<string>} Search keywords
   */
  static generateSearchKeywords(loanRequestData, equipment = null, user = null) {
    const keywords = new Set();

    // Add keywords from purpose
    if (loanRequestData.purpose) {
      this.addKeywords(keywords, loanRequestData.purpose);
    }

    // Add keywords from equipment
    if (equipment) {
      this.addKeywords(keywords, equipment.name);
      this.addKeywords(keywords, equipment.brand);
      this.addKeywords(keywords, equipment.model);
      this.addKeywords(keywords, equipment.category);
    }

    // Add keywords from user
    if (user) {
      this.addKeywords(keywords, user.firstName);
      this.addKeywords(keywords, user.lastName);
      this.addKeywords(keywords, user.displayName);
      this.addKeywords(keywords, user.email);
    }

    return Array.from(keywords).filter(keyword => keyword.length >= 2);
  }

  /**
   * Add keywords from text
   * @param {Set} keywords - Keywords set
   * @param {string} text - Text to extract keywords from
   */
  static addKeywords(keywords, text) {
    if (!text) return;
    
    const words = text.toLowerCase()
      .replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length >= 2);
    
    words.forEach(word => keywords.add(word));
  }

  /**
   * Build search query with proper pagination
   * @param {Object} filters - Search filters
   * @returns {Object} Query and constraints
   */
  static buildSearchQuery(filters = {}) {
    const {
      search = '',
      status = '',
      userId = '',
      equipmentId = '',
      dateRange = null,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit: pageLimit = LOAN_REQUEST_PAGINATION.DEFAULT_LIMIT,
      lastDoc = null
    } = filters;

    const limit = Math.min(pageLimit, LOAN_REQUEST_PAGINATION.MAX_LIMIT);
    const queryConstraints = [];

    // Status filter
    if (status) {
      queryConstraints.push(where('status', '==', status));
    }

    // User filter
    if (userId) {
      queryConstraints.push(where('userId', '==', userId));
    }

    // Equipment filter
    if (equipmentId) {
      queryConstraints.push(where('equipmentId', '==', equipmentId));
    }

    // Date range filter
    if (dateRange) {
      if (dateRange.start) {
        queryConstraints.push(where('borrowDate', '>=', Timestamp.fromDate(new Date(dateRange.start))));
      }
      if (dateRange.end) {
        queryConstraints.push(where('borrowDate', '<=', Timestamp.fromDate(new Date(dateRange.end))));
      }
    }

    // Search filter using keywords (server-side)
    if (search && search.length >= 2) {
      const searchKeywords = this.generateSearchKeywordsFromQuery(search);
      if (searchKeywords.length > 0) {
        // Use array-contains-any for keyword search (max 10 keywords)
        const limitedKeywords = searchKeywords.slice(0, 10);
        queryConstraints.push(where('searchKeywords', 'array-contains-any', limitedKeywords));
      }
    }

    // Sorting
    // Note: If using array-contains-any, we need to be careful with orderBy
    // Firestore requires the field in array-contains-any to be in the orderBy
    if (!search || search.length < 2) {
      queryConstraints.push(orderBy(sortBy, sortOrder));
    } else {
      // When searching, sort by createdAt only
      queryConstraints.push(orderBy('createdAt', 'desc'));
    }

    // Pagination
    if (lastDoc) {
      queryConstraints.push(startAfter(lastDoc));
    }

    queryConstraints.push(firestoreLimit(limit + 1)); // Get one extra

    return {
      queryConstraints,
      limit
    };
  }

  /**
   * Generate search keywords from search query
   * @param {string} searchQuery - Search query string
   * @returns {Array<string>} Search keywords
   */
  static generateSearchKeywordsFromQuery(searchQuery) {
    const keywords = new Set();
    this.addKeywords(keywords, searchQuery);
    return Array.from(keywords);
  }

  /**
   * Search loan requests with proper pagination
   * @param {Object} filters - Search filters
   * @returns {Promise<Object>} Search results with pagination
   */
  static async searchLoanRequests(filters = {}) {
    try {
      const { queryConstraints, limit } = this.buildSearchQuery(filters);
      
      // Build and execute query
      const loanRequestQuery = query(
        collection(db, this.COLLECTION_NAME),
        ...queryConstraints
      );

      const querySnapshot = await getDocs(loanRequestQuery);
      const loanRequests = [];
      let hasNextPage = false;

      querySnapshot.forEach((doc, index) => {
        if (index < limit) {
          loanRequests.push({
            id: doc.id,
            ...doc.data()
          });
        } else {
          hasNextPage = true;
        }
      });

      return {
        loanRequests,
        hasNextPage,
        lastDoc: loanRequests.length > 0 
          ? querySnapshot.docs[Math.min(loanRequests.length - 1, limit - 1)] 
          : null,
        totalFetched: loanRequests.length
      };
    } catch (error) {
      console.error('Error searching loan requests:', error);
      throw error;
    }
  }

  /**
   * Get suggested search terms based on recent searches
   * @param {string} userId - User ID
   * @param {number} limit - Number of suggestions
   * @returns {Promise<Array<string>>} Suggested search terms
   */
  static async getSearchSuggestions(userId, limit = 5) {
    try {
      // This would typically come from a search history collection
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  }

  /**
   * Save search query to history
   * @param {string} userId - User ID
   * @param {string} searchQuery - Search query
   * @returns {Promise<void>}
   */
  static async saveSearchHistory(userId, searchQuery) {
    try {
      // This would save to a search history collection
      // Implementation depends on requirements
      console.log('Search history saved:', { userId, searchQuery });
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }
}

export default LoanRequestSearchService;
