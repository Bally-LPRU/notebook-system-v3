import React, { useState } from 'react';
import { useReservations } from '../../hooks/useReservations';
import { useAuth } from '../../contexts/AuthContext';
import { 
  RESERVATION_STATUS,
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_COLORS,
  formatReservationDate,
  formatReservationTime
} from '../../types/reservation';

/**
 * ReservationList Component
 * แสดงรายการการจองทั้งหมด
 */
const ReservationList = ({ 
  isAdmin = false,
  filters = {},
  className = '' 
}) => {
  const { isAdmin: userIsAdmin } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState('');
  
  const {
    reservations,
    loading,
    error,
    updateReservationStatus,
    cancelReservation,
    refresh
  } = useReservations({
    isAdmin: isAdmin || userIsAdmin,
    filters: {
      ...filters,
      status: selectedStatus || filters.status
    }
  });

  // Get status color class
  const getStatusColorClass = (status) => {
    const colorMap = {
      green: 'bg-green-100 text-green-800 border-green-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    return colorMap[RESERVATION_STATUS_COLORS[status]] || colorMap.gray;
  };

  // Handle status change
  const handleStatusChange = async (reservationId, newStatus) => {
    try {
      await updateReservationStatus(reservationId, newStatus);
      refresh();
    } catch (error) {
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    }
  };

  // Handle cancel reservation
  const handleCancelReservation = async (reservationId) => {
    if (!window.confirm('คุณต้องการยกเลิกการจองนี้หรือไม่?')) {
      return;
    }

    try {
      await cancelReservation(reservationId);
      refresh();
    } catch (error) {
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    }
  };

  // Check if user can perform actions on reservation
  const canManageReservation = (reservation) => {
    return isAdmin || userIsAdmin || reservation.userId === 'dev_user'; // dev_user for development
  };

  // Check if reservation can be cancelled
  const canCancelReservation = (reservation) => {
    return [
      RESERVATION_STATUS.PENDING,
      RESERVATION_STATUS.APPROVED
    ].includes(reservation.status);
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {isAdmin || userIsAdmin ? 'การจองทั้งหมด' : 'การจองของฉัน'}
          </h3>
          <button
            onClick={refresh}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            title="รีเฟรช"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedStatus('')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedStatus === ''
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ทั้งหมด
          </button>
          {Object.entries(RESERVATION_STATUS_LABELS).map(([status, label]) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedStatus === status
                  ? getStatusColorClass(status)
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Reservation List */}
      <div className="divide-y divide-gray-200">
        {reservations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>ไม่มีการจอง</p>
          </div>
        ) : (
          reservations.map((reservation) => (
            <div key={reservation.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Equipment Info */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        อุปกรณ์ ID: {reservation.equipmentId}
                      </p>
                      <p className="text-sm text-gray-500">
                        รหัสการจอง: {reservation.id}
                      </p>
                    </div>
                  </div>

                  {/* Reservation Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">วันที่และเวลา</p>
                      <p className="text-sm text-gray-900">
                        {formatReservationDate(reservation.reservationDate)}
                      </p>
                      <p className="text-sm text-gray-900">
                        {formatReservationTime(reservation.startTime)} - {formatReservationTime(reservation.endTime)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">สถานะ</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColorClass(reservation.status)}`}>
                        {RESERVATION_STATUS_LABELS[reservation.status]}
                      </span>
                    </div>
                  </div>

                  {/* Purpose */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-500">วัตถุประสงค์</p>
                    <p className="text-sm text-gray-900">{reservation.purpose}</p>
                  </div>

                  {/* Notes */}
                  {reservation.notes && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-500">หมายเหตุ</p>
                      <p className="text-sm text-gray-900">{reservation.notes}</p>
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="text-xs text-gray-500">
                    <p>สร้างเมื่อ: {(() => {
                      const date = reservation.createdAt?.toDate?.() || new Date(reservation.createdAt);
                      return date instanceof Date && !isNaN(date) ? date.toLocaleString('th-TH') : 'ไม่ระบุ';
                    })()}</p>
                    {reservation.approvedAt && (
                      <p>อนุมัติเมื่อ: {(() => {
                        const date = reservation.approvedAt?.toDate?.() || new Date(reservation.approvedAt);
                        return date instanceof Date && !isNaN(date) ? date.toLocaleString('th-TH') : 'ไม่ระบุ';
                      })()}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col space-y-2 ml-4">
                  {/* Admin Actions */}
                  {(isAdmin || userIsAdmin) && reservation.status === RESERVATION_STATUS.PENDING && (
                    <>
                      <button
                        onClick={() => handleStatusChange(reservation.id, RESERVATION_STATUS.APPROVED)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                      >
                        อนุมัติ
                      </button>
                      <button
                        onClick={() => handleStatusChange(reservation.id, RESERVATION_STATUS.CANCELLED)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                      >
                        ปฏิเสธ
                      </button>
                    </>
                  )}

                  {/* Ready to Complete */}
                  {(isAdmin || userIsAdmin) && reservation.status === RESERVATION_STATUS.APPROVED && (
                    <button
                      onClick={() => handleStatusChange(reservation.id, RESERVATION_STATUS.READY)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      พร้อมรับ
                    </button>
                  )}

                  {/* Complete */}
                  {(isAdmin || userIsAdmin) && reservation.status === RESERVATION_STATUS.READY && (
                    <button
                      onClick={() => handleStatusChange(reservation.id, RESERVATION_STATUS.COMPLETED)}
                      className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                    >
                      เสร็จสิ้น
                    </button>
                  )}

                  {/* Cancel (User) */}
                  {canManageReservation(reservation) && canCancelReservation(reservation) && (
                    <button
                      onClick={() => handleCancelReservation(reservation.id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                    >
                      ยกเลิก
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReservationList;