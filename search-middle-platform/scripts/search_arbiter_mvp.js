const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

function classify(query) {
  const text = String(query).toLowerCase();
  if (/(bug|error|issue|api|sdk|repo|github|openclaw|代码|报错|文档|接口|技术)/.test(text)) return 'tech';
  if (/(图片|照片|头像|壁纸|美女|图|写真|封面)/.test(text)) return 'image';
  return 'general';
}

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

function parseOutput(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function judge(route, outputs) {
  const candidates = outputs.filter(Boolean);
  if (route === 'tech') {
    candidates.sort((a, b) => (b.total || b.merged?.length || 0) - (a.total || a.merged?.length || 0));
    return candidates[0] || null;
  }
  if (route === 'image') {
    candidates.sort((a, b) => (b.total || 0) - (a.total || 0));
    return candidates[0] || null;
  }
  candidates.sort((a, b) => ((b.engines?.length || b.total || 0) - (a.engines?.length || a.total || 0)));
  return candidates[0] || null;
}

async function main() {
  const query = process.argv[2] || 'OpenClaw browser timeout';
  const outDir = process.argv[3] || path.join(process.cwd(), 'output/arbiter_runs');
  fs.mkdirSync(outDir, { recursive: true });

  const route = classify(query);
  const jobs = [];

  if (route === 'tech') {
    jobs.push({ name: 'tech_pro', script: 'tech_search_pro.js', out: path.join(outDir, 'tech_pro.json') });
    jobs.push({ name: 'tech_ultimate', script: 'tech_search_ultimate.js', out: path.join(outDir, 'tech_ultimate.json') });
  } else if (route === 'image') {
    jobs.push({ name: 'image_multi', script: 'search_multi_source_images.js', out: path.join(outDir, 'image_multi.json') });
  } else {
    jobs.push({ name: 'general_multi', script: 'multi_source_search_mvp.js', out: path.join(outDir, 'general_multi.json') });
    jobs.push({ name: 'tech_mvp', script: 'tech_search_mvp.js', out: path.join(outDir, 'tech_mvp.json') });
  }

  const executions = await Promise.all(jobs.map(job => runNode(path.join(process.cwd(), job.script), [query, job.out], process.cwd()).then(result => ({ ...job, ...result }))));

  const parsed = executions.map(job => ({ name: job.name, out: job.out, code: job.code, data: parseOutput(job.out) }));
  const winner = judge(route, parsed.map(item => item.data));

  const manifest = {
    query,
    route,
    jobs: parsed.map(item => ({ name: item.name, out: item.out, code: item.code })),
    winnerSummary: winner ? {
      total: winner.total || (winner.merged ? winner.merged.length : 0),
      topKinds: winner.topKinds || null
    } : null
  };

  const manifestPath = path.join(outDir, 'arbiter_manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`仲裁完成: ${manifestPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
