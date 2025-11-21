import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../layout';
import { useAuth } from '../../contexts/AuthContext';
import useAdminNotifications from '../../hooks/useAdminNotifications';

const NotificationCenter = () => {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin';
  
  const {
    allNotifications,
    counts,
    priorityCounts,
    loading,
    error,
    hasNotifications
  } = useAdminNotifications(isAdmin);

  const [filter, setFilter] = useState('all'); // all, users, loans, reservations
  const [priorityFilter, setPriorityFilter] = useState('all'); // all, urgent, high, medium

  // Filter notifications
  const filteredNotifications = allNotifications.filter(notification => {
    if (filter !== 'all' && notification.category !== filter) return false;
    if (priorityFilter !== 'all' && notification.priority !== priorityFilter) return false;
    return true;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent':
        return (
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'high':
        return (
          <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getNotificationContent = (notification) => {
    switch (notification.type) {
      case 'user_registration':
        return {
          title: 'ผู้ใช้ใหม่สมัครสมาชิก',
          description: `${notification.firstName || ''} ${notification.lastName || ''}`.trim() || notification.displayName,
          detail: notification.email,
          link: '/admin/users?tab=pending',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )
        };
      
      case 'loan_request':
        return {
          title: 'คำขอยืมอุปกรณ์ใหม่',
          description: `${notification.userName || 'ผู้ใช้'} ขอยืม ${notification.equipmentName || 'อุปกรณ์'}`,
          detail: `วันที่ยืม: ${notification.borrowDate?.toDate?.().toLocaleDateString('th-TH') || '-'}`,
          link: '/admin/loan-requests',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )
        };
      
      case 'overdue_loan':
        return {
          title: 'การยืมเกินกำหนด',
          description: `${notification.userName || 'ผู้ใช้'} ยืม ${notification.equipmentName || 'อุปกรณ์'} เกินกำหนด`,
          detail: `ครบกำหนด: ${notification.expectedReturnDate?.toDate?.().toLocaleDateString('th-TH') || '-'}`,
          link: '/admin/overdue',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      
      case 'reservation_request':
        return {
          title: 'คำขอจองอุปกรณ์ใหม่',
          description: `${notification.userName || 'ผู้ใช้'} ขอจอง ${notification.equipmentName || 'อุปกรณ์'}`,
          detail: `วันที่จอง: ${notification.startTime?.toDate?.().toLocaleDateString('th-TH') || '-'}`,
          link: '/admin/reservations',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )
        };
      
      default:
        return {
          title: 'การแจ้งเตือน',
          description: 'รายละเอียด',
          detail: '',
          link: '#',
          icon: null
        };
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'เมื่อสักครู่';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'เมื่อสักครู่';
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
    return date.toLocaleDateString('th-TH');
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">ไม่มีสิทธิ์เข้าถึง</h2>
          <p className="mt-2 text-gray-600">หน้านี้สำหรับผู้ดูแลระบบเท่านั้น</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดการแจ้งเตือน...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900">เกิดข้อผิดพลาด</h2>
          <p className="mt-2 text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ศูนย์การแจ้งเตือน</h1>
          <p className="mt-2 text-gray-600">
            รวบรวมการแจ้งเตือนจากทุกระบบในที่เดียว
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">{counts.total}</p>
              </div>
              <div className="text-blue-600">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ผู้ใช้ใหม่</p>
                <p className="text-2xl font-bold text-gray-900">{counts.users}</p>
              </div>
              <div className="text-green-600">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">คำขอยืม</p>
                <p className="text-2xl font-bold text-gray-900">{counts.loans}</p>
              </div>
              <div className="text-purple-600">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">เกินกำหนด</p>
                <p className="text-2xl font-bold text-red-600">{counts.overdue}</p>
              </div>
              <div className="text-red-600">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">คำขอจอง</p>
                <p className="text-2xl font-bold text-gray-900">{counts.reservations}</p>
              </div>
              <div className="text-orange-600">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ประเภท
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    filter === 'all'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ทั้งหมด ({counts.total})
                </button>
                <button
                  onClick={() => setFilter('users')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    filter === 'users'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ผู้ใช้ ({counts.users})
                </button>
                <button
                  onClick={() => setFilter('loans')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    filter === 'loans'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  การยืม ({counts.loans + counts.overdue})
                </button>
                <button
                  onClick={() => setFilter('reservations')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    filter === 'reservations'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  การจอง ({counts.reservations})
                </button>
              </div>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ความสำคัญ
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setPriorityFilter('all')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    priorityFilter === 'all'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ทั้งหมด
                </button>
                <button
                  onClick={() => setPriorityFilter('urgent')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    priorityFilter === 'urgent'
                      ? 'bg-red-600 text-white'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  ด่วนมาก ({priorityCounts.urgent})
                </button>
                <button
                  onClick={() => setPriorityFilter('high')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    priorityFilter === 'high'
                      ? 'bg-orange-600 text-white'
                      : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                  }`}
                >
                  สูง ({priorityCounts.high})
                </button>
                <button
                  onClick={() => setPriorityFilter('medium')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    priorityFilter === 'medium'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  }`}
                >
                  ปานกลาง ({priorityCounts.medium})
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow">
          {!hasNotifications ? (
            <div className="p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">🔔</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ไม่มีการแจ้งเตือน
              </h3>
              <p className="text-gray-600">
                ยังไม่มีรายการที่ต้องดำเนินการในขณะนี้
              </p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ไม่พบรายการ
              </h3>
              <p className="text-gray-600">
                ไม่มีการแจ้งเตือนที่ตรงกับตัวกรองที่เลือก
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => {
                const content = getNotificationContent(notification);
                
                return (
                  <Link
                    key={notification.id}
                    to={content.link}
                    className="block hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="p-6">
                      <div className="flex items-start space-x-4">
                        {/* Icon */}
                        <div className={`flex-shrink-0 p-3 rounded-full ${getPriorityColor(notification.priority)}`}>
                          {content.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                {getPriorityIcon(notification.priority)}
                                <h3 className="text-sm font-medium text-gray-900">
                                  {content.title}
                                </h3>
                              </div>
                              <p className="text-sm text-gray-700 mb-1">
                                {content.description}
                              </p>
                              {content.detail && (
                                <p className="text-xs text-gray-500">
                                  {content.detail}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex-shrink-0 ml-4 text-right">
                              <p className="text-xs text-gray-500">
                                {formatTimeAgo(notification.createdAt)}
                              </p>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${getPriorityColor(notification.priority)}`}>
                                {notification.priority === 'urgent' && 'ด่วนมาก'}
                                {notification.priority === 'high' && 'สูง'}
                                {notification.priority === 'medium' && 'ปานกลาง'}
                                {notification.priority === 'low' && 'ต่ำ'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Arrow */}
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default NotificationCenter;
