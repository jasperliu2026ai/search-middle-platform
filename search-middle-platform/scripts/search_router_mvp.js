const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function classify(query) {
  const text = String(query).toLowerCase();
  if (/(bug|error|issue|api|sdk|repo|github|openclaw|代码|报错|文档|接口|技术)/.test(text)) return 'tech';
  if (/(图片|照片|头像|壁纸|美女|图|写真|封面)/.test(text)) return 'image';
  return 'general';
}

function runNode(script, query, output) {
  const command = `node ${script} ${JSON.stringify(query)} ${output}`;
  execSync(command, { stdio: 'inherit', cwd: process.cwd() });
}

function main() {
  const query = process.argv[2] || 'OpenClaw browser timeout';
  const outDir = process.argv[3] || path.join(process.cwd(), 'output/router_runs');
  fs.mkdirSync(outDir, { recursive: true });

  const type = classify(query);
  const manifest = { query, route: type, output: null };

  if (type === 'tech') {
    const out = path.join(outDir, 'tech_search_ultimate_results.json');
    runNode(path.join(process.cwd(), 'tech_search_ultimate.js'), query, out);
    manifest.output = out;
  } else if (type === 'image') {
    const out = path.join(outDir, 'multi_source_image_results.json');
    runNode(path.join(process.cwd(), 'search_multi_source_images.js'), query, out);
    manifest.output = out;
  } else {
    const out = path.join(outDir, 'multi_source_search_results.json');
    runNode(path.join(process.cwd(), 'multi_source_search_mvp.js'), query, out);
    manifest.output = out;
  }

  const manifestPath = path.join(outDir, 'router_manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`路由完成: ${manifestPath}`);
}

main();
