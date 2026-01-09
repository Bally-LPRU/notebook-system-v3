import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../layout';
import { useLoanRequestStats, useLoanRequests } from '../../hooks/useLoanRequests';
import StatisticsService from '../../services/statisticsService';
import { LOAN_REQUEST_STATUS } from '../../types/loanRequest';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

// Pastel Color Palette
const COLORS = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', fill: '#93C5FD', border: 'border-blue-200' },
  green: { bg: 'bg-emerald-100', text: 'text-emerald-600', fill: '#6EE7B7', border: 'border-emerald-200' },
  yellow: { bg: 'bg-amber-100', text: 'text-amber-600', fill: '#FCD34D', border: 'border-amber-200' },
  red: { bg: 'bg-rose-100', text: 'text-rose-600', fill: '#FDA4AF', border: 'border-rose-200' },
  purple: { bg: 'bg-violet-100', text: 'text-violet-600', fill: '#C4B5FD', border: 'border-violet-200' },
  cyan: { bg: 'bg-cyan-100', text: 'text-cyan-600', fill: '#67E8F9', border: 'border-cyan-200' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600', fill: '#FDBA74', border: 'border-orange-200' },
  gray: { bg: 'bg-slate-100', text: 'text-slate-600', fill: '#CBD5E1', border: 'border-slate-200' },
};

// Animated Stat Card
const StatCard = ({ title, value, icon, color, onClick, delay = 0 }) => (
  <div
    onClick={onClick}
    className={`group bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border ${COLORS[color].border} p-6 
      hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer animate-fade-in`}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <p className={`text-3xl font-bold ${COLORS[color].text} transition-all duration-300 group-hover:scale-110`}>
          {value}
        </p>
      </div>
      <div className={`w-14 h-14 ${COLORS[color].bg} rounded-2xl flex items-center justify-center 
        transition-all duration-300 group-hover:rotate-12 group-hover:scale-110`}>
        {icon}
      </div>
    </div>
  </div>
);

// Quick Action Button with Animation
const QuickActionButton = ({ title, description, icon, onClick, color }) => (
  <button
    onClick={onClick}
    className={`group flex items-center gap-4 p-4 bg-white/80 backdrop-blur-sm rounded-2xl border ${COLORS[color].border}
      hover:shadow-lg hover:scale-[1.02] transition-all duration-300 text-left w-full`}
  >
    <div className={`w-12 h-12 ${COLORS[color].bg} rounded-xl flex items-center justify-center 
      transition-all duration-300 group-hover:rotate-6 group-hover:scale-110`}>
      <span className={COLORS[color].text}>{icon}</span>
    </div>
    <div>
      <p className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">{title}</p>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
    <svg className="w-5 h-5 text-gray-300 ml-auto group-hover:text-gray-500 group-hover:translate-x-1 transition-all" 
      fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  </button>
);

// Custom Tooltip
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-gray-100">
        <p className="font-semibold text-gray-900">{payload[0].name}</p>
        <p className="text-sm text-gray-600">{payload[0].value} รายการ</p>
      </div>
    );
  }
  return null;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [equipmentStats, setEquipmentStats] = useState({ total: 0, available: 0, borrowed: 0 });
  const [equipmentLoading, setEquipmentLoading] = useState(true);
  const [alertStats, setAlertStats] = useState({ total: 0, critical: 0, high: 0, unresolved: 0 });
  const [alertsLoading, setAlertsLoading] = useState(true);
  
  const { stats: loanStats, loading: loanStatsLoading } = useLoanRequestStats();
  
  const { loanRequests: borrowedLoans, loading: borrowedLoading } = useLoanRequests({
    status: LOAN_REQUEST_STATUS.BORROWED, sortBy: 'expectedReturnDate', sortOrder: 'asc', limit: 20
  });

  const { loanRequests: overdueLoans, loading: overdueLoading } = useLoanRequests({
    status: LOAN_REQUEST_STATUS.OVERDUE, sortBy: 'expectedReturnDate', sortOrder: 'asc', limit: 10
  });

  const { loanRequests: pendingLoans, loading: pendingLoading } = useLoanRequests({
    status: LOAN_REQUEST_STATUS.PENDING, sortBy: 'createdAt', sortOrder: 'asc', limit: 10
  });

  const allBorrowedItems = useMemo(() => 
    [...overdueLoans, ...borrowedLoans].sort((a, b) => {
      const dateA = a.expectedReturnDate?.toDate?.() || new Date(a.expectedReturnDate);
      const dateB = b.expectedReturnDate?.toDate?.() || new Date(b.expectedReturnDate);
      return dateA - dateB;
    }), [overdueLoans, borrowedLoans]
  );

  useEffect(() => {
    const loadEquipmentStats = async () => {
      try {
        setEquipmentLoading(true);
        const stats = await StatisticsService.getPublicStats();
        setEquipmentStats({ 
          total: stats?.totalEquipment || 0,
          available: stats?.availableEquipment || 0,
          borrowed: stats?.borrowedEquipment || 0
        });
      } catch (error) {
        console.error('Error loading equipment stats:', error);
      } finally {
        setEquipmentLoading(false);
      }
    };
    loadEquipmentStats();
  }, []);

  // Subscribe to alert statistics
  useEffect(() => {
    const alertsQuery = query(collection(db, 'adminAlerts'));
    
    const unsubscribe = onSnapshot(alertsQuery, (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const stats = {
        total: alerts.length,
        critical: alerts.filter(a => a.priority === 'critical' && !a.isResolved).length,
        high: alerts.filter(a => a.priority === 'high' && !a.isResolved).length,
        unresolved: alerts.filter(a => !a.isResolved).length
      };
      setAlertStats(stats);
      setAlertsLoading(false);
    }, (error) => {
      console.error('Error loading alert stats:', error);
      setAlertsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Chart Data with Pastel Colors
  const loanStatusChartData = useMemo(() => [
    { name: 'รอการอนุมัติ', value: loanStats.pending, fill: COLORS.yellow.fill },
    { name: 'กำลังยืม', value: loanStats.borrowed, fill: COLORS.blue.fill },
    { name: 'เกินกำหนด', value: loanStats.overdue, fill: COLORS.red.fill },
    { name: 'คืนแล้ว', value: loanStats.returned, fill: COLORS.green.fill },
    { name: 'ปฏิเสธ', value: loanStats.rejected, fill: COLORS.gray.fill }
  ].filter(item => item.value > 0), [loanStats]);

  const equipmentStatusChartData = useMemo(() => [
    { name: 'พร้อมใช้งาน', value: equipmentStats.available, fill: COLORS.green.fill },
    { name: 'ถูกยืม', value: equipmentStats.borrowed, fill: COLORS.blue.fill },
    { name: 'อื่นๆ', value: Math.max(0, equipmentStats.total - equipmentStats.available - equipmentStats.borrowed), fill: COLORS.gray.fill }
  ].filter(item => item.value > 0), [equipmentStats]);

  const barChartData = useMemo(() => [
    { name: 'รอการอนุมัติ', จำนวน: loanStats.pending, fill: COLORS.yellow.fill },
    { name: 'อนุมัติแล้ว', จำนวน: loanStats.approved, fill: COLORS.green.fill },
    { name: 'กำลังยืม', จำนวน: loanStats.borrowed, fill: COLORS.blue.fill },
    { name: 'เกินกำหนด', จำนวน: loanStats.overdue, fill: COLORS.red.fill },
    { name: 'คืนแล้ว', จำนวน: loanStats.returned, fill: COLORS.cyan.fill }
  ], [loanStats]);

  const formatDate = (date) => {
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
  };

  const getDaysUntilReturn = (expectedReturnDate) => {
    if (!expectedReturnDate) return null;
    const returnDate = expectedReturnDate.toDate ? expectedReturnDate.toDate() : new Date(expectedReturnDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    returnDate.setHours(0, 0, 0, 0);
    return Math.ceil((returnDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getReturnStyle = (days, status) => {
    if (status === LOAN_REQUEST_STATUS.OVERDUE || days < 0) return { bg: 'bg-rose-50', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-700' };
    if (days === 0) return { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700' };
    if (days <= 2) return { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' };
    return { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' };
  };

  const getReturnText = (days, status) => {
    if (status === LOAN_REQUEST_STATUS.OVERDUE || days < 0) return `เกินกำหนด ${Math.abs(days)} วัน`;
    if (days === 0) return 'ครบกำหนดวันนี้';
    if (days === 1) return 'ครบกำหนดพรุ่งนี้';
    return `อีก ${days} วัน`;
  };

  const isLoading = loanStatsLoading || equipmentLoading;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              แดชบอร์ดผู้ดูแลระบบ
            </h1>
            <p className="mt-1 text-gray-500">ภาพรวมระบบยืม-คืนอุปกรณ์</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 hidden sm:block">
              อัปเดต: {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button
              onClick={() => window.location.reload()}
              className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-white/80 rounded-xl transition-all duration-200 hover:rotate-180"
              title="รีเฟรช"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Intelligence Alert Summary Widget */}
        {!alertsLoading && alertStats.unresolved > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-2xl p-6 shadow-sm animate-fade-in">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-100 rounded-xl">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">การแจ้งเตือนที่ต้องดำเนินการ</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    มีการแจ้งเตือน {alertStats.unresolved} รายการที่รอการดำเนินการ
                    {alertStats.critical > 0 && ` (${alertStats.critical} รายการวิกฤต)`}
                  </p>
                  <div className="flex items-center gap-4">
                    {alertStats.critical > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                        <span className="text-sm font-medium text-red-700">{alertStats.critical} วิกฤต</span>
                      </div>
                    )}
                    {alertStats.high > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                        <span className="text-sm font-medium text-orange-700">{alertStats.high} สูง</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/admin/intelligence/alerts')}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium text-sm flex items-center gap-2"
              >
                ดูการแจ้งเตือน
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="คำขอรอการอนุมัติ"
            value={isLoading ? '...' : loanStats.pending}
            color="yellow"
            delay={0}
            onClick={() => navigate('/admin/loan-requests')}
            icon={<svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard
            title="กำลังยืมอยู่"
            value={isLoading ? '...' : loanStats.borrowed}
            color="blue"
            delay={100}
            onClick={() => navigate('/admin/loan-requests')}
            icon={<svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>}
          />
          <StatCard
            title="เกินกำหนดคืน"
            value={isLoading ? '...' : loanStats.overdue}
            color="red"
            delay={200}
            onClick={() => navigate('/admin/loan-requests')}
            icon={<svg className="w-7 h-7 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
          />
          <StatCard
            title="อุปกรณ์ทั้งหมด"
            value={isLoading ? '...' : equipmentStats.total}
            color="purple"
            delay={300}
            onClick={() => navigate('/admin/equipment')}
            icon={<svg className="w-7 h-7 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Loan Status Pie Chart */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in" style={{ animationDelay: '400ms' }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
              สถานะคำขอยืม
            </h3>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            ) : loanStatusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={loanStatusChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {loanStatusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke="white" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">ไม่มีข้อมูล</div>
            )}
          </div>

          {/* Equipment Status Pie Chart */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in" style={{ animationDelay: '500ms' }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              สถานะอุปกรณ์
            </h3>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
              </div>
            ) : equipmentStatusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={equipmentStatusChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {equipmentStatusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke="white" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">ไม่มีข้อมูล</div>
            )}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in" style={{ animationDelay: '600ms' }}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-violet-400 rounded-full animate-pulse"></span>
            ภาพรวมคำขอยืมตามสถานะ
          </h3>
          {isLoading ? (
            <div className="h-72 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="จำนวน" radius={[8, 8, 0, 0]}>
                  {barChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in" style={{ animationDelay: '700ms' }}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">การดำเนินการด่วน</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionButton title="จัดการคำขอยืม" description="อนุมัติ/ปฏิเสธคำขอ" color="blue" onClick={() => navigate('/admin/loan-requests')}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>} />
            <QuickActionButton title="จัดการอุปกรณ์" description="เพิ่ม/แก้ไขอุปกรณ์" color="purple" onClick={() => navigate('/admin/equipment')}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} />
            <QuickActionButton title="จัดการผู้ใช้" description="อนุมัติ/จัดการบัญชี" color="green" onClick={() => navigate('/admin/users')}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} />
            <QuickActionButton title="ตั้งค่าระบบ" description="กำหนดค่าต่างๆ" color="gray" onClick={() => navigate('/admin/settings')}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
          </div>
        </div>

        {/* Intelligence Quick Links */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-sm border border-indigo-100 p-6 animate-fade-in" style={{ animationDelay: '750ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Intelligence Assistant</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">เครื่องมือวิเคราะห์และจัดการข้อมูลขั้นสูง</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <button
              onClick={() => navigate('/admin/intelligence/alerts')}
              className="flex items-center gap-3 p-3 bg-white rounded-xl border border-indigo-100 hover:border-indigo-300 hover:shadow-md transition-all text-left group"
            >
              <div className="p-2 bg-red-100 rounded-lg group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">การแจ้งเตือน</p>
                <p className="text-xs text-gray-500">ปัญหาที่ต้องดำเนินการ</p>
              </div>
              {alertStats.unresolved > 0 && (
                <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                  {alertStats.unresolved}
                </span>
              )}
            </button>
            
            <button
              onClick={() => navigate('/admin/intelligence/usage-analytics')}
              className="flex items-center gap-3 p-3 bg-white rounded-xl border border-indigo-100 hover:border-indigo-300 hover:shadow-md transition-all text-left group"
            >
              <div className="p-2 bg-indigo-100 rounded-lg group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">วิเคราะห์การใช้งาน</p>
                <p className="text-xs text-gray-500">สถิติอุปกรณ์</p>
              </div>
            </button>
            
            <button
              onClick={() => navigate('/admin/intelligence/user-reliability')}
              className="flex items-center gap-3 p-3 bg-white rounded-xl border border-indigo-100 hover:border-indigo-300 hover:shadow-md transition-all text-left group"
            >
              <div className="p-2 bg-teal-100 rounded-lg group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">ความน่าเชื่อถือ</p>
                <p className="text-xs text-gray-500">พฤติกรรมผู้ใช้</p>
              </div>
            </button>
            
            <button
              onClick={() => navigate('/admin/intelligence/data-management')}
              className="flex items-center gap-3 p-3 bg-white rounded-xl border border-indigo-100 hover:border-indigo-300 hover:shadow-md transition-all text-left group"
            >
              <div className="p-2 bg-slate-100 rounded-lg group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">จัดการข้อมูล</p>
                <p className="text-xs text-gray-500">Export/Import</p>
              </div>
            </button>
            
            <button
              onClick={() => navigate('/admin/intelligence/reports')}
              className="flex items-center gap-3 p-3 bg-white rounded-xl border border-indigo-100 hover:border-indigo-300 hover:shadow-md transition-all text-left group"
            >
              <div className="p-2 bg-emerald-100 rounded-lg group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">รายงาน</p>
                <p className="text-xs text-gray-500">ประวัติรายงาน</p>
              </div>
            </button>
          </div>
        </div>

        {/* Two Column: Pending & Borrowed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Requests */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-amber-100 p-6 animate-fade-in" style={{ animationDelay: '800ms' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
                คำขอรอการอนุมัติ
                {pendingLoans.length > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">{pendingLoans.length}</span>
                )}
              </h3>
              <button onClick={() => navigate('/admin/loan-requests')} className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 group">
                ดูทั้งหมด
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            {pendingLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                    <div className="flex-1"><div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div><div className="h-3 bg-gray-200 rounded w-1/2"></div></div>
                  </div>
                ))}
              </div>
            ) : pendingLoans.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 animate-float">
                  <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-gray-500">ไม่มีคำขอรอการอนุมัติ</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {pendingLoans.slice(0, 5).map((loan, idx) => (
                  <div key={loan.id} onClick={() => navigate('/admin/loan-requests')}
                    className="flex items-center gap-4 p-3 bg-amber-50 rounded-xl border border-amber-100 hover:bg-amber-100 cursor-pointer transition-all duration-200 hover:scale-[1.01]"
                    style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                      {loan.equipment?.imageURL || loan.equipmentSnapshot?.imageUrl ? (
                        <img src={loan.equipment?.imageURL || loan.equipmentSnapshot?.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{loan.equipment?.name || loan.equipmentSnapshot?.name || loan._equipmentName || 'ไม่ทราบชื่อ'}</p>
                      <p className="text-xs text-gray-600">ผู้ขอ: {loan.user?.displayName || loan.userSnapshot?.displayName || loan._userName || 'ไม่ทราบชื่อ'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">ต้องการยืม</p>
                      <p className="text-sm font-medium text-gray-700">{formatDate(loan.borrowDate)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Borrowed Items */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-blue-100 p-6 animate-fade-in" style={{ animationDelay: '900ms' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                อุปกรณ์ที่ถูกยืม
                {allBorrowedItems.length > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">{allBorrowedItems.length}</span>
                )}
              </h3>
              <button onClick={() => navigate('/admin/loan-requests')} className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 group">
                จัดการ
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            {borrowedLoading || overdueLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                    <div className="flex-1"><div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div><div className="h-3 bg-gray-200 rounded w-1/2"></div></div>
                  </div>
                ))}
              </div>
            ) : allBorrowedItems.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 animate-float">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <p className="text-gray-500">ไม่มีอุปกรณ์ที่ถูกยืม</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {allBorrowedItems.slice(0, 8).map((loan, idx) => {
                  const days = getDaysUntilReturn(loan.expectedReturnDate);
                  const style = getReturnStyle(days, loan.status);
                  return (
                    <div key={loan.id} onClick={() => navigate('/admin/loan-requests')}
                      className={`flex items-center gap-4 p-3 rounded-xl border cursor-pointer transition-all duration-200 hover:scale-[1.01] ${style.bg} ${style.border}`}
                      style={{ animationDelay: `${idx * 100}ms` }}>
                      <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                        {loan.equipment?.imageURL || loan.equipmentSnapshot?.imageUrl ? (
                          <img src={loan.equipment?.imageURL || loan.equipmentSnapshot?.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{loan.equipment?.name || loan.equipmentSnapshot?.name || loan._equipmentName || 'ไม่ทราบชื่อ'}</p>
                        <p className="text-xs text-gray-600">ผู้ยืม: {loan.user?.displayName || loan.userSnapshot?.displayName || loan._userName || 'ไม่ทราบชื่อ'}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-500 mb-1">กำหนดคืน {formatDate(loan.expectedReturnDate)}</p>
                        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${style.badge}`}>
                          {getReturnText(days, loan.status)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
