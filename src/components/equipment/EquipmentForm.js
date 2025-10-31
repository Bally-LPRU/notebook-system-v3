import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  EQUIPMENT_CATEGORIES, 
  EQUIPMENT_CATEGORY_LABELS,
  EQUIPMENT_STATUS,
  EQUIPMENT_STATUS_LABELS,
  DEFAULT_EQUIPMENT_FORM 
} from '../../types/equipment';
import { validateEquipmentForm, validateImageFile, sanitizeEquipmentForm } from '../../utils/equipmentValidation';
import EquipmentService from '../../services/equipmentService';
import LoadingSpinner from '../common/LoadingSpinner';

const EquipmentForm = ({ 
  equipment = null, 
  onSubmit, 
  onCancel,
  isEdit = false 
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState(DEFAULT_EQUIPMENT_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [checkingSerial, setCheckingSerial] = useState(false);

  // Initialize form data for editing
  useEffect(() => {
    if (isEdit && equipment) {
      setFormData({
        name: equipment.name || '',
        category: equipment.category || '',
        brand: equipment.brand || '',
        model: equipment.model || '',
        serialNumber: equipment.serialNumber || '',
        description: equipment.description || '',
        status: equipment.status || EQUIPMENT_STATUS.AVAILABLE,
        location: equipment.location || '',
        purchaseDate: equipment.purchaseDate ? 
          new Date(equipment.purchaseDate.seconds * 1000).toISOString().split('T')[0] : '',
        warrantyExpiry: equipment.warrantyExpiry ? 
          new Date(equipment.warrantyExpiry.seconds * 1000).toISOString().split('T')[0] : ''
      });
      
      if (equipment.imageURL) {
        setImagePreview(equipment.imageURL);
      }
    }
  }, [isEdit, equipment]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setImageFile(null);
      setImagePreview(isEdit && equipment?.imageURL ? equipment.imageURL : null);
      return;
    }

    // Validate image
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setErrors(prev => ({
        ...prev,
        image: validation.errors[0]
      }));
      return;
    }

    setImageFile(file);
    setErrors(prev => ({
      ...prev,
      image: null
    }));

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    // Reset file input
    const fileInput = document.getElementById('equipment-image');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const checkSerialNumberUniqueness = async (serialNumber) => {
    if (!serialNumber || serialNumber.length < 1) return;
    
    setCheckingSerial(true);
    try {
      const isUnique = await EquipmentService.isSerialNumberUnique(
        serialNumber, 
        isEdit ? equipment?.id : null
      );
      
      if (!isUnique) {
        setErrors(prev => ({
          ...prev,
          serialNumber: 'หมายเลขซีเรียลนี้มีอยู่ในระบบแล้ว'
        }));
      }
    } catch (error) {
      console.error('Error checking serial number:', error);
    } finally {
      setCheckingSerial(false);
    }
  };

  const handleSerialNumberBlur = () => {
    if (formData.serialNumber && formData.serialNumber.trim()) {
      checkSerialNumberUniqueness(formData.serialNumber.trim());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Sanitize form data
    const sanitizedData = sanitizeEquipmentForm(formData);
    
    // Validate form
    const validation = validateEquipmentForm(sanitizedData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Validate image if provided
    if (imageFile) {
      const imageValidation = validateImageFile(imageFile);
      if (!imageValidation.isValid) {
        setErrors(prev => ({
          ...prev,
          image: imageValidation.errors[0]
        }));
        return;
      }
    }

    setLoading(true);
    setErrors({});

    try {
      let result;
      if (isEdit) {
        result = await EquipmentService.updateEquipment(
          equipment.id,
          sanitizedData,
          imageFile,
          user.uid
        );
      } else {
        result = await EquipmentService.createEquipment(
          sanitizedData,
          imageFile,
          user.uid
        );
      }

      if (onSubmit) {
        onSubmit(result);
      }
    } catch (error) {
      console.error('Error saving equipment:', error);
      setErrors({
        submit: error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form Header */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {isEdit ? 'แก้ไขอุปกรณ์' : 'เพิ่มอุปกรณ์ใหม่'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {isEdit ? 'แก้ไขข้อมูลอุปกรณ์ในระบบ' : 'เพิ่มอุปกรณ์ใหม่เข้าสู่ระบบ'}
                </p>
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
                <button
                  type="submit"
                  disabled={loading || checkingSerial}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      {isEdit ? 'กำลังอัปเดต...' : 'กำลังบันทึก...'}
                    </>
                  ) : (
                    isEdit ? 'อัปเดต' : 'บันทึก'
                  )}
                </button>
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

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              {/* Equipment Name */}
              <div className="sm:col-span-2">
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
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  ประเภทอุปกรณ์ <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                      errors.category ? 'border-red-300' : ''
                    }`}
                    disabled={loading}
                  >
                    <option value="">เลือกประเภทอุปกรณ์</option>
                    {Object.entries(EQUIPMENT_CATEGORY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-2 text-sm text-red-600">{errors.category}</p>
                  )}
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
                    {Object.entries(EQUIPMENT_STATUS_LABELS).map(([value, label]) => (
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

              {/* Brand */}
              <div>
                <label htmlFor="brand" className="block text-sm font-medium text-gray-700">
                  ยี่ห้อ <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => handleInputChange('brand', e.target.value)}
                    className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                      errors.brand ? 'border-red-300' : ''
                    }`}
                    placeholder="เช่น Apple"
                    disabled={loading}
                  />
                  {errors.brand && (
                    <p className="mt-2 text-sm text-red-600">{errors.brand}</p>
                  )}
                </div>
              </div>

              {/* Model */}
              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                  รุ่น <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="model"
                    value={formData.model}
                    onChange={(e) => handleInputChange('model', e.target.value)}
                    className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                      errors.model ? 'border-red-300' : ''
                    }`}
                    placeholder="เช่น M1 2021"
                    disabled={loading}
                  />
                  {errors.model && (
                    <p className="mt-2 text-sm text-red-600">{errors.model}</p>
                  )}
                </div>
              </div>

              {/* Serial Number */}
              <div className="sm:col-span-2">
                <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700">
                  หมายเลขซีเรียล <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    id="serialNumber"
                    value={formData.serialNumber}
                    onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                    onBlur={handleSerialNumberBlur}
                    className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                      errors.serialNumber ? 'border-red-300' : ''
                    }`}
                    placeholder="เช่น ABC123456789"
                    disabled={loading}
                  />
                  {checkingSerial && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <LoadingSpinner size="sm" />
                    </div>
                  )}
                  {errors.serialNumber && (
                    <p className="mt-2 text-sm text-red-600">{errors.serialNumber}</p>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="sm:col-span-2">
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  สถานที่เก็บ <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                      errors.location ? 'border-red-300' : ''
                    }`}
                    placeholder="เช่น ห้อง IT-101, ตู้ A-1"
                    disabled={loading}
                  />
                  {errors.location && (
                    <p className="mt-2 text-sm text-red-600">{errors.location}</p>
                  )}
                </div>
              </div>

              {/* Purchase Date */}
              <div>
                <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700">
                  วันที่ซื้อ
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    id="purchaseDate"
                    value={formData.purchaseDate}
                    onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                    className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                      errors.purchaseDate ? 'border-red-300' : ''
                    }`}
                    disabled={loading}
                  />
                  {errors.purchaseDate && (
                    <p className="mt-2 text-sm text-red-600">{errors.purchaseDate}</p>
                  )}
                </div>
              </div>

              {/* Warranty Expiry */}
              <div>
                <label htmlFor="warrantyExpiry" className="block text-sm font-medium text-gray-700">
                  วันหมดประกัน
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    id="warrantyExpiry"
                    value={formData.warrantyExpiry}
                    onChange={(e) => handleInputChange('warrantyExpiry', e.target.value)}
                    className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                      errors.warrantyExpiry ? 'border-red-300' : ''
                    }`}
                    disabled={loading}
                  />
                  {errors.warrantyExpiry && (
                    <p className="mt-2 text-sm text-red-600">{errors.warrantyExpiry}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  รายละเอียดเพิ่มเติม
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                      errors.description ? 'border-red-300' : ''
                    }`}
                    placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับอุปกรณ์..."
                    disabled={loading}
                  />
                  {errors.description && (
                    <p className="mt-2 text-sm text-red-600">{errors.description}</p>
                  )}
                </div>
              </div>

              {/* Equipment Image */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  รูปภาพอุปกรณ์
                </label>
                <div className="mt-1">
                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Equipment preview"
                        className="h-32 w-32 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                        disabled={loading}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                          <label htmlFor="equipment-image" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                            <span>อัปโหลดรูปภาพ</span>
                            <input
                              id="equipment-image"
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleImageChange}
                              disabled={loading}
                            />
                          </label>
                          <p className="pl-1">หรือลากไฟล์มาวาง</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, WebP ขนาดไม่เกิน 5MB
                        </p>
                      </div>
                    </div>
                  )}
                  {errors.image && (
                    <p className="mt-2 text-sm text-red-600">{errors.image}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EquipmentForm;