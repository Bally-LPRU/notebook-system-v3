import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../layout/Layout';
import UserService from '../../services/userService';
import DepartmentSelector from '../common/DepartmentSelector';
import { useUserTypeLimits } from '../../hooks/useUserTypeLimits';

const ProfilePage = () => {
  const { user, userProfile } = useAuth();
  const { 
    limits, 
    loading: limitsLoading, 
    currentBorrowedCount, 
    pendingRequestsCount, 
    remainingQuota 
  } = useUserTypeLimits();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    position: '',
    department: ''
  });

  // Update form data when userProfile loads
  useEffect(() => {
    if (userProfile) {
      setFormData({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        phoneNumber: userProfile.phoneNumber || '',
        position: userProfile.position || '',
        department: userProfile.department || ''
      });
    }
  }, [userProfile]);

  if (!user || !userProfile) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'รอการอนุมัติ' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'อนุมัติแล้ว' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'ปฏิเสธ' },
      suspended: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'ระงับ' },
      incomplete: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'ไม่สมบูรณ์' }
    };

    const badge = badges[status] || badges.incomplete;

    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await UserService.updateUserProfile(user.uid, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        position: formData.position.trim(),
        department: formData.department,
        displayName: `${formData.firstName.trim()} ${formData.lastName.trim()}`
      });

      setSuccess(true);
      setIsEditing(false);
      
      // Reload page to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    setSuccess(false);
    // Reset form data
    setFormData({
      firstName: userProfile?.firstName || '',
      lastName: userProfile?.lastName || '',
      phoneNumber: userProfile?.phoneNumber || '',
      position: userProfile?.position || '',
      department: userProfile?.department || ''
    });
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'ผู้ดูแลระบบ' },
      user: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'ผู้ใช้ทั่วไป' }
    };

    const badge = badges[role] || badges.user;

    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getUserTypeBadge = (userType) => {
    const badges = {
      teacher: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'อาจารย์' },
      staff: { bg: 'bg-teal-100', text: 'text-teal-800', label: 'เจ้าหน้าที่' },
      student: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'นักศึกษา' }
    };

    const badge = badges[userType];

    if (!badge) {
      return (
        <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-600">
          ไม่ระบุประเภท
        </span>
      );
    }

    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">โปรไฟล์ของฉัน</h1>
          <p className="mt-2 text-gray-600">ข้อมูลส่วนตัวและการตั้งค่าบัญชี</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {/* Cover */}
          <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>

          {/* Profile Info */}
          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="flex items-end -mt-16 mb-4">
              <div className="relative">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gray-200 flex items-center justify-center">
                    <span className="text-4xl font-bold text-gray-500">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
                    </span>
                  </div>
                )}
              </div>
              <div className="ml-6 mb-2 flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {userProfile.displayName || `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() || 'ไม่ระบุชื่อ'}
                    </h2>
                    <p className="text-gray-600">{user.email}</p>
                  </div>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {isEditing ? 'ยกเลิก' : 'แก้ไขโปรไฟล์'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {getRoleBadge(userProfile.role)}
                  {getUserTypeBadge(userProfile.userType)}
                  {getStatusBadge(userProfile.status)}
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลส่วนตัว</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ชื่อ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ</label>
                  <p className="text-gray-900">{userProfile.firstName || '-'}</p>
                </div>

                {/* นามสกุล */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">นามสกุล</label>
                  <p className="text-gray-900">{userProfile.lastName || '-'}</p>
                </div>

                {/* อีเมล */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
                  <p className="text-gray-900">{user.email}</p>
                </div>

                {/* แผนก */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">แผนก/หน่วยงาน</label>
                  <p className="text-gray-900">{userProfile.department?.label || userProfile.department || '-'}</p>
                </div>

                {/* เบอร์โทรศัพท์ */}
                {userProfile.phoneNumber && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์</label>
                    <p className="text-gray-900">{userProfile.phoneNumber}</p>
                  </div>
                )}

                {/* ตำแหน่ง */}
                {userProfile.position && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ตำแหน่ง</label>
                    <p className="text-gray-900">{userProfile.position}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Account Info */}
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลบัญชี</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                  <p className="text-gray-600 text-sm font-mono">{user.uid}</p>
                </div>

                {/* วันที่สมัคร */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">วันที่สมัคร</label>
                  <p className="text-gray-900">
                    {userProfile.createdAt?.toDate?.().toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) || '-'}
                  </p>
                </div>

                {/* อัปเดตล่าสุด */}
                {userProfile.updatedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">อัปเดตล่าสุด</label>
                    <p className="text-gray-900">
                      {userProfile.updatedAt?.toDate?.().toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) || '-'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* User Type Warning */}
        {limits.warning && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-800">ยังไม่ได้ระบุประเภทผู้ใช้</p>
                <p className="text-sm text-yellow-700 mt-1">{limits.warning}</p>
              </div>
            </div>
          </div>
        )}

        {/* Borrowing Limits Card */}
        <div className="mt-6 bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">สิทธิ์การยืมอุปกรณ์</h3>
            <p className="text-sm text-gray-600 mt-1">
              {limits.isEnabled 
                ? `สิทธิ์ตามประเภทผู้ใช้: ${limits.userTypeName}`
                : 'ใช้สิทธิ์เริ่มต้นของระบบ'
              }
            </p>
          </div>
          
          <div className="p-6">
            {limitsLoading ? (
              <div className="flex items-center justify-center py-4">
                <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="ml-2 text-gray-600">กำลังโหลด...</span>
              </div>
            ) : (
              <>
                {/* Limits Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {/* Max Items */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <span className="text-sm font-medium text-blue-800">จำนวนอุปกรณ์สูงสุด</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{limits.maxItems} <span className="text-sm font-normal">ชิ้น</span></p>
                  </div>

                  {/* Max Days */}
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium text-green-800">ระยะเวลายืมสูงสุด</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900">{limits.maxDays} <span className="text-sm font-normal">วัน</span></p>
                  </div>

                  {/* Max Advance Booking */}
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium text-purple-800">จองล่วงหน้าได้</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900">{limits.maxAdvanceBookingDays} <span className="text-sm font-normal">วัน</span></p>
                  </div>
                </div>

                {/* Current Status */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">สถานะการยืมปัจจุบัน</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Currently Borrowed */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">กำลังยืมอยู่</span>
                      <span className="text-lg font-semibold text-gray-900">{currentBorrowedCount} ชิ้น</span>
                    </div>

                    {/* Pending Requests */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">รอดำเนินการ</span>
                      <span className="text-lg font-semibold text-gray-900">{pendingRequestsCount} รายการ</span>
                    </div>

                    {/* Remaining Quota */}
                    <div className={`flex items-center justify-between p-3 rounded-lg ${remainingQuota > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                      <span className={`text-sm ${remainingQuota > 0 ? 'text-green-600' : 'text-red-600'}`}>ยืมได้อีก</span>
                      <span className={`text-lg font-semibold ${remainingQuota > 0 ? 'text-green-700' : 'text-red-700'}`}>{remainingQuota} ชิ้น</span>
                    </div>
                  </div>

                  {/* Quota Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>การใช้โควต้า</span>
                      <span>{currentBorrowedCount + pendingRequestsCount} / {limits.maxItems}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full transition-all duration-300 ${
                          remainingQuota === 0 ? 'bg-red-500' : 
                          remainingQuota <= 1 ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(100, ((currentBorrowedCount + pendingRequestsCount) / limits.maxItems) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Info Note */}
                {limits.isDefault && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">
                      <span className="font-medium">หมายเหตุ:</span> {limits.isEnabled 
                        ? 'ใช้ค่าเริ่มต้นสำหรับประเภทผู้ใช้นี้' 
                        : 'ระบบใช้สิทธิ์เริ่มต้นสำหรับผู้ใช้ทุกคน'
                      }
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-green-800">บันทึกข้อมูลสำเร็จ</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Edit Form */}
        {isEditing && (
          <div className="mt-6 bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">แก้ไขข้อมูลส่วนตัว</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ชื่อ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* นามสกุล */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    นามสกุล <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* เบอร์โทรศัพท์ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0812345678"
                  />
                </div>

                {/* ตำแหน่ง */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ตำแหน่ง
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="เช่น อาจารย์, เจ้าหน้าที่"
                  />
                </div>

                {/* แผนก */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    แผนก/หน่วยงาน <span className="text-red-500">*</span>
                  </label>
                  <DepartmentSelector
                    value={formData.department}
                    onChange={(value) => setFormData({ ...formData, department: value })}
                    required
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      กำลังบันทึก...
                    </>
                  ) : (
                    'บันทึกการเปลี่ยนแปลง'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProfilePage;
