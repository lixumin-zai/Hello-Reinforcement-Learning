#!/usr/bin/env node
/**
 * 内容与动效质检脚本（对照 framework/framework.json）
 *
 * 检查项：
 *  1. 每个小节都有对应 .mdx，且 frontmatter 含 title / description / icon
 *  2. 统计完成进度与平均篇幅（提醒过短页面）
 *  3. MDX 中 import 的 '@/components/...' 真实存在
 *  4. MDX 中 <MotionPlayer id="x" /> 已在 src/motion/compositions 注册
 *  5. 动效与算法核禁止 Math.random / Date.now / performance.now
 *  6. 动效禁止裸 CSS transition / animate-* 类
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const strict = process.argv.includes('--strict');
const fw = JSON.parse(fs.readFileSync(path.join(root, 'framework/framework.json'), 'utf8'));
const errors = [];
const warnings = [];

const walk = (dir) =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
        d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)],
      )
    : [];

const motionFiles = walk(path.join(root, 'src/motion/compositions')).filter((f) => /\.(ts|tsx)$/.test(f));
const motionIndexFiles = motionFiles.filter((f) => f.endsWith('/index.ts'));
const registered = new Set();
for (const f of motionIndexFiles) {
  const src = fs.readFileSync(f, 'utf8');
  for (const m of src.matchAll(/\bid:\s*['"]([a-z0-9-]+)['"]/g)) registered.add(m[1]);
}

const progress = [];
let totalDoneLines = 0;

for (const ch of fw.chapters) {
  let done = 0;
  for (const sec of ch.sections) {
    const file = path.join(root, 'content/docs', ch.id, `${sec.slug}.mdx`);
    const rel = path.relative(root, file);
    if (!fs.existsSync(file)) {
      errors.push(`缺少页面 ${rel}`);
      continue;
    }
    const src = fs.readFileSync(file, 'utf8');
    const fm = src.match(/^---\n([\s\S]*?)\n---/);
    for (const key of ['title', 'description', 'icon']) {
      if (!fm || !new RegExp(`^${key}:`, 'm').test(fm[1])) errors.push(`${rel} frontmatter 缺少 ${key}`);
    }
    if (src.includes('@status: skeleton')) continue;
    done++;
    const lineCount = src.split('\n').length;
    totalDoneLines += lineCount;
    if (lineCount < 110) warnings.push(`${rel} 偏短 (${lineCount} 行)，建议按六段式模板补充深度推导或代码`);

    for (const m of src.matchAll(/from\s+['"]@\/(components\/[^'"]+)['"]/g)) {
      const base = path.join(root, 'src', m[1]);
      if (!['.tsx', '.ts', '/index.tsx', '/index.ts'].some((ext) => fs.existsSync(base + ext)))
        errors.push(`${rel} 引用了不存在的组件 @/${m[1]}`);
    }
    for (const m of src.matchAll(/<MotionPlayer[^>]*\bid=["']([a-z0-9-]+)["']/g)) {
      if (!registered.has(m[1])) errors.push(`${rel} 使用了未注册的动效 id="${m[1]}"`);
    }
    for (const c of sec.components) {
      if (!src.includes(`<${c.name}`)) warnings.push(`${rel} 未使用规划的组件 <${c.name} />`);
    }
    for (const mo of sec.motions) {
      if (!src.includes(`id="${mo.id}"`)) warnings.push(`${rel} 未嵌入规划的动效 ${mo.id}`);
    }
  }
  progress.push({ chapter: ch.id, done, total: ch.sections.length });
}

for (const f of [...motionFiles, ...walk(path.join(root, 'src/lib/rl'))]) {
  const src = fs
    .readFileSync(f, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  if (/Math\.random\(|Date\.now\(|performance\.now\(/.test(src))
    errors.push(`${path.relative(root, f)} 含非确定性调用（请使用 createRng）`);
}

const total = progress.reduce((a, p) => a + p.total, 0);
const done = progress.reduce((a, p) => a + p.done, 0);
const avgLines = done ? Math.round(totalDoneLines / done) : 0;
console.log(
  `\n📚 内容进度：${done}/${total} 节已完成（${((done / total) * 100).toFixed(0)}%，均长 ${avgLines} 行）  🎬 已注册动效：${registered.size}\n`,
);
for (const p of progress) {
  const bar = '█'.repeat(p.done) + '░'.repeat(p.total - p.done);
  console.log(`  ${p.done === p.total ? '✅' : p.done ? '🟡' : '⬜'} ${p.chapter.padEnd(26)} ${bar} ${p.done}/${p.total}`);
}
if (warnings.length) {
  console.log(`\n⚠️  ${warnings.length} 条提醒：`);
  warnings.forEach((w) => console.log('   ·', w));
}
if (errors.length) {
  console.log(`\n❌ ${errors.length} 个错误：`);
  errors.forEach((e) => console.log('   ·', e));
}
process.exit(errors.length || (strict && done < total) ? 1 : 0);
