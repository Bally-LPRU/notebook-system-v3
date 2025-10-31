const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          {/* Left side - Company info */}
          <div className="flex flex-col md:flex-row md:items-center">
            <div className="flex items-center">
              <div className="h-6 w-6 bg-blue-600 rounded flex items-center justify-center">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="ml-2 text-sm font-medium text-gray-900">
                ระบบยืม-คืนอุปกรณ์
              </span>
            </div>
            <div className="mt-2 md:mt-0 md:ml-4">
              <p className="text-sm text-gray-600">
                Equipment Lending System
              </p>
            </div>
          </div>

          {/* Center - Links */}
          <div className="mt-4 md:mt-0">
            <div className="flex flex-wrap justify-center md:justify-end space-x-6">
              <a
                href="/help"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                ความช่วยเหลือ
              </a>
              <a
                href="/privacy"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                นโยบายความเป็นส่วนตัว
              </a>
              <a
                href="/terms"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                เงื่อนไขการใช้งาน
              </a>
              <a
                href="/contact"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                ติดต่อเรา
              </a>
            </div>
          </div>

          {/* Right side - Copyright */}
          <div className="mt-4 md:mt-0">
            <p className="text-sm text-gray-500 text-center md:text-right">
              © {currentYear} ระบบยืม-คืนอุปกรณ์. สงวนลิขสิทธิ์.
            </p>
          </div>
        </div>

        {/* Bottom section - Additional info */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center justify-center md:justify-start">
              <div className="flex items-center text-sm text-gray-500">
                <svg className="h-4 w-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>ระบบทำงานปกติ</span>
              </div>
              <div className="ml-4 text-sm text-gray-500">
                เวอร์ชัน 1.0.0
              </div>
            </div>

            <div className="mt-2 md:mt-0 flex items-center justify-center md:justify-end">
              <span className="text-sm text-gray-500 mr-2">
                พัฒนาด้วย
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-blue-600">React</span>
                <span className="text-gray-400">•</span>
                <span className="text-sm font-medium text-orange-600">Firebase</span>
                <span className="text-gray-400">•</span>
                <span className="text-sm font-medium text-teal-600">Tailwind CSS</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;