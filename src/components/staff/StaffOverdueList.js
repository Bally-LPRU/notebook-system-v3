/**
 * StaffOverdueList Component
 * Page for Staff to manage overdue loans - view overdue items and send notifications
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLoanRequests } from '../../hooks/useLoanRequests';
import { useStaffLoanManagement } from '../../hooks/useStaffLoanManagement';
import { LOAN_REQUEST_STATUS } from '../../types/loanRequest';
import OverdueManagementService from '../../services/overdueManagementService';
import { Layout } from '../layout';
import ReturnProcessModal from './ReturnProcessModal';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';

const StaffOverdueList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('daysOverdue'); // 'daysOverdue' or 'expectedReturnDate'
  
  // Modal state
  const [returnModal, setReturnModal] = useState({ isOpen: false, loan: null });
  const [notificationLoading, setNotificationLoading] = useState({});
  const [notificationSuccess, setNotificationSuccess] = useState({});

  // Use the Staff loan management hook
  const { 
    processReturn,
    sendOverdueNotification,
    loading: processingReturn
  } = useStaffLoanManagement();

  const {
    loanRequests,
    loading,
    error,
    pagination,
    updateFilters,
    loadMore,
    refresh
  } = useLoanRequests({
    sortBy: 'expectedReturnDate',
    sortOrder: 'asc',
    limit: 50
  });

  // Filter for overdue loans only
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      updateFilters({ search: searchTerm });
    }, 300);
    return () => clearTimeout(delayedSearch);
  }, [searchTerm, updateFilters]);

  // Filter and sort overdue loans
  const overdueLoans = useMemo(() => {
    // Filter only overdue loans (status OVERDUE or BORROWED with past due date)
    let filtered = loanRequests.filter(loan => {
      const isOverdueStatus = loan.status === LOAN_REQUEST_STATUS.OVERDUE;
      const isBorrowedAndOverdue = loan.status === LOAN_REQUEST_STATUS.BORROWED && 
        OverdueManagementService.isOverdue(loan);
      return isOverdueStatus || isBorrowedAndOverdue;
    });

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(loan => {
        const userName = loan.userSnapshot?.displayName || loan.userName || '';
        const equipmentName = loan.equipmentSnapshot?.name || loan.equipmentName || '';
        const equipmentNumber = loan.equipmentSnapshot?.equipmentNumber || loan.equipmentNumber || '';
        const userEmail = loan.userSnapshot?.email || loan.userEmail || '';
        const userPhone = loan.userSnapshot?.phone || loan.userPhone || '';
        return (
          userName.toLowerCase().includes(search) ||
          equipmentName.toLowerCase().includes(search) ||
          equipmentNumber.toLowerCase().includes(search) ||
          userEmail.toLowerCase().includes(search) ||
          userPhone.includes(search)
        );
      });
    }

    // Sort by days overdue (most overdue first) or by expected return date
    filtered.sort((a, b) => {
      const daysA = OverdueManagementService.calculateDaysOverdue(a.expectedReturnDate);
      const daysB = OverdueManagementService.calculateDaysOverdue(b.expectedReturnDate);
      
      if (sortBy === 'daysOverdue') {
        return daysB - daysA; // Most overdue first
      } else {
        return daysA - daysB; // Earliest due date first
      }
    });

    return filtered;
  }, [loanRequests, searchTerm, sortBy]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalOverdue = overdueLoans.length;
    let totalDaysOverdue = 0;
    let maxDaysOverdue = 0;
    let criticalCount = 0; // More than 7 days overdue

    overdueLoans.forEach(loan => {
      const days = OverdueManagementService.calculateDaysOverdue(loan.expectedReturnDate);
      totalDaysOverdue += days;
      maxDaysOverdue = Math.max(maxDaysOverdue, days);
      if (days > 7) criticalCount++;
    });

    return {
      totalOverdue,
      averageDaysOverdue: totalOverdue > 0 ? Math.round(totalDaysOverdue / totalOverdue) : 0,
      maxDaysOverdue,
      criticalCount
    };
  }, [overdueLoans]);

  // Handle send notification
  const handleSendNotification = useCallback(async (loan) => {
    const loanId = loan.id;
    setNotificationLoading(prev => ({ ...prev, [loanId]: true }));
    
    try {
      const result = await sendOverdueNotification(loanId);
      
      if (result?.success) {
        setNotificationSuccess(prev => ({ ...prev, [loanId]: true }));
        // Clear success message after 3 seconds
        setTimeout(() => {
          setNotificationSuccess(prev => ({ ...prev, [loanId]: false }));
        }, 3000);
      } else {
        alert('เกิดข้อผิดพลาด: ' + (result?.error || 'ไม่สามารถส่งการแจ้งเตือนได้'));
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setNotificationLoading(prev => ({ ...prev, [loanId]: false }));
    }
  }, [sendOverdueNotification]);

  // Handle return action
  const handleReturn = (loan) => {
    setReturnModal({ isOpen: true, loan });
  };

  const handleConfirmReturn = async (returnData) => {
    if (!returnModal.loan) return;
    
    try {
      const result = await processReturn(returnModal.loan.id, returnData);
      
      if (result.success) {
        refresh();
        setReturnModal({ isOpen: false, loan: null });
      } else {
        alert('เกิดข้อผิดพลาด: ' + result.error);
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  // Handle load more
  const handleLoadMore = () => {
    if (!loading && pagination.hasNextPage) {
      loadMore();
    }
  };

  // Helper functions
  const formatDate = (date) => {
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysOverdueLabel = (loan) => {
    const days = OverdueManagementService.calculateDaysOverdue(loan.expectedReturnDate);
    if (days === 1) return 'ค้างคืน 1 วัน';
    return `ค้างคืน ${days} วัน`;
  };

  const getOverdueSeverity = (loan) => {
    const days = OverdueManagementService.calculateDaysOverdue(loan.expectedReturnDate);
    if (days > 7) return 'critical';
    if (days > 3) return 'warning';
    return 'normal';
  };

  const getSeverityStyles = (severity) => {
    switch (severity) {
      case 'critical':
        return {
          badge: 'bg-red-100 text-red-800 border-red-200',
          card: 'border-red-200 bg-red-50/50',
          icon: 'text-red-600'
        };
      case 'warning':
        return {
          badge: 'bg-orange-100 text-orange-800 border-orange-200',
          card: 'border-orange-200 bg-orange-50/30',
          icon: 'text-orange-600'
        };
      default:
        return {
          badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          card: 'border-yellow-200 bg-yellow-50/30',
          icon: 'text-yellow-600'
        };
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-rose-600 via-orange-600 to-amber-600 bg-clip-text text-transparent">
              รายการค้างคืน
            </h1>
            <p className="text-sm text-gray-600 hidden sm:block">
              จัดการและติดตามอุปกรณ์ที่เกินกำหนดคืน
            </p>
          </div>
          <button 
            onClick={refresh} 
            disabled={loading} 
            className="self-end sm:self-auto inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all duration-200 hover:shadow-sm"
          >
            <svg className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            รีเฟรช
          </button>
        </div>

        {/* Statistics Cards */}
        {overdueLoans.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-100 rounded-lg">
                  <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOverdue}</p>
                  <p className="text-xs text-gray-500">รายการค้างคืน</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageDaysOverdue}</p>
                  <p className="text-xs text-gray-500">วันเฉลี่ย</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.maxDaysOverdue}</p>
                  <p className="text-xs text-gray-500">วันสูงสุด</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.criticalCount}</p>
                  <p className="text-xs text-gray-500">วิกฤต (&gt;7 วัน)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Sort */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100">
          <div className="p-4 flex flex-col sm:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input 
                type="text" 
                placeholder="ค้นหาตามชื่อผู้ยืม, อุปกรณ์, เบอร์โทร..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="block w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all" 
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 whitespace-nowrap">เรียงตาม:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              >
                <option value="daysOverdue">จำนวนวันค้าง (มาก-น้อย)</option>
                <option value="expectedReturnDate">วันกำหนดคืน (เก่า-ใหม่)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">เกิดข้อผิดพลาด</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                <button onClick={refresh} className="mt-2 text-sm font-medium text-red-800 hover:text-red-600">
                  ลองใหม่อีกครั้ง
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && overdueLoans.length === 0 && (
          <div className="flex justify-center items-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Empty State */}
        {!loading && overdueLoans.length === 0 && !error && (
          <EmptyState
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="ไม่มีรายการค้างคืน"
            description={searchTerm ? "ไม่พบรายการที่ตรงกับการค้นหา" : "ยินดีด้วย! ไม่มีอุปกรณ์ที่เกินกำหนดคืนในขณะนี้"}
            action={searchTerm ? (
              <button 
                onClick={() => setSearchTerm('')} 
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl text-rose-700 bg-rose-100 hover:bg-rose-200 transition-colors"
              >
                ล้างการค้นหา
              </button>
            ) : null}
          />
        )}

        {/* Overdue Loan Cards */}
        {!loading && overdueLoans.length > 0 && (
          <div className="space-y-4">
            {overdueLoans.map((loan) => {
              const severity = getOverdueSeverity(loan);
              const styles = getSeverityStyles(severity);
              const daysOverdue = OverdueManagementService.calculateDaysOverdue(loan.expectedReturnDate);
              const equipmentName = loan.equipmentSnapshot?.name || loan.equipmentName || 'ไม่ทราบชื่ออุปกรณ์';
              const userName = loan.userSnapshot?.displayName || loan.userName || 'ไม่ทราบชื่อ';
              const userEmail = loan.userSnapshot?.email || loan.userEmail || '';
              const userPhone = loan.userSnapshot?.phone || loan.userPhone || '';
              const equipmentImage = loan.equipmentSnapshot?.imageUrl || loan.equipmentSnapshot?.imageURL;
              const isNotifying = notificationLoading[loan.id];
              const notifySuccess = notificationSuccess[loan.id];

              return (
                <div 
                  key={loan.id} 
                  className={`bg-white rounded-2xl shadow-sm border transition-all duration-200 hover:shadow-md ${styles.card}`}
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Equipment Image */}
                      <div className="flex-shrink-0">
                        {equipmentImage ? (
                          <img
                            src={equipmentImage}
                            alt={equipmentName}
                            className="w-20 h-20 object-cover rounded-xl"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Loan Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-lg font-semibold text-gray-900 truncate">
                                {equipmentName}
                              </h3>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles.badge}`}>
                                <svg className={`w-3 h-3 mr-1 ${styles.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {getDaysOverdueLabel(loan)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              ผู้ยืม: <span className="font-medium">{userName}</span>
                            </p>
                          </div>
                        </div>

                        {/* Contact Info - Requirement 6.2 */}
                        <div className="mt-3 flex flex-wrap gap-4 text-sm">
                          {userEmail && (
                            <a 
                              href={`mailto:${userEmail}`}
                              className="flex items-center gap-1 text-gray-600 hover:text-indigo-600 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span>{userEmail}</span>
                            </a>
                          )}
                          {userPhone && (
                            <a 
                              href={`tel:${userPhone}`}
                              className="flex items-center gap-1 text-gray-600 hover:text-indigo-600 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <span>{userPhone}</span>
                            </a>
                          )}
                        </div>

                        {/* Dates */}
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-gray-500">วันที่ยืม</p>
                            <p className="font-medium text-gray-900">{formatDate(loan.borrowDate)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">กำหนดคืน</p>
                            <p className="font-medium text-rose-600">{formatDate(loan.expectedReturnDate)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">เกินกำหนด</p>
                            <p className={`font-bold ${severity === 'critical' ? 'text-red-700' : severity === 'warning' ? 'text-orange-600' : 'text-yellow-600'}`}>
                              {daysOverdue} วัน
                            </p>
                          </div>
                        </div>

                        {/* Purpose */}
                        {loan.purpose && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-500">วัตถุประสงค์</p>
                            <p className="text-sm text-gray-700 line-clamp-2">{loan.purpose}</p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex sm:flex-col gap-2 sm:ml-4">
                        {/* Send Notification Button - Requirement 6.3 */}
                        <button
                          onClick={() => handleSendNotification(loan)}
                          disabled={isNotifying}
                          className={`flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow-md ${
                            notifySuccess 
                              ? 'bg-green-600 text-white' 
                              : 'bg-amber-500 text-white hover:bg-amber-600'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {isNotifying ? (
                            <>
                              <svg className="animate-spin w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              กำลังส่ง...
                            </>
                          ) : notifySuccess ? (
                            <>
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              ส่งแล้ว
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                              </svg>
                              ส่งแจ้งเตือน
                            </>
                          )}
                        </button>
                        
                        {/* Return Button */}
                        <button
                          onClick={() => handleReturn(loan)}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm font-medium transition-colors shadow-sm hover:shadow-md"
                        >
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          รับคืน
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Load More Button */}
            {pagination.hasNextPage && (
              <div className="text-center pt-4">
                <button 
                  onClick={handleLoadMore} 
                  disabled={loading} 
                  className="inline-flex items-center px-6 py-3 border border-gray-200 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      กำลังโหลด...
                    </>
                  ) : (
                    <>
                      โหลดเพิ่มเติม
                      <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results Count */}
        {overdueLoans.length > 0 && (
          <div className="text-center text-sm text-gray-500 pb-4">
            แสดง {overdueLoans.length} รายการค้างคืน{pagination.hasNextPage && ' (มีรายการเพิ่มเติม)'}
          </div>
        )}

        {/* Note: Staff cannot edit penalty settings - Requirement 6.5 */}
        {/* Penalty settings are only visible/editable by Admin */}

        {/* Return Process Modal */}
        <ReturnProcessModal
          isOpen={returnModal.isOpen}
          loan={returnModal.loan}
          onConfirm={handleConfirmReturn}
          onClose={() => setReturnModal({ isOpen: false, loan: null })}
          loading={processingReturn}
        />
      </div>
    </Layout>
  );
};

export default StaffOverdueList;
