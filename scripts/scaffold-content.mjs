#!/usr/bin/env node
/**
 * 内容框架脚手架：framework/framework.json → content/docs 骨架 + outline.md
 *
 * 设计原则：
 *  - framework.json 是“内容框架”的唯一真源（章节、小节、知识点、交互组件、动效）。
 *  - 本脚本是幂等的：只创建不存在的文件，绝不覆盖已写好的正文。
 *  - meta.json 与 outline.md 每次都会根据框架重新生成（它们不包含手写内容）。
 *
 * 用法：node scripts/scaffold-content.mjs [--force-meta]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fw = JSON.parse(fs.readFileSync(path.join(root, 'framework/framework.json'), 'utf8'));
const docsDir = path.join(root, 'content/docs');
const motionDir = path.join(root, 'src/motion/compositions');

/** 侧边栏分组（顺序即侧边栏顺序） */
const GROUPS = [
  { title: '基础篇', chapters: ['01-introduction', '02-mdp', '03-bandits'] },
  { title: '表格方法篇', chapters: ['04-dynamic-programming', '05-monte-carlo', '06-temporal-difference', '07-n-step-eligibility'] },
  { title: '深度强化学习篇', chapters: ['08-function-approximation', '09-deep-q-learning', '10-policy-gradient', '11-trust-region', '12-continuous-control'] },
  { title: '前沿专题篇', chapters: ['13-model-based', '14-exploration', '15-offline-imitation', '16-multi-agent', '17-rl-for-llm'] },
  { title: '实践篇', chapters: ['18-practice', '19-projects'] },
];

const created = [];
const write = (file, content, { overwrite = false } = {}) => {
  if (!overwrite && fs.existsSync(file)) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  created.push(path.relative(root, file));
};

const yamlStr = (s) => `'${String(s).replace(/'/g, "''")}'`;

// ---------- 1. 根 meta.json ----------
const allIds = fw.chapters.map((c) => c.id);
const grouped = GROUPS.flatMap((g) => g.chapters);
const missing = allIds.filter((id) => !grouped.includes(id));
if (missing.length) throw new Error(`GROUPS 中缺少章节: ${missing.join(', ')}`);

write(
  path.join(docsDir, 'meta.json'),
  JSON.stringify(
    {
      title: 'Hello RL',
      pages: ['index', 'notation', ...GROUPS.flatMap((g) => [`---${g.title}---`, ...g.chapters])],
    },
    null,
    2,
  ) + '\n',
  { overwrite: true },
);

// ---------- 2. 每章 meta.json + 小节骨架 ----------
for (const ch of fw.chapters) {
  const dir = path.join(docsDir, ch.id);
  write(
    path.join(dir, 'meta.json'),
    JSON.stringify({ title: ch.title, icon: ch.icon, pages: ch.sections.map((s) => s.slug) }, null, 2) + '\n',
    { overwrite: true },
  );

  ch.sections.forEach((sec, i) => {
    const next = ch.sections[i + 1];
    const nextChapter = fw.chapters[fw.chapters.indexOf(ch) + 1];
    const nextHref = next
      ? `/docs/${ch.id}/${next.slug === 'index' ? '' : next.slug}`.replace(/\/$/, '')
      : nextChapter
        ? `/docs/${nextChapter.id}`
        : '/docs';
    const nextTitle = next ? next.title : nextChapter ? nextChapter.title : '回到目录';

    const body = [
      '---',
      `title: ${yamlStr(sec.title)}`,
      `description: ${yamlStr(sec.description)}`,
      `icon: ${yamlStr(sec.icon)}`,
      '---',
      '',
      "import { Callout } from 'fumadocs-ui/components/callout';",
      "import { Cards, Card } from 'fumadocs-ui/components/card';",
      '',
      '{/* @status: skeleton —— 由 scripts/scaffold-content.mjs 生成，正文待按 WORKFLOW.md 的「文档流」填充 */}',
      '',
      '<Callout type="warn" title="🚧 本节正在建设中">',
      '  这是内容框架自动生成的骨架页，下面列出了本节规划的知识点、交互组件与动效讲解。',
      '</Callout>',
      '',
      '## 本节知识点',
      '',
      ...sec.points.map((p) => `- ${p}`),
      '',
      ...(sec.components.length
        ? ['## 规划的交互组件', '', ...sec.components.map((c) => `- **\`<${c.name} />\`**：${c.idea}`), '']
        : []),
      ...(sec.motions.length
        ? ['## 规划的动效讲解', '', ...sec.motions.map((m) => `- 🎬 **\`${m.id}\`**：${m.idea}`), '']
        : []),
      '<Cards>',
      `  <Card title=${JSON.stringify(`下一节：${nextTitle}`)} href=${JSON.stringify(nextHref)} />`,
      '</Cards>',
      '',
    ].join('\n');

    write(path.join(dir, `${sec.slug}.mdx`), body);
  });

  // 动效流：每章一个 composition 注册文件（并行写作时互不冲突）
  write(
    path.join(motionDir, ch.id, 'index.ts'),
    [
      "import type { MotionEntry } from '../../types';",
      '',
      `/** ${ch.title} 的动效讲解注册表（由动效流填充） */`,
      'export const entries: MotionEntry[] = [];',
      '',
    ].join('\n'),
  );
}

// ---------- 3. 动效总注册表（按章节聚合） ----------
const toIdent = (id) => 'ch' + id.replace(/-/g, '_');
write(
  path.join(motionDir, 'index.ts'),
  [
    '// ⚠️ 自动生成：node scripts/scaffold-content.mjs —— 请勿手动编辑',
    "import type { MotionEntry } from '../types';",
    ...fw.chapters.map((c) => `import { entries as ${toIdent(c.id)} } from './${c.id}';`),
    '',
    'export const motionEntries: MotionEntry[] = [',
    ...fw.chapters.map((c) => `  ...${toIdent(c.id)},`),
    '];',
    '',
  ].join('\n'),
  { overwrite: true },
);

// ---------- 4. outline.md（人类可读的大纲视图） ----------
const outline = [
  `# ${fw.project}：强化学习全景交互指南`,
  '',
  '> ⚠️ 本文件由 `node scripts/scaffold-content.mjs` 根据 `framework/framework.json` 自动生成，请修改 JSON 后重新生成。',
  '',
  `**目标读者**：${fw.audience}`,
  '',
  '**写作原则**',
  '',
  ...fw.principles.map((p) => `- ${p}`),
  '',
  '图例：📊 交互组件 · 🎬 Remotion 动效讲解',
  '',
  ...GROUPS.flatMap((g) => [
    '---',
    '',
    `# ${g.title}`,
    '',
    ...g.chapters.flatMap((id) => {
      const ch = fw.chapters.find((c) => c.id === id);
      const num = parseInt(id, 10);
      return [
        `## ${ch.title}`,
        '',
        `> ${ch.description}`,
        '',
        ...ch.sections.flatMap((s, i) => [
          `### ${num}.${i + 1} ${s.title}`,
          '',
          `_${s.description}_`,
          '',
          ...s.points.map((p, j) => `- ${num}.${i + 1}.${j + 1} ${p}`),
          ...s.components.map((c) => `- 📊 \`<${c.name} />\` — ${c.idea}`),
          ...s.motions.map((m) => `- 🎬 \`${m.id}\` — ${m.idea}`),
          '',
        ]),
      ];
    }),
  ]),
].join('\n');
write(path.join(root, 'outline.md'), outline, { overwrite: true });

console.log(`✔ scaffold 完成，写入 ${created.length} 个文件`);
for (const f of created) console.log('  ·', f);
