/**
 * Property-based tests for Loan Request Filter Accuracy
 * 
 * **Feature: staff-role-system, Property: Loan Request Filter Accuracy**
 * **Validates: Requirements 3.4, 3.5**
 * 
 * Property: For any set of loan requests:
 * - Filtering by status SHALL return only requests with that exact status (Req 3.4)
 * - Searching by borrower name or equipment name SHALL return only matching requests (Req 3.5)
 */

import fc from 'fast-check';
import { LOAN_REQUEST_STATUS } from '../../../types/loanRequest';

/**
 * Pure function to filter loan requests by status
 * This mirrors the filtering logic used in StaffLoanRequestList.js
 * 
 * @param {Array} loanRequests - Array of loan request objects
 * @param {string} statusFilter - Status to filter by (empty string means no filter)
 * @returns {Array} Filtered loan requests
 */
const filterByStatus = (loanRequests, statusFilter) => {
  if (!statusFilter || statusFilter === '') {
    return loanRequests;
  }
  return loanRequests.filter(request => request.status === statusFilter);
};

/**
 * Pure function to search loan requests by borrower name or equipment name
 * This mirrors the search logic used in the loan request system
 * 
 * @param {Array} loanRequests - Array of loan request objects
 * @param {string} searchTerm - Search term (empty string means no search)
 * @returns {Array} Filtered loan requests matching the search
 */
const searchLoanRequests = (loanRequests, searchTerm) => {
  if (!searchTerm || searchTerm.trim() === '') {
    return loanRequests;
  }
  
  const normalizedSearch = searchTerm.toLowerCase().trim();
  
  return loanRequests.filter(request => {
    // Search in borrower name (userName or userSnapshot.displayName)
    const borrowerName = (
      request.userName || 
      request.userSnapshot?.displayName || 
      ''
    ).toLowerCase();
    
    // Search in equipment name (equipmentName or equipmentSnapshot.name)
    const equipmentName = (
      request.equipmentName || 
      request.equipmentSnapshot?.name || 
      ''
    ).toLowerCase();
    
    return borrowerName.includes(normalizedSearch) || 
           equipmentName.includes(normalizedSearch);
  });
};

/**
 * Combined filter and search function
 * 
 * @param {Array} loanRequests - Array of loan request objects
 * @param {string} statusFilter - Status to filter by
 * @param {string} searchTerm - Search term
 * @returns {Array} Filtered and searched loan requests
 */
const filterAndSearchLoanRequests = (loanRequests, statusFilter, searchTerm) => {
  let result = loanRequests;
  result = filterByStatus(result, statusFilter);
  result = searchLoanRequests(result, searchTerm);
  return result;
};

// Generator for valid loan request status
const loanStatusGenerator = fc.constantFrom(
  LOAN_REQUEST_STATUS.PENDING,
  LOAN_REQUEST_STATUS.APPROVED,
  LOAN_REQUEST_STATUS.REJECTED,
  LOAN_REQUEST_STATUS.BORROWED,
  LOAN_REQUEST_STATUS.RETURNED,
  LOAN_REQUEST_STATUS.OVERDUE
);

// Generator for Thai names (common patterns)
const thaiNameGenerator = fc.oneof(
  fc.constant('สมชาย ใจดี'),
  fc.constant('สมหญิง รักเรียน'),
  fc.constant('สมศักดิ์ มานะ'),
  fc.constant('วิชัย สุขสันต์'),
  fc.constant('นภา ดีงาม'),
  fc.string({ minLength: 2, maxLength: 30 })
);

// Generator for equipment names
const equipmentNameGenerator = fc.oneof(
  fc.constant('กล้อง Canon EOS R5'),
  fc.constant('โปรเจคเตอร์ Epson'),
  fc.constant('ไมโครโฟน Shure SM58'),
  fc.constant('โน้ตบุ๊ค Dell XPS'),
  fc.constant('iPad Pro 12.9'),
  fc.string({ minLength: 3, maxLength: 50 })
);

// Generator for a single loan request with user and equipment info
const loanRequestGenerator = fc.record({
  id: fc.uuid(),
  equipmentId: fc.uuid(),
  userId: fc.uuid(),
  status: loanStatusGenerator,
  userName: thaiNameGenerator,
  equipmentName: equipmentNameGenerator,
  userSnapshot: fc.record({
    displayName: thaiNameGenerator,
    email: fc.emailAddress(),
    department: fc.string({ minLength: 2, maxLength: 20 })
  }),
  equipmentSnapshot: fc.record({
    name: equipmentNameGenerator,
    category: fc.string({ minLength: 2, maxLength: 20 }),
    serialNumber: fc.string({ minLength: 5, maxLength: 15 })
  }),
  requestDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }),
  borrowDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }),
  expectedReturnDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }),
  purpose: fc.string({ minLength: 10, maxLength: 100 })
});

// Generator for array of loan requests
const loanRequestsArrayGenerator = fc.array(loanRequestGenerator, { minLength: 0, maxLength: 50 });

// Generator for search terms (substrings of names)
const searchTermGenerator = fc.oneof(
  fc.constant('สม'),
  fc.constant('กล้อง'),
  fc.constant('Canon'),
  fc.constant('โปรเจค'),
  fc.constant('ไมโคร'),
  fc.string({ minLength: 1, maxLength: 10 })
);

describe('Loan Request Filter Accuracy Property Tests', () => {
  /**
   * **Feature: staff-role-system, Property: Loan Request Filter Accuracy**
   * **Validates: Requirements 3.4, 3.5**
   */
  describe('Property: Loan Request Filter Accuracy', () => {
    
    /**
     * Property: Filtering by status SHALL return only requests with that exact status
     * Validates: Requirement 3.4 - Filter loan requests by status
     */
    describe('Status Filtering (Requirement 3.4)', () => {
      
      it('For any status filter, all returned requests SHALL have that exact status', () => {
        fc.assert(
          fc.property(
            loanRequestsArrayGenerator,
            loanStatusGenerator,
            (loanRequests, statusFilter) => {
              const filtered = filterByStatus(loanRequests, statusFilter);
              
              // All filtered results should have the exact status
              filtered.forEach(request => {
                expect(request.status).toBe(statusFilter);
              });
            }
          ),
          { numRuns: 100 }
        );
      });

      it('For any status filter, filtered count SHALL equal count of requests with that status', () => {
        fc.assert(
          fc.property(
            loanRequestsArrayGenerator,
            loanStatusGenerator,
            (loanRequests, statusFilter) => {
              const filtered = filterByStatus(loanRequests, statusFilter);
              
              // Count manually
              const expectedCount = loanRequests.filter(r => r.status === statusFilter).length;
              
              expect(filtered.length).toBe(expectedCount);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('For empty status filter, all requests SHALL be returned', () => {
        fc.assert(
          fc.property(
            loanRequestsArrayGenerator,
            (loanRequests) => {
              const filtered = filterByStatus(loanRequests, '');
              
              expect(filtered.length).toBe(loanRequests.length);
              expect(filtered).toEqual(loanRequests);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('Filtering SHALL be idempotent - filtering twice produces same result', () => {
        fc.assert(
          fc.property(
            loanRequestsArrayGenerator,
            loanStatusGenerator,
            (loanRequests, statusFilter) => {
              const filtered1 = filterByStatus(loanRequests, statusFilter);
              const filtered2 = filterByStatus(filtered1, statusFilter);
              
              expect(filtered1).toEqual(filtered2);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('Filtered results SHALL be a subset of original requests', () => {
        fc.assert(
          fc.property(
            loanRequestsArrayGenerator,
            loanStatusGenerator,
            (loanRequests, statusFilter) => {
              const filtered = filterByStatus(loanRequests, statusFilter);
              
              // Every filtered item should exist in original
              filtered.forEach(filteredItem => {
                const exists = loanRequests.some(original => original.id === filteredItem.id);
                expect(exists).toBe(true);
              });
              
              // Filtered count should not exceed original
              expect(filtered.length).toBeLessThanOrEqual(loanRequests.length);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    /**
     * Property: Searching SHALL return only requests matching borrower or equipment name
     * Validates: Requirement 3.5 - Search by borrower name or equipment name
     */
    describe('Search Filtering (Requirement 3.5)', () => {
      
      it('For any search term, all returned requests SHALL contain the term in borrower or equipment name', () => {
        fc.assert(
          fc.property(
            loanRequestsArrayGenerator,
            searchTermGenerator,
            (loanRequests, searchTerm) => {
              const searched = searchLoanRequests(loanRequests, searchTerm);
              const normalizedSearch = searchTerm.toLowerCase().trim();
              
              if (normalizedSearch === '') {
                // Empty search returns all
                expect(searched.length).toBe(loanRequests.length);
              } else {
                // All results should match the search term
                searched.forEach(request => {
                  const borrowerName = (
                    request.userName || 
                    request.userSnapshot?.displayName || 
                    ''
                  ).toLowerCase();
                  const equipmentName = (
                    request.equipmentName || 
                    request.equipmentSnapshot?.name || 
                    ''
                  ).toLowerCase();
                  
                  const matches = borrowerName.includes(normalizedSearch) || 
                                  equipmentName.includes(normalizedSearch);
                  expect(matches).toBe(true);
                });
              }
            }
          ),
          { numRuns: 100 }
        );
      });

      it('For empty search term, all requests SHALL be returned', () => {
        fc.assert(
          fc.property(
            loanRequestsArrayGenerator,
            (loanRequests) => {
              const searched = searchLoanRequests(loanRequests, '');
              
              expect(searched.length).toBe(loanRequests.length);
              expect(searched).toEqual(loanRequests);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('For whitespace-only search term, all requests SHALL be returned', () => {
        fc.assert(
          fc.property(
            loanRequestsArrayGenerator,
            fc.constantFrom('   ', '  ', ' ', '\t', '\n', '  \t  '),
            (loanRequests, whitespace) => {
              const searched = searchLoanRequests(loanRequests, whitespace);
              
              expect(searched.length).toBe(loanRequests.length);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('Search SHALL be case-insensitive', () => {
        const testRequests = [
          { id: '1', userName: 'สมชาย ใจดี', equipmentName: 'Canon EOS R5' },
          { id: '2', userName: 'SOMCHAI', equipmentName: 'CANON camera' },
          { id: '3', userName: 'somchai', equipmentName: 'canon lens' }
        ];
        
        const upperSearch = searchLoanRequests(testRequests, 'CANON');
        const lowerSearch = searchLoanRequests(testRequests, 'canon');
        const mixedSearch = searchLoanRequests(testRequests, 'Canon');
        
        expect(upperSearch.length).toBe(lowerSearch.length);
        expect(lowerSearch.length).toBe(mixedSearch.length);
      });

      it('Searched results SHALL be a subset of original requests', () => {
        fc.assert(
          fc.property(
            loanRequestsArrayGenerator,
            searchTermGenerator,
            (loanRequests, searchTerm) => {
              const searched = searchLoanRequests(loanRequests, searchTerm);
              
              // Every searched item should exist in original
              searched.forEach(searchedItem => {
                const exists = loanRequests.some(original => original.id === searchedItem.id);
                expect(exists).toBe(true);
              });
              
              // Searched count should not exceed original
              expect(searched.length).toBeLessThanOrEqual(loanRequests.length);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    /**
     * Combined Filter and Search Tests
     * Validates: Requirements 3.4 and 3.5 together
     */
    describe('Combined Status Filter and Search', () => {
      
      it('Combined filter and search SHALL satisfy both conditions', () => {
        fc.assert(
          fc.property(
            loanRequestsArrayGenerator,
            loanStatusGenerator,
            searchTermGenerator,
            (loanRequests, statusFilter, searchTerm) => {
              const result = filterAndSearchLoanRequests(loanRequests, statusFilter, searchTerm);
              const normalizedSearch = searchTerm.toLowerCase().trim();
              
              result.forEach(request => {
                // Should match status filter
                expect(request.status).toBe(statusFilter);
                
                // Should match search term (if not empty)
                if (normalizedSearch !== '') {
                  const borrowerName = (
                    request.userName || 
                    request.userSnapshot?.displayName || 
                    ''
                  ).toLowerCase();
                  const equipmentName = (
                    request.equipmentName || 
                    request.equipmentSnapshot?.name || 
                    ''
                  ).toLowerCase();
                  
                  const matches = borrowerName.includes(normalizedSearch) || 
                                  equipmentName.includes(normalizedSearch);
                  expect(matches).toBe(true);
                }
              });
            }
          ),
          { numRuns: 100 }
        );
      });

      it('Order of filter and search SHALL not affect result', () => {
        fc.assert(
          fc.property(
            loanRequestsArrayGenerator,
            loanStatusGenerator,
            searchTermGenerator,
            (loanRequests, statusFilter, searchTerm) => {
              // Filter then search
              const filterFirst = searchLoanRequests(
                filterByStatus(loanRequests, statusFilter),
                searchTerm
              );
              
              // Search then filter
              const searchFirst = filterByStatus(
                searchLoanRequests(loanRequests, searchTerm),
                statusFilter
              );
              
              // Results should be the same (same IDs)
              const filterFirstIds = filterFirst.map(r => r.id).sort();
              const searchFirstIds = searchFirst.map(r => r.id).sort();
              
              expect(filterFirstIds).toEqual(searchFirstIds);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('Combined result SHALL be subset of both individual filter results', () => {
        fc.assert(
          fc.property(
            loanRequestsArrayGenerator,
            loanStatusGenerator,
            searchTermGenerator,
            (loanRequests, statusFilter, searchTerm) => {
              const combined = filterAndSearchLoanRequests(loanRequests, statusFilter, searchTerm);
              const statusOnly = filterByStatus(loanRequests, statusFilter);
              const searchOnly = searchLoanRequests(loanRequests, searchTerm);
              
              // Combined should be subset of status-only
              combined.forEach(item => {
                const inStatusOnly = statusOnly.some(s => s.id === item.id);
                expect(inStatusOnly).toBe(true);
              });
              
              // Combined should be subset of search-only
              combined.forEach(item => {
                const inSearchOnly = searchOnly.some(s => s.id === item.id);
                expect(inSearchOnly).toBe(true);
              });
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });

  /**
   * Edge Cases and Boundary Tests
   */
  describe('Filter Edge Cases', () => {
    
    it('Empty loan requests array SHALL return empty for any filter', () => {
      const emptyRequests = [];
      
      Object.values(LOAN_REQUEST_STATUS).forEach(status => {
        const filtered = filterByStatus(emptyRequests, status);
        expect(filtered).toEqual([]);
      });
      
      const searched = searchLoanRequests(emptyRequests, 'test');
      expect(searched).toEqual([]);
    });

    it('Requests with missing userName/equipmentName SHALL not cause errors', () => {
      const requestsWithMissingFields = [
        { id: '1', status: LOAN_REQUEST_STATUS.PENDING },
        { id: '2', status: LOAN_REQUEST_STATUS.PENDING, userName: null },
        { id: '3', status: LOAN_REQUEST_STATUS.PENDING, equipmentName: undefined },
        { id: '4', status: LOAN_REQUEST_STATUS.PENDING, userSnapshot: null },
        { id: '5', status: LOAN_REQUEST_STATUS.PENDING, equipmentSnapshot: {} }
      ];
      
      // Should not throw
      expect(() => searchLoanRequests(requestsWithMissingFields, 'test')).not.toThrow();
      expect(() => filterByStatus(requestsWithMissingFields, LOAN_REQUEST_STATUS.PENDING)).not.toThrow();
    });

    it('Special characters in search term SHALL be handled safely', () => {
      const requests = [
        { id: '1', userName: 'Test User', equipmentName: 'Camera (Canon)' },
        { id: '2', userName: 'User [Admin]', equipmentName: 'Lens 50mm' }
      ];
      
      // These should not throw
      expect(() => searchLoanRequests(requests, '(Canon)')).not.toThrow();
      expect(() => searchLoanRequests(requests, '[Admin]')).not.toThrow();
      expect(() => searchLoanRequests(requests, '.*')).not.toThrow();
      expect(() => searchLoanRequests(requests, '$^')).not.toThrow();
    });

    it('Very long search terms SHALL be handled', () => {
      fc.assert(
        fc.property(
          loanRequestsArrayGenerator,
          fc.string({ minLength: 100, maxLength: 500 }),
          (loanRequests, longSearchTerm) => {
            // Should not throw and should return valid result
            const result = searchLoanRequests(loanRequests, longSearchTerm);
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeLessThanOrEqual(loanRequests.length);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('Invalid status filter SHALL return empty array', () => {
      const requests = [
        { id: '1', status: LOAN_REQUEST_STATUS.PENDING },
        { id: '2', status: LOAN_REQUEST_STATUS.APPROVED }
      ];
      
      const filtered = filterByStatus(requests, 'invalid_status');
      expect(filtered).toEqual([]);
    });
  });
});
