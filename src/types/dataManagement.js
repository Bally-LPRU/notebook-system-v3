/**
 * Data Management Types
 * 
 * Types and enums for the Data Management Console
 * Requirements: 5.1, 6.1, 7.1
 */

/**
 * Export format types
 */
export const EXPORT_FORMAT = {
  CSV: 'csv',
  JSON: 'json'
};

/**
 * Data types for export/import/delete operations
 */
export const DATA_TYPE = {
  LOANS: 'loans',
  RESERVATIONS: 'reservations',
  EQUIPMENT: 'equipment'
};

/**
 * Operation status
 */
export const OPERATION_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

/**
 * Archive types
 */
export const ARCHIVE_TYPE = {
  PRE_DELETE_BACKUP: 'pre_delete_backup',
  SCHEDULED_BACKUP: 'scheduled_backup',
  MANUAL_BACKUP: 'manual_backup'
};

/**
 * @typedef {Object} DateRange
 * @property {Date} start - Start date
 * @property {Date} end - End date
 */

/**
 * @typedef {Object} ExportFilters
 * @property {string[]} [status] - Status filter values
 * @property {string[]} [category] - Category filter values
 */

/**
 * @typedef {Object} ExportOptions
 * @property {string} dataType - Data type from DATA_TYPE
 * @property {string} format - Export format from EXPORT_FORMAT
 * @property {DateRange} dateRange - Date range filter
 * @property {ExportFilters} filters - Additional filters
 * @property {boolean} includeArchived - Include archived records
 */

/**
 * @typedef {Object} ExportResult
 * @property {boolean} success - Whether export succeeded
 * @property {string} [downloadUrl] - URL to download exported file
 * @property {number} recordCount - Number of records exported
 * @property {string} format - Export format used
 * @property {Object} summary - Export summary statistics
 * @property {string} [error] - Error message if failed
 */

/**
 * @typedef {Object} ImportError
 * @property {number} index - Record index
 * @property {Object} record - The invalid record
 * @property {string[]} errors - List of validation errors
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether all data is valid
 * @property {Object[]} validRecords - Valid records
 * @property {ImportError[]} errors - Validation errors
 * @property {number} totalRecords - Total records checked
 * @property {number} validCount - Valid record count
 * @property {number} errorCount - Error count
 */

/**
 * @typedef {Object} ImportResult
 * @property {boolean} success - Whether import succeeded
 * @property {number} totalRecords - Total records in import
 * @property {number} importedRecords - Successfully imported count
 * @property {number} failedRecords - Failed record count
 * @property {ImportError[]} errors - Import errors
 * @property {string|null} rollbackId - ID for rollback if needed
 */

/**
 * @typedef {Object} DeleteOptions
 * @property {string[]} dataTypes - Data types to delete from DATA_TYPE
 * @property {DateRange} dateRange - Date range filter
 * @property {boolean} createBackup - Whether to create backup before delete
 * @property {string} confirmationPhrase - Typed confirmation phrase
 */

/**
 * @typedef {Object} DeleteResult
 * @property {boolean} success - Whether deletion succeeded
 * @property {number} deletedCount - Number of records deleted
 * @property {string|null} backupId - Backup archive ID
 * @property {string|null} auditLogId - Audit log entry ID
 * @property {string} [error] - Error message if failed
 */

/**
 * @typedef {Object} DataArchive
 * @property {string} id - Archive ID
 * @property {string} archiveType - Type from ARCHIVE_TYPE
 * @property {string[]} dataTypes - Data types included
 * @property {DateRange} dateRange - Date range of archived data
 * @property {number} recordCount - Number of records
 * @property {string} storageUrl - Cloud Storage URL
 * @property {string} createdBy - Admin ID who created
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} expiresAt - Expiration timestamp
 */

/**
 * Create export options with defaults
 * @param {Partial<ExportOptions>} data - Export options
 * @returns {ExportOptions} Complete export options
 */
export function createExportOptions(data) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  return {
    dataType: data.dataType || DATA_TYPE.LOANS,
    format: data.format || EXPORT_FORMAT.CSV,
    dateRange: data.dateRange || { start: thirtyDaysAgo, end: now },
    filters: data.filters || {},
    includeArchived: data.includeArchived || false
  };
}

/**
 * Create delete options with defaults
 * @param {Partial<DeleteOptions>} data - Delete options
 * @returns {DeleteOptions} Complete delete options
 */
export function createDeleteOptions(data) {
  const now = new Date();
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  
  return {
    dataTypes: data.dataTypes || [],
    dateRange: data.dateRange || { start: oneYearAgo, end: now },
    createBackup: data.createBackup !== false, // Default true
    confirmationPhrase: data.confirmationPhrase || ''
  };
}

/**
 * Create import result with defaults
 * @param {Partial<ImportResult>} data - Import result data
 * @returns {ImportResult} Complete import result
 */
export function createImportResult(data) {
  return {
    success: data.success || false,
    totalRecords: data.totalRecords || 0,
    importedRecords: data.importedRecords || 0,
    failedRecords: data.failedRecords || 0,
    errors: data.errors || [],
    rollbackId: data.rollbackId || null
  };
}

/**
 * Get display label for data type
 * @param {string} dataType - Data type
 * @returns {string} Display label
 */
export function getDataTypeLabel(dataType) {
  const labels = {
    [DATA_TYPE.LOANS]: 'รายการยืม',
    [DATA_TYPE.RESERVATIONS]: 'การจอง',
    [DATA_TYPE.EQUIPMENT]: 'อุปกรณ์'
  };
  return labels[dataType] || dataType;
}

/**
 * Get display label for export format
 * @param {string} format - Export format
 * @returns {string} Display label
 */
export function getFormatLabel(format) {
  const labels = {
    [EXPORT_FORMAT.CSV]: 'CSV',
    [EXPORT_FORMAT.JSON]: 'JSON'
  };
  return labels[format] || format;
}

/**
 * Get display label for operation status
 * @param {string} status - Operation status
 * @returns {string} Display label
 */
export function getStatusLabel(status) {
  const labels = {
    [OPERATION_STATUS.PENDING]: 'รอดำเนินการ',
    [OPERATION_STATUS.IN_PROGRESS]: 'กำลังดำเนินการ',
    [OPERATION_STATUS.COMPLETED]: 'เสร็จสิ้น',
    [OPERATION_STATUS.FAILED]: 'ล้มเหลว',
    [OPERATION_STATUS.CANCELLED]: 'ยกเลิก'
  };
  return labels[status] || status;
}

/**
 * Generate confirmation phrase for delete operation
 * @param {string[]} dataTypes - Data types being deleted
 * @returns {string} Required confirmation phrase
 */
export function generateConfirmationPhrase(dataTypes) {
  const typeLabels = dataTypes.map(getDataTypeLabel).join(', ');
  return `DELETE ${typeLabels}`.toUpperCase();
}

/**
 * Validate confirmation phrase
 * @param {string} input - User input
 * @param {string[]} dataTypes - Data types being deleted
 * @returns {boolean} Whether phrase matches
 */
export function validateConfirmationPhrase(input, dataTypes) {
  const expected = generateConfirmationPhrase(dataTypes);
  return input.trim().toUpperCase() === expected;
}
