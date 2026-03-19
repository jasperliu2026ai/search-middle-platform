const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const DOC_HINTS = ['docs.', '/docs', 'developer', 'api', 'github.com/openclaw', 'openclaw.ai'];

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
    const key = `${item.kind || ''}:${item.url || ''}`;
    if (!item.url || seen.has(key)) continue;
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
  if (item.kind === 'github_repo') value += 5;
  if (item.kind === 'github_issue') value += 4;
  if (item.kind === 'github_code') value += 4;
  if (DOC_HINTS.some(hint => (item.url || '').toLowerCase().includes(hint))) value += 6;
  if ((item.url || '').startsWith('https://')) value += 1;
  return value;
}

async function searchBing(page, query) {
  await page.goto(`https://www.bing.com/search?q=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  return await page.evaluate(() => Array.from(document.querySelectorAll('li.b_algo')).map(node => {
    const a = node.querySelector('h2 a');
    const p = node.querySelector('.b_caption p');
    return a && a.href ? { kind: 'web', source: 'bing', title: (a.textContent || '').trim(), url: a.href, snippet: (p?.textContent || '').trim() } : null;
  }).filter(Boolean));
}

async function searchDuck(page, query) {
  await page.goto(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  return await page.evaluate(() => Array.from(document.querySelectorAll('.result')).map(node => {
    const a = node.querySelector('.result__title a');
    const p = node.querySelector('.result__snippet');
    return a && a.href ? { kind: 'web', source: 'duckduckgo', title: (a.textContent || '').trim(), url: a.href, snippet: (p?.textContent || '').trim() } : null;
  }).filter(Boolean));
}

async function githubRepoSearch(query) {
  const data = await fetchJson(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=5`, {
    headers: { 'Accept': 'application/vnd.github+json', 'User-Agent': 'openclaw-tech-search-pro' }
  });
  return (data.items || []).map(item => ({ kind: 'github_repo', source: 'github', title: item.full_name, url: item.html_url, snippet: item.description || '' }));
}

async function githubIssueSearch(query) {
  const data = await fetchJson(`https://api.github.com/search/issues?q=${encodeURIComponent(query)}&sort=comments&order=desc&per_page=5`, {
    headers: { 'Accept': 'application/vnd.github+json', 'User-Agent': 'openclaw-tech-search-pro' }
  });
  return (data.items || []).map(item => ({ kind: 'github_issue', source: 'github', title: item.title, url: item.html_url, snippet: (item.body || '').slice(0, 200) }));
}

async function githubCodeSearch(query) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return [];
  const data = await fetchJson(`https://api.github.com/search/code?q=${encodeURIComponent(query)}&per_page=5`, {
    headers: {
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'openclaw-tech-search-pro',
      'Authorization': `Bearer ${token}`
    }
  });
  return (data.items || []).map(item => ({ kind: 'github_code', source: 'github', title: item.name, url: item.html_url, snippet: item.path || '' }));
}

async function fetchReadable(url) {
  try {
    const html = await fetchText(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1200);
  } catch {
    return '';
  }
}

async function main() {
  const query = process.argv[2] || 'OpenClaw browser timeout';
  const outputFile = process.argv[3] || path.join(process.cwd(), 'output/tech_search_pro_results.json');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' });
  const page = await context.newPage();

  let results = [];
  try { results.push(...await searchBing(page, query)); } catch {}
  try { results.push(...await searchDuck(page, query)); } catch {}
  try { results.push(...await githubRepoSearch(query)); } catch {}
  try { results.push(...await githubIssueSearch(query)); } catch {}
  try { results.push(...await githubCodeSearch(query)); } catch {}

  const merged = dedupe(results).map(item => ({ ...item, score: score(item, query) })).sort((a, b) => b.score - a.score).slice(0, 15);

  for (const item of merged.slice(0, 6)) {
    item.readable = await fetchReadable(item.url);
  }

  const output = {
    query,
    total: merged.length,
    topKinds: merged.reduce((acc, item) => {
      acc[item.kind] = (acc[item.kind] || 0) + 1;
      return acc;
    }, {}),
    merged
  };

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2), 'utf8');
  console.log(`已写入: ${outputFile}`);
  console.log(`技术 Pro 结果: ${merged.length}`);

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
