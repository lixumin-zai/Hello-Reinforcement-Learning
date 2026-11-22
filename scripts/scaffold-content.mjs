#!/usr/bin/env node
/**
 * 内容框架脚手架：framework/framework.json → content/docs 骨架 + outline.md + 动效总注册表
 *
 * 用法：node scripts/scaffold-content.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fw = JSON.parse(fs.readFileSync(path.join(root, 'framework/framework.json'), 'utf8'));
const docsDir = path.join(root, 'content/docs');
const motionDir = path.join(root, 'src/motion/compositions');

const GROUPS = [
  { title: 'L1 · 直觉与博弈入门', chapters: ['01-worldview', '02-bandits'] },
  { title: 'L2 · 数学核心与表格求解', chapters: ['03-mdp-bellman', '04-dynamic-programming', '05-monte-carlo', '06-temporal-difference'] },
  { title: 'L3 · 深度强化学习', chapters: ['07-dqn', '08-policy-gradient-ppo'] },
  { title: 'L4 · 前沿规划与大模型后训练', chapters: ['09-control-and-planning', '10-rl-for-llm'] },
];

const created = [];
const write = (file, content, { overwrite = false } = {}) => {
  if (!overwrite && fs.existsSync(file)) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  created.push(path.relative(root, file));
};

const esc = (s) => String(s).replace(/[{}<>]/g, (c) => ({ '{': '\\{', '}': '\\}', '<': '&lt;', '>': '&gt;' })[c]);
const yamlStr = (s) => `'${String(s).replace(/'/g, "''")}'`;
const stars = (n) => '★'.repeat(n) + '☆'.repeat(Math.max(0, 5 - n));

// 1. 根 meta.json
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

// 2. 每章 meta.json + 小节骨架 + 动效注册入口
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
      '{/* @status: skeleton —— 待按六段式深度标准填充 */}',
      '',
      `<Callout type="warn" title="难度 ${stars(sec.difficulty ?? ch.difficulty)} · 待填充">`,
      '  本节正在按重构计划逐章深度编写。',
      '</Callout>',
      '',
      '## 核心知识点',
      '',
      ...sec.points.map((p) => `- ${esc(p)}`),
      '',
      ...(sec.components.length
        ? ['## 规划交互', '', ...sec.components.map((c) => `- **\`<${c.name} />\`**：${esc(c.idea)}`), '']
        : []),
      ...(sec.motions.length
        ? ['## 规划动效', '', ...sec.motions.map((m) => `- 🎬 **\`${m.id}\`**：${esc(m.idea)}`), '']
        : []),
      '<Cards>',
      `  <Card title=${JSON.stringify(`下一节：${nextTitle}`)} href=${JSON.stringify(nextHref)} />`,
      '</Cards>',
      '',
    ].join('\n');

    write(path.join(dir, `${sec.slug}.mdx`), body);
  });

  write(
    path.join(motionDir, ch.id, 'index.ts'),
    [
      "import type { MotionEntry } from '../../types';",
      '',
      `/** ${ch.title} 的动效讲解注册表 */`,
      'export const entries: MotionEntry[] = [];',
      '',
    ].join('\n'),
  );
}

// 3. 动效总注册表
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

// 4. outline.md
const outline = [
  `# ${fw.project}：深度全景交互教程大纲（10 章 34 节）`,
  '',
  '> ⚠️ 本文件由 `node scripts/scaffold-content.mjs` 根据 `framework/framework.json` 自动生成。',
  '',
  `**目标读者**：${fw.audience}`,
  '',
  '**课程设计原则**',
  '',
  ...fw.principles.map((p) => `- ${p}`),
  '',
  '图例：🎮/📊 深度交互游戏与实验台 · 🎬 Remotion 定制视觉动效',
  '',
  ...GROUPS.flatMap((g) => [
    '---',
    '',
    `# ${g.title}`,
    '',
    ...g.chapters.flatMap((id) => {
      const ch = fw.chapters.find((c) => c.id === id);
      return [
        `## ${ch.title}（难度：${stars(ch.difficulty)}）`,
        '',
        `> ${ch.description}`,
        '',
        ...ch.sections.flatMap((s) => [
          `### ${s.title}（${stars(s.difficulty ?? ch.difficulty)}）`,
          '',
          `_${s.description}_`,
          '',
          ...s.points.map((p) => `- ${p}`),
          ...s.components.map((c) => `- 🎮 \`<${c.name} />\` — ${c.idea}`),
          ...s.motions.map((m) => `- 🎬 \`${m.id}\` — ${m.idea}`),
          '',
        ]),
      ];
    }),
  ]),
].join('\n');
write(path.join(root, 'outline.md'), outline, { overwrite: true });

console.log(`✔ scaffold 完成，写入 ${created.length} 个文件`);
