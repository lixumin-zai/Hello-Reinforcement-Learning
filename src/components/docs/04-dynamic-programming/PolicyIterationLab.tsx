'use client';

import React, { useMemo, useState } from 'react';
import { ACTION_ARROWS, GridWorld, PRESETS, policyIteration, valueToColor } from '@/lib/rl';

export function PolicyIterationLab() {
  const [step, setStep] = useState(0);
  const env = useMemo(() => new GridWorld(PRESETS.simple()), []);
  const snaps = useMemo(() => policyIteration(env, 0.9), [env]);
  const cur = snaps[Math.min(snaps.length - 1, step)];

  return (
    <div className="rounded-xl border border-border bg-card p-6 my-6 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          ▶ 交替执行「策略评估 (Evaluate)」与「贪心策略改进 (Improve)」，仅需数轮即锁定最优策略：
        </p>
        <div className="flex gap-1.5">
          {snaps.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStep(i)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-semibold border ${
                i === step
                  ? 'border-indigo-500 bg-indigo-500 text-white'
                  : 'border-border bg-background hover:bg-muted'
              }`}
            >
              {s.phase === 'evaluate' ? `E${Math.floor(i / 2)}` : `I${Math.floor(i / 2) + 1}`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-center py-2">
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: env.nS }, (_, s) => {
            const t = env.cell(s);
            if (t === 'wall') {
              return (
                <div
                  key={s}
                  className="w-16 h-16 rounded-lg bg-zinc-800 text-zinc-500 flex items-center justify-center text-xs font-bold"
                >
                  WALL
                </div>
              );
            }
            return (
              <div
                key={s}
                style={{ backgroundColor: valueToColor(cur.V[s], 1, 0.72) }}
                className="w-16 h-16 rounded-lg border border-border flex flex-col items-center justify-center"
              >
                <span className="text-base font-extrabold">
                  {t === 'goal' ? '★ G' : ACTION_ARROWS[cur.policy[s]]}
                </span>
                <span className="text-xs font-mono">{t === 'goal' ? '+1.00' : cur.V[s].toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-xs text-muted-foreground text-center font-mono">
        当前阶段：{cur.phase === 'evaluate' ? '策略评估 V ← v_π' : '贪心改进 π′ ← greedy(V)'}
        {cur.stable ? ' · ✅ 策略已稳定 (π′ = π = π*)' : ''}
      </div>
    </div>
  );
}
