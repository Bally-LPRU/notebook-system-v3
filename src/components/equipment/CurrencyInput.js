import React, { useState, useEffect, useCallback } from 'react';

const CurrencyInput = ({
  value,
  onChange,
  placeholder = '0.00',
  disabled = false,
  error = null,
  className = '',
  id,
  name,
  currency = 'THB',
  locale = 'th-TH',
  min = 0,
  max = null,
  allowNegative = false,
  decimalPlaces = 2,
  showCurrencySymbol = true,
  label = null,
  required = false
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Currency symbols
  const currencySymbols = {
    THB: '฿',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥'
  };

  // Format number with currency
  const formatCurrency = useCallback((amount) => {
    if (amount === null || amount === undefined || amount === '') return '';
    
    const numericValue = parseFloat(amount);
    if (isNaN(numericValue)) return '';

    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    });

    return formatter.format(numericValue);
  }, [locale, currency, decimalPlaces]);

  // Format number without currency symbol
  const formatNumber = useCallback((amount) => {
    if (amount === null || amount === undefined || amount === '') return '';
    
    const numericValue = parseFloat(amount);
    if (isNaN(numericValue)) return '';

    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    }).format(numericValue);
  }, [locale, decimalPlaces]);

  // Parse display value to numeric value
  const parseValue = useCallback((displayValue) => {
    if (!displayValue) return 0;
    
    // Remove currency symbols and formatting
    const cleanValue = displayValue
      .replace(/[^\d.-]/g, '')
      .replace(/,/g, '');
    
    const numericValue = parseFloat(cleanValue);
    return isNaN(numericValue) ? 0 : numericValue;
  }, []);

  // Update display value when value prop changes
  useEffect(() => {
    if (isFocused) {
      // Show raw number when focused
      setDisplayValue(value ? value.toString() : '');
    } else {
      // Show formatted currency when not focused
      if (showCurrencySymbol) {
        setDisplayValue(formatCurrency(value));
      } else {
        setDisplayValue(formatNumber(value));
      }
    }
  }, [value, isFocused, formatCurrency, formatNumber, showCurrencySymbol]);

  // Handle input change
  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    
    // Allow only numbers, decimal point, and minus sign
    const regex = allowNegative ? /^-?\d*\.?\d*$/ : /^\d*\.?\d*$/;
    
    if (regex.test(inputValue) || inputValue === '') {
      setDisplayValue(inputValue);
      
      const numericValue = parseValue(inputValue);
      
      // Validate min/max
      if (min !== null && numericValue < min) return;
      if (max !== null && numericValue > max) return;
      
      onChange(numericValue);
    }
  };

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
    setDisplayValue(value ? value.toString() : '');
  };

  // Handle blur
  const handleBlur = () => {
    setIsFocused(false);
    
    const numericValue = parseValue(displayValue);
    
    // Validate and format
    let finalValue = numericValue;
    
    if (min !== null && finalValue < min) {
      finalValue = min;
    }
    if (max !== null && finalValue > max) {
      finalValue = max;
    }
    
    onChange(finalValue);
  };

  // Handle key press
  const handleKeyPress = (e) => {
    // Prevent invalid characters
    const char = e.key;
    const isNumber = /\d/.test(char);
    const isDecimal = char === '.';
    const isMinus = char === '-' && allowNegative;
    const isControl = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(char);
    
    if (!isNumber && !isDecimal && !isMinus && !isControl) {
      e.preventDefault();
    }
    
    // Prevent multiple decimal points
    if (isDecimal && displayValue.includes('.')) {
      e.preventDefault();
    }
    
    // Prevent minus sign not at the beginning
    if (isMinus && (displayValue.length > 0 || displayValue.includes('-'))) {
      e.preventDefault();
    }
  };

  // Quick amount buttons
  const quickAmounts = [1000, 5000, 10000, 50000, 100000];

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        {showCurrencySymbol && !isFocused && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">
              {currencySymbols[currency] || currency}
            </span>
          </div>
        )}
        
        <input
          type="text"
          id={id}
          name={name}
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
            showCurrencySymbol && !isFocused ? 'pl-8' : ''
          } ${error ? 'border-red-300' : ''}`}
        />
      </div>

      {/* Quick amount buttons */}
      {isFocused && !disabled && (
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="text-xs text-gray-500 mr-2">จำนวนเงินทั่วไป:</span>
          {quickAmounts.map(amount => (
            <button
              key={amount}
              type="button"
              onClick={() => {
                onChange(amount);
                setDisplayValue(amount.toString());
              }}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border"
            >
              {formatNumber(amount)}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              onChange(0);
              setDisplayValue('0');
            }}
            className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded border"
          >
            ล้าง
          </button>
        </div>
      )}

      {/* Validation info */}
      <div className="mt-1 flex justify-between text-xs text-gray-500">
        <div>
          {min !== null && `ขั้นต่ำ: ${formatCurrency(min)}`}
          {max !== null && ` | สูงสุด: ${formatCurrency(max)}`}
        </div>
        {value > 0 && (
          <div>
            {value >= 1000000 ? `${(value / 1000000).toFixed(1)} ล้าน` : 
             value >= 1000 ? `${(value / 1000).toFixed(1)} พัน` : ''}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default CurrencyInput;