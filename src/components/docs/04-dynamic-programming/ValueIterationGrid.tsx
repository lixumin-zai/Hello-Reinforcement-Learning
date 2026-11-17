'use client';

import React, { useMemo, useState } from 'react';
import { ACTION_ARROWS, GridWorld, PRESETS, valueIteration, valueToColor } from '@/lib/rl';

export function ValueIterationGrid() {
  const [preset, setPreset] = useState<'simple' | 'classic'>('simple');
  const [k, setK] = useState(9);

  const env = useMemo(() => new GridWorld(PRESETS[preset]()), [preset]);
  const snaps = useMemo(() => valueIteration(env, 0.9, 1e-4, 30), [env]);
  const idx = Math.min(snaps.length - 1, k);
  const cur = snaps[idx];

  return (
    <div className="rounded-xl border border-border bg-card p-6 my-6 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          ▶ 拖动价值迭代轮次 <code>k</code>，观察 Bellman 最优备份算子如何一步到位同时逼近 <code>V*</code> 与 <code>π*</code>：
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPreset('simple')}
            className={`px-3 py-1 rounded text-xs font-semibold border ${
              preset === 'simple' ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-border bg-background'
            }`}
          >
            5×5 确定性网格
          </button>
          <button
            type="button"
            onClick={() => setPreset('classic')}
            className={`px-3 py-1 rounded text-xs font-semibold border ${
              preset === 'classic' ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-border bg-background'
            }`}
          >
            4×3 打滑网格 (slip=0.2)
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs font-mono">
        <span>迭代 k = {idx}/{snaps.length - 1}</span>
        <input
          type="range"
          min={0}
          max={snaps.length - 1}
          value={idx}
          onChange={(e) => setK(Number(e.target.value))}
          className="flex-1 accent-indigo-500"
        />
        <span>Δ = {Number.isFinite(cur.delta) ? cur.delta.toFixed(4) : '∞'}</span>
      </div>

      <div className="flex justify-center py-2">
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${env.spec.cols}, 68px)` }}
        >
          {Array.from({ length: env.nS }, (_, s) => {
            const t = env.cell(s);
            if (t === 'wall') {
              return (
                <div
                  key={s}
                  className="h-16 rounded-lg bg-zinc-800 text-zinc-500 flex items-center justify-center text-xs font-bold"
                >
                  WALL
                </div>
              );
            }
            return (
              <div
                key={s}
                style={{ backgroundColor: valueToColor(cur.V[s], 1, 0.72) }}
                className="h-16 rounded-lg border border-border flex flex-col items-center justify-center"
              >
                <span className="text-base font-extrabold">
                  {t === 'goal' ? '★ +1' : t === 'pit' ? '☠ -1' : ACTION_ARROWS[cur.policy[s]]}
                </span>
                <span className="text-xs font-mono">{cur.V[s].toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
