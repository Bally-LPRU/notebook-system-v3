import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

export const useEquipmentCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, authInitialized } = useAuth();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);

        // Simple query without composite index requirement
        const categoriesRef = collection(db, 'equipmentCategories');
        const querySnapshot = await getDocs(categoriesRef);
        
        const categoriesData = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          // Filter active categories
          .filter(cat => cat.isActive !== false)
          // Sort in memory
          .sort((a, b) => {
            // Sort by sortOrder first
            const sortOrderDiff = (a.sortOrder || 0) - (b.sortOrder || 0);
            if (sortOrderDiff !== 0) return sortOrderDiff;
            
            // Then by name (Thai locale)
            return (a.name || '').localeCompare(b.name || '', 'th');
          });

        setCategories(categoriesData);
      } catch (err) {
        console.error('Error fetching equipment categories:', err);
        setError('เกิดข้อผิดพลาดในการโหลดประเภทอุปกรณ์');
      } finally {
        setLoading(false);
      }
    };

    // Wait until auth is ready to avoid permission errors
    if (!authInitialized) return;
    if (!user) {
      setCategories([]);
      setLoading(false);
      return;
    }

    fetchCategories();
  }, [authInitialized, user]);

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
