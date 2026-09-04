import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const repoDir = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\//, '').replace(/^([A-Z]):/, '$1:'));
const inputPath = path.resolve(valueAfter('--input', path.join(repoDir, '..', '..', '文档库', '内容规划', '制作计划', '2026-09-04-35条试运行候选名单.json')));
const outputPath = path.resolve(valueAfter('--output', path.join(repoDir, '..', 'src', 'aima-douyin-pilot-sources.json')));

const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
if (!Array.isArray(input.records) || input.records.length !== 35) {
  throw new Error(`试运行清单必须包含 35 条记录，实际为 ${input.records?.length ?? '未知'}`);
}

const zeroWidth = /[\u200b-\u200d\ufeff]/g;
const ctaLine = /(点赞|关注|评论区|私信|加我|联系作者|课程|训练营|扫码|加微信|加V|公众号|咨询作者)/;
const metadataLine = /^(原文件|发布时间|博主|原链接|查看抖音原视频|source|id|日期|作者)\s*[:：]/i;

function dedupeRepeatedTitle(value) {
  let result = value.replace(zeroWidth, '').replace(/\s+/g, ' ').trim();
  for (let pass = 0; pass < 3; pass += 1) {
    const half = Math.floor(result.length / 2);
    if (result.length >= 8 && result.length % 2 === 0 && result.slice(0, half) === result.slice(half)) {
      result = result.slice(0, half).trim();
      continue;
    }
    const pivot = Math.ceil(result.length / 2);
    const left = result.slice(0, pivot);
    const repeatAt = result.indexOf(left, Math.max(1, Math.floor(pivot * 0.6)));
    if (repeatAt > 0 && repeatAt < result.length && result.slice(repeatAt, repeatAt + left.length) === left) {
      result = result.slice(0, repeatAt).trim();
    }
  }
  return result.replace(/[，,、；;]\s*$/, '').trim();
}

function cleanBody(value) {
  const lines = String(value || '')
    .replace(zeroWidth, '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && line !== '---' && !line.startsWith('<span') && !line.startsWith('> **原文件'))
    .filter((line) => !metadataLine.test(line))
    .filter((line) => !ctaLine.test(line));

  const cleaned = [];
  for (const line of lines) {
    let next = line
      .replace(/^#{1,6}\s*/, '')
      .replace(/^[-*]\s+/, '• ')
      .replace(/\*\*/g, '')
      .replace(/`/g, '')
      .trim();
    if (!next || next === '---' || ctaLine.test(next)) continue;
    if (cleaned.at(-1) === next) continue;
    cleaned.push(next);
  }
  return cleaned.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function firstSentences(value, maxLength = 150) {
  const flat = value.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
  if (flat.length <= maxLength) return flat;
  const cut = flat.slice(0, maxLength);
  const punctuation = Math.max(cut.lastIndexOf('。'), cut.lastIndexOf('！'), cut.lastIndexOf('？'), cut.lastIndexOf('；'));
  return `${(punctuation >= 45 ? cut.slice(0, punctuation + 1) : cut).trim()}…`;
}

function categoryFor(record) {
  if (record.sourceName.includes('老钟')) return '试运行·银发养老';
  if (record.sourceName.includes('小荷') || record.sourceName.includes('蓝海')) return '试运行·健康内容';
  if (record.sourceName.includes('武威')) return '试运行·门诊经营';
  if (record.sourceName.includes('小伍')) return '试运行·诊所经营';
  if (record.sourceName.includes('丞冉')) return '试运行·医馆运营';
  return '试运行·医馆运营';
}

function productFitFor(record) {
  if (record.sourceName.includes('老钟')) return ['抖音图文', '养老服务'];
  if (record.sourceName.includes('小荷') || record.sourceName.includes('蓝海')) return ['抖音图文', '健康服务'];
  return ['抖音图文', '医馆运营'];
}

const records = input.records.map((record) => {
  const title = dedupeRepeatedTitle(record.originalTitle);
  const body = cleanBody(record.summaryOrBody);
  const draft = [title, body].filter(Boolean).join('\n\n');
  if (!title || !body || draft.length < 20) throw new Error(`试运行素材清洗后内容过短：${record.id}`);
  return {
    id: `aima-douyin-pilot-${record.id.replace(/^douyin-/, '')}`,
    category: categoryFor(record),
    title,
    insight: firstSentences(body),
    angle: record.rewriteDirection,
    action: `试运行提示：${record.qualityFlags?.length ? record.qualityFlags.join('；') : '发布前仍需人工复核事实和表达边界'}。`,
    draft,
    sourceName: `AI马过河试运行｜${record.sourceName}`,
    sourceUrl: record.sourceUrl || '',
    productFit: productFitFor(record),
    priority: 1000 - record.pilotOrder,
    requiresVerification: true,
    origin: '用户提供的本地文档；试运行整理稿',
    collection: 'AI马过河·本地文档试运行',
    sourceFile: record.sourceFile,
    sourceEntryNumber: record.sourceEntryNumber,
    sourceDate: record.date || record.publishedAt || '',
    originalAuthor: record.originalAuthor || '',
    tags: record.tags || [],
    topic: record.topic || '',
    format: record.format || '',
    reviewSignals: record.reviewSignals || [],
    qualityFlags: record.qualityFlags || [],
    selectionReason: record.selectionReason,
    rewriteDirection: record.rewriteDirection,
    editorialStatus: '试运行待复核',
    publishable: false,
    draftStatus: 'cleaned_source',
  };
});

const uniqueIds = new Set(records.map((record) => record.id));
if (uniqueIds.size !== 35) throw new Error('试运行素材 ID 不唯一');

fs.writeFileSync(outputPath, `${JSON.stringify(records, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ outputPath, count: records.length, categories: Object.fromEntries(records.reduce((map, record) => map.set(record.category, (map.get(record.category) || 0) + 1), new Map())) }, null, 2));
