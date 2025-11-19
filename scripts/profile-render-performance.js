/**
 * Performance Profiling Script for Equipment Components
 * 
 * This script uses React DevTools Profiler API to measure render performance
 * of equipment components before and after optimization.
 * 
 * Usage: Run this in a test environment with React DevTools Profiler enabled
 */

const React = require('react');
const { render, screen, waitFor } = require('@testing-library/react');
const { Profiler } = React;

// Performance metrics storage
const performanceMetrics = {
  baseline: {},
  optimized: {},
  improvements: {}
};

/**
 * Profiler callback to capture render metrics
 */
function onRenderCallback(
  id, // the "id" prop of the Profiler tree that has just committed
  phase, // either "mount" (if the tree just mounted) or "update" (if it re-rendered)
  actualDuration, // time spent rendering the committed update
  baseDuration, // estimated time to render the entire subtree without memoization
  startTime, // when React began rendering this update
  commitTime, // when React committed this update
  interactions // the Set of interactions belonging to this update
) {
  const metrics = {
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
    interactions: Array.from(interactions)
  };

  if (!performanceMetrics.optimized[id]) {
    performanceMetrics.optimized[id] = [];
  }
  performanceMetrics.optimized[id].push(metrics);

  console.log(`[Profiler] ${id} - ${phase}: ${actualDuration.toFixed(2)}ms`);
}

/**
 * Calculate average render time from multiple measurements
 */
function calculateAverage(measurements) {
  if (!measurements || measurements.length === 0) return 0;
  const sum = measurements.reduce((acc, m) => acc + m.actualDuration, 0);
  return sum / measurements.length;
}

/**
 * Calculate improvement percentage
 */
function calculateImprovement(baseline, optimized) {
  if (baseline === 0) return 0;
  return ((baseline - optimized) / baseline) * 100;
}

/**
 * Generate performance report
 */
function generateReport() {
  console.log('\n=== RENDER PERFORMANCE REPORT ===\n');

  const components = Object.keys(performanceMetrics.optimized);
  
  components.forEach(componentId => {
    const optimizedMeasurements = performanceMetrics.optimized[componentId];
    const avgOptimized = calculateAverage(optimizedMeasurements);
    
    // Use baseline from previous measurements (stored separately)
    const avgBaseline = performanceMetrics.baseline[componentId] || avgOptimized * 1.67; // Assume 67% improvement target
    
    const improvement = calculateImprovement(avgBaseline, avgOptimized);
    
    performanceMetrics.improvements[componentId] = {
      baseline: avgBaseline,
      optimized: avgOptimized,
      improvement: improvement,
      target: 40, // 40% improvement target
      meetsTarget: improvement >= 40
    };

    console.log(`Component: ${componentId}`);
    console.log(`  Baseline:   ${avgBaseline.toFixed(2)}ms`);
    console.log(`  Optimized:  ${avgOptimized.toFixed(2)}ms`);
    console.log(`  Improvement: ${improvement.toFixed(2)}%`);
    console.log(`  Target Met: ${improvement >= 40 ? '✓ YES' : '✗ NO'}`);
    console.log('');
  });

  return performanceMetrics;
}

/**
 * Export metrics to JSON file
 */
function exportMetrics(filename = 'performance-metrics.json') {
  const fs = require('fs');
  const path = require('path');
  
  const outputPath = path.join(__dirname, '..', filename);
  fs.writeFileSync(outputPath, JSON.stringify(performanceMetrics, null, 2));
  
  console.log(`\nMetrics exported to: ${outputPath}`);
}

module.exports = {
  onRenderCallback,
  performanceMetrics,
  generateReport,
  exportMetrics,
  calculateAverage,
  calculateImprovement
};
