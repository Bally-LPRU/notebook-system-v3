/**
 * Settings Audit Log Viewer Component
 * Provides filtering and pagination for settings audit logs
 * Requirements: 8.4
 */

import React, { useState, useEffect } from 'react';

const SettingsAuditLogViewer = ({ auditLogs, onFilterChange, loading }) => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    adminId: '',
    settingType: '',
    limit: 50
  });

  const [admins, setAdmins] = useState([]);
  const [settingTypes, setSettingTypes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Extract unique admins and setting types from audit logs
  useEffect(() => {
    if (auditLogs && auditLogs.length > 0) {
      const uniqueAdmins = [...new Set(auditLogs.map(log => log.adminId))];
      const uniqueSettingTypes = [...new Set(auditLogs.map(log => log.settingType))];
      
      setAdmins(uniqueAdmins);
      setSettingTypes(uniqueSettingTypes);
    }
  }, [auditLogs]);

  const handleFilterChange = (key, value) => {
    const newFilters = {
      ...filters,
      [key]: value
    };
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
    
    // Convert date strings to Date objects for the service
    const processedFilters = {
      ...newFilters,
      startDate: newFilters.startDate ? new Date(newFilters.startDate) : undefined,
      endDate: newFilters.endDate ? new Date(newFilters.endDate) : undefined,
      adminId: newFilters.adminId || undefined,
      settingType: newFilters.settingType || undefined,
      limit: parseInt(newFilters.limit) || 50
    };
    
    // Remove undefined values
    Object.keys(processedFilters).forEach(key => 
      processedFilters[key] === undefined && delete processedFilters[key]
    );
    
    onFilterChange(processedFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      startDate: '',
      endDate: '',
      adminId: '',
      settingType: '',
      limit: 50
    };
    setFilters(clearedFilters);
    setCurrentPage(1);
    onFilterChange({});
  };

  // Pagination
  const totalPages = Math.ceil(auditLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLogs = auditLogs.slice(startIndex, endIndex);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Section */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Filters</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Date Range Start */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date Range End */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Administrator Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Administrator
            </label>
            <select
              value={filters.adminId}
              onChange={(e) => handleFilterChange('adminId', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Admins</option>
              {admins.map((adminId) => (
                <option key={adminId} value={adminId}>
                  {adminId}
                </option>
              ))}
            </select>
          </div>

          {/* Setting Type Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Setting Type
            </label>
            <select
              value={filters.settingType}
              onChange={(e) => handleFilterChange('settingType', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              {settingTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Limit */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Results Limit
            </label>
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          Showing {startIndex + 1} to {Math.min(endIndex, auditLogs.length)} of {auditLogs.length} entries
        </div>
        {loading && (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span>Loading...</span>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex items-center space-x-1">
            {[...Array(totalPages)].map((_, index) => {
              const page = index + 1;
              // Show first page, last page, current page, and pages around current
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-3 py-1 text-sm font-medium rounded-md ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (
                page === currentPage - 2 ||
                page === currentPage + 2
              ) {
                return <span key={page} className="px-2 text-gray-500">...</span>;
              }
              return null;
            })}
          </div>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default SettingsAuditLogViewer;
