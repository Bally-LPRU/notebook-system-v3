import { ChevronUpIcon, ChevronDownIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';

const SortableHeader = ({
  field,
  label,
  currentSortBy,
  currentSortOrder,
  onSort,
  className = "",
  disabled = false
}) => {
  const isActive = currentSortBy === field;
  const isAscending = isActive && currentSortOrder === 'asc';
  const isDescending = isActive && currentSortOrder === 'desc';

  const handleClick = () => {
    if (disabled) return;
    
    let newOrder = 'asc';
    if (isActive) {
      newOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
    }
    
    onSort(field, newOrder);
  };

  const getSortIcon = () => {
    if (isAscending) {
      return <ChevronUpIcon className="h-4 w-4" />;
    } else if (isDescending) {
      return <ChevronDownIcon className="h-4 w-4" />;
    } else {
      return <ArrowsUpDownIcon className="h-4 w-4 opacity-50" />;
    }
  };

  const getSortLabel = () => {
    if (isAscending) {
      return 'เรียงจากน้อยไปมาก / เก่าไปใหม่';
    } else if (isDescending) {
      return 'เรียงจากมากไปน้อย / ใหม่ไปเก่า';
    } else {
      return 'คลิกเพื่อเรียงลำดับ';
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`group inline-flex items-center space-x-1 text-left font-medium transition-colors ${
        isActive 
          ? 'text-blue-600' 
          : 'text-gray-900 hover:text-gray-700'
      } ${
        disabled 
          ? 'cursor-not-allowed opacity-50' 
          : 'cursor-pointer'
      } ${className}`}
      title={getSortLabel()}
    >
      <span>{label}</span>
      <span className={`transition-colors ${
        isActive 
          ? 'text-blue-600' 
          : 'text-gray-400 group-hover:text-gray-600'
      }`}>
        {getSortIcon()}
      </span>
    </button>
  );
};

export default SortableHeader;