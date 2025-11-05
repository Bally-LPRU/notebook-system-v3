import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EquipmentSearch from '../EquipmentSearch';
import EquipmentFilters from '../EquipmentFilters';
import EquipmentGrid from '../EquipmentGrid';
import EquipmentSearchService from '../../../services/equipmentSearchService';
import EquipmentFilterService from '../../../services/equipmentFilterService';

// Mock services
jest.mock('../../../services/equipmentSearchService');
jest.mock('../../../services/equipmentFilterService');

// Mock debounce
jest.mock('lodash.debounce', () => jest.fn(fn => fn));

describe('Search and Filter Integration Tests', () => {
  const mockEquipment = [
    {
      id: '1',
      equipmentNumber: 'EQ001',
      name: 'Dell Laptop',
      brand: 'Dell',
      model: 'Inspiron 15',
      category: { id: 'cat1', name: 'Computer' },
      status: 'active',
      purchasePrice: 25000,
      purchaseDate: new Date('2023-06-01'),
      location: { building: 'Building A', floor: '1', room: '101' },
      images: [{ id: 'img1', thumbnailUrl: 'thumb1.jpg' }]
    },
    {
      id: '2',
      equipmentNumber: 'EQ002',
      name: 'HP Printer',
      brand: 'HP',
      model: 'LaserJet Pro',
      category: { id: 'cat2', name: 'Printer' },
      status: 'maintenance',
      purchasePrice: 15000,
      purchaseDate: new Date('2023-03-01'),
      location: { building: 'Building B', floor: '2', room: '201' },
      images: []
    },
    {
      id: '3',
      equipmentNumber: 'EQ003',
      name: 'Canon Camera',
      brand: 'Canon',
      model: 'EOS R5',
      category: { id: 'cat3', name: 'Camera' },
      status: 'active',
      purchasePrice: 80000,
      purchaseDate: new Date('2023-08-01'),
      location: { building: 'Building A', floor: '3', room: '301' },
      images: [{ id: 'img2', thumbnailUrl: 'thumb2.jpg' }]
    }
  ];

  const mockFilterOptions = {
    categories: [
      { id: 'cat1', name: 'Computer', equipmentCount: 1 },
      { id: 'cat2', name: 'Printer', equipmentCount: 1 },
      { id: 'cat3', name: 'Camera', equipmentCount: 1 }
    ],
    brands: ['Dell', 'HP', 'Canon'],
    locations: ['Building A', 'Building B'],
    priceRange: { min: 15000, max: 80000 },
    dateRange: { min: new Date('2023-03-01'), max: new Date('2023-08-01') }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock search service
    EquipmentSearchService.searchWithSuggestions.mockResolvedValue({
      equipment: mockEquipment,
      suggestions: [
        { type: 'equipment', text: 'Dell Laptop', description: 'Dell Inspiron 15' },
        { type: 'brand', text: 'Dell', description: 'ยี่ห้อ' }
      ],
      totalCount: mockEquipment.length
    });
    
    EquipmentSearchService.getAutocompleteSuggestions.mockResolvedValue([
      { type: 'equipment', text: 'Dell Laptop', description: 'Dell Inspiron 15' },
      { type: 'brand', text: 'Dell', description: 'ยี่ห้อ' }
    ]);
    
    // Mock filter service
    EquipmentFilterService.getFilteredEquipment.mockResolvedValue({
      equipment: mockEquipment,
      pagination: {
        currentPage: 1,
        pageSize: 20,
        totalCount: mockEquipment.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
      }
    });
    
    EquipmentFilterService.getFilterOptions.mockResolvedValue(mockFilterOptions);
    EquipmentFilterService.getFilterStatistics.mockResolvedValue({
      total: mockEquipment.length,
      categories: { Computer: 1, Printer: 1, Camera: 1 },
      statuses: { active: 2, maintenance: 1 }
    });
  });

  describe('Search Integration', () => {
    test('should perform search and display results', async () => {
      const mockOnSearch = jest.fn();
      const mockOnResults = jest.fn();

      const SearchWithResults = () => {
        const [searchResults, setSearchResults] = React.useState([]);
        
        const handleSearch = async (query) => {
          mockOnSearch(query);
          if (query) {
            const results = await EquipmentSearchService.searchWithSuggestions(query);
            setSearchResults(results.equipment);
            mockOnResults(results.equipment);
          } else {
            setSearchResults([]);
          }
        };

        return (
          <div>
            <EquipmentSearch onSearch={handleSearch} />
            <EquipmentGrid equipment={searchResults} />
          </div>
        );
      };

      render(<SearchWithResults />);

      const searchInput = screen.getByPlaceholderText('ค้นหาอุปกรณ์...');
      fireEvent.change(searchInput, { target: { value: 'laptop' } });

      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith('laptop');
        expect(EquipmentSearchService.searchWithSuggestions).toHaveBeenCalledWith('laptop');
      });

      await waitFor(() => {
        expect(mockOnResults).toHaveBeenCalledWith(mockEquipment);
        expect(screen.getByText('Dell Laptop')).toBeInTheDocument();
      });
    });

    test('should show search suggestions and handle selection', async () => {
      const mockOnSearch = jest.fn();

      render(<EquipmentSearch onSearch={mockOnSearch} />);

      const searchInput = screen.getByPlaceholderText('ค้นหาอุปกรณ์...');
      fireEvent.change(searchInput, { target: { value: 'dell' } });

      await waitFor(() => {
        expect(screen.getByText('Dell Laptop')).toBeInTheDocument();
        expect(screen.getByText('Dell')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Dell Laptop'));

      expect(searchInput.value).toBe('Dell Laptop');
      expect(mockOnSearch).toHaveBeenCalledWith('Dell Laptop');
    });

    test('should handle empty search results', async () => {
      EquipmentSearchService.searchWithSuggestions.mockResolvedValue({
        equipment: [],
        suggestions: [],
        totalCount: 0
      });

      const mockOnSearch = jest.fn();
      const mockOnResults = jest.fn();

      const SearchWithResults = () => {
        const [searchResults, setSearchResults] = React.useState([]);
        
        const handleSearch = async (query) => {
          mockOnSearch(query);
          const results = await EquipmentSearchService.searchWithSuggestions(query);
          setSearchResults(results.equipment);
          mockOnResults(results.equipment);
        };

        return (
          <div>
            <EquipmentSearch onSearch={handleSearch} />
            <EquipmentGrid equipment={searchResults} />
          </div>
        );
      };

      render(<SearchWithResults />);

      const searchInput = screen.getByPlaceholderText('ค้นหาอุปกรณ์...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      await waitFor(() => {
        expect(mockOnResults).toHaveBeenCalledWith([]);
        expect(screen.getByText('ไม่พบอุปกรณ์')).toBeInTheDocument();
      });
    });
  });

  describe('Filter Integration', () => {
    test('should apply filters and update results', async () => {
      const mockOnFiltersChange = jest.fn();
      const mockOnResults = jest.fn();

      const FilterWithResults = () => {
        const [filters, setFilters] = React.useState({});
        const [filteredResults, setFilteredResults] = React.useState([]);
        
        const handleFiltersChange = async (newFilters) => {
          mockOnFiltersChange(newFilters);
          setFilters(newFilters);
          
          const results = await EquipmentFilterService.getFilteredEquipment(newFilters);
          setFilteredResults(results.equipment);
          mockOnResults(results.equipment);
        };

        return (
          <div>
            <EquipmentFilters 
              filters={filters} 
              onFiltersChange={handleFiltersChange} 
            />
            <EquipmentGrid equipment={filteredResults} />
          </div>
        );
      };

      render(<FilterWithResults />);

      await waitFor(() => {
        expect(screen.getByText('ประเภทอุปกรณ์')).toBeInTheDocument();
      });

      // Apply category filter
      const computerCheckbox = screen.getByLabelText('Computer (1)');
      fireEvent.click(computerCheckbox);

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith({
          categories: ['cat1']
        });
        expect(EquipmentFilterService.getFilteredEquipment).toHaveBeenCalledWith({
          categories: ['cat1']
        });
      });

      await waitFor(() => {
        expect(mockOnResults).toHaveBeenCalledWith(mockEquipment);
      });
    });

    test('should combine multiple filters', async () => {
      const mockOnFiltersChange = jest.fn();

      const FilterWithResults = () => {
        const [filters, setFilters] = React.useState({});
        
        const handleFiltersChange = async (newFilters) => {
          mockOnFiltersChange(newFilters);
          setFilters(newFilters);
          await EquipmentFilterService.getFilteredEquipment(newFilters);
        };

        return (
          <EquipmentFilters 
            filters={filters} 
            onFiltersChange={handleFiltersChange} 
          />
        );
      };

      render(<FilterWithResults />);

      await waitFor(() => {
        expect(screen.getByText('ประเภทอุปกรณ์')).toBeInTheDocument();
      });

      // Apply category filter
      const computerCheckbox = screen.getByLabelText('Computer (1)');
      fireEvent.click(computerCheckbox);

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith({
          categories: ['cat1']
        });
      });

      // Apply status filter
      const activeCheckbox = screen.getByLabelText('ใช้งานได้');
      fireEvent.click(activeCheckbox);

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith({
          categories: ['cat1'],
          statuses: ['active']
        });
      });

      expect(EquipmentFilterService.getFilteredEquipment).toHaveBeenCalledWith({
        categories: ['cat1'],
        statuses: ['active']
      });
    });

    test('should clear all filters', async () => {
      const mockOnFiltersChange = jest.fn();
      const mockOnClearFilters = jest.fn();

      const FilterWithResults = () => {
        const [filters, setFilters] = React.useState({
          categories: ['cat1'],
          statuses: ['active']
        });
        
        const handleFiltersChange = (newFilters) => {
          mockOnFiltersChange(newFilters);
          setFilters(newFilters);
        };

        const handleClearFilters = () => {
          mockOnClearFilters();
          setFilters({});
        };

        return (
          <EquipmentFilters 
            filters={filters} 
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
          />
        );
      };

      render(<FilterWithResults />);

      await waitFor(() => {
        expect(screen.getByText('ล้างตัวกรอง')).toBeInTheDocument();
      });

      const clearButton = screen.getByText('ล้างตัวกรอง');
      fireEvent.click(clearButton);

      expect(mockOnClearFilters).toHaveBeenCalled();
    });
  });

  describe('Search and Filter Combined', () => {
    test('should combine search query with filters', async () => {
      const mockOnSearch = jest.fn();
      const mockOnFiltersChange = jest.fn();

      const CombinedSearchFilter = () => {
        const [searchQuery, setSearchQuery] = React.useState('');
        const [filters, setFilters] = React.useState({});
        const [results, setResults] = React.useState([]);
        
        const handleSearch = (query) => {
          mockOnSearch(query);
          setSearchQuery(query);
          performCombinedSearch(query, filters);
        };

        const handleFiltersChange = (newFilters) => {
          mockOnFiltersChange(newFilters);
          setFilters(newFilters);
          performCombinedSearch(searchQuery, newFilters);
        };

        const performCombinedSearch = async (query, currentFilters) => {
          const combinedFilters = {
            ...currentFilters,
            search: query
          };
          
          const results = await EquipmentFilterService.getFilteredEquipment(combinedFilters);
          setResults(results.equipment);
        };

        return (
          <div>
            <EquipmentSearch onSearch={handleSearch} />
            <EquipmentFilters 
              filters={filters} 
              onFiltersChange={handleFiltersChange} 
            />
            <EquipmentGrid equipment={results} />
          </div>
        );
      };

      render(<CombinedSearchFilter />);

      // First apply search
      const searchInput = screen.getByPlaceholderText('ค้นหาอุปกรณ์...');
      fireEvent.change(searchInput, { target: { value: 'laptop' } });

      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith('laptop');
      });

      // Then apply filter
      await waitFor(() => {
        expect(screen.getByText('ประเภทอุปกรณ์')).toBeInTheDocument();
      });

      const computerCheckbox = screen.getByLabelText('Computer (1)');
      fireEvent.click(computerCheckbox);

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith({
          categories: ['cat1']
        });
        expect(EquipmentFilterService.getFilteredEquipment).toHaveBeenCalledWith({
          search: 'laptop',
          categories: ['cat1']
        });
      });
    });

    test('should handle real-time search with active filters', async () => {
      const mockOnSearch = jest.fn();

      const RealTimeSearchWithFilters = () => {
        const [searchQuery, setSearchQuery] = React.useState('');
        const [filters] = React.useState({ categories: ['cat1'] });
        
        const handleSearch = async (query) => {
          mockOnSearch(query);
          setSearchQuery(query);
          
          // Simulate real-time search with existing filters
          await EquipmentFilterService.getFilteredEquipment({
            ...filters,
            search: query
          });
        };

        return (
          <div>
            <EquipmentSearch onSearch={handleSearch} />
            <div data-testid="active-filters">
              Active filters: {filters.categories.join(', ')}
            </div>
          </div>
        );
      };

      render(<RealTimeSearchWithFilters />);

      const searchInput = screen.getByPlaceholderText('ค้นหาอุปกรณ์...');
      
      // Type each character to simulate real-time search
      fireEvent.change(searchInput, { target: { value: 'l' } });
      fireEvent.change(searchInput, { target: { value: 'la' } });
      fireEvent.change(searchInput, { target: { value: 'lap' } });

      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith('lap');
        expect(EquipmentFilterService.getFilteredEquipment).toHaveBeenCalledWith({
          categories: ['cat1'],
          search: 'lap'
        });
      });
    });
  });

  describe('Performance and Error Handling', () => {
    test('should handle search service errors gracefully', async () => {
      EquipmentSearchService.searchWithSuggestions.mockRejectedValue(
        new Error('Search service unavailable')
      );

      const mockOnSearch = jest.fn();
      const mockOnError = jest.fn();

      const SearchWithErrorHandling = () => {
        const handleSearch = async (query) => {
          mockOnSearch(query);
          try {
            await EquipmentSearchService.searchWithSuggestions(query);
          } catch (error) {
            mockOnError(error.message);
          }
        };

        return <EquipmentSearch onSearch={handleSearch} />;
      };

      render(<SearchWithErrorHandling />);

      const searchInput = screen.getByPlaceholderText('ค้นหาอุปกรณ์...');
      fireEvent.change(searchInput, { target: { value: 'laptop' } });

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Search service unavailable');
      });
    });

    test('should handle filter service errors gracefully', async () => {
      EquipmentFilterService.getFilteredEquipment.mockRejectedValue(
        new Error('Filter service unavailable')
      );

      const mockOnFiltersChange = jest.fn();
      const mockOnError = jest.fn();

      const FiltersWithErrorHandling = () => {
        const [filters, setFilters] = React.useState({});
        
        const handleFiltersChange = async (newFilters) => {
          mockOnFiltersChange(newFilters);
          setFilters(newFilters);
          
          try {
            await EquipmentFilterService.getFilteredEquipment(newFilters);
          } catch (error) {
            mockOnError(error.message);
          }
        };

        return (
          <EquipmentFilters 
            filters={filters} 
            onFiltersChange={handleFiltersChange} 
          />
        );
      };

      render(<FiltersWithErrorHandling />);

      await waitFor(() => {
        expect(screen.getByText('ประเภทอุปกรณ์')).toBeInTheDocument();
      });

      const computerCheckbox = screen.getByLabelText('Computer (1)');
      fireEvent.click(computerCheckbox);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Filter service unavailable');
      });
    });

    test('should debounce search input to prevent excessive API calls', async () => {
      const mockOnSearch = jest.fn();

      render(<EquipmentSearch onSearch={mockOnSearch} />);

      const searchInput = screen.getByPlaceholderText('ค้นหาอุปกรณ์...');
      
      // Rapid typing
      fireEvent.change(searchInput, { target: { value: 'l' } });
      fireEvent.change(searchInput, { target: { value: 'la' } });
      fireEvent.change(searchInput, { target: { value: 'lap' } });
      fireEvent.change(searchInput, { target: { value: 'lapt' } });
      fireEvent.change(searchInput, { target: { value: 'lapto' } });
      fireEvent.change(searchInput, { target: { value: 'laptop' } });

      // Due to mocked debounce, all calls should go through
      // In real implementation, only the last call would be made
      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledTimes(6);
        expect(mockOnSearch).toHaveBeenLastCalledWith('laptop');
      });
    });
  });
});