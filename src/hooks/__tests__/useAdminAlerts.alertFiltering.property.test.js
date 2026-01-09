/**
 * Property-Based Tests for Alert Filtering
 * 
 * Tests universal properties for alert filtering by type, priority, date range, and search term.
 * Uses fast-check library for property-based testing with 100+ iterations.
 * 
 * Feature: admin-intelligence-assistant
 * Property tested:
 * - Property 19: Alert Filter Correctness
 * 
 * **Validates: Requirements 8.4**
 */

import fc from 'fast-check';
import { ALERT_PRIORITY, ALERT_TYPE } from '../../types/adminAlert';
import { applyFilters } from '../useAdminAlerts';

// Test configuration
const NUM_RUNS = 100; // Run each property 100 times

describe('Alert Filtering Properties', () => {
  /**
   * Feature: admin-intelligence-assistant, Property 19: Alert Filter Correctness
   * **Validates: Requirements 8.4**
   * 
   * For any alert filter operation, the filtered results SHALL only contain 
   * alerts matching all specified filter criteria.
   */
  describe('Property 19: Alert Filter Correctness', () => {
    // Arbitrary generator for alert priority
    const priorityArb = fc.constantFrom(
      ALERT_PRIORITY.CRITICAL,
      ALERT_PRIORITY.HIGH,
      ALERT_PRIORITY.MEDIUM,
      ALERT_PRIORITY.LOW
    );

    // Arbitrary generator for alert type
    const alertTypeArb = fc.constantFrom(
      ALERT_TYPE.OVERDUE_LOAN,
      ALERT_TYPE.NO_SHOW_RESERVATION,
      ALERT_TYPE.HIGH_DEMAND_EQUIPMENT,
      ALERT_TYPE.IDLE_EQUIPMENT,
      ALERT_TYPE.LATE_RETURN_RISK,
      ALERT_TYPE.DEMAND_EXCEEDS_SUPPLY,
      ALERT_TYPE.LOW_RELIABILITY_USER,
      ALERT_TYPE.REPEAT_NO_SHOW_USER
    );

    // Arbitrary generator for a single alert
    const alertArb = fc.record({
      id: fc.uuid(),
      type: alertTypeArb,
      priority: priorityArb,
      title: fc.string({ minLength: 5, maxLength: 100 }),
      description: fc.string({ minLength: 10, maxLength: 500 }),
      sourceId: fc.uuid(),
      sourceType: fc.constantFrom('loan', 'reservation', 'equipment', 'user'),
      sourceData: fc.object(),
      quickActions: fc.array(fc.object(), { maxLength: 5 }),
      isResolved: fc.boolean(),
      createdAt: fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }),
      resolvedAt: fc.option(fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }), { nil: null }),
      resolvedBy: fc.option(fc.uuid(), { nil: null }),
      resolvedAction: fc.option(fc.string(), { nil: null })
    });

    // Arbitrary generator for an array of alerts
    const alertsArb = fc.array(alertArb, { minLength: 0, maxLength: 50 });

    // Arbitrary generator for filter with type only
    const typeFilterArb = fc.record({
      type: alertTypeArb,
      priority: fc.constant('all'),
      dateRange: fc.constant({ start: null, end: null }),
      searchTerm: fc.constant('')
    });

    // Arbitrary generator for filter with priority only
    const priorityFilterArb = fc.record({
      type: fc.constant('all'),
      priority: priorityArb,
      dateRange: fc.constant({ start: null, end: null }),
      searchTerm: fc.constant('')
    });

    // Arbitrary generator for filter with date range
    const dateRangeFilterArb = fc.record({
      type: fc.constant('all'),
      priority: fc.constant('all'),
      dateRange: fc.record({
        start: fc.date({ min: new Date('2024-01-01'), max: new Date('2026-06-30') }),
        end: fc.date({ min: new Date('2026-07-01'), max: new Date('2026-12-31') })
      }),
      searchTerm: fc.constant('')
    });

    // Arbitrary generator for filter with search term
    const searchFilterArb = fc.record({
      type: fc.constant('all'),
      priority: fc.constant('all'),
      dateRange: fc.constant({ start: null, end: null }),
      searchTerm: fc.string({ minLength: 3, maxLength: 20 })
    });

    // Arbitrary generator for combined filter
    const combinedFilterArb = fc.record({
      type: fc.option(alertTypeArb, { nil: 'all' }),
      priority: fc.option(priorityArb, { nil: 'all' }),
      dateRange: fc.option(
        fc.record({
          start: fc.date({ min: new Date('2024-01-01'), max: new Date('2026-06-30') }),
          end: fc.date({ min: new Date('2026-07-01'), max: new Date('2026-12-31') })
        }),
        { nil: { start: null, end: null } }
      ),
      searchTerm: fc.option(fc.string({ minLength: 3, maxLength: 20 }), { nil: '' })
    });

    test('filtering by type returns only alerts of that type', () => {
      fc.assert(
        fc.property(
          alertsArb,
          typeFilterArb,
          (alerts, filter) => {
            const filtered = applyFilters(alerts, filter);

            // All filtered alerts should have the specified type
            filtered.forEach(alert => {
              expect(alert.type).toBe(filter.type);
            });

            // Count should match manual count
            const expectedCount = alerts.filter(a => a.type === filter.type).length;
            expect(filtered.length).toBe(expectedCount);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('filtering by priority returns only alerts of that priority', () => {
      fc.assert(
        fc.property(
          alertsArb,
          priorityFilterArb,
          (alerts, filter) => {
            const filtered = applyFilters(alerts, filter);

            // All filtered alerts should have the specified priority
            filtered.forEach(alert => {
              expect(alert.priority).toBe(filter.priority);
            });

            // Count should match manual count
            const expectedCount = alerts.filter(a => a.priority === filter.priority).length;
            expect(filtered.length).toBe(expectedCount);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('filtering by date range returns only alerts within range', () => {
      fc.assert(
        fc.property(
          alertsArb,
          dateRangeFilterArb,
          (alerts, filter) => {
            const filtered = applyFilters(alerts, filter);

            const startDate = new Date(filter.dateRange.start);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(filter.dateRange.end);
            endDate.setHours(23, 59, 59, 999);

            // All filtered alerts should be within date range
            filtered.forEach(alert => {
              const alertDate = alert.createdAt instanceof Date 
                ? alert.createdAt 
                : new Date(alert.createdAt);
              
              // Skip invalid dates (NaN)
              if (isNaN(alertDate.getTime())) {
                return;
              }
              
              expect(alertDate >= startDate).toBe(true);
              expect(alertDate <= endDate).toBe(true);
            });
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('filtering by search term returns only matching alerts', () => {
      fc.assert(
        fc.property(
          alertsArb,
          searchFilterArb,
          (alerts, filter) => {
            const filtered = applyFilters(alerts, filter);

            const searchLower = filter.searchTerm.toLowerCase().trim();

            // All filtered alerts should match search term
            filtered.forEach(alert => {
              const titleMatch = alert.title?.toLowerCase().includes(searchLower);
              const descMatch = alert.description?.toLowerCase().includes(searchLower);
              const sourceDataMatch = JSON.stringify(alert.sourceData || {})
                .toLowerCase()
                .includes(searchLower);

              // At least one field should match
              expect(titleMatch || descMatch || sourceDataMatch).toBe(true);
            });
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('combined filters apply all criteria correctly', () => {
      fc.assert(
        fc.property(
          alertsArb,
          combinedFilterArb,
          (alerts, filter) => {
            const filtered = applyFilters(alerts, filter);

            // All filtered alerts should match ALL filter criteria
            filtered.forEach(alert => {
              // Check type filter
              if (filter.type && filter.type !== 'all') {
                expect(alert.type).toBe(filter.type);
              }

              // Check priority filter
              if (filter.priority && filter.priority !== 'all') {
                expect(alert.priority).toBe(filter.priority);
              }

              // Check date range filter
              if (filter.dateRange?.start) {
                const alertDate = alert.createdAt instanceof Date 
                  ? alert.createdAt 
                  : new Date(alert.createdAt);
                const startDate = new Date(filter.dateRange.start);
                startDate.setHours(0, 0, 0, 0);
                expect(alertDate >= startDate).toBe(true);
              }

              if (filter.dateRange?.end) {
                const alertDate = alert.createdAt instanceof Date 
                  ? alert.createdAt 
                  : new Date(alert.createdAt);
                const endDate = new Date(filter.dateRange.end);
                endDate.setHours(23, 59, 59, 999);
                expect(alertDate <= endDate).toBe(true);
              }

              // Check search term filter
              if (filter.searchTerm && filter.searchTerm.trim()) {
                const searchLower = filter.searchTerm.toLowerCase().trim();
                const titleMatch = alert.title?.toLowerCase().includes(searchLower);
                const descMatch = alert.description?.toLowerCase().includes(searchLower);
                const sourceDataMatch = JSON.stringify(alert.sourceData || {})
                  .toLowerCase()
                  .includes(searchLower);
                expect(titleMatch || descMatch || sourceDataMatch).toBe(true);
              }
            });
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('filter with "all" type returns all alerts (no type filtering)', () => {
      fc.assert(
        fc.property(
          alertsArb,
          fc.record({
            type: fc.constant('all'),
            priority: fc.constant('all'),
            dateRange: fc.constant({ start: null, end: null }),
            searchTerm: fc.constant('')
          }),
          (alerts, filter) => {
            const filtered = applyFilters(alerts, filter);

            // Should return all alerts
            expect(filtered.length).toBe(alerts.length);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('filter with "all" priority returns all alerts (no priority filtering)', () => {
      fc.assert(
        fc.property(
          alertsArb,
          fc.record({
            type: fc.constant('all'),
            priority: fc.constant('all'),
            dateRange: fc.constant({ start: null, end: null }),
            searchTerm: fc.constant('')
          }),
          (alerts, filter) => {
            const filtered = applyFilters(alerts, filter);

            // Should return all alerts
            expect(filtered.length).toBe(alerts.length);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('filter with null date range returns all alerts (no date filtering)', () => {
      fc.assert(
        fc.property(
          alertsArb,
          fc.record({
            type: fc.constant('all'),
            priority: fc.constant('all'),
            dateRange: fc.constant({ start: null, end: null }),
            searchTerm: fc.constant('')
          }),
          (alerts, filter) => {
            const filtered = applyFilters(alerts, filter);

            // Should return all alerts
            expect(filtered.length).toBe(alerts.length);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('filter with empty search term returns all alerts (no search filtering)', () => {
      fc.assert(
        fc.property(
          alertsArb,
          fc.record({
            type: fc.constant('all'),
            priority: fc.constant('all'),
            dateRange: fc.constant({ start: null, end: null }),
            searchTerm: fc.constant('')
          }),
          (alerts, filter) => {
            const filtered = applyFilters(alerts, filter);

            // Should return all alerts
            expect(filtered.length).toBe(alerts.length);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('filtering does not modify original alert array', () => {
      fc.assert(
        fc.property(
          alertsArb,
          combinedFilterArb,
          (alerts, filter) => {
            // Create a deep copy for comparison
            const originalAlerts = JSON.parse(JSON.stringify(alerts));

            // Apply filters
            applyFilters(alerts, filter);

            // Original array should be unchanged
            expect(alerts.length).toBe(originalAlerts.length);
            alerts.forEach((alert, index) => {
              expect(alert.id).toBe(originalAlerts[index].id);
              expect(alert.type).toBe(originalAlerts[index].type);
              expect(alert.priority).toBe(originalAlerts[index].priority);
            });
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('filtering is deterministic for same input', () => {
      fc.assert(
        fc.property(
          alertsArb,
          combinedFilterArb,
          (alerts, filter) => {
            // Apply filter multiple times
            const filtered1 = applyFilters(alerts, filter);
            const filtered2 = applyFilters(alerts, filter);
            const filtered3 = applyFilters(alerts, filter);

            // Results should be identical
            expect(filtered1.length).toBe(filtered2.length);
            expect(filtered2.length).toBe(filtered3.length);

            // IDs should match
            const ids1 = filtered1.map(a => a.id).sort();
            const ids2 = filtered2.map(a => a.id).sort();
            const ids3 = filtered3.map(a => a.id).sort();

            expect(ids1).toEqual(ids2);
            expect(ids2).toEqual(ids3);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('filtered results are a subset of original alerts', () => {
      fc.assert(
        fc.property(
          alertsArb,
          combinedFilterArb,
          (alerts, filter) => {
            const filtered = applyFilters(alerts, filter);

            // Every filtered alert should exist in original array
            filtered.forEach(filteredAlert => {
              const found = alerts.some(a => a.id === filteredAlert.id);
              expect(found).toBe(true);
            });

            // Filtered count should not exceed original count
            expect(filtered.length).toBeLessThanOrEqual(alerts.length);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('no duplicate alerts in filtered results', () => {
      fc.assert(
        fc.property(
          alertsArb,
          combinedFilterArb,
          (alerts, filter) => {
            const filtered = applyFilters(alerts, filter);

            // Collect all IDs
            const ids = filtered.map(a => a.id);
            const uniqueIds = new Set(ids);

            // No duplicates
            expect(ids.length).toBe(uniqueIds.size);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('filtering empty array returns empty array', () => {
      fc.assert(
        fc.property(
          combinedFilterArb,
          (filter) => {
            const filtered = applyFilters([], filter);

            expect(filtered.length).toBe(0);
            expect(Array.isArray(filtered)).toBe(true);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('filtering preserves alert data integrity', () => {
      fc.assert(
        fc.property(
          alertsArb,
          combinedFilterArb,
          (alerts, filter) => {
            const filtered = applyFilters(alerts, filter);

            // Each filtered alert should have complete data
            filtered.forEach(filteredAlert => {
              const originalAlert = alerts.find(a => a.id === filteredAlert.id);
              expect(originalAlert).toBeDefined();

              // Verify data integrity
              expect(filteredAlert.id).toBe(originalAlert.id);
              expect(filteredAlert.type).toBe(originalAlert.type);
              expect(filteredAlert.priority).toBe(originalAlert.priority);
              expect(filteredAlert.title).toBe(originalAlert.title);
              expect(filteredAlert.description).toBe(originalAlert.description);
            });
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('multiple filters narrow down results progressively', () => {
      fc.assert(
        fc.property(
          alertsArb,
          alertTypeArb,
          priorityArb,
          (alerts, type, priority) => {
            // Apply type filter only
            const typeFiltered = applyFilters(alerts, {
              type,
              priority: 'all',
              dateRange: { start: null, end: null },
              searchTerm: ''
            });

            // Apply both type and priority filters
            const bothFiltered = applyFilters(alerts, {
              type,
              priority,
              dateRange: { start: null, end: null },
              searchTerm: ''
            });

            // Combined filter should return same or fewer results
            expect(bothFiltered.length).toBeLessThanOrEqual(typeFiltered.length);

            // All results from combined filter should be in type-only filter
            bothFiltered.forEach(alert => {
              const found = typeFiltered.some(a => a.id === alert.id);
              expect(found).toBe(true);
            });
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('search term is case-insensitive', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              type: alertTypeArb,
              priority: priorityArb,
              title: fc.constant('URGENT Alert'),
              description: fc.constant('This is an URGENT situation'),
              sourceData: fc.constant({}),
              createdAt: fc.date()
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (alerts) => {
            // Filter with lowercase search term
            const filteredLower = applyFilters(alerts, {
              type: 'all',
              priority: 'all',
              dateRange: { start: null, end: null },
              searchTerm: 'urgent'
            });

            // Filter with uppercase search term
            const filteredUpper = applyFilters(alerts, {
              type: 'all',
              priority: 'all',
              dateRange: { start: null, end: null },
              searchTerm: 'URGENT'
            });

            // Filter with mixed case search term
            const filteredMixed = applyFilters(alerts, {
              type: 'all',
              priority: 'all',
              dateRange: { start: null, end: null },
              searchTerm: 'UrGeNt'
            });

            // All should return the same results
            expect(filteredLower.length).toBe(alerts.length);
            expect(filteredUpper.length).toBe(alerts.length);
            expect(filteredMixed.length).toBe(alerts.length);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('search term with whitespace is trimmed', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              type: alertTypeArb,
              priority: priorityArb,
              title: fc.constant('Test Alert'),
              description: fc.constant('Test description'),
              sourceData: fc.constant({}),
              createdAt: fc.date()
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (alerts) => {
            // Filter with search term without whitespace
            const filtered1 = applyFilters(alerts, {
              type: 'all',
              priority: 'all',
              dateRange: { start: null, end: null },
              searchTerm: 'test'
            });

            // Filter with search term with leading/trailing whitespace
            const filtered2 = applyFilters(alerts, {
              type: 'all',
              priority: 'all',
              dateRange: { start: null, end: null },
              searchTerm: '  test  '
            });

            // Both should return the same results
            expect(filtered1.length).toBe(filtered2.length);
            expect(filtered1.length).toBe(alerts.length);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('date range with only start date filters correctly', () => {
      fc.assert(
        fc.property(
          alertsArb,
          fc.date({ min: new Date('2025-01-01'), max: new Date('2026-06-30') }),
          (alerts, startDate) => {
            const filtered = applyFilters(alerts, {
              type: 'all',
              priority: 'all',
              dateRange: { start: startDate, end: null },
              searchTerm: ''
            });

            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);

            // All filtered alerts should be on or after start date
            filtered.forEach(alert => {
              const alertDate = alert.createdAt instanceof Date 
                ? alert.createdAt 
                : new Date(alert.createdAt);
              
              // Skip invalid dates (NaN)
              if (isNaN(alertDate.getTime())) {
                return;
              }
              
              expect(alertDate >= start).toBe(true);
            });
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('date range with only end date filters correctly', () => {
      fc.assert(
        fc.property(
          alertsArb,
          fc.date({ min: new Date('2025-07-01'), max: new Date('2026-12-31') }),
          (alerts, endDate) => {
            const filtered = applyFilters(alerts, {
              type: 'all',
              priority: 'all',
              dateRange: { start: null, end: endDate },
              searchTerm: ''
            });

            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            // All filtered alerts should be on or before end date
            filtered.forEach(alert => {
              const alertDate = alert.createdAt instanceof Date 
                ? alert.createdAt 
                : new Date(alert.createdAt);
              
              // Skip invalid dates (NaN)
              if (isNaN(alertDate.getTime())) {
                return;
              }
              
              expect(alertDate <= end).toBe(true);
            });
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });
  });
});
