import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const SearchHistory = ({ 
  onSearchSelect,
  maxItems = 10,
  searchType = 'all'
}) => {
  const { user } = useAuth();
  const [searchHistory, setSearchHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadSearchHistory();
  }, [user?.uid, searchType]);

  const loadSearchHistory = () => {
    if (!user?.uid) return;

    const storageKey = `searchHistory_${user.uid}_${searchType}`;
    const saved = localStorage.getItem(storageKey);
    
    if (saved) {
      try {
        const history = JSON.parse(saved);
        setSearchHistory(history.slice(0, maxItems));
      } catch (error) {
        console.error('Error parsing search history:', error);
      }
    }
  };

  const addToHistory = (searchData) => {
    if (!user?.uid || !searchData.query) return;

    const storageKey = `searchHistory_${user.uid}_${searchType}`;
    const newEntry = {
      id: Date.now().toString(),
      query: searchData.query,
      filters: searchData.filters || {},
      timestamp: new Date().toISOString(),
      type: searchData.type || searchType,
      resultCount: searchData.resultCount || 0
    };

    // Remove duplicate queries
    const filtered = searchHistory.filter(item => 
      item.query.toLowerCase() !== newEntry.query.toLowerCase()
    );

    const updated = [newEntry, ...filtered].slice(0, maxItems);
    setSearchHistory(updated);
    
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const removeFromHistory = (entryId) => {
    const updated = searchHistory.filter(item => item.id !== entryId);
    setSearchHistory(updated);
    
    const storageKey = `searchHistory_${user.uid}_${searchType}`;
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const clearHistory = () => {
    setSearchHistory([]);
    const storageKey = `searchHistory_${user.uid}_${searchType}`;
    localStorage.removeItem(storageKey);
  };

  const handleSearchSelect = (historyItem) => {
    if (onSearchSelect) {
      onSearchSelect({
        query: historyItem.query,
        filters: historyItem.filters,
        type: historyItem.type
      });
    }
    setShowHistory(false);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'เมื่อสักครู่';
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
    
    return date.toLocaleDateString('th-TH');
  };

  const getFilterSummary = (filters) => {
    const activeFilters = Object.entries(filters).filter(([key, value]) => 
      value && value !== '' && key !== 'search' && key !== 'sortBy' && key !== 'sortOrder'
    );
    
    if (activeFilters.length === 0) return null;
    
    return activeFilters.map(([key, value]) => {
      switch (key) {
        case 'category':
          return `ประเภท: ${value}`;
        case 'status':
          return `สถานะ: ${value}`;
        case 'location':
          return `สถานที่: ${value}`;
        case 'dateFrom':
          return `จาก: ${new Date(value).toLocaleDateString('th-TH')}`;
        case 'dateTo':
          return `ถึง: ${new Date(value).toLocaleDateString('th-TH')}`;
        default:
          return `${key}: ${value}`;
      }
    }).join(', ');
  };

  // Expose addToHistory method for parent components
  SearchHistory.addToHistory = addToHistory;

  if (!user?.uid) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        title="ประวัติการค้นหา"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        ประวัติ
        {searchHistory.length > 0 && (
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {searchHistory.length}
          </span>
        )}
      </button>

      {showHistory && (
        <div className="absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
          <div className="py-1 max-h-96 overflow-y-auto">
            <div className="px-4 py-2 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">ประวัติการค้นหา</h3>
                {searchHistory.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    ล้างทั้งหมด
                  </button>
                )}
              </div>
            </div>

            {searchHistory.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="mx-auto h-12 w-12 text-gray-300 mb-4">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">ยังไม่มีประวัติการค้นหา</p>
              </div>
            ) : (
              <div className="space-y-1">
                {searchHistory.map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-start justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleSearchSelect(item)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.query}
                        </p>
                      </div>
                      
                      {getFilterSummary(item.filters) && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {getFilterSummary(item.filters)}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-xs text-gray-400">
                          {formatTimestamp(item.timestamp)}
                        </p>
                        {item.resultCount > 0 && (
                          <span className="text-xs text-gray-400">
                            • {item.resultCount} ผลลัพธ์
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromHistory(item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 ml-2 p-1 text-gray-400 hover:text-red-600 transition-opacity"
                      title="ลบจากประวัติ"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showHistory && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowHistory(false)}
        />
      )}
    </div>
  );
};

export default SearchHistory;