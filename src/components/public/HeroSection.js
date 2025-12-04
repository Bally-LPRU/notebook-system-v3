const HeroSection = ({ title, subtitle }) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-blue-50 to-blue-100 py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-10 -right-10 w-32 h-32 sm:w-48 sm:h-48 bg-primary-100 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-0 -left-10 w-40 h-40 sm:w-56 sm:h-56 bg-blue-100 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Main Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
          {title}
        </h1>
        
        {/* Subtitle */}
        <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed">
          {subtitle}
        </p>
        
        {/* Call to Action Buttons intentionally removed per requirements */}
        
        {/* Feature Highlights */}
        <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
          <div className="text-center p-4 sm:p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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