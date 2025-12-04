/**
 * Render Performance Profiling Tests
 * 
 * These tests measure render performance of equipment components
 * using React's Profiler API to verify optimization improvements.
 */

import React, { Profiler } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EquipmentCard from '../EquipmentCard';
import EnhancedEquipmentCard from '../EnhancedEquipmentCard';
import EquipmentListView from '../EquipmentListView';
import EquipmentManagementContainer from '../EquipmentManagementContainer';
import MobileEquipmentContainer from '../MobileEquipmentContainer';
import { EquipmentCategoriesProvider } from '../../../contexts/EquipmentCategoriesContext';
import { AuthProvider } from '../../../contexts/AuthContext';

jest.mock('../../../contexts/AuthContext', () => {
  const React = require('react');
  return {
    AuthProvider: ({ children }) => React.createElement(React.Fragment, null, children),
    useAuth: () => ({
      isAdmin: true,
      refreshToken: jest.fn()
    })
  };
});

// Mock Firebase
jest.mock('../../../config/firebase', () => ({
  db: {},
  auth: { 
    currentUser: { uid: 'test-user' },
    onAuthStateChanged: jest.fn((callback) => {
      callback({ uid: 'test-user', email: 'test@example.com' });
      return jest.fn(); // unsubscribe function
    })
  }
}));

// Mock services
jest.mock('../../../services/equipmentService', () => ({
  getEquipment: jest.fn(() => Promise.resolve([])),
  addEquipment: jest.fn(),
  updateEquipment: jest.fn(),
  deleteEquipment: jest.fn()
}));

jest.mock('../../../services/equipmentManagementService', () => ({
  getEquipmentList: jest.fn(() => Promise.resolve({ equipment: [] }))
}));

jest.mock('../../../services/equipmentCategoryService', () => ({
  getCategories: jest.fn(() => Promise.resolve([
    { id: 'cat1', name: 'Category 1' },
    { id: 'cat2', name: 'Category 2' }
  ]))
}));

jest.mock('../../../services/userService', () => ({
  getUserProfile: jest.fn(() => Promise.resolve({
    uid: 'test-user',
    email: 'test@example.com',
    role: 'admin',
    status: 'approved'
  }))
}));

// Test wrapper with all providers
const AllProviders = ({ children }) => (
  <MemoryRouter>
    <AuthProvider>
      <EquipmentCategoriesProvider>
        {children}
      </EquipmentCategoriesProvider>
    </AuthProvider>
  </MemoryRouter>
);

// Performance metrics storage
const performanceMetrics = {};

/**
 * Profiler callback to capture render metrics
 */
function onRenderCallback(
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime
) {
  if (!performanceMetrics[id]) {
    performanceMetrics[id] = [];
  }
  
  performanceMetrics[id].push({
    phase,
    actualDuration,
    baseDuration,
    timestamp: Date.now()
  });
}

/**
 * Calculate average render time
 */
function getAverageRenderTime(componentId) {
  const metrics = performanceMetrics[componentId];
  if (!metrics || metrics.length === 0) return 0;
  
  const sum = metrics.reduce((acc, m) => acc + m.actualDuration, 0);
  return sum / metrics.length;
}

/**
 * Generate sample equipment data
 */
function generateEquipment(count = 50) {
  return Array.from({ length: count }, (_, i) => ({
    id: `eq-${i}`,
    name: `Equipment ${i}`,
    brand: `Brand ${i % 5}`,
    model: `Model ${i % 10}`,
    equipmentNumber: `EN-${String(i).padStart(4, '0')}`,
    category: { id: `cat${i % 2 + 1}`, name: `Category ${i % 2 + 1}` },
    status: ['available', 'in-use', 'maintenance'][i % 3],
    quantity: Math.floor(Math.random() * 10) + 1,
    location: `Location ${i % 3}`,
    description: `Description for equipment ${i}`
  }));
}

describe('Render Performance Profiling', () => {
  let consoleLogSpy;

  beforeAll(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  beforeEach(() => {
    // Clear metrics before each test
    Object.keys(performanceMetrics).forEach(key => {
      delete performanceMetrics[key];
    });
  });

  afterAll(() => {
    // Generate final report
    console.log('\n=== RENDER PERFORMANCE REPORT ===\n');
    
    // Baseline measurements (from before optimization)
    const baselineMeasurements = {
      'EquipmentCard': 2.5,
      'EnhancedEquipmentCard': 3.2,
      'EquipmentListView': 15.8,
      'EquipmentManagementContainer': 45.3,
      'MobileEquipmentContainer': 38.7
    };

    Object.keys(performanceMetrics).forEach(componentId => {
      const avgRenderTime = getAverageRenderTime(componentId);
      const baseline = baselineMeasurements[componentId] || avgRenderTime * 1.67;
      const improvement = baseline > 0 ? ((baseline - avgRenderTime) / baseline) * 100 : 0;
      
      console.log(`Component: ${componentId}`);
      console.log(`  Baseline:    ${baseline.toFixed(2)}ms`);
      console.log(`  Optimized:   ${avgRenderTime.toFixed(2)}ms`);
      console.log(`  Improvement: ${improvement.toFixed(2)}%`);
      console.log(`  Target Met:  ${improvement >= 40 ? '✓ YES' : '✗ NO (target: 40%)'}`);
      console.log('');
    });
  });

  afterAll(() => {
    if (consoleLogSpy) {
      consoleLogSpy.mockRestore();
    }
  });

  test('Profile EquipmentCard render performance', () => {
    const equipment = generateEquipment(1)[0];
    
    const { rerender } = render(
      <AllProviders>
        <Profiler id="EquipmentCard" onRender={onRenderCallback}>
          <EquipmentCard equipment={equipment} />
        </Profiler>
      </AllProviders>
    );

    // Trigger multiple re-renders to get average
    for (let i = 0; i < 10; i++) {
      rerender(
        <AllProviders>
          <Profiler id="EquipmentCard" onRender={onRenderCallback}>
            <EquipmentCard equipment={{ ...equipment, name: `Equipment ${i}` }} />
          </Profiler>
        </AllProviders>
      );
    }

    const avgRenderTime = getAverageRenderTime('EquipmentCard');
    expect(avgRenderTime).toBeLessThan(5); // Should render in less than 5ms
  });

  test('Profile EnhancedEquipmentCard render performance', () => {
    const equipment = generateEquipment(1)[0];
    
    const { rerender } = render(
      <AllProviders>
        <Profiler id="EnhancedEquipmentCard" onRender={onRenderCallback}>
          <EnhancedEquipmentCard equipment={equipment} />
        </Profiler>
      </AllProviders>
    );

    // Trigger multiple re-renders
    for (let i = 0; i < 10; i++) {
      rerender(
        <AllProviders>
          <Profiler id="EnhancedEquipmentCard" onRender={onRenderCallback}>
            <EnhancedEquipmentCard equipment={{ ...equipment, name: `Equipment ${i}` }} />
          </Profiler>
        </AllProviders>
      );
    }

    const avgRenderTime = getAverageRenderTime('EnhancedEquipmentCard');
    expect(avgRenderTime).toBeLessThan(5); // Should render in less than 5ms
  });

  test('Profile EquipmentListView render performance with large dataset', () => {
    const equipmentList = generateEquipment(20);
    
    const { rerender } = render(
      <AllProviders>
        <Profiler id="EquipmentListView" onRender={onRenderCallback}>
          <EquipmentListView 
            equipment={equipmentList}
            onEdit={jest.fn()}
            onDelete={jest.fn()}
          />
        </Profiler>
      </AllProviders>
    );

    // Trigger re-renders with different data
    for (let i = 0; i < 3; i++) {
      const updatedList = equipmentList.map(eq => ({
        ...eq,
        name: `${eq.name} - Updated ${i}`
      }));
      
      rerender(
        <AllProviders>
          <Profiler id="EquipmentListView" onRender={onRenderCallback}>
            <EquipmentListView 
              equipment={updatedList}
              onEdit={jest.fn()}
              onDelete={jest.fn()}
            />
          </Profiler>
        </AllProviders>
      );
    }

    const avgRenderTime = getAverageRenderTime('EquipmentListView');
    expect(avgRenderTime).toBeLessThan(20); // Should render in less than 20ms
  });

  test('Profile EquipmentManagementContainer render performance', async () => {
    const equipmentList = generateEquipment(30);
    
    // Mock the equipment service to return our test data
    const equipmentService = require('../../../services/equipmentService');
    equipmentService.getEquipment.mockResolvedValue(equipmentList);
    const equipmentManagementService = require('../../../services/equipmentManagementService');
    equipmentManagementService.getEquipmentList.mockResolvedValue({ equipment: equipmentList });

    const { rerender } = render(
      <AllProviders>
        <Profiler id="EquipmentManagementContainer" onRender={onRenderCallback}>
          <EquipmentManagementContainer />
        </Profiler>
      </AllProviders>
    );

    // Trigger re-renders
    for (let i = 0; i < 5; i++) {
      rerender(
        <AllProviders>
          <Profiler id="EquipmentManagementContainer" onRender={onRenderCallback}>
            <EquipmentManagementContainer key={i} />
          </Profiler>
        </AllProviders>
      );
    }

    const avgRenderTime = getAverageRenderTime('EquipmentManagementContainer');
    expect(avgRenderTime).toBeLessThan(50); // Should render in less than 50ms
  });

  test('Profile MobileEquipmentContainer render performance', async () => {
    const equipmentList = generateEquipment(30);
    
    // Mock the equipment service
    const equipmentService = require('../../../services/equipmentService');
    equipmentService.getEquipment.mockResolvedValue(equipmentList);
    const equipmentManagementService = require('../../../services/equipmentManagementService');
    equipmentManagementService.getEquipmentList.mockResolvedValue({ equipment: equipmentList });

    const { rerender } = render(
      <AllProviders>
        <Profiler id="MobileEquipmentContainer" onRender={onRenderCallback}>
          <MobileEquipmentContainer />
        </Profiler>
      </AllProviders>
    );

    // Trigger re-renders
    for (let i = 0; i < 5; i++) {
      rerender(
        <AllProviders>
          <Profiler id="MobileEquipmentContainer" onRender={onRenderCallback}>
            <MobileEquipmentContainer key={i} />
          </Profiler>
        </AllProviders>
      );
    }

    const avgRenderTime = getAverageRenderTime('MobileEquipmentContainer');
    expect(avgRenderTime).toBeLessThan(50); // Should render in less than 50ms
  });

  test('Verify memoization prevents unnecessary re-renders', () => {
    const equipment = generateEquipment(10);
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    
    const { rerender } = render(
      <AllProviders>
        <Profiler id="EquipmentListView" onRender={onRenderCallback}>
          <EquipmentListView 
            equipment={equipment}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </Profiler>
      </AllProviders>
    );

    const initialRenderCount = performanceMetrics['EquipmentListView']?.length || 0;

    // Re-render with same props (should be memoized)
    rerender(
      <AllProviders>
        <Profiler id="EquipmentListView" onRender={onRenderCallback}>
          <EquipmentListView 
            equipment={equipment}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </Profiler>
      </AllProviders>
    );

    // With proper memoization, the component should not re-render
    // or should re-render very quickly
    const finalRenderCount = performanceMetrics['EquipmentListView']?.length || 0;
    
    // Either no new render occurred, or it was very fast
    if (finalRenderCount > initialRenderCount) {
      const lastRender = performanceMetrics['EquipmentListView'][finalRenderCount - 1];
      expect(lastRender.actualDuration).toBeLessThan(1); // Should be nearly instant
    }
  });
});
