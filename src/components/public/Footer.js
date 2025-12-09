import { useId } from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const emailTextId = useId();
  const phoneTextId = useId();

  return (
    <footer
      className="bg-gray-900 text-white border-t border-gray-800 py-6 sm:py-8 px-4 sm:px-6 lg:px-8"
      role="contentinfo"
      aria-label="ข้อมูลติดต่อ"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Company Info */}
          <div>
            <h3 className="flex items-center text-base sm:text-lg font-semibold text-white mb-3">
              <span
                className="w-6 h-6 sm:w-7 sm:h-7 bg-primary-600 rounded-lg flex items-center justify-center mr-2"
                aria-hidden="true"
              >
                <svg
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </span>
              Equipment Lending System
            </h3>
            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
              ระบบจัดการการยืม-คืนอุปกรณ์ที่ทันสมัย
            </p>
          </div>

          {/* Contact Info */}
          <div aria-labelledby="contact-heading">
            <h3 id="contact-heading" className="text-sm sm:text-base font-semibold text-white mb-3">
              ติดต่อเรา
            </h3>
            <address className="not-italic">
              <ul className="space-y-1.5 sm:space-y-2">
                <li className="flex items-center text-gray-300 text-xs sm:text-sm">
                  <svg
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a
                    href="mailto:support@equipment-system.com"
                    className="text-gray-300 hover:text-white transition-colors"
                    aria-labelledby={emailTextId}
                  >
                    <span id={emailTextId}>support@equipment-system.com</span>
                  </a>
                </li>
                <li className="flex items-center text-gray-300 text-xs sm:text-sm">
                  <svg
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a
                    href="tel:+6621234567"
                    className="text-gray-300 hover:text-white transition-colors"
                    aria-labelledby={phoneTextId}
                  >
                    <span id={phoneTextId}>02-123-4567</span>
                  </a>
                </li>
                <li className="flex items-start text-gray-300 text-xs sm:text-sm">
                  <svg
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>
                    มหาวิทยาลัยราชภัฏลำปาง, จ.ลำปาง 52100
                  </span>
                </li>
                <li className="flex items-center text-gray-300 text-xs sm:text-sm">
                  <svg
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>จ.-ศ. 08:30-16:30 น.</span>
                </li>
              </ul>
            </address>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-4 sm:mt-6 pt-4 sm:pt-6 text-center">
          <p className="text-gray-400 text-xs sm:text-sm">
            © {currentYear} Equipment Lending System
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;