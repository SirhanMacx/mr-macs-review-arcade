// Perf probe — measure DOMContentLoaded, FCP, LCP, total JS bytes
// Runs against the local static server on :18970 under throttled "fast 3G".
import { chromium } from 'playwright-core';

const PAGES = [
  { name: 'hub', url: 'http://localhost:18970/index.html' },
  { name: 'snake-pit', url: 'http://localhost:18970/games/snake-pit/index.html' },
  { name: 'cube-crash', url: 'http://localhost:18970/games/cube-crash/index.html' },
  { name: 'knights-quest', url: 'http://localhost:18970/games/knights-quest/index.html' },
  { name: 'schoolcraft', url: 'http://localhost:18970/games/schoolcraft/index.html' },
  { name: 'practice-exam', url: 'http://localhost:18970/games/regents-global-2/practice-exam.html' },
];

// Fast 3G: 1.5 Mbps down, 750 kbps up, 150ms RTT
const FAST3G = { downloadThroughput: 1.5e6 / 8, uploadThroughput: 750e3 / 8, latency: 150 };
const UNTHROTTLED = { downloadThroughput: -1, uploadThroughput: -1, latency: 0 };

async function probe(page, url, throttled) {
  // Reset resources tracker
  const resources = [];
  page.on('response', async (resp) => {
    try {
      const req = resp.request();
      const buf = await resp.body().catch(() => null);
      const size = buf ? buf.length : 0;
      resources.push({
        url: req.url(),
        type: req.resourceType(),
        size,
        method: req.method(),
        status: resp.status(),
      });
    } catch (e) {}
  });

  const client = await page.context().newCDPSession(page);
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: throttled.latency,
    downloadThroughput: throttled.downloadThroughput,
    uploadThroughput: throttled.uploadThroughput,
  });

  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  const loadTime = Date.now() - t0;

  // Wait briefly for late-firing perf observers
  await page.waitForTimeout(1500);

  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] || {};
    const paint = performance.getEntriesByType('paint');
    const fcp = paint.find((p) => p.name === 'first-contentful-paint');
    // Find LCP via PerformanceObserver buffer
    let lcp = 0;
    try {
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      if (lcpEntries && lcpEntries.length) lcp = lcpEntries[lcpEntries.length - 1].startTime;
    } catch (e) {}
    return {
      dcl: nav.domContentLoadedEventEnd || 0,
      load: nav.loadEventEnd || 0,
      fcp: fcp ? fcp.startTime : 0,
      lcp,
      transferSize: nav.transferSize || 0,
    };
  });

  return { ...metrics, loadTime, resources };
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  const mode = process.argv[2] === 'unthrottled' ? UNTHROTTLED : FAST3G;
  console.log(`Mode: ${process.argv[2] === 'unthrottled' ? 'UNTHROTTLED' : 'FAST 3G'}`);
  console.log('='.repeat(78));

  for (const p of PAGES) {
    const ctx = await browser.newContext({ bypassCSP: true });
    const page = await ctx.newPage();
    let result;
    try {
      result = await probe(page, p.url, mode);
    } catch (e) {
      console.log(`${p.name.padEnd(18)}  ERROR: ${e.message}`);
      await ctx.close();
      continue;
    }

    const totalBytes = result.resources.reduce((n, r) => n + r.size, 0);
    const jsBytes = result.resources.filter((r) => r.type === 'script').reduce((n, r) => n + r.size, 0);
    const cssBytes = result.resources.filter((r) => r.type === 'stylesheet').reduce((n, r) => n + r.size, 0);
    const imgBytes = result.resources.filter((r) => r.type === 'image').reduce((n, r) => n + r.size, 0);

    console.log(
      `${p.name.padEnd(18)}  ` +
      `DCL=${String(Math.round(result.dcl)).padStart(5)}ms  ` +
      `FCP=${String(Math.round(result.fcp)).padStart(5)}ms  ` +
      `LCP=${String(Math.round(result.lcp)).padStart(5)}ms  ` +
      `LOAD=${String(Math.round(result.load)).padStart(5)}ms  ` +
      `JS=${String(Math.round(jsBytes / 1024)).padStart(5)}kb  ` +
      `CSS=${String(Math.round(cssBytes / 1024)).padStart(4)}kb  ` +
      `IMG=${String(Math.round(imgBytes / 1024)).padStart(5)}kb  ` +
      `TOTAL=${String(Math.round(totalBytes / 1024)).padStart(5)}kb  ` +
      `RES=${result.resources.length}`
    );

    // Top heavy resources for the hub only
    if (p.name === 'hub' && process.argv[3] === 'verbose') {
      const top = [...result.resources]
        .sort((a, b) => b.size - a.size)
        .slice(0, 15)
        .map((r) => `   ${String(Math.round(r.size / 1024)).padStart(5)}kb  ${r.type.padEnd(10)} ${r.url.replace('http://localhost:18970/', '')}`);
      console.log('\nTOP 15 HEAVIEST RESOURCES (hub):');
      console.log(top.join('\n'));
    }

    await ctx.close();
  }

  await browser.close();
})();
