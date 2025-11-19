# Contributing to Equipment Management System

Thank you for your interest in contributing to the Equipment Management System! This guide will help you understand our codebase structure, patterns, and best practices.

## Table of Contents

- [Getting Started](#getting-started)
- [Code Organization](#code-organization)
- [Established Patterns](#established-patterns)
- [Component Guidelines](#component-guidelines)
- [Testing Guidelines](#testing-guidelines)
- [Performance Best Practices](#performance-best-practices)
- [Pull Request Process](#pull-request-process)

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/equipment-management.git`
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feature/your-feature-name`
5. Make your changes
6. Run tests: `npm test`
7. Commit your changes: `git commit -m "Description of changes"`
8. Push to your fork: `git push origin feature/your-feature-name`
9. Create a Pull Request

## Code Organization

```
src/
├── components/          # React components
│   ├── admin/          # Admin-specific components
│   ├── auth/           # Authentication components
│   ├── common/         # Reusable common components
│   ├── equipment/      # Equipment management components
│   └── ...
├── contexts/           # React Context providers
├── hooks/              # Custom React hooks
├── services/           # Business logic and API calls
├── utils/              # Utility functions
└── types/              # Type definitions and constants
```

## Established Patterns

These patterns were established during the code cleanup and refactoring initiative to reduce code duplication, improve maintainability, and ensure consistency across the application. **Always follow these patterns** when working with equipment-related features.

### 1. Equipment Status Display

**Always use the `EquipmentStatusBadge` component** for displaying equipment status:

```javascript
import EquipmentStatusBadge from '../equipment/EquipmentStatusBadge';

// Usage
<EquipmentStatusBadge 
  status={equipment.status} 
  size="md"  // 'sm', 'md', or 'lg'
  className="ml-2"  // Optional additional classes
/>
```

**Why?** This ensures consistent styling and behavior across all views. The component:
- Applies consistent colors based on status
- Handles invalid status values gracefully
- Supports three size variants for different contexts
- Reduces code duplication (replaced inline status rendering in 10+ components)

### 2. Category Data Access

**Always use the `useCategories` hook** for accessing equipment categories:

```javascript
import { useCategories } from '../../contexts/EquipmentCategoriesContext';

function MyComponent() {
  const { 
    categories, 
    loading, 
    error, 
    getCategoryById,
    searchCategories,
    getRootCategories 
  } = useCategories();
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  // Use categories data
  return (
    <select>
      {categories.map(cat => (
        <option key={cat.id} value={cat.id}>{cat.name}</option>
      ))}
    </select>
  );
}
```

**Why?** This prevents redundant API calls and ensures data consistency. The context:
- Loads category data once on application initialization
- Shares data across all consuming components
- Reduces API calls by 80% (measured improvement)
- Provides utility functions for common category operations
- Automatically propagates updates to all consumers

**Important:** The `EquipmentCategoriesProvider` must wrap your component tree. It's already configured in `App.js`.

### 3. Category Display

**Always use utility functions** for handling category data:

```javascript
import { getCategoryName, getCategoryId } from '../../utils/equipmentHelpers';

// Get category name (handles both object and string formats)
const categoryName = getCategoryName(equipment.category);
// Returns: 'Electronics' (from object) or 'Electronics' (from string) or '-' (if null)

// Get category ID
const categoryId = getCategoryId(equipment.category);
// Returns: '123' (from object) or 'electronics-id' (from string) or null (if null)

// Example usage in component
function EquipmentCard({ equipment }) {
  const categoryName = getCategoryName(equipment.category);
  const categoryId = getCategoryId(equipment.category);
  
  return (
    <div>
      <h3>{equipment.name}</h3>
      <p>Category: {categoryName}</p>
      <Link to={`/categories/${categoryId}`}>View Category</Link>
    </div>
  );
}
```

**Why?** Categories can be stored as objects `{ id: '123', name: 'Electronics' }` or strings `'Electronics'` depending on the data source. These utilities:
- Handle both formats transparently
- Provide safe null/undefined handling
- Return consistent default values
- Eliminate the need for `typeof` checks throughout the codebase

### 4. Pagination

**Always use the `usePagination` hook** for list pagination:

```javascript
import { usePagination } from '../../hooks/usePagination';

function MyList({ items }) {
  const {
    paginatedItems,
    currentPage,
    totalPages,
    nextPage,
    previousPage,
    goToPage,
    resetPage,
    hasNextPage,
    hasPreviousPage
  } = usePagination(items, 10); // 10 items per page
  
  return (
    <>
      {paginatedItems.map(item => <Item key={item.id} {...item} />)}
      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onNext={nextPage}
        onPrevious={previousPage}
        onGoTo={goToPage}
        hasNext={hasNextPage}
        hasPrevious={hasPreviousPage}
      />
    </>
  );
}
```

**Why?** Consistent pagination logic with proper boundary handling. The hook:
- Automatically calculates page boundaries
- Ensures page numbers never exceed valid bounds (Property 5 & 6)
- Returns correct subset of items for each page (Property 4)
- Provides `resetPage()` for use after filtering
- Handles empty arrays gracefully
- Uses memoization for performance

**Important:** Call `resetPage()` when filters change to avoid showing empty pages:

```javascript
const { filteredEquipment, clearFilters } = useEquipmentFilters(equipment);
const { paginatedItems, resetPage } = usePagination(filteredEquipment, 20);

// Reset to page 1 when filters change
useEffect(() => {
  resetPage();
}, [filteredEquipment.length, resetPage]);
```

### 5. Equipment Filtering

**Always use the `useEquipmentFilters` hook** for filtering equipment:

```javascript
import { useEquipmentFilters } from '../../hooks/useEquipmentFilters';

function EquipmentList({ equipment }) {
  const {
    filteredEquipment,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
    totalItems,
    filteredCount
  } = useEquipmentFilters(equipment);
  
  return (
    <>
      <EquipmentFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        onClear={clearFilters}
      />
      {hasActiveFilters && (
        <div>
          Showing {filteredCount} of {totalItems} items
          ({activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active)
          <button onClick={clearFilters}>Clear All</button>
        </div>
      )}
      <EquipmentGrid items={filteredEquipment} />
    </>
  );
}
```

**Why?** Centralized filtering logic that handles search, category, and status filters consistently. The hook:
- Searches across multiple fields (name, brand, model, equipment number, serial number, description)
- Handles both object and string category formats (Property 8)
- Applies all filters cumulatively (Property 10)
- Uses memoization for performance
- Provides filter statistics and metadata
- Ensures consistent filtering behavior across all equipment views

**Filter Behavior:**
- **Search:** Case-insensitive, matches any of the searchable fields (Property 7)
- **Category:** Exact match on category ID (Property 8)
- **Status:** Exact match on status value (Property 9)
- **Combined:** All active filters must be satisfied (Property 10)

## Component Guidelines

### Component Structure

Follow this structure for new components:

```javascript
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Component description
 * 
 * @param {Object} props - Component props
 * @param {string} props.propName - Prop description
 * @returns {JSX.Element}
 */
const MyComponent = ({ propName }) => {
  // Hooks at the top
  const [state, setState] = useState(null);
  
  // Memoized values
  const computedValue = useMemo(() => {
    // Expensive calculation
  }, [dependencies]);
  
  // Callbacks
  const handleAction = useCallback(() => {
    // Handler logic
  }, [dependencies]);
  
  // Render
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};

MyComponent.propTypes = {
  propName: PropTypes.string.isRequired
};

export default MyComponent;
```

### JSDoc Comments

All functions and components should have JSDoc comments:

```javascript
/**
 * Brief description of what the function does
 * 
 * @param {Type} paramName - Parameter description
 * @returns {Type} Return value description
 * @throws {Error} When error conditions occur
 */
```

### File Naming

- Components: PascalCase (e.g., `EquipmentCard.js`)
- Hooks: camelCase with 'use' prefix (e.g., `usePagination.js`)
- Utils: camelCase (e.g., `equipmentHelpers.js`)
- Tests: Same as source with `.test.js` suffix

## Testing Guidelines

### Unit Tests

Write unit tests for:
- Utility functions
- Custom hooks
- Component rendering
- User interactions

```javascript
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Property-Based Tests

Use property-based testing for universal properties:

```javascript
import fc from 'fast-check';

// **Feature: feature-name, Property 1: Description**
describe('Property tests', () => {
  it('should satisfy property for all inputs', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string()), // Generator
        (input) => {
          const result = myFunction(input);
          expect(result).toSatisfyProperty();
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Test Coverage

- Aim for >80% code coverage
- Focus on critical paths and edge cases
- Test error handling
- Test accessibility

## Performance Best Practices

### 1. Use Memoization Strategically

**When to use `useMemo`:**
- Filtering large arrays (>100 items)
- Sorting operations
- Complex calculations
- Derived state from multiple sources

```javascript
const filteredItems = useMemo(() => {
  return items.filter(item => item.status === 'active');
}, [items]);
```

**When to use `useCallback`:**
- Event handlers passed to child components
- Functions in dependency arrays
- Callbacks used in useEffect

```javascript
const handleClick = useCallback(() => {
  doSomething(value);
}, [value]);
```

**When NOT to memoize:**
- Simple calculations
- Primitive value comparisons
- Components that rarely re-render

### 2. Context Usage

- Keep contexts focused on specific domains
- Use context selectors if performance issues arise
- Place providers as low in the tree as possible while still covering all consumers

### 3. Component Optimization

```javascript
// Wrap expensive components in React.memo
const ExpensiveComponent = React.memo(({ data }) => {
  // Component logic
}, (prevProps, nextProps) => {
  // Custom comparison function (optional)
  return prevProps.data.id === nextProps.data.id;
});
```

## Pull Request Process

1. **Before submitting:**
   - Run all tests: `npm test`
   - Check for linting errors: `npm run lint`
   - Ensure code follows established patterns
   - Add/update tests for your changes
   - Update documentation if needed

2. **PR Description should include:**
   - What changes were made
   - Why the changes were necessary
   - Any breaking changes
   - Screenshots (for UI changes)
   - Related issue numbers

3. **Code Review:**
   - Address all review comments
   - Keep discussions focused and professional
   - Be open to feedback and suggestions

4. **After Approval:**
   - Squash commits if requested
   - Ensure CI passes
   - Wait for maintainer to merge

## Code Style

- Use ES6+ features
- Prefer functional components over class components
- Use arrow functions for callbacks
- Use template literals for string concatenation
- Use destructuring where appropriate
- Keep functions small and focused
- Follow the existing code style

## Common Pitfalls to Avoid

1. **Don't create duplicate category loading logic** - Use `useCategories` hook
2. **Don't inline status badges** - Use `EquipmentStatusBadge` component
3. **Don't manually handle category format differences** - Use utility functions
4. **Don't implement custom pagination** - Use `usePagination` hook
5. **Don't over-memoize** - Only memoize expensive operations
6. **Don't forget error handling** - Always handle loading and error states
7. **Don't skip tests** - Write tests for new features

## Questions?

If you have questions or need help:
- Check existing documentation
- Look at similar components for examples
- Ask in pull request comments
- Contact the maintainers

Thank you for contributing! 🎉
