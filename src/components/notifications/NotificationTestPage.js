import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotificationContext } from '../../contexts/NotificationContext';
import NotificationService from '../../services/notificationService';
import NotificationScheduler from '../../services/notificationScheduler';
import { NOTIFICATION_TYPES } from '../../types/notification';

const NotificationTestPage = () => {
  const { user, isAdmin } = useAuth();
  const { showToast } = useNotificationContext();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSendTestNotification = async (type) => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      setMessage('');
      
      await NotificationScheduler.sendTestNotification(user.uid, type);
      setMessage('ส่งการแจ้งเตือนทดสอบเรียบร้อยแล้ว');
      
      // Show toast notification
      showToast({
        title: 'ทดสอบการแจ้งเตือน',
        message: 'ส่งการแจ้งเตือนทดสอบเรียบร้อยแล้ว',
        priority: 'medium'
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      setMessage('เกิดข้อผิดพลาดในการส่งการแจ้งเตือน');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessScheduled = async () => {
    if (!isAdmin) return;
    
    try {
      setLoading(true);
      setMessage('');
      
      await NotificationScheduler.triggerScheduledNotifications();
      setMessage('ประมวลผลการแจ้งเตือนที่กำหนดเวลาเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
      setMessage('เกิดข้อผิดพลาดในการประมวลผล');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    if (!isAdmin) return;
    
    try {
      setLoading(true);
      setMessage('');
      
      await NotificationScheduler.cleanup();
      setMessage('ทำความสะอาดการแจ้งเตือนเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
      setMessage('เกิดข้อผิดพลาดในการทำความสะอาด');
    } finally {
      setLoading(false);
    }
  };

  const handleSendSystemNotification = async () => {
    if (!isAdmin) return;
    
    try {
      setLoading(true);
      setMessage('');
      
      await NotificationService.sendSystemNotification(
        'ประกาศทดสอบระบบ',
        'นี่คือการทดสอบการส่งประกาศระบบไปยังผู้ใช้ทั้งหมด',
        { testData: true }
      );
      
      setMessage('ส่งประกาศระบบเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error sending system notification:', error);
      setMessage('เกิดข้อผิดพลาดในการส่งประกาศระบบ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">ทดสอบระบบการแจ้งเตือน</h1>
        <p className="text-gray-600 mt-2">
          หน้านี้สำหรับทดสอบการทำงานของระบบการแจ้งเตือน
        </p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.includes('เรียบร้อย') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Tests */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">การทดสอบสำหรับผู้ใช้</h2>
          
          <div className="space-y-4">
            <button
              onClick={() => handleSendTestNotification(NOTIFICATION_TYPES.SYSTEM_UPDATE)}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'กำลังส่ง...' : 'ส่งการแจ้งเตือนทั่วไป'}
            </button>
            
            <button
              onClick={() => handleSendTestNotification(NOTIFICATION_TYPES.LOAN_APPROVED)}
              disabled={loading}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'กำลังส่ง...' : 'ทดสอบการอนุมัติคำขอยืม'}
            </button>
            
            <button
              onClick={() => handleSendTestNotification(NOTIFICATION_TYPES.LOAN_REMINDER)}
              disabled={loading}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
            >
              {loading ? 'กำลังส่ง...' : 'ทดสอบการแจ้งเตือนคืนอุปกรณ์'}
            </button>
            
            <button
              onClick={() => handleSendTestNotification(NOTIFICATION_TYPES.RESERVATION_REMINDER)}
              disabled={loading}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'กำลังส่ง...' : 'ทดสอบการแจ้งเตือนการจอง'}
            </button>
          </div>
        </div>

        {/* Admin Tests */}
        {isAdmin && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">การทดสอบสำหรับผู้ดูแลระบบ</h2>
            
            <div className="space-y-4">
              <button
                onClick={handleSendSystemNotification}
                disabled={loading}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'กำลังส่ง...' : 'ส่งประกาศระบบ'}
              </button>
              
              <button
                onClick={handleProcessScheduled}
                disabled={loading}
                className="w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
              >
                {loading ? 'กำลังประมวลผล...' : 'ประมวลผลการแจ้งเตือนที่กำหนดเวลา'}
              </button>
              
              <button
                onClick={handleCleanup}
                disabled={loading}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'กำลังทำความสะอาด...' : 'ทำความสะอาดการแจ้งเตือนเก่า'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">วิธีการทดสอบ</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• คลิกปุ่มทดสอบเพื่อส่งการแจ้งเตือนไปยังบัญชีของคุณ</li>
          <li>• ตรวจสอบการแจ้งเตือนที่ไอคอนกระดิ่งในแถบนำทาง</li>
          <li>• ดูการแจ้งเตือนแบบ Toast ที่มุมขวาบนของหน้าจอ</li>
          <li>• เข้าไปดูการแจ้งเตือนทั้งหมดที่หน้า "ศูนย์การแจ้งเตือน"</li>
          <li>• ทดสอบการตั้งค่าการแจ้งเตือนในหน้า "ตั้งค่าการแจ้งเตือน"</li>
        </ul>
      </div>
    </div>
  );
};

export default NotificationTestPage;