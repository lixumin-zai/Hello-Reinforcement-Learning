'use client';

import React, { useMemo, useState } from 'react';
import { runImportanceSamplingDemo } from '@/lib/rl';

export function ImportanceSamplingLab() {
  const [bLeft, setBLeft] = useState(0.5);
  const [stayProb, setStayProb] = useState(0.85);
  const [seed, setSeed] = useState(7);

  const sim = useMemo(() => runImportanceSamplingDemo(250, bLeft, stayProb, seed), [bLeft, stayProb, seed]);
  const maxY = Math.max(3, ...sim.ordinary.map((v) => Math.min(25, v)));

  const toPts = (arr: number[]) =>
    arr
      .map((v, i) => {
        const clamped = Math.min(maxY, v);
        const x = 36 + (i / (arr.length - 1)) * 545;
        const y = 175 - (clamped / maxY) * 150;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

  const trueY = 175 - (1.0 / maxY) * 150;

  return (
    <div className="my-6 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm space-y-4 not-prose">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-bold">⚖️ 重要性采样方差爆炸实验室（Sutton &amp; Barto 经典例 5.5）</div>
          <p className="text-xs text-muted-foreground mt-0.5">
            真实价值严格等于 <code>v_π = 1.0</code>。把行为策略 <code>b(左)</code> 调低或把自环概率调高，亲眼见证<strong>普通 IS (红)</strong> 剧烈尖峰爆炸 vs <strong>加权 IS (绿)</strong> 平稳紧贴真值！
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSeed((s) => s + 3)}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted"
        >
          换随机种子 (seed={seed})
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
        <label className="rounded-lg border border-border bg-background p-2.5 space-y-1">
          <div className="flex justify-between">
            <span>行为策略选左概率 b(左)（π 恒选左=1.0）</span>
            <strong className="text-indigo-500">{bLeft.toFixed(2)}</strong>
          </div>
          <input type="range" min={0.35} max={0.85} step={0.05} value={bLeft} onChange={(e) => setBLeft(Number(e.target.value))} className="w-full accent-indigo-500" />
        </label>
        <label className="rounded-lg border border-border bg-background p-2.5 space-y-1">
          <div className="flex justify-between">
            <span>原地循环概率（越大轨迹越长、ρ 连乘越炸）</span>
            <strong className="text-rose-500">{stayProb.toFixed(2)}</strong>
          </div>
          <input type="range" min={0.5} max={0.92} step={0.02} value={stayProb} onChange={(e) => setStayProb(Number(e.target.value))} className="w-full accent-rose-500" />
        </label>
      </div>

      <div className="rounded-xl border border-border bg-background p-3">
        <svg viewBox="0 0 600 195" className="w-full h-52">
          {/* 真值 1.0 水平参考线 */}
          <line x1={36} y1={trueY} x2={581} y2={trueY} stroke="#f59e0b" strokeWidth={1.8} strokeDasharray="5 4" />
          <text x={42} y={trueY - 5} fill="#f59e0b" fontSize={10} fontFamily="monospace">
            真实价值 v_π = 1.0
          </text>

          <polyline fill="none" stroke="#f43f5e" strokeWidth={2.2} points={toPts(sim.ordinary)} />
          <polyline fill="none" stroke="#10b981" strokeWidth={2.8} points={toPts(sim.weighted)} />

          <text x={4} y={28} fill="currentColor" opacity={0.55} fontSize={10}>{maxY.toFixed(1)}</text>
          <text x={14} y={178} fill="currentColor" opacity={0.55} fontSize={10}>0</text>
        </svg>
      </div>

      <div className="flex flex-wrap justify-between gap-2 text-xs font-mono">
        <span>
          <span className="text-rose-500 font-bold mr-4">■ 普通 IS 终值：{sim.ordinary.at(-1)?.toFixed(2)}（无偏但方差可无穷大）</span>
          <span className="text-emerald-500 font-bold">■ 加权 IS 终值：{sim.weighted.at(-1)?.toFixed(2)}（有偏但一致、方差极低）</span>
        </span>
        <span className="text-muted-foreground">单局最大权重 ρ_max = {sim.maxRho.toFixed(1)}×</span>
      </div>
    </div>
  );
}
