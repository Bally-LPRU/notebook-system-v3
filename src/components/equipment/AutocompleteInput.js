import React, { useState, useEffect, useRef, useCallback } from 'react';

// Simple debounce implementation
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const AutocompleteInput = ({
  value,
  onChange,
  onBlur,
  placeholder,
  suggestions = [],
  onSuggestionsFetch,
  disabled = false,
  error = null,
  className = '',
  id,
  name,
  maxSuggestions = 10,
  minSearchLength = 2,
  debounceMs = 300
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Debounced function to fetch suggestions
  const debouncedFetch = useCallback(
    debounce(async (searchTerm) => {
      if (onSuggestionsFetch && searchTerm.length >= minSearchLength) {
        setLoading(true);
        try {
          await onSuggestionsFetch(searchTerm);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        } finally {
          setLoading(false);
        }
      }
    }, debounceMs),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onSuggestionsFetch, minSearchLength, debounceMs]
  );

  // Filter suggestions based on input value
  useEffect(() => {
    if (!value || value.length < minSearchLength) {
      setFilteredSuggestions([]);
      setIsOpen(false);
      return;
    }

    const filtered = suggestions
      .filter(suggestion => 
        suggestion.toLowerCase().includes(value.toLowerCase())
      )
      .slice(0, maxSuggestions);

    setFilteredSuggestions(filtered);
    setIsOpen(filtered.length > 0);
    setActiveSuggestionIndex(-1);

    // Fetch additional suggestions if needed
    debouncedFetch(value);
  }, [value, suggestions, minSearchLength, maxSuggestions, debouncedFetch]);

  // Handle input change
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  // Handle input blur
  const handleInputBlur = (e) => {
    // Delay closing to allow suggestion click
    setTimeout(() => {
      setIsOpen(false);
      setActiveSuggestionIndex(-1);
      if (onBlur) {
        onBlur(e);
      }
    }, 150);
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (filteredSuggestions.length > 0) {
      setIsOpen(true);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    onChange(suggestion);
    setIsOpen(false);
    setActiveSuggestionIndex(-1);
    inputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestionIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      
      case 'Enter':
        e.preventDefault();
        if (activeSuggestionIndex >= 0) {
          handleSuggestionClick(filteredSuggestions[activeSuggestionIndex]);
        }
        break;
      
      case 'Escape':
        setIsOpen(false);
        setActiveSuggestionIndex(-1);
        break;
      
      default:
        break;
    }
  };

  // Scroll active suggestion into view
  useEffect(() => {
    if (activeSuggestionIndex >= 0 && suggestionsRef.current) {
      const activeElement = suggestionsRef.current.children[activeSuggestionIndex];
      if (activeElement) {
        activeElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [activeSuggestionIndex]);

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          id={id}
          name={name}
          value={value}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
            error ? 'border-red-300' : ''
          } ${className}`}
          autoComplete="off"
        />
        
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {isOpen && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          <ul ref={suggestionsRef}>
            {filteredSuggestions.map((suggestion, index) => (
              <li
                key={index}
                className={`cursor-pointer select-none relative py-2 pl-3 pr-9 ${
                  index === activeSuggestionIndex
                    ? 'text-white bg-blue-600'
                    : 'text-gray-900 hover:bg-gray-50'
                }`}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <span className="block truncate">
                  {suggestion}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default AutocompleteInput;