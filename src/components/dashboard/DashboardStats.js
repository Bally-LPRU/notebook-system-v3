import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import EquipmentService from '../../services/equipmentService';
import LoanRequestService from '../../services/loanRequestService';
import ReservationService from '../../services/reservationService';
import { RESERVATION_STATUS } from '../../types/reservation';

const DashboardStats = () => {
  const { isAdmin, user, authInitialized } = useAuth();
  const [stats, setStats] = useState({
    equipment: {
      total: 0,
      available: 0,
      borrowed: 0,
      maintenance: 0
    },
    loanRequests: {
      total: 0,
      pending: 0,
      approved: 0,
      overdue: 0
    },
    reservations: {
      total: 0,
      pending: 0,
      approved: 0,
      today: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch equipment stats
        const equipmentStats = await EquipmentService.getEquipmentStats();
        
        // Fetch loan request stats
        const loanRequestStats = await LoanRequestService.getLoanRequestStats(
          isAdmin ? null : user?.uid
        );
        
        // Fetch reservation stats
        const reservationStats = await ReservationService.getReservationStats();
        
        // Calculate today's reservations
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayReservations = await ReservationService.getAllReservations({
          startDate: today,
          endDate: tomorrow,
          status: RESERVATION_STATUS.APPROVED
        });

        setStats({
          equipment: {
            total: equipmentStats.total,
            available: equipmentStats.available,
            borrowed: equipmentStats.borrowed,
            maintenance: equipmentStats.maintenance
          },
          loanRequests: {
            total: loanRequestStats.total,
            pending: loanRequestStats.pending,
            approved: loanRequestStats.approved,
            overdue: loanRequestStats.overdue
          },
          reservations: {
            total: reservationStats.total,
            pending: reservationStats.pending,
            approved: reservationStats.approved,
            today: todayReservations.length
          }
        });
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('ไม่สามารถโหลดข้อมูลสถิติได้');
      } finally {
        setLoading(false);
      }
    };

    if (!authInitialized || !user) {
      return;
    }

    fetchStats();
  }, [authInitialized, user, isAdmin]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-200 rounded-md"></div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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
    );
  }

  const statCards = [
    {
      title: 'อุปกรณ์ทั้งหมด',
      value: stats.equipment.total,
      subtitle: `ว่าง ${stats.equipment.available} | ถูกยืม ${stats.equipment.borrowed}`,
      icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      color: 'blue',
      show: true
    },
    {
      title: 'คำขอรอการอนุมัติ',
      value: stats.loanRequests.pending,
      subtitle: `ทั้งหมด ${stats.loanRequests.total} คำขอ`,
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'yellow',
      show: isAdmin
    },
    {
      title: 'การจองวันนี้',
      value: stats.reservations.today,
      subtitle: `รอการอนุมัติ ${stats.reservations.pending} รายการ`,
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      color: 'green',
      show: true
    },
    {
      title: 'อุปกรณ์ที่ครบกำหนด',
      value: stats.loanRequests.overdue,
      subtitle: `อนุมัติแล้ว ${stats.loanRequests.approved} รายการ`,
      icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z',
      color: 'red',
      show: isAdmin
    }
  ];

  const colorClasses = {
    blue: {
      bg: 'bg-blue-100',
      text: 'text-blue-600',
      border: 'border-blue-200'
    },
    yellow: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-600',
      border: 'border-yellow-200'
    },
    green: {
      bg: 'bg-green-100',
      text: 'text-green-600',
      border: 'border-green-200'
    },
    red: {
      bg: 'bg-red-100',
      text: 'text-red-600',
      border: 'border-red-200'
    }
  };

  const visibleCards = statCards.filter(card => card.show);

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.min(visibleCards.length, 4)} gap-6`}>
      {visibleCards.map((card, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 ${colorClasses[card.color].bg} rounded-md flex items-center justify-center`}>
                <svg className={`w-5 h-5 ${colorClasses[card.color].text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                </svg>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500">{card.title}</p>
              <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
              {card.subtitle && (
                <p className="text-xs text-gray-400 mt-1">{card.subtitle}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;
