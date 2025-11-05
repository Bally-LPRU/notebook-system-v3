import { forwardRef } from 'react';
import { MagnifyingGlassIcon, TagIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

const SearchSuggestions = forwardRef(({ 
  suggestions, 
  selectedIndex, 
  onSuggestionClick, 
  query 
}, ref) => {
  // Highlight matching text
  const highlightMatch = (text, query) => {
    if (!query || !text) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-0.5 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  // Get suggestion icon based on type
  const getSuggestionIcon = (suggestion) => {
    if (typeof suggestion === 'string') {
      return <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />;
    }
    
    switch (suggestion.type) {
      case 'equipment':
        return <MagnifyingGlassIcon className="h-4 w-4 text-blue-500" />;
      case 'category':
        return <TagIcon className="h-4 w-4 text-green-500" />;
      case 'brand':
        return <BuildingOfficeIcon className="h-4 w-4 text-purple-500" />;
      case 'location':
        return <BuildingOfficeIcon className="h-4 w-4 text-orange-500" />;
      default:
        return <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  // Get suggestion text
  const getSuggestionText = (suggestion) => {
    if (typeof suggestion === 'string') {
      return suggestion;
    }
    return suggestion.name || suggestion.text || suggestion.query || '';
  };

  // Get suggestion description
  const getSuggestionDescription = (suggestion) => {
    if (typeof suggestion === 'string') {
      return null;
    }
    return suggestion.description || suggestion.category || null;
  };

  return (
    <div 
      ref={ref}
      className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto"
    >
      <div className="py-2">
        {suggestions.map((suggestion, index) => {
          const text = getSuggestionText(suggestion);
          const description = getSuggestionDescription(suggestion);
          const isSelected = index === selectedIndex;
          
          return (
            <button
              key={index}
              onClick={() => onSuggestionClick(suggestion)}
              className={`w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors ${
                isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                {getSuggestionIcon(suggestion)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {highlightMatch(text, query)}
                  </div>
                  {description && (
                    <div className="text-xs text-gray-500 truncate">
                      {description}
                    </div>
                  )}
                </div>
                {typeof suggestion === 'object' && suggestion.count && (
                  <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                    {suggestion.count}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});

SearchSuggestions.displayName = 'SearchSuggestions';

export default SearchSuggestions;