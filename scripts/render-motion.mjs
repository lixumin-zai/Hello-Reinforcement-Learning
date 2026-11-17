#!/usr/bin/env node
/**
 * Remotion 动效渲染辅助脚本（参考 vibe-motion/remotion-starter）
 *
 * 用法：
 *   node scripts/render-motion.mjs --list
 *   node scripts/render-motion.mjs --still agent-env-loop --frame=90
 *   node scripts/render-motion.mjs agent-env-loop
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entry = 'src/motion/remotion/index.ts';
const outDir = path.join(root, 'out/motion');
fs.mkdirSync(outDir, { recursive: true });

const args = process.argv.slice(2);
const isStill = args.includes('--still');
const isList = args.includes('--list') || args.length === 0;
const frameArg = args.find((a) => a.startsWith('--frame=')) ?? '--frame=60';
const compId = args.find((a) => !a.startsWith('--')) ?? 'agent-env-loop';

if (isList) {
  const r = spawnSync('npx', ['remotion', 'compositions', entry], { cwd: root, stdio: 'inherit' });
  process.exit(r.status ?? 0);
}

if (isStill) {
  const out = path.join(outDir, `${compId}-${frameArg.replace('--frame=', 'f')}.png`);
  const r = spawnSync('npx', ['remotion', 'still', entry, compId, out, frameArg], { cwd: root, stdio: 'inherit' });
  process.exit(r.status ?? 0);
}

const out = path.join(outDir, `${compId}.mp4`);
const r = spawnSync('npx', ['remotion', 'render', entry, compId, out], { cwd: root, stdio: 'inherit' });
process.exit(r.status ?? 0);
