/**
 * Property-Based Tests for Settings Cache
 * Based on admin-settings-system design document
 */

import fc from 'fast-check';
import { SettingsCache } from '../settingsCache';

describe('Settings Cache Property Tests', () => {
  let cache;

  beforeEach(() => {
    cache = new SettingsCache();
  });

  afterEach(() => {
    if (cache) {
      cache.invalidateAll(false);
      cache.destroy();
    }
  });

  // **Feature: admin-settings-system, Property 21: Cache invalidation on update**
  // **Validates: Requirements 10.2**
  describe('Property 21: Cache invalidation on update', () => {
    it('should invalidate cache entry when setting is updated for any key-value pair', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }), // Random cache key
          fc.oneof(
            fc.integer(),
            fc.string(),
            fc.boolean(),
            fc.object()
          ), // Random initial value
          fc.oneof(
            fc.integer(),
            fc.string(),
            fc.boolean(),
            fc.object()
          ), // Random updated value
          (key, initialValue, updatedValue) => {
            // Set initial value in cache
            cache.set(key, initialValue, 5000, false); // Don't broadcast in tests
            
            // Verify initial value is cached
            const cachedInitial = cache.get(key);
            expect(cachedInitial).toEqual(initialValue);
            
            // Invalidate the cache
            cache.invalidate(key, false); // Don't broadcast in tests
            
            // Verify cache entry is invalidated (returns null)
            const afterInvalidate = cache.get(key);
            expect(afterInvalidate).toBeNull();
            
            // Set updated value
            cache.set(key, updatedValue, 5000, false);
            
            // Verify updated value is now cached
            const cachedUpdated = cache.get(key);
            expect(cachedUpdated).toEqual(updatedValue);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should invalidate cache and notify listeners for any key', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }), // Random cache key
          fc.integer(), // Random value
          (key, value) => {
            let listenerCalled = false;
            let listenerValue = undefined;
            
            // Subscribe to cache changes
            const unsubscribe = cache.subscribe(key, (val) => {
              listenerCalled = true;
              listenerValue = val;
            });
            
            // Set value
            cache.set(key, value, 5000, false);
            
            // Reset listener state
            listenerCalled = false;
            listenerValue = undefined;
            
            // Invalidate cache
            cache.invalidate(key, false);
            
            // Verify listener was called with null
            expect(listenerCalled).toBe(true);
            expect(listenerValue).toBeNull();
            
            // Verify cache is invalidated
            expect(cache.get(key)).toBeNull();
            
            unsubscribe();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should invalidate all cache entries when invalidateAll is called', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              key: fc.string({ minLength: 1, maxLength: 30 }),
              value: fc.oneof(fc.integer(), fc.string(), fc.boolean())
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (entries) => {
            // Deduplicate entries by key (last value wins, like Map behavior)
            const uniqueEntries = new Map();
            entries.forEach(({ key, value }) => {
              uniqueEntries.set(key, value);
            });
            
            // Convert back to array for iteration
            const deduplicatedEntries = Array.from(uniqueEntries.entries()).map(([key, value]) => ({ key, value }));
            
            // Set multiple cache entries
            deduplicatedEntries.forEach(({ key, value }) => {
              cache.set(key, value, 5000, false);
            });
            
            // Verify all entries are cached
            deduplicatedEntries.forEach(({ key, value }) => {
              expect(cache.get(key)).toEqual(value);
            });
            
            // Invalidate all
            cache.invalidateAll(false);
            
            // Verify all entries are invalidated
            deduplicatedEntries.forEach(({ key }) => {
              expect(cache.get(key)).toBeNull();
            });
            
            // Verify cache is empty
            expect(cache.size()).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: admin-settings-system, Property 22: Cache-first retrieval**
  // **Validates: Requirements 10.3**
  describe('Property 22: Cache-first retrieval', () => {
    it('should return cached value without database query for any valid cached entry', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }), // Random cache key
          fc.oneof(
            fc.integer(),
            fc.string(),
            fc.boolean(),
            fc.object(),
            fc.array(fc.integer())
          ), // Random value
          fc.integer({ min: 1000, max: 10000 }), // Random TTL
          (key, value, ttl) => {
            // Set value in cache
            cache.set(key, value, ttl, false);
            
            // Retrieve value (should come from cache)
            const retrieved = cache.get(key);
            
            // Verify value matches
            expect(retrieved).toEqual(value);
            
            // Verify cache has the entry
            expect(cache.has(key)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return null for expired cache entries for any key', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }), // Random cache key
          fc.integer(), // Random value
          async (key, value) => {
            // Set value with very short TTL (1ms)
            cache.set(key, value, 1, false);
            
            // Wait for expiration
            await new Promise((resolve) => setTimeout(resolve, 10));
            
            // Try to retrieve expired value
            const retrieved = cache.get(key);
            
            // Should return null for expired entry
            expect(retrieved).toBeNull();
            
            // Cache should not have the entry
            expect(cache.has(key)).toBe(false);
          }
        ),
        { numRuns: 50 } // Fewer runs due to async nature
      );
    });

    it('should return null for non-existent cache keys', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }), // Random cache key
          (key) => {
            // Try to get value that was never set
            const retrieved = cache.get(key);
            
            // Should return null
            expect(retrieved).toBeNull();
            
            // Cache should not have the entry
            expect(cache.has(key)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: admin-settings-system, Property 23: Cache refresh on expiration**
  // **Validates: Requirements 10.4**
  describe('Property 23: Cache refresh on expiration', () => {
    it('should allow setting new value after expiration for any key', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }), // Random cache key
          fc.integer(), // Random initial value
          fc.integer(), // Random new value
          async (key, initialValue, newValue) => {
            // Set initial value with very short TTL
            cache.set(key, initialValue, 1, false);
            
            // Wait for expiration
            await new Promise((resolve) => setTimeout(resolve, 10));
            
            // Verify expired entry returns null
            expect(cache.get(key)).toBeNull();
            
            // Set new value (refresh)
            cache.set(key, newValue, 5000, false);
            
            // Verify new value is cached
            const retrieved = cache.get(key);
            expect(retrieved).toEqual(newValue);
          }
        ),
        { numRuns: 50 } // Fewer runs due to async nature
      );
    });

    it('should cleanup expired entries and allow fresh values for any set of keys', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              key: fc.string({ minLength: 1, maxLength: 30 }),
              value: fc.integer()
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (entries) => {
            // Ensure unique keys
            const uniqueEntries = Array.from(
              new Map(entries.map(e => [e.key, e])).values()
            );
            
            // Set entries with very short TTL
            uniqueEntries.forEach(({ key, value }) => {
              cache.set(key, value, 1, false);
            });
            
            // Wait for expiration
            await new Promise((resolve) => setTimeout(resolve, 10));
            
            // Run cleanup
            const removed = cache.cleanup();
            
            // Verify entries were removed
            expect(removed).toBeGreaterThanOrEqual(uniqueEntries.length);
            
            // Set fresh values
            uniqueEntries.forEach(({ key, value }) => {
              cache.set(key, value * 2, 5000, false);
            });
            
            // Verify fresh values are cached
            uniqueEntries.forEach(({ key, value }) => {
              const retrieved = cache.get(key);
              expect(retrieved).toEqual(value * 2);
            });
          }
        ),
        { numRuns: 50 } // Fewer runs due to async nature
      );
    });

    it('should maintain valid entries while cleaning up expired ones', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              key: fc.string({ minLength: 1, maxLength: 30 }),
              value: fc.integer(),
              shouldExpire: fc.boolean()
            }),
            { minLength: 2, maxLength: 10 }
          ),
          async (entries) => {
            // Ensure unique keys
            const uniqueEntries = Array.from(
              new Map(entries.map(e => [e.key, e])).values()
            );
            
            // Need at least 2 unique entries
            if (uniqueEntries.length < 2) {
              return; // Skip this test case
            }
            
            // Set entries with different TTLs
            uniqueEntries.forEach(({ key, value, shouldExpire }) => {
              const ttl = shouldExpire ? 1 : 10000;
              cache.set(key, value, ttl, false);
            });
            
            // Wait for short TTL entries to expire
            await new Promise((resolve) => setTimeout(resolve, 10));
            
            // Run cleanup
            cache.cleanup();
            
            // Verify expired entries are gone
            const expiredEntries = uniqueEntries.filter(e => e.shouldExpire);
            expiredEntries.forEach(({ key }) => {
              expect(cache.get(key)).toBeNull();
            });
            
            // Verify valid entries remain
            const validEntries = uniqueEntries.filter(e => !e.shouldExpire);
            validEntries.forEach(({ key, value }) => {
              expect(cache.get(key)).toEqual(value);
            });
          }
        ),
        { numRuns: 50 } // Fewer runs due to async nature
      );
    });
  });

  describe('Cache Statistics and Utilities', () => {
    it('should accurately report cache statistics for any set of entries', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              key: fc.string({ minLength: 1, maxLength: 30 }),
              value: fc.integer()
            }),
            { minLength: 0, maxLength: 10 }
          ),
          (entries) => {
            // Clear cache before test
            cache.invalidateAll(false);
            
            // Ensure unique keys
            const uniqueEntries = Array.from(
              new Map(entries.map(e => [e.key, e])).values()
            );
            
            // Set entries
            uniqueEntries.forEach(({ key, value }) => {
              cache.set(key, value, 5000, false);
            });
            
            // Get stats
            const stats = cache.getStats();
            
            // Verify stats
            expect(stats.totalEntries).toBe(uniqueEntries.length);
            expect(stats.validEntries).toBe(uniqueEntries.length);
            expect(stats.expiredEntries).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly report cache size for any number of entries', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              key: fc.string({ minLength: 1, maxLength: 30 }),
              value: fc.integer()
            }),
            { minLength: 0, maxLength: 20 }
          ),
          (entries) => {
            // Clear cache before test
            cache.invalidateAll(false);
            
            // Ensure unique keys
            const uniqueEntries = Array.from(
              new Map(entries.map(e => [e.key, e])).values()
            );
            
            // Set entries
            uniqueEntries.forEach(({ key, value }) => {
              cache.set(key, value, 5000, false);
            });
            
            // Verify size
            expect(cache.size()).toBe(uniqueEntries.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
