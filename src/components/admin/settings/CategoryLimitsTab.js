/**
 * Category Limits Tab
 * 
 * Manages category-specific borrowing limits for equipment.
 * Allows admins to set maximum number of items users can borrow per category.
 * 
 * Features:
 * - Display all equipment categories
 * - Set/update limit per category
 * - Show current borrowed count per category
 * - Save functionality with validation
 * 
 * Requirements: 6.1, 6.5
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { useCategories } from '../../../contexts/EquipmentCategoriesContext';
import settingsService from '../../../services/settingsService';
import CategoryLimitEditor from './CategoryLimitEditor';
import { SettingsToast, SettingsAlert } from './SettingsNotifications';
import { SettingsLoadingState } from './SettingsTabSkeleton';

/**
 * CategoryLimitsTab Component
 * 
 * Tab for managing category-specific borrowing limits.
 * Displays all categories with their current limits and borrowed counts.
 * 
 * @component
 * @returns {JSX.Element} Category limits tab
 */
const CategoryLimitsTab = () => {
  const { userProfile } = useAuth();
  const { settings, refreshSettings } = useSettings();
  const { categories, loading: categoriesLoading } = useCategories();
  
  const [categoryLimits, setCategoryLimits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  /**
   * Load category limits on mount
   */
  useEffect(() => {
    loadCategoryLimits();
  }, [categories]);

  /**
   * Load all category limits from service
   */
  const loadCategoryLimits = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!categories || categories.length === 0) {
        setLoading(false);
        return;
      }

      // Get all category limits from service
      const limits = await settingsService.getAllCategoryLimits();
      
      // Create a map of category ID to limit
      const limitsMap = new Map(limits.map(l => [l.categoryId, l]));
      
      // Merge with categories to create complete list
      const mergedLimits = categories.map(category => {
        const existingLimit = limitsMap.get(category.id);
        return {
          categoryId: category.id,
          categoryName: category.name,
          limit: existingLimit?.limit || null,
          currentBorrowedCount: existingLimit?.currentBorrowedCount || 0,
          updatedAt: existingLimit?.updatedAt || null,
          updatedBy: existingLimit?.updatedBy || null
        };
      });

      setCategoryLimits(mergedLimits);
      setLoading(false);
    } catch (err) {
      console.error('Error loading category limits:', err);
      setError('ไม่สามารถโหลดข้อมูลจำกัดการยืมได้: ' + err.message);
      setLoading(false);
    }
  };

  /**
   * Handle limit change for a category
   * @param {string} categoryId - Category ID
   * @param {number|null} newLimit - New limit value
   */
  const handleLimitChange = (categoryId, newLimit) => {
    setCategoryLimits(prev => 
      prev.map(item => 
        item.categoryId === categoryId 
          ? { ...item, limit: newLimit }
          : item
      )
    );
    setHasChanges(true);
    setSuccessMessage('');
  };

  /**
   * Save all category limits
   */
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage('');

      // Filter only categories with limits set
      const limitsToSave = categoryLimits.filter(item => item.limit !== null);

      // Save each limit
      for (const item of limitsToSave) {
        await settingsService.setCategoryLimit(
          item.categoryId,
          item.categoryName,
          item.limit,
          userProfile.uid
        );
      }

      // Refresh settings context
      await refreshSettings();

      // Reload category limits to get updated data
      await loadCategoryLimits();

      setSuccessMessage('บันทึกการตั้งค่าจำกัดการยืมสำเร็จ');
      setHasChanges(false);
      setSaving(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error saving category limits:', err);
      setError('ไม่สามารถบันทึกการตั้งค่าได้: ' + err.message);
      setSaving(false);
    }
  };

  /**
   * Reset changes
   */
  const handleReset = () => {
    loadCategoryLimits();
    setHasChanges(false);
    setSuccessMessage('');
    setError(null);
  };

  // Show loading state
  if (loading || categoriesLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <SettingsLoadingState message="กำลังโหลดข้อมูล..." />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">จำกัดการยืมตามประเภท</h2>
        <p className="mt-1 text-sm text-gray-600">
          กำหนดจำนวนอุปกรณ์สูงสุดที่ผู้ใช้สามารถยืมได้ในแต่ละประเภท
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-6">
          <SettingsAlert type="error" message={error} />
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="mx-6 mt-6">
          <SettingsToast
            type="success"
            message={successMessage}
            onClose={() => setSuccessMessage('')}
            duration={3000}
          />
        </div>
      )}

      {/* Default Limit Info */}
      <div className="mx-6 mt-6">
        <SettingsAlert type="info">
          <p>
            <strong>จำกัดเริ่มต้นของระบบ:</strong> {settings.defaultCategoryLimit || 3} ชิ้นต่อประเภท
          </p>
          <p className="mt-1">
            หากไม่ได้กำหนดจำนวนจำกัดสำหรับประเภทใดๆ ระบบจะใช้ค่าเริ่มต้นนี้
          </p>
        </SettingsAlert>
      </div>

      {/* Category Limits List */}
      <div className="p-6">
        {categoryLimits.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="mt-4 text-lg font-semibold text-gray-700">ไม่พบประเภทอุปกรณ์</p>
            <p className="mt-2 text-sm text-gray-500">
              กรุณาเพิ่มประเภทอุปกรณ์ก่อนตั้งค่าจำกัดการยืม
            </p>
            <a 
              href="/admin/categories" 
              className="mt-6 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              ไปที่หน้าจัดการหมวดหมู่
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {categoryLimits.map((item) => (
              <CategoryLimitEditor
                key={item.categoryId}
                categoryId={item.categoryId}
                categoryName={item.categoryName}
                limit={item.limit}
                currentBorrowedCount={item.currentBorrowedCount}
                defaultLimit={settings.defaultCategoryLimit || 3}
                onChange={handleLimitChange}
              />
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {categoryLimits.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {hasChanges && (
              <span className="text-amber-600">
                <svg className="inline w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก
              </span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleReset}
              disabled={!hasChanges || saving}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  กำลังบันทึก...
                </>
              ) : (
                'บันทึกการตั้งค่า'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <SettingsAlert type="info" title="คำแนะนำ">
          <ul className="list-disc list-inside space-y-1">
            <li>ปล่อยว่างเพื่อใช้ค่าเริ่มต้นของระบบ</li>
            <li>ตั้งค่าเป็น 0 เพื่อไม่อนุญาตให้ยืมประเภทนั้น</li>
            <li>จำนวนที่ยืมอยู่ปัจจุบันจะแสดงเป็นสีแดงเมื่อถึงขีดจำกัด</li>
            <li>การเปลี่ยนแปลงจะมีผลทันทีหลังจากบันทึก</li>
          </ul>
        </SettingsAlert>
      </div>
    </div>
  );
};

export default CategoryLimitsTab;
