/**
 * Admin Reservation Management Component
 * 
 * Full CRUD management for reservations with:
 * - Settings-based rules validation
 * - Loan system integration
 * - No-show detection and auto-expiration
 * - Responsive design
 * - Notification center integration
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { Layout } from '../layout';
import ReservationService from '../../services/reservationService';
import NotificationService from '../../services/notificationService';
import discordWebhookService from '../../services/discordWebhookService';
import { 
  RESERVATION_STATUS,
  RESERVATION_STATUS_LABELS
} from '../../types/reservation';

/**
 * Status badge colors
 */
const STATUS_BADGE_CLASSES = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-blue-100 text-blue-800 border-blue-200',
  ready: 'bg-green-100 text-green-800 border-green-200',
  completed: 'bg-gray-100 text-gray-800 border-gray-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  expired: 'bg-red-100 text-red-800 border-red-200',
  no_show: 'bg-orange-100 text-orange-800 border-orange-200'
};

const AdminReservationManagement = () => {
  const { userProfile } = useAuth();
  const { settings } = useSettings();
  
  // จำนวนรายการต่อหน้า
  const ITEMS_PER_PAGE = 5;

  // State
  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState({
    total: 0, pending: 0, approved: 0, ready: 0, completed: 0, cancelled: 0, expired: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Load reservations
  const loadReservations = useCallback(async () => {
    try {
      setLoading(true);
      
      const filters = {};
      if (activeTab !== 'all') {
        filters.status = activeTab;
      }
      if (dateFilter.start) {
        filters.startDate = new Date(dateFilter.start);
      }
      if (dateFilter.end) {
        filters.endDate = new Date(dateFilter.end);
      }
      
      const [reservationsData, statsData] = await Promise.all([
        ReservationService.getAllReservations(filters),
        ReservationService.getReservationStats()
      ]);
      
      setReservations(reservationsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading reservations:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, dateFilter]);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  // Check and update expired reservations
  useEffect(() => {
    const checkExpiredReservations = async () => {
      try {
        const updatedCount = await ReservationService.updateExpiredReservations();
        if (updatedCount > 0) {
          console.log(`Updated ${updatedCount} expired reservations`);
          loadReservations();
        }
      } catch (error) {
        console.error('Error checking expired reservations:', error);
      }
    };
    
    checkExpiredReservations();
    // Check every 5 minutes
    const interval = setInterval(checkExpiredReservations, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadReservations]);

  // Handle status change
  const handleStatusChange = async (reservationId, newStatus, reason = '') => {
    try {
      setActionLoading(reservationId);
      
      await ReservationService.updateReservationStatus(
        reservationId, 
        newStatus, 
        userProfile.uid
      );
      
      // Send appropriate notification based on status
      const reservation = reservations.find(r => r.id === reservationId);
      if (reservation) {
        // Get equipment info for notification
        const EquipmentService = (await import('../../services/equipmentService')).default;
        let equipment = { id: reservation.equipmentId, name: 'อุปกรณ์' };
        try {
          equipment = await EquipmentService.getEquipmentById(reservation.equipmentId) || equipment;
        } catch (e) {
          console.warn('Could not fetch equipment details:', e);
        }

        // Prepare reservation data for Discord notification
        const reservationForDiscord = {
          ...reservation,
          equipmentName: equipment.name,
          userName: reservation.userName || 'ผู้ใช้'
        };
        const adminName = userProfile.displayName || userProfile.email || 'Admin';

        // Send notification based on new status
        switch (newStatus) {
          case RESERVATION_STATUS.APPROVED:
            await NotificationService.notifyUserReservationStatus(
              reservation, 
              equipment, 
              true,
              reason
            );
            // Send Discord notification
            await discordWebhookService.notifyReservationApproved(reservationForDiscord, adminName);
            break;
          case RESERVATION_STATUS.REJECTED:
            await NotificationService.notifyUserReservationStatus(
              reservation, 
              equipment, 
              false,
              reason
            );
            // Send Discord notification
            await discordWebhookService.notifyReservationRejected(reservationForDiscord, adminName, reason);
            break;
          case RESERVATION_STATUS.CANCELLED:
            await NotificationService.notifyUserReservationCancelled(
              reservation,
              equipment,
              adminName,
              reason
            );
            // Send Discord notification
            await discordWebhookService.notifyReservationCancelled(reservationForDiscord, adminName, reason);
            break;
          case RESERVATION_STATUS.COMPLETED:
            await NotificationService.notifyUserReservationCompleted(reservation, equipment);
            // Send Discord notification
            await discordWebhookService.notifyReservationCompleted(reservationForDiscord, adminName);
            break;
          case RESERVATION_STATUS.EXPIRED:
            await NotificationService.notifyUserReservationExpired(reservation, equipment);
            // Send Discord notification
            await discordWebhookService.notifyReservationExpired(reservationForDiscord);
            break;
          case RESERVATION_STATUS.READY:
            // Send Discord notification for ready status
            await discordWebhookService.notifyReservationReady(reservationForDiscord, adminName);
            break;
          default:
            // Generic notification for other status changes
            await NotificationService.createNotification(
              reservation.userId,
              'reservation_status',
              'สถานะการจองเปลี่ยนแปลง',
              `สถานะการจอง ${equipment.name} เปลี่ยนเป็น "${RESERVATION_STATUS_LABELS[newStatus]}"`,
              { reservationId, newStatus, equipmentName: equipment.name }
            );
        }
      }
      
      setSuccessMessage(`อัปเดตสถานะเป็น "${RESERVATION_STATUS_LABELS[newStatus]}" สำเร็จ`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      loadReservations();
    } catch (error) {
      console.error('Error updating status:', error);
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Mark as no-show
  const handleNoShow = async (reservationId) => {
    if (!window.confirm('ยืนยันว่าผู้ใช้ไม่มารับอุปกรณ์ตามเวลาที่กำหนด?')) return;
    
    try {
      setActionLoading(reservationId);
      
      await ReservationService.updateReservationStatus(
        reservationId,
        RESERVATION_STATUS.EXPIRED,
        userProfile.uid
      );
      
      const reservation = reservations.find(r => r.id === reservationId);
      if (reservation) {
        // Get equipment info for notification
        const EquipmentService = (await import('../../services/equipmentService')).default;
        let equipment = { id: reservation.equipmentId, name: 'อุปกรณ์' };
        try {
          equipment = await EquipmentService.getEquipmentById(reservation.equipmentId) || equipment;
        } catch (e) {
          console.warn('Could not fetch equipment details:', e);
        }
        
        // Use the proper notification method for expired reservations
        await NotificationService.notifyUserReservationExpired(reservation, equipment);
      }
      
      setSuccessMessage('บันทึกว่าผู้ใช้ไม่มารับอุปกรณ์แล้ว');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      loadReservations();
    } catch (error) {
      console.error('Error marking no-show:', error);
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Convert reservation to loan request
  const handleConvertToLoan = async (reservationId) => {
    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation) return;

    // Check if can convert
    const canConvert = ReservationService.canConvertToLoan(reservation);
    if (!canConvert.canConvert) {
      alert(canConvert.reason);
      return;
    }

    // Confirm conversion
    const confirmMessage = `ยืนยันการแปลงการจองเป็นคำขอยืม?\n\n` +
      `การจอง: #${reservationId.slice(-8)}\n` +
      `อุปกรณ์: ${reservation.equipmentId?.slice(-8)}\n` +
      `วันที่คาดว่าจะคืน: ${reservation.expectedReturnDate ? 
        (reservation.expectedReturnDate.toDate ? 
          reservation.expectedReturnDate.toDate().toLocaleDateString('th-TH') : 
          new Date(reservation.expectedReturnDate).toLocaleDateString('th-TH')) : 
        'ไม่ระบุ (จะใช้ค่าเริ่มต้น 7 วัน)'}\n\n` +
      `หมายเหตุ: คำขอยืมจะถูกอนุมัติโดยอัตโนมัติ`;

    if (!window.confirm(confirmMessage)) return;

    try {
      setActionLoading(reservationId);
      
      const result = await ReservationService.convertToLoanRequest(reservationId, userProfile.uid);
      
      setSuccessMessage(`แปลงการจองเป็นคำขอยืมสำเร็จ! (คำขอยืม #${result.loanRequest.id.slice(-8)})`);
      setTimeout(() => setSuccessMessage(''), 5000);
      
      loadReservations();
    } catch (error) {
      console.error('Error converting to loan:', error);
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter reservations by search term
  const filteredReservations = reservations.filter(r => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      r.id?.toLowerCase().includes(search) ||
      r.equipmentId?.toLowerCase().includes(search) ||
      r.purpose?.toLowerCase().includes(search) ||
      r.userId?.toLowerCase().includes(search)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredReservations.length / ITEMS_PER_PAGE);
  const paginatedReservations = filteredReservations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, dateFilter]);

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('th-TH', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Format time for display
  const formatTime = (date) => {
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleTimeString('th-TH', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Check if reservation is overdue for pickup
  const isOverdueForPickup = (reservation) => {
    if (reservation.status !== RESERVATION_STATUS.READY) return false;
    const endTime = reservation.endTime?.toDate ? reservation.endTime.toDate() : new Date(reservation.endTime);
    return new Date() > endTime;
  };


  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">จัดการการจองอุปกรณ์</h1>
              <p className="mt-1 text-sm text-gray-600">
                อนุมัติ ปฏิเสธ และติดตามการจองอุปกรณ์ทั้งหมด
              </p>
            </div>
            {/* Reservation System Status Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${
              settings?.reservationSystemEnabled !== false 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                settings?.reservationSystemEnabled !== false ? 'bg-green-500' : 'bg-red-500'
              }`}></span>
              <span className="text-sm font-medium">
                ระบบจอง: {settings?.reservationSystemEnabled !== false ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
              </span>
            </div>
          </div>
        </div>

        {/* System Disabled Warning */}
        {settings?.reservationSystemEnabled === false && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="font-semibold text-yellow-800">ระบบจองปิดใช้งานอยู่</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  ผู้ใช้ทั่วไปไม่สามารถสร้างการจองใหม่ได้ในขณะนี้ คุณยังสามารถจัดการการจองที่มีอยู่ได้ตามปกติ
                </p>
                <p className="text-sm text-yellow-600 mt-2">
                  ไปที่ <a href="/admin/settings" className="underline font-medium">การตั้งค่าระบบ</a> เพื่อเปิดใช้งานระบบจอง
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-800">{successMessage}</span>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <StatCard label="ทั้งหมด" value={stats.total} color="blue" />
          <StatCard label="รอการอนุมัติ" value={stats.pending} color="yellow" />
          <StatCard label="อนุมัติแล้ว" value={stats.approved} color="blue" />
          <StatCard label="พร้อมรับ" value={stats.ready} color="green" />
          <StatCard label="เสร็จสิ้น" value={stats.completed} color="gray" />
          <StatCard label="ยกเลิก/หมดอายุ" value={stats.cancelled + stats.expired} color="red" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden p-4 border-b">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="w-full flex items-center justify-between text-gray-700"
            >
              <span className="font-medium">ตัวกรอง</span>
              <svg className={`w-5 h-5 transition-transform ${showMobileFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Filter Content */}
          <div className={`p-4 space-y-4 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="ค้นหาด้วยรหัสการจอง, อุปกรณ์, หรือวัตถุประสงค์..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Status Tabs */}
            <div className="flex flex-wrap gap-2">
              <TabButton 
                active={activeTab === 'all'} 
                onClick={() => setActiveTab('all')}
                count={stats.total}
              >
                ทั้งหมด
              </TabButton>
              <TabButton 
                active={activeTab === 'pending'} 
                onClick={() => setActiveTab('pending')}
                count={stats.pending}
                color="yellow"
              >
                รอการอนุมัติ
              </TabButton>
              <TabButton 
                active={activeTab === 'approved'} 
                onClick={() => setActiveTab('approved')}
                count={stats.approved}
                color="blue"
              >
                อนุมัติแล้ว
              </TabButton>
              <TabButton 
                active={activeTab === 'ready'} 
                onClick={() => setActiveTab('ready')}
                count={stats.ready}
                color="green"
              >
                พร้อมรับ
              </TabButton>
              <TabButton 
                active={activeTab === 'completed'} 
                onClick={() => setActiveTab('completed')}
                count={stats.completed}
                color="gray"
              >
                เสร็จสิ้น
              </TabButton>
            </div>

            {/* Date Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วันที่เริ่มต้น</label>
                <input
                  type="date"
                  value={dateFilter.start}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วันที่สิ้นสุด</label>
                <input
                  type="date"
                  value={dateFilter.end}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => setDateFilter({ start: '', end: '' })}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  ล้างตัวกรอง
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Reservation List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">กำลังโหลด...</p>
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>ไม่พบการจอง</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {paginatedReservations.map((reservation) => (
                <ReservationCard
                  key={reservation.id}
                  reservation={reservation}
                  onStatusChange={handleStatusChange}
                  onNoShow={handleNoShow}
                  onConvertToLoan={handleConvertToLoan}
                  onViewDetail={() => {
                    setSelectedReservation(reservation);
                    setShowDetailModal(true);
                  }}
                  isOverdue={isOverdueForPickup(reservation)}
                  actionLoading={actionLoading === reservation.id}
                  formatDate={formatDate}
                  formatTime={formatTime}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {filteredReservations.length > ITEMS_PER_PAGE && (
            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                แสดง {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredReservations.length)} จาก {filteredReservations.length} รายการ
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Results Summary for small lists */}
          {filteredReservations.length > 0 && filteredReservations.length <= ITEMS_PER_PAGE && (
            <div className="p-4 border-t border-gray-200 text-center text-sm text-gray-500">
              แสดง {filteredReservations.length} รายการ
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedReservation && (
          <ReservationDetailModal
            reservation={selectedReservation}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedReservation(null);
            }}
            onStatusChange={handleStatusChange}
            onConvertToLoan={handleConvertToLoan}
            formatDate={formatDate}
            formatTime={formatTime}
            settings={settings}
          />
        )}
      </div>
    </Layout>
  );
};


/**
 * Stat Card Component
 */
const StatCard = ({ label, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    gray: 'bg-gray-50 text-gray-600 border-gray-200'
  };

  return (
    <div className={`rounded-lg border p-3 ${colorClasses[color]}`}>
      <p className="text-xs font-medium opacity-75">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
};

/**
 * Tab Button Component
 */
const TabButton = ({ children, active, onClick, count, color = 'blue' }) => {
  const activeClasses = {
    blue: 'bg-blue-100 text-blue-800 border-blue-300',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    green: 'bg-green-100 text-green-800 border-green-300',
    gray: 'bg-gray-100 text-gray-800 border-gray-300'
  };

  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors
        ${active ? activeClasses[color] : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}
      `}
    >
      {children}
      {count !== undefined && (
        <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${active ? 'bg-white/50' : 'bg-gray-100'}`}>
          {count}
        </span>
      )}
    </button>
  );
};

/**
 * Reservation Card Component
 */
const ReservationCard = ({ 
  reservation, 
  onStatusChange, 
  onNoShow, 
  onViewDetail,
  onConvertToLoan,
  isOverdue,
  actionLoading,
  formatDate,
  formatTime
}) => {
  const statusClass = STATUS_BADGE_CLASSES[reservation.status] || STATUS_BADGE_CLASSES.pending;

  return (
    <div className={`p-4 ${isOverdue ? 'bg-orange-50' : ''}`}>
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Main Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusClass}`}>
              {RESERVATION_STATUS_LABELS[reservation.status]}
            </span>
            {isOverdue && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                เกินเวลารับ
              </span>
            )}
            <span className="text-xs text-gray-500">#{reservation.id?.slice(-8)}</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
            <div>
              <span className="text-gray-500">อุปกรณ์:</span>
              <span className="ml-1 font-medium text-gray-900">{reservation.equipmentId?.slice(-8) || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500">วันที่:</span>
              <span className="ml-1 text-gray-900">{formatDate(reservation.reservationDate)}</span>
            </div>
            <div>
              <span className="text-gray-500">เวลา:</span>
              <span className="ml-1 text-gray-900">
                {formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}
              </span>
            </div>
            <div className="truncate">
              <span className="text-gray-500">วัตถุประสงค์:</span>
              <span className="ml-1 text-gray-900">{reservation.purpose || '-'}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 lg:flex-nowrap">
          <button
            onClick={onViewDetail}
            className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ดูรายละเอียด
          </button>
          
          {reservation.status === RESERVATION_STATUS.PENDING && (
            <>
              <button
                onClick={() => onStatusChange(reservation.id, RESERVATION_STATUS.APPROVED)}
                disabled={actionLoading}
                className="px-3 py-1.5 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading ? '...' : 'อนุมัติ'}
              </button>
              <button
                onClick={() => onStatusChange(reservation.id, RESERVATION_STATUS.CANCELLED)}
                disabled={actionLoading}
                className="px-3 py-1.5 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                ปฏิเสธ
              </button>
            </>
          )}
          
          {reservation.status === RESERVATION_STATUS.APPROVED && (
            <button
              onClick={() => onStatusChange(reservation.id, RESERVATION_STATUS.READY)}
              disabled={actionLoading}
              className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              พร้อมรับ
            </button>
          )}
          
          {reservation.status === RESERVATION_STATUS.READY && (
            <>
              <button
                onClick={() => onStatusChange(reservation.id, RESERVATION_STATUS.COMPLETED)}
                disabled={actionLoading}
                className="px-3 py-1.5 text-sm text-white bg-gray-600 rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                รับอุปกรณ์แล้ว
              </button>
              {isOverdue && (
                <button
                  onClick={() => onNoShow(reservation.id)}
                  disabled={actionLoading}
                  className="px-3 py-1.5 text-sm text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50"
                >
                  ไม่มารับ
                </button>
              )}
            </>
          )}
          
          {/* Convert to Loan Request Button - for approved or ready reservations */}
          {(reservation.status === RESERVATION_STATUS.APPROVED || 
            reservation.status === RESERVATION_STATUS.READY) && 
            !reservation.convertedToLoanId && (
            <button
              onClick={() => onConvertToLoan && onConvertToLoan(reservation.id)}
              disabled={actionLoading}
              className="px-3 py-1.5 text-sm text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
              title="แปลงการจองเป็นคำขอยืมเมื่อผู้ใช้มารับอุปกรณ์"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              แปลงเป็นคำขอยืม
            </button>
          )}
          
          {/* Show converted badge if already converted */}
          {reservation.convertedToLoanId && (
            <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
              แปลงแล้ว
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Reservation Detail Modal
 */
const ReservationDetailModal = ({ 
  reservation, 
  onClose, 
  onStatusChange,
  onConvertToLoan,
  formatDate,
  formatTime,
  settings
}) => {
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelForm, setShowCancelForm] = useState(false);

  const handleCancel = () => {
    onStatusChange(reservation.id, RESERVATION_STATUS.CANCELLED, cancelReason);
    onClose();
  };

  const handleConvert = () => {
    if (onConvertToLoan) {
      onConvertToLoan(reservation.id);
      onClose();
    }
  };

  // Format expected return date
  const formatExpectedReturnDate = () => {
    if (!reservation.expectedReturnDate) return 'ไม่ระบุ';
    const date = reservation.expectedReturnDate?.toDate 
      ? reservation.expectedReturnDate.toDate() 
      : new Date(reservation.expectedReturnDate);
    return date.toLocaleDateString('th-TH', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Check if can convert
  const canConvert = ReservationService.canConvertToLoan(reservation);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">รายละเอียดการจอง</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Content */}
          <div className="px-6 py-4 space-y-4">
            {/* Status */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">สถานะ:</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_BADGE_CLASSES[reservation.status]}`}>
                {RESERVATION_STATUS_LABELS[reservation.status]}
              </span>
              {reservation.convertedToLoanId && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                  แปลงเป็นคำขอยืมแล้ว
                </span>
              )}
            </div>
            
            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailItem label="รหัสการจอง" value={reservation.id} />
              <DetailItem label="รหัสอุปกรณ์" value={reservation.equipmentId} />
              <DetailItem label="รหัสผู้ใช้" value={reservation.userId} />
              <DetailItem label="วันที่จอง" value={formatDate(reservation.reservationDate)} />
              <DetailItem label="เวลาเริ่มต้น" value={formatTime(reservation.startTime)} />
              <DetailItem label="เวลาสิ้นสุด" value={formatTime(reservation.endTime)} />
            </div>
            
            {/* Expected Return Date - Important for loan conversion */}
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-purple-800">วันที่คาดว่าจะคืนอุปกรณ์</p>
                  <p className="text-sm text-purple-700">{formatExpectedReturnDate()}</p>
                  <p className="text-xs text-purple-600 mt-1">
                    ข้อมูลนี้จะถูกใช้เมื่อแปลงการจองเป็นคำขอยืม
                  </p>
                </div>
              </div>
            </div>
            
            <DetailItem label="วัตถุประสงค์" value={reservation.purpose} />
            {reservation.notes && <DetailItem label="หมายเหตุ" value={reservation.notes} />}
            
            {/* Converted Loan Info */}
            {reservation.convertedToLoanId && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-green-800">แปลงเป็นคำขอยืมแล้ว</p>
                    <p className="text-sm text-green-700">
                      รหัสคำขอยืม: #{reservation.convertedToLoanId.slice(-8)}
                    </p>
                    {reservation.convertedAt && (
                      <p className="text-xs text-green-600 mt-1">
                        แปลงเมื่อ: {reservation.convertedAt?.toDate?.()?.toLocaleString('th-TH') || '-'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Settings Info */}
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>กฎการจอง:</strong> จองล่วงหน้าได้สูงสุด {settings?.maxAdvanceBookingDays || 30} วัน
              </p>
            </div>
            
            {/* Timestamps */}
            <div className="text-xs text-gray-500 space-y-1">
              <p>สร้างเมื่อ: {reservation.createdAt?.toDate?.()?.toLocaleString('th-TH') || '-'}</p>
              {reservation.approvedAt && (
                <p>อนุมัติเมื่อ: {reservation.approvedAt?.toDate?.()?.toLocaleString('th-TH') || '-'}</p>
              )}
            </div>
            
            {/* Cancel Form */}
            {showCancelForm && (
              <div className="p-4 bg-red-50 rounded-lg space-y-3">
                <label className="block text-sm font-medium text-red-800">เหตุผลในการยกเลิก</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="ระบุเหตุผล (ไม่บังคับ)"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
                  >
                    ยืนยันยกเลิก
                  </button>
                  <button
                    onClick={() => setShowCancelForm(false)}
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-gray-200 flex flex-wrap gap-2 justify-end">
            {reservation.status === RESERVATION_STATUS.PENDING && !showCancelForm && (
              <>
                <button
                  onClick={() => {
                    onStatusChange(reservation.id, RESERVATION_STATUS.APPROVED);
                    onClose();
                  }}
                  className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700"
                >
                  อนุมัติ
                </button>
                <button
                  onClick={() => setShowCancelForm(true)}
                  className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  ปฏิเสธ
                </button>
              </>
            )}
            
            {/* Convert to Loan Button */}
            {canConvert.canConvert && !showCancelForm && (
              <button
                onClick={handleConvert}
                className="px-4 py-2 text-sm text-white bg-purple-600 rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                แปลงเป็นคำขอยืม
              </button>
            )}
            
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Detail Item Component
 */
const DetailItem = ({ label, value }) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-sm font-medium text-gray-900">{value || '-'}</p>
  </div>
);

export default AdminReservationManagement;
