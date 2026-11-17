'use client';

import React, { useMemo, useState } from 'react';
import { ACTION_ARROWS, GridWorld, PRESETS, argmax, greedyPath, trainTD } from '@/lib/rl';

export function CliffWalkingLab() {
  const [alg, setAlg] = useState<'sarsa' | 'q-learning'>('sarsa');
  const [epsilon, setEpsilon] = useState(0.1);

  const env = useMemo(() => new GridWorld(PRESETS.cliff()), []);
  const res = useMemo(
    () =>
      trainTD(env, {
        algorithm: alg,
        alpha: 0.5,
        gamma: 1.0,
        epsilon,
        episodes: 400,
        seed: 7,
      }),
    [env, alg, epsilon],
  );

  const path = useMemo(() => new Set(greedyPath(env, res.Q)), [env, res]);

  return (
    <div className="rounded-xl border border-border bg-card p-6 my-6 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          ▶ 4×12 悬崖行走基准：切换「SARSA（在策略）」与「Q-learning（离策略）」，观察学到的路径差异：
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAlg('sarsa')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              alg === 'sarsa' ? 'bg-teal-500 text-white' : 'bg-muted text-muted-foreground'
            }`}
          >
            SARSA（远离悬崖的安全路线）
          </button>
          <button
            type="button"
            onClick={() => setAlg('q-learning')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              alg === 'q-learning' ? 'bg-indigo-500 text-white' : 'bg-muted text-muted-foreground'
            }`}
          >
            Q-learning（贴着悬崖的最短路线）
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs font-mono">
        <span>探索率 ε = {epsilon.toFixed(2)}</span>
        <input
          type="range"
          min={0.02}
          max={0.3}
          step={0.02}
          value={epsilon}
          onChange={(e) => setEpsilon(Number(e.target.value))}
          className="flex-1 accent-indigo-500"
        />
      </div>

      <div className="overflow-x-auto py-1">
        <div className="grid grid-cols-12 gap-1 min-w-[600px]">
          {Array.from({ length: env.nS }, (_, s) => {
            const t = env.cell(s);
            const onPath = path.has(s);
            const bestA = argmax(res.Q[s]);
            if (t === 'pit') {
              return (
                <div
                  key={s}
                  className="h-11 rounded bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center text-[10px] font-bold"
                >
                  悬崖 -100
                </div>
              );
            }
            return (
              <div
                key={s}
                className={`h-11 rounded border flex flex-col items-center justify-center text-xs font-bold ${
                  onPath
                    ? alg === 'sarsa'
                      ? 'border-2 border-teal-400 bg-teal-500/20'
                      : 'border-2 border-indigo-400 bg-indigo-500/20'
                    : 'border-border bg-background'
                }`}
              >
                <span>{t === 'goal' ? 'G' : t === 'start' ? 'S' : ACTION_ARROWS[bestA]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
