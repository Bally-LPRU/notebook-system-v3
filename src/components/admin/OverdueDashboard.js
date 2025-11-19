/**
 * Overdue Dashboard Component
 * 
 * Admin dashboard for monitoring and managing overdue loan requests.
 * Displays statistics, lists, and quick actions for overdue items.
 */

import React, { useState, useEffect } from 'react';
import { 
  ExclamationTriangleIcon, 
  ClockIcon,
  ChartBarIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import OverdueManagementService from '../../services/overdueManagementService';
import OverdueIndicator from '../loan/OverdueIndicator';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';

const OverdueDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadStatistics();
  }, [refreshKey]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const stats = await OverdueManagementService.getOverdueStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error('Error loading overdue statistics:', err);
      setError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={handleRefresh}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          ลองใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  if (!statistics) {
    return (
      <EmptyState
        icon={ChartBarIcon}
        title="ไม่มีข้อมูล"
        description="ไม่พบข้อมูลสถิติการยืมที่เกินกำหนด"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          ภาพรวมการยืมที่เกินกำหนด
        </h2>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          รีเฟรช
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Overdue */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">เกินกำหนดทั้งหมด</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {statistics.totalOverdue}
              </p>
            </div>
            <ExclamationTriangleIcon className="w-12 h-12 text-red-500 opacity-50" />
          </div>
        </div>

        {/* Due Soon */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ใกล้ครบกำหนด</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {statistics.totalDueSoon}
              </p>
            </div>
            <ClockIcon className="w-12 h-12 text-yellow-500 opacity-50" />
          </div>
        </div>

        {/* Average Days Overdue */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">เฉลี่ยเกินกำหนด</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {statistics.averageDaysOverdue}
                <span className="text-lg ml-1">วัน</span>
              </p>
            </div>
            <ChartBarIcon className="w-12 h-12 text-orange-500 opacity-50" />
          </div>
        </div>

        {/* Max Days Overdue */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">เกินกำหนดสูงสุด</p>
              <p className="text-3xl font-bold text-red-700 mt-2">
                {statistics.maxDaysOverdue}
                <span className="text-lg ml-1">วัน</span>
              </p>
            </div>
            <ExclamationTriangleIcon className="w-12 h-12 text-red-700 opacity-50" />
          </div>
        </div>
      </div>

      {/* Overdue Loans List */}
      {statistics.totalOverdue > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              รายการยืมที่เกินกำหนด (5 อันดับแรก)
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {statistics.overdueLoanRequests.map((loan) => (
              <div key={loan.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <UserIcon className="w-5 h-5 text-gray-400" />
                      <p className="text-sm font-medium text-gray-900">
                        {loan.user?.displayName || 'ไม่ระบุชื่อ'}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {loan.equipment?.name || 'ไม่ระบุอุปกรณ์'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      กำหนดคืน: {OverdueManagementService.formatOverdueDate(loan.expectedReturnDate)}
                    </p>
                  </div>
                  <div className="ml-4">
                    <OverdueIndicator 
                      loanRequest={loan} 
                      variant="badge"
                      showIcon={true}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {statistics.totalOverdue > 5 && (
            <div className="px-6 py-3 bg-gray-50 text-center">
              <a
                href="/admin/loan-requests?status=overdue"
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                ดูทั้งหมด ({statistics.totalOverdue} รายการ) →
              </a>
            </div>
          )}
        </div>
      )}

      {/* Due Soon List */}
      {statistics.totalDueSoon > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              รายการใกล้ครบกำหนด (5 อันดับแรก)
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {statistics.dueSoonLoanRequests.map((loan) => (
              <div key={loan.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <UserIcon className="w-5 h-5 text-gray-400" />
                      <p className="text-sm font-medium text-gray-900">
                        {loan.user?.displayName || 'ไม่ระบุชื่อ'}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {loan.equipment?.name || 'ไม่ระบุอุปกรณ์'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      กำหนดคืน: {OverdueManagementService.formatOverdueDate(loan.expectedReturnDate)}
                    </p>
                  </div>
                  <div className="ml-4">
                    <OverdueIndicator 
                      loanRequest={loan} 
                      variant="badge"
                      showIcon={true}
                      showDueSoon={true}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {statistics.totalDueSoon > 5 && (
            <div className="px-6 py-3 bg-gray-50 text-center">
              <a
                href="/admin/loan-requests?status=borrowed"
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                ดูทั้งหมด ({statistics.totalDueSoon} รายการ) →
              </a>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {statistics.totalOverdue === 0 && statistics.totalDueSoon === 0 && (
        <EmptyState
          icon={ChartBarIcon}
          title="ไม่มีรายการที่ต้องติดตาม"
          description="ไม่มีรายการยืมที่เกินกำหนดหรือใกล้ครบกำหนดในขณะนี้"
        />
      )}
    </div>
  );
};

export default OverdueDashboard;
