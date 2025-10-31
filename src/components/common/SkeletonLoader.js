const SkeletonLoader = ({ 
  className = '',
  width = 'w-full',
  height = 'h-4',
  rounded = 'rounded',
  animate = true
}) => {
  return (
    <div 
      className={`bg-gray-200 ${width} ${height} ${rounded} ${animate ? 'animate-pulse' : ''} ${className}`}
    />
  );
};

export const SkeletonCard = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      <div className="animate-pulse">
        {/* Image placeholder */}
        <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
        
        {/* Title */}
        <div className="bg-gray-200 h-6 rounded mb-2"></div>
        
        {/* Subtitle */}
        <div className="bg-gray-200 h-4 rounded w-3/4 mb-4"></div>
        
        {/* Content lines */}
        <div className="space-y-2 mb-4">
          <div className="bg-gray-200 h-3 rounded"></div>
          <div className="bg-gray-200 h-3 rounded w-5/6"></div>
          <div className="bg-gray-200 h-3 rounded w-4/6"></div>
        </div>
        
        {/* Buttons */}
        <div className="flex space-x-2">
          <div className="bg-gray-200 h-8 rounded flex-1"></div>
          <div className="bg-gray-200 h-8 rounded flex-1"></div>
        </div>
      </div>
    </div>
  );
};

export const SkeletonTable = ({ rows = 5, columns = 4, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      <div className="animate-pulse">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, index) => (
              <div key={index} className="bg-gray-200 h-4 rounded"></div>
            ))}
          </div>
        </div>
        
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4 border-b border-gray-200 last:border-b-0">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div key={colIndex} className="bg-gray-200 h-4 rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SkeletonList = ({ items = 5, className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="animate-pulse">
            <div className="flex items-start space-x-4">
              {/* Avatar/Icon */}
              <div className="bg-gray-200 h-12 w-12 rounded-full flex-shrink-0"></div>
              
              <div className="flex-1 space-y-2">
                {/* Title */}
                <div className="bg-gray-200 h-5 rounded w-3/4"></div>
                
                {/* Subtitle */}
                <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                
                {/* Content */}
                <div className="space-y-1">
                  <div className="bg-gray-200 h-3 rounded"></div>
                  <div className="bg-gray-200 h-3 rounded w-5/6"></div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex space-x-2 flex-shrink-0">
                <div className="bg-gray-200 h-8 w-16 rounded"></div>
                <div className="bg-gray-200 h-8 w-16 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonStats = ({ items = 4, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="flex items-center">
              <div className="bg-gray-200 h-8 w-8 rounded flex-shrink-0"></div>
              <div className="ml-4 flex-1">
                <div className="bg-gray-200 h-6 rounded w-16 mb-2"></div>
                <div className="bg-gray-200 h-4 rounded w-24"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonChart = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="animate-pulse">
        {/* Chart title */}
        <div className="bg-gray-200 h-6 rounded w-1/3 mb-6"></div>
        
        {/* Chart area */}
        <div className="bg-gray-200 h-64 rounded mb-4"></div>
        
        {/* Legend */}
        <div className="flex justify-center space-x-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className="bg-gray-200 h-3 w-3 rounded-full"></div>
              <div className="bg-gray-200 h-3 w-16 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const SkeletonForm = ({ fields = 4, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="animate-pulse space-y-6">
        {/* Form title */}
        <div className="bg-gray-200 h-6 rounded w-1/4"></div>
        
        {/* Form fields */}
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="bg-gray-200 h-4 rounded w-1/6"></div>
            <div className="bg-gray-200 h-10 rounded"></div>
          </div>
        ))}
        
        {/* Buttons */}
        <div className="flex justify-end space-x-3">
          <div className="bg-gray-200 h-10 w-20 rounded"></div>
          <div className="bg-gray-200 h-10 w-20 rounded"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonLoader;