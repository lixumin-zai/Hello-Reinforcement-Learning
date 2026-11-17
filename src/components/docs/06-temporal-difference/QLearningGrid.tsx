'use client';

import React, { useMemo, useState } from 'react';
import { ACTION_ARROWS, GridWorld, PRESETS, argmax, greedyPath, trainTD, valueToColor } from '@/lib/rl';

export function QLearningGrid() {
  const [alpha, setAlpha] = useState(0.4);
  const [gamma, setGamma] = useState(0.9);
  const [episodes, setEpisodes] = useState(180);

  const env = useMemo(() => new GridWorld(PRESETS.simple()), []);
  const res = useMemo(
    () =>
      trainTD(env, {
        algorithm: 'q-learning',
        alpha,
        gamma,
        epsilon: 0.15,
        episodes,
        seed: 21,
      }),
    [env, alpha, gamma, episodes],
  );

  const path = useMemo(() => new Set(greedyPath(env, res.Q)), [env, res]);

  return (
    <div className="rounded-xl border border-border bg-card p-6 my-6 shadow-sm space-y-4">
      <p className="text-sm text-muted-foreground">
        ▶ 调节步长 <code>α</code>、折扣因子 <code>γ</code> 与训练回合数，观察无模型 Q-learning 从零学出 5×5 迷宫最优路线：
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span>α={alpha.toFixed(2)}</span>
          <input
            type="range"
            min={0.1}
            max={0.9}
            step={0.1}
            value={alpha}
            onChange={(e) => setAlpha(Number(e.target.value))}
            className="flex-1 accent-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <span>γ={gamma.toFixed(2)}</span>
          <input
            type="range"
            min={0.5}
            max={0.99}
            step={0.02}
            value={gamma}
            onChange={(e) => setGamma(Number(e.target.value))}
            className="flex-1 accent-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <span>回合={episodes}</span>
          <input
            type="range"
            min={10}
            max={400}
            step={10}
            value={episodes}
            onChange={(e) => setEpisodes(Number(e.target.value))}
            className="flex-1 accent-indigo-500"
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
            const maxQ = Math.max(...res.Q[s]);
            const bestA = argmax(res.Q[s]);
            return (
              <div
                key={s}
                style={{ backgroundColor: valueToColor(maxQ, 1, 0.72) }}
                className={`w-16 h-16 rounded-lg border flex flex-col items-center justify-center ${
                  path.has(s) ? 'border-2 border-indigo-400' : 'border-border'
                }`}
              >
                <span className="text-base font-extrabold">{t === 'goal' ? '★ G' : ACTION_ARROWS[bestA]}</span>
                <span className="text-xs font-mono">{t === 'goal' ? '+1.00' : maxQ.toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
