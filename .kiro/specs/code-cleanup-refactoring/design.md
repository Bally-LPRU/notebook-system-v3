# Design Document

## Overview

This design document outlines the architecture and implementation strategy for refactoring the equipment management system codebase. The refactoring focuses on eliminating code duplication, establishing reusable patterns, optimizing performance, and improving maintainability. The approach follows React best practices including component composition, custom hooks, Context API for shared state, and performance optimization through memoization.

## Architecture

### High-Level Structure

```
src/
├── components/
│   └── equipment/
│       └── EquipmentStatusBadge.js (NEW - Reusable status display)
├── contexts/
│   └── EquipmentCategoriesContext.js (NEW - Centralized category data)
├── hooks/
│   ├── usePagination.js (ENHANCED - Already exists, needs improvements)
│   ├── useEquipmentFilters.js (ENHANCED - Already exists, needs improvements)
│   └── useCategories.js (NEW - Exported from context)
└── utils/
    └── equipmentHelpers.js (ENHANCED - Already exists, add category helpers)
```

### Design Principles

1. **Single Responsibility**: Each component/hook handles one concern
2. **DRY (Don't Repeat Yourself)**: Eliminate code duplication through abstraction
3. **Composition over Inheritance**: Build complex UIs from simple, reusable pieces
4. **Performance First**: Use memoization strategically to prevent unnecessary re-renders
5. **Type Safety**: Maintain consistent data structures and handle edge cases

## Components and Interfaces

### 1. EquipmentStatusBadge Component

**Purpose**: Provide a consistent, reusable component for displaying equipment status across all views.

**Interface**:
```javascript
interface EquipmentStatusBadgeProps {
  status: string;           // Equipment status value
  size?: 'sm' | 'md' | 'lg'; // Badge size variant
  className?: string;        // Additional CSS classes
}
```

**Implementation Details**:
- Uses existing `EQUIPMENT_STATUS_LABELS` from types
- Uses existing `getEquipmentStatusColor` from utils
- Supports three size variants with appropriate Tailwind classes
- Allows className override for custom styling
- Replaces inline status rendering in 10+ components

**Files to Update**:
- EquipmentCard.js
- EnhancedEquipmentCard.js
- EquipmentDetailView.js
- EquipmentListView.js
- MobileEquipmentCard.js
- BulkDeleteModal.js
- AdminEquipmentManagement.js
- EquipmentManagementContainer.js

### 2. EquipmentCategoriesContext

**Purpose**: Centralize equipment category data loading and sharing across the application.

**Interface**:
```javascript
interface EquipmentCategoriesContextValue {
  categories: Array<Category>;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Hook interface
const useCategories = () => EquipmentCategoriesContextValue
```

**Implementation Details**:
- Wraps existing `useEquipmentCategories` hook
- Provides data through Context API
- Loads categories once on mount
- Exposes refetch function for manual refresh
- Throws error if used outside provider
- Provider wraps App component or equipment section

**Integration Points**:
- App.js or equipment route wrapper
- EquipmentFilters.js
- AdvancedSearchModal.js (both instances)
- MobileEquipmentContainer.js
- CategoryManagement.js

## Data Models

### Category Data Structure

```javascript
// Supports both formats in the system
type Category = {
  id: string;
  name: string;
  // ... other fields
} | string;
```

### Pagination State

```javascript
interface PaginationState {
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  paginatedItems: Array<any>;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
```

### Filter State

```javascript
interface FilterState {
  searchTerm: string;
  selectedCategory: string;
  selectedStatus: string;
  filteredEquipment: Array<Equipment>;
  hasActiveFilters: boolean;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After reviewing the prework analysis, I identified the following testable properties. Many of the requirements focus on code organization and architecture rather than functional behavior, which is appropriate for a refactoring project. The testable properties focus on the functional correctness of the new utilities and hooks we're creating.

**Redundancy Analysis**:
- Properties 3.3 and 3.4 (pagination boundaries) are related but test different boundaries (upper and lower), so both provide value
- Properties 4.2, 4.3, and 4.4 (individual filters) could theoretically be combined, but keeping them separate makes tests clearer and easier to debug
- Property 4.5 (combined filters) is distinct as it tests the interaction between filters

All identified properties provide unique validation value and should be retained.

### Correctness Properties

Property 1: Status badge renders correct color and label
*For any* valid equipment status, the EquipmentStatusBadge component should render with the correct color class and status label corresponding to that status
**Validates: Requirements 1.2**

Property 2: Category name extraction handles both formats
*For any* category (whether stored as an object with id/name or as a string), the getCategoryName utility function should return the correct category name
**Validates: Requirements 1.5**

Property 3: Context throws error outside provider
*When* the useCategories hook is called outside of the EquipmentCategoriesProvider, it should throw a descriptive error message
**Validates: Requirements 2.5**

Property 4: Pagination returns correct page items
*For any* list of items, page size, and valid page number, the usePagination hook should return exactly the correct subset of items for that page
**Validates: Requirements 3.2**

Property 5: Next page respects upper boundary
*For any* pagination state, calling nextPage should never result in a currentPage value greater than totalPages
**Validates: Requirements 3.3**

Property 6: Previous page respects lower boundary
*For any* pagination state, calling previousPage should never result in a currentPage value less than 1
**Validates: Requirements 3.4**

Property 7: Search filter matches all specified fields
*For any* equipment list and search term, all items in the filtered results should contain the search term (case-insensitive) in at least one of: name, brand, model, or equipmentNumber
**Validates: Requirements 4.2**

Property 8: Category filter returns only matching items
*For any* equipment list and selected category, all items in the filtered results should have a category matching the selected category
**Validates: Requirements 4.3**

Property 9: Status filter returns only matching items
*For any* equipment list and selected status, all items in the filtered results should have a status matching the selected status
**Validates: Requirements 4.4**

Property 10: Combined filters apply cumulatively
*For any* equipment list with multiple active filters (search, category, and status), all items in the filtered results should satisfy all active filter conditions simultaneously
**Validates: Requirements 4.5**

## Error Handling

### Component Error Boundaries

- EquipmentStatusBadge should handle invalid status values gracefully by displaying a default "Unknown" badge
- Category utility functions should handle null/undefined inputs by returning safe default values

### Context Error Handling

- useCategories hook must throw a clear error when used outside provider
- Error message should guide developers to wrap components in EquipmentCategoriesProvider
- Category loading errors should be exposed through the context for UI handling

### Hook Error Handling

- usePagination should handle empty arrays gracefully (return empty paginatedItems)
- useEquipmentFilters should handle malformed equipment data without crashing
- All hooks should validate inputs and provide helpful error messages for invalid usage

### Graceful Degradation

- If category data fails to load, components should still render with limited functionality
- Pagination should work even if some items are malformed
- Filters should skip items with missing fields rather than crashing

## Testing Strategy

### Unit Testing Approach

This refactoring project focuses on creating reusable utilities and hooks. Unit tests will verify:

1. **Component Tests**:
   - EquipmentStatusBadge renders correctly for each status value
   - Size variants apply correct CSS classes
   - Custom className props are applied

2. **Utility Function Tests**:
   - getCategoryName handles object categories
   - getCategoryName handles string categories
   - getCategoryId extracts correct ID from objects
   - Functions handle null/undefined gracefully

3. **Hook Tests**:
   - usePagination calculates correct page boundaries
   - useEquipmentFilters applies filters correctly
   - useCategories throws error outside provider

### Property-Based Testing Approach

We will use **fast-check** (JavaScript property-based testing library) to verify universal properties. Each property-based test will run a minimum of 100 iterations with randomly generated inputs.

**Property Test Configuration**:
```javascript
import fc from 'fast-check';

// Example configuration
fc.assert(
  fc.property(/* generators */, (/* inputs */) => {
    // property assertion
  }),
  { numRuns: 100 }
);
```

**Test Tagging Convention**:
All property-based tests must include a comment tag in this exact format:
```javascript
// **Feature: code-cleanup-refactoring, Property {number}: {property description}**
```

**Property Test Coverage**:

1. **Property 1** (Status badge correctness):
   - Generator: Random valid status values from EQUIPMENT_STATUS enum
   - Assertion: Rendered output contains correct color and label

2. **Property 2** (Category name extraction):
   - Generator: Random categories in both object and string formats
   - Assertion: getCategoryName returns expected name for both formats

3. **Property 4** (Pagination correctness):
   - Generator: Random arrays, page sizes, and page numbers
   - Assertion: Returned items match expected slice of array

4. **Property 5** (Next page boundary):
   - Generator: Random pagination states
   - Assertion: nextPage never exceeds totalPages

5. **Property 6** (Previous page boundary):
   - Generator: Random pagination states
   - Assertion: previousPage never goes below 1

6. **Property 7** (Search filter correctness):
   - Generator: Random equipment arrays and search terms
   - Assertion: All results contain search term in specified fields

7. **Property 8** (Category filter correctness):
   - Generator: Random equipment arrays and categories
   - Assertion: All results match selected category

8. **Property 9** (Status filter correctness):
   - Generator: Random equipment arrays and statuses
   - Assertion: All results match selected status

9. **Property 10** (Combined filters):
   - Generator: Random equipment arrays and multiple filter values
   - Assertion: All results satisfy all active filters

**Example Property Test**:
```javascript
// **Feature: code-cleanup-refactoring, Property 2: Category name extraction handles both formats**
describe('getCategoryName property tests', () => {
  it('should extract name from any category format', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string(), // string format
          fc.record({ id: fc.string(), name: fc.string() }) // object format
        ),
        (category) => {
          const result = getCategoryName(category);
          if (typeof category === 'string') {
            expect(result).toBe(category);
          } else {
            expect(result).toBe(category.name);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

Integration tests will verify:

1. **Context Integration**:
   - EquipmentCategoriesProvider loads data correctly
   - Multiple components can consume category data simultaneously
   - Category updates propagate to all consumers

2. **Component Integration**:
   - EquipmentStatusBadge works in all existing component contexts
   - Pagination component integrates with usePagination hook
   - Filter components integrate with useEquipmentFilters hook

3. **Performance Validation**:
   - Verify memoization prevents unnecessary re-renders
   - Measure render times before and after optimization
   - Confirm API calls are reduced as expected

### Testing Tools

- **Jest**: Unit test runner
- **React Testing Library**: Component testing
- **fast-check**: Property-based testing
- **React DevTools Profiler**: Performance measurement
- **jscpd**: Code duplication analysis
- **source-map-explorer**: Bundle size analysis

## Implementation Phases

### Phase 1: Foundation (Quick Wins)

**Goal**: Create reusable utilities and components

1. Create EquipmentStatusBadge component
2. Enhance equipmentHelpers.js with category utilities
3. Verify existing usePagination hook (already exists)
4. Verify existing useEquipmentFilters hook (already exists)

**Deliverables**:
- src/components/equipment/EquipmentStatusBadge.js
- Enhanced src/utils/equipmentHelpers.js
- Unit tests for new code
- Property-based tests for utilities

### Phase 2: Context Integration

**Goal**: Centralize category data management

1. Create EquipmentCategoriesContext
2. Create useCategories hook
3. Wrap application with provider
4. Update consuming components

**Deliverables**:
- src/contexts/EquipmentCategoriesContext.js
- Integration tests
- Updated App.js or route wrapper

### Phase 3: Component Refactoring

**Goal**: Replace duplicated code with reusable components

1. Replace status rendering with EquipmentStatusBadge in all components
2. Replace category display with utility functions
3. Update pagination implementations to use standard component
4. Update filter implementations to use hooks

**Deliverables**:
- Updated 10+ component files
- Removed duplicated code
- All existing tests passing

### Phase 4: Performance Optimization

**Goal**: Add memoization for better performance

1. Add useMemo to expensive calculations
2. Add useCallback to event handlers
3. Profile and measure improvements
4. Document optimization patterns

**Deliverables**:
- Optimized component files
- Performance benchmarks
- Optimization guidelines document

### Phase 5: Cleanup

**Goal**: Remove unused code and organize files

1. Remove unused utility functions
2. Archive old documentation
3. Remove unnecessary test HTML files
4. Clean up scripts directory

**Deliverables**:
- Cleaned codebase
- docs/archive/ directory
- Updated README

### Phase 6: Validation

**Goal**: Verify improvements meet requirements

1. Run code duplication analysis
2. Measure bundle size reduction
3. Count API call reduction
4. Profile render performance
5. Generate metrics report

**Deliverables**:
- Metrics report showing improvements
- Before/after comparisons
- Documentation of achieved goals

## Performance Considerations

### Memoization Strategy

**When to use useMemo**:
- Filtering large arrays (>100 items)
- Sorting operations
- Complex calculations
- Derived state from multiple sources

**When to use useCallback**:
- Event handlers passed to child components
- Functions passed to dependency arrays
- Callbacks used in useEffect

**When NOT to memoize**:
- Simple calculations (addition, string concatenation)
- Primitive value comparisons
- Components that rarely re-render

### Context Performance

- EquipmentCategoriesContext should be high in the tree but not at root
- Consider splitting context if it grows to include unrelated data
- Use context selectors if performance issues arise

### Bundle Size Optimization

- Ensure tree-shaking works correctly
- Remove unused imports
- Consider code splitting for large components
- Lazy load heavy dependencies

## Migration Strategy

### Backward Compatibility

- All changes are internal refactoring
- No breaking changes to public APIs
- Existing components continue to work during migration
- Gradual rollout component by component

### Rollout Plan

1. **Week 1**: Create new utilities and components (Phase 1)
2. **Week 1**: Add context provider (Phase 2)
3. **Week 2**: Migrate components one by one (Phase 3)
4. **Week 2**: Add performance optimizations (Phase 4)
5. **Week 3**: Clean up and validate (Phases 5-6)

### Risk Mitigation

- Comprehensive test coverage before refactoring
- Migrate one component at a time
- Keep old code until new code is verified
- Monitor production metrics during rollout
- Have rollback plan ready

## Success Metrics

### Code Quality Metrics

- **Code Duplication**: < 5% (from 30%)
- **Bundle Size**: -25% or more
- **Test Coverage**: Maintain or improve current coverage
- **Linting Errors**: Zero new errors

### Performance Metrics

- **API Calls**: -80% redundant category fetches
- **Render Time**: -40% average render time
- **Time to Interactive**: Improved or maintained
- **Memory Usage**: Reduced or maintained

### Developer Experience Metrics

- **Time to Add Feature**: Reduced by using established patterns
- **Code Review Time**: Reduced due to less duplication
- **Bug Rate**: Reduced due to centralized logic
- **Onboarding Time**: Reduced due to clearer patterns

## Documentation Updates

### Code Documentation

- Add JSDoc comments to all new utilities
- Document prop types for new components
- Add usage examples in component files
- Create migration guide for developers

### Architecture Documentation

- Update architecture diagrams
- Document new patterns and conventions
- Create decision records for major choices
- Update contributing guidelines

### User-Facing Documentation

- No user-facing changes (internal refactoring only)
- Update developer README if needed
- Document performance improvements in changelog
