const StatsCard = ({ 
  title, 
  value, 
  icon, 
  color = 'blue', 
  loading = false,
  error = false,
  offline = false,
  degradedMode = false,
  dataAge = null,
  errorType = null
}) => {
  // Enhanced color variants with consistent primary color usage
  const colorVariants = {
    blue: {
      bg: 'bg-primary-50',
      icon: 'text-primary-600',
      text: 'text-primary-900',
      border: 'border-primary-200',
      gradient: 'from-primary-50 to-primary-100'
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      text: 'text-green-900',
      border: 'border-green-200',
      gradient: 'from-green-50 to-green-100'
    },
    orange: {
      bg: 'bg-orange-50',
      icon: 'text-orange-600',
      text: 'text-orange-900',
      border: 'border-orange-200',
      gradient: 'from-orange-50 to-orange-100'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      text: 'text-purple-900',
      border: 'border-purple-200',
      gradient: 'from-purple-50 to-purple-100'
    }
  };

  const colors = colorVariants[color] || colorVariants.blue;

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4 mb-2 sm:mb-3"></div>
            <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="ml-3 sm:ml-4 flex-shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusInfo = () => {
    if (error) {
      return {
        text: errorType === 'network' ? 'ไม่มีเครือข่าย' : 'ข้อมูลเก่า',
        color: 'text-orange-600',
        bgColor: 'bg-orange-400',
        borderColor: 'border-orange-200'
      };
    }
    
    if (offline) {
      return {
        text: 'ออฟไลน์',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-400',
        borderColor: 'border-yellow-200'
      };
    }
    
    if (degradedMode) {
      return {
        text: 'โหมดจำกัด',
        color: 'text-blue-600',
        bgColor: 'bg-blue-400',
        borderColor: 'border-blue-200'
      };
    }
    
    return {
      text: 'อัปเดตล่าสุด',
      color: 'text-gray-500',
      bgColor: colors.bg,
      borderColor: colors.border
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`bg-white rounded-xl shadow-sm border p-4 sm:p-6 transition-all duration-200 group ${
      statusInfo.borderColor
    } ${
      degradedMode ? 'degraded-mode' : 'hover:shadow-md hover:-translate-y-1'
    } ${
      error || offline ? 'error-transition' : ''
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className={`text-xs sm:text-sm font-medium mb-1 sm:mb-2 truncate ${
            error ? 'text-orange-800' : offline ? 'text-yellow-800' : degradedMode ? 'text-blue-800' : colors.text
          }`}>
            {title}
          </h3>
          <p className={`text-xl sm:text-2xl md:text-3xl font-bold leading-none ${
            error || offline || degradedMode ? 'text-gray-700' : 'text-gray-900'
          }`}>
            {typeof value === 'number' ? value.toLocaleString('th-TH') : value}
          </p>
          
          {/* Data age indicator for degraded mode */}
          {degradedMode && dataAge && (
            <p className="text-xs text-gray-500 mt-1">
              {Math.floor(dataAge / 60000)} นาทีที่แล้ว
            </p>
          )}
        </div>
        <div className="ml-3 sm:ml-4 flex-shrink-0">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-transform duration-200 ${
            degradedMode ? '' : 'group-hover:scale-110'
          } ${
            error 
              ? 'bg-gradient-to-br from-orange-50 to-orange-100' 
              : offline 
              ? 'bg-gradient-to-br from-yellow-50 to-yellow-100'
              : degradedMode
              ? 'bg-gradient-to-br from-blue-50 to-blue-100'
              : `bg-gradient-to-br ${colors.gradient}`
          }`}>
            <div className={`w-5 h-5 sm:w-6 sm:h-6 ${
              error ? 'text-orange-600' : offline ? 'text-yellow-600' : degradedMode ? 'text-blue-600' : colors.icon
            }`}>
              {icon}
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced status indicator */}
      <div className="mt-3 sm:mt-4 flex items-center justify-between text-xs">
        <span className={`truncate ${statusInfo.color}`}>
          {statusInfo.text}
        </span>
        <div className="flex items-center ml-2">
          {/* Status indicator with different animations based on state */}
          <div className={`w-2 h-2 rounded-full ${
            error 
              ? 'bg-orange-400 animate-pulse' 
              : offline 
              ? 'bg-yellow-400 animate-pulse'
              : degradedMode
              ? 'bg-blue-400 animate-pulse'
              : `${statusInfo.bgColor} animate-pulse`
          }`}></div>
          
          {/* Additional error type indicator */}
          {error && errorType && (
            <div className="ml-1 text-xs text-orange-500" title={`Error type: ${errorType}`}>
              {errorType === 'network' ? '🌐' : errorType === 'firestore' ? '🔌' : '⚠️'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;