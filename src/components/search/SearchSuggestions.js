import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import EquipmentService from '../../services/equipmentService';

const SearchSuggestions = ({
  query,
  searchType = 'equipment',
  onSuggestionSelect,
  onClose,
  maxSuggestions = 8
}) => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const suggestionRefs = useRef([]);

  useEffect(() => {
    if (query && query.length >= 2) {
      loadSuggestions(query);
    } else {
      setSuggestions([]);
    }
  }, [query, searchType]);

  useEffect(() => {
    // Reset selected index when suggestions change
    setSelectedIndex(-1);
  }, [suggestions]);

  const loadSuggestions = async (searchQuery) => {
    try {
      setLoading(true);
      
      let results = [];
      
      switch (searchType) {
        case 'equipment':
          results = await loadEquipmentSuggestions(searchQuery);
          break;
        case 'loans':
          results = await loadLoanSuggestions(searchQuery);
          break;
        case 'reservations':
          results = await loadReservationSuggestions(searchQuery);
          break;
        default:
          results = await loadEquipmentSuggestions(searchQuery);
      }
      
      setSuggestions(results.slice(0, maxSuggestions));
    } catch (error) {
      console.error('Error loading suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadEquipmentSuggestions = async (searchQuery) => {
    try {
      // Get equipment suggestions
      const equipmentResults = await EquipmentService.searchEquipment(searchQuery, 5);
      
      const suggestions = [];
      
      // Add equipment name suggestions
      equipmentResults.forEach(equipment => {
        suggestions.push({
          type: 'equipment',
          value: equipment.name,
          label: equipment.name,
          subtitle: `${equipment.brand} ${equipment.model}`,
          icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
          data: equipment
        });
      });

      // Add brand suggestions
      const brands = [...new Set(equipmentResults.map(eq => eq.brand).filter(Boolean))];
      brands.forEach(brand => {
        if (brand.toLowerCase().includes(searchQuery.toLowerCase())) {
          suggestions.push({
            type: 'brand',
            value: brand,
            label: `ยี่ห้อ: ${brand}`,
            subtitle: 'ค้นหาตามยี่ห้อ',
            icon: 'M7 7h.01M7 3h5c.512 0 .853.61.5 1.11l-2 2.79c-.353.5-.147 1.11.5 1.11h6a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V3a2 2 0 012-2z'
          });
        }
      });

      // Add category suggestions
      const categories = [...new Set(equipmentResults.map(eq => eq.category).filter(Boolean))];
      categories.forEach(category => {
        if (category.toLowerCase().includes(searchQuery.toLowerCase())) {
          suggestions.push({
            type: 'category',
            value: category,
            label: `ประเภท: ${category}`,
            subtitle: 'ค้นหาตามประเภท',
            icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
          });
        }
      });

      return suggestions;
    } catch (error) {
      console.error('Error loading equipment suggestions:', error);
      return [];
    }
  };

  const loadLoanSuggestions = async (searchQuery) => {
    // Implementation for loan suggestions
    // This would typically search through loan requests, user names, equipment names, etc.
    return [
      {
        type: 'search',
        value: searchQuery,
        label: `ค้นหา "${searchQuery}" ในคำขอยืม`,
        subtitle: 'ค้นหาในชื่ออุปกรณ์, ผู้ยืม, วัตถุประสงค์',
        icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
      }
    ];
  };

  const loadReservationSuggestions = async (searchQuery) => {
    // Implementation for reservation suggestions
    return [
      {
        type: 'search',
        value: searchQuery,
        label: `ค้นหา "${searchQuery}" ในการจอง`,
        subtitle: 'ค้นหาในชื่ออุปกรณ์, ผู้จอง, วัตถุประสงค์',
        icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
      }
    ];
  };

  const handleSuggestionClick = (suggestion) => {
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
    if (onClose) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        if (onClose) {
          onClose();
        }
        break;
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionRefs.current[selectedIndex]) {
      suggestionRefs.current[selectedIndex].scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedIndex]);

  // Attach keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [suggestions, selectedIndex]);

  if (!query || query.length < 2) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-lg border border-gray-200 z-50 max-h-80 overflow-y-auto">
      {loading ? (
        <div className="px-4 py-3 text-center">
          <div className="inline-flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-gray-600">กำลังค้นหา...</span>
          </div>
        </div>
      ) : suggestions.length > 0 ? (
        <div className="py-1">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.type}-${suggestion.value}-${index}`}
              ref={el => suggestionRefs.current[index] = el}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors ${
                index === selectedIndex ? 'bg-blue-50 border-l-2 border-blue-500' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  suggestion.type === 'equipment' ? 'bg-blue-100' :
                  suggestion.type === 'brand' ? 'bg-green-100' :
                  suggestion.type === 'category' ? 'bg-purple-100' :
                  'bg-gray-100'
                }`}>
                  <svg className={`w-4 h-4 ${
                    suggestion.type === 'equipment' ? 'text-blue-600' :
                    suggestion.type === 'brand' ? 'text-green-600' :
                    suggestion.type === 'category' ? 'text-purple-600' :
                    'text-gray-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={suggestion.icon} />
                  </svg>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.label}
                  </p>
                  {suggestion.subtitle && (
                    <p className="text-xs text-gray-500 truncate">
                      {suggestion.subtitle}
                    </p>
                  )}
                </div>

                {suggestion.type === 'equipment' && (
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      อุปกรณ์
                    </span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="px-4 py-3 text-center">
          <div className="text-sm text-gray-500">
            ไม่พบคำแนะนำสำหรับ "{query}"
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchSuggestions;