import React, { useState, useEffect } from 'react';
import { 
  ChevronDownIcon, 
  ChevronRightIcon, 
  FolderIcon, 
  FolderOpenIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import EquipmentCategoryService from '../../services/equipmentCategoryService';

/**
 * CategoryTreeView Component
 * Displays categories in a hierarchical tree structure with management actions
 */
const CategoryTreeView = ({ 
  onCategorySelect,
  onCategoryEdit,
  onCategoryDelete,
  onCategoryAdd,
  selectedCategoryId = null,
  showActions = false,
  showEquipmentCount = true,
  className = ""
}) => {
  const [categories, setCategories] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const categoriesTree = await EquipmentCategoryService.getCategoriesTree();
      setCategories(categoriesTree);
      
      // Auto-expand root categories
      const rootIds = categoriesTree.map(cat => cat.id);
      setExpandedCategories(new Set(rootIds));
    } catch (err) {
      console.error('Error loading categories:', err);
      setError('ไม่สามารถโหลดประเภทอุปกรณ์ได้');
    } finally {
      setLoading(false);
    }
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

  const handleCategoryClick = (category, e) => {
    e.stopPropagation();
    if (onCategorySelect) {
      onCategorySelect(category);
    }
  };

  const handleActionClick = (action, category, e) => {
    e.stopPropagation();
    switch (action) {
      case 'edit':
        if (onCategoryEdit) onCategoryEdit(category);
        break;
      case 'delete':
        if (onCategoryDelete) onCategoryDelete(category);
        break;
      case 'add':
        if (onCategoryAdd) onCategoryAdd(category);
        break;
      default:
        break;
    }
  };

  const renderCategoryNode = (category, level = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = selectedCategoryId === category.id;

    return (
      <div key={category.id} className="category-node">
        {/* Category Item */}
        <div
          className={`
            flex items-center px-2 py-2 cursor-pointer hover:bg-gray-50 transition-colors group
            ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
          `}
          onClick={(e) => handleCategoryClick(category, e)}
          style={{ paddingLeft: `${8 + (level * 20)}px` }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren ? (
            <button
              onClick={(e) => toggleExpanded(category.id, e)}
              className="mr-2 p-1 hover:bg-gray-200 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 text-gray-600" />
              )}
            </button>
          ) : (
            <div className="w-6 mr-2" />
          )}

          {/* Folder Icon */}
          <div className="mr-2">
            {hasChildren ? (
              isExpanded ? (
                <FolderOpenIcon className="h-5 w-5 text-blue-500" />
              ) : (
                <FolderIcon className="h-5 w-5 text-blue-500" />
              )
            ) : (
              <div 
                className="w-5 h-5 rounded flex-shrink-0"
                style={{ backgroundColor: category.color || '#6B7280' }}
              >
                <span className="text-white text-xs flex items-center justify-center h-full">
                  {category.icon ? category.icon.charAt(0) : category.name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Category Info */}
          <div className="flex-1 min-w-0">
            <div className={`font-medium text-sm truncate ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
              {category.name}
            </div>
            {category.nameEn && (
              <div className="text-xs text-gray-500 truncate">
                {category.nameEn}
              </div>
            )}
            {category.description && level === 0 && (
              <div className="text-xs text-gray-400 truncate mt-1">
                {category.description}
              </div>
            )}
          </div>

          {/* Equipment Count */}
          {showEquipmentCount && category.equipmentCount > 0 && (
            <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
              {category.equipmentCount}
            </span>
          )}

          {/* Action Buttons */}
          {showActions && (
            <div className="ml-2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => handleActionClick('add', category, e)}
                className="p-1 hover:bg-gray-200 rounded transition-colors mr-1"
                title="เพิ่มหมวดหมู่ย่อย"
              >
                <PlusIcon className="h-4 w-4 text-green-600" />
              </button>
              <button
                onClick={(e) => handleActionClick('edit', category, e)}
                className="p-1 hover:bg-gray-200 rounded transition-colors mr-1"
                title="แก้ไขหมวดหมู่"
              >
                <PencilIcon className="h-4 w-4 text-blue-600" />
              </button>
              {category.equipmentCount === 0 && (
                <button
                  onClick={(e) => handleActionClick('delete', category, e)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="ลบหมวดหมู่"
                >
                  <TrashIcon className="h-4 w-4 text-red-600" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="category-children">
            {category.children.map(child => renderCategoryNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">กำลังโหลดประเภทอุปกรณ์...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="text-red-600 mb-2">{error}</div>
            <button
              onClick={loadCategories}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              ลองใหม่
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`category-tree-view ${className}`}>
      {categories.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FolderIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <div>ไม่มีประเภทอุปกรณ์</div>
          {showActions && onCategoryAdd && (
            <button
              onClick={() => onCategoryAdd(null)}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              เพิ่มประเภทอุปกรณ์
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          {categories.map(category => renderCategoryNode(category))}
        </div>
      )}
    </div>
  );
};

export default CategoryTreeView;