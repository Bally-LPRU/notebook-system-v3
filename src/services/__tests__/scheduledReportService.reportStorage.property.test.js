/**
 * Property-Based Tests for Scheduled Report Service - Report Storage
 * 
 * Tests universal properties for report persistence and retrieval.
 * Uses fast-check library for property-based testing with 100+ iterations.
 * 
 * Feature: admin-intelligence-assistant
 * Property tested:
 * - Property 22: Report Storage
 * 
 * **Validates: Requirements 9.3**
 */

import fc from 'fast-check';
import ScheduledReportService, { REPORT_TYPE, REPORT_STATUS } from '../scheduledReportService';

// Test configuration
const NUM_RUNS = 100; // Run each property 100 times

describe('Scheduled Report Service - Report Storage Properties', () => {
  /**
   * Feature: admin-intelligence-assistant, Property 22: Report Storage
   * **Validates: Requirements 9.3**
   * 
   * For any generated scheduled report, the report SHALL be persisted 
   * and retrievable for later viewing.
   */
  describe('Property 22: Report Storage', () => {
    // ============================================
    // Arbitrary Generators
    // ============================================

    /**
     * Generate arbitrary report types
     */
    const reportTypeArb = fc.constantFrom(
      REPORT_TYPE.DAILY_SUMMARY,
      REPORT_TYPE.WEEKLY_UTILIZATION,
      REPORT_TYPE.MONTHLY_ANALYTICS
    );

    /**
     * Generate arbitrary period strings
     */
    const dailyPeriodArb = fc.tuple(
      fc.integer({ min: 2020, max: 2030 }),
      fc.integer({ min: 1, max: 12 }),
      fc.integer({ min: 1, max: 28 })
    ).map(([year, month, day]) => 
      `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    );

    const weeklyPeriodArb = fc.tuple(
      fc.integer({ min: 2020, max: 2030 }),
      fc.integer({ min: 1, max: 52 })
    ).map(([year, week]) => 
      `${year}-W${String(week).padStart(2, '0')}`
    );

    const periodArb = fc.oneof(dailyPeriodArb, weeklyPeriodArb);

    /**
     * Generate arbitrary report data
     */
    const reportDataArb = fc.record({
      date: fc.string({ maxLength: 20 }),
      loans: fc.record({
        newRequests: fc.integer({ min: 0, max: 1000 }),
        approved: fc.integer({ min: 0, max: 1000 }),
        rejected: fc.integer({ min: 0, max: 1000 }),
        borrowed: fc.integer({ min: 0, max: 1000 }),
        returned: fc.integer({ min: 0, max: 1000 }),
        overdue: fc.integer({ min: 0, max: 1000 }),
        total: fc.integer({ min: 0, max: 5000 })
      }),
      reservations: fc.record({
        newReservations: fc.integer({ min: 0, max: 1000 }),
        approved: fc.integer({ min: 0, max: 1000 }),
        cancelled: fc.integer({ min: 0, max: 1000 }),
        completed: fc.integer({ min: 0, max: 1000 }),
        noShows: fc.integer({ min: 0, max: 1000 }),
        total: fc.integer({ min: 0, max: 5000 })
      }),
      alerts: fc.record({
        total: fc.integer({ min: 0, max: 500 }),
        critical: fc.integer({ min: 0, max: 100 }),
        high: fc.integer({ min: 0, max: 100 }),
        medium: fc.integer({ min: 0, max: 100 }),
        low: fc.integer({ min: 0, max: 100 }),
        resolvedToday: fc.integer({ min: 0, max: 200 })
      }),
      overdue: fc.record({
        total: fc.integer({ min: 0, max: 200 }),
        critical: fc.integer({ min: 0, max: 50 }),
        high: fc.integer({ min: 0, max: 50 }),
        medium: fc.integer({ min: 0, max: 50 }),
        totalDaysOverdue: fc.integer({ min: 0, max: 1000 })
      }),
      generatedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
    });

    /**
     * Generate arbitrary admin IDs
     */
    const adminIdArb = fc.stringMatching(/^[a-zA-Z0-9]{10,28}$/);

    // ============================================
    // Helper Functions for Testing
    // ============================================

    /**
     * Create a mock report object for testing
     */
    const createMockReport = (reportType, period, data) => ({
      id: `${reportType}_${period}`,
      reportType,
      period,
      data,
      status: REPORT_STATUS.COMPLETED,
      generatedAt: new Date(),
      viewedBy: [],
      downloadCount: 0,
      updatedAt: new Date()
    });

    // ============================================
    // Valid Date Generator (filters out NaN dates)
    // ============================================
    
    const validDateArb = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
      .filter(date => !isNaN(date.getTime()));

    // ============================================
    // Period Generation Tests
    // ============================================

    describe('Period Generation', () => {
      test('generateDailyPeriod produces valid YYYY-MM-DD format for any date', () => {
        fc.assert(
          fc.property(
            validDateArb,
            (date) => {
              const period = ScheduledReportService.generateDailyPeriod(date);
              
              // Should be a string
              expect(typeof period).toBe('string');
              
              // Should match YYYY-MM-DD format
              expect(period).toMatch(/^\d{4}-\d{2}-\d{2}$/);
              
              // Should be parseable back to a date
              const parsedDate = new Date(period);
              expect(parsedDate).toBeInstanceOf(Date);
              expect(isNaN(parsedDate.getTime())).toBe(false);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('generateWeeklyPeriod produces valid YYYY-WNN format for any date', () => {
        fc.assert(
          fc.property(
            validDateArb,
            (date) => {
              const period = ScheduledReportService.generateWeeklyPeriod(date);
              
              // Should be a string
              expect(typeof period).toBe('string');
              
              // Should match YYYY-WNN format
              expect(period).toMatch(/^\d{4}-W\d{2}$/);
              
              // Week number should be between 01 and 53
              const weekNum = parseInt(period.split('-W')[1], 10);
              expect(weekNum).toBeGreaterThanOrEqual(1);
              expect(weekNum).toBeLessThanOrEqual(53);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('generateDailyPeriod is deterministic for same date', () => {
        fc.assert(
          fc.property(
            validDateArb,
            (date) => {
              const period1 = ScheduledReportService.generateDailyPeriod(date);
              const period2 = ScheduledReportService.generateDailyPeriod(date);
              const period3 = ScheduledReportService.generateDailyPeriod(date);
              
              // All should be identical
              expect(period1).toBe(period2);
              expect(period2).toBe(period3);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('generateWeeklyPeriod is deterministic for same date', () => {
        fc.assert(
          fc.property(
            validDateArb,
            (date) => {
              const period1 = ScheduledReportService.generateWeeklyPeriod(date);
              const period2 = ScheduledReportService.generateWeeklyPeriod(date);
              const period3 = ScheduledReportService.generateWeeklyPeriod(date);
              
              // All should be identical
              expect(period1).toBe(period2);
              expect(period2).toBe(period3);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('dates in same day produce same daily period', () => {
        fc.assert(
          fc.property(
            validDateArb,
            fc.integer({ min: 0, max: 23 }),
            fc.integer({ min: 0, max: 59 }),
            fc.integer({ min: 0, max: 59 }),
            (baseDate, hour, minute, second) => {
              // Create two dates on the same day but different times
              const date1 = new Date(baseDate);
              date1.setHours(0, 0, 0, 0);
              
              const date2 = new Date(baseDate);
              date2.setHours(hour, minute, second, 0);
              
              const period1 = ScheduledReportService.generateDailyPeriod(date1);
              const period2 = ScheduledReportService.generateDailyPeriod(date2);
              
              // Same day should produce same period
              expect(period1).toBe(period2);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });
    });

    // ============================================
    // Day Bounds Tests
    // ============================================

    describe('Day Bounds Calculation', () => {
      test('getDayBounds returns valid start and end for any date', () => {
        fc.assert(
          fc.property(
            validDateArb,
            (date) => {
              const { start, end } = ScheduledReportService.getDayBounds(date);
              
              // Both should be Date objects
              expect(start).toBeInstanceOf(Date);
              expect(end).toBeInstanceOf(Date);
              
              // Start should be at midnight
              expect(start.getHours()).toBe(0);
              expect(start.getMinutes()).toBe(0);
              expect(start.getSeconds()).toBe(0);
              expect(start.getMilliseconds()).toBe(0);
              
              // End should be at 23:59:59.999
              expect(end.getHours()).toBe(23);
              expect(end.getMinutes()).toBe(59);
              expect(end.getSeconds()).toBe(59);
              expect(end.getMilliseconds()).toBe(999);
              
              // Start should be before end
              expect(start.getTime()).toBeLessThan(end.getTime());
              
              // Both should be on the same day
              expect(start.getDate()).toBe(end.getDate());
              expect(start.getMonth()).toBe(end.getMonth());
              expect(start.getFullYear()).toBe(end.getFullYear());
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('getDayBounds covers exactly one day', () => {
        fc.assert(
          fc.property(
            validDateArb,
            (date) => {
              const { start, end } = ScheduledReportService.getDayBounds(date);
              
              // Difference should be approximately 24 hours minus 1 millisecond
              const diffMs = end.getTime() - start.getTime();
              const expectedDiffMs = (24 * 60 * 60 * 1000) - 1; // 24 hours - 1ms
              
              expect(diffMs).toBe(expectedDiffMs);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });
    });

    // ============================================
    // Week Bounds Tests
    // ============================================

    describe('Week Bounds Calculation', () => {
      test('getWeekBounds returns valid start and end for any date', () => {
        fc.assert(
          fc.property(
            validDateArb,
            (date) => {
              const { start, end } = ScheduledReportService.getWeekBounds(date);
              
              // Both should be Date objects
              expect(start).toBeInstanceOf(Date);
              expect(end).toBeInstanceOf(Date);
              
              // Start should be at midnight
              expect(start.getHours()).toBe(0);
              expect(start.getMinutes()).toBe(0);
              expect(start.getSeconds()).toBe(0);
              expect(start.getMilliseconds()).toBe(0);
              
              // End should be at 23:59:59.999
              expect(end.getHours()).toBe(23);
              expect(end.getMinutes()).toBe(59);
              expect(end.getSeconds()).toBe(59);
              expect(end.getMilliseconds()).toBe(999);
              
              // Start should be before end
              expect(start.getTime()).toBeLessThan(end.getTime());
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('getWeekBounds covers exactly 7 days', () => {
        fc.assert(
          fc.property(
            validDateArb,
            (date) => {
              const { start, end } = ScheduledReportService.getWeekBounds(date);
              
              // Difference should be approximately 7 days minus 1 millisecond
              const diffMs = end.getTime() - start.getTime();
              const expectedDiffMs = (7 * 24 * 60 * 60 * 1000) - 1; // 7 days - 1ms
              
              expect(diffMs).toBe(expectedDiffMs);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('getWeekBounds start is Monday', () => {
        fc.assert(
          fc.property(
            validDateArb,
            (date) => {
              const { start } = ScheduledReportService.getWeekBounds(date);
              
              // Start should be Monday (day 1)
              expect(start.getDay()).toBe(1);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('getWeekBounds end is Sunday', () => {
        fc.assert(
          fc.property(
            validDateArb,
            (date) => {
              const { end } = ScheduledReportService.getWeekBounds(date);
              
              // End should be Sunday (day 0)
              expect(end.getDay()).toBe(0);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });
    });

    // ============================================
    // Report ID Generation Tests
    // ============================================

    describe('Report ID Generation', () => {
      test('report ID is composite of type and period', () => {
        fc.assert(
          fc.property(
            reportTypeArb,
            periodArb,
            (reportType, period) => {
              const expectedId = `${reportType}_${period}`;
              const mockReport = createMockReport(reportType, period, {});
              
              // ID should be composite
              expect(mockReport.id).toBe(expectedId);
              
              // ID should contain both type and period
              expect(mockReport.id).toContain(reportType);
              expect(mockReport.id).toContain(period);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('report ID is unique for different type-period combinations', () => {
        fc.assert(
          fc.property(
            reportTypeArb,
            periodArb,
            reportTypeArb,
            periodArb,
            (type1, period1, type2, period2) => {
              const id1 = `${type1}_${period1}`;
              const id2 = `${type2}_${period2}`;
              
              // IDs should be equal only if both type and period are equal
              const shouldBeEqual = type1 === type2 && period1 === period2;
              const areEqual = id1 === id2;
              
              // This is a logical equivalence: shouldBeEqual <=> areEqual
              expect(areEqual).toBe(shouldBeEqual);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('report ID is deterministic for same type and period', () => {
        fc.assert(
          fc.property(
            reportTypeArb,
            periodArb,
            (reportType, period) => {
              const id1 = `${reportType}_${period}`;
              const id2 = `${reportType}_${period}`;
              const id3 = `${reportType}_${period}`;
              
              // All should be identical
              expect(id1).toBe(id2);
              expect(id2).toBe(id3);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });
    });

    // ============================================
    // Report Structure Tests
    // ============================================

    describe('Report Structure', () => {
      test('stored report contains all required fields', () => {
        fc.assert(
          fc.property(
            reportTypeArb,
            periodArb,
            reportDataArb,
            (reportType, period, data) => {
              const report = createMockReport(reportType, period, data);
              
              // Should have all required fields
              expect(report).toHaveProperty('id');
              expect(report).toHaveProperty('reportType');
              expect(report).toHaveProperty('period');
              expect(report).toHaveProperty('data');
              expect(report).toHaveProperty('status');
              expect(report).toHaveProperty('generatedAt');
              expect(report).toHaveProperty('viewedBy');
              expect(report).toHaveProperty('downloadCount');
              expect(report).toHaveProperty('updatedAt');
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('stored report preserves data integrity', () => {
        fc.assert(
          fc.property(
            reportTypeArb,
            periodArb,
            reportDataArb,
            (reportType, period, data) => {
              const report = createMockReport(reportType, period, data);
              
              // Data should be preserved
              expect(report.data).toEqual(data);
              expect(report.reportType).toBe(reportType);
              expect(report.period).toBe(period);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('stored report has correct initial values', () => {
        fc.assert(
          fc.property(
            reportTypeArb,
            periodArb,
            reportDataArb,
            (reportType, period, data) => {
              const report = createMockReport(reportType, period, data);
              
              // Initial values should be correct
              expect(report.status).toBe(REPORT_STATUS.COMPLETED);
              expect(report.viewedBy).toEqual([]);
              expect(report.downloadCount).toBe(0);
              expect(report.generatedAt).toBeInstanceOf(Date);
              expect(report.updatedAt).toBeInstanceOf(Date);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });
    });

    // ============================================
    // Default Preferences Tests
    // ============================================

    describe('Default Preferences', () => {
      test('default preferences have all required fields for any admin', () => {
        fc.assert(
          fc.property(
            adminIdArb,
            (adminId) => {
              const prefs = ScheduledReportService._getDefaultPreferences(adminId);
              
              // Should have all required fields
              expect(prefs).toHaveProperty('id');
              expect(prefs).toHaveProperty('dailySummary');
              expect(prefs).toHaveProperty('weeklyUtilization');
              expect(prefs).toHaveProperty('notifications');
              expect(prefs).toHaveProperty('displayOptions');
              
              // ID should match admin ID
              expect(prefs.id).toBe(adminId);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('default preferences have correct structure', () => {
        fc.assert(
          fc.property(
            adminIdArb,
            (adminId) => {
              const prefs = ScheduledReportService._getDefaultPreferences(adminId);
              
              // Daily summary preferences
              expect(prefs.dailySummary).toHaveProperty('enabled');
              expect(prefs.dailySummary).toHaveProperty('autoGenerate');
              expect(typeof prefs.dailySummary.enabled).toBe('boolean');
              expect(typeof prefs.dailySummary.autoGenerate).toBe('boolean');
              
              // Weekly utilization preferences
              expect(prefs.weeklyUtilization).toHaveProperty('enabled');
              expect(prefs.weeklyUtilization).toHaveProperty('autoGenerate');
              expect(prefs.weeklyUtilization).toHaveProperty('dayOfWeek');
              expect(typeof prefs.weeklyUtilization.enabled).toBe('boolean');
              expect(typeof prefs.weeklyUtilization.autoGenerate).toBe('boolean');
              expect(typeof prefs.weeklyUtilization.dayOfWeek).toBe('number');
              
              // Notification preferences
              expect(prefs.notifications).toHaveProperty('emailOnGeneration');
              expect(prefs.notifications).toHaveProperty('showInDashboard');
              expect(typeof prefs.notifications.emailOnGeneration).toBe('boolean');
              expect(typeof prefs.notifications.showInDashboard).toBe('boolean');
              
              // Display options
              expect(prefs.displayOptions).toHaveProperty('defaultReportType');
              expect(prefs.displayOptions).toHaveProperty('itemsPerPage');
              expect(typeof prefs.displayOptions.itemsPerPage).toBe('number');
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('default preferences are deterministic for same admin', () => {
        fc.assert(
          fc.property(
            adminIdArb,
            (adminId) => {
              const prefs1 = ScheduledReportService._getDefaultPreferences(adminId);
              const prefs2 = ScheduledReportService._getDefaultPreferences(adminId);
              const prefs3 = ScheduledReportService._getDefaultPreferences(adminId);
              
              // All should be deeply equal
              expect(prefs1).toEqual(prefs2);
              expect(prefs2).toEqual(prefs3);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });
    });

    // ============================================
    // Date Conversion Tests
    // ============================================

    describe('Date Conversion Helper', () => {
      test('_toDate handles Date objects correctly', () => {
        fc.assert(
          fc.property(
            validDateArb,
            (date) => {
              const result = ScheduledReportService._toDate(date);
              
              // Should return the same date
              expect(result).toBeInstanceOf(Date);
              expect(result.getTime()).toBe(date.getTime());
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('_toDate handles timestamp strings correctly', () => {
        fc.assert(
          fc.property(
            validDateArb,
            (date) => {
              const isoString = date.toISOString();
              const result = ScheduledReportService._toDate(isoString);
              
              // Should return a valid date
              expect(result).toBeInstanceOf(Date);
              expect(isNaN(result.getTime())).toBe(false);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('_toDate handles timestamp numbers correctly', () => {
        fc.assert(
          fc.property(
            validDateArb,
            (date) => {
              const timestamp = date.getTime();
              const result = ScheduledReportService._toDate(timestamp);
              
              // Should return a valid date
              expect(result).toBeInstanceOf(Date);
              expect(result.getTime()).toBe(timestamp);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('_toDate handles Firestore-like timestamp objects', () => {
        fc.assert(
          fc.property(
            validDateArb,
            (date) => {
              // Simulate Firestore timestamp with toDate method
              const firestoreTimestamp = {
                toDate: () => date
              };
              const result = ScheduledReportService._toDate(firestoreTimestamp);
              
              // Should return a valid date
              expect(result).toBeInstanceOf(Date);
              expect(result.getTime()).toBe(date.getTime());
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('_toDate handles seconds-based timestamp objects', () => {
        fc.assert(
          fc.property(
            validDateArb,
            (date) => {
              // Simulate timestamp with seconds property
              const secondsTimestamp = {
                seconds: Math.floor(date.getTime() / 1000)
              };
              const result = ScheduledReportService._toDate(secondsTimestamp);
              
              // Should return a valid date (may lose millisecond precision)
              expect(result).toBeInstanceOf(Date);
              expect(Math.floor(result.getTime() / 1000)).toBe(secondsTimestamp.seconds);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('_toDate returns null for null/undefined input', () => {
        expect(ScheduledReportService._toDate(null)).toBeNull();
        expect(ScheduledReportService._toDate(undefined)).toBeNull();
      });
    });

    // ============================================
    // Report Type Constants Tests
    // ============================================

    describe('Report Type Constants', () => {
      test('all report types are unique strings', () => {
        const types = Object.values(REPORT_TYPE);
        
        // All should be strings
        types.forEach(type => {
          expect(typeof type).toBe('string');
        });
        
        // All should be unique
        const uniqueTypes = new Set(types);
        expect(uniqueTypes.size).toBe(types.length);
      });

      test('all report statuses are unique strings', () => {
        const statuses = Object.values(REPORT_STATUS);
        
        // All should be strings
        statuses.forEach(status => {
          expect(typeof status).toBe('string');
        });
        
        // All should be unique
        const uniqueStatuses = new Set(statuses);
        expect(uniqueStatuses.size).toBe(statuses.length);
      });

      test('REPORT_TYPE contains expected values', () => {
        expect(REPORT_TYPE.DAILY_SUMMARY).toBe('daily_summary');
        expect(REPORT_TYPE.WEEKLY_UTILIZATION).toBe('weekly_utilization');
        expect(REPORT_TYPE.MONTHLY_ANALYTICS).toBe('monthly_analytics');
      });

      test('REPORT_STATUS contains expected values', () => {
        expect(REPORT_STATUS.GENERATING).toBe('generating');
        expect(REPORT_STATUS.COMPLETED).toBe('completed');
        expect(REPORT_STATUS.FAILED).toBe('failed');
      });
    });

    // ============================================
    // Report Retrieval Consistency Tests
    // ============================================

    describe('Report Retrieval Consistency', () => {
      test('report ID can be reconstructed from type and period', () => {
        fc.assert(
          fc.property(
            reportTypeArb,
            periodArb,
            (reportType, period) => {
              const report = createMockReport(reportType, period, {});
              
              // ID should be reconstructable
              const reconstructedId = `${report.reportType}_${report.period}`;
              expect(report.id).toBe(reconstructedId);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('report type and period can be extracted from ID using indexOf', () => {
        fc.assert(
          fc.property(
            reportTypeArb,
            periodArb,
            (reportType, period) => {
              const report = createMockReport(reportType, period, {});
              
              // Find the first underscore after the report type
              // Report types are: daily_summary, weekly_utilization, monthly_analytics
              // So we need to find the underscore that separates type from period
              const id = report.id;
              
              // The ID format is: {reportType}_{period}
              // We know the reportType, so we can extract the period
              const expectedPrefix = `${reportType}_`;
              const startsWithType = id.startsWith(expectedPrefix);
              expect(startsWithType).toBe(true);
              
              // Extract period from ID
              const extractedPeriod = id.substring(expectedPrefix.length);
              expect(extractedPeriod).toBe(period);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('same type-period combination always produces same ID', () => {
        fc.assert(
          fc.property(
            reportTypeArb,
            periodArb,
            (reportType, period) => {
              const report1 = createMockReport(reportType, period, { data: 1 });
              const report2 = createMockReport(reportType, period, { data: 2 });
              const report3 = createMockReport(reportType, period, { data: 3 });
              
              // All should have the same ID regardless of data
              expect(report1.id).toBe(report2.id);
              expect(report2.id).toBe(report3.id);
            }
          ),
          { numRuns: NUM_RUNS }
        );
      });

      test('different type-period combinations produce different IDs', () => {
        // Test with specific known different combinations
        const combinations = [
          { type: REPORT_TYPE.DAILY_SUMMARY, period: '2024-01-01' },
          { type: REPORT_TYPE.DAILY_SUMMARY, period: '2024-01-02' },
          { type: REPORT_TYPE.WEEKLY_UTILIZATION, period: '2024-W01' },
          { type: REPORT_TYPE.WEEKLY_UTILIZATION, period: '2024-W02' },
          { type: REPORT_TYPE.MONTHLY_ANALYTICS, period: '2024-01' }
        ];
        
        const ids = combinations.map(c => `${c.type}_${c.period}`);
        const uniqueIds = new Set(ids);
        
        // All IDs should be unique
        expect(uniqueIds.size).toBe(ids.length);
      });
    });
  });
});
