import { useState, useEffect, useCallback } from 'react';
import { XMarkIcon, MagnifyingGlassIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import { useCategories } from '../../contexts/EquipmentCategoriesContext';
import { EQUIPMENT_MANAGEMENT_STATUS } from '../../types/equipmentManagement';

const AdvancedSearchModal = ({
  isOpen,
  onClose,
  onSearch,
  initialQuery = ''
}) => {
  const { categories, loading: categoriesLoading } = useCategories();
  
  const [searchCriteria, setSearchCriteria] = useState({
    query: initialQuery,
    equipmentNumber: '',
    name: '',
    brand: '',
    model: '',
    description: '',
    categories: [],
    statuses: [],
    location: {
      building: '',
      floor: '',
      room: ''
    },
    purchaseDateRange: {
      start: '',
      end: ''
    },
    priceRange: {
      min: '',
      max: ''
    },
    responsiblePerson: '',
    tags: []
  });

  const [operator, setOperator] = useState('AND'); // AND, OR
  const [savedSearches, setSavedSearches] = useState([]);
  const [searchName, setSearchName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  // Load saved searches
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('equipment-advanced-searches') || '[]');
    setSavedSearches(saved);
  }, []);

  // Handle input changes
  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setSearchCriteria(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setSearchCriteria(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Handle array field changes (categories, statuses, tags)
  const handleArrayChange = (field, value, checked) => {
    setSearchCriteria(prev => ({
      ...prev,
      [field]: checked 
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }));
  };

  // Handle tag input
  const handleTagInput = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const newTag = e.target.value.trim();
      if (!searchCriteria.tags.includes(newTag)) {
        setSearchCriteria(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
      }
      e.target.value = '';
    }
  };

  // Remove tag
  const removeTag = (tagToRemove) => {
    setSearchCriteria(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Clear all criteria
  const clearAll = () => {
    setSearchCriteria({
      query: '',
      equipmentNumber: '',
      name: '',
      brand: '',
      model: '',
      description: '',
      categories: [],
      statuses: [],
      location: {
        building: '',
        floor: '',
        room: ''
      },
      purchaseDateRange: {
        start: '',
        end: ''
      },
      priceRange: {
        min: '',
        max: ''
      },
      responsiblePerson: '',
      tags: []
    });
  };

  // Memoize execute search function
  const executeSearch = useCallback(() => {
    const searchParams = {
      ...searchCriteria,
      operator
    };
    
    // Add to search history
    const searchQuery = buildSearchQuery(searchCriteria);
    if (searchQuery) {
      const history = JSON.parse(localStorage.getItem('equipment-search-history') || '[]');
      const newHistory = [searchQuery, ...history.filter(item => item !== searchQuery)].slice(0, 10);
      localStorage.setItem('equipment-search-history', JSON.stringify(newHistory));
    }
    
    onSearch(searchParams);
    onClose();
  }, [searchCriteria, operator, buildSearchQuery, onSearch, onClose]);

  // Memoize build search query function
  const buildSearchQuery = useCallback((criteria) => {
    const parts = [];
    
    if (criteria.query) parts.push(criteria.query);
    if (criteria.equipmentNumber) parts.push(`หมายเลข: ${criteria.equipmentNumber}`);
    if (criteria.name) parts.push(`ชื่อ: ${criteria.name}`);
    if (criteria.brand) parts.push(`ยี่ห้อ: ${criteria.brand}`);
    if (criteria.model) parts.push(`รุ่น: ${criteria.model}`);
    if (criteria.categories.length > 0) {
      const categoryNames = criteria.categories.map(catId => {
        const category = categories.find(cat => cat.id === catId);
        return category ? category.name : catId;
      });
      parts.push(`ประเภท: ${categoryNames.join(', ')}`);
    }
    if (criteria.statuses.length > 0) parts.push(`สถานะ: ${criteria.statuses.join(', ')}`);
    
    return parts.join(' | ');
  }, [categories]);

  // Memoize save search function
  const saveSearch = useCallback(() => {
    if (!searchName.trim()) return;
    
    const newSavedSearch = {
      id: Date.now().toString(),
      name: searchName.trim(),
      criteria: searchCriteria,
      operator,
      createdAt: new Date().toISOString()
    };
    
    const newSavedSearches = [...savedSearches, newSavedSearch];
    setSavedSearches(newSavedSearches);
    localStorage.setItem('equipment-advanced-searches', JSON.stringify(newSavedSearches));
    
    setSearchName('');
    setShowSaveForm(false);
  }, [searchName, searchCriteria, operator, savedSearches]);

  // Memoize load saved search function
  const loadSavedSearch = useCallback((savedSearch) => {
    setSearchCriteria(savedSearch.criteria);
    setOperator(savedSearch.operator);
  }, []);

  // Memoize delete saved search function
  const deleteSavedSearch = useCallback((searchId) => {
    const newSavedSearches = savedSearches.filter(search => search.id !== searchId);
    setSavedSearches(newSavedSearches);
    localStorage.setItem('equipment-advanced-searches', JSON.stringify(newSavedSearches));
  }, [savedSearches]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                ค้นหาขั้นสูง
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Saved Searches */}
            {savedSearches.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">การค้นหาที่บันทึกไว้</h4>
                <div className="flex flex-wrap gap-2">
                  {savedSearches.map(savedSearch => (
                    <div key={savedSearch.id} className="flex items-center bg-gray-100 rounded-lg">
                      <button
                        onClick={() => loadSavedSearch(savedSearch)}
                        className="px-3 py-1 text-sm text-gray-700 hover:text-blue-600 transition-colors"
                      >
                        <BookmarkIcon className="h-4 w-4 inline mr-1" />
                        {savedSearch.name}
                      </button>
                      <button
                        onClick={() => deleteSavedSearch(savedSearch.id)}
                        className="px-2 py-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search Form */}
            <div className="space-y-6">
              {/* General Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ค้นหาทั่วไป
                </label>
                <input
                  type="text"
                  value={searchCriteria.query}
                  onChange={(e) => handleInputChange('query', e.target.value)}
                  placeholder="ค้นหาในทุกฟิลด์..."
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Specific Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    หมายเลขครุภัณฑ์
                  </label>
                  <input
                    type="text"
                    value={searchCriteria.equipmentNumber}
                    onChange={(e) => handleInputChange('equipmentNumber', e.target.value)}
                    placeholder="เช่น EQ001"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ชื่ออุปกรณ์
                  </label>
                  <input
                    type="text"
                    value={searchCriteria.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="ชื่ออุปกรณ์"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ยี่ห้อ
                  </label>
                  <input
                    type="text"
                    value={searchCriteria.brand}
                    onChange={(e) => handleInputChange('brand', e.target.value)}
                    placeholder="ยี่ห้อ"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    รุ่น
                  </label>
                  <input
                    type="text"
                    value={searchCriteria.model}
                    onChange={(e) => handleInputChange('model', e.target.value)}
                    placeholder="รุ่น"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ประเภทอุปกรณ์
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                  {categoriesLoading ? (
                    <div className="col-span-full text-center text-gray-500">กำลังโหลด...</div>
                  ) : (
                    categories.map(category => (
                      <label key={category.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={searchCriteria.categories.includes(category.id)}
                          onChange={(e) => handleArrayChange('categories', category.id, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{category.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  สถานะ
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.values(EQUIPMENT_MANAGEMENT_STATUS).map(status => (
                    <label key={status} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={searchCriteria.statuses.includes(status)}
                        onChange={(e) => handleArrayChange('statuses', status, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{status}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  สถานที่
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    value={searchCriteria.location.building}
                    onChange={(e) => handleInputChange('location.building', e.target.value)}
                    placeholder="อาคาร"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={searchCriteria.location.floor}
                    onChange={(e) => handleInputChange('location.floor', e.target.value)}
                    placeholder="ชั้น"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={searchCriteria.location.room}
                    onChange={(e) => handleInputChange('location.room', e.target.value)}
                    placeholder="ห้อง"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ช่วงวันที่ซื้อ
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="date"
                    value={searchCriteria.purchaseDateRange.start}
                    onChange={(e) => handleInputChange('purchaseDateRange.start', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="date"
                    value={searchCriteria.purchaseDateRange.end}
                    onChange={(e) => handleInputChange('purchaseDateRange.end', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ช่วงราคา (บาท)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="number"
                    value={searchCriteria.priceRange.min}
                    onChange={(e) => handleInputChange('priceRange.min', e.target.value)}
                    placeholder="ราคาต่ำสุด"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="number"
                    value={searchCriteria.priceRange.max}
                    onChange={(e) => handleInputChange('priceRange.max', e.target.value)}
                    placeholder="ราคาสูงสุด"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  แท็ก
                </label>
                <input
                  type="text"
                  onKeyDown={handleTagInput}
                  placeholder="พิมพ์แท็กแล้วกด Enter"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {searchCriteria.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {searchCriteria.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Search Operator */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ตัวดำเนินการ
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="AND"
                      checked={operator === 'AND'}
                      onChange={(e) => setOperator(e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">AND (ต้องตรงทุกเงื่อนไข)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="OR"
                      checked={operator === 'OR'}
                      onChange={(e) => setOperator(e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">OR (ตรงเงื่อนไขใดเงื่อนไขหนึ่ง)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={executeSearch}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
              ค้นหา
            </button>
            
            {showSaveForm ? (
              <div className="flex items-center space-x-2 sm:mr-3">
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="ชื่อการค้นหา"
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && saveSearch()}
                />
                <button
                  onClick={saveSearch}
                  className="px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                >
                  บันทึก
                </button>
                <button
                  onClick={() => setShowSaveForm(false)}
                  className="px-3 py-2 bg-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-400"
                >
                  ยกเลิก
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSaveForm(true)}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                <BookmarkIcon className="h-4 w-4 mr-2" />
                บันทึกการค้นหา
              </button>
            )}
            
            <button
              onClick={clearAll}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              ล้างทั้งหมด
            </button>
            
            <button
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearchModal;