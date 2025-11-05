/**
 * Bundle Analyzer Utilities
 * ยูทิลิตี้สำหรับวิเคราะห์ขนาด bundle และปรับปรุงประสิทธิภาพ
 */

/**
 * Analyze current bundle size and performance
 */
export const analyzeBundlePerformance = () => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('Bundle analysis is only available in development mode');
    return;
  }

  console.group('📦 Bundle Performance Analysis');

  // Analyze loaded resources
  const resources = performance.getEntriesByType('resource');
  const jsResources = resources.filter(r => r.name.includes('.js'));
  const cssResources = resources.filter(r => r.name.includes('.css'));
  const imageResources = resources.filter(r => r.initiatorType === 'img');

  // Calculate sizes
  const totalJSSize = jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
  const totalCSSSize = cssResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
  const totalImageSize = imageResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);

  console.log('📊 Resource Summary:');
  console.table({
    'JavaScript': {
      files: jsResources.length,
      size: formatBytes(totalJSSize),
      percentage: `${((totalJSSize / (totalJSSize + totalCSSSize + totalImageSize)) * 100).toFixed(1)}%`
    },
    'CSS': {
      files: cssResources.length,
      size: formatBytes(totalCSSSize),
      percentage: `${((totalCSSSize / (totalJSSize + totalCSSSize + totalImageSize)) * 100).toFixed(1)}%`
    },
    'Images': {
      files: imageResources.length,
      size: formatBytes(totalImageSize),
      percentage: `${((totalImageSize / (totalJSSize + totalCSSSize + totalImageSize)) * 100).toFixed(1)}%`
    }
  });

  // Analyze largest JavaScript files
  const largestJSFiles = jsResources
    .sort((a, b) => (b.transferSize || 0) - (a.transferSize || 0))
    .slice(0, 10)
    .map(r => ({
      name: r.name.split('/').pop(),
      size: formatBytes(r.transferSize || 0),
      loadTime: `${r.duration.toFixed(2)}ms`
    }));

  console.log('🔍 Largest JavaScript Files:');
  console.table(largestJSFiles);

  // Performance metrics
  const navigation = performance.getEntriesByType('navigation')[0];
  if (navigation) {
    console.log('⚡ Performance Metrics:');
    console.table({
      'DOM Content Loaded': `${navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart}ms`,
      'Load Complete': `${navigation.loadEventEnd - navigation.loadEventStart}ms`,
      'Total Load Time': `${navigation.loadEventEnd - navigation.fetchStart}ms`,
      'DNS Lookup': `${navigation.domainLookupEnd - navigation.domainLookupStart}ms`,
      'TCP Connection': `${navigation.connectEnd - navigation.connectStart}ms`,
      'Server Response': `${navigation.responseEnd - navigation.requestStart}ms`
    });
  }

  // Memory usage (if available)
  if ('memory' in performance) {
    console.log('💾 Memory Usage:');
    console.table({
      'Used JS Heap': formatBytes(performance.memory.usedJSHeapSize),
      'Total JS Heap': formatBytes(performance.memory.totalJSHeapSize),
      'JS Heap Limit': formatBytes(performance.memory.jsHeapSizeLimit),
      'Usage Percentage': `${((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100).toFixed(1)}%`
    });
  }

  console.groupEnd();
};

/**
 * Analyze code splitting effectiveness
 */
export const analyzeCodeSplitting = () => {
  if (process.env.NODE_ENV !== 'development') return;

  console.group('✂️ Code Splitting Analysis');

  const chunks = [];
  
  // Try to get webpack chunk information
  if (window.__webpack_require__ && window.__webpack_require__.cache) {
    const cache = window.__webpack_require__.cache;
    const moduleIds = Object.keys(cache);
    
    moduleIds.forEach(moduleId => {
      const module = cache[moduleId];
      if (module && module.exports) {
        const size = JSON.stringify(module.exports).length;
        chunks.push({
          id: moduleId,
          size: formatBytes(size),
          loaded: !!module.loaded
        });
      }
    });

    const sortedChunks = chunks
      .sort((a, b) => parseInt(b.size) - parseInt(a.size))
      .slice(0, 15);

    console.log('📦 Loaded Chunks (Top 15):');
    console.table(sortedChunks);
  }

  // Analyze dynamic imports
  const dynamicImports = performance.getEntriesByType('resource')
    .filter(r => r.name.includes('chunk') || r.name.includes('lazy'))
    .map(r => ({
      name: r.name.split('/').pop(),
      size: formatBytes(r.transferSize || 0),
      loadTime: `${r.duration.toFixed(2)}ms`
    }));

  if (dynamicImports.length > 0) {
    console.log('🔄 Dynamic Imports:');
    console.table(dynamicImports);
  }

  console.groupEnd();
};

/**
 * Analyze unused code
 */
export const analyzeUnusedCode = () => {
  if (process.env.NODE_ENV !== 'development') return;

  console.group('🗑️ Unused Code Analysis');

  // This is a simplified analysis - in production, you'd use tools like webpack-bundle-analyzer
  const scripts = Array.from(document.scripts);
  const stylesheets = Array.from(document.styleSheets);

  console.log(`📄 Total Scripts: ${scripts.length}`);
  console.log(`🎨 Total Stylesheets: ${stylesheets.length}`);

  // Analyze CSS usage (simplified)
  let totalCSSRules = 0;
  let usedCSSRules = 0;

  try {
    stylesheets.forEach(sheet => {
      if (sheet.cssRules) {
        totalCSSRules += sheet.cssRules.length;
        
        Array.from(sheet.cssRules).forEach(rule => {
          if (rule.selectorText) {
            try {
              if (document.querySelector(rule.selectorText)) {
                usedCSSRules++;
              }
            } catch (e) {
              // Invalid selector
            }
          }
        });
      }
    });

    const cssUsagePercentage = totalCSSRules > 0 ? (usedCSSRules / totalCSSRules * 100).toFixed(1) : 0;
    
    console.log('🎨 CSS Usage Analysis:');
    console.table({
      'Total Rules': totalCSSRules,
      'Used Rules': usedCSSRules,
      'Usage Percentage': `${cssUsagePercentage}%`,
      'Unused Rules': totalCSSRules - usedCSSRules
    });
  } catch (error) {
    console.warn('Could not analyze CSS usage:', error.message);
  }

  console.groupEnd();
};

/**
 * Generate optimization recommendations
 */
export const generateOptimizationRecommendations = () => {
  if (process.env.NODE_ENV !== 'development') return;

  console.group('💡 Optimization Recommendations');

  const recommendations = [];
  const resources = performance.getEntriesByType('resource');
  const jsResources = resources.filter(r => r.name.includes('.js'));
  const totalJSSize = jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);

  // Check bundle size
  if (totalJSSize > 1024 * 1024) { // > 1MB
    recommendations.push({
      type: 'Bundle Size',
      issue: 'Large JavaScript bundle detected',
      recommendation: 'Consider code splitting and lazy loading',
      priority: 'High'
    });
  }

  // Check number of requests
  if (jsResources.length > 10) {
    recommendations.push({
      type: 'HTTP Requests',
      issue: 'Too many JavaScript files',
      recommendation: 'Bundle smaller files together',
      priority: 'Medium'
    });
  }

  // Check load times
  const slowResources = resources.filter(r => r.duration > 1000);
  if (slowResources.length > 0) {
    recommendations.push({
      type: 'Load Performance',
      issue: `${slowResources.length} resources loading slowly`,
      recommendation: 'Optimize or lazy load slow resources',
      priority: 'High'
    });
  }

  // Check memory usage
  if ('memory' in performance) {
    const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
    if (memoryUsage > 0.8) {
      recommendations.push({
        type: 'Memory Usage',
        issue: 'High memory usage detected',
        recommendation: 'Review memory leaks and optimize data structures',
        priority: 'High'
      });
    }
  }

  if (recommendations.length === 0) {
    console.log('✅ No major optimization issues detected!');
  } else {
    console.table(recommendations);
  }

  console.groupEnd();
};

/**
 * Format bytes to human readable format
 */
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Run complete bundle analysis
 */
export const runCompleteAnalysis = () => {
  console.clear();
  console.log('🚀 Starting Complete Bundle Analysis...\n');
  
  analyzeBundlePerformance();
  analyzeCodeSplitting();
  analyzeUnusedCode();
  generateOptimizationRecommendations();
  
  console.log('\n✨ Analysis Complete!');
  console.log('💡 Tip: Run this analysis after major changes to track improvements');
};

// Auto-run analysis in development mode
if (process.env.NODE_ENV === 'development') {
  // Run analysis after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (window.location.search.includes('analyze=true')) {
        runCompleteAnalysis();
      }
    }, 2000);
  });

  // Add global function for manual analysis
  window.analyzeBundlePerformance = runCompleteAnalysis;
}

export default {
  analyzeBundlePerformance,
  analyzeCodeSplitting,
  analyzeUnusedCode,
  generateOptimizationRecommendations,
  runCompleteAnalysis
};