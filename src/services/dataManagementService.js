/**
 * Data Management Service
 * 
 * Service for managing data export, import, and deletion operations.
 * Provides functionality for admin data management console.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.6, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7
 */

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  EXPORT_FORMAT, 
  DATA_TYPE, 
  ARCHIVE_TYPE,
  createExportOptions,
  createDeleteOptions,
  createImportResult
} from '../types/dataManagement';

class DataManagementService {
  static ARCHIVES_COLLECTION = 'dataArchives';
  static LOANS_COLLECTION = 'loanRequests';
  static RESERVATIONS_COLLECTION = 'reservations';
  static EQUIPMENT_COLLECTION = 'equipmentManagement';
  static AUDIT_LOG_COLLECTION = 'dataManagementAuditLog';

  // ============================================
  // Validation Functions (Requirements 6.2, 6.3)
  // ============================================

  /**
   * Required fields for each data type
   */
  static REQUIRED_FIELDS = {
    [DATA_TYPE.EQUIPMENT]: ['name', 'category'],
    [DATA_TYPE.LOANS]: ['equipmentId', 'userId', 'borrowDate', 'expectedReturnDate'],
    [DATA_TYPE.RESERVATIONS]: ['equipmentId', 'userId', 'startTime', 'endTime']
  };

  /**
   * Validate a single record based on data type
   * @param {Object} record - Record to validate
   * @param {string} dataType - Type of data from DATA_TYPE
   * @returns {string[]} Array of validation error messages
   */
  static validateRecord(record, dataType) {
    const errors = [];
    const requiredFields = this.REQUIRED_FIELDS[dataType] || [];

    // Check required fields
    for (const field of requiredFields) {
      if (record[field] === undefined || record[field] === null || record[field] === '') {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Type-specific validation
    switch (dataType) {
      case DATA_TYPE.EQUIPMENT:
        if (record.name && typeof record.name !== 'string') {
          errors.push('Field "name" must be a string');
        }
        if (record.category && typeof record.category !== 'string') {
          errors.push('Field "category" must be a string');
        }
        break;

      case DATA_TYPE.LOANS:
        if (record.borrowDate && !this._isValidDate(record.borrowDate)) {
          errors.push('Field "borrowDate" must be a valid date');
        }
        if (record.expectedReturnDate && !this._isValidDate(record.expectedReturnDate)) {
          errors.push('Field "expectedReturnDate" must be a valid date');
        }
        if (record.borrowDate && record.expectedReturnDate) {
          const borrowDate = new Date(record.borrowDate);
          const returnDate = new Date(record.expectedReturnDate);
          if (returnDate <= borrowDate) {
            errors.push('expectedReturnDate must be after borrowDate');
          }
        }
        break;

      case DATA_TYPE.RESERVATIONS:
        if (record.startTime && !this._isValidDate(record.startTime)) {
          errors.push('Field "startTime" must be a valid date');
        }
        if (record.endTime && !this._isValidDate(record.endTime)) {
          errors.push('Field "endTime" must be a valid date');
        }
        if (record.startTime && record.endTime) {
          const startTime = new Date(record.startTime);
          const endTime = new Date(record.endTime);
          if (endTime <= startTime) {
            errors.push('endTime must be after startTime');
          }
        }
        break;

      default:
        // No additional validation for unknown types
        break;
    }

    return errors;
  }

  /**
   * Validate import data
   * Requirement: 6.2
   * 
   * @param {Object[]} data - Array of records to validate
   * @param {string} dataType - Type of data from DATA_TYPE
   * @returns {Object} ValidationResult with isValid, validRecords, errors, counts
   */
  static validateImportData(data, dataType) {
    if (!Array.isArray(data)) {
      return {
        isValid: false,
        validRecords: [],
        errors: [{ index: -1, record: null, errors: ['Data must be an array'] }],
        totalRecords: 0,
        validCount: 0,
        errorCount: 1
      };
    }

    const errors = [];
    const validRecords = [];

    data.forEach((record, index) => {
      const recordErrors = this.validateRecord(record, dataType);
      if (recordErrors.length > 0) {
        errors.push({ index, record, errors: recordErrors });
      } else {
        validRecords.push(record);
      }
    });

    return {
      isValid: errors.length === 0,
      validRecords,
      errors,
      totalRecords: data.length,
      validCount: validRecords.length,
      errorCount: errors.length
    };
  }

  /**
   * Check if value is a valid date
   * @param {*} value - Value to check
   * @returns {boolean} True if valid date
   */
  static _isValidDate(value) {
    if (!value) return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  // ============================================
  // CSV/JSON Conversion Functions (Requirement 5.2)
  // ============================================

  /**
   * Escape a field value for CSV format
   * @param {*} value - Value to escape
   * @returns {string} Escaped CSV field
   */
  static escapeCSVField(value) {
    if (value === null || value === undefined) {
      return '';
    }

    // Convert to string
    let stringValue = String(value);

    // Handle objects and arrays
    if (typeof value === 'object') {
      stringValue = JSON.stringify(value);
    }

    // Check if escaping is needed
    const needsEscaping = stringValue.includes(',') || 
                          stringValue.includes('"') || 
                          stringValue.includes('\n') ||
                          stringValue.includes('\r');

    if (needsEscaping) {
      // Escape double quotes by doubling them
      stringValue = stringValue.replace(/"/g, '""');
      // Wrap in double quotes
      return `"${stringValue}"`;
    }

    return stringValue;
  }

  /**
   * Convert data array to CSV format
   * Requirement: 5.2
   * 
   * @param {Object[]} data - Array of data objects
   * @param {string[]} fields - Fields to include in CSV
   * @returns {string} CSV formatted string
   */
  static convertToCSV(data, fields) {
    if (!Array.isArray(data) || data.length === 0) {
      return fields ? fields.join(',') : '';
    }

    // If fields not provided, extract from first record
    const csvFields = fields || Object.keys(data[0]);

    // Create header row
    const header = csvFields.join(',');

    // Create data rows
    const rows = data.map(record => 
      csvFields.map(field => this.escapeCSVField(record[field])).join(',')
    );

    return [header, ...rows].join('\n');
  }

  /**
   * Convert data array to JSON format
   * Requirement: 5.2
   * 
   * @param {Object[]} data - Array of data objects
   * @returns {string} JSON formatted string
   */
  static convertToJSON(data) {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Parse CSV string to data array
   * @param {string} csvString - CSV formatted string
   * @returns {Object[]} Array of data objects
   */
  static parseCSV(csvString) {
    if (!csvString || typeof csvString !== 'string') {
      return [];
    }

    const lines = csvString.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      return [];
    }

    // Parse header
    const headers = this._parseCSVLine(lines[0]);

    // Parse data rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this._parseCSVLine(lines[i]);
      const record = {};
      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });
      data.push(record);
    }

    return data;
  }

  /**
   * Parse a single CSV line handling quoted fields
   * @param {string} line - CSV line
   * @returns {string[]} Array of field values
   */
  static _parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (inQuotes) {
        if (char === '"' && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else if (char === '"') {
          // End of quoted field
          inQuotes = false;
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          // Start of quoted field
          inQuotes = true;
        } else if (char === ',') {
          // Field separator
          result.push(current);
          current = '';
        } else {
          current += char;
        }
      }
    }

    // Add last field
    result.push(current);

    return result;
  }

  /**
   * Parse JSON string to data array
   * @param {string} jsonString - JSON formatted string
   * @returns {Object[]} Array of data objects
   */
  static parseJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      return Array.isArray(data) ? data : [data];
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return [];
    }
  }


  // ============================================
  // Data Export Functions (Requirements 5.1, 5.3, 5.4, 5.6)
  // ============================================

  /**
   * Get collection name for data type
   * @param {string} dataType - Data type from DATA_TYPE
   * @returns {string} Firestore collection name
   */
  static _getCollectionName(dataType) {
    switch (dataType) {
      case DATA_TYPE.LOANS:
        return this.LOANS_COLLECTION;
      case DATA_TYPE.RESERVATIONS:
        return this.RESERVATIONS_COLLECTION;
      case DATA_TYPE.EQUIPMENT:
        return this.EQUIPMENT_COLLECTION;
      default:
        throw new Error(`Unknown data type: ${dataType}`);
    }
  }

  /**
   * Get export fields for data type
   * Requirement: 5.4
   * 
   * @param {string} dataType - Data type from DATA_TYPE
   * @returns {string[]} Array of field names to export
   */
  static getExportFields(dataType) {
    switch (dataType) {
      case DATA_TYPE.LOANS:
        return [
          'id', 'equipmentId', 'equipmentName', 'equipmentNumber',
          'userId', 'userName', 'userEmail', 'userDepartment',
          'status', 'purpose', 'notes',
          'borrowDate', 'expectedReturnDate', 'actualReturnDate',
          'approvedBy', 'approvedAt', 'rejectionReason',
          'createdAt', 'updatedAt'
        ];
      case DATA_TYPE.RESERVATIONS:
        return [
          'id', 'equipmentId', 'equipmentName',
          'userId', 'userName', 'userEmail',
          'status', 'purpose', 'notes',
          'startTime', 'endTime',
          'approvedBy', 'approvedAt',
          'createdAt', 'updatedAt'
        ];
      case DATA_TYPE.EQUIPMENT:
        return [
          'id', 'name', 'equipmentNumber', 'serialNumber',
          'category', 'brand', 'model',
          'status', 'condition', 'location',
          'purchaseDate', 'purchasePrice', 'warrantyExpiry',
          'description', 'notes',
          'isActive', 'createdAt', 'updatedAt'
        ];
      default:
        return ['id'];
    }
  }

  /**
   * Convert Firestore timestamp to ISO string
   * @param {*} value - Value to convert
   * @returns {string|null} ISO date string or null
   */
  static _timestampToISO(value) {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString();
    if (typeof value.toDate === 'function') return value.toDate().toISOString();
    if (typeof value === 'string') return value;
    if (typeof value.seconds === 'number') {
      return new Date(value.seconds * 1000).toISOString();
    }
    return null;
  }

  /**
   * Flatten record for export (handle nested objects and timestamps)
   * @param {Object} record - Record to flatten
   * @param {string} dataType - Data type
   * @returns {Object} Flattened record
   */
  static _flattenRecordForExport(record, dataType) {
    const flattened = { id: record.id };
    const fields = this.getExportFields(dataType);

    for (const field of fields) {
      if (field === 'id') continue;

      let value = record[field];

      // Handle nested snapshot fields
      if (value === undefined) {
        if (field === 'equipmentName' && record.equipmentSnapshot) {
          value = record.equipmentSnapshot.name;
        } else if (field === 'userName' && record.userSnapshot) {
          value = record.userSnapshot.displayName;
        } else if (field === 'userEmail' && record.userSnapshot) {
          value = record.userSnapshot.email;
        }
      }

      // Convert timestamps to ISO strings
      if (field.includes('Date') || field.includes('At') || field.includes('Time')) {
        value = this._timestampToISO(value);
      }

      flattened[field] = value;
    }

    return flattened;
  }

  /**
   * Export data with filters
   * Requirements: 5.1, 5.3, 5.4, 5.6
   * 
   * @param {Object} options - Export options
   * @returns {Promise<Object>} ExportResult with data, summary, and download info
   */
  static async exportData(options) {
    try {
      const exportOptions = createExportOptions(options);
      const { dataType, format, dateRange, filters } = exportOptions;

      // Get collection reference
      const collectionName = this._getCollectionName(dataType);
      const collectionRef = collection(db, collectionName);

      // Build query with filters
      const queryConstraints = [];

      // Date range filter (Requirement 5.3)
      if (dateRange && dateRange.start && dateRange.end) {
        const dateField = dataType === DATA_TYPE.LOANS ? 'borrowDate' : 
                          dataType === DATA_TYPE.RESERVATIONS ? 'startTime' : 'createdAt';
        
        queryConstraints.push(
          where(dateField, '>=', Timestamp.fromDate(new Date(dateRange.start))),
          where(dateField, '<=', Timestamp.fromDate(new Date(dateRange.end)))
        );
      }

      // Status filter
      if (filters.status && filters.status.length > 0) {
        queryConstraints.push(where('status', 'in', filters.status));
      }

      // Category filter (for equipment)
      if (filters.category && filters.category.length > 0 && dataType === DATA_TYPE.EQUIPMENT) {
        queryConstraints.push(where('category', 'in', filters.category));
      }

      // Add ordering
      queryConstraints.push(orderBy('createdAt', 'desc'));

      // Execute query
      const q = query(collectionRef, ...queryConstraints);
      const querySnapshot = await getDocs(q);

      // Process records
      const records = [];
      querySnapshot.forEach((doc) => {
        const record = { id: doc.id, ...doc.data() };
        const flattened = this._flattenRecordForExport(record, dataType);
        records.push(flattened);
      });

      // Convert to requested format (Requirement 5.2)
      const fields = this.getExportFields(dataType);
      let exportedData;
      if (format === EXPORT_FORMAT.CSV) {
        exportedData = this.convertToCSV(records, fields);
      } else {
        exportedData = this.convertToJSON(records);
      }

      // Generate summary report (Requirement 5.6)
      const summary = this._generateExportSummary(records, dataType, dateRange);

      return {
        success: true,
        data: exportedData,
        recordCount: records.length,
        format,
        dataType,
        summary,
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      return {
        success: false,
        error: error.message,
        recordCount: 0,
        format: options.format,
        dataType: options.dataType
      };
    }
  }

  /**
   * Generate export summary report
   * Requirement: 5.6
   * 
   * @param {Object[]} records - Exported records
   * @param {string} dataType - Data type
   * @param {Object} dateRange - Date range used
   * @returns {Object} Summary statistics
   */
  static _generateExportSummary(records, dataType, dateRange) {
    const summary = {
      totalRecords: records.length,
      dataType,
      dateRange: {
        start: dateRange?.start ? new Date(dateRange.start).toISOString() : null,
        end: dateRange?.end ? new Date(dateRange.end).toISOString() : null
      },
      generatedAt: new Date().toISOString()
    };

    // Status breakdown
    if (dataType === DATA_TYPE.LOANS || dataType === DATA_TYPE.RESERVATIONS) {
      const statusCounts = {};
      records.forEach(record => {
        const status = record.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      summary.statusBreakdown = statusCounts;
    }

    // Category breakdown for equipment
    if (dataType === DATA_TYPE.EQUIPMENT) {
      const categoryCounts = {};
      records.forEach(record => {
        const category = record.category || 'uncategorized';
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });
      summary.categoryBreakdown = categoryCounts;
    }

    return summary;
  }


  // ============================================
  // Data Import Functions (Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6)
  // ============================================

  /**
   * Preview import data before applying
   * Requirement: 6.4
   * 
   * @param {string} fileContent - File content (CSV or JSON)
   * @param {string} format - File format from EXPORT_FORMAT
   * @param {string} dataType - Data type from DATA_TYPE
   * @returns {Object} Preview result with validation
   */
  static previewImport(fileContent, format, dataType) {
    try {
      // Parse file content
      let data;
      if (format === EXPORT_FORMAT.CSV) {
        data = this.parseCSV(fileContent);
      } else {
        data = this.parseJSON(fileContent);
      }

      // Validate data
      const validationResult = this.validateImportData(data, dataType);

      return {
        success: true,
        preview: {
          totalRecords: validationResult.totalRecords,
          validRecords: validationResult.validCount,
          invalidRecords: validationResult.errorCount,
          sampleRecords: validationResult.validRecords.slice(0, 5),
          errors: validationResult.errors.slice(0, 10) // Show first 10 errors
        },
        validationResult,
        canProceed: validationResult.validCount > 0
      };
    } catch (error) {
      console.error('Error previewing import:', error);
      return {
        success: false,
        error: error.message,
        preview: null,
        validationResult: null,
        canProceed: false
      };
    }
  }

  /**
   * Import data with validation and rollback support
   * Requirements: 6.1, 6.2, 6.3, 6.5, 6.6
   * 
   * @param {string} fileContent - File content (CSV or JSON)
   * @param {string} format - File format from EXPORT_FORMAT
   * @param {string} dataType - Data type from DATA_TYPE
   * @param {string} importedBy - UID of admin performing import
   * @returns {Promise<Object>} ImportResult
   */
  static async importData(fileContent, format, dataType, importedBy) {
    const rollbackData = [];
    let importedCount = 0;

    try {
      // Parse file content
      let data;
      if (format === EXPORT_FORMAT.CSV) {
        data = this.parseCSV(fileContent);
      } else {
        data = this.parseJSON(fileContent);
      }

      // Validate data (Requirement 6.2)
      const validationResult = this.validateImportData(data, dataType);

      // If no valid records, return early with errors (Requirement 6.3)
      if (validationResult.validCount === 0) {
        return createImportResult({
          success: false,
          totalRecords: validationResult.totalRecords,
          importedRecords: 0,
          failedRecords: validationResult.errorCount,
          errors: validationResult.errors,
          rollbackId: null
        });
      }

      // Get collection reference
      const collectionName = this._getCollectionName(dataType);
      const collectionRef = collection(db, collectionName);

      // Import valid records using batch for atomicity (Requirement 6.5)
      const batch = writeBatch(db);
      const batchSize = 500; // Firestore batch limit
      let currentBatch = batch;
      let batchCount = 0;

      for (const record of validationResult.validRecords) {
        // Prepare record for import
        const importRecord = this._prepareRecordForImport(record, dataType, importedBy);
        
        // Add to batch
        const docRef = doc(collectionRef);
        currentBatch.set(docRef, importRecord);
        
        // Track for rollback
        rollbackData.push({ id: docRef.id, collection: collectionName });
        
        batchCount++;
        importedCount++;

        // Commit batch if limit reached
        if (batchCount >= batchSize) {
          await currentBatch.commit();
          currentBatch = writeBatch(db);
          batchCount = 0;
        }
      }

      // Commit remaining records
      if (batchCount > 0) {
        await currentBatch.commit();
      }

      // Create rollback record
      const rollbackId = await this._createRollbackRecord(rollbackData, dataType, importedBy);

      // Log import operation
      await this._logDataOperation('import', {
        dataType,
        recordCount: importedCount,
        importedBy,
        rollbackId
      });

      // Return success result (Requirement 6.6)
      return createImportResult({
        success: true,
        totalRecords: validationResult.totalRecords,
        importedRecords: importedCount,
        failedRecords: validationResult.errorCount,
        errors: validationResult.errors,
        rollbackId
      });

    } catch (error) {
      console.error('Error importing data:', error);

      // Rollback on failure (Requirement 6.5)
      if (rollbackData.length > 0) {
        await this._rollbackImport(rollbackData);
      }

      return createImportResult({
        success: false,
        totalRecords: 0,
        importedRecords: 0,
        failedRecords: 0,
        errors: [{ index: -1, record: null, errors: [error.message] }],
        rollbackId: null
      });
    }
  }

  /**
   * Prepare record for import (add metadata)
   * @param {Object} record - Record to prepare
   * @param {string} dataType - Data type
   * @param {string} importedBy - UID of importer
   * @returns {Object} Prepared record
   */
  static _prepareRecordForImport(record, dataType, importedBy) {
    const prepared = { ...record };

    // Remove id field if present (will be auto-generated)
    delete prepared.id;

    // Add import metadata
    prepared.importedAt = serverTimestamp();
    prepared.importedBy = importedBy;
    prepared.createdAt = serverTimestamp();
    prepared.updatedAt = serverTimestamp();

    // Convert date strings to Timestamps
    const dateFields = ['borrowDate', 'expectedReturnDate', 'actualReturnDate', 
                        'startTime', 'endTime', 'purchaseDate', 'warrantyExpiry'];
    
    for (const field of dateFields) {
      if (prepared[field] && typeof prepared[field] === 'string') {
        const date = new Date(prepared[field]);
        if (!isNaN(date.getTime())) {
          prepared[field] = Timestamp.fromDate(date);
        }
      }
    }

    // Set default status if not provided
    if (!prepared.status) {
      switch (dataType) {
        case DATA_TYPE.EQUIPMENT:
          prepared.status = 'available';
          prepared.isActive = true;
          break;
        case DATA_TYPE.LOANS:
          prepared.status = 'pending';
          break;
        case DATA_TYPE.RESERVATIONS:
          prepared.status = 'pending';
          break;
        default:
          // No default status for unknown types
          break;
      }
    }

    return prepared;
  }

  /**
   * Create rollback record for import
   * @param {Object[]} rollbackData - Data for rollback
   * @param {string} dataType - Data type
   * @param {string} createdBy - UID of creator
   * @returns {Promise<string>} Rollback record ID
   */
  static async _createRollbackRecord(rollbackData, dataType, createdBy) {
    try {
      const rollbackRef = collection(db, 'importRollbacks');
      const docRef = await addDoc(rollbackRef, {
        dataType,
        records: rollbackData,
        createdBy,
        createdAt: serverTimestamp(),
        status: 'available',
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) // 7 days
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating rollback record:', error);
      return null;
    }
  }

  /**
   * Rollback import operation
   * Requirement: 6.5
   * 
   * @param {Object[]} rollbackData - Data to rollback
   * @returns {Promise<boolean>} Success status
   */
  static async _rollbackImport(rollbackData) {
    try {
      const batch = writeBatch(db);
      
      for (const item of rollbackData) {
        const docRef = doc(db, item.collection, item.id);
        batch.delete(docRef);
      }

      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error rolling back import:', error);
      return false;
    }
  }

  /**
   * Execute rollback by rollback ID
   * @param {string} rollbackId - Rollback record ID
   * @param {string} executedBy - UID of admin executing rollback
   * @returns {Promise<Object>} Rollback result
   */
  static async executeRollback(rollbackId, executedBy) {
    try {
      const rollbackRef = doc(db, 'importRollbacks', rollbackId);
      const rollbackDoc = await getDoc(rollbackRef);

      if (!rollbackDoc.exists()) {
        throw new Error('Rollback record not found');
      }

      const rollbackData = rollbackDoc.data();

      if (rollbackData.status !== 'available') {
        throw new Error('Rollback already executed or expired');
      }

      // Execute rollback
      const success = await this._rollbackImport(rollbackData.records);

      // Update rollback status
      await updateDoc(rollbackRef, {
        status: success ? 'executed' : 'failed',
        executedBy,
        executedAt: serverTimestamp()
      });

      // Log rollback operation
      await this._logDataOperation('rollback', {
        rollbackId,
        dataType: rollbackData.dataType,
        recordCount: rollbackData.records.length,
        executedBy,
        success
      });

      return {
        success,
        deletedCount: success ? rollbackData.records.length : 0
      };
    } catch (error) {
      console.error('Error executing rollback:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }


  // ============================================
  // Data Deletion Functions (Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7)
  // ============================================

  /**
   * Delete data with backup and audit logging
   * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7
   * 
   * @param {Object} options - Delete options
   * @param {string} deletedBy - UID of admin performing deletion
   * @returns {Promise<Object>} DeleteResult
   */
  static async deleteData(options, deletedBy) {
    const deleteOptions = createDeleteOptions(options);
    const { dataTypes, dateRange, createBackup, confirmationPhrase } = deleteOptions;

    // Validate confirmation phrase (Requirement 7.2)
    const expectedPhrase = this._generateConfirmationPhrase(dataTypes);
    if (confirmationPhrase.trim().toUpperCase() !== expectedPhrase) {
      return {
        success: false,
        error: 'Invalid confirmation phrase',
        deletedCount: 0,
        backupId: null,
        auditLogId: null
      };
    }

    let backupId = null;
    let totalDeleted = 0;
    const deletedRecords = [];

    try {
      // Collect records to delete
      const recordsToDelete = await this._collectRecordsForDeletion(dataTypes, dateRange);

      if (recordsToDelete.length === 0) {
        return {
          success: true,
          deletedCount: 0,
          backupId: null,
          auditLogId: null,
          message: 'No records found matching criteria'
        };
      }

      // Create backup before deletion (Requirement 7.3)
      if (createBackup) {
        backupId = await this._createBackupArchive(recordsToDelete, dataTypes, dateRange, deletedBy);
      }

      // Delete records in batches
      const batchSize = 500;
      for (let i = 0; i < recordsToDelete.length; i += batchSize) {
        const batch = writeBatch(db);
        const batchRecords = recordsToDelete.slice(i, i + batchSize);

        for (const record of batchRecords) {
          const docRef = doc(db, record.collection, record.id);
          batch.delete(docRef);
          deletedRecords.push(record);
        }

        await batch.commit();
        totalDeleted += batchRecords.length;
      }

      // Log deletion to audit log (Requirement 7.6)
      const auditLogId = await this._logDataOperation('delete', {
        dataTypes,
        dateRange,
        recordCount: totalDeleted,
        backupId,
        deletedBy
      });

      return {
        success: true,
        deletedCount: totalDeleted,
        backupId,
        auditLogId
      };

    } catch (error) {
      console.error('Error deleting data:', error);

      // Restore from backup on failure (Requirement 7.7)
      if (backupId && deletedRecords.length > 0) {
        try {
          await this._restoreFromBackup(backupId, deletedBy);
        } catch (restoreError) {
          console.error('Error restoring from backup:', restoreError);
          // Continue to return error result even if restore fails
        }
      }

      return {
        success: false,
        error: error.message,
        deletedCount: 0,
        backupId,
        auditLogId: null
      };
    }
  }

  /**
   * Generate confirmation phrase for deletion
   * @param {string[]} dataTypes - Data types being deleted
   * @returns {string} Required confirmation phrase
   */
  static _generateConfirmationPhrase(dataTypes) {
    const typeLabels = dataTypes.map(type => {
      switch (type) {
        case DATA_TYPE.LOANS: return 'LOANS';
        case DATA_TYPE.RESERVATIONS: return 'RESERVATIONS';
        case DATA_TYPE.EQUIPMENT: return 'EQUIPMENT';
        default: return type.toUpperCase();
      }
    });
    return `DELETE ${typeLabels.join(', ')}`;
  }

  /**
   * Collect records for deletion based on criteria
   * Requirement: 7.4
   * 
   * @param {string[]} dataTypes - Data types to delete
   * @param {Object} dateRange - Date range filter
   * @returns {Promise<Object[]>} Records to delete
   */
  static async _collectRecordsForDeletion(dataTypes, dateRange) {
    const records = [];

    for (const dataType of dataTypes) {
      const collectionName = this._getCollectionName(dataType);
      const collectionRef = collection(db, collectionName);

      // Build query with date range filter (Requirement 7.4)
      const queryConstraints = [];
      
      if (dateRange && dateRange.start && dateRange.end) {
        const dateField = dataType === DATA_TYPE.LOANS ? 'borrowDate' : 
                          dataType === DATA_TYPE.RESERVATIONS ? 'startTime' : 'createdAt';
        
        queryConstraints.push(
          where(dateField, '>=', Timestamp.fromDate(new Date(dateRange.start))),
          where(dateField, '<=', Timestamp.fromDate(new Date(dateRange.end)))
        );
      }

      const q = queryConstraints.length > 0 
        ? query(collectionRef, ...queryConstraints)
        : collectionRef;

      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((doc) => {
        records.push({
          id: doc.id,
          collection: collectionName,
          dataType,
          data: doc.data()
        });
      });
    }

    return records;
  }

  /**
   * Create backup archive before deletion
   * Requirement: 7.3
   * 
   * @param {Object[]} records - Records to backup
   * @param {string[]} dataTypes - Data types
   * @param {Object} dateRange - Date range
   * @param {string} createdBy - UID of creator
   * @returns {Promise<string>} Archive ID
   */
  static async _createBackupArchive(records, dataTypes, dateRange, createdBy) {
    try {
      const archiveData = {
        archiveType: ARCHIVE_TYPE.PRE_DELETE_BACKUP,
        dataTypes,
        dateRange: {
          start: dateRange?.start ? Timestamp.fromDate(new Date(dateRange.start)) : null,
          end: dateRange?.end ? Timestamp.fromDate(new Date(dateRange.end)) : null
        },
        recordCount: records.length,
        records: records.map(r => ({
          id: r.id,
          collection: r.collection,
          dataType: r.dataType,
          data: r.data
        })),
        createdBy,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days
        status: 'available'
      };

      const archiveRef = await addDoc(collection(db, this.ARCHIVES_COLLECTION), archiveData);
      return archiveRef.id;
    } catch (error) {
      console.error('Error creating backup archive:', error);
      throw error;
    }
  }

  /**
   * Restore data from backup archive
   * Requirement: 7.7
   * 
   * @param {string} archiveId - Archive ID
   * @param {string} restoredBy - UID of admin restoring
   * @returns {Promise<Object>} Restore result
   */
  static async _restoreFromBackup(archiveId, restoredBy) {
    try {
      const archiveRef = doc(db, this.ARCHIVES_COLLECTION, archiveId);
      const archiveDoc = await getDoc(archiveRef);

      if (!archiveDoc.exists()) {
        throw new Error('Backup archive not found');
      }

      const archiveData = archiveDoc.data();

      if (archiveData.status !== 'available') {
        throw new Error('Backup archive already used or expired');
      }

      // Restore records in batches
      const batchSize = 500;
      let restoredCount = 0;

      for (let i = 0; i < archiveData.records.length; i += batchSize) {
        const batch = writeBatch(db);
        const batchRecords = archiveData.records.slice(i, i + batchSize);

        for (const record of batchRecords) {
          const docRef = doc(db, record.collection, record.id);
          batch.set(docRef, {
            ...record.data,
            restoredAt: serverTimestamp(),
            restoredBy
          });
        }

        await batch.commit();
        restoredCount += batchRecords.length;
      }

      // Update archive status
      await updateDoc(archiveRef, {
        status: 'restored',
        restoredBy,
        restoredAt: serverTimestamp()
      });

      // Log restore operation
      await this._logDataOperation('restore', {
        archiveId,
        dataTypes: archiveData.dataTypes,
        recordCount: restoredCount,
        restoredBy
      });

      return {
        success: true,
        restoredCount
      };
    } catch (error) {
      console.error('Error restoring from backup:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Restore data from backup archive (public method)
   * @param {string} archiveId - Archive ID
   * @param {string} restoredBy - UID of admin restoring
   * @returns {Promise<Object>} Restore result
   */
  static async restoreFromBackup(archiveId, restoredBy) {
    return this._restoreFromBackup(archiveId, restoredBy);
  }

  /**
   * Get available backup archives
   * @param {Object} filters - Filter options
   * @returns {Promise<Object[]>} Available archives
   */
  static async getBackupArchives(filters = {}) {
    try {
      const archivesRef = collection(db, this.ARCHIVES_COLLECTION);
      const queryConstraints = [
        where('status', '==', 'available'),
        orderBy('createdAt', 'desc')
      ];

      if (filters.dataType) {
        queryConstraints.unshift(where('dataTypes', 'array-contains', filters.dataType));
      }

      const q = query(archivesRef, ...queryConstraints);
      const querySnapshot = await getDocs(q);

      const archives = [];
      querySnapshot.forEach((doc) => {
        archives.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return archives;
    } catch (error) {
      console.error('Error getting backup archives:', error);
      return [];
    }
  }

  // ============================================
  // Audit Logging (Requirement 7.6)
  // ============================================

  /**
   * Log data management operation
   * Requirement: 7.6
   * 
   * @param {string} operation - Operation type ('export', 'import', 'delete', 'restore', 'rollback')
   * @param {Object} details - Operation details
   * @returns {Promise<string>} Audit log entry ID
   */
  static async _logDataOperation(operation, details) {
    try {
      const logEntry = {
        operation,
        ...details,
        timestamp: serverTimestamp(),
        metadata: {
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
          timestamp: new Date().toISOString()
        }
      };

      const logRef = await addDoc(collection(db, this.AUDIT_LOG_COLLECTION), logEntry);
      return logRef.id;
    } catch (error) {
      console.error('Error logging data operation:', error);
      return null;
    }
  }

  /**
   * Get data management audit log
   * @param {Object} filters - Filter options
   * @returns {Promise<Object[]>} Audit log entries
   */
  static async getAuditLog(filters = {}) {
    try {
      const logRef = collection(db, this.AUDIT_LOG_COLLECTION);
      const queryConstraints = [orderBy('timestamp', 'desc')];

      if (filters.operation) {
        queryConstraints.unshift(where('operation', '==', filters.operation));
      }

      if (filters.userId) {
        queryConstraints.unshift(where('deletedBy', '==', filters.userId));
      }

      if (filters.limit) {
        const { limit: firestoreLimit } = require('firebase/firestore');
        queryConstraints.push(firestoreLimit(filters.limit));
      }

      const q = query(logRef, ...queryConstraints);
      const querySnapshot = await getDocs(q);

      const entries = [];
      querySnapshot.forEach((doc) => {
        entries.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return entries;
    } catch (error) {
      console.error('Error getting audit log:', error);
      return [];
    }
  }
}

export default DataManagementService;
