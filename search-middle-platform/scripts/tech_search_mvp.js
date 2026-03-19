const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function fetchText(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

function dedupe(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = (item.url || '').trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function score(item, query) {
  const text = `${item.title || ''} ${item.snippet || ''} ${item.url || ''}`.toLowerCase();
  const parts = String(query).toLowerCase().split(/\s+/).filter(Boolean);
  let value = 0;
  for (const part of parts) {
    if (text.includes(part)) value += 3;
  }
  if ((item.url || '').includes('github.com')) value += 5;
  if ((item.url || '').includes('docs.')) value += 4;
  if ((item.url || '').includes('/docs')) value += 4;
  if ((item.source || '').includes('official')) value += 3;
  return value;
}

async function searchBing(page, query) {
  await page.goto(`https://www.bing.com/search?q=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  const results = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('li.b_algo')).map(node => {
      const a = node.querySelector('h2 a');
      const p = node.querySelector('.b_caption p');
      return a && a.href ? {
        source: 'bing',
        title: (a.textContent || '').trim(),
        url: a.href,
        snippet: (p?.textContent || '').trim()
      } : null;
    }).filter(Boolean);
  });
  return results;
}

async function searchDuck(page, query) {
  await page.goto(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  const results = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.result')).map(node => {
      const a = node.querySelector('.result__title a');
      const p = node.querySelector('.result__snippet');
      return a && a.href ? {
        source: 'duckduckgo',
        title: (a.textContent || '').trim(),
        url: a.href,
        snippet: (p?.textContent || '').trim()
      } : null;
    }).filter(Boolean);
  });
  return results;
}

async function searchGitHub(query) {
  const apiUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=5`;
  const data = await fetchJson(apiUrl, {
    headers: { 'Accept': 'application/vnd.github+json', 'User-Agent': 'openclaw-tech-search-mvp' }
  });
  return (data.items || []).map(item => ({
    source: 'github',
    title: item.full_name,
    url: item.html_url,
    snippet: item.description || ''
  }));
}

async function fetchReadable(url) {
  try {
    const html = await fetchText(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text.slice(0, 1000);
  } catch (error) {
    return '';
  }
}

async function main() {
  const query = process.argv[2] || 'OpenClaw browser timeout';
  const outputFile = process.argv[3] || path.join(process.cwd(), 'output/tech_search_results.json');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' });
  const page = await context.newPage();

  const buckets = [];

  try { buckets.push(...await searchBing(page, query)); } catch {}
  try { buckets.push(...await searchDuck(page, query)); } catch {}
  try { buckets.push(...await searchGitHub(query)); } catch {}

  const merged = dedupe(buckets).map(item => ({ ...item, score: score(item, query) })).sort((a, b) => b.score - a.score).slice(0, 10);

  for (const item of merged.slice(0, 5)) {
    item.readable = await fetchReadable(item.url);
  }

  const output = { query, total: merged.length, merged };
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2), 'utf8');
  console.log(`已写入: ${outputFile}`);
  console.log(`技术搜索结果: ${merged.length}`);

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
