import { useState, useEffect } from 'react';

const ViewModeToggle = ({ 
  viewMode = 'grid', 
  onViewModeChange,
  className = ''
}) => {
  const [currentMode, setCurrentMode] = useState(viewMode);

  useEffect(() => {
    setCurrentMode(viewMode);
  }, [viewMode]);

  const handleModeChange = (mode) => {
    setCurrentMode(mode);
    if (onViewModeChange) {
      onViewModeChange(mode);
    }
  };

  return (
    <div className={`inline-flex rounded-md shadow-sm ${className}`} role="group">
      <button
        type="button"
        onClick={() => handleModeChange('grid')}
        className={`px-4 py-2 text-sm font-medium border rounded-l-md focus:z-10 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors ${
          currentMode === 'grid'
            ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }`}
        title="แสดงแบบตาราง"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        <span className="ml-2 hidden sm:inline">ตาราง</span>
      </button>
      
      <button
        type="button"
        onClick={() => handleModeChange('list')}
        className={`px-4 py-2 text-sm font-medium border-t border-b border-r rounded-r-md focus:z-10 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors ${
          currentMode === 'list'
            ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }`}
        title="แสดงแบบรายการ"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
        <span className="ml-2 hidden sm:inline">รายการ</span>
      </button>
    </div>
  );
};

export default ViewModeToggle;