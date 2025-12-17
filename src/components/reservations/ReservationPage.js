import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../layout/Layout';
import ReservationCalendar from './ReservationCalendar';
import ReservationForm from './ReservationForm';
import ReservationList from './ReservationList';
import { useEquipment } from '../../hooks/useEquipment';
import { useUserTypeLimits } from '../../hooks/useUserTypeLimits';
import { useSettings } from '../../contexts/SettingsContext';
import { useCategories } from '../../contexts/EquipmentCategoriesContext';
import EquipmentService from '../../services/equipmentService';

/**
 * ReservationPage Component
 * หน้าสำหรับจองอุปกรณ์ล่วงหน้าและดูการจองของตัวเอง
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
const ReservationPage = () => {
  const [searchParams] = useSearchParams();
  const equipmentIdFromUrl = searchParams.get('equipmentId');
  
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'my-reservations'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [loadingEquipmentFromUrl, setLoadingEquipmentFromUrl] = useState(false);

  // Get categories from context
  const { categories, loading: categoriesLoading } = useCategories();
  
  // Load equipment from URL parameter if provided
  useEffect(() => {
    const loadEquipmentFromUrl = async () => {
      if (equipmentIdFromUrl && !selectedEquipment) {
        setLoadingEquipmentFromUrl(true);
        try {
          const equipmentData = await EquipmentService.getEquipmentById(equipmentIdFromUrl);
          if (equipmentData) {
            setSelectedEquipment(equipmentData);
            // Also set the category if available
            if (equipmentData.category) {
              const categoryId = typeof equipmentData.category === 'object' 
                ? equipmentData.category.id 
                : equipmentData.category;
              setSelectedCategory(categoryId);
            }
          }
        } catch (error) {
          console.error('Error loading equipment from URL:', error);
        } finally {
          setLoadingEquipmentFromUrl(false);
        }
      }
    };
    
    loadEquipmentFromUrl();
  }, [equipmentIdFromUrl, selectedEquipment]);

  // Only load equipment when category is selected
  const { equipment, loading: equipmentLoading, updateFilters, triggerLoad, pagination, loadMore } = useEquipment({
    skipInitialLoad: true,
    limit: 20,
    filters: { status: 'available', category: selectedCategory }
  });

  // Load equipment when category changes
  useEffect(() => {
    if (selectedCategory) {
      updateFilters({ status: 'available', category: selectedCategory });
      triggerLoad();
    }
  }, [selectedCategory, updateFilters, triggerLoad]);

  // Filter equipment by search term (client-side for quick filtering)
  const filteredEquipment = equipment.filter(item => {
    if (!equipmentSearch.trim()) return true;
    const search = equipmentSearch.toLowerCase();
    return (
      item.name?.toLowerCase().includes(search) ||
      item.brand?.toLowerCase().includes(search) ||
      item.model?.toLowerCase().includes(search) ||
      item.serialNumber?.toLowerCase().includes(search) ||
      item.equipmentNumber?.toLowerCase().includes(search)
    );
  });

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setSelectedEquipment(null);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
    setShowReservationForm(false);
    setEquipmentSearch('');
  };

  // Use user type limits hook to get maxAdvanceBookingDays
  const { 
    limits, 
    loading: limitsLoading 
  } = useUserTypeLimits();

  // Check if reservation system is enabled
  const { settings, loading: settingsLoading } = useSettings();
  const isReservationEnabled = settings?.reservationSystemEnabled !== false;

  const handleEquipmentSelect = (equipment) => {
    setSelectedEquipment(equipment);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
    setShowReservationForm(false);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
    setShowReservationForm(false);
  };

  const handleTimeSlotSelect = (timeSlot) => {
    setSelectedTimeSlot(timeSlot);
    setShowReservationForm(false);
  };

  const handleShowReservationForm = () => {
    setShowReservationForm(true);
  };

  const handleReservationSuccess = (reservation) => {
    console.log('Reservation created:', reservation);
    setShowReservationForm(false);
    setSelectedEquipment(null);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
  };

  const handleReservationCancel = () => {
    setShowReservationForm(false);
  };

  // Show loading state
  if (settingsLoading || loadingEquipmentFromUrl) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">กำลังโหลด...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Show disabled message if reservation system is off (but still allow viewing existing reservations)
  if (!isReservationEnabled) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">การจองอุปกรณ์</h1>
          </div>
          
          {/* Warning Banner */}
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-yellow-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="font-semibold text-yellow-800">ระบบจองปิดใช้งานชั่วคราว</h3>
                <p className="text-sm text-yellow-700">
                  ไม่สามารถสร้างการจองใหม่ได้ในขณะนี้ แต่คุณยังสามารถดูการจองที่มีอยู่ได้
                </p>
              </div>
            </div>
          </div>
          
          {/* Show existing reservations */}
          <ReservationList isAdmin={false} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        {/* Header - Responsive */}
        <div className="mb-4 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">การจองอุปกรณ์</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
            จองอุปกรณ์ล่วงหน้าหรือดูการจองของคุณ
          </p>
        </div>

        {/* Tab Navigation - Mobile Optimized */}
        <div className="mb-4 sm:mb-6 border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('new')}
              className={`flex-1 sm:flex-none py-3 sm:py-4 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
                activeTab === 'new'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center justify-center gap-1 sm:gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="hidden xs:inline">จอง</span>ใหม่
              </span>
            </button>
            <button
              onClick={() => setActiveTab('my-reservations')}
              className={`flex-1 sm:flex-none py-3 sm:py-4 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
                activeTab === 'my-reservations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center justify-center gap-1 sm:gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="hidden xs:inline">การจอง</span>ของฉัน
              </span>
            </button>
          </nav>
        </div>

        {/* My Reservations Tab */}
        {activeTab === 'my-reservations' && (
          <ReservationList isAdmin={false} />
        )}

        {/* New Reservation Tab */}
        {activeTab === 'new' && (
          <>

        {/* Advance Booking Limit Info Card - Mobile Optimized */}
        {!limitsLoading && (
          <div className="mb-4 sm:mb-6 bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-start space-x-2 sm:space-x-3">
              <div className="flex-shrink-0 hidden sm:block">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xs sm:text-sm font-medium text-blue-800">
                  ข้อจำกัดการจองล่วงหน้า
                </h3>
                <div className="mt-1 text-xs sm:text-sm text-blue-700 flex flex-wrap gap-x-3 gap-y-1">
                  <span>
                    ประเภท: <span className="font-medium">{limits.userTypeName || 'ไม่ระบุ'}</span>
                  </span>
                  <span>
                    จองได้: <span className="font-medium">{limits.maxAdvanceBookingDays} วัน</span>
                    {limits.isDefault && (
                      <span className="ml-1 text-xs text-blue-600">(ค่าเริ่มต้น)</span>
                    )}
                  </span>
                </div>
                {limits.warning && (
                  <p className="mt-2 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                    ⚠️ {limits.warning}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Equipment Selection - Mobile: Horizontal scroll, Desktop: Vertical list */}
          <div className="lg:col-span-1 order-1">
            {/* Step 1: Category Selection */}
            <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4 lg:p-6 mb-3 sm:mb-4">
              <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 bg-blue-600 text-white rounded-full text-xs font-bold">1</span>
                เลือกประเภทอุปกรณ์
              </h2>
              
              {categoriesLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category.id)}
                      className={`
                        p-2 sm:p-3 rounded-lg border text-left transition-all
                        ${selectedCategory === category.id
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2">
                        {category.icon ? (
                          <span className="text-lg sm:text-xl">{category.icon}</span>
                        ) : (
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        )}
                        <span className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                          {category.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {categories.length === 0 && !categoriesLoading && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  <p>ไม่มีประเภทอุปกรณ์</p>
                </div>
              )}
            </div>

            {/* Step 2: Equipment Selection (only show when category is selected) */}
            <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4 lg:p-6">
              <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <span className={`inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full text-xs font-bold ${selectedCategory ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500'}`}>2</span>
                เลือกอุปกรณ์
                {selectedCategory && equipment.length > 0 && (
                  <span className="text-xs font-normal text-gray-500">
                    ({filteredEquipment.length} รายการ)
                  </span>
                )}
              </h2>
              
              {!selectedCategory ? (
                <div className="text-center py-6 sm:py-8 text-gray-500 text-sm">
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                  </svg>
                  <p>กรุณาเลือกประเภทอุปกรณ์ก่อน</p>
                </div>
              ) : equipmentLoading && equipment.length === 0 ? (
                <div className="flex justify-center py-6 sm:py-8">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <>
                  {/* Search box for equipment (show when > 5 items) */}
                  {equipment.length > 5 && (
                    <div className="mb-3">
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          type="text"
                          placeholder="ค้นหาอุปกรณ์..."
                          value={equipmentSearch}
                          onChange={(e) => setEquipmentSearch(e.target.value)}
                          className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {equipmentSearch && (
                          <button
                            onClick={() => setEquipmentSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Equipment list - Simple text format (name + equipment number) */}
                  <div className="space-y-1.5 max-h-72 sm:max-h-80 overflow-y-auto pr-1">
                    {filteredEquipment.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleEquipmentSelect(item)}
                        className={`
                          w-full text-left px-3 py-2.5 rounded-lg border transition-colors
                          ${selectedEquipment?.id === item.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {item.name}
                          </span>
                          <span className="text-xs text-gray-500 font-mono whitespace-nowrap">
                            {item.equipmentNumber || item.serialNumber || '-'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Load more button */}
                  {pagination?.hasNextPage && (
                    <button
                      onClick={loadMore}
                      disabled={equipmentLoading}
                      className="mt-3 w-full py-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-50"
                    >
                      {equipmentLoading ? 'กำลังโหลด...' : 'โหลดเพิ่มเติม'}
                    </button>
                  )}

                  {/* No results from search */}
                  {filteredEquipment.length === 0 && equipmentSearch && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      <p>ไม่พบอุปกรณ์ที่ค้นหา</p>
                      <button
                        onClick={() => setEquipmentSearch('')}
                        className="mt-2 text-blue-600 hover:text-blue-800 text-xs"
                      >
                        ล้างการค้นหา
                      </button>
                    </div>
                  )}
                </>
              )}
                  
              {selectedCategory && equipment.length === 0 && !equipmentLoading && (
                <div className="text-center py-6 sm:py-8 text-gray-500 text-sm">
                  <p>ไม่มีอุปกรณ์ที่พร้อมใช้งานในประเภทนี้</p>
                </div>
              )}
            </div>

            {/* Selected Equipment Info - Mobile: Compact, Desktop: Full */}
            {selectedEquipment && (
              <div className="mt-3 sm:mt-4 lg:mt-6 bg-white rounded-lg shadow-sm border p-3 sm:p-4 lg:p-6">
                <h3 className="text-sm sm:text-md font-semibold text-gray-900 mb-2 sm:mb-3">
                  อุปกรณ์ที่เลือก
                </h3>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  {selectedEquipment.imageURL ? (
                    <img
                      src={selectedEquipment.imageURL}
                      alt={selectedEquipment.name}
                      className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gray-200 rounded flex items-center justify-center">
                      <svg className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 002 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-medium text-gray-900 truncate">{selectedEquipment.name}</p>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">{selectedEquipment.brand} {selectedEquipment.model}</p>
                    <p className="text-xs text-gray-500 truncate hidden sm:block">รหัส: {selectedEquipment.serialNumber || selectedEquipment.equipmentNumber || 'ไม่ระบุ'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Calendar */}
          <div className="lg:col-span-2 order-2">
            <ReservationCalendar
              equipmentId={selectedEquipment?.id}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              onTimeSlotSelect={handleTimeSlotSelect}
              maxAdvanceBookingDays={limits.maxAdvanceBookingDays}
            />

            {/* Reservation Summary - Mobile Optimized */}
            {selectedEquipment && selectedDate && selectedTimeSlot && (
              <div className="mt-3 sm:mt-4 lg:mt-6 bg-white rounded-lg shadow-sm border p-3 sm:p-4 lg:p-6">
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 lg:mb-4">
                  สรุปการจอง
                </h3>
                <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                  <div className="flex flex-wrap">
                    <span className="font-medium text-gray-500 w-16 sm:w-20">อุปกรณ์:</span>
                    <span className="text-gray-900 flex-1">{selectedEquipment.name}</span>
                  </div>
                  <div className="flex flex-wrap">
                    <span className="font-medium text-gray-500 w-16 sm:w-20">วันที่:</span>
                    <span className="text-gray-900 flex-1">
                      {new Intl.DateTimeFormat('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        weekday: 'short'
                      }).format(selectedDate)}
                    </span>
                  </div>
                  <div className="flex flex-wrap">
                    <span className="font-medium text-gray-500 w-16 sm:w-20">เวลา:</span>
                    <span className="text-gray-900 flex-1">{selectedTimeSlot.time}</span>
                  </div>
                </div>
                
                <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    className="flex-1 bg-blue-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base font-medium"
                    onClick={handleShowReservationForm}
                  >
                    ส่งคำขอจอง
                  </button>
                  <button
                    className="px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
                    onClick={() => {
                      setSelectedEquipment(null);
                      setSelectedDate(null);
                      setSelectedTimeSlot(null);
                      setShowReservationForm(false);
                    }}
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reservation Form Modal - Mobile Full Screen */}
        {showReservationForm && selectedEquipment && selectedDate && selectedTimeSlot && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
            <div className="w-full sm:max-w-2xl sm:mx-4 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto bg-white sm:rounded-lg rounded-t-xl">
              <ReservationForm
                equipment={selectedEquipment}
                selectedDate={selectedDate}
                selectedTimeSlot={selectedTimeSlot}
                onSuccess={handleReservationSuccess}
                onCancel={handleReservationCancel}
              />
            </div>
          </div>
        )}
        </>
        )}
      </div>
    </Layout>
  );
};

export default ReservationPage;