import React, { useState } from 'react';
import { useReservations } from '../../hooks/useReservations';
import { useClosedDates } from '../../hooks/useClosedDates';
import { useUserTypeLimits } from '../../hooks/useUserTypeLimits';
import { 
  DEFAULT_RESERVATION_FORM,
  RESERVATION_VALIDATION,
  calculateDuration,
  formatReservationDate,
  TIME_SLOTS_CONFIG
} from '../../types/reservation';

/**
 * ReservationForm Component
 * ฟอร์มสำหรับส่งคำขอจองอุปกรณ์
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
const ReservationForm = ({ 
  equipment, 
  selectedDate, 
  selectedTimeSlot,
  onSuccess, 
  onCancel,
  className = '' 
}) => {
  // Use user type limits hook to get maxAdvanceBookingDays based on user type
  const { limits, loading: limitsLoading } = useUserTypeLimits();
  const { isDateClosed, closedDates } = useClosedDates();
  const [formData, setFormData] = useState({
    ...DEFAULT_RESERVATION_FORM,
    equipmentId: equipment?.id || '',
    reservationDate: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
    startTime: selectedTimeSlot?.time || '',
    endTime: selectedTimeSlot ? 
      `${(parseInt(selectedTimeSlot.time.split(':')[0]) + 1).toString().padStart(2, '0')}:00` : ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createReservation } = useReservations();
  
  // Get max advance booking days from user type limits (Requirements: 5.1, 5.5)
  const maxAdvanceBookingDays = limits.maxAdvanceBookingDays;
  
  // Calculate max reservation date
  const maxReservationDate = (() => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + maxAdvanceBookingDays);
    return maxDate.toISOString().split('T')[0];
  })();

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {};

    // Equipment ID validation
    if (!formData.equipmentId) {
      newErrors.equipmentId = 'กรุณาเลือกอุปกรณ์';
    }

    // Date validation
    if (!formData.reservationDate) {
      newErrors.reservationDate = 'กรุณาเลือกวันที่จอง';
    } else {
      const selectedDate = new Date(formData.reservationDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.reservationDate = 'ไม่สามารถจองในวันที่ผ่านมาแล้ว';
      }
      
      // Check if date is closed
      if (isDateClosed(selectedDate)) {
        const closedDate = closedDates.find(cd => {
          if (!cd.date) return false;
          const cdDate = new Date(cd.date);
          cdDate.setHours(0, 0, 0, 0);
          selectedDate.setHours(0, 0, 0, 0);
          return cdDate.getTime() === selectedDate.getTime();
        });
        newErrors.reservationDate = `วันที่เลือกเป็นวันปิดทำการ${closedDate?.reason ? `: ${closedDate.reason}` : ''}`;
      }
      
      // Check advance booking period
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + maxAdvanceBookingDays);
      maxDate.setHours(0, 0, 0, 0);
      
      if (selectedDate > maxDate) {
        newErrors.reservationDate = `ไม่สามารถจองล่วงหน้าเกิน ${maxAdvanceBookingDays} วัน`;
      }
    }

    // Time validation
    if (!formData.startTime) {
      newErrors.startTime = 'กรุณาเลือกเวลาเริ่มต้น';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'กรุณาเลือกเวลาสิ้นสุด';
    }

    if (formData.startTime && formData.endTime) {
      const duration = calculateDuration(formData.startTime, formData.endTime);
      
      if (duration <= 0) {
        newErrors.endTime = 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น';
      } else if (duration < TIME_SLOTS_CONFIG.MIN_DURATION) {
        newErrors.endTime = `ระยะเวลาการจองต้องไม่น้อยกว่า ${TIME_SLOTS_CONFIG.MIN_DURATION} นาที`;
      } else if (duration > TIME_SLOTS_CONFIG.MAX_DURATION) {
        newErrors.endTime = `ระยะเวลาการจองต้องไม่เกิน ${TIME_SLOTS_CONFIG.MAX_DURATION} นาที`;
      }
    }

    // Purpose validation
    if (!formData.purpose.trim()) {
      newErrors.purpose = 'กรุณาระบุวัตถุประสงค์';
    } else if (formData.purpose.trim().length < RESERVATION_VALIDATION.purpose.minLength) {
      newErrors.purpose = `วัตถุประสงค์ต้องมีอย่างน้อย ${RESERVATION_VALIDATION.purpose.minLength} ตัวอักษร`;
    } else if (formData.purpose.trim().length > RESERVATION_VALIDATION.purpose.maxLength) {
      newErrors.purpose = `วัตถุประสงค์ต้องไม่เกิน ${RESERVATION_VALIDATION.purpose.maxLength} ตัวอักษร`;
    }

    // Notes validation (optional)
    if (formData.notes && formData.notes.length > RESERVATION_VALIDATION.notes.maxLength) {
      newErrors.notes = `หมายเหตุต้องไม่เกิน ${RESERVATION_VALIDATION.notes.maxLength} ตัวอักษร`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create reservation date objects
      const reservationDate = new Date(formData.reservationDate);
      const startTime = new Date(reservationDate);
      const [startHour, startMinute] = formData.startTime.split(':');
      startTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);
      
      const endTime = new Date(reservationDate);
      const [endHour, endMinute] = formData.endTime.split(':');
      endTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

      const reservationData = {
        equipmentId: formData.equipmentId,
        reservationDate: reservationDate,
        startTime: startTime,
        endTime: endTime,
        purpose: formData.purpose.trim(),
        notes: formData.notes.trim()
      };

      console.log('Submitting reservation:', reservationData);

      const newReservation = await createReservation(reservationData);
      
      console.log('Reservation created successfully:', newReservation);

      // Show success message
      alert('ส่งคำขอจองสำเร็จ! รอการอนุมัติจากผู้ดูแลระบบ');

      // Call success callback
      if (onSuccess) {
        onSuccess(newReservation);
      }

      // Reset form
      setFormData({
        ...DEFAULT_RESERVATION_FORM,
        equipmentId: equipment?.id || '',
        reservationDate: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
        startTime: selectedTimeSlot?.time || '',
        endTime: selectedTimeSlot ? 
          `${(parseInt(selectedTimeSlot.time.split(':')[0]) + 1).toString().padStart(2, '0')}:00` : ''
      });

    } catch (error) {
      console.error('Error creating reservation:', error);
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate time options
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = TIME_SLOTS_CONFIG.START_HOUR; hour < TIME_SLOTS_CONFIG.END_HOUR; hour++) {
      for (let minute = 0; minute < 60; minute += TIME_SLOTS_CONFIG.SLOT_DURATION) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(timeString);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          ส่งคำขอจองอุปกรณ์
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Equipment Info */}
          {equipment && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">อุปกรณ์ที่เลือก</h4>
              <div className="flex items-center space-x-3">
                {equipment.imageURL ? (
                  <img
                    src={equipment.imageURL}
                    alt={equipment.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{equipment.name}</p>
                  <p className="text-sm text-gray-500">{equipment.brand} {equipment.model}</p>
                  <p className="text-sm text-gray-500">สถานที่: {equipment.location}</p>
                </div>
              </div>
            </div>
          )}

          {/* Advance Booking Limit Info - Requirements: 5.4 */}
          {!limitsLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-800">
                    ข้อจำกัดการจองล่วงหน้า
                  </h4>
                  <div className="mt-1 text-sm text-blue-700">
                    <p>
                      ประเภทผู้ใช้: <span className="font-medium">{limits.userTypeName || 'ไม่ระบุ'}</span>
                    </p>
                    <p>
                      จองล่วงหน้าได้สูงสุด: <span className="font-medium">{maxAdvanceBookingDays} วัน</span>
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

          {/* Date Selection */}
          <div>
            <label htmlFor="reservationDate" className="block text-sm font-medium text-gray-700 mb-2">
              วันที่จอง *
            </label>
            <input
              type="date"
              id="reservationDate"
              name="reservationDate"
              value={formData.reservationDate}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
              max={maxReservationDate}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.reservationDate ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {errors.reservationDate && (
              <p className="mt-1 text-sm text-red-600">{errors.reservationDate}</p>
            )}
            {formData.reservationDate && !errors.reservationDate && (
              <p className="mt-1 text-sm text-gray-500">
                {formatReservationDate(new Date(formData.reservationDate))}
              </p>
            )}
            {!errors.reservationDate && (
              <p className="mt-1 text-sm text-gray-500">
                สามารถจองล่วงหน้าได้สูงสุด {maxAdvanceBookingDays} วัน (ไม่รวมวันปิดทำการ)
              </p>
            )}
            
            {/* Closed Date Warning */}
            {formData.reservationDate && isDateClosed(new Date(formData.reservationDate)) && (
              <div className="mt-2 rounded-md bg-red-50 p-3">
                <p className="text-sm text-red-800">
                  <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  วันที่เลือกเป็นวันปิดทำการ
                </p>
              </div>
            )}
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                เวลาเริ่มต้น *
              </label>
              <select
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.startTime ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">เลือกเวลาเริ่มต้น</option>
                {timeOptions.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
              {errors.startTime && (
                <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>
              )}
            </div>

            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                เวลาสิ้นสุด *
              </label>
              <select
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.endTime ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">เลือกเวลาสิ้นสุด</option>
                {timeOptions.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
              {errors.endTime && (
                <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>
              )}
            </div>
          </div>

          {/* Duration Display */}
          {formData.startTime && formData.endTime && (
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                ระยะเวลาการจอง: {calculateDuration(formData.startTime, formData.endTime)} นาที
              </p>
            </div>
          )}

          {/* Purpose */}
          <div>
            <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-2">
              วัตถุประสงค์ *
            </label>
            <textarea
              id="purpose"
              name="purpose"
              value={formData.purpose}
              onChange={handleInputChange}
              rows={3}
              placeholder="ระบุวัตถุประสงค์ในการใช้อุปกรณ์..."
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.purpose ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            <div className="flex justify-between mt-1">
              {errors.purpose ? (
                <p className="text-sm text-red-600">{errors.purpose}</p>
              ) : (
                <p className="text-sm text-gray-500">
                  อย่างน้อย {RESERVATION_VALIDATION.purpose.minLength} ตัวอักษร
                </p>
              )}
              <p className="text-sm text-gray-500">
                {formData.purpose.length}/{RESERVATION_VALIDATION.purpose.maxLength}
              </p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              หมายเหตุ (ไม่บังคับ)
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={2}
              placeholder="หมายเหตุเพิ่มเติม..."
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.notes ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <div className="flex justify-between mt-1">
              {errors.notes && (
                <p className="text-sm text-red-600">{errors.notes}</p>
              )}
              <p className="text-sm text-gray-500 ml-auto">
                {formData.notes.length}/{RESERVATION_VALIDATION.notes.maxLength}
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex space-x-3 pt-4 border-t">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                isSubmitting
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  กำลังส่งคำขอ...
                </div>
              ) : (
                'ส่งคำขอจอง'
              )}
            </button>
            
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReservationForm;