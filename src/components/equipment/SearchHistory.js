import { ClockIcon, BookmarkIcon, XMarkIcon } from '@heroicons/react/24/outline';

const SearchHistory = ({
  history = [],
  savedSearches = [],
  selectedIndex,
  onHistoryClick,
  onSavedSearchClick,
  onDeleteSavedSearch,
  onClearHistory
}) => {
  const hasHistory = history.length > 0;
  const hasSavedSearches = savedSearches.length > 0;
  
  if (!hasHistory && !hasSavedSearches) {
    return null;
  }

  return (
    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
      <div className="py-2">
        {/* Saved Searches Section */}
        {hasSavedSearches && (
          <>
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
              การค้นหาที่บันทึกไว้
            </div>
            {savedSearches.map((savedSearch, index) => (
              <div
                key={savedSearch.id}
                className={`group flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors ${
                  index === selectedIndex ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                }`}
              >
                <button
                  onClick={() => onSavedSearchClick(savedSearch)}
                  className="flex-1 flex items-center space-x-3 text-left min-w-0"
                >
                  <BookmarkIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {savedSearch.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {savedSearch.query}
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => onDeleteSavedSearch(savedSearch.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-all"
                  title="ลบการค้นหาที่บันทึกไว้"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
            {hasHistory && <div className="border-b border-gray-100 my-2" />}
          </>
        )}

        {/* Search History Section */}
        {hasHistory && (
          <>
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                ประวัติการค้นหา
              </div>
              <button
                onClick={onClearHistory}
                className="text-xs text-gray-400 hover:text-red-600 transition-colors"
                title="ล้างประวัติการค้นหา"
              >
                ล้างทั้งหมด
              </button>
            </div>
            {history.map((historyItem, index) => {
              const adjustedIndex = hasSavedSearches ? index + savedSearches.length : index;
              return (
                <button
                  key={index}
                  onClick={() => onHistoryClick(historyItem)}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors ${
                    adjustedIndex === selectedIndex ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <ClockIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="text-sm text-gray-700 truncate">
                      {historyItem}
                    </div>
                  </div>
                </button>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchHistory;