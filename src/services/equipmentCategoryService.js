import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  writeBatch,
  increment
} from 'firebase/firestore';
import { db } from '../config/firebase';
import CacheService from './cacheService';

class EquipmentCategoryService {
  static COLLECTION_NAME = 'equipmentCategories';

  /**
   * Create new equipment category
   * @param {Object} categoryData - Category data
   * @param {string} createdBy - UID of creator
   * @returns {Promise<Object>} Created category with ID
   */
  static async createCategory(categoryData, createdBy) {
    try {
      // Validate required fields
      this.validateCategoryData(categoryData);

      // Calculate level and path
      let level = 0;
      let path = categoryData.name;
      
      if (categoryData.parentId) {
        const parent = await this.getCategoryById(categoryData.parentId);
        if (!parent) {
          throw new Error('Parent category not found');
        }
        if (!parent.isActive) {
          throw new Error('Parent category is not active');
        }
        level = parent.level + 1;
        path = `${parent.path}/${categoryData.name}`;
      }

      const category = {
        name: categoryData.name.trim(),
        nameEn: categoryData.nameEn?.trim() || '',
        description: categoryData.description?.trim() || '',
        icon: categoryData.icon || '',
        color: categoryData.color || '#6B7280',
        parentId: categoryData.parentId || null,
        level,
        path,
        requiredFields: categoryData.requiredFields || [],
        customFields: categoryData.customFields || [],
        equipmentCount: 0,
        isActive: true,
        sortOrder: categoryData.sortOrder || 0,
        createdAt: serverTimestamp(),
        createdBy,
        updatedAt: serverTimestamp(),
        updatedBy: createdBy
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), category);
      
      const createdCategory = {
        id: docRef.id,
        ...category,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Invalidate categories cache
      CacheService.setCachedFilterOptions('categories', null);

      return createdCategory;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  /**
   * Update equipment category
   * @param {string} categoryId - Category ID
   * @param {Object} updateData - Data to update
   * @param {string} updatedBy - UID of updater
   * @returns {Promise<Object>} Updated category
   */
  static async updateCategory(categoryId, updateData, updatedBy) {
    try {
      const categoryRef = doc(db, this.COLLECTION_NAME, categoryId);
      const existingCategory = await this.getCategoryById(categoryId);
      
      if (!existingCategory) {
        throw new Error('Category not found');
      }

      // Validate update data
      this.validateCategoryData(updateData, true);

      // Handle parent change
      let level = existingCategory.level;
      let path = existingCategory.path;
      
      if (updateData.parentId !== undefined && updateData.parentId !== existingCategory.parentId) {
        if (updateData.parentId) {
          // Check for circular reference
          if (await this.wouldCreateCircularReference(categoryId, updateData.parentId)) {
            throw new Error('Cannot set parent: would create circular reference');
          }
          
          const parent = await this.getCategoryById(updateData.parentId);
          if (!parent) {
            throw new Error('Parent category not found');
          }
          if (!parent.isActive) {
            throw new Error('Parent category is not active');
          }
          level = parent.level + 1;
          path = `${parent.path}/${updateData.name || existingCategory.name}`;
        } else {
          level = 0;
          path = updateData.name || existingCategory.name;
        }
      } else if (updateData.name && updateData.name !== existingCategory.name) {
        // Update path if name changed
        const pathParts = existingCategory.path.split('/');
        pathParts[pathParts.length - 1] = updateData.name;
        path = pathParts.join('/');
      }

      const updatedCategory = {
        ...updateData,
        level,
        path,
        updatedAt: serverTimestamp(),
        updatedBy
      };

      await updateDoc(categoryRef, updatedCategory);

      // Update child categories if path changed
      if (path !== existingCategory.path) {
        await this.updateChildCategoriesPaths(categoryId, path);
      }

      const result = {
        id: categoryId,
        ...existingCategory,
        ...updatedCategory,
        updatedAt: new Date()
      };

      // Invalidate categories cache
      CacheService.setCachedFilterOptions('categories', null);

      return result;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  /**
   * Delete equipment category (soft delete)
   * @param {string} categoryId - Category ID
   * @param {string} deletedBy - UID of deleter
   * @returns {Promise<boolean>} Success status
   */
  static async deleteCategory(categoryId, deletedBy) {
    try {
      const category = await this.getCategoryById(categoryId);
      if (!category) {
        throw new Error('Category not found');
      }

      // Check if category has equipment
      if (category.equipmentCount > 0) {
        throw new Error('Cannot delete category with equipment. Please move or delete equipment first.');
      }

      // Check if category has children
      const children = await this.getChildCategories(categoryId);
      if (children.length > 0) {
        throw new Error('Cannot delete category with sub-categories. Please delete sub-categories first.');
      }

      const categoryRef = doc(db, this.COLLECTION_NAME, categoryId);
      await updateDoc(categoryRef, {
        isActive: false,
        updatedAt: serverTimestamp(),
        updatedBy: deletedBy
      });

      // Invalidate categories cache
      CacheService.setCachedFilterOptions('categories', null);

      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  /**
   * Get all categories
   * @param {boolean} includeInactive - Include inactive categories
   * @returns {Promise<Array>} Categories list
   */
  static async getCategories(includeInactive = false) {
    try {
      // Check cache first (only for active categories)
      if (!includeInactive) {
        const cachedCategories = CacheService.getCachedCategories();
        if (cachedCategories) {
          return cachedCategories;
        }
      }

      const categoriesRef = collection(db, this.COLLECTION_NAME);
      
      // Simple query without complex ordering to avoid index requirements
      const querySnapshot = await getDocs(categoriesRef);
      const categories = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Filter inactive categories if needed
        if (includeInactive || data.isActive !== false) {
          categories.push({
            id: doc.id,
            ...data
          });
        }
      });

      // Sort in memory to avoid composite index requirements
      categories.sort((a, b) => {
        // Sort by level first
        const levelDiff = (a.level || 0) - (b.level || 0);
        if (levelDiff !== 0) return levelDiff;
        
        // Then by sortOrder
        const sortOrderDiff = (a.sortOrder || 0) - (b.sortOrder || 0);
        if (sortOrderDiff !== 0) return sortOrderDiff;
        
        // Finally by name
        return (a.name || '').localeCompare(b.name || '', 'th');
      });

      // Cache active categories
      if (!includeInactive) {
        CacheService.setCachedCategories(categories);
      }
      
      return categories;
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  }

  /**
   * Get categories in hierarchical structure
   * @returns {Promise<Array>} Hierarchical categories tree
   */
  static async getCategoriesTree() {
    try {
      const categories = await this.getCategories();
      return this.buildCategoryTree(categories);
    } catch (error) {
      console.error('Error getting categories tree:', error);
      throw error;
    }
  }

  /**
   * Get category by ID
   * @param {string} categoryId - Category ID
   * @returns {Promise<Object|null>} Category data or null
   */
  static async getCategoryById(categoryId) {
    try {
      const categoryRef = doc(db, this.COLLECTION_NAME, categoryId);
      const categoryDoc = await getDoc(categoryRef);
      
      if (categoryDoc.exists()) {
        return {
          id: categoryDoc.id,
          ...categoryDoc.data()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting category by ID:', error);
      throw error;
    }
  }

  /**
   * Get child categories of a parent category
   * @param {string} parentId - Parent category ID
   * @returns {Promise<Array>} Child categories
   */
  static async getChildCategories(parentId) {
    try {
      // Get all categories and filter in memory
      const allCategories = await this.getCategories();
      const children = allCategories.filter(cat => cat.parentId === parentId);
      
      // Sort by sortOrder and name
      children.sort((a, b) => {
        const sortOrderDiff = (a.sortOrder || 0) - (b.sortOrder || 0);
        if (sortOrderDiff !== 0) return sortOrderDiff;
        return (a.name || '').localeCompare(b.name || '', 'th');
      });
      
      return children;
    } catch (error) {
      console.error('Error getting child categories:', error);
      throw error;
    }
  }

  /**
   * Get root categories (level 0)
   * @returns {Promise<Array>} Root categories
   */
  static async getRootCategories() {
    try {
      // Get all categories and filter in memory
      const allCategories = await this.getCategories();
      const rootCategories = allCategories.filter(cat => !cat.parentId && (cat.level === 0 || cat.level === undefined));
      
      // Sort by sortOrder and name
      rootCategories.sort((a, b) => {
        const sortOrderDiff = (a.sortOrder || 0) - (b.sortOrder || 0);
        if (sortOrderDiff !== 0) return sortOrderDiff;
        return (a.name || '').localeCompare(b.name || '', 'th');
      });
      
      return rootCategories;
    } catch (error) {
      console.error('Error getting root categories:', error);
      throw error;
    }
  }

  /**
   * Update equipment count for a category
   * @param {string} categoryId - Category ID
   * @param {number} increment - Increment value (can be negative)
   * @returns {Promise<void>}
   */
  static async updateEquipmentCount(categoryId, incrementValue) {
    try {
      const categoryRef = doc(db, this.COLLECTION_NAME, categoryId);
      await updateDoc(categoryRef, {
        equipmentCount: increment(incrementValue),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating equipment count:', error);
      throw error;
    }
  }

  /**
   * Search categories by name
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Matching categories
   */
  static async searchCategories(searchTerm) {
    try {
      const categories = await this.getCategories();
      const searchLower = searchTerm.toLowerCase();
      
      return categories.filter(category => 
        category.name.toLowerCase().includes(searchLower) ||
        category.nameEn.toLowerCase().includes(searchLower) ||
        category.description.toLowerCase().includes(searchLower)
      );
    } catch (error) {
      console.error('Error searching categories:', error);
      throw error;
    }
  }

  /**
   * Get category path as array
   * @param {string} categoryId - Category ID
   * @returns {Promise<Array>} Category path array
   */
  static async getCategoryPath(categoryId) {
    try {
      const category = await this.getCategoryById(categoryId);
      if (!category) {
        return [];
      }

      const pathArray = [];
      let currentCategory = category;

      while (currentCategory) {
        pathArray.unshift({
          id: currentCategory.id,
          name: currentCategory.name,
          level: currentCategory.level
        });

        if (currentCategory.parentId) {
          currentCategory = await this.getCategoryById(currentCategory.parentId);
        } else {
          currentCategory = null;
        }
      }

      return pathArray;
    } catch (error) {
      console.error('Error getting category path:', error);
      throw error;
    }
  }

  // Private helper methods

  /**
   * Validate category data
   * @param {Object} categoryData - Category data to validate
   * @param {boolean} isUpdate - Whether this is an update operation
   * @throws {Error} If validation fails
   */
  static validateCategoryData(categoryData, isUpdate = false) {
    if (!isUpdate && (!categoryData.name || categoryData.name.trim() === '')) {
      throw new Error('Category name is required');
    }

    if (categoryData.name && categoryData.name.trim().length < 2) {
      throw new Error('Category name must be at least 2 characters long');
    }

    if (categoryData.name && categoryData.name.trim().length > 100) {
      throw new Error('Category name must be less than 100 characters');
    }

    if (categoryData.customFields && !Array.isArray(categoryData.customFields)) {
      throw new Error('Custom fields must be an array');
    }

    if (categoryData.requiredFields && !Array.isArray(categoryData.requiredFields)) {
      throw new Error('Required fields must be an array');
    }

    // Validate custom fields structure
    if (categoryData.customFields) {
      categoryData.customFields.forEach((field, index) => {
        if (!field.name || !field.type) {
          throw new Error(`Custom field at index ${index} must have name and type`);
        }
        if (!['text', 'number', 'date', 'select', 'textarea'].includes(field.type)) {
          throw new Error(`Invalid field type: ${field.type}`);
        }
        if (field.type === 'select' && (!field.options || !Array.isArray(field.options))) {
          throw new Error(`Select field must have options array`);
        }
      });
    }
  }

  /**
   * Check if setting a parent would create circular reference
   * @param {string} categoryId - Category ID
   * @param {string} parentId - Proposed parent ID
   * @returns {Promise<boolean>} True if would create circular reference
   */
  static async wouldCreateCircularReference(categoryId, parentId) {
    try {
      let currentParent = await this.getCategoryById(parentId);
      
      while (currentParent) {
        if (currentParent.id === categoryId) {
          return true;
        }
        
        if (currentParent.parentId) {
          currentParent = await this.getCategoryById(currentParent.parentId);
        } else {
          currentParent = null;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking circular reference:', error);
      return true; // Err on the side of caution
    }
  }

  /**
   * Update paths of child categories when parent path changes
   * @param {string} parentId - Parent category ID
   * @param {string} newParentPath - New parent path
   * @returns {Promise<void>}
   */
  static async updateChildCategoriesPaths(parentId, newParentPath) {
    try {
      const children = await this.getChildCategories(parentId);
      const batch = writeBatch(db);

      for (const child of children) {
        const newChildPath = `${newParentPath}/${child.name}`;
        const childRef = doc(db, this.COLLECTION_NAME, child.id);
        
        batch.update(childRef, {
          path: newChildPath,
          updatedAt: serverTimestamp()
        });

        // Recursively update grandchildren
        await this.updateChildCategoriesPaths(child.id, newChildPath);
      }

      await batch.commit();
    } catch (error) {
      console.error('Error updating child categories paths:', error);
      throw error;
    }
  }

  /**
   * Build hierarchical tree structure from flat categories array
   * @param {Array} categories - Flat categories array
   * @returns {Array} Hierarchical tree structure
   */
  static buildCategoryTree(categories) {
    const categoryMap = new Map();
    const rootCategories = [];

    // Create map for quick lookup
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // Build tree structure
    categories.forEach(category => {
      const categoryNode = categoryMap.get(category.id);
      
      if (category.parentId && categoryMap.has(category.parentId)) {
        const parent = categoryMap.get(category.parentId);
        parent.children.push(categoryNode);
      } else {
        rootCategories.push(categoryNode);
      }
    });

    return rootCategories;
  }
}

export default EquipmentCategoryService;