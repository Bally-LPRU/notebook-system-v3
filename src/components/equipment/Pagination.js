import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon
} from '@heroicons/react/24/outline';

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 20,
  onPageChange,
  loading = false,
  showFirstLast = true,
  showInfo = true,
  maxVisiblePages = 5,
  className = ""
}) => {
  // Don't render if only one page or no pages
  if (totalPages <= 1) return null;

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const pages = [];
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) pages.push('...');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className={`bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 ${className}`}>
      {/* Mobile Pagination */}
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || loading}
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ก่อนหน้า
        </button>
        <span className="text-sm text-gray-700 flex items-center">
          หน้า {currentPage} จาก {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || loading}
          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ถัดไป
        </button>
      </div>
      
      {/* Desktop Pagination */}
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        {/* Results Info */}
        {showInfo && (
          <div>
            <p className="text-sm text-gray-700">
              แสดง <span className="font-medium">{startItem.toLocaleString()}</span> ถึง{' '}
              <span className="font-medium">{endItem.toLocaleString()}</span>{' '}
              จาก <span className="font-medium">{totalItems.toLocaleString()}</span> รายการ
            </p>
          </div>
        )}
        
        {/* Pagination Controls */}
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            {/* First Page */}
            {showFirstLast && (
              <button
                onClick={() => onPageChange(1)}
                disabled={currentPage <= 1 || loading}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="หน้าแรก"
              >
                <span className="sr-only">หน้าแรก</span>
                <ChevronDoubleLeftIcon className="h-5 w-5" />
              </button>
            )}
            
            {/* Previous Page */}
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
              className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                !showFirstLast ? 'rounded-l-md' : ''
              }`}
              title="ก่อนหน้า"
            >
              <span className="sr-only">ก่อนหน้า</span>
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            
            {/* Page Numbers */}
            {generatePageNumbers().map((page, index) => {
              if (typeof page === 'string') {
                return (
                  <span
                    key={index}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                  >
                    {page}
                  </span>
                );
              }
              
              return (
                <button
                  key={index}
                  onClick={() => onPageChange(page)}
                  disabled={loading}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors ${
                    page === currentPage
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  aria-current={page === currentPage ? 'page' : undefined}
                >
                  {page}
                </button>
              );
            })}
            
            {/* Next Page */}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || loading}
              className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                !showFirstLast ? 'rounded-r-md' : ''
              }`}
              title="ถัดไป"
            >
              <span className="sr-only">ถัดไป</span>
              <ChevronRightIcon className="h-5 w-5" />
            </button>
            
            {/* Last Page */}
            {showFirstLast && (
              <button
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage >= totalPages || loading}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="หน้าสุดท้าย"
              >
                <span className="sr-only">หน้าสุดท้าย</span>
                <ChevronDoubleRightIcon className="h-5 w-5" />
              </button>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Pagination;