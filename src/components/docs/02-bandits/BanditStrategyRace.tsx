'use client';

import React, { useMemo, useState } from 'react';
import { averageRuns, makeGaussianBandit, movingAverage } from '@/lib/rl';

export function BanditStrategyRace() {
  const [epsilon, setEpsilon] = useState(0.1);
  const [optInit, setOptInit] = useState(5.0);
  const [alpha, setAlpha] = useState(0.15);
  const [drift, setDrift] = useState(0.0);

  const data = useMemo(() => {
    const T = 180;
    const runs = 35;
    const makeEnv = (r: number) => makeGaussianBandit(10, 800 + r, drift);

    const greedy = averageRuns(makeEnv, { type: 'epsilon-greedy', epsilon: 0 }, T, runs);
    const sampleAvg = averageRuns(makeEnv, { type: 'epsilon-greedy', epsilon }, T, runs);
    const constAlpha = averageRuns(makeEnv, { type: 'epsilon-greedy', epsilon, stepSize: alpha }, T, runs);
    const optimistic = averageRuns(
      makeEnv,
      { type: 'epsilon-greedy', epsilon: 0, initial: optInit, stepSize: alpha },
      T,
      runs,
    );

    return {
      T,
      series: [
        { name: '纯贪心 (ε=0, 样本均值)', color: '#94a3b8', opt: movingAverage(greedy.optimalRate, 6), reg: greedy.avgRegret },
        { name: `ε-greedy (ε=${epsilon.toFixed(2)}, 样本均值 1/n)`, color: '#6366f1', opt: movingAverage(sampleAvg.optimalRate, 6), reg: sampleAvg.avgRegret },
        { name: `ε-greedy (ε=${epsilon.toFixed(2)}, 常数步长 α=${alpha.toFixed(2)})`, color: '#14b8a6', opt: movingAverage(constAlpha.optimalRate, 6), reg: constAlpha.avgRegret },
        { name: `乐观初值 (Q₁=+${optInit.toFixed(0)}, ε=0)`, color: '#f59e0b', opt: movingAverage(optimistic.optimalRate, 6), reg: optimistic.avgRegret },
      ],
    };
  }, [epsilon, optInit, alpha, drift]);

  const maxRegret = Math.max(10, ...data.series.flatMap((s) => s.reg));

  return (
    <div className="my-6 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm space-y-4 not-prose">
      <div>
        <div className="text-sm font-bold">🏁 10 臂老虎机百轮蒙特卡洛赛车场（35 局独立实验平均）</div>
        <p className="text-xs text-muted-foreground mt-0.5">
          试试把<strong>非平稳漂移强度 σ_drift</strong> 调到 <code>0.15</code>：你会亲眼看到「样本均值 1/n」被旧记忆拖垮，而「常数步长 α」迅速反超！
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
        <label className="rounded-lg border border-border bg-background p-2.5 space-y-1">
          <div className="flex justify-between">
            <span>探索率 ε</span>
            <strong className="text-indigo-500">{epsilon.toFixed(2)}</strong>
          </div>
          <input type="range" min={0.01} max={0.35} step={0.01} value={epsilon} onChange={(e) => setEpsilon(Number(e.target.value))} className="w-full accent-indigo-500" />
        </label>
        <label className="rounded-lg border border-border bg-background p-2.5 space-y-1">
          <div className="flex justify-between">
            <span>乐观初值 Q₁</span>
            <strong className="text-amber-500">+{optInit.toFixed(1)}</strong>
          </div>
          <input type="range" min={0} max={10} step={0.5} value={optInit} onChange={(e) => setOptInit(Number(e.target.value))} className="w-full accent-amber-500" />
        </label>
        <label className="rounded-lg border border-border bg-background p-2.5 space-y-1">
          <div className="flex justify-between">
            <span>常数步长 α</span>
            <strong className="text-teal-500">{alpha.toFixed(2)}</strong>
          </div>
          <input type="range" min={0.05} max={0.5} step={0.05} value={alpha} onChange={(e) => setAlpha(Number(e.target.value))} className="w-full accent-teal-500" />
        </label>
        <label className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-2.5 space-y-1">
          <div className="flex justify-between">
            <span>非平稳漂移 σ</span>
            <strong className="text-rose-500">{drift.toFixed(2)}</strong>
          </div>
          <input type="range" min={0} max={0.25} step={0.05} value={drift} onChange={(e) => setDrift(Number(e.target.value))} className="w-full accent-rose-500" />
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 图 1：最优动作比例 */}
        <div className="rounded-xl border border-border bg-background p-3.5">
          <div className="text-xs font-semibold mb-2">最优动作选中率 %（越高越好）</div>
          <svg viewBox="0 0 420 175" className="w-full h-44">
            {[0.25, 0.5, 0.75, 1].map((v) => (
              <g key={v}>
                <line x1={32} y1={155 - v * 135} x2={410} y2={155 - v * 135} stroke="currentColor" opacity={0.1} />
                <text x={4} y={158 - v * 135} fontSize={9} fill="currentColor" opacity={0.55}>
                  {Math.round(v * 100)}%
                </text>
              </g>
            ))}
            {data.series.map((s) => (
              <polyline
                key={s.name}
                fill="none"
                stroke={s.color}
                strokeWidth={2.3}
                points={s.opt
                  .map((v, i) => `${32 + (i / (data.T - 1)) * 378},${155 - v * 135}`)
                  .join(' ')}
              />
            ))}
          </svg>
        </div>

        {/* 图 2：平均累积遗憾 */}
        <div className="rounded-xl border border-border bg-background p-3.5">
          <div className="text-xs font-semibold mb-2">平均累积遗憾 Regret(t)（越低越好）</div>
          <svg viewBox="0 0 420 175" className="w-full h-44">
            {[0.25, 0.5, 0.75, 1].map((v) => (
              <g key={v}>
                <line x1={34} y1={155 - v * 135} x2={410} y2={155 - v * 135} stroke="currentColor" opacity={0.1} />
                <text x={2} y={158 - v * 135} fontSize={9} fill="currentColor" opacity={0.55}>
                  {(v * maxRegret).toFixed(0)}
                </text>
              </g>
            ))}
            {data.series.map((s) => (
              <polyline
                key={s.name}
                fill="none"
                stroke={s.color}
                strokeWidth={2.3}
                points={s.reg
                  .map((v, i) => `${34 + (i / (data.T - 1)) * 376},${155 - (v / maxRegret) * 135}`)
                  .join(' ')}
              />
            ))}
          </svg>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs font-mono">
        {data.series.map((s) => (
          <span key={s.name} style={{ color: s.color }} className="font-semibold">
            ● {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}
