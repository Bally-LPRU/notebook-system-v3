import { useState } from 'react';

const QuickActions = ({ 
  actions = [],
  onAction,
  loading = false,
  className = ''
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleActionClick = (action) => {
    setShowMenu(false);
    if (onAction) {
      onAction(action);
    }
  };

  if (actions.length === 0) return null;

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={loading}
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            กำลังดำเนินการ...
          </>
        ) : (
          <>
            การดำเนินการ
            <svg className="ml-2 -mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleActionClick(action)}
                disabled={action.disabled}
                className={`group flex items-center px-4 py-2 text-sm w-full text-left transition-colors ${
                  action.disabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : action.danger
                    ? 'text-red-700 hover:bg-red-50 hover:text-red-900'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {action.icon && (
                  <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                  </svg>
                )}
                {action.label}
                {action.badge && (
                  <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {action.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};

export default QuickActions;