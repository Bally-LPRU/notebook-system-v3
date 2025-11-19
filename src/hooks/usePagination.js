import { useState, useMemo, useCallback } from 'react';

/**
 * Custom hook for managing pagination logic.
 * 
 * Provides a complete pagination solution with automatic calculation of page boundaries,
 * navigation functions, and state management. Handles edge cases like empty arrays and
 * ensures page numbers never exceed valid bounds.
 * 
 * **Features:**
 * - Automatic page calculation and item slicing
 * - Boundary-safe navigation (never exceeds valid page range)
 * - Memoized calculations for performance
 * - Reset functionality for filter changes
 * - Complete pagination metadata
 * 
 * **Usage:**
 * ```jsx
 * function EquipmentList({ equipment }) {
 *   const {
 *     paginatedItems,
 *     currentPage,
 *     totalPages,
 *     nextPage,
 *     previousPage,
 *     goToPage
 *   } = usePagination(equipment, 20);
 *   
 *   return (
 *     <>
 *       {paginatedItems.map(item => <EquipmentCard key={item.id} {...item} />)}
 *       <Pagination 
 *         current={currentPage}
 *         total={totalPages}
 *         onNext={nextPage}
 *         onPrevious={previousPage}
 *         onGoTo={goToPage}
 *       />
 *     </>
 *   );
 * }
 * ```
 * 
 * @hook
 * @param {Array} items - Complete array of items to paginate
 * @param {number} [itemsPerPage=10] - Number of items to display per page
 * @returns {Object} Pagination state and navigation functions
 * @returns {number} returns.currentPage - Current page number (1-indexed)
 * @returns {number} returns.totalPages - Total number of pages
 * @returns {number} returns.totalItems - Total number of items
 * @returns {number} returns.startIndex - Start index of current page in items array
 * @returns {number} returns.endIndex - End index of current page in items array
 * @returns {Array} returns.paginatedItems - Items for the current page
 * @returns {boolean} returns.hasNextPage - Whether there is a next page
 * @returns {boolean} returns.hasPreviousPage - Whether there is a previous page
 * @returns {boolean} returns.isFirstPage - Whether on first page
 * @returns {boolean} returns.isLastPage - Whether on last page
 * @returns {Function} returns.goToPage - Navigate to specific page (1-indexed)
 * @returns {Function} returns.nextPage - Navigate to next page (respects upper boundary)
 * @returns {Function} returns.previousPage - Navigate to previous page (respects lower boundary)
 * @returns {Function} returns.resetPage - Reset to page 1 (useful after filtering)
 * @returns {Function} returns.goToFirstPage - Navigate to first page
 * @returns {Function} returns.goToLastPage - Navigate to last page
 */
export const usePagination = (items, itemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1);

  // คำนวณข้อมูล pagination
  const paginationData = useMemo(() => {
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = items.slice(startIndex, endIndex);

    return {
      currentPage,
      totalPages,
      totalItems,
      startIndex,
      endIndex,
      paginatedItems,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
      isFirstPage: currentPage === 1,
      isLastPage: currentPage === totalPages
    };
  }, [items, currentPage, itemsPerPage]);

  // ไปหน้าที่ระบุ
  const goToPage = useCallback((page) => {
    const validPage = Math.max(1, Math.min(page, paginationData.totalPages));
    setCurrentPage(validPage);
  }, [paginationData.totalPages]);

  // ไปหน้าถัดไป
  const nextPage = useCallback(() => {
    setCurrentPage(prev => {
      const totalPages = Math.ceil(items.length / itemsPerPage);
      return prev < totalPages ? prev + 1 : prev;
    });
  }, [items.length, itemsPerPage]);

  // ไปหน้าก่อนหน้า
  const previousPage = useCallback(() => {
    setCurrentPage(prev => prev > 1 ? prev - 1 : prev);
  }, []);

  // รีเซ็ตไปหน้าแรก
  const resetPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  // ไปหน้าแรก
  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  // ไปหน้าสุดท้าย
  const goToLastPage = useCallback(() => {
    setCurrentPage(paginationData.totalPages);
  }, [paginationData.totalPages]);

  return {
    ...paginationData,
    setCurrentPage: goToPage,
    goToPage,
    nextPage,
    previousPage,
    resetPage,
    goToFirstPage,
    goToLastPage
  };
};

export default usePagination;
