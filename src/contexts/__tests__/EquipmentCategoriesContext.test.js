import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { EquipmentCategoriesProvider, useCategories } from '../EquipmentCategoriesContext';

// Mock the useEquipmentCategories hook
jest.mock('../../hooks/useEquipmentCategories');

// Test component to access categories context
const TestComponent = () => {
  const {
    categories,
    loading,
    error,
    refetch,
    getCategoryById,
    getCategoriesByParent,
    getRootCategories,
    getCategoryHierarchy,
    getCategoryPath,
    searchCategories
  } = useCategories();

  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <div data-testid="categories-count">{categories.length}</div>
      <div data-testid="has-refetch">{typeof refetch === 'function' ? 'has-refetch' : 'no-refetch'}</div>
      <div data-testid="has-getCategoryById">{typeof getCategoryById === 'function' ? 'has-getCategoryById' : 'no-getCategoryById'}</div>
      <div data-testid="has-getCategoriesByParent">{typeof getCategoriesByParent === 'function' ? 'has-getCategoriesByParent' : 'no-getCategoriesByParent'}</div>
      <div data-testid="has-getRootCategories">{typeof getRootCategories === 'function' ? 'has-getRootCategories' : 'no-getRootCategories'}</div>
      <div data-testid="has-getCategoryHierarchy">{typeof getCategoryHierarchy === 'function' ? 'has-getCategoryHierarchy' : 'no-getCategoryHierarchy'}</div>
      <div data-testid="has-getCategoryPath">{typeof getCategoryPath === 'function' ? 'has-getCategoryPath' : 'no-getCategoryPath'}</div>
      <div data-testid="has-searchCategories">{typeof searchCategories === 'function' ? 'has-searchCategories' : 'no-searchCategories'}</div>
      <button onClick={refetch} data-testid="refetch-button">Refetch</button>
    </div>
  );
};

describe('EquipmentCategoriesContext', () => {
  let mockUseEquipmentCategories;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseEquipmentCategories = require('../../hooks/useEquipmentCategories').useEquipmentCategories;
  });

  describe('Provider loads categories on mount', () => {
    it('should provide loading state initially', () => {
      mockUseEquipmentCategories.mockReturnValue({
        categories: [],
        loading: true,
        error: null,
        getCategoryById: jest.fn(),
        getCategoriesByParent: jest.fn(),
        getRootCategories: jest.fn(),
        getCategoryHierarchy: jest.fn(),
        getCategoryPath: jest.fn(),
        searchCategories: jest.fn()
      });

      render(
        <EquipmentCategoriesProvider>
          <TestComponent />
        </EquipmentCategoriesProvider>
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('loading');
      expect(screen.getByTestId('categories-count')).toHaveTextContent('0');
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    });

    it('should provide categories after loading', () => {
      const mockCategories = [
        { id: 'cat1', name: 'Category 1', isActive: true },
        { id: 'cat2', name: 'Category 2', isActive: true },
        { id: 'cat3', name: 'Category 3', isActive: true }
      ];

      mockUseEquipmentCategories.mockReturnValue({
        categories: mockCategories,
        loading: false,
        error: null,
        getCategoryById: jest.fn(),
        getCategoriesByParent: jest.fn(),
        getRootCategories: jest.fn(),
        getCategoryHierarchy: jest.fn(),
        getCategoryPath: jest.fn(),
        searchCategories: jest.fn()
      });

      render(
        <EquipmentCategoriesProvider>
          <TestComponent />
        </EquipmentCategoriesProvider>
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      expect(screen.getByTestId('categories-count')).toHaveTextContent('3');
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    });

    it('should provide error state when loading fails', () => {
      const mockError = 'Failed to load categories';

      mockUseEquipmentCategories.mockReturnValue({
        categories: [],
        loading: false,
        error: mockError,
        getCategoryById: jest.fn(),
        getCategoriesByParent: jest.fn(),
        getRootCategories: jest.fn(),
        getCategoryHierarchy: jest.fn(),
        getCategoryPath: jest.fn(),
        searchCategories: jest.fn()
      });

      render(
        <EquipmentCategoriesProvider>
          <TestComponent />
        </EquipmentCategoriesProvider>
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      expect(screen.getByTestId('error')).toHaveTextContent(mockError);
      expect(screen.getByTestId('categories-count')).toHaveTextContent('0');
    });
  });

  describe('useCategories returns correct data', () => {
    it('should return all categories data', () => {
      const mockCategories = [
        { id: 'cat1', name: 'Category 1' },
        { id: 'cat2', name: 'Category 2' }
      ];

      mockUseEquipmentCategories.mockReturnValue({
        categories: mockCategories,
        loading: false,
        error: null,
        getCategoryById: jest.fn(),
        getCategoriesByParent: jest.fn(),
        getRootCategories: jest.fn(),
        getCategoryHierarchy: jest.fn(),
        getCategoryPath: jest.fn(),
        searchCategories: jest.fn()
      });

      render(
        <EquipmentCategoriesProvider>
          <TestComponent />
        </EquipmentCategoriesProvider>
      );

      expect(screen.getByTestId('categories-count')).toHaveTextContent('2');
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    });

    it('should return refetch function', () => {
      mockUseEquipmentCategories.mockReturnValue({
        categories: [],
        loading: false,
        error: null,
        getCategoryById: jest.fn(),
        getCategoriesByParent: jest.fn(),
        getRootCategories: jest.fn(),
        getCategoryHierarchy: jest.fn(),
        getCategoryPath: jest.fn(),
        searchCategories: jest.fn()
      });

      render(
        <EquipmentCategoriesProvider>
          <TestComponent />
        </EquipmentCategoriesProvider>
      );

      expect(screen.getByTestId('has-refetch')).toHaveTextContent('has-refetch');
    });

    it('should return all utility functions', () => {
      mockUseEquipmentCategories.mockReturnValue({
        categories: [],
        loading: false,
        error: null,
        getCategoryById: jest.fn(),
        getCategoriesByParent: jest.fn(),
        getRootCategories: jest.fn(),
        getCategoryHierarchy: jest.fn(),
        getCategoryPath: jest.fn(),
        searchCategories: jest.fn()
      });

      render(
        <EquipmentCategoriesProvider>
          <TestComponent />
        </EquipmentCategoriesProvider>
      );

      expect(screen.getByTestId('has-getCategoryById')).toHaveTextContent('has-getCategoryById');
      expect(screen.getByTestId('has-getCategoriesByParent')).toHaveTextContent('has-getCategoriesByParent');
      expect(screen.getByTestId('has-getRootCategories')).toHaveTextContent('has-getRootCategories');
      expect(screen.getByTestId('has-getCategoryHierarchy')).toHaveTextContent('has-getCategoryHierarchy');
      expect(screen.getByTestId('has-getCategoryPath')).toHaveTextContent('has-getCategoryPath');
      expect(screen.getByTestId('has-searchCategories')).toHaveTextContent('has-searchCategories');
    });
  });

  describe('refetch function works correctly', () => {
    it('should provide a refetch function', () => {
      mockUseEquipmentCategories.mockReturnValue({
        categories: [],
        loading: false,
        error: null,
        getCategoryById: jest.fn(),
        getCategoriesByParent: jest.fn(),
        getRootCategories: jest.fn(),
        getCategoryHierarchy: jest.fn(),
        getCategoryPath: jest.fn(),
        searchCategories: jest.fn()
      });

      render(
        <EquipmentCategoriesProvider>
          <TestComponent />
        </EquipmentCategoriesProvider>
      );

      const refetchButton = screen.getByTestId('refetch-button');
      expect(refetchButton).toBeInTheDocument();
    });

    it('should call window.location.reload when refetch is called', () => {
      // Mock window.location.reload using Object.defineProperty
      const reloadMock = jest.fn();
      delete window.location;
      window.location = { reload: reloadMock };

      mockUseEquipmentCategories.mockReturnValue({
        categories: [],
        loading: false,
        error: null,
        getCategoryById: jest.fn(),
        getCategoriesByParent: jest.fn(),
        getRootCategories: jest.fn(),
        getCategoryHierarchy: jest.fn(),
        getCategoryPath: jest.fn(),
        searchCategories: jest.fn()
      });

      render(
        <EquipmentCategoriesProvider>
          <TestComponent />
        </EquipmentCategoriesProvider>
      );

      const refetchButton = screen.getByTestId('refetch-button');
      refetchButton.click();

      expect(reloadMock).toHaveBeenCalled();
    });
  });

  describe('Context usage outside provider', () => {
    it('should throw error when useCategories is used outside provider', () => {
      // Mock console.error to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useCategories must be used within an EquipmentCategoriesProvider');

      consoleSpy.mockRestore();
    });

    it('should include helpful error message', () => {
      // Mock console.error to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      try {
        render(<TestComponent />);
      } catch (error) {
        expect(error.message).toContain('EquipmentCategoriesProvider');
        expect(error.message).toContain('wrap your component tree');
      }

      consoleSpy.mockRestore();
    });
  });
});
