import React from 'react';
import { render } from '@testing-library/react';
import { jest } from '@jest/globals';
import fc from 'fast-check';
import { useCategories } from '../EquipmentCategoriesContext';

// **Feature: code-cleanup-refactoring, Property 3: Context throws error outside provider**

describe('EquipmentCategoriesContext Property Tests', () => {
  describe('Property 3: Context throws error outside provider', () => {
    it('should throw descriptive error when useCategories is used outside provider for any component', () => {
      // Mock console.error to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }), // Random component name
          (componentName) => {
            // Create a test component that uses the hook
            const TestComponent = () => {
              try {
                useCategories();
                return <div data-testid={componentName}>Should not render</div>;
              } catch (error) {
                // Verify the error is thrown and has the correct message
                expect(error).toBeDefined();
                expect(error.message).toContain('useCategories must be used within an EquipmentCategoriesProvider');
                expect(error.message).toContain('wrap your component tree');
                expect(error.message).toContain('EquipmentCategoriesProvider');
                throw error; // Re-throw to satisfy the test
              }
            };

            // Attempt to render without provider should throw
            expect(() => {
              render(<TestComponent />);
            }).toThrow('useCategories must be used within an EquipmentCategoriesProvider');
          }
        ),
        { numRuns: 100 }
      );

      consoleSpy.mockRestore();
    });

    it('should throw error with consistent message format for any usage pattern', () => {
      // Mock console.error to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      fc.assert(
        fc.property(
          fc.record({
            testId: fc.string({ minLength: 1, maxLength: 20 }),
            className: fc.string({ minLength: 0, maxLength: 30 }),
            dataAttr: fc.string({ minLength: 0, maxLength: 20 })
          }),
          (props) => {
            // Create a component with various props
            const TestComponent = () => {
              try {
                const context = useCategories();
                return (
                  <div 
                    data-testid={props.testId}
                    className={props.className}
                    data-custom={props.dataAttr}
                  >
                    {context.categories.length}
                  </div>
                );
              } catch (error) {
                // Verify error message structure
                expect(error.message).toMatch(/useCategories must be used within an EquipmentCategoriesProvider/);
                expect(error.message).toMatch(/wrap your component tree/);
                throw error;
              }
            };

            // Should always throw when used outside provider
            expect(() => {
              render(<TestComponent />);
            }).toThrow();
          }
        ),
        { numRuns: 100 }
      );

      consoleSpy.mockRestore();
    });

    it('should throw error regardless of when useCategories is called in component lifecycle', () => {
      // Mock console.error to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      fc.assert(
        fc.property(
          fc.boolean(), // Random flag to determine if we call hook conditionally
          fc.nat(10), // Random number for conditional logic
          (shouldCallImmediately, randomValue) => {
            const TestComponent = () => {
              // Try different patterns of calling the hook
              if (shouldCallImmediately || randomValue > 5) {
                try {
                  useCategories();
                  return <div>Should not render</div>;
                } catch (error) {
                  expect(error.message).toContain('useCategories must be used within an EquipmentCategoriesProvider');
                  throw error;
                }
              } else {
                try {
                  const context = useCategories();
                  return <div>{context.loading ? 'loading' : 'loaded'}</div>;
                } catch (error) {
                  expect(error.message).toContain('useCategories must be used within an EquipmentCategoriesProvider');
                  throw error;
                }
              }
            };

            // Should always throw
            expect(() => {
              render(<TestComponent />);
            }).toThrow('useCategories must be used within an EquipmentCategoriesProvider');
          }
        ),
        { numRuns: 100 }
      );

      consoleSpy.mockRestore();
    });
  });
});
