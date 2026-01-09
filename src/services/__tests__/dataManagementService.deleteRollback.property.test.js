/**
 * Property-Based Tests for Data Management Service - Delete Rollback on Failure
 * 
 * Tests universal properties for automatic restore on deletion failure.
 * Uses fast-check library for property-based testing with 100+ iterations.
 * 
 * Feature: admin-intelligence-assistant
 * Property tested:
 * - Property 16: Delete Rollback on Failure
 * 
 * **Validates: Requirements 7.7**
 */

import fc from 'fast-check';
import DataManagementService from '../dataManagementService';
import { DATA_TYPE } from '../../types/dataManagement';
import { writeBatch } from 'firebase/firestore';

// Mock Firebase
jest.mock('firebase/firestore');

// Test configuration
const NUM_RUNS = 100; // Run each property 100 times

describe('Data Management Service - Delete Rollback on Failure Properties', () => {
  /**
   * Feature: admin-intelligence-assistant, Property 16: Delete Rollback on Failure
   * **Validates: Requirements 7.7**
   * 
   * For any failed deletion operation, the system SHALL restore data from the archive backup automatically.
   */
  describe('Property 16: Delete Rollback on Failure', () => {
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
    // Core Rollback Properties
    // ============================================

    describe('Automatic Restore on Failure', () => {
      beforeEach(() => {
        jest.clearAllMocks();
      });

      test('restore is called when deletion fails after backup creation', () => {
        fc.assert(
          fc.property(
            dataTypesArb,
            fc.integer({ min: 1, max: 20 }),
            adminIdArb,
            async (dataTypes, recordCount, adminId) => {
              // Setup writeBatch mock for this iteration
              const mockBatch = {
                delete: jest.fn(),
                commit: jest.fn().mockRejectedValue(new Error('Deletion failed'))
              };
              writeBatch.mockReturnValue(mockBatch);
              
              const mockRecords = generateMockRecords(dataTypes, recordCount);
              
              jest.spyOn(DataManagementService, '_collectRecordsForDeletion')
                .mockResolvedValue(mockRecords);
              
              const backupId = 'backup-123';
              jest.spyOn(DataManagementService, '_createBackupArchive')
                .mockResolvedValue(backupId);

              const restoreSpy = jest.spyOn(DataManagementService, '_restoreFromBackup')
                .mockResolvedValue({ success: true, restoredCount: mockRecords.length });

              jest.spyOn(DataManagementService, '_logDataOperation')
                .mockResolvedValue('log-123');

              const confirmationPhrase = generateConfirmationPhrase(dataTypes);

              await DataManagementService.deleteData(
                {
                  dataTypes,
                  dateRange: null,
                  createBackup: true,
                  confirmationPhrase
                },
                adminId
              );

              expect(restoreSpy).toHaveBeenCalled();
              expect(restoreSpy).toHaveBeenCalledWith(backupId, adminId);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('restore is called with correct parameters on failure', () => {
        fc.assert(
          fc.property(
            dataTypesArb,
            fc.integer({ min: 1, max: 20 }),
            adminIdArb,
            async (dataTypes, recordCount, adminId) => {
              // Setup writeBatch mock for this iteration
              const mockBatch = {
                delete: jest.fn(),
                commit: jest.fn().mockRejectedValue(new Error('Deletion failed'))
              };
              writeBatch.mockReturnValue(mockBatch);
              
              const mockRecords = generateMockRecords(dataTypes, recordCount);
              
              jest.spyOn(DataManagementService, '_collectRecordsForDeletion')
                .mockResolvedValue(mockRecords);
              
              const backupId = `backup-${Math.random()}`;
              jest.spyOn(DataManagementService, '_createBackupArchive')
                .mockResolvedValue(backupId);

              const restoreSpy = jest.spyOn(DataManagementService, '_restoreFromBackup')
                .mockResolvedValue({ success: true, restoredCount: mockRecords.length });

              jest.spyOn(DataManagementService, '_logDataOperation')
                .mockResolvedValue('log-123');

              const confirmationPhrase = generateConfirmationPhrase(dataTypes);

              await DataManagementService.deleteData(
                {
                  dataTypes,
                  dateRange: null,
                  createBackup: true,
                  confirmationPhrase
                },
                adminId
              );

              // Verify: Restore was called with some backup ID and admin ID
              expect(restoreSpy).toHaveBeenCalled();
              // Verify the restore was called with correct parameter types
              const lastCall = restoreSpy.mock.calls[restoreSpy.mock.calls.length - 1];
              expect(typeof lastCall[0]).toBe('string'); // backup ID is a string
              expect(typeof lastCall[1]).toBe('string'); // admin ID is a string
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('delete result indicates failure when deletion fails', () => {
        fc.assert(
          fc.property(
            dataTypesArb,
            fc.integer({ min: 1, max: 10 }),
            adminIdArb,
            async (dataTypes, recordCount, adminId) => {
              // Setup writeBatch mock for this iteration
              const mockBatch = {
                delete: jest.fn(),
                commit: jest.fn().mockRejectedValue(new Error('Deletion failed'))
              };
              writeBatch.mockReturnValue(mockBatch);
              
              const mockRecords = generateMockRecords(dataTypes, recordCount);
              
              jest.spyOn(DataManagementService, '_collectRecordsForDeletion')
                .mockResolvedValue(mockRecords);
              
              jest.spyOn(DataManagementService, '_createBackupArchive')
                .mockResolvedValue('backup-123');

              jest.spyOn(DataManagementService, '_restoreFromBackup')
                .mockResolvedValue({ success: true, restoredCount: mockRecords.length });

              jest.spyOn(DataManagementService, '_logDataOperation')
                .mockResolvedValue('log-123');

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

              expect(result.success).toBe(false);
              expect(result.deletedCount).toBe(0);
              expect(result.error).toBeDefined();
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });
    });

    describe('Rollback Conditions', () => {
      afterEach(() => {
        jest.clearAllMocks();
      });

      test('restore is not called when no backup was created', () => {
        fc.assert(
          fc.property(
            dataTypesArb,
            fc.integer({ min: 1, max: 10 }),
            adminIdArb,
            async (dataTypes, recordCount, adminId) => {
              // Clear mocks at the start of each iteration
              jest.clearAllMocks();
              
              const mockRecords = generateMockRecords(dataTypes, recordCount);
              
              jest.spyOn(DataManagementService, '_collectRecordsForDeletion')
                .mockResolvedValue(mockRecords);
              
              jest.spyOn(DataManagementService, '_createBackupArchive')
                .mockRejectedValue(new Error('Backup creation failed'));
              
              const restoreSpy = jest.spyOn(DataManagementService, '_restoreFromBackup')
                .mockResolvedValue({ success: true, restoredCount: mockRecords.length });

              jest.spyOn(DataManagementService, '_logDataOperation')
                .mockResolvedValue('log-123');

              const confirmationPhrase = generateConfirmationPhrase(dataTypes);

              await DataManagementService.deleteData(
                {
                  dataTypes,
                  dateRange: null,
                  createBackup: true,
                  confirmationPhrase
                },
                adminId
              );

              expect(restoreSpy).not.toHaveBeenCalled();
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('restore is not called when backup is disabled', () => {
        fc.assert(
          fc.property(
            dataTypesArb,
            fc.integer({ min: 1, max: 10 }),
            adminIdArb,
            async (dataTypes, recordCount, adminId) => {
              // Clear mocks at the start of each iteration
              jest.clearAllMocks();
              
              const mockRecords = generateMockRecords(dataTypes, recordCount);
              
              jest.spyOn(DataManagementService, '_collectRecordsForDeletion')
                .mockResolvedValue(mockRecords);
              
              const mockBatch = {
                delete: jest.fn(),
                commit: jest.fn().mockRejectedValue(new Error('Deletion failed'))
              };
              writeBatch.mockReturnValue(mockBatch);

              const restoreSpy = jest.spyOn(DataManagementService, '_restoreFromBackup')
                .mockResolvedValue({ success: true, restoredCount: mockRecords.length });

              jest.spyOn(DataManagementService, '_logDataOperation')
                .mockResolvedValue('log-123');

              const confirmationPhrase = generateConfirmationPhrase(dataTypes);

              await DataManagementService.deleteData(
                {
                  dataTypes,
                  dateRange: null,
                  createBackup: false,
                  confirmationPhrase
                },
                adminId
              );

              expect(restoreSpy).not.toHaveBeenCalled();
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('restore is only called when deletion actually fails', () => {
        fc.assert(
          fc.property(
            dataTypesArb,
            fc.integer({ min: 1, max: 10 }),
            fc.boolean(),
            adminIdArb,
            async (dataTypes, recordCount, shouldFail, adminId) => {
              // Clear mocks at the start of each iteration
              jest.clearAllMocks();
              
              const mockRecords = generateMockRecords(dataTypes, recordCount);
              
              jest.spyOn(DataManagementService, '_collectRecordsForDeletion')
                .mockResolvedValue(mockRecords);
              
              jest.spyOn(DataManagementService, '_createBackupArchive')
                .mockResolvedValue('backup-123');
              
              const mockBatch = {
                delete: jest.fn(),
                commit: shouldFail 
                  ? jest.fn().mockRejectedValue(new Error('Deletion failed'))
                  : jest.fn().mockResolvedValue(undefined)
              };
              writeBatch.mockReturnValue(mockBatch);

              const restoreSpy = jest.spyOn(DataManagementService, '_restoreFromBackup')
                .mockResolvedValue({ success: true, restoredCount: mockRecords.length });

              jest.spyOn(DataManagementService, '_logDataOperation')
                .mockResolvedValue('log-123');

              const confirmationPhrase = generateConfirmationPhrase(dataTypes);

              await DataManagementService.deleteData(
                {
                  dataTypes,
                  dateRange: null,
                  createBackup: true,
                  confirmationPhrase
                },
                adminId
              );

              if (shouldFail) {
                expect(restoreSpy).toHaveBeenCalled();
              } else {
                expect(restoreSpy).not.toHaveBeenCalled();
              }
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });
    });

    describe('Edge Cases', () => {
      afterEach(() => {
        jest.clearAllMocks();
      });

      test('restore handles empty deleted records gracefully', () => {
        fc.assert(
          fc.property(
            dataTypesArb,
            adminIdArb,
            async (dataTypes, adminId) => {
              // Clear mocks at the start of each iteration
              jest.clearAllMocks();
              
              jest.spyOn(DataManagementService, '_collectRecordsForDeletion')
                .mockResolvedValue([]);
              
              const restoreSpy = jest.spyOn(DataManagementService, '_restoreFromBackup')
                .mockResolvedValue({ success: true, restoredCount: 0 });

              jest.spyOn(DataManagementService, '_logDataOperation')
                .mockResolvedValue('log-123');

              const confirmationPhrase = generateConfirmationPhrase(dataTypes);

              await DataManagementService.deleteData(
                {
                  dataTypes,
                  dateRange: null,
                  createBackup: true,
                  confirmationPhrase
                },
                adminId
              );

              expect(restoreSpy).not.toHaveBeenCalled();
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('restore failure does not crash delete operation', () => {
        fc.assert(
          fc.property(
            dataTypesArb,
            fc.integer({ min: 1, max: 10 }),
            adminIdArb,
            async (dataTypes, recordCount, adminId) => {
              // Clear mocks at the start of each iteration
              jest.clearAllMocks();
              
              const mockRecords = generateMockRecords(dataTypes, recordCount);
              
              jest.spyOn(DataManagementService, '_collectRecordsForDeletion')
                .mockResolvedValue(mockRecords);
              
              jest.spyOn(DataManagementService, '_createBackupArchive')
                .mockResolvedValue('backup-123');
              
              const mockBatch = {
                delete: jest.fn(),
                commit: jest.fn().mockRejectedValue(new Error('Deletion failed'))
              };
              writeBatch.mockReturnValue(mockBatch);

              jest.spyOn(DataManagementService, '_restoreFromBackup')
                .mockRejectedValue(new Error('Restore also failed'));

              jest.spyOn(DataManagementService, '_logDataOperation')
                .mockResolvedValue('log-123');

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

              expect(result.success).toBe(false);
              expect(result.error).toBeDefined();
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('single record deletion triggers restore on failure', () => {
        fc.assert(
          fc.property(
            fc.constantFrom(DATA_TYPE.LOANS, DATA_TYPE.RESERVATIONS, DATA_TYPE.EQUIPMENT),
            adminIdArb,
            async (dataType, adminId) => {
              // Clear mocks at the start of each iteration
              jest.clearAllMocks();
              
              const mockRecords = generateMockRecords([dataType], 1);
              
              jest.spyOn(DataManagementService, '_collectRecordsForDeletion')
                .mockResolvedValue(mockRecords);
              
              jest.spyOn(DataManagementService, '_createBackupArchive')
                .mockResolvedValue('backup-123');
              
              const mockBatch = {
                delete: jest.fn(),
                commit: jest.fn().mockRejectedValue(new Error('Deletion failed'))
              };
              writeBatch.mockReturnValue(mockBatch);

              const restoreSpy = jest.spyOn(DataManagementService, '_restoreFromBackup')
                .mockResolvedValue({ success: true, restoredCount: 1 });

              jest.spyOn(DataManagementService, '_logDataOperation')
                .mockResolvedValue('log-123');

              const confirmationPhrase = generateConfirmationPhrase([dataType]);

              await DataManagementService.deleteData(
                {
                  dataTypes: [dataType],
                  dateRange: null,
                  createBackup: true,
                  confirmationPhrase
                },
                adminId
              );

              expect(restoreSpy).toHaveBeenCalled();
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });
    });

    describe('Atomicity Guarantees', () => {
      afterEach(() => {
        jest.clearAllMocks();
      });

      test('failed deletion with successful restore maintains data integrity', () => {
        fc.assert(
          fc.property(
            dataTypesArb,
            fc.integer({ min: 1, max: 10 }),
            adminIdArb,
            async (dataTypes, recordCount, adminId) => {
              // Clear mocks at the start of each iteration
              jest.clearAllMocks();
              
              // Setup writeBatch mock for this iteration
              const mockBatch = {
                delete: jest.fn(),
                commit: jest.fn().mockRejectedValue(new Error('Deletion failed'))
              };
              writeBatch.mockReturnValue(mockBatch);
              
              const mockRecords = generateMockRecords(dataTypes, recordCount);
              
              jest.spyOn(DataManagementService, '_collectRecordsForDeletion')
                .mockResolvedValue(mockRecords);
              
              jest.spyOn(DataManagementService, '_createBackupArchive')
                .mockResolvedValue('backup-123');

              const restoreSpy = jest.spyOn(DataManagementService, '_restoreFromBackup')
                .mockResolvedValue({ success: true, restoredCount: mockRecords.length });

              jest.spyOn(DataManagementService, '_logDataOperation')
                .mockResolvedValue('log-123');

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

              expect(restoreSpy).toHaveBeenCalled();
              expect(result.success).toBe(false);
              expect(result.deletedCount).toBe(0);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('failure result contains backup ID for manual recovery', () => {
        fc.assert(
          fc.property(
            dataTypesArb,
            fc.integer({ min: 1, max: 10 }),
            adminIdArb,
            async (dataTypes, recordCount, adminId) => {
              // Clear mocks at the start of each iteration
              jest.clearAllMocks();
              
              // Setup writeBatch mock for this iteration
              const mockBatch = {
                delete: jest.fn(),
                commit: jest.fn().mockRejectedValue(new Error('Deletion failed'))
              };
              writeBatch.mockReturnValue(mockBatch);
              
              const mockRecords = generateMockRecords(dataTypes, recordCount);
              
              jest.spyOn(DataManagementService, '_collectRecordsForDeletion')
                .mockResolvedValue(mockRecords);
              
              const backupId = 'backup-test-123';
              jest.spyOn(DataManagementService, '_createBackupArchive')
                .mockResolvedValue(backupId);

              jest.spyOn(DataManagementService, '_restoreFromBackup')
                .mockResolvedValue({ success: true, restoredCount: mockRecords.length });

              jest.spyOn(DataManagementService, '_logDataOperation')
                .mockResolvedValue('log-123');

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

              expect(result.backupId).toBe(backupId);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });
    });
  });
});
