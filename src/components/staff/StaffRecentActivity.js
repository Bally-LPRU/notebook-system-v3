/**
 * StaffRecentActivity Component
 * Displays recent loan management activities for Staff Dashboard
 * Requirements: 9.5
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { LOAN_REQUEST_STATUS, LOAN_REQUEST_STATUS_LABELS } from '../../types/loanRequest';

// Activity type icons
const ACTIVITY_ICONS = {
  approve: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  reject: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  return: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6',
  notify: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  pickup: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
  pending: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
};

// Activity type colors
const ACTIVITY_COLORS = {
  approve: { bg: 'bg-green-100', text: 'text-green-600' },
  reject: { bg: 'bg-red-100', text: 'text-red-600' },
  return: { bg: 'bg-purple-100', text: 'text-purple-600' },
  notify: { bg: 'bg-blue-100', text: 'text-blue-600' },
  pickup: { bg: 'bg-cyan-100', text: 'text-cyan-600' },
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-600' }
};

/**
 * Get activity type from loan request status
 */
const getActivityType = (status, previousStatus) => {
  switch (status) {
    case LOAN_REQUEST_STATUS.APPROVED:
      return 'approve';
    case LOAN_REQUEST_STATUS.REJECTED:
      return 'reject';
    case LOAN_REQUEST_STATUS.RETURNED:
      return 'return';
    case LOAN_REQUEST_STATUS.BORROWED:
      return 'pickup';
    case LOAN_REQUEST_STATUS.PENDING:
      return 'pending';
    default:
      return 'pending';
  }
};

/**
 * Get activity description in Thai
 */
const getActivityDescription = (status, equipmentName, userName) => {
  switch (status) {
    case LOAN_REQUEST_STATUS.APPROVED:
      return `อนุมัติคำขอยืม "${equipmentName}" ของ ${userName}`;
    case LOAN_REQUEST_STATUS.REJECTED:
      return `ปฏิเสธคำขอยืม "${equipmentName}" ของ ${userName}`;
    case LOAN_REQUEST_STATUS.RETURNED:
      return `รับคืนอุปกรณ์ "${equipmentName}" จาก ${userName}`;
    case LOAN_REQUEST_STATUS.BORROWED:
      return `บันทึกรับอุปกรณ์ "${equipmentName}" โดย ${userName}`;
    case LOAN_REQUEST_STATUS.PENDING:
      return `คำขอยืม "${equipmentName}" จาก ${userName}`;
    default:
      return `กิจกรรมการยืม "${equipmentName}"`;
  }
};

/**
 * Format timestamp to relative time
 */
const formatTimestamp = (timestamp) => {
  if (!timestamp) return '-';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) {
    return 'เมื่อสักครู่';
  } else if (minutes < 60) {
    return `${minutes} นาทีที่แล้ว`;
  } else if (hours < 24) {
    return `${hours} ชั่วโมงที่แล้ว`;
  } else if (days < 7) {
    return `${days} วันที่แล้ว`;
  } else {
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

/**
 * StaffRecentActivity - Shows recent loan management activities
 * @param {Object} props
 * @param {number} props.limit - Maximum number of activities to show (default: 10)
 */
const StaffRecentActivity = ({ limit: activityLimit = 10 }) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        const recentActivities = [];

        // Fetch recent loan requests with status changes (approved, rejected, borrowed, returned)
        const loanRequestsRef = collection(db, 'loanRequests');
        
        // Get recently updated loan requests
        const loanQuery = query(
          loanRequestsRef,
          orderBy('updatedAt', 'desc'),
          limit(activityLimit * 2) // Fetch more to filter
        );

        const loanSnapshot = await getDocs(loanQuery);
        
        for (const doc of loanSnapshot.docs) {
          const loanData = doc.data();
          
          // Only show activities that are not pending (staff actions)
          // or show pending for awareness
          const equipmentName = loanData._equipmentName || loanData.equipment?.name || 'อุปกรณ์';
          const userName = loanData._userName || 
            (loanData.user?.firstName ? `${loanData.user.firstName} ${loanData.user.lastName || ''}`.trim() : 'ผู้ใช้');

          const activityType = getActivityType(loanData.status);
          const colors = ACTIVITY_COLORS[activityType] || ACTIVITY_COLORS.pending;

          recentActivities.push({
            id: doc.id,
            type: activityType,
            description: getActivityDescription(loanData.status, equipmentName, userName),
            timestamp: loanData.updatedAt || loanData.createdAt,
            status: loanData.status,
            statusLabel: LOAN_REQUEST_STATUS_LABELS[loanData.status],
            icon: ACTIVITY_ICONS[activityType],
            colors,
            equipmentName,
            userName,
            reason: loanData.rejectionReason || null
          });
        }

        // Sort by timestamp and take the limit
        recentActivities.sort((a, b) => {
          const dateA = a.timestamp?.toDate?.() || new Date(a.timestamp);
          const dateB = b.timestamp?.toDate?.() || new Date(b.timestamp);
          return dateB - dateA;
        });

        setActivities(recentActivities.slice(0, activityLimit));

      } catch (err) {
        console.error('Error fetching recent activity:', err);
        setError('ไม่สามารถโหลดกิจกรรมล่าสุดได้');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivity();
  }, [user, activityLimit]);

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
          กิจกรรมล่าสุด
        </h3>
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">กิจกรรมล่าสุด</h3>
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
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
        กิจกรรมล่าสุด
      </h3>
      
      {activities.length === 0 ? (
        <div className="text-center py-8">
          <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-500">ยังไม่มีกิจกรรมล่าสุด</p>
        </div>
      ) : (
        <div className="flow-root">
          <ul className="-mb-8">
            {activities.map((activity, index) => (
              <li key={activity.id}>
                <div className="relative pb-8">
                  {index !== activities.length - 1 && (
                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                  )}
                  <div className="relative flex space-x-3">
                    <div>
                      <span className={`h-8 w-8 rounded-full ${activity.colors.bg} flex items-center justify-center ring-8 ring-white`}>
                        <svg className={`h-4 w-4 ${activity.colors.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={activity.icon} />
                        </svg>
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-900">
                          {activity.description}
                        </p>
                        {activity.reason && (
                          <p className="text-xs text-gray-500 mt-1">
                            เหตุผล: {activity.reason}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        <time>{formatTimestamp(activity.timestamp)}</time>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default StaffRecentActivity;
