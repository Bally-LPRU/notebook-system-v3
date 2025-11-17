import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { LOAN_REQUEST_STATUS } from '../../types/loanRequest';
import { RESERVATION_STATUS } from '../../types/reservation';

const RecentActivity = () => {
  const { user, isAdmin } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        setLoading(true);
        setError(null);

        const recentActivities = [];

        // Fetch recent loan requests
        const loanRequestsRef = collection(db, 'loanRequests');
        let loanQuery;
        
        if (isAdmin) {
          // Admin sees all recent loan requests
          loanQuery = query(
            loanRequestsRef,
            orderBy('createdAt', 'desc'),
            limit(5)
          );
        } else {
          // Users see only their own loan requests
          loanQuery = query(
            loanRequestsRef,
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(5)
          );
        }

        const loanSnapshot = await getDocs(loanQuery);
        
        for (const doc of loanSnapshot.docs) {
          const loanData = doc.data();
          
          // Get equipment details
          const equipmentRef = collection(db, 'equipmentManagement');
          const equipmentQuery = query(equipmentRef, where('__name__', '==', loanData.equipmentId));
          const equipmentSnapshot = await getDocs(equipmentQuery);
          const equipment = equipmentSnapshot.docs[0]?.data();

          // Get user details if admin
          let userData = null;
          if (isAdmin && loanData.userId !== user.uid) {
            const userRef = collection(db, 'users');
            const userQuery = query(userRef, where('__name__', '==', loanData.userId));
            const userSnapshot = await getDocs(userQuery);
            userData = userSnapshot.docs[0]?.data();
          }

          recentActivities.push({
            id: doc.id,
            type: 'loan_request',
            action: getActionText(loanData.status, 'loan'),
            equipment: equipment?.name || 'อุปกรณ์ที่ไม่ระบุ',
            user: userData ? `${userData.firstName} ${userData.lastName}` : (isAdmin ? 'ผู้ใช้ที่ไม่ระบุ' : 'คุณ'),
            timestamp: loanData.createdAt?.toDate() || new Date(),
            status: loanData.status,
            icon: getLoanIcon(loanData.status),
            color: getLoanColor(loanData.status)
          });
        }

        // Fetch recent reservations
        const reservationsRef = collection(db, 'reservations');
        let reservationQuery;
        
        if (isAdmin) {
          // Admin sees all recent reservations
          reservationQuery = query(
            reservationsRef,
            orderBy('createdAt', 'desc'),
            limit(5)
          );
        } else {
          // Users see only their own reservations
          reservationQuery = query(
            reservationsRef,
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(5)
          );
        }

        const reservationSnapshot = await getDocs(reservationQuery);
        
        for (const doc of reservationSnapshot.docs) {
          const reservationData = doc.data();
          
          // Get equipment details
          const equipmentRef = collection(db, 'equipmentManagement');
          const equipmentQuery = query(equipmentRef, where('__name__', '==', reservationData.equipmentId));
          const equipmentSnapshot = await getDocs(equipmentQuery);
          const equipment = equipmentSnapshot.docs[0]?.data();

          // Get user details if admin
          let userData = null;
          if (isAdmin && reservationData.userId !== user.uid) {
            const userRef = collection(db, 'users');
            const userQuery = query(userRef, where('__name__', '==', reservationData.userId));
            const userSnapshot = await getDocs(userQuery);
            userData = userSnapshot.docs[0]?.data();
          }

          recentActivities.push({
            id: doc.id,
            type: 'reservation',
            action: getActionText(reservationData.status, 'reservation'),
            equipment: equipment?.name || 'อุปกรณ์ที่ไม่ระบุ',
            user: userData ? `${userData.firstName} ${userData.lastName}` : (isAdmin ? 'ผู้ใช้ที่ไม่ระบุ' : 'คุณ'),
            timestamp: reservationData.createdAt?.toDate() || new Date(),
            status: reservationData.status,
            icon: getReservationIcon(reservationData.status),
            color: getReservationColor(reservationData.status),
            reservationDate: reservationData.reservationDate?.toDate()
          });
        }

        // Sort all activities by timestamp
        recentActivities.sort((a, b) => b.timestamp - a.timestamp);
        
        // Take only the 10 most recent
        setActivities(recentActivities.slice(0, 10));

      } catch (err) {
        console.error('Error fetching recent activity:', err);
        setError('ไม่สามารถโหลดกิจกรรมล่าสุดได้');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchRecentActivity();
    }
  }, [user, isAdmin]);

  const getActionText = (status, type) => {
    if (type === 'loan') {
      switch (status) {
        case LOAN_REQUEST_STATUS.PENDING:
          return 'ส่งคำขอยืม';
        case LOAN_REQUEST_STATUS.APPROVED:
          return 'คำขอยืมได้รับการอนุมัติ';
        case LOAN_REQUEST_STATUS.REJECTED:
          return 'คำขอยืมถูกปฏิเสธ';
        case LOAN_REQUEST_STATUS.BORROWED:
          return 'เริ่มยืมอุปกรณ์';
        case LOAN_REQUEST_STATUS.RETURNED:
          return 'คืนอุปกรณ์แล้ว';
        case LOAN_REQUEST_STATUS.OVERDUE:
          return 'คืนอุปกรณ์ล่าช้า';
        default:
          return 'กิจกรรมการยืม';
      }
    } else {
      switch (status) {
        case RESERVATION_STATUS.PENDING:
          return 'ส่งคำขอจอง';
        case RESERVATION_STATUS.APPROVED:
          return 'การจองได้รับการอนุมัติ';
        case RESERVATION_STATUS.REJECTED:
          return 'การจองถูกปฏิเสธ';
        case RESERVATION_STATUS.READY:
          return 'พร้อมรับอุปกรณ์';
        case RESERVATION_STATUS.COMPLETED:
          return 'การจองเสร็จสิ้น';
        case RESERVATION_STATUS.CANCELLED:
          return 'ยกเลิกการจอง';
        case RESERVATION_STATUS.EXPIRED:
          return 'การจองหมดอายุ';
        default:
          return 'กิจกรรมการจอง';
      }
    }
  };

  const getLoanIcon = (status) => {
    switch (status) {
      case LOAN_REQUEST_STATUS.PENDING:
        return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
      case LOAN_REQUEST_STATUS.APPROVED:
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case LOAN_REQUEST_STATUS.REJECTED:
        return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
      case LOAN_REQUEST_STATUS.BORROWED:
        return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
      case LOAN_REQUEST_STATUS.RETURNED:
        return 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6';
      case LOAN_REQUEST_STATUS.OVERDUE:
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z';
      default:
        return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
    }
  };

  const getReservationIcon = (status) => {
    switch (status) {
      case RESERVATION_STATUS.PENDING:
        return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
      case RESERVATION_STATUS.APPROVED:
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case RESERVATION_STATUS.REJECTED:
        return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
      default:
        return 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z';
    }
  };

  const getLoanColor = (status) => {
    switch (status) {
      case LOAN_REQUEST_STATUS.PENDING:
        return 'yellow';
      case LOAN_REQUEST_STATUS.APPROVED:
      case LOAN_REQUEST_STATUS.BORROWED:
      case LOAN_REQUEST_STATUS.RETURNED:
        return 'green';
      case LOAN_REQUEST_STATUS.REJECTED:
      case LOAN_REQUEST_STATUS.OVERDUE:
        return 'red';
      default:
        return 'gray';
    }
  };

  const getReservationColor = (status) => {
    switch (status) {
      case RESERVATION_STATUS.PENDING:
        return 'yellow';
      case RESERVATION_STATUS.APPROVED:
      case RESERVATION_STATUS.READY:
      case RESERVATION_STATUS.COMPLETED:
        return 'green';
      case RESERVATION_STATUS.REJECTED:
      case RESERVATION_STATUS.EXPIRED:
        return 'red';
      case RESERVATION_STATUS.CANCELLED:
        return 'gray';
      default:
        return 'gray';
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
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
      return timestamp.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const colorClasses = {
    yellow: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-600'
    },
    green: {
      bg: 'bg-green-100',
      text: 'text-green-600'
    },
    red: {
      bg: 'bg-red-100',
      text: 'text-red-600'
    },
    gray: {
      bg: 'bg-gray-100',
      text: 'text-gray-600'
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">กิจกรรมล่าสุด</h3>
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">กิจกรรมล่าสุด</h3>
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">กิจกรรมล่าสุด</h3>
      
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
                      <span className={`h-8 w-8 rounded-full ${colorClasses[activity.color].bg} flex items-center justify-center ring-8 ring-white`}>
                        <svg className={`h-4 w-4 ${colorClasses[activity.color].text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={activity.icon} />
                        </svg>
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{activity.user}</span> {activity.action} <span className="font-medium">{activity.equipment}</span>
                        </p>
                        {activity.reservationDate && (
                          <p className="text-xs text-gray-500 mt-1">
                            วันที่จอง: {activity.reservationDate.toLocaleDateString('th-TH')}
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

export default RecentActivity;