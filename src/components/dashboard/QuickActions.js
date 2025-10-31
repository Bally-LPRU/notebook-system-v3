import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const QuickActions = () => {
  const { isAdmin, userProfile } = useAuth();

  const userActions = [
    {
      title: 'ยืมอุปกรณ์',
      description: 'เลือกอุปกรณ์และส่งคำขอยืม',
      icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      color: 'blue',
      link: '/equipment',
      show: userProfile?.status === 'approved'
    },
    {
      title: 'จองอุปกรณ์',
      description: 'จองอุปกรณ์ล่วงหน้า',
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      color: 'green',
      link: '/reservations',
      show: userProfile?.status === 'approved'
    },
    {
      title: 'คำขอของฉัน',
      description: 'ดูสถานะคำขอยืมและการจอง',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      color: 'purple',
      link: '/my-requests',
      show: true
    },
    {
      title: 'การแจ้งเตือน',
      description: 'ดูการแจ้งเตือนทั้งหมด',
      icon: 'M15 17h5l-5 5v-5zM10.5 3.75a6 6 0 0 1 6 6v2.25a2.25 2.25 0 0 0 2.25 2.25H20.5a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-.75.75H3.5a.75.75 0 0 1-.75-.75V15a.75.75 0 0 1 .75-.75H5.75a2.25 2.25 0 0 0 2.25-2.25V9.75a6 6 0 0 1 6-6z',
      color: 'yellow',
      link: '/notifications',
      show: true
    }
  ];

  const adminActions = [
    {
      title: 'จัดการคำขอยืม',
      description: 'อนุมัติหรือปฏิเสธคำขอยืม',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'yellow',
      link: '/admin/loan-requests',
      show: true
    },
    {
      title: 'จัดการอุปกรณ์',
      description: 'เพิ่ม แก้ไข หรือลบอุปกรณ์',
      icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      color: 'blue',
      link: '/admin/equipment',
      show: true
    },
    {
      title: 'อุปกรณ์ที่ยืม',
      description: 'ติดตามและบันทึกการคืน',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'purple',
      link: '/admin/borrowed-equipment',
      show: true
    },
    {
      title: 'จัดการผู้ใช้',
      description: 'อนุมัติสมาชิกใหม่',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
      color: 'green',
      link: '/admin/users',
      show: true
    },
    {
      title: 'จัดการการจอง',
      description: 'อนุมัติและติดตามการจอง',
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      color: 'indigo',
      link: '/admin/reservations',
      show: true
    },
    {
      title: 'รายงาน',
      description: 'ดูรายงานและสถิติ',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      color: 'red',
      link: '/admin/reports',
      show: true
    }
  ];

  const colorClasses = {
    blue: {
      bg: 'bg-blue-100',
      text: 'text-blue-600',
      hover: 'hover:bg-blue-50'
    },
    green: {
      bg: 'bg-green-100',
      text: 'text-green-600',
      hover: 'hover:bg-green-50'
    },
    purple: {
      bg: 'bg-purple-100',
      text: 'text-purple-600',
      hover: 'hover:bg-purple-50'
    },
    yellow: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-600',
      hover: 'hover:bg-yellow-50'
    },
    red: {
      bg: 'bg-red-100',
      text: 'text-red-600',
      hover: 'hover:bg-red-50'
    },
    indigo: {
      bg: 'bg-indigo-100',
      text: 'text-indigo-600',
      hover: 'hover:bg-indigo-50'
    }
  };

  const actions = isAdmin ? adminActions : userActions;
  const visibleActions = actions.filter(action => action.show);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">การดำเนินการด่วน</h3>
      
      {userProfile?.status === 'pending' && !isAdmin && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                บัญชีของคุณรอการอนุมัติจากผู้ดูแลระบบ คุณจะสามารถยืมและจองอุปกรณ์ได้หลังจากได้รับการอนุมัติ
              </p>
            </div>
          </div>
        </div>
      )}

      {userProfile?.status === 'suspended' && !isAdmin && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">
                บัญชีของคุณถูกระงับ กรุณาติดต่อผู้ดูแลระบบเพื่อขอความช่วยเหลือ
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleActions.map((action, index) => (
          <Link
            key={index}
            to={action.link}
            className={`flex items-center p-4 border border-gray-200 rounded-lg transition-colors ${colorClasses[action.color].hover}`}
          >
            <div className={`w-10 h-10 ${colorClasses[action.color].bg} rounded-lg flex items-center justify-center mr-4`}>
              <svg className={`w-6 h-6 ${colorClasses[action.color].text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">{action.title}</p>
              <p className="text-sm text-gray-500">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>

      {visibleActions.length === 0 && (
        <div className="text-center py-8">
          <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
          </div>
          <p className="text-gray-500">ไม่มีการดำเนินการที่พร้อมใช้งาน</p>
        </div>
      )}
    </div>
  );
};

export default QuickActions;