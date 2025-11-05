import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  EQUIPMENT_MANAGEMENT_STATUS,
  EQUIPMENT_MANAGEMENT_STATUS_LABELS,
  DEFAULT_EQUIPMENT_MANAGEMENT_FORM,
  EQUIPMENT_MANAGEMENT_VALIDATION
} from '../../types/equipmentManagement';
import EquipmentManagementService from '../../services/equipmentManagementService';
import EquipmentCategoryService from '../../services/equipmentCategoryService';
import { 
  ImageUpload, 
  CategorySelector, 
  AutocompleteInput, 
  RichTextEditor, 
  DatePicker, 
  CurrencyInput 
} from './FieldComponents';
import LoadingSpinner from '../common/LoadingSpinner';
// We'll implement validation inline for now

const EquipmentManagementForm = ({ 
  equipment = null, 
  onSubmit, 
  onCancel,
  mode = 'create' // 'create' or 'edit'
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState(DEFAULT_EQUIPMENT_MANAGEMENT_FORM);
  const [imageFiles, setImageFiles] = useState([]);
  const [removeImageIds, setRemoveImageIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [checkingEquipmentNumber, setCheckingEquipmentNumber] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isDirty, setIsDirty] = useState(false);

  // Form validation state
  const [errors, setErrors] = useState({});
  const [saveStatus, setSaveStatus] = useState('');

  // Validation functions
  const validateField = useCallback((field, value, options = {}) => {
    const rules = EQUIPMENT_MANAGEMENT_VALIDATION[field];
    if (!rules) return true;

    if (options.customError) {
      setErrors(prev => ({ ...prev, [field]: options.customError }));
      return false;
    }

    // Required validation
    if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
      setErrors(prev => ({ ...prev, [field]: `กรุณากรอก${field}` }));
      return false;
    }

    // Pattern validation
    if (rules.pattern && value && !rules.pattern.test(value)) {
      setErrors(prev => ({ ...prev, [field]: 'รูปแบบไม่ถูกต้อง' }));
      return false;
    }

    return true;
  }, []);

  const validateForm = useCallback((data) => {
    let isValid = true;
    const newErrors = {};

    // Validate required fields
    if (!data.equipmentNumber?.trim()) {
      newErrors.equipmentNumber = 'กรุณากรอกหมายเลขครุภัณฑ์';
      isValid = false;
    }

    if (!data.name?.trim()) {
      newErrors.name = 'กรุณากรอกชื่ออุปกรณ์';
      isValid = false;
    }

    if (!data.category) {
      newErrors.category = 'กรุณาเลือกประเภทอุปกรณ์';
      isValid = false;
    }

    if (!data.status) {
      newErrors.status = 'กรุณาเลือกสถานะ';
      isValid = false;
    }

    if (!data.location?.building?.trim()) {
      newErrors.location = 'กรุณากรอกสถานที่ตั้ง';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  }, []);

  const clearError = useCallback((field) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (isDirty) {
      const timer = setTimeout(() => {
        localStorage.setItem(`equipment-draft-${equipment?.id || 'new'}`, JSON.stringify(formData));
        setSaveStatus('บันทึกแบบร่างแล้ว');
        setTimeout(() => setSaveStatus(''), 2000);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [formData, isDirty, equipment?.id]);

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const categoriesData = await EquipmentCategoryService.getActiveCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  // Initialize form data for editing
  useEffect(() => {
    if (mode === 'edit' && equipment) {
      const editFormData = {
        equipmentNumber: equipment.equipmentNumber || '',
        name: equipment.name || '',
        category: equipment.category || null,
        brand: equipment.brand || '',
        model: equipment.model || '',
        description: equipment.description || '',
        specifications: equipment.specifications || {},
        status: equipment.status || EQUIPMENT_MANAGEMENT_STATUS.ACTIVE,
        location: equipment.location || {
          building: '',
          floor: '',
          room: '',
          description: ''
        },
        purchaseDate: equipment.purchaseDate ? 
          new Date(equipment.purchaseDate.seconds * 1000).toISOString().split('T')[0] : '',
        purchasePrice: equipment.purchasePrice || 0,
        vendor: equipment.vendor || '',
        warrantyExpiry: equipment.warrantyExpiry ? 
          new Date(equipment.warrantyExpiry.seconds * 1000).toISOString().split('T')[0] : '',
        responsiblePerson: equipment.responsiblePerson || null,
        tags: equipment.tags || [],
        notes: equipment.notes || ''
      };
      
      setFormData(editFormData);
    }
  }, [mode, equipment]);

  // Handle input changes
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);
    clearError(field);
  }, [clearError]);

  // Handle nested object changes (like location)
  const handleNestedChange = useCallback((parentField, childField, value) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [childField]: value
      }
    }));
    setIsDirty(true);
    clearError(parentField);
  }, [clearError]);

  // Handle array changes (like tags) - will be used later for tags functionality

  // Check equipment number uniqueness
  const checkEquipmentNumberUniqueness = useCallback(async (equipmentNumber) => {
    if (!equipmentNumber || equipmentNumber.length < 1) return;
    
    setCheckingEquipmentNumber(true);
    try {
      const isUnique = await EquipmentManagementService.isEquipmentNumberUnique(
        equipmentNumber, 
        mode === 'edit' ? equipment?.id : null
      );
      
      if (!isUnique) {
        validateField('equipmentNumber', equipmentNumber, {
          customError: 'หมายเลขครุภัณฑ์นี้มีอยู่ในระบบแล้ว'
        });
      }
    } catch (error) {
      console.error('Error checking equipment number:', error);
    } finally {
      setCheckingEquipmentNumber(false);
    }
  }, [mode, equipment?.id, validateField]);

  // Handle equipment number blur
  const handleEquipmentNumberBlur = useCallback(() => {
    if (formData.equipmentNumber && formData.equipmentNumber.trim()) {
      checkEquipmentNumberUniqueness(formData.equipmentNumber.trim());
    }
  }, [formData.equipmentNumber, checkEquipmentNumberUniqueness]);

  // Handle image changes
  const handleImageFilesChange = useCallback((newImageFiles) => {
    setImageFiles(newImageFiles);
    setIsDirty(true);
  }, []);

  // Handle image removal
  const handleImageRemove = useCallback((imageId) => {
    if (mode === 'edit' && equipment?.images) {
      setRemoveImageIds(prev => [...prev, imageId]);
    }
    setIsDirty(true);
  }, [mode, equipment?.images]);

  // Multi-step form navigation
  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate entire form
    const isValid = validateForm(formData);
    if (!isValid) {
      // Go to first step with errors
      setCurrentStep(1);
      return;
    }

    setLoading(true);

    try {
      let result;
      if (mode === 'edit') {
        result = await EquipmentManagementService.updateEquipment(
          equipment.id,
          formData,
          imageFiles,
          removeImageIds,
          user.uid
        );
      } else {
        result = await EquipmentManagementService.createEquipment(
          formData,
          imageFiles,
          user.uid
        );
      }

      // Clear draft
      localStorage.removeItem(`equipment-draft-${equipment?.id || 'new'}`);
      
      if (onSubmit) {
        onSubmit(result);
      }
    } catch (error) {
      console.error('Error saving equipment:', error);
      validateField('submit', null, {
        customError: error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
      });
    } finally {
      setLoading(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderBasicInfoStep();
      case 2:
        return renderDetailsStep();
      case 3:
        return renderImagesStep();
      default:
        return renderBasicInfoStep();
    }
  };

  // Step 1: Basic Information
  const renderBasicInfoStep = () => (
    <div className="space-y-6">
      {/* Equipment Number */}
      <div>
        <label htmlFor="equipmentNumber" className="block text-sm font-medium text-gray-700">
          หมายเลขครุภัณฑ์ <span className="text-red-500">*</span>
        </label>
        <div className="mt-1 relative">
          <input
            type="text"
            id="equipmentNumber"
            value={formData.equipmentNumber}
            onChange={(e) => handleInputChange('equipmentNumber', e.target.value.toUpperCase())}
            onBlur={handleEquipmentNumberBlur}
            className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
              errors.equipmentNumber ? 'border-red-300' : ''
            }`}
            placeholder="เช่น EQ001"
            disabled={loading}
          />
          {checkingEquipmentNumber && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <LoadingSpinner size="sm" />
            </div>
          )}
          {errors.equipmentNumber && (
            <p className="mt-2 text-sm text-red-600">{errors.equipmentNumber}</p>
          )}
        </div>
      </div>

      {/* Equipment Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          ชื่ออุปกรณ์ <span className="text-red-500">*</span>
        </label>
        <div className="mt-1">
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
              errors.name ? 'border-red-300' : ''
            }`}
            placeholder="เช่น MacBook Pro 13-inch"
            disabled={loading}
          />
          {errors.name && (
            <p className="mt-2 text-sm text-red-600">{errors.name}</p>
          )}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          ประเภทอุปกรณ์ <span className="text-red-500">*</span>
        </label>
        <div className="mt-1">
          <CategorySelector
            categories={categories}
            selectedCategory={formData.category}
            onCategoryChange={(category) => handleInputChange('category', category)}
            loading={loadingCategories}
            error={errors.category}
            disabled={loading}
          />
          {errors.category && (
            <p className="mt-2 text-sm text-red-600">{errors.category}</p>
          )}
        </div>
      </div>

      {/* Brand and Model */}
      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
        <div>
          <label htmlFor="brand" className="block text-sm font-medium text-gray-700">
            ยี่ห้อ
          </label>
          <div className="mt-1">
            <AutocompleteInput
              id="brand"
              value={formData.brand}
              onChange={(value) => handleInputChange('brand', value)}
              placeholder="เช่น Apple"
              suggestions={['Apple', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'Microsoft', 'Samsung', 'LG', 'Sony']}
              disabled={loading}
              error={errors.brand}
            />
          </div>
        </div>

        <div>
          <label htmlFor="model" className="block text-sm font-medium text-gray-700">
            รุ่น
          </label>
          <div className="mt-1">
            <AutocompleteInput
              id="model"
              value={formData.model}
              onChange={(value) => handleInputChange('model', value)}
              placeholder="เช่น M1 2021"
              suggestions={[]}
              disabled={loading}
              error={errors.model}
            />
          </div>
        </div>
      </div>

      {/* Status */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
          สถานะ <span className="text-red-500">*</span>
        </label>
        <div className="mt-1">
          <select
            id="status"
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
            className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
              errors.status ? 'border-red-300' : ''
            }`}
            disabled={loading}
          >
            {Object.entries(EQUIPMENT_MANAGEMENT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {errors.status && (
            <p className="mt-2 text-sm text-red-600">{errors.status}</p>
          )}
        </div>
      </div>
    </div>
  );

  // Step 2: Details
  const renderDetailsStep = () => (
    <div className="space-y-6">
      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          รายละเอียด
        </label>
        <div className="mt-1">
          <RichTextEditor
            id="description"
            value={formData.description}
            onChange={(value) => handleInputChange('description', value)}
            placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับอุปกรณ์..."
            disabled={loading}
            error={errors.description}
            maxLength={1000}
          />
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          สถานที่ตั้ง <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
          <div>
            <input
              type="text"
              placeholder="อาคาร"
              value={formData.location.building}
              onChange={(e) => handleNestedChange('location', 'building', e.target.value)}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              disabled={loading}
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="ชั้น"
              value={formData.location.floor}
              onChange={(e) => handleNestedChange('location', 'floor', e.target.value)}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              disabled={loading}
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="ห้อง"
              value={formData.location.room}
              onChange={(e) => handleNestedChange('location', 'room', e.target.value)}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              disabled={loading}
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="รายละเอียดเพิ่มเติม"
              value={formData.location.description}
              onChange={(e) => handleNestedChange('location', 'description', e.target.value)}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              disabled={loading}
            />
          </div>
        </div>
        {errors.location && (
          <p className="mt-2 text-sm text-red-600">{errors.location}</p>
        )}
      </div>

      {/* Purchase Information */}
      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
        <div>
          <DatePicker
            id="purchaseDate"
            value={formData.purchaseDate}
            onChange={(value) => handleInputChange('purchaseDate', value)}
            label="วันที่ซื้อ"
            disabled={loading}
            error={errors.purchaseDate}
            maxDate={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div>
          <CurrencyInput
            id="purchasePrice"
            value={formData.purchasePrice}
            onChange={(value) => handleInputChange('purchasePrice', value)}
            label="ราคาซื้อ"
            disabled={loading}
            error={errors.purchasePrice}
            min={0}
            currency="THB"
          />
        </div>
      </div>

      {/* Vendor and Warranty */}
      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
        <div>
          <label htmlFor="vendor" className="block text-sm font-medium text-gray-700">
            ผู้จำหน่าย
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="vendor"
              value={formData.vendor}
              onChange={(e) => handleInputChange('vendor', e.target.value)}
              className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                errors.vendor ? 'border-red-300' : ''
              }`}
              placeholder="เช่น บริษัท ABC จำกัด"
              disabled={loading}
            />
            {errors.vendor && (
              <p className="mt-2 text-sm text-red-600">{errors.vendor}</p>
            )}
          </div>
        </div>

        <div>
          <DatePicker
            id="warrantyExpiry"
            value={formData.warrantyExpiry}
            onChange={(value) => handleInputChange('warrantyExpiry', value)}
            label="วันหมดประกัน"
            disabled={loading}
            error={errors.warrantyExpiry}
            minDate={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <RichTextEditor
          id="notes"
          value={formData.notes}
          onChange={(value) => handleInputChange('notes', value)}
          placeholder="หมายเหตุเพิ่มเติม..."
          disabled={loading}
          error={errors.notes}
          maxLength={500}
          minHeight="80px"
          showToolbar={false}
        />
      </div>
    </div>
  );

  // Step 3: Images
  const renderImagesStep = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          รูปภาพอุปกรณ์
        </label>
        <ImageUpload
          images={mode === 'edit' ? equipment?.images || [] : []}
          imageFiles={imageFiles}
          onImageFilesChange={handleImageFilesChange}
          onImageRemove={handleImageRemove}
          maxImages={10}
          disabled={loading}
        />
        {errors.images && (
          <p className="mt-2 text-sm text-red-600">{errors.images}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form Header */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {mode === 'edit' ? 'แก้ไขอุปกรณ์' : 'เพิ่มอุปกรณ์ใหม่'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {mode === 'edit' ? 'แก้ไขข้อมูลอุปกรณ์ในระบบ' : 'เพิ่มอุปกรณ์ใหม่เข้าสู่ระบบ'}
                </p>
                {saveStatus && (
                  <p className="mt-1 text-xs text-gray-400">
                    {saveStatus}
                  </p>
                )}
              </div>
            </div>

            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                      currentStep >= step 
                        ? 'bg-blue-600 border-blue-600 text-white' 
                        : 'border-gray-300 text-gray-500'
                    }`}>
                      {step}
                    </div>
                    <div className={`ml-2 text-sm font-medium ${
                      currentStep >= step ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {step === 1 && 'ข้อมูลพื้นฐาน'}
                      {step === 2 && 'รายละเอียด'}
                      {step === 3 && 'รูปภาพ'}
                    </div>
                    {step < 3 && (
                      <div className={`ml-4 w-16 h-0.5 ${
                        currentStep > step ? 'bg-blue-600' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">เกิดข้อผิดพลาด</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{errors.submit}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step Content */}
            {renderStepContent()}

            {/* Form Actions */}
            <div className="mt-8 flex justify-between">
              <div>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={loading}
                  >
                    ย้อนกลับ
                  </button>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  ยกเลิก
                </button>
                
                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={loading}
                  >
                    ถัดไป
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading || checkingEquipmentNumber}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        {mode === 'edit' ? 'กำลังอัปเดต...' : 'กำลังบันทึก...'}
                      </>
                    ) : (
                      mode === 'edit' ? 'อัปเดต' : 'บันทึก'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EquipmentManagementForm;