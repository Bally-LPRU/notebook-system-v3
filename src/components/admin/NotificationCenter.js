import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../layout';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import useUnifiedNotifications from '../../hooks/useUnifiedNotifications';
import discordWebhookService from '../../services/discordWebhookService';

// Notification event types for Discord integration
const DISCORD_EVENT_TYPES = {
  NEW_USER: { key: 'newUser', label: 'ผู้ใช้ใหม่สมัครสมาชิก', icon: '👤' },
  LOAN_REQUEST: { key: 'loanRequest', label: 'คำขอยืมอุปกรณ์ใหม่', icon: '📋' },
  LOAN_APPROVED: { key: 'loanApproved', label: 'อนุมัติคำขอยืม', icon: '✅' },
  LOAN_REJECTED: { key: 'loanRejected', label: 'ปฏิเสธคำขอยืม', icon: '❌' },
  LOAN_OVERDUE: { key: 'loanOverdue', label: 'อุปกรณ์เกินกำหนดคืน', icon: '⚠️' },
  LOAN_RETURNED: { key: 'loanReturned', label: 'คืนอุปกรณ์', icon: '📦' },
  RESERVATION_REQUEST: { key: 'reservationRequest', label: 'คำขอจองอุปกรณ์', icon: '📅' },
  EQUIPMENT_ISSUE: { key: 'equipmentIssue', label: 'ปัญหาอุปกรณ์', icon: '🔧' },
  SYSTEM_ALERT: { key: 'systemAlert', label: 'แจ้งเตือนระบบ', icon: '🔔' }
};

// Helper functions outside component
const formatDate = (timestamp) => {
  if (!timestamp) return '-';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
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

const getNotificationContent = (notification) => {
  switch (notification.type) {
    case 'user_registration':
      return {
        title: 'ผู้ใช้ใหม่สมัครสมาชิก',
        description: `${notification.firstName || ''} ${notification.lastName || ''}`.trim() || notification.displayName || notification.email,
        detail: notification.email,
        link: '/admin/users?tab=pending',
        icon: '👤',
        iconBg: 'bg-green-100 text-green-600'
      };
    case 'loan_request':
      return {
        title: 'คำขอยืมอุปกรณ์ใหม่',
        description: `${notification.userName || notification._userName || 'ผู้ใช้'} ขอยืม ${notification.equipmentName || notification._equipmentName || 'อุปกรณ์'}`,
        detail: notification.purpose ? `วัตถุประสงค์: ${notification.purpose}` : '',
        link: '/admin/loan-requests',
        icon: '📋',
        iconBg: 'bg-blue-100 text-blue-600'
      };
    case 'overdue_loan':
      return {
        title: 'อุปกรณ์เกินกำหนดคืน',
        description: `${notification.userName || notification._userName || 'ผู้ใช้'} ยืม ${notification.equipmentName || notification._equipmentName || 'อุปกรณ์'} เกินกำหนด`,
        detail: `ครบกำหนด: ${formatDate(notification.expectedReturnDate)}`,
        link: '/admin/overdue',
        icon: '⚠️',
        iconBg: 'bg-red-100 text-red-600'
      };
    case 'reservation_request':
      return {
        title: 'คำขอจองอุปกรณ์ใหม่',
        description: `${notification.userName || 'ผู้ใช้'} ขอจอง ${notification.equipmentName || 'อุปกรณ์'}`,
        detail: `วันที่จอง: ${formatDate(notification.startTime)}`,
        link: '/admin/reservations',
        icon: '📅',
        iconBg: 'bg-purple-100 text-purple-600'
      };
    default:
      return {
        title: 'การแจ้งเตือน',
        description: notification.message || 'รายละเอียด',
        detail: '',
        link: '#',
        icon: '🔔',
        iconBg: 'bg-gray-100 text-gray-600'
      };
  }
};

const getPriorityBadge = (priority) => {
  const badges = {
    urgent: { text: 'ด่วนมาก', bg: 'bg-red-600' },
    high: { text: 'สูง', bg: 'bg-orange-500' },
    medium: { text: 'ปานกลาง', bg: 'bg-yellow-500' },
    low: { text: 'ต่ำ', bg: 'bg-gray-400' }
  };
  return badges[priority] || badges.low;
};

const NotificationCenter = () => {
  const { userProfile } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const isAdmin = userProfile?.role === 'admin';
  
  const { allNotifications, counts, priorityCounts, loading, error, hasNotifications } = useUnifiedNotifications(isAdmin);

  const [activeTab, setActiveTab] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showDiscordSettings, setShowDiscordSettings] = useState(false);
  const [discordEvents, setDiscordEvents] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (settings?.discordEventTypes) {
      setDiscordEvents(settings.discordEventTypes);
    } else {
      const defaults = {};
      Object.values(DISCORD_EVENT_TYPES).forEach(e => { defaults[e.key] = true; });
      setDiscordEvents(defaults);
    }
  }, [settings]);

  const filteredNotifications = useMemo(() => {
    let filtered = allNotifications;
    if (activeTab !== 'all') filtered = filtered.filter(n => n.category === activeTab);
    if (priorityFilter !== 'all') filtered = filtered.filter(n => n.priority === priorityFilter);
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(n => {
        const content = getNotificationContent(n);
        return content.title.toLowerCase().includes(term) || content.description.toLowerCase().includes(term) ||
          (n.email && n.email.toLowerCase().includes(term)) || (n.equipmentName && n.equipmentName.toLowerCase().includes(term));
      });
    }
    return filtered;
  }, [allNotifications, activeTab, priorityFilter, searchTerm]);


  const sendTestDiscord = async () => {
    if (!settings?.discordEnabled || !settings?.discordWebhookUrl) {
      alert('กรุณาเปิดใช้งาน Discord และตั้งค่า Webhook URL ก่อน');
      return;
    }
    const result = await discordWebhookService.testWebhook(settings.discordWebhookUrl);
    alert(result.success ? 'ส่งข้อความทดสอบไป Discord สำเร็จ!' : 'ส่งไม่สำเร็จ: ' + result.error);
  };

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-xl font-bold text-gray-900">ไม่มีสิทธิ์เข้าถึง</h2>
            <p className="mt-2 text-gray-600">หน้านี้สำหรับผู้ดูแลระบบเท่านั้น</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">กำลังโหลดการแจ้งเตือน...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { key: 'all', label: 'ทั้งหมด', count: counts.total, icon: '🔔' },
    { key: 'users', label: 'ผู้ใช้', count: counts.users, icon: '👤' },
    { key: 'loans', label: 'การยืม', count: counts.loans + counts.overdue, icon: '📋' },
    { key: 'reservations', label: 'การจอง', count: counts.reservations, icon: '📅' }
  ];

  const priorities = [
    { key: 'all', label: 'ทั้งหมด' },
    { key: 'urgent', label: 'ด่วนมาก', count: priorityCounts.urgent, color: 'text-red-600' },
    { key: 'high', label: 'สูง', count: priorityCounts.high, color: 'text-orange-600' },
    { key: 'medium', label: 'ปานกลาง', count: priorityCounts.medium, color: 'text-yellow-600' }
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">ศูนย์การแจ้งเตือน</h1>
            <p className="text-sm text-gray-600 hidden sm:block">รวบรวมการแจ้งเตือนและความเคลื่อนไหวทั้งหมดในระบบ</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowDiscordSettings(!showDiscordSettings)} className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${settings?.discordEnabled ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
              <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
              Discord {settings?.discordEnabled && <span className="ml-1.5 w-2 h-2 bg-green-500 rounded-full"></span>}
            </button>
            <button onClick={() => navigate('/admin/settings')} className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              ตั้งค่า
            </button>
          </div>
        </div>

        {/* Discord Settings Panel */}
        {showDiscordSettings && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-medium text-indigo-900">การแจ้งเตือน Discord</h3>
                <p className="text-sm text-indigo-700">{settings?.discordEnabled ? 'เปิดใช้งานอยู่ - ระบบจะส่งแจ้งเตือนไป Discord' : 'ปิดอยู่ - ไปที่ตั้งค่าเพื่อเปิดใช้งาน'}</p>
              </div>
              <div className="flex gap-2">
                {settings?.discordEnabled && <button onClick={sendTestDiscord} className="px-3 py-1.5 text-sm font-medium text-indigo-700 bg-white border border-indigo-300 rounded-lg hover:bg-indigo-50">ทดสอบส่ง</button>}
                <button onClick={() => navigate('/admin/settings?tab=notifications')} className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">ตั้งค่า Discord</button>
              </div>
            </div>
            {settings?.discordEnabled && (
              <div className="mt-3 pt-3 border-t border-indigo-200">
                <p className="text-xs text-indigo-600 mb-2">เหตุการณ์ที่จะส่งแจ้งเตือน:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.values(DISCORD_EVENT_TYPES).map(event => (
                    <span key={event.key} className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${discordEvents[event.key] !== false ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>{event.icon} {event.label}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mb-4 sm:mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4"><div className="flex items-center justify-between"><div><p className="text-xs sm:text-sm text-gray-500">ทั้งหมด</p><p className="text-xl sm:text-2xl font-bold text-gray-900">{counts.total}</p></div><div className="text-2xl">🔔</div></div></div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4"><div className="flex items-center justify-between"><div><p className="text-xs sm:text-sm text-gray-500">ผู้ใช้ใหม่</p><p className="text-xl sm:text-2xl font-bold text-green-600">{counts.users}</p></div><div className="text-2xl">👤</div></div></div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4"><div className="flex items-center justify-between"><div><p className="text-xs sm:text-sm text-gray-500">คำขอยืม</p><p className="text-xl sm:text-2xl font-bold text-blue-600">{counts.loans}</p></div><div className="text-2xl">📋</div></div></div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4"><div className="flex items-center justify-between"><div><p className="text-xs sm:text-sm text-gray-500">เกินกำหนด</p><p className="text-xl sm:text-2xl font-bold text-red-600">{counts.overdue}</p></div><div className="text-2xl">⚠️</div></div></div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 col-span-2 sm:col-span-1"><div className="flex items-center justify-between"><div><p className="text-xs sm:text-sm text-gray-500">คำขอจอง</p><p className="text-xl sm:text-2xl font-bold text-purple-600">{counts.reservations}</p></div><div className="text-2xl">📅</div></div></div>
        </div>


        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" placeholder="ค้นหาการแจ้งเตือน..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
          <div className="flex overflow-x-auto border-b border-gray-100 scrollbar-hide">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <span className="mr-1.5">{tab.icon}</span>{tab.label}{tab.count > 0 && <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${activeTab === tab.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>{tab.count}</span>}
              </button>
            ))}
          </div>
          <div className="p-3 flex flex-wrap gap-2">
            <span className="text-xs text-gray-500 self-center mr-1">ความสำคัญ:</span>
            {priorities.map(p => (
              <button key={p.key} onClick={() => setPriorityFilter(p.key)} className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${priorityFilter === p.key ? 'bg-blue-600 text-white' : `bg-gray-100 ${p.color || 'text-gray-600'} hover:bg-gray-200`}`}>
                {p.label}{p.count !== undefined && p.count > 0 && ` (${p.count})`}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3"><span className="text-red-500">⚠️</span><div><p className="text-sm font-medium text-red-800">เกิดข้อผิดพลาด</p><p className="text-sm text-red-600">{error}</p></div></div>
          </div>
        )}

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {!hasNotifications ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="text-5xl sm:text-6xl mb-4">🎉</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่มีการแจ้งเตือน</h3>
              <p className="text-gray-600 text-sm">ยังไม่มีรายการที่ต้องดำเนินการในขณะนี้</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="text-5xl sm:text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบรายการ</h3>
              <p className="text-gray-600 text-sm">ไม่มีการแจ้งเตือนที่ตรงกับตัวกรองที่เลือก</p>
              <button onClick={() => { setActiveTab('all'); setPriorityFilter('all'); setSearchTerm(''); }} className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">ล้างตัวกรอง</button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => {
                const content = getNotificationContent(notification);
                const badge = getPriorityBadge(notification.priority);
                return (
                  <Link key={notification.id} to={content.link} className="block hover:bg-gray-50 transition-colors">
                    <div className="p-3 sm:p-4">
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl sm:text-2xl ${content.iconBg}`}>{content.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <h3 className="text-sm font-medium text-gray-900 truncate">{content.title}</h3>
                                <span className={`flex-shrink-0 px-1.5 py-0.5 text-xs font-medium text-white rounded ${badge.bg}`}>{badge.text}</span>
                              </div>
                              <p className="text-sm text-gray-700 truncate">{content.description}</p>
                              {content.detail && <p className="text-xs text-gray-500 mt-0.5 truncate">{content.detail}</p>}
                            </div>
                            <div className="flex-shrink-0 text-right"><p className="text-xs text-gray-400">{formatTimeAgo(notification.createdAt)}</p></div>
                          </div>
                        </div>
                        <svg className="flex-shrink-0 w-5 h-5 text-gray-300 self-center" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {filteredNotifications.length > 0 && <div className="text-center text-sm text-gray-500 mt-4">แสดง {filteredNotifications.length} จาก {counts.total} รายการ</div>}

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link to="/admin/users?tab=pending" className="flex items-center justify-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
            <span>👤</span><span className="text-sm font-medium">อนุมัติผู้ใช้</span>{counts.users > 0 && <span className="px-1.5 py-0.5 text-xs bg-green-200 rounded-full">{counts.users}</span>}
          </Link>
          <Link to="/admin/loan-requests" className="flex items-center justify-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
            <span>📋</span><span className="text-sm font-medium">คำขอยืม</span>{counts.loans > 0 && <span className="px-1.5 py-0.5 text-xs bg-blue-200 rounded-full">{counts.loans}</span>}
          </Link>
          <Link to="/admin/overdue" className="flex items-center justify-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors">
            <span>⚠️</span><span className="text-sm font-medium">เกินกำหนด</span>{counts.overdue > 0 && <span className="px-1.5 py-0.5 text-xs bg-red-200 rounded-full">{counts.overdue}</span>}
          </Link>
          <Link to="/admin/settings?tab=notifications" className="flex items-center justify-center gap-2 p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
            <span>⚙️</span><span className="text-sm font-medium">ตั้งค่าแจ้งเตือน</span>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default NotificationCenter;
