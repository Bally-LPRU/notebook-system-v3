import React, { useState } from 'react';

const UserApprovalCard = ({ user, onApprove, onReject }) => {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove(user.id);
    } catch (error) {
      console.error('Error approving user:', error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await onReject(user.id, rejectionReason);
      setShowRejectModal(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting user:', error);
    } finally {
      setIsRejecting(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'ไม่ระบุ';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'ไม่ระบุ';
    }
  };

  const getUserTypeLabel = (userType) => {
    const types = {
      student: 'นักศึกษา',
      teacher: 'อาจารย์',
      staff: 'เจ้าหน้าที่'
    };
    return types[userType] || userType;
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <img
              className="h-16 w-16 rounded-full"
              src={user.photoURL || '/default-avatar.png'}
              alt={user.displayName}
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user.displayName
                }
              </h3>
              <p className="text-sm text-gray-600">{user.email}</p>
              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                <span>📱 {user.phoneNumber || 'ไม่ระบุ'}</span>
                <span>🏢 {user.department || 'ไม่ระบุ'}</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {getUserTypeLabel(user.userType)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleApprove}
              disabled={isApproving || isRejecting}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isApproving ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  กำลังอนุมัติ...
                </div>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  อนุมัติ
                </>
              )}
            </button>
            
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={isApproving || isRejecting}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              ปฏิเสธ
            </button>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">วันที่สมัคร:</span>
              <span className="ml-2 text-gray-600">{formatDate(user.createdAt)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">สถานะ:</span>
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                รอการอนุมัติ
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  ปฏิเสธการสมัครสมาชิก
                </h3>
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  คุณกำลังจะปฏิเสธการสมัครสมาชิกของ:
                </p>
                <p className="font-medium text-gray-900">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.displayName
                  } ({user.email})
                </p>
              </div>
              
              <div className="mb-4">
                <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-2">
                  เหตุผลในการปฏิเสธ (ไม่บังคับ):
                </label>
                <textarea
                  id="rejectionReason"
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="ระบุเหตุผล..."
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  disabled={isRejecting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleReject}
                  disabled={isRejecting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {isRejecting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      กำลังปฏิเสธ...
                    </div>
                  ) : (
                    'ยืนยันปฏิเสธ'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserApprovalCard;