import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDownIcon, ChevronRightIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import EquipmentCategoryService from '../../services/equipmentCategoryService';

/**
 * CategorySelector Component
 * Provides category selection with search functionality and hierarchical display
 */
const CategorySelector = ({ 
  selectedCategory, 
  onCategorySelect, 
  placeholder = "เลือกประเภทอุปกรณ์",
  required = false,
  disabled = false,
  showSearch = true,
  showHierarchy = true,
  className = ""
}) => {
  const [categories, setCategories] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(new Set());

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (showHierarchy) {
        const categoriesTree = await EquipmentCategoryService.getCategoriesTree();
        setCategories(categoriesTree);
      } else {
        const categoriesList = await EquipmentCategoryService.getCategories();
        setCategories(categoriesList);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
      setError('ไม่สามารถโหลดประเภทอุปกรณ์ได้');
    } finally {
      setLoading(false);
    }
  };

  // Filter categories based on search term
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) {
      return categories;
    }

    const searchLower = searchTerm.toLowerCase();
    
    const filterRecursive = (cats) => {
      return cats.filter(category => {
        const matchesSearch = 
          category.name.toLowerCase().includes(searchLower) ||
          category.nameEn.toLowerCase().includes(searchLower) ||
          category.description.toLowerCase().includes(searchLower);
        
        const hasMatchingChildren = category.children && 
          filterRecursive(category.children).length > 0;
        
        return matchesSearch || hasMatchingChildren;
      }).map(category => ({
        ...category,
        children: category.children ? filterRecursive(category.children) : []
      }));
    };

    return showHierarchy ? filterRecursive(categories) : 
      categories.filter(category => 
        category.name.toLowerCase().includes(searchLower) ||
        category.nameEn.toLowerCase().includes(searchLower) ||
        category.description.toLowerCase().includes(searchLower)
      );
  }, [categories, searchTerm, showHierarchy]);

  const handleCategorySelect = (category) => {
    onCategorySelect(category);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClearSelection = (e) => {
    e.stopPropagation();
    onCategorySelect(null);
  };

  const toggleExpanded = (categoryId, e) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategoryItem = (category, level = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = selectedCategory?.id === category.id;

    return (
      <div key={category.id} className="category-item">
        <div
          className={`
            flex items-center px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors
            ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
            ${level > 0 ? `ml-${level * 4}` : ''}
          `}
          onClick={() => handleCategorySelect(category)}
          style={{ paddingLeft: `${12 + (level * 16)}px` }}
        >
          {hasChildren && (
            <button
              onClick={(e) => toggleExpanded(category.id, e)}
              className="mr-2 p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" />
              )}
            </button>
          )}
          
          {!hasChildren && level > 0 && (
            <div className="w-6 mr-2" />
          )}

          {category.icon && (
            <div 
              className="w-5 h-5 mr-2 rounded flex-shrink-0"
              style={{ backgroundColor: category.color }}
            >
              <span className="text-white text-xs flex items-center justify-center h-full">
                {category.icon.charAt(0)}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">
              {category.name}
            </div>
            {category.nameEn && (
              <div className="text-xs text-gray-500 truncate">
                {category.nameEn}
              </div>
            )}
          </div>

          {category.equipmentCount > 0 && (
            <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
              {category.equipmentCount}
            </span>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="category-children">
            {category.children.map(child => renderCategoryItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderFlatCategoryItem = (category) => {
    const isSelected = selectedCategory?.id === category.id;
    
    return (
      <div
        key={category.id}
        className={`
          flex items-center px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors
          ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
        `}
        onClick={() => handleCategorySelect(category)}
      >
        {category.icon && (
          <div 
            className="w-5 h-5 mr-3 rounded flex-shrink-0"
            style={{ backgroundColor: category.color }}
          >
            <span className="text-white text-xs flex items-center justify-center h-full">
              {category.icon.charAt(0)}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">
            {category.name}
          </div>
          {category.nameEn && (
            <div className="text-xs text-gray-500 truncate">
              {category.nameEn}
            </div>
          )}
          {category.level > 0 && (
            <div className="text-xs text-gray-400 truncate">
              {category.path}
            </div>
          )}
        </div>

        {category.equipmentCount > 0 && (
          <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
            {category.equipmentCount}
          </span>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-gray-500">กำลังโหลดประเภทอุปกรณ์...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full px-3 py-2 border border-red-300 rounded-md bg-red-50">
          <span className="text-red-600 text-sm">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Selector Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-3 py-2 text-left border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer hover:border-gray-400'}
          ${required && !selectedCategory ? 'border-red-300' : 'border-gray-300'}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1 min-w-0">
            {selectedCategory ? (
              <>
                {selectedCategory.icon && (
                  <div 
                    className="w-5 h-5 mr-2 rounded flex-shrink-0"
                    style={{ backgroundColor: selectedCategory.color }}
                  >
                    <span className="text-white text-xs flex items-center justify-center h-full">
                      {selectedCategory.icon.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">
                    {selectedCategory.name}
                  </div>
                  {selectedCategory.nameEn && (
                    <div className="text-xs text-gray-500 truncate">
                      {selectedCategory.nameEn}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </div>
          
          <div className="flex items-center ml-2">
            {selectedCategory && !disabled && (
              <button
                onClick={handleClearSelection}
                className="mr-2 p-1 hover:bg-gray-200 rounded"
              >
                <XMarkIcon className="h-4 w-4 text-gray-400" />
              </button>
            )}
            <ChevronDownIcon 
              className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            />
          </div>
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden">
          {showSearch && (
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาประเภทอุปกรณ์..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div className="max-h-64 overflow-y-auto">
            {filteredCategories.length === 0 ? (
              <div className="px-3 py-4 text-center text-gray-500">
                {searchTerm ? 'ไม่พบประเภทอุปกรณ์ที่ค้นหา' : 'ไม่มีประเภทอุปกรณ์'}
              </div>
            ) : (
              <div className="py-1">
                {showHierarchy 
                  ? filteredCategories.map(category => renderCategoryItem(category))
                  : filteredCategories.map(category => renderFlatCategoryItem(category))
                }
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default CategorySelector;