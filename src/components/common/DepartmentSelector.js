import React, { useState, useRef, useEffect } from 'react';

// Department options as defined in the design document
const DEPARTMENTS = [
  { value: 'accounting', label: 'สาขาวิชาการบัญชี' },
  { value: 'digital-business', label: 'สาขาวิชาการจัดการธุรกิจดิจิทัล' },
  { value: 'business-admin', label: 'สาขาวิชาบริหารธุรกิจ' },
  { value: 'management', label: 'สาขาวิชาการจัดการ' },
  { value: 'computer-business', label: 'สาขาวิชาคอมพิวเตอร์ธุรกิจ' },
  { value: 'communication', label: 'สาขาวิชานิเทศศาสตร์' },
  { value: 'logistics', label: 'สาขาวิชาโลจิสติกส์และธุรกิจระหว่างประเทศ' },
  { value: 'tourism', label: 'สาขานวัตกรรมการท่องเที่ยวและธุรกิจบริการ' },
  { value: 'modern-business', label: 'สาขาวิชาการจัดการธุรกิจสมัยใหม่' },
  { value: 'dean-office', label: 'สำนักงานคณบดี' }
];

const DepartmentSelector = ({
  value,
  onChange,
  error,
  required = false,
  placeholder = 'เลือกสังกัด/แผนก',
  className = '',
  disabled = false,
  id = 'department-selector'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Filter departments based on search term
  const filteredDepartments = DEPARTMENTS.filter(dept =>
    dept.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected department object
  const selectedDepartment = DEPARTMENTS.find(dept => dept.value === value);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (event) => {
    if (disabled) return;

    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        if (isOpen && focusedIndex >= 0 && focusedIndex < filteredDepartments.length) {
          handleSelect(filteredDepartments[focusedIndex]);
        } else if (!isOpen) {
          setIsOpen(true);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
        inputRef.current?.blur();
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex(prev => 
            prev < filteredDepartments.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen) {
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : filteredDepartments.length - 1
          );
        }
        break;
      case 'Tab':
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
        break;
      default:
        if (!isOpen && event.key.length === 1) {
          setIsOpen(true);
        }
        break;
    }
  };

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const focusedElement = listRef.current.children[focusedIndex];
      if (focusedElement && typeof focusedElement.scrollIntoView === 'function') {
        focusedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [focusedIndex]);

  const handleSelect = (department) => {
    onChange({
      target: {
        name: 'department',
        value: department.value
      }
    });
    setIsOpen(false);
    setSearchTerm('');
    setFocusedIndex(-1);
    inputRef.current?.focus();
  };

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchTerm('');
        setFocusedIndex(-1);
      }
    }
  };

  const handleSearchChange = (event) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);
    setFocusedIndex(-1);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const displayValue = isOpen ? searchTerm : (selectedDepartment?.label || '');

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={displayValue}
          onChange={handleSearchChange}
          onClick={handleInputClick}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete="off"
          className={`
            w-full px-3 py-2 border rounded-md shadow-sm
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
            ${disabled ? 'bg-gray-50' : 'bg-white'}
            pr-10
          `}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={`${id}-listbox`}
          aria-describedby={error ? `${id}-error` : undefined}
          role="combobox"
          aria-autocomplete="list"
          aria-activedescendant={
            focusedIndex >= 0 ? `${id}-option-${focusedIndex}` : undefined
          }
        />
        
        {/* Dropdown arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg
            className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'transform rotate-180' : ''
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {filteredDepartments.length > 0 ? (
            <ul ref={listRef} id={`${id}-listbox`} role="listbox" aria-labelledby={id}>
              {filteredDepartments.map((department, index) => (
                <li
                  key={department.value}
                  id={`${id}-option-${index}`}
                  role="option"
                  aria-selected={department.value === value}
                  className={`
                    cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-primary-50
                    ${focusedIndex === index ? 'bg-primary-50 text-primary-900' : 'text-gray-900'}
                    ${department.value === value ? 'bg-primary-100 font-medium' : 'font-normal'}
                  `}
                  onClick={() => handleSelect(department)}
                  onMouseEnter={() => setFocusedIndex(index)}
                >
                  <span className="block truncate">
                    {department.label}
                  </span>
                  
                  {/* Selected indicator */}
                  {department.value === value && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-primary-600">
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-2 px-3 text-gray-500 text-sm">
              ไม่พบสังกัดที่ตรงกับ "{searchTerm}"
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default DepartmentSelector;