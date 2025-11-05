import { XMarkIcon, BookmarkIcon, TrashIcon } from '@heroicons/react/24/outline';

const FilterPresets = ({
  presets = [],
  onLoad,
  onDelete,
  onClose
}) => {
  const formatPresetDescription = (preset) => {
    const filters = preset.filters;
    const parts = [];
    
    if (filters.search) parts.push(`ค้นหา: "${filters.search}"`);
    if (filters.categories?.length > 0) parts.push(`ประเภท: ${filters.categories.length} รายการ`);
    if (filters.statuses?.length > 0) parts.push(`สถานะ: ${filters.statuses.length} รายการ`);
    if (filters.dateRange?.start || filters.dateRange?.end) parts.push('ช่วงวันที่');
    if (filters.priceRange?.min || filters.priceRange?.max) parts.push('ช่วงราคา');
    if (filters.location?.building || filters.location?.floor || filters.location?.room) parts.push('สถานที่');
    
    return parts.length > 0 ? parts.join(', ') : 'ไม่มีตัวกรอง';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                จัดการตัวกรองที่บันทึกไว้
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Presets List */}
            <div className="space-y-3">
              {presets.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BookmarkIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>ยังไม่มีตัวกรองที่บันทึกไว้</p>
                  <p className="text-sm">บันทึกตัวกรองที่ใช้บ่อยเพื่อความสะดวก</p>
                </div>
              ) : (
                presets.map(preset => (
                  <div
                    key={preset.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <BookmarkIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {preset.name}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {formatPresetDescription(preset)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        บันทึกเมื่อ: {formatDate(preset.createdAt)}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => {
                          onLoad(preset);
                          onClose();
                        }}
                        className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                      >
                        ใช้งาน
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`ต้องการลบตัวกรอง "${preset.name}" หรือไม่?`)) {
                            onDelete(preset.id);
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="ลบตัวกรอง"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPresets;