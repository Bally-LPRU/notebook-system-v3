import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import { MagnifyingGlassIcon, XMarkIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import AdvancedSearchModal from './AdvancedSearchModal';
import SearchSuggestions from './SearchSuggestions';
import SearchHistory from './SearchHistory';

const EquipmentSearch = ({
  onSearch,
  onAdvancedSearch,
  placeholder = "ค้นหาอุปกรณ์...",
  suggestions = [],
  loading = false,
  className = "",
  showAdvancedSearch = true,
  showHistory = true,
  showSuggestions = true
}) => {
  const [query, setQuery] = useState('');
  const [isAdvancedModalOpen, setIsAdvancedModalOpen] = useState(false);
  const [showSuggestionsList, setShowSuggestionsList] = useState(false);
  const [showHistoryList, setShowHistoryList] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const containerRef = useRef(null);

  // Load search history and saved searches from localStorage
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('equipment-search-history') || '[]');
    const saved = JSON.parse(localStorage.getItem('equipment-saved-searches') || '[]');
    setSearchHistory(history.slice(0, 10)); // Keep only last 10
    setSavedSearches(saved);
  }, []);

  // Memoize debounced search function
  const debouncedSearch = useMemo(() => {
    return debounce((query) => {
      if (onSearch) {
        onSearch(query);
      }
    }, 300);
  }, [onSearch]);

  // Memoize event handlers
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedSuggestionIndex(-1);
    
    if (value.length >= 2) {
      setShowSuggestionsList(true);
      debouncedSearch(value);
    } else {
      setShowSuggestionsList(false);
      if (value.length === 0) {
        debouncedSearch('');
      }
    }
  }, [debouncedSearch]);

  const handleInputFocus = useCallback(() => {
    if (query.length >= 2 && showSuggestions) {
      setShowSuggestionsList(true);
    } else if (query.length === 0 && showHistory && searchHistory.length > 0) {
      setShowHistoryList(true);
    }
  }, [query, showSuggestions, showHistory, searchHistory.length]);

  const handleInputBlur = useCallback(() => {
    // Delay hiding to allow clicking on suggestions
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setShowSuggestionsList(false);
        setShowHistoryList(false);
      }
    }, 150);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    const currentList = showSuggestionsList ? suggestions : searchHistory;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev < currentList.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0) {
        const selectedItem = currentList[selectedSuggestionIndex];
        const searchQuery = typeof selectedItem === 'string' ? selectedItem : selectedItem.query;
        handleSearch(searchQuery);
      } else {
        handleSearch(query);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestionsList(false);
      setShowHistoryList(false);
      inputRef.current?.blur();
    }
  }, [showSuggestionsList, suggestions, searchHistory, selectedSuggestionIndex, query]);

  // Handle search execution
  const handleSearch = useCallback((searchQuery) => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      setQuery(trimmedQuery);
      addToSearchHistory(trimmedQuery);
      if (onSearch) {
        onSearch(trimmedQuery);
      }
    }
    setShowSuggestionsList(false);
    setShowHistoryList(false);
    setSelectedSuggestionIndex(-1);
  }, [onSearch]);

  // Add to search history
  const addToSearchHistory = useCallback((searchQuery) => {
    const newHistory = [
      searchQuery,
      ...searchHistory.filter(item => item !== searchQuery)
    ].slice(0, 10);
    
    setSearchHistory(newHistory);
    localStorage.setItem('equipment-search-history', JSON.stringify(newHistory));
  }, [searchHistory]);

  // Clear search
  const handleClear = useCallback(() => {
    setQuery('');
    setShowSuggestionsList(false);
    setShowHistoryList(false);
    if (onSearch) {
      onSearch('');
    }
    inputRef.current?.focus();
  }, [onSearch]);

  // Clear search history
  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem('equipment-search-history');
    setShowHistoryList(false);
  }, []);

  // Save current search
  const saveCurrentSearch = useCallback(() => {
    if (!query.trim()) return;
    
    const searchName = prompt('ชื่อการค้นหา:', query);
    if (searchName) {
      const newSavedSearch = {
        id: Date.now().toString(),
        name: searchName,
        query: query.trim(),
        createdAt: new Date().toISOString()
      };
      
      const newSavedSearches = [...savedSearches, newSavedSearch];
      setSavedSearches(newSavedSearches);
      localStorage.setItem('equipment-saved-searches', JSON.stringify(newSavedSearches));
    }
  }, [query, savedSearches]);

  // Delete saved search
  const deleteSavedSearch = useCallback((searchId) => {
    const newSavedSearches = savedSearches.filter(search => search.id !== searchId);
    setSavedSearches(newSavedSearches);
    localStorage.setItem('equipment-saved-searches', JSON.stringify(newSavedSearches));
  }, [savedSearches]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion) => {
    const searchQuery = typeof suggestion === 'string' ? suggestion : suggestion.query || suggestion.name;
    handleSearch(searchQuery);
  }, [handleSearch]);

  // Handle history item click
  const handleHistoryClick = useCallback((historyItem) => {
    handleSearch(historyItem);
  }, [handleSearch]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Main Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          ) : (
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          )}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="block w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          disabled={loading}
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
          {/* Save Search Button */}
          {query.trim() && (
            <button
              onClick={saveCurrentSearch}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              title="บันทึกการค้นหา"
            >
              <BookmarkIcon className="h-4 w-4" />
            </button>
          )}
          
          {/* Clear Button */}
          {query && (
            <button
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="ล้างการค้นหา"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
          
          {/* Advanced Search Button */}
          {showAdvancedSearch && (
            <button
              onClick={() => setIsAdvancedModalOpen(true)}
              className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 border border-blue-300 hover:border-blue-400 rounded transition-colors"
              title="ค้นหาขั้นสูง"
            >
              ขั้นสูง
            </button>
          )}
        </div>
      </div>

      {/* Search Suggestions */}
      {showSuggestionsList && suggestions.length > 0 && (
        <SearchSuggestions
          ref={suggestionsRef}
          suggestions={suggestions}
          selectedIndex={selectedSuggestionIndex}
          onSuggestionClick={handleSuggestionClick}
          query={query}
        />
      )}

      {/* Search History */}
      {showHistoryList && searchHistory.length > 0 && (
        <SearchHistory
          history={searchHistory}
          savedSearches={savedSearches}
          selectedIndex={selectedSuggestionIndex}
          onHistoryClick={handleHistoryClick}
          onSavedSearchClick={handleSuggestionClick}
          onDeleteSavedSearch={deleteSavedSearch}
          onClearHistory={clearSearchHistory}
        />
      )}

      {/* Advanced Search Modal */}
      {isAdvancedModalOpen && (
        <AdvancedSearchModal
          isOpen={isAdvancedModalOpen}
          onClose={() => setIsAdvancedModalOpen(false)}
          onSearch={onAdvancedSearch}
          initialQuery={query}
        />
      )}
    </div>
  );
};

export default EquipmentSearch;