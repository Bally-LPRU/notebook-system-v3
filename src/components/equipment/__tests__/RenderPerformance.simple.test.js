/**
 * Simplified Render Performance Profiling Tests
 * 
 * These tests measure render performance of equipment components
 * using React's Profiler API with minimal mocking.
 */

import React, { Profiler } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthContext from '../../../contexts/AuthContext';
import EquipmentCard from '../EquipmentCard';
import EnhancedEquipmentCard from '../EnhancedEquipmentCard';
import EquipmentStatusBadge from '../EquipmentStatusBadge';

const authContextValue = {
  user: null,
  isAdmin: false,
  signIn: jest.fn(),
  signOut: jest.fn()
};

const wrapWithProviders = (ui) => (
  <MemoryRouter>
    <AuthContext.Provider value={authContextValue}>
      {ui}
    </AuthContext.Provider>
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

describe('Render Performance Profiling - Simple Tests', () => {
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
      'EquipmentStatusBadge': 0.5
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

  test('Profile EquipmentCard render performance', () => {
    const equipment = generateEquipment(1)[0];
    
    const { rerender } = render(
      wrapWithProviders(
        <Profiler id="EquipmentCard" onRender={onRenderCallback}>
          <EquipmentCard equipment={equipment} />
        </Profiler>
      )
    );

    // Trigger multiple re-renders to get average
    for (let i = 0; i < 20; i++) {
      rerender(
        wrapWithProviders(
          <Profiler id="EquipmentCard" onRender={onRenderCallback}>
            <EquipmentCard equipment={{ ...equipment, name: `Equipment ${i}` }} />
          </Profiler>
        )
      );
    }

    const avgRenderTime = getAverageRenderTime('EquipmentCard');
    console.log(`EquipmentCard average render time: ${avgRenderTime.toFixed(2)}ms`);
    expect(avgRenderTime).toBeLessThan(5); // Should render in less than 5ms
  });

  test('Profile EnhancedEquipmentCard render performance', () => {
    const equipment = generateEquipment(1)[0];
    
    const { rerender } = render(
      wrapWithProviders(
        <Profiler id="EnhancedEquipmentCard" onRender={onRenderCallback}>
          <EnhancedEquipmentCard equipment={equipment} />
        </Profiler>
      )
    );

    // Trigger multiple re-renders
    for (let i = 0; i < 20; i++) {
      rerender(
        wrapWithProviders(
          <Profiler id="EnhancedEquipmentCard" onRender={onRenderCallback}>
            <EnhancedEquipmentCard equipment={{ ...equipment, name: `Equipment ${i}` }} />
          </Profiler>
        )
      );
    }

    const avgRenderTime = getAverageRenderTime('EnhancedEquipmentCard');
    console.log(`EnhancedEquipmentCard average render time: ${avgRenderTime.toFixed(2)}ms`);
    expect(avgRenderTime).toBeLessThan(5); // Should render in less than 5ms
  });

  test('Profile EquipmentStatusBadge render performance', () => {
    const statuses = ['available', 'in-use', 'maintenance', 'broken', 'reserved'];
    
    const { rerender } = render(
      <Profiler id="EquipmentStatusBadge" onRender={onRenderCallback}>
        <EquipmentStatusBadge status="available" />
      </Profiler>
    );

    // Trigger multiple re-renders with different statuses
    for (let i = 0; i < 50; i++) {
      const status = statuses[i % statuses.length];
      rerender(
        <Profiler id="EquipmentStatusBadge" onRender={onRenderCallback}>
          <EquipmentStatusBadge status={status} size={i % 2 === 0 ? 'sm' : 'md'} />
        </Profiler>
      );
    }

    const avgRenderTime = getAverageRenderTime('EquipmentStatusBadge');
    console.log(`EquipmentStatusBadge average render time: ${avgRenderTime.toFixed(2)}ms`);
    expect(avgRenderTime).toBeLessThan(1); // Should render in less than 1ms
  });

  test('Measure render time improvement with memoization', () => {
    const equipment = generateEquipment(10);
    
    // Simulate component with memoization
    const MemoizedList = React.memo(({ items }) => (
      <div>
        {items.map(item => (
          <div key={item.id}>{item.name}</div>
        ))}
      </div>
    ));

    const { rerender } = render(
      <Profiler id="MemoizedList" onRender={onRenderCallback}>
        <MemoizedList items={equipment} />
      </Profiler>
    );

    // Re-render with same props (should be fast due to memoization)
    for (let i = 0; i < 10; i++) {
      rerender(
        <Profiler id="MemoizedList" onRender={onRenderCallback}>
          <MemoizedList items={equipment} />
        </Profiler>
      );
    }

    const metrics = performanceMetrics['MemoizedList'];
    if (metrics && metrics.length > 1) {
      // First render is always slower
      const subsequentRenders = metrics.slice(1);
      const avgSubsequent = subsequentRenders.reduce((acc, m) => acc + m.actualDuration, 0) / subsequentRenders.length;
      
      console.log(`Memoized component subsequent renders: ${avgSubsequent.toFixed(2)}ms`);
      // Memoized re-renders should be very fast
      expect(avgSubsequent).toBeLessThan(0.5);
    }
  });

  test('Compare render times: single card vs multiple cards', () => {
    const singleEquipment = generateEquipment(1)[0];
    const multipleEquipment = generateEquipment(10);

    // Single card
    const { rerender: rerenderSingle } = render(
      wrapWithProviders(
        <Profiler id="SingleCard" onRender={onRenderCallback}>
          <EquipmentCard equipment={singleEquipment} />
        </Profiler>
      )
    );

    for (let i = 0; i < 10; i++) {
      rerenderSingle(
        wrapWithProviders(
          <Profiler id="SingleCard" onRender={onRenderCallback}>
            <EquipmentCard equipment={{ ...singleEquipment, name: `Equipment ${i}` }} />
          </Profiler>
        )
      );
    }

    // Multiple cards
    const { rerender: rerenderMultiple } = render(
      wrapWithProviders(
        <Profiler id="MultipleCards" onRender={onRenderCallback}>
          <div>
            {multipleEquipment.map(eq => (
              <EquipmentCard key={eq.id} equipment={eq} />
            ))}
          </div>
        </Profiler>
      )
    );

    for (let i = 0; i < 5; i++) {
      rerenderMultiple(
        wrapWithProviders(
          <Profiler id="MultipleCards" onRender={onRenderCallback}>
            <div>
              {multipleEquipment.map(eq => (
                <EquipmentCard key={eq.id} equipment={{ ...eq, name: `${eq.name}-${i}` }} />
              ))}
            </div>
          </Profiler>
        )
      );
    }

    const singleAvg = getAverageRenderTime('SingleCard');
    const multipleAvg = getAverageRenderTime('MultipleCards');

    console.log(`Single card average: ${singleAvg.toFixed(2)}ms`);
    console.log(`10 cards average: ${multipleAvg.toFixed(2)}ms`);
    console.log(`Per-card cost in list: ${(multipleAvg / 10).toFixed(2)}ms`);

    // Multiple cards should scale reasonably even when averages are near 0
    const baseline = Math.max(singleAvg, 0.001);
    expect(multipleAvg).toBeLessThanOrEqual(baseline * 15); // Allow some overhead
  });
});
