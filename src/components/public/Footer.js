const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer 
      className="bg-gray-900 text-white"
      role="contentinfo"
      aria-label="ข้อมูลติดต่อและลิงก์เพิ่มเติม"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Company Info */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-2">
            <div className="flex items-center mb-3 sm:mb-4">
              <div 
                className="w-7 h-7 sm:w-8 sm:h-8 bg-primary-600 rounded-lg flex items-center justify-center mr-2 sm:mr-3"
                aria-hidden="true"
              >
                <svg 
                  className="w-4 h-4 sm:w-5 sm:h-5 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold">Equipment Lending System</h3>
            </div>
            <p className="text-gray-300 mb-4 sm:mb-6 max-w-md text-sm sm:text-base leading-relaxed">
              ระบบจัดการการยืม-คืนอุปกรณ์ที่ทันสมัย ช่วยให้การจัดการอุปกรณ์เป็นไปอย่างมีประสิทธิภาพและโปร่งใส
            </p>
            <div className="flex space-x-3 sm:space-x-4" aria-label="ลิงก์โซเชียลมีเดีย">
              <a 
                href="https://twitter.com/equipment_system" 
                className="text-gray-400 hover:text-primary-400 transition-colors duration-200 p-2 hover:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                aria-label="ติดตาม Equipment Lending System บน Twitter"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              <a 
                href="https://facebook.com/equipment.lending.system" 
                className="text-gray-400 hover:text-primary-400 transition-colors duration-200 p-2 hover:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                aria-label="ติดตาม Equipment Lending System บน Facebook"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                </svg>
              </a>
              <a 
                href="https://linkedin.com/company/equipment-lending-system" 
                className="text-gray-400 hover:text-primary-400 transition-colors duration-200 p-2 hover:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                aria-label="ติดตาม Equipment Lending System บน LinkedIn"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a 
                href="mailto:support@equipment-system.com" 
                className="text-gray-400 hover:text-primary-400 transition-colors duration-200 p-2 hover:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                aria-label="ส่งอีเมลติดต่อ Equipment Lending System"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <nav className="sm:col-span-1" aria-labelledby="quick-links-heading">
            <h4 id="quick-links-heading" className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-white">
              ลิงก์ด่วน
            </h4>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <a 
                  href="#stats" 
                  className="text-gray-300 hover:text-primary-400 transition-colors duration-200 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-sm"
                  aria-describedby="stats-desc"
                >
                  สถิติอุปกรณ์
                </a>
                <span id="stats-desc" className="sr-only">ดูข้อมูลสถิติการใช้งานอุปกรณ์</span>
              </li>
              <li>
                <a 
                  href="#about" 
                  className="text-gray-300 hover:text-primary-400 transition-colors duration-200 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-sm"
                  aria-describedby="about-desc"
                >
                  เกี่ยวกับระบบ
                </a>
                <span id="about-desc" className="sr-only">เรียนรู้เพิ่มเติมเกี่ยวกับระบบยืม-คืนอุปกรณ์</span>
              </li>
              <li>
                <a 
                  href="#features" 
                  className="text-gray-300 hover:text-primary-400 transition-colors duration-200 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-sm"
                  aria-describedby="features-desc"
                >
                  คุณสมบัติ
                </a>
                <span id="features-desc" className="sr-only">ดูคุณสมบัติและฟีเจอร์ของระบบ</span>
              </li>
              <li>
                <a 
                  href="#help" 
                  className="text-gray-300 hover:text-primary-400 transition-colors duration-200 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-sm"
                  aria-describedby="help-desc"
                >
                  ช่วยเหลือ
                </a>
                <span id="help-desc" className="sr-only">ดูคู่มือการใช้งานและคำถามที่พบบ่อย</span>
              </li>
            </ul>
          </nav>

          {/* Contact Info */}
          <div className="sm:col-span-1" aria-labelledby="contact-heading">
            <h4 id="contact-heading" className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-white">
              ติดต่อเรา
            </h4>
            <address className="not-italic">
              <ul className="space-y-2 sm:space-y-3">
                <li className="flex items-start text-gray-300 text-sm sm:text-base">
                  <svg 
                    className="w-4 h-4 sm:w-5 sm:h-5 mr-2 mt-0.5 flex-shrink-0" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a 
                    href="mailto:support@equipment-system.com"
                    className="break-all hover:text-primary-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-sm"
                    aria-label="ส่งอีเมลไปที่ support@equipment-system.com"
                  >
                    support@equipment-system.com
                  </a>
                </li>
                <li className="flex items-center text-gray-300 text-sm sm:text-base">
                  <svg 
                    className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a 
                    href="tel:+6621234567"
                    className="hover:text-primary-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-sm"
                    aria-label="โทรศัพท์ 02-123-4567"
                  >
                    02-123-4567
                  </a>
                </li>
                <li className="flex items-start text-gray-300 text-sm sm:text-base">
                  <svg 
                    className="w-4 h-4 sm:w-5 sm:h-5 mr-2 mt-0.5 flex-shrink-0" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="leading-relaxed">
                    มหาวิทยาลัยราชภัฏลำปาง<br />
                    119 หมู่ 9 ตำบลชมพู<br />
                    อำเภอเมือง จังหวัดลำปาง 52100
                  </span>
                </li>
                <li className="flex items-start text-gray-300 text-sm sm:text-base">
                  <svg 
                    className="w-4 h-4 sm:w-5 sm:h-5 mr-2 mt-0.5 flex-shrink-0" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="leading-relaxed">
                    เวลาทำการ: จันทร์-ศุกร์<br />
                    08:30 - 16:30 น.
                  </span>
                </li>
              </ul>
            </address>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <p className="text-gray-400 text-xs sm:text-sm text-center sm:text-left">
            © {currentYear} Equipment Lending System. สงวนลิขสิทธิ์.
          </p>
          <nav className="flex flex-wrap justify-center sm:justify-end space-x-4 sm:space-x-6" aria-label="นโยบายและข้อกำหนด">
            <a 
              href="#privacy" 
              className="text-gray-400 hover:text-primary-400 text-xs sm:text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-sm"
              aria-describedby="privacy-desc"
            >
              นโยบายความเป็นส่วนตัว
            </a>
            <span id="privacy-desc" className="sr-only">อ่านนโยบายความเป็นส่วนตัวของเรา</span>
            <a 
              href="#terms" 
              className="text-gray-400 hover:text-primary-400 text-xs sm:text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-sm"
              aria-describedby="terms-desc"
            >
              ข้อกำหนดการใช้งาน
            </a>
            <span id="terms-desc" className="sr-only">อ่านข้อกำหนดการใช้งานระบบ</span>
            <a 
              href="#cookies" 
              className="text-gray-400 hover:text-primary-400 text-xs sm:text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-sm"
              aria-describedby="cookies-desc"
            >
              นโยบายคุกกี้
            </a>
            <span id="cookies-desc" className="sr-only">อ่านนโยบายการใช้คุกกี้</span>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;