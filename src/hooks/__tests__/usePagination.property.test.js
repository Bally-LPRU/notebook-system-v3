import { renderHook, act } from '@testing-library/react';
import fc from 'fast-check';
import { usePagination } from '../usePagination';

describe('usePagination property-based tests', () => {
  // **Feature: code-cleanup-refactoring, Property 4: Pagination returns correct page items**
  describe('Property 4: Pagination returns correct page items', () => {
    it('should return correct subset of items for any valid page', () => {
      fc.assert(
        fc.property(
          // Generate random array of items (1-100 items)
          fc.array(fc.integer(), { minLength: 1, maxLength: 100 }),
          // Generate random page size (1-20)
          fc.integer({ min: 1, max: 20 }),
          (items, pageSize) => {
            const totalPages = Math.ceil(items.length / pageSize);
            
            // Generate valid page number (1 to totalPages)
            fc.assert(
              fc.property(
                fc.integer({ min: 1, max: Math.max(1, totalPages) }),
                (pageNumber) => {
                  const { result } = renderHook(() => usePagination(items, pageSize));
                  
                  // Navigate to the test page
                  act(() => {
                    result.current.goToPage(pageNumber);
                  });
                  
                  // Calculate expected slice
                  const startIndex = (pageNumber - 1) * pageSize;
                  const endIndex = startIndex + pageSize;
                  const expectedItems = items.slice(startIndex, endIndex);
                  
                  // Assert the paginated items match expected slice
                  expect(result.current.paginatedItems).toEqual(expectedItems);
                  expect(result.current.currentPage).toBe(pageNumber);
                  expect(result.current.totalPages).toBe(totalPages);
                }
              ),
              { numRuns: 10 }
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty arrays gracefully', () => {
      const { result } = renderHook(() => usePagination([], 10));
      
      expect(result.current.paginatedItems).toEqual([]);
      expect(result.current.totalPages).toBe(0);
      expect(result.current.currentPage).toBe(1);
    });
  });

  // **Feature: code-cleanup-refactoring, Property 5: Next page respects upper boundary**
  describe('Property 5: Next page respects upper boundary', () => {
    it('should never exceed totalPages when calling nextPage', () => {
      fc.assert(
        fc.property(
          // Generate random array of items (1-100 items)
          fc.array(fc.integer(), { minLength: 1, maxLength: 100 }),
          // Generate random page size (1-20)
          fc.integer({ min: 1, max: 20 }),
          // Generate number of nextPage calls (0-50)
          fc.integer({ min: 0, max: 50 }),
          (items, pageSize, nextPageCalls) => {
            const { result } = renderHook(() => usePagination(items, pageSize));
            const totalPages = Math.ceil(items.length / pageSize);
            
            // Call nextPage multiple times
            act(() => {
              for (let i = 0; i < nextPageCalls; i++) {
                result.current.nextPage();
              }
            });
            
            // Assert currentPage never exceeds totalPages
            expect(result.current.currentPage).toBeLessThanOrEqual(totalPages);
            expect(result.current.currentPage).toBeGreaterThanOrEqual(1);
            
            // If we're at the last page, hasNextPage should be false
            if (result.current.currentPage === totalPages) {
              expect(result.current.hasNextPage).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should stay on last page when nextPage is called repeatedly', () => {
      const items = [1, 2, 3, 4, 5];
      const { result } = renderHook(() => usePagination(items, 2));
      
      // totalPages should be 3 (5 items / 2 per page = 2.5, rounded up to 3)
      expect(result.current.totalPages).toBe(3);
      
      // Navigate to last page and beyond
      act(() => {
        result.current.goToLastPage();
        result.current.nextPage();
        result.current.nextPage();
        result.current.nextPage();
      });
      
      expect(result.current.currentPage).toBe(3);
      expect(result.current.hasNextPage).toBe(false);
    });
  });

  // **Feature: code-cleanup-refactoring, Property 6: Previous page respects lower boundary**
  describe('Property 6: Previous page respects lower boundary', () => {
    it('should never go below page 1 when calling previousPage', () => {
      fc.assert(
        fc.property(
          // Generate random array of items (1-100 items)
          fc.array(fc.integer(), { minLength: 1, maxLength: 100 }),
          // Generate random page size (1-20)
          fc.integer({ min: 1, max: 20 }),
          // Generate starting page number
          fc.integer({ min: 1, max: 10 }),
          // Generate number of previousPage calls (0-50)
          fc.integer({ min: 0, max: 50 }),
          (items, pageSize, startPage, previousPageCalls) => {
            const { result } = renderHook(() => usePagination(items, pageSize));
            const totalPages = Math.ceil(items.length / pageSize);
            const validStartPage = Math.min(startPage, totalPages);
            
            // Navigate to starting page
            act(() => {
              result.current.goToPage(validStartPage);
            });
            
            // Call previousPage multiple times
            act(() => {
              for (let i = 0; i < previousPageCalls; i++) {
                result.current.previousPage();
              }
            });
            
            // Assert currentPage never goes below 1
            expect(result.current.currentPage).toBeGreaterThanOrEqual(1);
            expect(result.current.currentPage).toBeLessThanOrEqual(totalPages);
            
            // If we're at the first page, hasPreviousPage should be false
            if (result.current.currentPage === 1) {
              expect(result.current.hasPreviousPage).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should stay on first page when previousPage is called repeatedly', () => {
      const items = [1, 2, 3, 4, 5];
      const { result } = renderHook(() => usePagination(items, 2));
      
      // Try to go before first page
      act(() => {
        result.current.previousPage();
        result.current.previousPage();
        result.current.previousPage();
      });
      
      expect(result.current.currentPage).toBe(1);
      expect(result.current.hasPreviousPage).toBe(false);
    });
  });

  // Additional property: resetPage always returns to page 1
  describe('Additional property: resetPage functionality', () => {
    it('should always return to page 1 when resetPage is called', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer(), { minLength: 1, maxLength: 100 }),
          fc.integer({ min: 1, max: 20 }),
          fc.integer({ min: 1, max: 10 }),
          (items, pageSize, targetPage) => {
            const { result } = renderHook(() => usePagination(items, pageSize));
            const totalPages = Math.ceil(items.length / pageSize);
            const validTargetPage = Math.min(targetPage, totalPages);
            
            // Navigate to some page
            act(() => {
              result.current.goToPage(validTargetPage);
            });
            
            // Reset to first page
            act(() => {
              result.current.resetPage();
            });
            
            expect(result.current.currentPage).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
