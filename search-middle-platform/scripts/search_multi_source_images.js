const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
];

function normalizeUrl(url) {
  if (!url) return null;
  let value = url.trim();
  if (!value.startsWith('http')) return null;
  return value;
}

function shouldKeepImage(url, keyword) {
  if (!url) return false;
  const blocked = [
    'emoji.cdn.bcebos.com',
    'data:image',
    'gstatic.com',
    'google.com/images',
    'baidu.com/img',
    'baidu.com/search',
    'doubleclick.net',
    'favicon',
    'sprite',
    'logo'
  ];
  const lower = url.toLowerCase();
  if (blocked.some(item => lower.includes(item))) return false;
  if (lower.endsWith('.svg')) return false;
  const keywordParts = String(keyword || '').toLowerCase().split(/\s+/).filter(Boolean);
  return keywordParts.length === 0 || keywordParts.some(part => lower.includes(part)) || true;
}

async function collectFromBing(page, keyword) {
  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(keyword)}&form=HDRSC3`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2500);
  return await page.evaluate(() => {
    const results = [];
    const nodes = document.querySelectorAll('img');
    for (const img of nodes) {
      const candidates = [img.src, img.getAttribute('data-src'), img.getAttribute('data-fallback-src')];
      for (const item of candidates) {
        if (item && item.startsWith('http')) {
          results.push(item);
        }
      }
    }
    return results;
  });
}

async function collectFromBaidu(page, keyword) {
  const url = `https://image.baidu.com/search/index?tn=baiduimage&word=${encodeURIComponent(keyword)}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2500);
  return await page.evaluate(() => {
    const results = [];
    const nodes = document.querySelectorAll('img');
    for (const img of nodes) {
      const candidates = [img.src, img.getAttribute('data-imgurl'), img.getAttribute('data-src')];
      for (const item of candidates) {
        if (item && item.startsWith('http')) {
          results.push(item);
        }
      }
    }
    return results;
  });
}

async function collectFromDuckDuckGo(page, keyword) {
  const url = `https://duckduckgo.com/?q=${encodeURIComponent(keyword)}&iax=images&ia=images`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3500);
  return await page.evaluate(() => {
    const results = [];
    const nodes = document.querySelectorAll('img');
    for (const img of nodes) {
      const candidates = [img.src, img.getAttribute('data-src')];
      for (const item of candidates) {
        if (item && item.startsWith('http')) {
          results.push(item);
        }
      }
    }
    return results;
  });
}

async function main() {
  const keyword = process.argv[2] || '美女 写真';
  const outputFile = process.argv[3] || path.join(process.cwd(), 'multi_source_image_results.json');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
    viewport: { width: 1440, height: 960 }
  });
  const page = await context.newPage();

  const collectors = [
    { name: 'bing', run: collectFromBing },
    { name: 'baidu', run: collectFromBaidu },
    { name: 'duckduckgo', run: collectFromDuckDuckGo }
  ];

  const results = [];

  for (const collector of collectors) {
    try {
      console.log(`开始抓取 ${collector.name}: ${keyword}`);
      const urls = await collector.run(page, keyword);
      const filtered = [];
      const seen = new Set();
      for (const item of urls) {
        const normalized = normalizeUrl(item);
        if (!normalized) continue;
        if (!shouldKeepImage(normalized, keyword)) continue;
        if (seen.has(normalized)) continue;
        seen.add(normalized);
        filtered.push(normalized);
        if (filtered.length >= 20) break;
      }
      results.push({ source: collector.name, count: filtered.length, urls: filtered });
      console.log(`${collector.name} 保留 ${filtered.length} 张`);
    } catch (error) {
      results.push({ source: collector.name, error: error.message, count: 0, urls: [] });
      console.log(`${collector.name} 抓取失败: ${error.message}`);
    }
  }

  const merged = [];
  const mergedSet = new Set();
  for (const group of results) {
    for (const url of group.urls || []) {
      if (mergedSet.has(url)) continue;
      mergedSet.add(url);
      merged.push({ source: group.source, url });
    }
  }

  const output = {
    keyword,
    total: merged.length,
    results,
    merged
  };

  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2), 'utf8');
  console.log(`已写入: ${outputFile}`);
  console.log(`总共保留: ${merged.length}`);

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
