/**
 * StaffStatsCard Component
 * Reusable stats card for Staff Dashboard
 * Based on AdminDashboard StatCard pattern
 * Requirements: 9.2, 9.3, 9.4
 */

// Pastel Color Palette (consistent with AdminDashboard)
const COLORS = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
  green: { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' },
  yellow: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200' },
  red: { bg: 'bg-rose-100', text: 'text-rose-600', border: 'border-rose-200' },
  purple: { bg: 'bg-violet-100', text: 'text-violet-600', border: 'border-violet-200' },
  cyan: { bg: 'bg-cyan-100', text: 'text-cyan-600', border: 'border-cyan-200' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' },
  gray: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-200' }
};

/**
 * StaffStatsCard - Animated statistics card for Staff Dashboard
 * @param {Object} props
 * @param {string} props.title - Card title
 * @param {number|string} props.value - Statistics value
 * @param {React.ReactNode} props.icon - Icon component
 * @param {string} props.color - Color theme (blue, green, yellow, red, purple, etc.)
 * @param {Function} props.onClick - Click handler
 * @param {number} props.delay - Animation delay in ms
 * @param {boolean} props.loading - Loading state
 */
const StaffStatsCard = ({ 
  title, 
  value, 
  icon, 
  color = 'blue', 
  onClick, 
  delay = 0,
  loading = false 
}) => {
  const colorScheme = COLORS[color] || COLORS.blue;

  return (
    <div
      onClick={onClick}
      className={`group bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border ${colorScheme.border} p-6 
        hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer animate-fade-in`}
      style={{ animationDelay: `${delay}ms` }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.();
        }
      }}
      aria-label={`${title}: ${value}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          {loading ? (
            <div className="h-9 w-16 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <p className={`text-3xl font-bold ${colorScheme.text} transition-all duration-300 group-hover:scale-110`}>
              {value}
            </p>
          )}
        </div>
        <div className={`w-14 h-14 ${colorScheme.bg} rounded-2xl flex items-center justify-center 
          transition-all duration-300 group-hover:rotate-12 group-hover:scale-110`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StaffStatsCard;
