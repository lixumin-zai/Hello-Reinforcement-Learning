'use client';

import React, { useState } from 'react';

// 双峰连续动作 Q(s, a)：左侧峰 (-1.4, Q=2.85)，右侧峰 (+1.4, Q=3.0)
function qBimodal(a: number): number {
  return 2.85 * Math.exp(-Math.pow((a + 1.4) / 0.55, 2)) + 3.0 * Math.exp(-Math.pow((a - 1.4) / 0.55, 2));
}

export function SACEntropyLab() {
  const [alpha, setAlpha] = useState(0.35);
  const [q1, setQ1] = useState(4.6);
  const [q2, setQ2] = useState(3.9);

  const xs = Array.from({ length: 121 }, (_, i) => -3 + (i / 120) * 6);
  const qVals = xs.map(qBimodal);
  const unnorm = qVals.map((q) => Math.exp(q / Math.max(0.03, alpha)));
  const sumZ = unnorm.reduce((a, b) => a + b, 0) * (6 / 120);
  const piVals = unnorm.map((u) => u / sumZ);
  const maxPi = Math.max(0.6, ...piVals);

  // 近似香农熵 H(π) = -∫ π log π da
  const entropy = -piVals.reduce((acc, p) => acc + (p > 1e-8 ? p * Math.log(p) * (6 / 120) : 0), 0);

  const toQPts = xs
    .map((x, i) => `${26 + ((x + 3) / 6) * 510},${150 - (qVals[i] / 3.3) * 124}`)
    .join(' ');
  const toPiPts = xs
    .map((x, i) => `${26 + ((x + 3) / 6) * 510},${150 - (piVals[i] / maxPi) * 124}`)
    .join(' ');

  return (
    <div className="my-6 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm space-y-4 not-prose">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-bold">🌊 最大熵 SAC 多峰策略实验室：温度 α 如何决定策略鲁棒性？</div>
          <p className="text-xs text-muted-foreground mt-0.5">
            连续动作空间存在左右两个几乎同样好的通道（左峰 2.85 vs 右峰 3.00）。拖动温度 <code>α</code>：太小时彻底押注右峰丧失适应性，适中时优雅覆盖双峰！
          </p>
        </div>
        <span className="font-mono text-xs px-3 py-1 rounded-full bg-teal-500/15 text-teal-500 font-bold">
          策略熵 H(π) = {entropy.toFixed(2)} nats
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs font-mono">
        <span>温度系数 α = <strong className="text-amber-500">{alpha.toFixed(2)}</strong></span>
        <input type="range" min={0.04} max={2.0} step={0.02} value={alpha} onChange={(e) => setAlpha(Number(e.target.value))} className="flex-1 accent-amber-500" />
        <span className="text-muted-foreground">{alpha < 0.12 ? '近确定性贪心' : alpha > 1.2 ? '近均匀高随机' : '双峰平衡探索 ★'}</span>
      </div>

      <div className="rounded-xl border border-border bg-zinc-950 p-3">
        <svg viewBox="0 0 560 168" className="w-full h-44">
          <line x1={26} y1={150} x2={536} y2={150} stroke="#475569" strokeWidth={1.5} />
          {/* 虚线：真实双峰 Q(s, a) 曲面 */}
          <polyline fill="none" stroke="#94a3b8" strokeWidth={2} strokeDasharray="6 4" points={toQPts} />
          {/* 实心填充：最大熵能量策略 π*(a|s) ∝ exp(Q/α) */}
          <polygon points={`26,150 ${toPiPts} 536,150`} fill="rgba(45,212,191,0.22)" />
          <polyline fill="none" stroke="#2dd4bf" strokeWidth={3} points={toPiPts} />
          <text x={36} y={24} fill="#94a3b8" fontSize={10} fontFamily="monospace">--- 双峰 Q(s,a) 奖励曲面</text>
          <text x={220} y={24} fill="#2dd4bf" fontSize={10} fontFamily="monospace">━━ SAC 最大熵策略 π*(a|s) ∝ exp(Q(s,a)/α)</text>
        </svg>
      </div>

      {/* TD3 / SAC 双 Critic 取 min 演示 */}
      <div className="rounded-xl border border-border bg-background p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center text-xs font-mono">
        <div>
          <div className="flex justify-between mb-1"><span>Critic 1 估计 Q_φ1</span><strong>{q1.toFixed(1)}</strong></div>
          <input type="range" min={1} max={7} step={0.1} value={q1} onChange={(e) => setQ1(Number(e.target.value))} className="w-full accent-indigo-500" />
        </div>
        <div>
          <div className="flex justify-between mb-1"><span>Critic 2 估计 Q_φ2</span><strong>{q2.toFixed(1)}</strong></div>
          <input type="range" min={1} max={7} step={0.1} value={q2} onChange={(e) => setQ2(Number(e.target.value))} className="w-full accent-purple-500" />
        </div>
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/35 p-2.5 text-center">
          <div className="text-[10px] text-emerald-500 font-bold">TD3 / SAC 悲观下界目标</div>
          <div className="text-base font-extrabold text-emerald-500">min(Q₁, Q₂) = {Math.min(q1, q2).toFixed(1)}</div>
        </div>
      </div>
    </div>
  );
}
