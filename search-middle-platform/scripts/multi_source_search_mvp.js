const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

function dedupeResults(items) {
  const seen = new Set();
  const output = [];
  for (const item of items) {
    const key = `${item.url || ''}`.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }
  return output;
}

function scoreResult(item, query) {
  const text = `${item.title || ''} ${item.snippet || ''} ${item.url || ''}`.toLowerCase();
  const parts = String(query).toLowerCase().split(/\s+/).filter(Boolean);
  let score = 0;
  for (const part of parts) {
    if (text.includes(part)) score += 3;
  }
  if ((item.source || '').includes('official')) score += 5;
  if ((item.url || '').includes('github.com')) score += 4;
  if ((item.url || '').startsWith('https://')) score += 1;
  return score;
}

async function searchBrave(query) {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) {
    return { source: 'brave', skipped: true, results: [] };
  }
  const data = await fetchJson(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10`, {
    headers: {
      'Accept': 'application/json',
      'X-Subscription-Token': apiKey
    }
  });
  const results = (data.web?.results || []).map(item => ({
    source: 'brave',
    title: item.title,
    url: item.url,
    snippet: item.description || ''
  }));
  return { source: 'brave', skipped: false, results };
}

async function searchBing(page, query) {
  const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);
  const results = await page.evaluate(() => {
    const items = [];
    const nodes = document.querySelectorAll('li.b_algo');
    for (const node of nodes) {
      const a = node.querySelector('h2 a');
      const snippet = node.querySelector('.b_caption p');
      if (!a || !a.href) continue;
      items.push({
        source: 'bing',
        title: (a.textContent || '').trim(),
        url: a.href,
        snippet: (snippet?.textContent || '').trim()
      });
    }
    return items;
  });
  return { source: 'bing', skipped: false, results };
}

async function searchDuckDuckGo(page, query) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);
  const results = await page.evaluate(() => {
    const items = [];
    const nodes = document.querySelectorAll('.result');
    for (const node of nodes) {
      const a = node.querySelector('.result__title a');
      const snippet = node.querySelector('.result__snippet');
      if (!a || !a.href) continue;
      items.push({
        source: 'duckduckgo',
        title: (a.textContent || '').trim(),
        url: a.href,
        snippet: (snippet?.textContent || '').trim()
      });
    }
    return items;
  });
  return { source: 'duckduckgo', skipped: false, results };
}

async function main() {
  const query = process.argv[2] || 'OpenClaw browser timeout';
  const outputFile = process.argv[3] || path.join(process.cwd(), 'output/multi_source_search_results.json');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 960 }
  });
  const page = await context.newPage();

  const engines = [];

  try {
    engines.push(await searchBing(page, query));
  } catch (error) {
    engines.push({ source: 'bing', skipped: false, error: error.message, results: [] });
  }

  try {
    engines.push(await searchDuckDuckGo(page, query));
  } catch (error) {
    engines.push({ source: 'duckduckgo', skipped: false, error: error.message, results: [] });
  }

  try {
    engines.push(await searchBrave(query));
  } catch (error) {
    engines.push({ source: 'brave', skipped: false, error: error.message, results: [] });
  }

  const merged = dedupeResults(
    engines.flatMap(engine => engine.results || []).map(item => ({
      ...item,
      score: scoreResult(item, query)
    }))
  ).sort((a, b) => b.score - a.score);

  const output = {
    query,
    engines: engines.map(engine => ({
      source: engine.source,
      skipped: !!engine.skipped,
      error: engine.error || null,
      count: (engine.results || []).length
    })),
    merged
  };

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2), 'utf8');
  console.log(`已写入: ${outputFile}`);
  console.log(`合并结果: ${merged.length}`);

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
