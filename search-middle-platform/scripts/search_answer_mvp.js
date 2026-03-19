const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

function runNode(script, args, cwd) {
  return new Promise((resolve) => {
    const child = spawn('node', [script, ...args], { cwd, stdio: 'pipe' });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', d => stdout += d.toString());
    child.stderr.on('data', d => stderr += d.toString());
    child.on('close', code => resolve({ code, stdout, stderr }));
  });
}

function classify(query) {
  const text = String(query).toLowerCase();
  if (/(bug|error|issue|api|sdk|repo|github|openclaw|代码|报错|文档|接口|技术)/.test(text)) return 'tech';
  if (/(图片|照片|头像|壁纸|美女|图|写真|封面)/.test(text)) return 'image';
  return 'general';
}

function loadJson(filePath) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch { return null; }
}

function confidence(item) {
  let score = item.score || 0;
  const url = (item.url || '').toLowerCase();
  if (url.startsWith('https://')) score += 2;
  if (url.includes('github.com')) score += 4;
  if (url.includes('stackoverflow.com')) score += 4;
  if (url.includes('docs.') || url.includes('/docs')) score += 5;
  if (item.readable && item.readable.length > 200) score += 2;
  return score;
}

function summarize(data, route) {
  const merged = data?.merged || [];
  const ranked = merged.map(item => ({ ...item, confidence: confidence(item) })).sort((a, b) => b.confidence - a.confidence);
  const top = ranked.slice(0, 5);
  return {
    route,
    total: ranked.length,
    summary: top.map(item => ({
      title: item.title,
      url: item.url,
      source: item.source,
      kind: item.kind || null,
      confidence: item.confidence,
      snippet: item.snippet || '',
      readable: item.readable ? item.readable.slice(0, 300) : ''
    }))
  };
}

async function main() {
  const query = process.argv[2] || 'OpenClaw browser timeout';
  const outDir = process.argv[3] || path.join(process.cwd(), 'output/answer_runs');
  fs.mkdirSync(outDir, { recursive: true });

  const route = classify(query);
  const searchOut = path.join(outDir, 'search_results.json');

  let script = 'multi_source_search_mvp.js';
  if (route === 'tech') script = 'tech_search_ultimate.js';
  if (route === 'image') script = 'search_multi_source_images.js';

  await runNode(path.join(process.cwd(), script), [query, searchOut], process.cwd());
  const data = loadJson(searchOut);
  const answer = summarize(data, route);
  const answerPath = path.join(outDir, 'final_answer.json');
  fs.writeFileSync(answerPath, JSON.stringify(answer, null, 2), 'utf8');
  console.log(`答案已写入: ${answerPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
