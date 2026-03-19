const fs = require('fs');
const path = require('path');

function main() {
  const input = process.argv[2] || path.join(process.cwd(), 'output/answer_runs/final_answer.json');
  const output = process.argv[3] || path.join(process.cwd(), 'output/answer_runs/final_answer.md');
  const data = JSON.parse(fs.readFileSync(input, 'utf8'));

  const lines = [];
  lines.push(`查询类型：${data.route}`);
  lines.push(`结果总数：${data.total}`);
  lines.push('');
  lines.push('最值得看的结果：');

  for (const [index, item] of (data.summary || []).entries()) {
    lines.push(`${index + 1}. ${item.title}`);
    lines.push(`   来源：${item.source}${item.kind ? ` / ${item.kind}` : ''}`);
    lines.push(`   可信度：${item.confidence}`);
    lines.push(`   链接：${item.url}`);
    if (item.snippet) lines.push(`   摘要：${item.snippet}`);
    if (item.readable) lines.push(`   正文片段：${item.readable}`);
    lines.push('');
  }

  fs.writeFileSync(output, lines.join('\n'), 'utf8');
  console.log(`自然语言答案已写入: ${output}`);
}

main();
