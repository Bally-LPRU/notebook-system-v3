import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import FormField from '../common/FormField';
import DepartmentSelector from '../common/DepartmentSelector';
import ProgressIndicator from '../common/ProgressIndicator';
import DraftManager from '../common/DraftManager';
import { AutoSaveIndicator, ButtonLoadingState, FormLoadingState } from '../common/LoadingState';
import useFormValidation from '../../hooks/useFormValidation';
import useAutoSave from '../../hooks/useAutoSave';
import useDuplicateDetection from '../../hooks/useDuplicateDetection';
import ProfileStatusDisplay from './ProfileStatusDisplay';

const EnhancedProfileSetupForm = ({
  initialFormData = null,
  onFormDataChange = null,
  profileError = null,
  isRetrying = false,
  canRetry = false,
  onRetry = null,
  onClearError = null,
  errorMessage = null,
  errorClassification = null
}) => {
  const { user, updateProfile, loading, error } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  // Duplicate detection hook
  const {
    isChecking: isDuplicateChecking,
    duplicateResult,
    error: duplicateError,
    checkDuplicates,
    clearState: clearDuplicateState,
    hasDuplicate,
    existingProfile
  } = useDuplicateDetection();

  // Form validation rules
  const validationRules = {
    firstName: {
      required: true,
      label: 'ชื่อ',
      minLength: 1,
      maxLength: 50,
      pattern: /^[ก-๙a-zA-Z\s]+$/,
      patternError: 'ชื่อต้องเป็นภาษาไทยหรือภาษาอังกฤษเท่านั้น'
    },
    lastName: {
      required: true,
      label: 'นามสกุล',
      minLength: 1,
      maxLength: 50,
      pattern: /^[ก-๙a-zA-Z\s]+$/,
      patternError: 'นามสกุลต้องเป็นภาษาไทยหรือภาษาอังกฤษเท่านั้น'
    },
    phoneNumber: {
      required: true,
      label: 'เบอร์โทรศัพท์',
      pattern: /^[0-9]{9,10}$/,
      patternError: 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก',
      customValidator: (value) => {
        const cleanNumber = value.replace(/[-\s]/g, '');
        if (!/^(06|08|09)/.test(cleanNumber)) {
          return {
            isValid: false,
            error: 'เบอร์โทรศัพท์ต้องเริ่มต้นด้วย 06, 08, หรือ 09'
          };
        }
        return { isValid: true };
      }
    },
    department: {
      required: true,
      label: 'สังกัด/แผนก',
      customValidator: (value) => {
        const validDepartments = [
          'accounting', 'digital-business', 'business-admin', 'management',
          'computer-business', 'communication', 'logistics', 'tourism',
          'modern-business', 'dean-office'
        ];
        if (!validDepartments.includes(value)) {
          return {
            isValid: false,
            error: 'กรุณาเลือกสังกัดจากรายการที่กำหนด'
          };
        }
        return { isValid: true };
      }
    },
    userType: {
      required: true,
      label: 'ประเภทผู้ใช้',
      customValidator: (value) => {
        if (!['student', 'teacher', 'staff'].includes(value)) {
          return {
            isValid: false,
            error: 'กรุณาเลือกประเภทผู้ใช้ที่ถูกต้อง'
          };
        }
        return { isValid: true };
      }
    }
  };

  // Initialize form validation with preserved data if available
  const {
    formData,
    errors,
    isFormValid,
    completedFields,
    requiredFields,
    handleFieldChange,
    handleFieldBlur,
    validateForm,
    setFormData
  } = useFormValidation(initialFormData || {
    firstName: '',
    lastName: '',
    phoneNumber: '',
    department: '',
    userType: ''
  }, validationRules);

  // Auto-save functionality
  const saveDraft = useCallback(async (data) => {
    // This is just for localStorage backup, not actual profile save
    return Promise.resolve();
  }, []);

  const {
    saveStatus,
    lastSaved
  } = useAutoSave({
    data: formData,
    saveFunction: saveDraft,
    delay: 3000,
    enabled: true,
    storageKey: `profile-draft-${user?.uid}`,
    onSaveStart: () => console.log('Auto-saving draft...'),
    onSaveSuccess: () => console.log('Draft saved to localStorage'),
    onSaveError: (error) => console.warn('Draft save failed:', error)
  });

  // User types options
  const userTypes = [
    { value: 'student', label: 'นักศึกษา' },
    { value: 'teacher', label: 'อาจารย์' },
    { value: 'staff', label: 'เจ้าหน้าที่' }
  ];

  // Department options
  const departmentOptions = [
    { value: 'accounting', label: 'สาขาวิชาการบัญชี' },
    { value: 'digital-business', label: 'สาขาวิชาการจัดการธุรกิจดิจิทัล' },
    { value: 'business-admin', label: 'สาขาวิชาบริหารธุรกิจ' },
    { value: 'management', label: 'สาขาวิชาการจัดการ' },
    { value: 'computer-business', label: 'สาขาวิชาคอมพิวเตอร์ธุรกิจ' },
    { value: 'communication', label: 'สาขาวิชานิเทศศาสตร์' },
    { value: 'logistics', label: 'สาขาวิชาโลจิสติกส์และธุรกิจระหว่างประเทศ' },
    { value: 'tourism', label: 'สาขานวัตกรรมการท่องเที่ยวและธุรกิจบริการ' },
    { value: 'modern-business', label: 'สาขาวิชาการจัดการธุรกิจสมัยใหม่' },
    { value: 'dean-office', label: 'สำนักงานคณบดี' }
  ];

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    handleFieldChange(name, value);
    
    // Notify parent component of form data changes for preservation
    if (onFormDataChange) {
      const updatedData = { ...formData, [name]: value };
      onFormDataChange(updatedData);
    }
  };

  // Handle department change
  const handleDepartmentChange = (e) => {
    handleFieldChange('department', e.target.value);
    
    // Notify parent component of form data changes for preservation
    if (onFormDataChange) {
      const updatedData = { ...formData, department: e.target.value };
      onFormDataChange(updatedData);
    }
  };

  // Check for duplicates when user email is available (non-blocking)
  useEffect(() => {
    if (user?.email && !hasDuplicate) {
      checkDuplicates(user.email).catch(error => {
        console.warn('⚠️ Duplicate check failed in useEffect:', error);
        // Don't block the form if duplicate check fails
      });
    }
  }, [user?.email, checkDuplicates, hasDuplicate]);

  // Handle duplicate detection result
  useEffect(() => {
    if (duplicateResult?.hasDuplicate && duplicateResult.existingProfile) {
      const profile = duplicateResult.existingProfile;
      
      // If profile is complete and not incomplete status, show status display
      if (profile.status !== 'incomplete') {
        setShowDuplicateWarning(true);
      }
    }
  }, [duplicateResult]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateForm();
    if (!validation.isValid) {
      setSubmitError('กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง');
      return;
    }

    // Check for duplicates before submission (non-blocking)
    try {
      const duplicateCheck = await checkDuplicates(user.email, formData.phoneNumber);
      if (duplicateCheck?.hasDuplicate && duplicateCheck.existingProfile?.status !== 'incomplete') {
        setSubmitError('พบบัญชีของคุณในระบบแล้ว กรุณาตรวจสอบสถานะบัญชี');
        setShowDuplicateWarning(true);
        return;
      }
    } catch (duplicateError) {
      console.warn('⚠️ Duplicate check failed before submission, continuing:', duplicateError);
      // Continue with profile update even if duplicate check fails
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const selectedDepartment = departmentOptions.find(dept => dept.value === formData.department);
      
      await updateProfile({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        department: selectedDepartment || { value: formData.department, label: formData.department },
        userType: formData.userType,
        status: 'pending'
      });
      
      // Clear draft after successful submission
      localStorage.removeItem(`profile-draft-${user?.uid}`);
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Profile setup error:', error);
      setSubmitError(error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle draft loading
  const handleLoadDraft = (draftData) => {
    setFormData(draftData);
  };

  // Handle draft clearing
  const handleClearDraft = () => {
    // Draft is already cleared by DraftManager
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <FormLoadingState message="กำลังโหลดข้อมูล..." />
      </div>
    );
  }

  // Show duplicate warning/status if needed
  if (showDuplicateWarning && existingProfile) {
    return (
      <ProfileStatusDisplay 
        profile={existingProfile}
        onRetry={() => {
          setShowDuplicateWarning(false);
          clearDuplicateState();
        }}
        showActions={true}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8 respect-motion-preference">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 animate-fade-in">
          {/* Progress Sidebar - Hidden on mobile, shown as top bar on tablet, sidebar on desktop */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="lg:sticky lg:top-8">
              <div className="lg:block">
                <ProgressIndicator
                  completedFields={completedFields}
                  requiredFields={requiredFields}
                  showFieldProgress={true}
                  className="bg-white rounded-lg shadow-sm p-4 lg:p-6"
                />
              </div>
            </div>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="bg-white shadow-sm rounded-lg">
              <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Header */}
                <div className="text-center mb-6 sm:mb-8">
                  <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 flex items-center justify-center rounded-full bg-primary-100" aria-hidden="true">
                    <svg className="h-8 w-8 sm:h-10 sm:w-10 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h1 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-extrabold text-gray-900" id="profile-setup-title">
                    ตั้งค่าโปรไฟล์
                  </h1>
                  <p className="mt-2 text-sm sm:text-base text-gray-600" id="profile-setup-description">
                    กรุณากรอกข้อมูลเพิ่มเติมเพื่อใช้งานระบบ
                  </p>
                  
                  {user && (
                    <div className="mt-4 flex items-center justify-center" role="region" aria-labelledby="user-info-label">
                      <span id="user-info-label" className="sr-only">ข้อมูลผู้ใช้ปัจจุบัน</span>
                      <img
                        className="h-8 w-8 sm:h-10 sm:w-10 rounded-full"
                        src={user.photoURL || '/default-avatar.png'}
                        alt={`รูปโปรไฟล์ของ ${user.displayName || 'ผู้ใช้'}`}
                      />
                      <div className="ml-3 text-left">
                        <p className="text-sm font-medium text-gray-900" aria-label="ชื่อผู้ใช้">{user.displayName}</p>
                        <p className="text-sm text-gray-500" aria-label="อีเมล">{user.email}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Draft Manager */}
                <DraftManager
                  storageKey={`profile-draft-${user?.uid}`}
                  onLoadDraft={handleLoadDraft}
                  onClearDraft={handleClearDraft}
                  className="mb-6"
                />

                {/* Auto-save Indicator */}
                <div className="flex justify-between items-center mb-6">
                  <div></div>
                  <AutoSaveIndicator 
                    status={saveStatus} 
                    lastSaved={lastSaved}
                  />
                </div>

                {/* Enhanced Error Display */}
                {(error || submitError || duplicateError || profileError) && (
                  <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm text-red-800">
                          {errorMessage || error || submitError || duplicateError || profileError?.message}
                        </p>
                        
                        {/* Enhanced error details */}
                        {errorClassification && (
                          <div className="mt-2">
                            <p className="text-xs text-red-600">
                              {errorClassification.suggestion}
                            </p>
                            
                            {/* Network status indicator for network errors */}
                            {errorClassification.category === 'network' && (
                              <div className="mt-2 flex items-center text-xs">
                                <div className={`h-2 w-2 rounded-full mr-2 ${navigator.onLine ? 'bg-green-400' : 'bg-red-400'}`}></div>
                                <span className="text-red-700">
                                  สถานะการเชื่อมต่อ: {navigator.onLine ? 'เชื่อมต่อแล้ว' : 'ไม่ได้เชื่อมต่อ'}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Retry button for retryable errors */}
                        {canRetry && onRetry && (
                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={onRetry}
                              disabled={isRetrying}
                              className="inline-flex items-center px-3 py-1 border border-red-300 text-xs font-medium rounded text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                              {isRetrying ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b border-red-600 mr-2"></div>
                                  กำลังลองใหม่...
                                </>
                              ) : (
                                <>
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  ลองใหม่
                                </>
                              )}
                            </button>
                            
                            {onClearError && (
                              <button
                                type="button"
                                onClick={onClearError}
                                className="ml-2 inline-flex items-center px-3 py-1 text-xs font-medium text-red-700 hover:text-red-900 focus:outline-none transition-colors duration-200"
                              >
                                ปิด
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Duplicate Detection Status */}
                {isDuplicateChecking && (
                  <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-blue-800">กำลังตรวจสอบข้อมูลในระบบ...</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form */}
                <form 
                  onSubmit={handleSubmit} 
                  className="space-y-4 sm:space-y-6"
                  aria-labelledby="profile-setup-title"
                  aria-describedby="profile-setup-description"
                  noValidate
                >
                  {/* Name Fields */}
                  <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6" aria-labelledby="name-fields-legend">
                    <legend id="name-fields-legend" className="sr-only">ข้อมูลชื่อ-นามสกุล</legend>
                    <FormField
                      id="firstName"
                      name="firstName"
                      type="text"
                      label="ชื่อ"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      onBlur={() => handleFieldBlur('firstName')}
                      placeholder="ชื่อ"
                      required={true}
                      error={errors.firstName}
                      validationRules={validationRules.firstName}
                      showGuidance={true}
                    />

                    <FormField
                      id="lastName"
                      name="lastName"
                      type="text"
                      label="นามสกุล"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      onBlur={() => handleFieldBlur('lastName')}
                      placeholder="นามสกุล"
                      required={true}
                      error={errors.lastName}
                      validationRules={validationRules.lastName}
                      showGuidance={true}
                    />
                  </fieldset>

                  {/* Phone Number */}
                  <FormField
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    label="เบอร์โทรศัพท์"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('phoneNumber')}
                    placeholder="0812345678"
                    required={true}
                    error={errors.phoneNumber}
                    validationRules={validationRules.phoneNumber}
                    showGuidance={true}
                  />

                  {/* Department */}
                  <div>
                    <label htmlFor="department-selector" className="block text-sm font-medium text-gray-700">
                      <span className="flex items-center">
                        สังกัด/แผนก 
                        <span className="text-red-500 ml-1" aria-label="ฟิลด์จำเป็น">*</span>
                      </span>
                    </label>
                    <div className="mt-1">
                      <DepartmentSelector
                        id="department-selector"
                        value={formData.department}
                        onChange={handleDepartmentChange}
                        error={errors.department}
                        required
                        placeholder="เลือกสังกัด/แผนก"
                        aria-describedby={errors.department ? "department-error" : "department-help"}
                        aria-invalid={!!errors.department}
                      />
                      <div id="department-help" className="sr-only">
                        เลือกสังกัดหรือแผนกที่คุณสังกัดอยู่จากรายการที่กำหนด
                      </div>
                      {errors.department && (
                        <div id="department-error" role="alert" aria-live="polite">
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {errors.department}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* User Type */}
                  <div>
                    <label htmlFor="userType" className="block text-sm font-medium text-gray-700">
                      ประเภทผู้ใช้ 
                      <span className="text-red-500 ml-1" aria-label="ฟิลด์จำเป็น">*</span>
                    </label>
                    <select
                      id="userType"
                      name="userType"
                      required
                      value={formData.userType}
                      onChange={handleInputChange}
                      onBlur={() => handleFieldBlur('userType')}
                      aria-describedby={errors.userType ? "userType-error" : "userType-help"}
                      aria-invalid={!!errors.userType}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm transition-colors duration-200 ${
                        errors.userType 
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                      }`}
                    >
                      <option value="">เลือกประเภทผู้ใช้</option>
                      {userTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    <div id="userType-help" className="sr-only">
                      เลือกประเภทผู้ใช้ที่ตรงกับสถานะของคุณ: นักศึกษา อาจารย์ หรือเจ้าหน้าที่
                    </div>
                    {errors.userType && (
                      <div id="userType-error" role="alert" aria-live="polite">
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {errors.userType}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 sm:pt-6">
                    <button
                      type="submit"
                      disabled={isSubmitting || !isFormValid || isDuplicateChecking || isRetrying}
                      aria-describedby="submit-help"
                      className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
                    >
                      <span className="sr-only" id="submit-help">
                        {isSubmitting || isDuplicateChecking || isRetrying 
                          ? 'กำลังดำเนินการ กรุณารอสักครู่' 
                          : isFormValid 
                            ? 'พร้อมส่งข้อมูล คลิกเพื่อบันทึกโปรไฟล์' 
                            : 'กรุณากรอกข้อมูลให้ครบถ้วนก่อนส่ง'
                        }
                      </span>
                      {isSubmitting ? (
                        <ButtonLoadingState message="กำลังบันทึก..." />
                      ) : isDuplicateChecking ? (
                        <ButtonLoadingState message="กำลังตรวจสอบ..." />
                      ) : isRetrying ? (
                        <ButtonLoadingState message="กำลังลองใหม่..." />
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          บันทึกข้อมูล
                        </>
                      )}
                    </button>
                  </div>

                  {/* Info Text */}
                  <div className="text-center" role="region" aria-labelledby="approval-info">
                    <h3 id="approval-info" className="sr-only">ข้อมูลเกี่ยวกับการอนุมัติบัญชี</h3>
                    <p className="text-sm text-gray-500">
                      หลังจากบันทึกข้อมูลแล้ว บัญชีของคุณจะอยู่ในสถานะ "รอการอนุมัติ"
                    </p>
                    <p className="text-xs sm:text-sm text-gray-400 mt-1">
                      ผู้ดูแลระบบจะตรวจสอบและอนุมัติบัญชีของคุณภายใน 1-2 วันทำการ
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedProfileSetupForm;