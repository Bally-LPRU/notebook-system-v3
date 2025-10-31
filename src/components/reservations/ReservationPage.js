import React, { useState } from 'react';
import Navbar from '../layout/Navbar';
import Footer from '../layout/Footer';
import ReservationCalendar from './ReservationCalendar';
import ReservationForm from './ReservationForm';
import { useEquipment } from '../../hooks/useEquipment';

/**
 * ReservationPage Component
 * หน้าสำหรับจองอุปกรณ์ล่วงหน้า
 */
const ReservationPage = () => {
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [showReservationForm, setShowReservationForm] = useState(false);

  const { equipment, loading: equipmentLoading } = useEquipment({
    filters: { status: 'available' }
  });

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">จองอุปกรณ์ล่วงหน้า</h1>
          <p className="mt-2 text-gray-600">
            เลือกอุปกรณ์และช่วงเวลาที่ต้องการจองล่วงหน้า
          </p>
        </div>

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
      </main>
      
      <Footer />
    </div>
  );
};

export default ReservationPage;