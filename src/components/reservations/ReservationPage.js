import React, { useState } from 'react';
import Layout from '../layout/Layout';
import ReservationCalendar from './ReservationCalendar';
import ReservationForm from './ReservationForm';
import ReservationList from './ReservationList';
import { useEquipment } from '../../hooks/useEquipment';
import { useUserTypeLimits } from '../../hooks/useUserTypeLimits';
import { useSettings } from '../../contexts/SettingsContext';

/**
 * ReservationPage Component
 * หน้าสำหรับจองอุปกรณ์ล่วงหน้าและดูการจองของตัวเอง
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
const ReservationPage = () => {
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'my-reservations'
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [showReservationForm, setShowReservationForm] = useState(false);

  const { equipment, loading: equipmentLoading } = useEquipment({
    filters: { status: 'available' }
  });

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
  if (settingsLoading) {
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
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">การจองอุปกรณ์</h1>
          <p className="mt-2 text-gray-600">
            จองอุปกรณ์ล่วงหน้าหรือดูการจองของคุณ
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('new')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'new'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                จองใหม่
              </span>
            </button>
            <button
              onClick={() => setActiveTab('my-reservations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'my-reservations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                การจองของฉัน
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

        {/* Advance Booking Limit Info Card - Requirements: 5.4 */}
        {!limitsLoading && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-800">
                  ข้อจำกัดการจองล่วงหน้า
                </h3>
                <div className="mt-1 text-sm text-blue-700">
                  <p>
                    ประเภทผู้ใช้: <span className="font-medium">{limits.userTypeName || 'ไม่ระบุ'}</span>
                  </p>
                  <p>
                    สามารถจองล่วงหน้าได้สูงสุด: <span className="font-medium">{limits.maxAdvanceBookingDays} วัน</span>
                    {limits.isDefault && (
                      <span className="ml-2 text-xs text-blue-600">(ค่าเริ่มต้น)</span>
                    )}
                  </p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Equipment Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                เลือกอุปกรณ์
              </h2>
              
              {equipmentLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {equipment.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleEquipmentSelect(item)}
                      className={`
                        w-full text-left p-3 rounded-lg border transition-colors
                        ${selectedEquipment?.id === item.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        {item.imageURL ? (
                          <img
                            src={item.imageURL}
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {item.brand} {item.model}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.location}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                  
                  {equipment.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>ไม่มีอุปกรณ์ที่พร้อมใช้งาน</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Equipment Info */}
            {selectedEquipment && (
              <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-md font-semibold text-gray-900 mb-3">
                  อุปกรณ์ที่เลือก
                </h3>
                <div className="flex items-center space-x-3">
                  {selectedEquipment.imageURL ? (
                    <img
                      src={selectedEquipment.imageURL}
                      alt={selectedEquipment.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 002 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{selectedEquipment.name}</p>
                    <p className="text-sm text-gray-500">{selectedEquipment.brand} {selectedEquipment.model}</p>
                    <p className="text-sm text-gray-500">รหัส: {selectedEquipment.serialNumber}</p>
                    <p className="text-sm text-gray-500">สถานที่: {selectedEquipment.location}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Calendar */}
          <div className="lg:col-span-2">
            <ReservationCalendar
              equipmentId={selectedEquipment?.id}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              onTimeSlotSelect={handleTimeSlotSelect}
              maxAdvanceBookingDays={limits.maxAdvanceBookingDays}
            />

            {/* Reservation Summary */}
            {selectedEquipment && selectedDate && selectedTimeSlot && (
              <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  สรุปการจอง
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">อุปกรณ์:</span>
                    <span className="ml-2 text-sm text-gray-900">{selectedEquipment.name}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">วันที่:</span>
                    <span className="ml-2 text-sm text-gray-900">
                      {new Intl.DateTimeFormat('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'long'
                      }).format(selectedDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">เวลา:</span>
                    <span className="ml-2 text-sm text-gray-900">{selectedTimeSlot.time}</span>
                  </div>
                </div>
                
                <div className="mt-6 flex space-x-3">
                  <button
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    onClick={handleShowReservationForm}
                  >
                    ส่งคำขอจอง
                  </button>
                  <button
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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

        {/* Reservation Form Modal */}
        {showReservationForm && selectedEquipment && selectedDate && selectedTimeSlot && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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