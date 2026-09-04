import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inputPath = path.resolve(valueAfter('--input', path.join(repoRoot, '..', '..', '文档库', '内容规划', '制作计划', '2026-09-04-文案素材标准化清单.json')));
const outputPath = path.resolve(valueAfter('--output', path.join(repoRoot, 'src', 'aima-douyin-materials.json')));
const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
if (!Array.isArray(input.records) || input.records.length === 0) {
  throw new Error(`标准化清单为空或格式错误：${inputPath}`);
}

const zeroWidth = /[\u200b-\u200d\ufeff]/g;
const ctaLine = /(点赞(?:关注|评论)|关注我|评论区(?:回复|留言)|私信(?:我|作者)|加(?:我|微信|V)|联系作者|课程|训练营|扫码)/;
const metadataLine = /^(?:[-*]\s*)?(?:原文件|发布时间|博主|原链接|查看抖音原视频|日期|作者)\s*[:：]/i;
const knownMismatchIds = new Set(['douyin-6889169eadf1', 'douyin-b5cde7a2bba4']);

function dedupeRepeatedTitle(value) {
  let result = String(value || '').replace(zeroWidth, '').replace(/\s+/g, ' ').trim();
  for (let pass = 0; pass < 3; pass += 1) {
    const half = Math.floor(result.length / 2);
    if (result.length >= 8 && result.length % 2 === 0 && result.slice(0, half) === result.slice(half)) {
      result = result.slice(0, half).trim();
      continue;
    }
    const pivot = Math.ceil(result.length / 2);
    const left = result.slice(0, pivot);
    const repeatAt = result.indexOf(left, Math.max(1, Math.floor(pivot * 0.6)));
    if (repeatAt > 0 && result.slice(repeatAt, repeatAt + left.length) === left) {
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
    if (/^(#\S+\s*)+$/.test(next)) continue;
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
  if (record.sourceName.includes('老钟')) return '文档·银发养老';
  if (record.sourceName.includes('小荷') || record.sourceName.includes('蓝海')) return '文档·健康内容';
  if (record.sourceName.includes('武威')) return '文档·门诊经营';
  if (record.sourceName.includes('小伍')) return '文档·诊所经营';
  return '文档·医馆运营';
}

function productFitFor(record) {
  if (record.sourceName.includes('老钟')) return ['抖音图文', '养老服务'];
  if (record.sourceName.includes('小荷') || record.sourceName.includes('蓝海')) return ['抖音图文', '健康服务'];
  return ['抖音图文', '医馆运营'];
}

const records = input.records.map((record, index) => {
  const titleFromTags = String(record.titleWithTags || null).match(/#[^#\s]+/g)?.map((tag) => tag.slice(1)).join(String.fromCodePoint(0xFF5C)) || null;
  const title = dedupeRepeatedTitle(record.originalTitle || titleFromTags || `未提供标题｜${record.sourceName}第${record.sourceEntryNumber}条`);
  const mismatch = knownMismatchIds.has(record.id);
  const body = mismatch
    ? '【原始条目标题与正文疑似不匹配，暂不生成发布稿；请回看本地原文或原始链接。】'
    : cleanBody(record.summaryOrBody);
  const bodyText = body || '【原始摘要/正文缺失，暂不生成发布稿；请回看本地原文。】';
  if (!title) throw new Error(`第 ${index + 1} 条缺少标题：${record.id}`);
  const asArray = (value) => Array.isArray(value) ? value : (value ? [String(value)] : []);
  const asSignals = (value) => {
    if (Array.isArray(value)) return value.map((item) => String(item));
    if (value && typeof value === "object") return Object.entries(value).map(([name, count]) => `${name}：${count}次`);
    return value ? [String(value)] : [];
  };
  const flags = asArray(record.qualityFlags);
  const signals = asSignals(record.reviewSignals);
  if (mismatch) flags.push('标题与正文疑似不匹配');
  if (!record.originalTitle) flags.push('标题由标签或来源推导');
  if (!record.sourceUrl) flags.push('来源链接缺失');
  if (record.authorFieldDerived) flags.push('作者字段由文件名推导');
  if (bodyText.length < 30) flags.push('正文过短或仅为占位提示');
  const editorialStatus = mismatch ? '仅供参考' : (flags.length || signals.length ? '待复核' : '整理待复核');
  return {
    id: `aima-douyin-${record.id.replace(/^douyin-/, '')}`,
    category: categoryFor(record),
    title,
    insight: firstSentences(bodyText),
    angle: '保留原始选题价值，改写为 AI马过河 的真实经验和可执行建议。',
    action: `批量整理提示：${editorialStatus}。发布前核对事实、医疗健康表述、政策时效、收益承诺和导流语句。`,
    draft: `${title}\n\n${bodyText}`,
    sourceName: `AI马过河文档整理｜${record.sourceName}`,
    sourceUrl: record.sourceUrl || null,
    productFit: productFitFor(record),
    priority: input.records.length - index,
    requiresVerification: true,
    origin: '用户提供的本地文档；批量整理稿',
    collection: 'AI马过河·本地文档素材库',
    sourceFile: record.sourceFile,
    sourceEntryNumber: record.sourceEntryNumber,
    sourceDate: record.date || record.publishedAt || '',
    originalAuthor: record.originalAuthor || '',
    authorFieldDerived: Boolean(record.authorFieldDerived),
    tags: Array.isArray(record.tags) ? record.tags : [],
    topic: record.topic || '',
    format: record.format || '',
    reviewSignals: signals,
    qualityFlags: flags,
    sourceHash: record.sourceHash || '',
    editorialStatus,
    publishable: false,
    draftStatus: mismatch ? 'mismatch_hold' : 'cleaned_source',
  };
});

const uniqueIds = new Set(records.map((record) => record.id));
if (uniqueIds.size !== records.length) throw new Error('批量素材 ID 不唯一');
fs.writeFileSync(outputPath, `${JSON.stringify(records, null, 2)}\n`, 'utf8');

const counts = Object.fromEntries(records.reduce((map, record) => map.set(record.category, (map.get(record.category) || 0) + 1), new Map()));
const statuses = Object.fromEntries(records.reduce((map, record) => map.set(record.editorialStatus, (map.get(record.editorialStatus) || 0) + 1), new Map()));
console.log(JSON.stringify({ outputPath, count: records.length, categories: counts, editorialStatuses: statuses, knownMismatchHeld: records.filter((record) => record.draftStatus === 'mismatch_hold').length }, null, 2));
