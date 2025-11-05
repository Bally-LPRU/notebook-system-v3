import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  EQUIPMENT_STATUS_LABELS, 
  EQUIPMENT_CATEGORY_LABELS 
} from '../../types/equipment';
import { getEquipmentStatusColor } from '../../utils/equipmentValidation';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';

const EquipmentListView = ({
  equipment = [],
  loading = false,
  error = null,
  onEdit,
  onDelete,
  onView,
  onBorrow,
  onReserve,
  isSelectable = false,
  selectedItems = [],
  onSelectItem,
  onSelectAll,
  onDeselectAll,
  pagination = {},
  onLoadMore,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  onSort
}) => {
  const { isAdmin } = useAuth();
  const [localSelectedItems, setLocalSelectedItems] = useState(selectedItems);
  const [sortConfig, setSortConfig] = useState({ field: sortBy, order: sortOrder });

  // Update local selected items when props change
  useEffect(() => {
    setLocalSelectedItems(selectedItems);
  }, [selectedItems]);

  // Update sort config when props change
  useEffect(() => {
    setSortConfig({ field: sortBy, order: sortOrder });
  }, [sortBy, sortOrder]);

  const handleSelectItem = (equipmentId, isSelected) => {
    const newSelectedItems = isSelected
      ? [...localSelectedItems, equipmentId]
      : localSelectedItems.filter(id => id !== equipmentId);
    
    setLocalSelectedItems(newSelectedItems);
    if (onSelectItem) {
      onSelectItem(equipmentId, isSelected);
    }
  };

  const handleSelectAll = () => {
    const allIds = equipment.map(item => item.id);
    setLocalSelectedItems(allIds);
    if (onSelectAll) {
      onSelectAll();
    }
  };

  const handleDeselectAll = () => {
    setLocalSelectedItems([]);
    if (onDeselectAll) {
      onDeselectAll();
    }
  };

  const handleSort = (field) => {
    const newOrder = sortConfig.field === field && sortConfig.order === 'asc' ? 'desc' : 'asc';
    setSortConfig({ field, order: newOrder });
    if (onSort) {
      onSort(field, newOrder);
    }
  };

  const handleLoadMore = () => {
    if (!loading && pagination.hasNextPage && onLoadMore) {
      onLoadMore();
    }
  };

  // Sort equipment based on current sort config
  const sortedEquipment = [...equipment].sort((a, b) => {
    let aValue = a[sortConfig.field];
    let bValue = b[sortConfig.field];

    // Handle different data types
    if (sortConfig.field === 'createdAt' || sortConfig.field === 'updatedAt') {
      aValue = aValue?.toDate?.() || aValue;
      bValue = bValue?.toDate?.() || bValue;
    }

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortConfig.order === 'desc') {
      return bValue > aValue ? 1 : -1;
    } else {
      return aValue > bValue ? 1 : -1;
    }
  });

  // Table columns configuration
  const columns = [
    { key: 'name', label: 'ชื่ออุปกรณ์', sortable: true, width: 'w-1/4' },
    { key: 'category', label: 'ประเภท', sortable: true, width: 'w-32' },
    { key: 'brand', label: 'ยี่ห้อ', sortable: true, width: 'w-32' },
    { key: 'model', label: 'รุ่น', sortable: true, width: 'w-32' },
    { key: 'serialNumber', label: 'รหัส', sortable: false, width: 'w-32' },
    { key: 'status', label: 'สถานะ', sortable: true, width: 'w-32' },
    { key: 'location', label: 'สถานที่', sortable: true, width: 'w-32' },
    { key: 'actions', label: 'การดำเนินการ', sortable: false, width: 'w-40' }
  ];

  // Render sort icon
  const renderSortIcon = (field) => {
    if (sortConfig.field !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    return sortConfig.order === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  // Loading skeleton for table
  const renderLoadingSkeleton = () => (
    <div className="animate-pulse">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="border-b border-gray-200">
          <div className="px-6 py-4 flex items-center space-x-4">
            {isSelectable && <div className="w-4 h-4 bg-gray-200 rounded"></div>}
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="w-20 h-4 bg-gray-200 rounded"></div>
            <div className="w-20 h-4 bg-gray-200 rounded"></div>
            <div className="w-20 h-4 bg-gray-200 rounded"></div>
            <div className="w-16 h-6 bg-gray-200 rounded"></div>
            <div className="w-20 h-4 bg-gray-200 rounded"></div>
            <div className="w-32 h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">เกิดข้อผิดพลาด</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!loading && equipment.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        }
        title="ไม่พบอุปกรณ์"
        description="ไม่พบอุปกรณ์ที่ตรงกับเงื่อนไขการค้นหา ลองปรับเปลี่ยนตัวกรองหรือคำค้นหา"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Bulk Selection Controls */}
      {isSelectable && equipment.length > 0 && (
        <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={localSelectedItems.length === equipment.length && equipment.length > 0}
                onChange={localSelectedItems.length === equipment.length ? handleDeselectAll : handleSelectAll}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                เลือกทั้งหมด
              </label>
            </div>
            {localSelectedItems.length > 0 && (
              <span className="text-sm text-gray-600">
                เลือกแล้ว {localSelectedItems.length} จาก {equipment.length} รายการ
              </span>
            )}
          </div>
          {localSelectedItems.length > 0 && (
            <button
              onClick={handleDeselectAll}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              ยกเลิกการเลือก
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            {/* Table Header */}
            <thead className="bg-gray-50">
              <tr>
                {isSelectable && (
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={localSelectedItems.length === equipment.length && equipment.length > 0}
                      onChange={localSelectedItems.length === equipment.length ? handleDeselectAll : handleSelectAll}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.width} ${
                      column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                    }`}
                    onClick={column.sortable ? () => handleSort(column.key) : undefined}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.label}</span>
                      {column.sortable && renderSortIcon(column.key)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && equipment.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (isSelectable ? 1 : 0)} className="px-6 py-4">
                    {renderLoadingSkeleton()}
                  </td>
                </tr>
              ) : (
                sortedEquipment.map((item) => {
                  const statusColor = getEquipmentStatusColor(item.status);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      {isSelectable && (
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={localSelectedItems.includes(item.id)}
                            onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                      )}
                      
                      {/* Equipment Name with Image */}
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            {item.imageURL ? (
                              <img
                                className="h-12 w-12 rounded-lg object-cover"
                                src={item.imageURL}
                                alt={item.name}
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 line-clamp-1">
                              {item.name}
                            </div>
                            {item.description && (
                              <div className="text-sm text-gray-500 line-clamp-1">
                                {item.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {EQUIPMENT_CATEGORY_LABELS[item.category] || item.category}
                      </td>

                      {/* Brand */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.brand}
                      </td>

                      {/* Model */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.model}
                      </td>

                      {/* Serial Number */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {item.serialNumber}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                          {EQUIPMENT_STATUS_LABELS[item.status]}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.location}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onView && onView(item)}
                            className="text-blue-600 hover:text-blue-900"
                            title="ดูรายละเอียด"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          {isAdmin ? (
                            <>
                              <button
                                onClick={() => onEdit && onEdit(item)}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="แก้ไข"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => onDelete && onDelete(item)}
                                className="text-red-600 hover:text-red-900"
                                title="ลบ"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => onBorrow && onBorrow(item)}
                                className="text-green-600 hover:text-green-900"
                                title="ขอยืม"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                              <button
                                onClick={() => onReserve && onReserve(item)}
                                className="text-yellow-600 hover:text-yellow-900"
                                title="จอง"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Load More Button */}
        {pagination.hasNextPage && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 text-center">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  กำลังโหลด...
                </>
              ) : (
                <>
                  โหลดเพิ่มเติม
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        )}

        {/* Loading Indicator for Additional Items */}
        {loading && equipment.length > 0 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 text-center">
            <div className="flex justify-center items-center">
              <LoadingSpinner size="sm" />
              <span className="ml-2 text-sm text-gray-600">กำลังโหลดเพิ่มเติม...</span>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      {equipment.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          แสดง {equipment.length} รายการ
          {pagination.hasNextPage && ' (มีรายการเพิ่มเติม)'}
          {localSelectedItems.length > 0 && ` • เลือกแล้ว ${localSelectedItems.length} รายการ`}
        </div>
      )}
    </div>
  );
};

export default EquipmentListView;