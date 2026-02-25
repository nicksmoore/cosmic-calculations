import { chromium } from 'playwright';
import fs from 'fs';

interface PageMetrics {
  url: string;
  loadTime: number;
  interactiveTime: number;
  firstContentfulPaint: number;
  resourceLoadTime: number;
  domContentLoaded: number;
}

const PAGES_TO_TEST = [
  'http://localhost:8080/feed',
  'http://localhost:8080/profile',
  'http://localhost:8080/friends',
  'http://localhost:8080/bazaar',
  'http://localhost:8080/transit',
];

async function runDiagnostic() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const results: PageMetrics[] = [];

  for (const url of PAGES_TO_TEST) {
    console.log(`\n📊 Testing: ${url}`);
    console.log('─'.repeat(60));

    try {
      const startTime = Date.now();
      
      // Navigate and wait for network idle
      await page.goto(url, { waitUntil: 'networkidle' });
      
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const fcpEntry = performance.getEntriesByType('paint').find(e => e.name === 'first-contentful-paint') as PerformanceEntryList;
        const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
        
        return {
          domInteractive: navigation?.domInteractive || 0,
          domComplete: navigation?.domComplete || 0,
          loadEventEnd: navigation?.loadEventEnd || 0,
          connectStart: navigation?.connectStart || 0,
          connectEnd: navigation?.connectEnd || 0,
          responseStart: navigation?.responseStart || 0,
          responseEnd: navigation?.responseEnd || 0,
          navigationStart: navigation?.navigationStart || 0,
        };
      });

      const totalTime = Date.now() - startTime;
      
      // Get network requests
      const networkRequests = await page.evaluate(() => {
        const entries = performance.getEntriesByType('resource');
        return {
          totalRequests: entries.length,
          totalBytes: entries.reduce((sum, e) => {
            const res = e as PerformanceResourceTiming;
            return sum + (res.transferSize || 0);
          }, 0),
          slowestRequest: Math.max(...entries.map(e => (e as PerformanceResourceTiming).duration)),
          entries: entries.slice(0, 5).map(e => ({
            name: e.name.split('/').pop(),
            duration: Math.round((e as PerformanceResourceTiming).duration),
          })),
        };
      });

      console.log(`✓ Total time to interactive: ${totalTime}ms`);
      console.log(`  DOM Interactive: ${Math.round(metrics.domInteractive)}ms`);
      console.log(`  DOM Complete: ${Math.round(metrics.domComplete)}ms`);
      console.log(`  Load Event End: ${Math.round(metrics.loadEventEnd)}ms`);
      console.log(`\n📦 Network:`);
      console.log(`  Total Requests: ${networkRequests.totalRequests}`);
      console.log(`  Total Bytes: ${(networkRequests.totalBytes / 1024).toFixed(1)} KB`);
      console.log(`  Slowest Request: ${Math.round(networkRequests.slowestRequest)}ms`);
      console.log(`\n  Top 5 Requests:`);
      networkRequests.entries.forEach(e => {
        console.log(`    • ${e.name}: ${e.duration}ms`);
      });

      results.push({
        url,
        loadTime: totalTime,
        interactiveTime: metrics.domInteractive,
        firstContentfulPaint: metrics.responseStart,
        resourceLoadTime: networkRequests.slowestRequest,
        domContentLoaded: metrics.domComplete,
      });

    } catch (error) {
      console.error(`✗ Error testing ${url}:`, error instanceof Error ? error.message : String(error));
    }
  }

  await browser.close();

  // Summary
  console.log('\n\n📈 SUMMARY');
  console.log('═'.repeat(60));
  
  // Sort by load time descending
  const sorted = [...results].sort((a, b) => b.loadTime - a.loadTime);
  sorted.forEach(r => {
    const pageNameMatch = r.url.match(/\/([^/]+)$/);
    const pageName = pageNameMatch ? pageNameMatch[1] : r.url;
    const isSlowThreshold = r.loadTime > 3000;
    const marker = isSlowThreshold ? '🔴 SLOW' : '🟢 OK';
    console.log(`${marker} ${pageName.padEnd(15)} ${r.loadTime.toString().padEnd(5)}ms (DOM: ${r.domContentLoaded.toString().padEnd(5)}ms)`);
  });

  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    results: sorted,
    summary: {
      slowPages: sorted.filter(r => r.loadTime > 3000).map(r => r.url),
      averageLoadTime: sorted.reduce((sum, r) => sum + r.loadTime, 0) / sorted.length,
    },
  };

  fs.writeFileSync('/tmp/perf-report.json', JSON.stringify(report, null, 2));
  console.log('\n✓ Report saved to /tmp/perf-report.json');
}

runDiagnostic().catch(console.error);
