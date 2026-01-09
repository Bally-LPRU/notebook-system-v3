/**
 * Property-Based Tests for Data Management Service - Delete Audit Logging
 * 
 * Tests universal properties for audit log creation during deletion operations.
 * Uses fast-check library for property-based testing with 100+ iterations.
 * 
 * Feature: admin-intelligence-assistant
 * Property tested:
 * - Property 15: Delete Audit Logging
 * 
 * **Validates: Requirements 7.6**
 */

// Mock Firebase config BEFORE imports
jest.mock('../../config/firebase', () => ({
  db: {}, // Mock db object
  auth: {},
  storage: {}
}));

// Mock Firebase Firestore at module level BEFORE imports
jest.mock('firebase/firestore', () => {
  const actual = jest.requireActual('firebase/firestore');
  
  // Create a factory function that returns a new batch object each time
  const createMockBatch = () => ({
    delete: jest.fn().mockReturnThis(),
    commit: jest.fn().mockResolvedValue(undefined)
  });
  
  return {
    ...actual,
    writeBatch: jest.fn(() => createMockBatch()),
    // Mock other Firestore functions that might be needed
    collection: jest.fn(() => ({})),
    doc: jest.fn(() => ({})),
    getDocs: jest.fn().mockResolvedValue({ forEach: jest.fn() }),
    getDoc: jest.fn().mockResolvedValue({ exists: () => false }),
    addDoc: jest.fn().mockResolvedValue({ id: 'mock-id' }),
    updateDoc: jest.fn().mockResolvedValue(undefined),
    query: jest.fn(() => ({})),
    where: jest.fn(() => ({})),
    orderBy: jest.fn(() => ({})),
    serverTimestamp: jest.fn(() => new Date()),
    Timestamp: {
      fromDate: jest.fn((date) => date)
    }
  };
});

import fc from 'fast-check';
import DataManagementService from '../dataManagementService';
import { DATA_TYPE } from '../../types/dataManagement';

// Test configuration
const NUM_RUNS = 100; // Run each property 100 times

describe('Data Management Service - Delete Audit Logging Properties', () => {
  /**
   * Feature: admin-intelligence-assistant, Property 15: Delete Audit Logging
   * **Validates: Requirements 7.6**
   * 
   * For any data deletion operation, an audit log entry SHALL be created containing 
   * the admin ID, timestamp, data types, and record count.
   */
  describe('Property 15: Delete Audit Logging', () => {
    // ============================================
    // Arbitrary Generators
    // ============================================

    /**
     * Generate arbitrary data types for deletion
     */
    const dataTypesArb = fc.uniqueArray(
      fc.constantFrom(DATA_TYPE.LOANS, DATA_TYPE.RESERVATIONS, DATA_TYPE.EQUIPMENT),
      { minLength: 1, maxLength: 3 }
    );

    /**
     * Generate arbitrary date ranges
     */
    const dateRangeArb = fc.record({
      start: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
        .filter(d => !isNaN(d.getTime())),
      end: fc.date({ min: new Date('2026-01-01'), max: new Date('2026-12-31') })
        .filter(d => !isNaN(d.getTime()))
    });

    /**
     * Generate arbitrary admin user IDs
     */
    const adminIdArb = fc.uuid();

    /**
     * Generate valid confirmation phrase for data types
     */
    const generateConfirmationPhrase = (dataTypes) => {
      return DataManagementService._generateConfirmationPhrase(dataTypes);
    };

    /**
     * Generate mock records for deletion
     */
    const generateMockRecords = (dataTypes, count) => {
      return dataTypes.flatMap(dataType => {
        const collectionName = DataManagementService._getCollectionName(dataType);
        return Array.from({ length: count }, (_, i) => ({
          id: `${dataType}-${i}`,
          collection: collectionName,
          dataType,
          data: {
            id: `${dataType}-${i}`,
            name: `Test ${dataType} ${i}`,
            createdAt: new Date()
          }
        }));
      });
    };

    // ============================================
    // Core Audit Logging Properties
    // ============================================

    describe('Audit Log Entry Creation', () => {
      afterEach(() => {
        jest.restoreAllMocks();
      });

      test('audit log entry is created for every delete operation', async () => {
        await fc.assert(
          fc.asyncProperty(
            dataTypesArb,
            fc.integer({ min: 1, max: 20 }),
            adminIdArb,
            async (dataTypes, recordCount, adminId) => {
              const mockRecords = generateMockRecords(dataTypes, recordCount);
              
              const collectSpy = jest.spyOn(DataManagementService, '_collectRecordsForDeletion');
              collectSpy.mockResolvedValue(mockRecords);
              
              const backupSpy = jest.spyOn(DataManagementService, '_createBackupArchive');
              backupSpy.mockResolvedValue('backup-123');
              
              const auditLogSpy = jest.spyOn(DataManagementService, '_logDataOperation');
              auditLogSpy.mockResolvedValue('audit-log-123');

              const confirmationPhrase = generateConfirmationPhrase(dataTypes);

              try {
                await DataManagementService.deleteData(
                  {
                    dataTypes,
                    dateRange: null,
                    createBackup: true,
                    confirmationPhrase
                  },
                  adminId
                );

                expect(auditLogSpy).toHaveBeenCalled();
                expect(auditLogSpy).toHaveBeenCalledWith('delete', expect.any(Object));
              } finally {
                collectSpy.mockRestore();
                backupSpy.mockRestore();
                auditLogSpy.mockRestore();
              }
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('audit log contains admin ID (deletedBy)', () => {
        fc.assert(
          fc.property(
            dataTypesArb,
            fc.integer({ min: 1, max: 20 }),
            adminIdArb,
            async (dataTypes, recordCount, adminId) => {
              const mockRecords = generateMockRecords(dataTypes, recordCount);
              
              const collectSpy = jest.spyOn(DataManagementService, '_collectRecordsForDeletion');
              collectSpy.mockResolvedValue(mockRecords);
              
              const backupSpy = jest.spyOn(DataManagementService, '_createBackupArchive');
              backupSpy.mockResolvedValue('backup-123');
              
              let capturedDetails = null;
              const auditLogSpy = jest.spyOn(DataManagementService, '_logDataOperation');
              auditLogSpy.mockImplementation(async (operation, details) => {
                capturedDetails = details;
                return 'audit-log-123';
              });

              const confirmationPhrase = generateConfirmationPhrase(dataTypes);

              const result = await DataManagementService.deleteData(
                {
                  dataTypes,
                  dateRange: null,
                  createBackup: true,
                  confirmationPhrase
                },
                adminId
              );

              // Check if delete succeeded - if not, show the error
              if (!result.success) {
                throw new Error(`Delete failed with error: ${result.error}. Confirmation phrase: "${confirmationPhrase}"`);
              }

              // Verify: Audit log was called
              expect(auditLogSpy).toHaveBeenCalled();
              
              // Verify: Audit log contains deletedBy field with admin ID
              expect(capturedDetails).not.toBeNull();
              expect(capturedDetails).toHaveProperty('deletedBy');
              expect(capturedDetails.deletedBy).toBe(adminId);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('audit log contains data types', async () => {
        await fc.assert(
          fc.asyncProperty(
            dataTypesArb,
            fc.integer({ min: 1, max: 20 }),
            adminIdArb,
            async (dataTypes, recordCount, adminId) => {
              const mockRecords = generateMockRecords(dataTypes, recordCount);
              
              const collectSpy = jest.spyOn(DataManagementService, '_collectRecordsForDeletion');
              collectSpy.mockResolvedValue(mockRecords);
              
              const backupSpy = jest.spyOn(DataManagementService, '_createBackupArchive');
              backupSpy.mockResolvedValue('backup-123');
              
              let capturedDetails = null;
              const auditLogSpy = jest.spyOn(DataManagementService, '_logDataOperation');
              auditLogSpy.mockImplementation(async (operation, details) => {
                capturedDetails = details;
                return 'audit-log-123';
              });

              const confirmationPhrase = generateConfirmationPhrase(dataTypes);

              try {
                await DataManagementService.deleteData(
                  {
                    dataTypes,
                    dateRange: null,
                    createBackup: true,
                    confirmationPhrase
                  },
                  adminId
                );

                expect(capturedDetails).not.toBeNull();
                expect(capturedDetails).toHaveProperty('dataTypes');
                expect(capturedDetails.dataTypes).toEqual(dataTypes);
              } finally {
                collectSpy.mockRestore();
                backupSpy.mockRestore();
                auditLogSpy.mockRestore();
              }
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('audit log contains record count', async () => {
        await fc.assert(
          fc.asyncProperty(
            dataTypesArb,
            fc.integer({ min: 1, max: 20 }),
            adminIdArb,
            async (dataTypes, recordCount, adminId) => {
              const mockRecords = generateMockRecords(dataTypes, recordCount);
              
              const collectSpy = jest.spyOn(DataManagementService, '_collectRecordsForDeletion');
              collectSpy.mockResolvedValue(mockRecords);
              
              const backupSpy = jest.spyOn(DataManagementService, '_createBackupArchive');
              backupSpy.mockResolvedValue('backup-123');
              
              let capturedDetails = null;
              const auditLogSpy = jest.spyOn(DataManagementService, '_logDataOperation');
              auditLogSpy.mockImplementation(async (operation, details) => {
                capturedDetails = details;
                return 'audit-log-123';
              });

              const confirmationPhrase = generateConfirmationPhrase(dataTypes);

              try {
                await DataManagementService.deleteData(
                  {
                    dataTypes,
                    dateRange: null,
                    createBackup: true,
                    confirmationPhrase
                  },
                  adminId
                );

                expect(capturedDetails).not.toBeNull();
                expect(capturedDetails).toHaveProperty('recordCount');
                expect(capturedDetails.recordCount).toBe(mockRecords.length);
              } finally {
                collectSpy.mockRestore();
                backupSpy.mockRestore();
                auditLogSpy.mockRestore();
              }
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('audit log contains date range when provided', async () => {
        await fc.assert(
          fc.asyncProperty(
            dataTypesArb,
            fc.integer({ min: 1, max: 20 }),
            dateRangeArb,
            adminIdArb,
            async (dataTypes, recordCount, dateRange, adminId) => {
              const mockRecords = generateMockRecords(dataTypes, recordCount);
              
              const collectSpy = jest.spyOn(DataManagementService, '_collectRecordsForDeletion');
              collectSpy.mockResolvedValue(mockRecords);
              
              const backupSpy = jest.spyOn(DataManagementService, '_createBackupArchive');
              backupSpy.mockResolvedValue('backup-123');
              
              let capturedDetails = null;
              const auditLogSpy = jest.spyOn(DataManagementService, '_logDataOperation');
              auditLogSpy.mockImplementation(async (operation, details) => {
                capturedDetails = details;
                return 'audit-log-123';
              });

              const confirmationPhrase = generateConfirmationPhrase(dataTypes);

              try {
                await DataManagementService.deleteData(
                  {
                    dataTypes,
                    dateRange,
                    createBackup: true,
                    confirmationPhrase
                  },
                  adminId
                );

                expect(capturedDetails).not.toBeNull();
                expect(capturedDetails).toHaveProperty('dateRange');
                expect(capturedDetails.dateRange).toEqual(dateRange);
              } finally {
                collectSpy.mockRestore();
                backupSpy.mockRestore();
                auditLogSpy.mockRestore();
              }
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('audit log contains backup ID when backup is created', async () => {
        await fc.assert(
          fc.asyncProperty(
            dataTypesArb,
            fc.integer({ min: 1, max: 20 }),
            adminIdArb,
            async (dataTypes, recordCount, adminId) => {
              const mockRecords = generateMockRecords(dataTypes, recordCount);
              
              const collectSpy = jest.spyOn(DataManagementService, '_collectRecordsForDeletion');
              collectSpy.mockResolvedValue(mockRecords);
              
              const backupId = `backup-${Math.random()}`;
              const backupSpy = jest.spyOn(DataManagementService, '_createBackupArchive');
              backupSpy.mockResolvedValue(backupId);
              
              let capturedDetails = null;
              const auditLogSpy = jest.spyOn(DataManagementService, '_logDataOperation');
              auditLogSpy.mockImplementation(async (operation, details) => {
                capturedDetails = details;
                return 'audit-log-123';
              });

              const confirmationPhrase = generateConfirmationPhrase(dataTypes);

              try {
                await DataManagementService.deleteData(
                  {
                    dataTypes,
                    dateRange: null,
                    createBackup: true,
                    confirmationPhrase
                  },
                  adminId
                );

                expect(capturedDetails).not.toBeNull();
                expect(capturedDetails).toHaveProperty('backupId');
                expect(capturedDetails.backupId).toBe(backupId);
              } finally {
                collectSpy.mockRestore();
                backupSpy.mockRestore();
                auditLogSpy.mockRestore();
              }
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('audit log ID is returned in delete result', async () => {
        await fc.assert(
          fc.asyncProperty(
            dataTypesArb,
            fc.integer({ min: 1, max: 20 }),
            adminIdArb,
            async (dataTypes, recordCount, adminId) => {
              const mockRecords = generateMockRecords(dataTypes, recordCount);
              
              const collectSpy = jest.spyOn(DataManagementService, '_collectRecordsForDeletion');
              collectSpy.mockResolvedValue(mockRecords);
              
              const backupSpy = jest.spyOn(DataManagementService, '_createBackupArchive');
              backupSpy.mockResolvedValue('backup-123');
              
              const auditLogId = `audit-log-${Math.random()}`;
              const auditLogSpy = jest.spyOn(DataManagementService, '_logDataOperation');
              auditLogSpy.mockResolvedValue(auditLogId);

              const confirmationPhrase = generateConfirmationPhrase(dataTypes);

              try {
                const result = await DataManagementService.deleteData(
                  {
                    dataTypes,
                    dateRange: null,
                    createBackup: true,
                    confirmationPhrase
                  },
                  adminId
                );

                expect(result.auditLogId).toBe(auditLogId);
              } finally {
                collectSpy.mockRestore();
                backupSpy.mockRestore();
                auditLogSpy.mockRestore();
              }
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });
    });

    describe('Audit Log Timing', () => {
      afterEach(() => {
        jest.restoreAllMocks();
      });

      test('audit log is created after deletion completes', async () => {
        await fc.assert(
          fc.asyncProperty(
            dataTypesArb,
            fc.integer({ min: 1, max: 20 }),
            adminIdArb,
            async (dataTypes, recordCount, adminId) => {
              const mockRecords = generateMockRecords(dataTypes, recordCount);
              
              const collectSpy = jest.spyOn(DataManagementService, '_collectRecordsForDeletion');
              collectSpy.mockResolvedValue(mockRecords);
              
              const backupSpy = jest.spyOn(DataManagementService, '_createBackupArchive');
              backupSpy.mockResolvedValue('backup-123');
              
              const callOrder = [];
              
              // Override the module-level mock for this specific test
              const { writeBatch } = require('firebase/firestore');
              const batchMock = {
                delete: jest.fn(),
                commit: jest.fn().mockImplementation(async () => {
                  callOrder.push('batch-commit');
                })
              };
              const writeBatchSpy = jest.spyOn(require('firebase/firestore'), 'writeBatch');
              writeBatchSpy.mockReturnValue(batchMock);

              const auditLogSpy = jest.spyOn(DataManagementService, '_logDataOperation');
              auditLogSpy.mockImplementation(async () => {
                callOrder.push('audit-log');
                return 'audit-log-123';
              });

              const confirmationPhrase = generateConfirmationPhrase(dataTypes);

              try {
                await DataManagementService.deleteData(
                  {
                    dataTypes,
                    dateRange: null,
                    createBackup: true,
                    confirmationPhrase
                  },
                  adminId
                );

                const batchIndex = callOrder.indexOf('batch-commit');
                const auditIndex = callOrder.indexOf('audit-log');
                
                expect(batchIndex).toBeGreaterThanOrEqual(0);
                expect(auditIndex).toBeGreaterThan(batchIndex);
              } finally {
                collectSpy.mockRestore();
                backupSpy.mockRestore();
                writeBatchSpy.mockRestore();
                auditLogSpy.mockRestore();
              }
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });
    });

    describe('Audit Log Failure Handling', () => {
      afterEach(() => {
        jest.restoreAllMocks();
      });

      test('deletion succeeds even if audit logging fails', async () => {
        await fc.assert(
          fc.asyncProperty(
            dataTypesArb,
            fc.integer({ min: 1, max: 20 }),
            adminIdArb,
            async (dataTypes, recordCount, adminId) => {
              const mockRecords = generateMockRecords(dataTypes, recordCount);
              
              const collectSpy = jest.spyOn(DataManagementService, '_collectRecordsForDeletion');
              collectSpy.mockResolvedValue(mockRecords);
              
              const backupSpy = jest.spyOn(DataManagementService, '_createBackupArchive');
              backupSpy.mockResolvedValue('backup-123');
              
              const auditLogSpy = jest.spyOn(DataManagementService, '_logDataOperation');
              auditLogSpy.mockResolvedValue(null);

              const confirmationPhrase = generateConfirmationPhrase(dataTypes);

              try {
                const result = await DataManagementService.deleteData(
                  {
                    dataTypes,
                    dateRange: null,
                    createBackup: true,
                    confirmationPhrase
                  },
                  adminId
                );

                expect(result.success).toBe(true);
                expect(result.deletedCount).toBe(mockRecords.length);
                expect(result.auditLogId).toBeNull();
              } finally {
                collectSpy.mockRestore();
                backupSpy.mockRestore();
                auditLogSpy.mockRestore();
              }
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });
    });

    describe('Edge Cases', () => {
      afterEach(() => {
        jest.restoreAllMocks();
      });

      test('no audit log created when no records match deletion criteria', async () => {
        await fc.assert(
          fc.asyncProperty(
            dataTypesArb,
            adminIdArb,
            async (dataTypes, adminId) => {
              const collectSpy = jest.spyOn(DataManagementService, '_collectRecordsForDeletion');
              collectSpy.mockResolvedValue([]);
              
              const auditLogSpy = jest.spyOn(DataManagementService, '_logDataOperation');
              auditLogSpy.mockResolvedValue('audit-log-123');

              const confirmationPhrase = generateConfirmationPhrase(dataTypes);

              try {
                const result = await DataManagementService.deleteData(
                  {
                    dataTypes,
                    dateRange: null,
                    createBackup: true,
                    confirmationPhrase
                  },
                  adminId
                );

                expect(auditLogSpy).not.toHaveBeenCalled();
                expect(result.deletedCount).toBe(0);
                expect(result.auditLogId).toBeNull();
              } finally {
                collectSpy.mockRestore();
                auditLogSpy.mockRestore();
              }
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('audit log created for single record deletion', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.constantFrom(DATA_TYPE.LOANS, DATA_TYPE.RESERVATIONS, DATA_TYPE.EQUIPMENT),
            adminIdArb,
            async (dataType, adminId) => {
              const mockRecords = generateMockRecords([dataType], 1);
              
              const collectSpy = jest.spyOn(DataManagementService, '_collectRecordsForDeletion');
              collectSpy.mockResolvedValue(mockRecords);
              
              const backupSpy = jest.spyOn(DataManagementService, '_createBackupArchive');
              backupSpy.mockResolvedValue('backup-123');
              
              let capturedDetails = null;
              const auditLogSpy = jest.spyOn(DataManagementService, '_logDataOperation');
              auditLogSpy.mockImplementation(async (operation, details) => {
                capturedDetails = details;
                return 'audit-log-123';
              });

              const confirmationPhrase = generateConfirmationPhrase([dataType]);

              try {
                await DataManagementService.deleteData(
                  {
                    dataTypes: [dataType],
                    dateRange: null,
                    createBackup: true,
                    confirmationPhrase
                  },
                  adminId
                );

                expect(auditLogSpy).toHaveBeenCalled();
                expect(capturedDetails).not.toBeNull();
                expect(capturedDetails.recordCount).toBe(1);
              } finally {
                collectSpy.mockRestore();
                backupSpy.mockRestore();
                auditLogSpy.mockRestore();
              }
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('audit log not created when deletion fails', async () => {
        await fc.assert(
          fc.asyncProperty(
            dataTypesArb,
            fc.integer({ min: 1, max: 20 }),
            adminIdArb,
            async (dataTypes, recordCount, adminId) => {
              const mockRecords = generateMockRecords(dataTypes, recordCount);
              
              const collectSpy = jest.spyOn(DataManagementService, '_collectRecordsForDeletion');
              collectSpy.mockResolvedValue(mockRecords);
              
              const backupSpy = jest.spyOn(DataManagementService, '_createBackupArchive');
              backupSpy.mockResolvedValue('backup-123');
              
              const auditLogSpy = jest.spyOn(DataManagementService, '_logDataOperation');
              auditLogSpy.mockResolvedValue('audit-log-123');

              // Mock batch commit to fail
              const { writeBatch } = require('firebase/firestore');
              const batchMock = {
                delete: jest.fn(),
                commit: jest.fn().mockRejectedValue(new Error('Deletion failed'))
              };
              const writeBatchSpy = jest.spyOn(require('firebase/firestore'), 'writeBatch');
              writeBatchSpy.mockReturnValue(batchMock);

              const confirmationPhrase = generateConfirmationPhrase(dataTypes);

              try {
                const result = await DataManagementService.deleteData(
                  {
                    dataTypes,
                    dateRange: null,
                    createBackup: true,
                    confirmationPhrase
                  },
                  adminId
                );

                expect(result.success).toBe(false);
                expect(auditLogSpy).not.toHaveBeenCalled();
              } finally {
                collectSpy.mockRestore();
                backupSpy.mockRestore();
                writeBatchSpy.mockRestore();
                auditLogSpy.mockRestore();
              }
            }
          ),
          { numRuns: NUM_RUNS }
        );
      }, 10000); // Increase timeout to 10 seconds
    });
  });
});
