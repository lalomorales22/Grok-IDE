// Grok IDE - Performance Monitor
// Tracks performance metrics and provides insights

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoad: 0,
      timeToInteractive: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0,
      firstInputDelay: 0,
      memoryUsage: {},
      resourceTimings: []
    };

    this.init();
  }

  init() {
    if (typeof window === 'undefined') return;

    // Monitor page load performance
    window.addEventListener('load', () => {
      this.measurePageLoad();
    });

    // Monitor Web Vitals
    this.monitorWebVitals();

    // Monitor memory usage (if available)
    if (performance.memory) {
      setInterval(() => this.measureMemory(), 30000); // Every 30s
    }

    // Monitor resources
    this.monitorResources();
  }

  measurePageLoad() {
    const perfData = performance.getEntriesByType('navigation')[0];

    if (perfData) {
      this.metrics.pageLoad = perfData.loadEventEnd - perfData.fetchStart;
      this.metrics.timeToInteractive = perfData.domInteractive - perfData.fetchStart;

      console.log('[Performance] Page Load:', this.formatTime(this.metrics.pageLoad));
      console.log('[Performance] Time to Interactive:', this.formatTime(this.metrics.timeToInteractive));

      // Log warning if performance is poor
      if (this.metrics.pageLoad > 3000) {
        console.warn('[Performance] Page load time exceeds 3 seconds');
      }
    }
  }

  monitorWebVitals() {
    // First Contentful Paint (FCP)
    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');

    if (fcpEntry) {
      this.metrics.firstContentfulPaint = fcpEntry.startTime;
      console.log('[Performance] First Contentful Paint:', this.formatTime(fcpEntry.startTime));
    }

    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.largestContentfulPaint = lastEntry.renderTime || lastEntry.loadTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              this.metrics.cumulativeLayoutShift = clsValue;
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

      } catch (error) {
        console.warn('[Performance] PerformanceObserver not fully supported:', error);
      }
    }
  }

  measureMemory() {
    if (performance.memory) {
      this.metrics.memoryUsage = {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        usedPercentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit * 100).toFixed(2)
      };

      // Warn if memory usage is high
      if (this.metrics.memoryUsage.usedPercentage > 80) {
        console.warn('[Performance] High memory usage:', this.metrics.memoryUsage.usedPercentage + '%');
      }
    }
  }

  monitorResources() {
    const resources = performance.getEntriesByType('resource');
    this.metrics.resourceTimings = resources.map(resource => ({
      name: resource.name,
      duration: resource.duration,
      size: resource.transferSize || 0,
      type: resource.initiatorType
    }));

    // Log slow resources
    const slowResources = this.metrics.resourceTimings.filter(r => r.duration > 1000);
    if (slowResources.length > 0) {
      console.warn('[Performance] Slow resources detected:', slowResources);
    }
  }

  // Get current metrics
  getMetrics() {
    return this.metrics;
  }

  // Get performance score (0-100)
  getPerformanceScore() {
    let score = 100;

    // Deduct for slow page load
    if (this.metrics.pageLoad > 3000) score -= 20;
    else if (this.metrics.pageLoad > 2000) score -= 10;

    // Deduct for high FCP
    if (this.metrics.firstContentfulPaint > 2000) score -= 15;
    else if (this.metrics.firstContentfulPaint > 1000) score -= 5;

    // Deduct for high LCP
    if (this.metrics.largestContentfulPaint > 4000) score -= 20;
    else if (this.metrics.largestContentfulPaint > 2500) score -= 10;

    // Deduct for high CLS
    if (this.metrics.cumulativeLayoutShift > 0.25) score -= 15;
    else if (this.metrics.cumulativeLayoutShift > 0.1) score -= 5;

    // Deduct for high memory usage
    if (this.metrics.memoryUsage.usedPercentage > 80) score -= 10;
    else if (this.metrics.memoryUsage.usedPercentage > 60) score -= 5;

    return Math.max(0, score);
  }

  // Get performance report
  getReport() {
    return {
      score: this.getPerformanceScore(),
      metrics: this.metrics,
      recommendations: this.getRecommendations()
    };
  }

  // Get performance recommendations
  getRecommendations() {
    const recommendations = [];

    if (this.metrics.pageLoad > 3000) {
      recommendations.push('Page load time is high. Consider code splitting and lazy loading.');
    }

    if (this.metrics.firstContentfulPaint > 2000) {
      recommendations.push('First Contentful Paint is slow. Optimize critical rendering path.');
    }

    if (this.metrics.largestContentfulPaint > 4000) {
      recommendations.push('Largest Contentful Paint is slow. Optimize images and defer non-critical resources.');
    }

    if (this.metrics.cumulativeLayoutShift > 0.25) {
      recommendations.push('High Cumulative Layout Shift. Add explicit sizes to images and dynamic content.');
    }

    if (this.metrics.memoryUsage.usedPercentage > 80) {
      recommendations.push('High memory usage detected. Consider closing unused tabs or clearing cache.');
    }

    const slowResources = this.metrics.resourceTimings.filter(r => r.duration > 1000);
    if (slowResources.length > 0) {
      recommendations.push(`${slowResources.length} slow resources detected. Consider using CDN or compression.`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance is optimal! 🚀');
    }

    return recommendations;
  }

  // Format time in ms
  formatTime(ms) {
    if (ms < 1000) {
      return `${Math.round(ms)}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  }

  // Format bytes
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Log performance report to console
  logReport() {
    const report = this.getReport();

    console.log('═══════════════════════════════════════════');
    console.log('         GROK IDE PERFORMANCE REPORT       ');
    console.log('═══════════════════════════════════════════');
    console.log(`Score: ${report.score}/100`);
    console.log('───────────────────────────────────────────');
    console.log('Metrics:');
    console.log(`  Page Load: ${this.formatTime(report.metrics.pageLoad)}`);
    console.log(`  Time to Interactive: ${this.formatTime(report.metrics.timeToInteractive)}`);
    console.log(`  First Contentful Paint: ${this.formatTime(report.metrics.firstContentfulPaint)}`);
    console.log(`  Largest Contentful Paint: ${this.formatTime(report.metrics.largestContentfulPaint)}`);
    console.log(`  Cumulative Layout Shift: ${report.metrics.cumulativeLayoutShift.toFixed(3)}`);

    if (report.metrics.memoryUsage.usedPercentage) {
      console.log(`  Memory Usage: ${report.metrics.memoryUsage.usedPercentage}%`);
      console.log(`  JS Heap: ${this.formatBytes(report.metrics.memoryUsage.usedJSHeapSize)}`);
    }

    console.log('───────────────────────────────────────────');
    console.log('Recommendations:');
    report.recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });
    console.log('═══════════════════════════════════════════');
  }
}

// Initialize performance monitor
window.performanceMonitor = new PerformanceMonitor();

// Log report after page load
window.addEventListener('load', () => {
  setTimeout(() => {
    window.performanceMonitor.logReport();
  }, 2000); // Wait 2s for metrics to stabilize
});

// Expose globally
export default PerformanceMonitor;
