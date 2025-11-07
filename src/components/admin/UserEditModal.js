import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import UserService from '../../services/userService';

const UserEditModal = ({ user, onClose, onSave }) => {
  const { user: currentUser } = useAuth();
  const [formData, setFormData] = useState({
    displayName: '',
    firstName: '',
    lastName: '',
    department: '',
    role: 'user',
    status: 'pending'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        department: user.department?.label || user.department || '',
        role: user.role || 'user',
        status: user.status || 'pending'
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStatusChange = (newStatus) => {
    setFormData(prev => ({
      ...prev,
      status: newStatus
    }));

    if (newStatus === 'rejected') {
      setShowRejectReason(true);
    } else {
      setShowRejectReason(false);
      setRejectReason('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const updates = {
        displayName: formData.displayName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        department: formData.department,
        role: formData.role,
        status: formData.status
      };

      // Handle status changes
      if (formData.status !== user.status) {
        switch (formData.status) {
          case 'approved':
            await UserService.approveUser(user.id, currentUser.uid);
            break;
          case 'rejected':
            if (!rejectReason.trim()) {
              setError('กรุณาระบุเหตุผลในการปฏิเสธ');
              setLoading(false);
              return;
            }
            await UserService.rejectUser(user.id, currentUser.uid, rejectReason);
            break;
          case 'suspended':
            await UserService.suspendUser(user.id, currentUser.uid, rejectReason);
            break;
          default:
            break;
        }
      }

      // Handle role changes
      if (formData.role !== user.role) {
        await UserService.updateUserRole(user.id, formData.role, currentUser.uid);
      }

      // Update other profile fields
      await UserService.updateUserProfile(user.id, {
        displayName: formData.displayName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        department: formData.department
      }, currentUser.uid);

      onSave(updates);
    } catch (err) {
      console.error('Error updating user:', err);
      setError('ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    แก้ไขข้อมูลผู้ใช้
                  </h3>

                  {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  {/* User Info */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      {user.photoURL && (
                        <img src={user.photoURL} alt="" className="h-10 w-10 rounded-full mr-3" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.email}</p>
                        <p className="text-xs text-gray-500">UID: {user.id}</p>
                      </div>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-4">
                    {/* Display Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ชื่อที่แสดง
                      </label>
                      <input
                        type="text"
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    {/* First Name & Last Name */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ชื่อ
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          นามสกุล
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>

                    {/* Department */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        แผนก/หน่วยงาน
                      </label>
                      <input
                        type="text"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    {/* Role */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        บทบาท
                      </label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="user">ผู้ใช้ทั่วไป</option>
                        <option value="admin">ผู้ดูแลระบบ</option>
                      </select>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        สถานะ
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="incomplete">ไม่สมบูรณ์</option>
                        <option value="pending">รอการอนุมัติ</option>
                        <option value="approved">อนุมัติแล้ว</option>
                        <option value="rejected">ปฏิเสธ</option>
                        <option value="suspended">ระงับ</option>
                      </select>
                    </div>

                    {/* Reject/Suspend Reason */}
                    {showRejectReason && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          เหตุผล {formData.status === 'rejected' ? 'ในการปฏิเสธ' : 'ในการระงับ'}
                        </label>
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="ระบุเหตุผล..."
                        />
                      </div>
                    )}

                    {/* History Info */}
                    {user.approvedAt && (
                      <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
                        <p>อนุมัติเมื่อ: {new Date(user.approvedAt.toDate()).toLocaleString('th-TH')}</p>
                        {user.approvedBy && <p>โดย: {user.approvedBy}</p>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {loading ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserEditModal;
