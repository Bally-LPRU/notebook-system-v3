import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export const useEquipmentCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);

        const categoriesQuery = query(
          collection(db, 'equipmentCategories'),
          where('isActive', '==', true),
          orderBy('sortOrder', 'asc'),
          orderBy('name', 'asc')
        );

        const querySnapshot = await getDocs(categoriesQuery);
        const categoriesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setCategories(categoriesData);
      } catch (err) {
        console.error('Error fetching equipment categories:', err);
        setError('เกิดข้อผิดพลาดในการโหลดประเภทอุปกรณ์');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Get category by ID
  const getCategoryById = (categoryId) => {
    return categories.find(category => category.id === categoryId);
  };

  // Get categories by parent ID
  const getCategoriesByParent = (parentId = null) => {
    return categories.filter(category => category.parentId === parentId);
  };

  // Get root categories (no parent)
  const getRootCategories = () => {
    return getCategoriesByParent(null);
  };

  // Get category hierarchy
  const getCategoryHierarchy = () => {
    const rootCategories = getRootCategories();
    
    const buildHierarchy = (parentCategories) => {
      return parentCategories.map(category => ({
        ...category,
        children: buildHierarchy(getCategoriesByParent(category.id))
      }));
    };

    return buildHierarchy(rootCategories);
  };

  // Get category path (breadcrumb)
  const getCategoryPath = (categoryId) => {
    const category = getCategoryById(categoryId);
    if (!category) return [];

    const path = [category];
    let currentCategory = category;

    while (currentCategory.parentId) {
      const parentCategory = getCategoryById(currentCategory.parentId);
      if (parentCategory) {
        path.unshift(parentCategory);
        currentCategory = parentCategory;
      } else {
        break;
      }
    }

    return path;
  };

  // Search categories
  const searchCategories = (searchTerm) => {
    if (!searchTerm) return categories;
    
    const term = searchTerm.toLowerCase();
    return categories.filter(category => 
      category.name.toLowerCase().includes(term) ||
      category.nameEn?.toLowerCase().includes(term) ||
      category.description?.toLowerCase().includes(term)
    );
  };

  return {
    categories,
    loading,
    error,
    getCategoryById,
    getCategoriesByParent,
    getRootCategories,
    getCategoryHierarchy,
    getCategoryPath,
    searchCategories
  };
};