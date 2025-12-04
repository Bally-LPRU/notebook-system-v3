const Header = ({ onLoginClick, isLoading = false }) => {
  return (
    <header 
      className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50"
      role="banner"
      aria-label="หัวเรื่องหลักและการนำทาง"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo and System Name */}
          <div className="flex items-center min-w-0 flex-1">
            <div className="flex-shrink-0">
              <div 
                className="w-7 h-7 sm:w-8 sm:h-8 bg-primary-600 rounded-lg flex items-center justify-center"
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
            </div>
            <div className="ml-2 sm:ml-3 min-w-0">
              <h1 className="text-sm sm:text-lg md:text-xl font-semibold text-gray-900 truncate">
                <span className="hidden sm:inline">Equipment Lending System</span>
                <span className="sm:hidden">ELS</span>
              </h1>
            </div>
          </div>

          {/* Only show login button */}
          <div className="flex items-center">
            <button
              onClick={onLoginClick}
              disabled={isLoading}
              className="bg-primary-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              aria-describedby="login-button-desc"
              type="button"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div 
                    className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-1 sm:mr-2"
                    aria-hidden="true"
                  ></div>
                  <span className="hidden sm:inline">กำลังเข้าสู่ระบบ...</span>
                  <span className="sm:hidden">กำลังโหลด...</span>
                </div>
              ) : (
                <>
                  <span className="hidden sm:inline">เข้าสู่ระบบ</span>
                  <span className="sm:hidden">เข้าสู่ระบบ</span>
                </>
              )}
            </button>
            <span id="login-button-desc" className="sr-only">
              {isLoading ? 'กำลังดำเนินการเข้าสู่ระบบ' : 'คลิกเพื่อเข้าสู่ระบบด้วย Google'}
            </span>
          </div>
        </div>
      </div>

      {/* No additional navigation on mobile */}
    </header>
  );
};

export default Header;