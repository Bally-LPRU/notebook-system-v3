import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import UserService from '../../services/userService';
import UserApprovalCard from './UserApprovalCard';
import { Layout } from '../layout';

const UserApprovalList = () => {
  const { user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    suspended: 0
  });

  useEffect(() => {
    loadPendingUsers();
    loadUserStats();
  }, []);

  const loadPendingUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const users = await UserService.getPendingUsers();
      setPendingUsers(users);
    } catch (error) {
      console.error('Error loading pending users:', error);
      setError('ไม่สามารถโหลดรายการผู้ใช้ที่รอการอนุมัติได้');
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const userStats = await UserService.getUserStats();
      setStats(userStats);
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      await UserService.approveUser(userId, user.uid);
      
      // Remove the approved user from the pending list
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        pending: prev.pending - 1,
        approved: prev.approved + 1
      }));
      
      // Show success message (you can implement a toast notification here)
      console.log('User approved successfully');
    } catch (error) {
      console.error('Error approving user:', error);
      setError('ไม่สามารถอนุมัติผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleRejectUser = async (userId, reason) => {
    try {
      await UserService.rejectUser(userId, user.uid, reason);
      
      // Remove the rejected user from the pending list
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        pending: prev.pending - 1
      }));
      
      // Show success message
      console.log('User rejected successfully');
    } catch (error) {
      console.error('Error rejecting user:', error);
      setError('ไม่สามารถปฏิเสธผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">กำลังโหลดรายการผู้ใช้...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              จัดการผู้ใช้งาน
            </h1>
            <p className="text-gray-600">
              อนุมัติหรือปฏิเสธการสมัครสมาชิกใหม่
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">ผู้ใช้ทั้งหมด</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">รอการอนุมัติ</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">อนุมัติแล้ว</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.approved}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">ถูกระงับ</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.suspended}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => setError(null)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pending Users List */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">
                  ผู้ใช้ที่รอการอนุมัติ ({pendingUsers.length})
                </h2>
                <button
                  onClick={loadPendingUsers}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  รีเฟรช
                </button>
              </div>
            </div>

            <div className="p-6">
              {pendingUsers.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่มีผู้ใช้ที่รอการอนุมัติ</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    ผู้ใช้ใหม่ทั้งหมดได้รับการอนุมัติแล้ว
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {pendingUsers.map((pendingUser) => (
                    <UserApprovalCard
                      key={pendingUser.id}
                      user={pendingUser}
                      onApprove={handleApproveUser}
                      onReject={handleRejectUser}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
      </div>
    </Layout>
  );
};

export default UserApprovalList;