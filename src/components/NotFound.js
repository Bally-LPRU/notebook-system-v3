import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NotFound = () => {
  const { isAuthenticated, needsProfileSetup } = useAuth();

  const getHomeLink = () => {
    if (!isAuthenticated) {
      return '/login';
    }
    if (needsProfileSetup()) {
      return '/profile-setup';
    }
    return '/dashboard';
  };

  const getHomeLinkText = () => {
    if (!isAuthenticated) {
      return 'เข้าสู่ระบบ';
    }
    if (needsProfileSetup()) {
      return 'ตั้งค่าโปรไฟล์';
    }
    return 'กลับสู่แดชบอร์ด';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          {/* 404 Illustration */}
          <div className="mx-auto h-32 w-32 text-gray-300 mb-8">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>

          {/* Error Message */}
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            ไม่พบหน้าที่ต้องการ
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            ขออภัย หน้าที่คุณกำลังมองหาไม่มีอยู่ในระบบ 
            อาจจะถูกย้าย ลบ หรือคุณพิมพ์ URL ผิด
          </p>

          {/* Action Buttons */}
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <Link
              to={getHomeLink()}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {getHomeLinkText()}
            </Link>

            <button
              onClick={() => window.history.back()}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              กลับหน้าก่อนหน้า
            </button>
          </div>

          {/* Help Section */}
          <div className="mt-12 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              ต้องการความช่วยเหลือ?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center text-gray-600">
                <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>ดูคู่มือการใช้งาน</span>
              </div>
              <div className="flex items-center text-gray-600">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>ติดต่อผู้ดูแลระบบ</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;