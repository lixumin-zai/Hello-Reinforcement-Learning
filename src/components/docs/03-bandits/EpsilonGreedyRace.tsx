'use client';

import React, { useMemo } from 'react';
import { averageRuns, makeGaussianBandit, movingAverage } from '@/lib/rl';

export function EpsilonGreedyRace() {
  const data = useMemo(() => {
    const T = 120;
    const runs = 35;
    const makeEnv = (r: number) => makeGaussianBandit(10, 500 + r);
    const e0 = averageRuns(makeEnv, { type: 'epsilon-greedy', epsilon: 0 }, T, runs);
    const e01 = averageRuns(makeEnv, { type: 'epsilon-greedy', epsilon: 0.1 }, T, runs);
    const e001 = averageRuns(makeEnv, { type: 'epsilon-greedy', epsilon: 0.01 }, T, runs);
    const opt = averageRuns(makeEnv, { type: 'epsilon-greedy', epsilon: 0, initial: 5, stepSize: 0.1 }, T, runs);
    return {
      e0: movingAverage(e0.optimalRate, 5),
      e01: movingAverage(e01.optimalRate, 5),
      e001: movingAverage(e001.optimalRate, 5),
      opt: movingAverage(opt.optimalRate, 5),
    };
  }, []);

  const toPoints = (arr: number[]) =>
    arr.map((v, i) => `${15 + (i / (arr.length - 1)) * 610},${170 - v * 150}`).join(' ');

  return (
    <div className="rounded-xl border border-border bg-card p-6 my-6 shadow-sm space-y-3">
      <p className="text-sm text-muted-foreground">
        ▶ 10 臂高斯老虎机（35 次独立实验平均）：对比不同 <code>ε</code> 与「乐观初值 Q₁=5」选中最优动作的比例曲线：
      </p>

      <svg viewBox="0 0 640 185" className="w-full h-48 bg-background rounded-lg border border-border p-2">
        <polyline fill="none" stroke="#94a3b8" strokeWidth="2" points={toPoints(data.e0)} />
        <polyline fill="none" stroke="#f59e0b" strokeWidth="2.2" points={toPoints(data.e001)} />
        <polyline fill="none" stroke="#6366f1" strokeWidth="2.5" points={toPoints(data.e01)} />
        <polyline fill="none" stroke="#14b8a6" strokeWidth="2.5" points={toPoints(data.opt)} />
      </svg>

      <div className="flex flex-wrap gap-4 text-xs font-mono">
        <span className="text-slate-400">■ ε = 0 (纯贪心，易卡死)</span>
        <span className="text-amber-500">■ ε = 0.01 (慢热探索)</span>
        <span className="text-indigo-500">■ ε = 0.10 (快速探索)</span>
        <span className="text-teal-500">■ 乐观初值 Q₁=+5, ε=0 (早期强制遍历)</span>
      </div>
    </div>
  );
}
