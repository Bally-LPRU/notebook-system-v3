/**
 * Category Management Component
 * Full CRUD interface for managing equipment categories
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCategories } from '../../contexts/EquipmentCategoriesContext';
import { Layout } from '../layout';
import EquipmentCategoryService from '../../services/equipmentCategoryService';

// Icons
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ChevronDownIcon = ({ isOpen }) => (
  <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const FolderIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

// Default categories for seeding
const DEFAULT_CATEGORIES = [
  { name: 'คอมพิวเตอร์และอุปกรณ์', nameEn: 'Computers & Equipment', description: 'อุปกรณ์คอมพิวเตอร์และเทคโนโลยีสารสนเทศ', icon: '💻', color: '#3B82F6', sortOrder: 1 },
  { name: 'อุปกรณ์โสตทัศนูปกรณ์', nameEn: 'Audio Visual Equipment', description: 'อุปกรณ์เสียงและภาพ', icon: '🎬', color: '#10B981', sortOrder: 2 },
  { name: 'เครื่องใช้สำนักงาน', nameEn: 'Office Equipment', description: 'อุปกรณ์สำนักงานทั่วไป', icon: '🖨️', color: '#F59E0B', sortOrder: 3 },
  { name: 'เครื่องมือและอุปกรณ์', nameEn: 'Tools & Equipment', description: 'เครื่องมือและอุปกรณ์ทั่วไป', icon: '🔧', color: '#8B5CF6', sortOrder: 4 },
  { name: 'เฟอร์นิเจอร์', nameEn: 'Furniture', description: 'เฟอร์นิเจอร์และอุปกรณ์ตกแต่ง', icon: '🪑', color: '#EF4444', sortOrder: 5 }
];

const SUBCATEGORIES = {
  'คอมพิวเตอร์และอุปกรณ์': [
    { name: 'คอมพิวเตอร์ตั้งโต๊ะ', nameEn: 'Desktop Computers', icon: '🖥️', sortOrder: 1 },
    { name: 'โน็ตบุ๊ค', nameEn: 'Laptops', icon: '💻', sortOrder: 2 },
    { name: 'จอมอนิเตอร์', nameEn: 'Monitors', icon: '🖥️', sortOrder: 3 },
    { name: 'เครื่องพิมพ์', nameEn: 'Printers', icon: '🖨️', sortOrder: 4 }
  ],
  'อุปกรณ์โสตทัศนูปกรณ์': [
    { name: 'โปรเจคเตอร์', nameEn: 'Projectors', icon: '📽️', sortOrder: 1 },
    { name: 'กล้องถ่ายรูป', nameEn: 'Cameras', icon: '📷', sortOrder: 2 },
    { name: 'อุปกรณ์เสียง', nameEn: 'Audio Equipment', icon: '🔊', sortOrder: 3 }
  ]
};

// Color options for categories
const COLOR_OPTIONS = [
  { value: '#3B82F6', label: 'น้ำเงิน' },
  { value: '#10B981', label: 'เขียว' },
  { value: '#F59E0B', label: 'ส้ม' },
  { value: '#8B5CF6', label: 'ม่วง' },
  { value: '#EF4444', label: 'แดง' },
  { value: '#EC4899', label: 'ชมพู' },
  { value: '#6B7280', label: 'เทา' },
  { value: '#14B8A6', label: 'เขียวอมฟ้า' }
];

// Icon options
const ICON_OPTIONS = ['💻', '🖥️', '🎬', '📽️', '📷', '🔊', '🖨️', '🔧', '🪑', '📁', '📦', '⚙️', '🎯', '📱', '🎧', '🎤'];


// Category Form Modal Component
const CategoryFormModal = ({ isOpen, onClose, category, parentCategory, onSave, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    description: '',
    icon: '📁',
    color: '#3B82F6',
    sortOrder: 0
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        nameEn: category.nameEn || '',
        description: category.description || '',
        icon: category.icon || '📁',
        color: category.color || '#3B82F6',
        sortOrder: category.sortOrder || 0
      });
    } else {
      setFormData({
        name: '',
        nameEn: '',
        description: '',
        icon: '📁',
        color: parentCategory?.color || '#3B82F6',
        sortOrder: 0
      });
    }
    setErrors({});
  }, [category, parentCategory, isOpen]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'กรุณาระบุชื่อหมวดหมู่';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'ชื่อหมวดหมู่ต้องมีอย่างน้อย 2 ตัวอักษร';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave({
        ...formData,
        parentId: parentCategory?.id || null
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative inline-block w-full max-w-lg p-6 my-8 text-left align-middle bg-white rounded-lg shadow-xl transform transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {category ? 'แก้ไขหมวดหมู่' : parentCategory ? 'เพิ่มหมวดหมู่ย่อย' : 'เพิ่มหมวดหมู่ใหม่'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {parentCategory && !category && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                เพิ่มหมวดหมู่ย่อยภายใต้: <span className="font-medium">{parentCategory.icon} {parentCategory.name}</span>
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อหมวดหมู่ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.name ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="เช่น คอมพิวเตอร์และอุปกรณ์"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* English Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อภาษาอังกฤษ</label>
              <input
                type="text"
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Computers & Equipment"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="คำอธิบายสั้นๆ เกี่ยวกับหมวดหมู่นี้"
              />
            </div>

            {/* Icon & Color */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ไอคอน</label>
                <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-lg max-h-24 overflow-y-auto">
                  {ICON_OPTIONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon })}
                      className={`w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 ${formData.icon === icon ? 'bg-blue-100 ring-2 ring-blue-500' : ''}`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">สี</label>
                <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-lg">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`w-8 h-8 rounded-full border-2 ${formData.color === color.value ? 'border-gray-800 ring-2 ring-offset-2 ring-gray-400' : 'border-transparent'}`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ลำดับการแสดงผล</label>
              <input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                min="0"
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">ตัวเลขน้อยจะแสดงก่อน</p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={isLoading}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {category ? 'บันทึกการแก้ไข' : 'เพิ่มหมวดหมู่'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};


// Delete Confirmation Modal
const DeleteConfirmModal = ({ isOpen, onClose, category, onConfirm, isLoading }) => {
  if (!isOpen || !category) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="relative bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <TrashIcon />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">ยืนยันการลบหมวดหมู่</h3>
          </div>
          
          <p className="text-gray-600 mb-4">
            คุณต้องการลบหมวดหมู่ <span className="font-medium">{category.icon} {category.name}</span> ใช่หรือไม่?
          </p>
          
          {category.equipmentCount > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ หมวดหมู่นี้มีอุปกรณ์ {category.equipmentCount} รายการ กรุณาย้ายหรือลบอุปกรณ์ก่อน
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isLoading}
            >
              ยกเลิก
            </button>
            <button
              onClick={() => onConfirm(category.id)}
              disabled={isLoading || category.equipmentCount > 0}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              ลบหมวดหมู่
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Category Tree Item Component
const CategoryTreeItem = ({ category, children, level = 0, onEdit, onDelete, onAddChild }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = children && children.length > 0;

  return (
    <div className="select-none">
      <div 
        className={`flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-gray-50 group ${level > 0 ? 'ml-6' : ''}`}
        style={{ borderLeft: level > 0 ? `3px solid ${category.color || '#6B7280'}` : 'none' }}
      >
        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 ${!hasChildren ? 'invisible' : ''}`}
        >
          <ChevronDownIcon isOpen={isExpanded} />
        </button>

        {/* Icon */}
        <span className="text-xl">{category.icon || '📁'}</span>

        {/* Category Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 truncate">{category.name}</span>
            {category.nameEn && (
              <span className="text-xs text-gray-500 truncate">({category.nameEn})</span>
            )}
          </div>
          {category.description && (
            <p className="text-xs text-gray-500 truncate">{category.description}</p>
          )}
        </div>

        {/* Equipment Count Badge */}
        <span 
          className="px-2 py-0.5 text-xs font-medium rounded-full"
          style={{ backgroundColor: `${category.color}20`, color: category.color }}
        >
          {category.equipmentCount || 0} รายการ
        </span>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onAddChild(category)}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
            title="เพิ่มหมวดหมู่ย่อย"
          >
            <PlusIcon />
          </button>
          <button
            onClick={() => onEdit(category)}
            className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
            title="แก้ไข"
          >
            <EditIcon />
          </button>
          <button
            onClick={() => onDelete(category)}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
            title="ลบ"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mt-1">
          {children.map((child) => (
            <CategoryTreeItem
              key={child.id}
              category={child}
              children={child.children}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
};


// Main CategoryManagement Component
const CategoryManagement = () => {
  const { user } = useAuth();
  const { categories, loading: contextLoading, refetch } = useCategories();
  
  // State
  const [categoriesTree, setCategoriesTree] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [parentCategory, setParentCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);
  
  // Seed state
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState('');

  // Build tree structure from flat categories
  const buildTree = useCallback((flatCategories) => {
    const categoryMap = new Map();
    const rootCategories = [];

    // Create map
    flatCategories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    // Build tree
    flatCategories.forEach(cat => {
      const node = categoryMap.get(cat.id);
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        categoryMap.get(cat.parentId).children.push(node);
      } else {
        rootCategories.push(node);
      }
    });

    // Sort
    const sortCategories = (cats) => {
      cats.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      cats.forEach(cat => {
        if (cat.children.length > 0) {
          sortCategories(cat.children);
        }
      });
    };
    sortCategories(rootCategories);

    return rootCategories;
  }, []);

  // Update tree when categories change
  useEffect(() => {
    if (categories && categories.length > 0) {
      setCategoriesTree(buildTree(categories));
    } else {
      setCategoriesTree([]);
    }
  }, [categories, buildTree]);

  // Clear messages after timeout
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Handlers
  const handleAddCategory = () => {
    setEditingCategory(null);
    setParentCategory(null);
    setShowFormModal(true);
  };

  const handleAddChildCategory = (parent) => {
    setEditingCategory(null);
    setParentCategory(parent);
    setShowFormModal(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setParentCategory(null);
    setShowFormModal(true);
  };

  const handleDeleteCategory = (category) => {
    setDeletingCategory(category);
    setShowDeleteModal(true);
  };

  const handleSaveCategory = async (formData) => {
    setLoading(true);
    setError('');
    
    try {
      if (editingCategory) {
        // Update existing category
        await EquipmentCategoryService.updateCategory(
          editingCategory.id,
          formData,
          user.uid
        );
        setSuccess('แก้ไขหมวดหมู่สำเร็จ');
      } else {
        // Create new category
        await EquipmentCategoryService.createCategory(formData, user.uid);
        setSuccess('เพิ่มหมวดหมู่สำเร็จ');
      }
      
      setShowFormModal(false);
      await refetch();
    } catch (err) {
      console.error('Error saving category:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกหมวดหมู่');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async (categoryId) => {
    setLoading(true);
    setError('');
    
    try {
      await EquipmentCategoryService.deleteCategory(categoryId, user.uid);
      setSuccess('ลบหมวดหมู่สำเร็จ');
      setShowDeleteModal(false);
      setDeletingCategory(null);
      await refetch();
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการลบหมวดหมู่');
    } finally {
      setLoading(false);
    }
  };

  // Seed default categories
  const handleSeedCategories = async () => {
    setSeeding(true);
    setError('');
    setSeedResult('');
    
    try {
      let output = '🌱 เริ่มต้นเพิ่มหมวดหมู่...\n\n';
      const categoryMap = new Map();
      let addedCount = 0;
      let skippedCount = 0;

      // Check existing categories
      const existingCategories = await EquipmentCategoryService.getCategories();
      const existingNames = new Set(existingCategories.map(c => c.name));

      // Add main categories
      output += '📁 กำลังเพิ่มหมวดหมู่หลัก...\n';
      for (const cat of DEFAULT_CATEGORIES) {
        if (existingNames.has(cat.name)) {
          const existing = existingCategories.find(c => c.name === cat.name);
          categoryMap.set(cat.name, existing.id);
          output += `  ⏭️ มีอยู่แล้ว: ${cat.name}\n`;
          skippedCount++;
        } else {
          const created = await EquipmentCategoryService.createCategory(cat, user.uid);
          categoryMap.set(cat.name, created.id);
          output += `  ✅ เพิ่ม: ${cat.name}\n`;
          addedCount++;
        }
      }

      // Add subcategories
      for (const [parentName, subcats] of Object.entries(SUBCATEGORIES)) {
        const parentId = categoryMap.get(parentName);
        if (!parentId) continue;

        const parentCat = DEFAULT_CATEGORIES.find(c => c.name === parentName);
        output += `\n${parentCat?.icon || '📁'} กำลังเพิ่มหมวดหมู่ย่อย - ${parentName}...\n`;

        for (const subcat of subcats) {
          if (existingNames.has(subcat.name)) {
            output += `  ⏭️ มีอยู่แล้ว: ${subcat.name}\n`;
            skippedCount++;
          } else {
            await EquipmentCategoryService.createCategory({
              ...subcat,
              description: subcat.nameEn,
              color: parentCat?.color || '#6B7280',
              parentId
            }, user.uid);
            output += `  ✅ เพิ่ม: ${subcat.name}\n`;
            addedCount++;
          }
        }
      }

      output += '\n' + '='.repeat(40) + '\n';
      output += `📊 สรุป: เพิ่มใหม่ ${addedCount} | มีอยู่แล้ว ${skippedCount}\n`;
      output += '='.repeat(40) + '\n';
      output += '✨ เสร็จสิ้น!';

      setSeedResult(output);
      await refetch();
    } catch (err) {
      console.error('Error seeding categories:', err);
      setError(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  // Stats
  const totalCategories = categories?.length || 0;
  const mainCategories = categories?.filter(c => !c.parentId).length || 0;
  const subCategories = totalCategories - mainCategories;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">จัดการหมวดหมู่อุปกรณ์</h1>
            <p className="text-gray-600 mt-1">เพิ่ม แก้ไข และจัดการหมวดหมู่อุปกรณ์ในระบบ</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSeedCategories}
              disabled={seeding}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
            >
              {seeding ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <span>🌱</span>
              )}
              เพิ่มหมวดหมู่เริ่มต้น
            </button>
            <button
              onClick={handleAddCategory}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <PlusIcon />
              เพิ่มหมวดหมู่
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FolderIcon />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalCategories}</p>
                <p className="text-sm text-gray-500">หมวดหมู่ทั้งหมด</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                📁
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{mainCategories}</p>
                <p className="text-sm text-gray-500">หมวดหมู่หลัก</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                📂
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{subCategories}</p>
                <p className="text-sm text-gray-500">หมวดหมู่ย่อย</p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Seed Result */}
        {seedResult && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <pre className="text-sm text-blue-900 whitespace-pre-wrap font-mono">{seedResult}</pre>
          </div>
        )}

        {/* Categories Tree */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">รายการหมวดหมู่</h2>
          </div>
          
          <div className="p-4">
            {contextLoading ? (
              <div className="flex items-center justify-center py-12">
                <svg className="w-8 h-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="ml-3 text-gray-600">กำลังโหลดหมวดหมู่...</span>
              </div>
            ) : categoriesTree.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📁</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีหมวดหมู่</h3>
                <p className="text-gray-500 mb-4">เริ่มต้นด้วยการเพิ่มหมวดหมู่เริ่มต้น หรือสร้างหมวดหมู่ใหม่</p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={handleSeedCategories}
                    disabled={seeding}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    🌱 เพิ่มหมวดหมู่เริ่มต้น
                  </button>
                  <button
                    onClick={handleAddCategory}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    เพิ่มหมวดหมู่ใหม่
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {categoriesTree.map((category) => (
                  <CategoryTreeItem
                    key={category.id}
                    category={category}
                    children={category.children}
                    onEdit={handleEditCategory}
                    onDelete={handleDeleteCategory}
                    onAddChild={handleAddChildCategory}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        <CategoryFormModal
          isOpen={showFormModal}
          onClose={() => setShowFormModal(false)}
          category={editingCategory}
          parentCategory={parentCategory}
          onSave={handleSaveCategory}
          isLoading={loading}
        />

        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setDeletingCategory(null);
          }}
          category={deletingCategory}
          onConfirm={handleConfirmDelete}
          isLoading={loading}
        />
      </div>
    </Layout>
  );
};

export default CategoryManagement;
