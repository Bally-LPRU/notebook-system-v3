import { EQUIPMENT_STATUS_LABELS } from '../../types/equipment';
import { getEquipmentStatusColor } from '../../utils/equipmentValidation';

/**
 * Reusable Equipment Status Badge Component
 * 
 * A consistent, reusable component for displaying equipment status across all views.
 * Provides standardized styling, colors, and labels based on equipment status values.
 * 
 * **Usage Example:**
 * ```jsx
 * <EquipmentStatusBadge status="available" size="md" />
 * <EquipmentStatusBadge status="in_use" size="sm" className="ml-2" />
 * ```
 * 
 * **Features:**
 * - Consistent color coding based on status
 * - Three size variants (sm, md, lg)
 * - Graceful handling of invalid status values
 * - Customizable with additional CSS classes
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.status - Equipment status value (e.g., 'available', 'in_use', 'maintenance', 'retired')
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Badge size variant
 * @param {string} [props.className=''] - Additional CSS classes for custom styling
 * @returns {JSX.Element} Rendered status badge
 * 
 * @example
 * // Small badge for compact views
 * <EquipmentStatusBadge status="available" size="sm" />
 * 
 * @example
 * // Large badge for detail views
 * <EquipmentStatusBadge status="maintenance" size="lg" />
 * 
 * @example
 * // With custom styling
 * <EquipmentStatusBadge status="retired" className="ml-4 shadow-sm" />
 */
const EquipmentStatusBadge = ({ status, size = 'md', className = '' }) => {
  // Handle invalid status values gracefully
  const statusColor = getEquipmentStatusColor(status);
  const statusLabel = EQUIPMENT_STATUS_LABELS[status] || 'Unknown';
  
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm'
  };

  // Default to 'md' if invalid size is provided
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <span 
      className={`inline-flex items-center rounded-full font-medium ${statusColor} ${sizeClass} ${className}`}
    >
      {statusLabel}
    </span>
  );
};

export default EquipmentStatusBadge;
