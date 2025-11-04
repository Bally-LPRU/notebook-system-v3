const HeroSection = ({ title, subtitle, onGetStarted }) => {
  return (
    <section className="bg-gradient-to-br from-primary-50 via-blue-50 to-indigo-100 py-8 sm:py-12 md:py-16 lg:py-20 px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        {/* Main Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
          {title}
        </h1>
        
        {/* Subtitle */}
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 mb-6 sm:mb-8 max-w-xs sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto leading-relaxed px-2 sm:px-0">
          {subtitle}
        </p>
        
        {/* Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-12">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto bg-primary-600 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-lg text-base sm:text-lg font-semibold hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            เริ่มต้นใช้งาน
          </button>
          
          <button className="w-full sm:w-auto text-primary-600 px-6 sm:px-8 py-3 sm:py-3.5 rounded-lg text-base sm:text-lg font-semibold hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 border border-primary-200 hover:border-primary-300">
            เรียนรู้เพิ่มเติม
          </button>
        </div>
        
        {/* Feature Highlights */}
        <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-xs sm:max-w-2xl lg:max-w-5xl mx-auto">
          <div className="text-center p-4 sm:p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              จัดการง่าย
            </h3>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              ระบบจัดการที่ใช้งานง่าย เหมาะสำหรับทุกคน
            </p>
          </div>
          
          <div className="text-center p-4 sm:p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              ตรวจสอบแบบเรียลไทม์
            </h3>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              ติดตามสถานะอุปกรณ์และการยืม-คืนแบบทันที
            </p>
          </div>
          
          <div className="text-center p-4 sm:p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm hover:shadow-md transition-all duration-200 sm:col-span-2 lg:col-span-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8a4 4 0 11-8 0v-4a4 4 0 018 0v4z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              ปลอดภัย
            </h3>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              ระบบรักษาความปลอดภัยข้อมูลระดับสูง
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;