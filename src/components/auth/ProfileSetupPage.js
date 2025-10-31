import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const ProfileSetupPage = () => {
  const { user, updateProfile, loading, error } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    department: '',
    userType: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userTypes = [
    { value: 'student', label: 'นักศึกษา' },
    { value: 'teacher', label: 'อาจารย์' },
    { value: 'staff', label: 'เจ้าหน้าที่' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.firstName.trim()) {
      errors.firstName = 'กรุณากรอกชื่อ';
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = 'กรุณากรอกนามสกุล';
    }
    
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'กรุณากรอกเบอร์โทรศัพท์';
    } else if (!/^[0-9]{9,10}$/.test(formData.phoneNumber.replace(/[-\s]/g, ''))) {
      errors.phoneNumber = 'กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (9-10 หลัก)';
    }
    
    if (!formData.department.trim()) {
      errors.department = 'กรุณากรอกสังกัด/แผนก';
    }
    
    if (!formData.userType) {
      errors.userType = 'กรุณาเลือกประเภทผู้ใช้';
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await updateProfile({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        department: formData.department.trim(),
        userType: formData.userType,
        status: 'pending' // Set status to pending for admin approval
      });
      
      // Navigate to dashboard after successful profile setup
      navigate('/dashboard');
    } catch (error) {
      console.error('Profile setup error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-primary-100">
            <svg className="h-10 w-10 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            ตั้งค่าโปรไฟล์
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            กรุณากรอกข้อมูลเพิ่มเติมเพื่อใช้งานระบบ
          </p>
          
          {user && (
            <div className="mt-4 flex items-center justify-center">
              <img
                className="h-10 w-10 rounded-full"
                src={user.photoURL || '/default-avatar.png'}
                alt={user.displayName}
              />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
          )}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  ชื่อ *
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                    formErrors.firstName ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm`}
                  placeholder="ชื่อ"
                />
                {formErrors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.firstName}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  นามสกุล *
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                    formErrors.lastName ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm`}
                  placeholder="นามสกุล"
                />
                {formErrors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                เบอร์โทรศัพท์ *
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  formErrors.phoneNumber ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm`}
                placeholder="0812345678"
              />
              {formErrors.phoneNumber && (
                <p className="mt-1 text-sm text-red-600">{formErrors.phoneNumber}</p>
              )}
            </div>

            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                สังกัด/แผนก *
              </label>
              <input
                id="department"
                name="department"
                type="text"
                required
                value={formData.department}
                onChange={handleInputChange}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  formErrors.department ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm`}
                placeholder="เช่น คณะวิทยาการคอมพิวเตอร์"
              />
              {formErrors.department && (
                <p className="mt-1 text-sm text-red-600">{formErrors.department}</p>
              )}
            </div>

            <div>
              <label htmlFor="userType" className="block text-sm font-medium text-gray-700">
                ประเภทผู้ใช้ *
              </label>
              <select
                id="userType"
                name="userType"
                required
                value={formData.userType}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border ${
                  formErrors.userType ? 'border-red-300' : 'border-gray-300'
                } bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
              >
                <option value="">เลือกประเภทผู้ใช้</option>
                {userTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {formErrors.userType && (
                <p className="mt-1 text-sm text-red-600">{formErrors.userType}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  กำลังบันทึก...
                </div>
              ) : (
                'บันทึกข้อมูล'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              หลังจากบันทึกข้อมูลแล้ว บัญชีของคุณจะอยู่ในสถานะ "รอการอนุมัติ"
            </p>
            <p className="text-xs text-gray-400 mt-1">
              ผู้ดูแลระบบจะตรวจสอบและอนุมัติบัญชีของคุณภายใน 1-2 วันทำการ
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetupPage;