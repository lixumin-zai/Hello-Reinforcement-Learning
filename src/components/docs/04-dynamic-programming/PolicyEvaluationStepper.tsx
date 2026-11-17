'use client';

import React, { useMemo, useState } from 'react';
import { GridWorld, PRESETS, policyEvaluation, uniformPolicy, valueToColor } from '@/lib/rl';

export function PolicyEvaluationStepper() {
  const [gamma, setGamma] = useState(0.9);
  const [k, setK] = useState(0);

  const env = useMemo(() => new GridWorld(PRESETS.simple()), []);
  const history = useMemo(() => policyEvaluation(env, uniformPolicy(env), gamma, 1e-4, 60), [env, gamma]);

  const idx = Math.min(history.length - 1, k);
  const snap = history[idx];

  return (
    <div className="rounded-xl border border-border bg-card p-6 my-6 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          ▶ 拖动扫描轮次 <code>k</code>，观察均匀随机策略下迭代策略评估的收敛过程：
        </p>
        <span className="text-xs font-mono px-2.5 py-1 rounded bg-teal-500/15 text-teal-500 font-bold">
          k = {idx}/{history.length - 1} · Δ = {Number.isFinite(snap.delta) ? snap.delta.toFixed(4) : '∞'}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2 flex-1">
          <span className="font-mono shrink-0">扫描轮次 k</span>
          <input
            type="range"
            min={0}
            max={history.length - 1}
            value={idx}
            onChange={(e) => setK(Number(e.target.value))}
            className="flex-1 accent-teal-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono">γ = {gamma.toFixed(2)}</span>
          <input
            type="range"
            min={0.5}
            max={0.98}
            step={0.02}
            value={gamma}
            onChange={(e) => setGamma(Number(e.target.value))}
            className="w-24 accent-indigo-500"
          />
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
                style={{ backgroundColor: valueToColor(snap.V[s], 0.5, 0.75) }}
                className="w-16 h-16 rounded-lg border border-border flex flex-col items-center justify-center"
              >
                <span className="text-xs font-bold">{t === 'goal' ? '★ G' : `s_${s}`}</span>
                <span className="text-xs font-mono mt-1">{t === 'goal' ? '+1.00' : snap.V[s].toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
