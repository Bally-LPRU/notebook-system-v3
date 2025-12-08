import { useState } from 'react';
import UserEditModal from './UserEditModal';
import { USER_TYPE_NAMES } from '../../types/settings';

const UserManagementTable = ({ users, onUserUpdate, onUserDelete, onLoadMore, hasMore, loading }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser || !onUserDelete) return;
    setDeleteLoading(true);
    try {
      await onUserDelete(selectedUser.id);
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
    setShowEditModal(false);
    setShowViewModal(false);
    setShowDeleteModal(false);
  };

  const handleSaveUser = async (updates) => {
    await onUserUpdate(selectedUser.id, updates);
    handleCloseModal();
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      suspended: 'bg-gray-100 text-gray-800',
      incomplete: 'bg-blue-100 text-blue-800'
    };

    const labels = {
      pending: 'รอการอนุมัติ',
      approved: 'อนุมัติแล้ว',
      rejected: 'ปฏิเสธ',
      suspended: 'ระงับ',
      incomplete: 'ไม่สมบูรณ์'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'bg-purple-100 text-purple-800',
      user: 'bg-blue-100 text-blue-800'
    };

    const labels = {
      admin: 'ผู้ดูแลระบบ',
      user: 'ผู้ใช้ทั่วไป'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[role] || 'bg-gray-100 text-gray-800'}`}>
        {labels[role] || role}
      </span>
    );
  };

  /**
   * Get user type badge with Thai label
   * @param {string} userType - User type (teacher/staff/student)
   * @returns {JSX.Element} Badge element
   */
  const getUserTypeBadge = (userType) => {
    const badges = {
      teacher: 'bg-indigo-100 text-indigo-800',
      staff: 'bg-teal-100 text-teal-800',
      student: 'bg-orange-100 text-orange-800'
    };

    const label = USER_TYPE_NAMES[userType] || 'ไม่ระบุ';

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[userType] || 'bg-gray-100 text-gray-800'}`}>
        {label}
      </span>
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่พบผู้ใช้</h3>
        <p className="mt-1 text-sm text-gray-500">ไม่มีผู้ใช้ในหมวดหมู่นี้</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ผู้ใช้
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                แผนก
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ประเภทผู้ใช้
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                บทบาท
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                สถานะ
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                วันที่สมัคร
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                การจัดการ
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {user.photoURL ? (
                        <img className="h-10 w-10 rounded-full" src={user.photoURL} alt="" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 font-medium text-sm">
                            {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'ไม่ระบุชื่อ'}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {typeof user.department === 'object' && user.department !== null
                      ? user.department.label || user.department.value || '-'
                      : user.department || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getUserTypeBadge(user.userType)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getRoleBadge(user.role)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(user.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleViewUser(user)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      ดู
                    </button>
                    <button
                      onClick={() => handleEditUser(user)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      แก้ไข
                    </button>
                    {onUserDelete && (
                      <button
                        onClick={() => handleDeleteClick(user)}
                        className="text-red-600 hover:text-red-900"
                      >
                        ลบ
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="px-6 py-4 border-t border-gray-200 text-center">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                กำลังโหลด...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                โหลดเพิ่มเติม
              </>
            )}
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <UserEditModal
          user={selectedUser}
          onClose={handleCloseModal}
          onSave={handleSaveUser}
        />
      )}

      {/* View User Detail Modal */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={handleCloseModal} />
            <div className="relative bg-white rounded-lg max-w-lg w-full shadow-xl">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">รายละเอียดผู้ใช้</h3>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                {/* User Avatar & Name */}
                <div className="flex items-center mb-6">
                  {selectedUser.photoURL ? (
                    <img src={selectedUser.photoURL} alt="" className="h-16 w-16 rounded-full" />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 font-medium text-xl">
                        {selectedUser.displayName?.charAt(0) || selectedUser.email?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                  <div className="ml-4">
                    <h4 className="text-xl font-semibold text-gray-900">
                      {selectedUser.displayName || `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || 'ไม่ระบุชื่อ'}
                    </h4>
                    <p className="text-gray-500">{selectedUser.email}</p>
                  </div>
                </div>

                {/* User Details */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">ชื่อ</p>
                      <p className="font-medium">{selectedUser.firstName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">นามสกุล</p>
                      <p className="font-medium">{selectedUser.lastName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">แผนก</p>
                      <p className="font-medium">
                        {typeof selectedUser.department === 'object' && selectedUser.department !== null
                          ? selectedUser.department.label || selectedUser.department.value || '-'
                          : selectedUser.department || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">ประเภทผู้ใช้</p>
                      {getUserTypeBadge(selectedUser.userType)}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">บทบาท</p>
                      <p className="font-medium">{selectedUser.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้ทั่วไป'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">สถานะ</p>
                      {getStatusBadge(selectedUser.status)}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">วันที่สมัคร</p>
                      <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
                    </div>
                  </div>

                  {selectedUser.phone && (
                    <div>
                      <p className="text-sm text-gray-500">เบอร์โทรศัพท์</p>
                      <p className="font-medium">{selectedUser.phone}</p>
                    </div>
                  )}

                  {selectedUser.approvedAt && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500">อนุมัติเมื่อ</p>
                      <p className="font-medium">{formatDate(selectedUser.approvedAt)}</p>
                    </div>
                  )}

                  {selectedUser.rejectionReason && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500">เหตุผลที่ปฏิเสธ</p>
                      <p className="font-medium text-red-600">{selectedUser.rejectionReason}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    ปิด
                  </button>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setShowEditModal(true);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    แก้ไข
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => !deleteLoading && handleCloseModal()} />
            <div className="relative bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">ยืนยันการลบผู้ใช้</h3>
              </div>
              
              <p className="text-gray-600 mb-2">
                คุณต้องการลบผู้ใช้ <span className="font-medium">"{selectedUser.displayName || selectedUser.email}"</span> ใช่หรือไม่?
              </p>
              <p className="text-sm text-gray-500 mb-4">
                การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={deleteLoading}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleteLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {deleteLoading && (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  ลบผู้ใช้
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserManagementTable;
