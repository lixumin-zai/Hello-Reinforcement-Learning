'use client';

import React, { useMemo, useState } from 'react';
import {
  ACTION_ARROWS,
  GridWorld,
  PRESETS,
  greedyToPolicy,
  policyEvaluation,
  uniformPolicy,
  valueIteration,
  valueToColor,
} from '@/lib/rl';

export function GridPolicyValueViewer() {
  const [mode, setMode] = useState<'random' | 'right-up' | 'optimal'>('random');
  const [gamma, setGamma] = useState(0.9);

  const env = useMemo(() => new GridWorld(PRESETS.simple()), []);

  const { V, arrows } = useMemo(() => {
    if (mode === 'optimal') {
      const snaps = valueIteration(env, gamma);
      const last = snaps[snaps.length - 1];
      return { V: last.V, arrows: last.policy.map((a) => ACTION_ARROWS[a]) };
    }
    if (mode === 'right-up') {
      // 固定偏好向右/向上
      const actions = Array.from({ length: env.nS }, (_, s) => (s % env.spec.cols < env.spec.cols - 1 ? 1 : 0));
      const pol = greedyToPolicy(env, actions);
      const hist = policyEvaluation(env, pol, gamma);
      return { V: hist[hist.length - 1].V, arrows: actions.map((a) => ACTION_ARROWS[a]) };
    }
    const pol = uniformPolicy(env);
    const hist = policyEvaluation(env, pol, gamma);
    return { V: hist[hist.length - 1].V, arrows: Array(env.nS).fill('✥') };
  }, [env, mode, gamma]);

  return (
    <div className="rounded-xl border border-border bg-card p-6 my-6 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          ▶ 切换不同策略 <code>π</code>，观察同一个网格世界中状态价值函数 <code>v_π(s)</code> 的变化：
        </p>
        <div className="flex items-center gap-2 text-xs">
          <span>γ = {gamma.toFixed(2)}</span>
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

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'random', label: '均匀随机策略 π(a|s)=0.25' },
          { id: 'right-up', label: '启发式策略（优先向右再向上）' },
          { id: 'optimal', label: '最优策略 π* (Value Iteration)' },
        ].map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setMode(b.id as typeof mode)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              mode === b.id
                ? 'border-indigo-500 bg-indigo-500 text-white'
                : 'border-border bg-background hover:bg-muted'
            }`}
          >
            {b.label}
          </button>
        ))}
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
                style={{ backgroundColor: valueToColor(V[s], 1, 0.72) }}
                className="w-16 h-16 rounded-lg border border-border flex flex-col items-center justify-center"
              >
                <span className="text-base font-bold">{t === 'goal' ? '★ G' : arrows[s]}</span>
                <span className="text-xs font-mono">{t === 'goal' ? '+1.00' : V[s].toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
