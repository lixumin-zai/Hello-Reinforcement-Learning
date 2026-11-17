'use client';

import React, { useMemo, useState } from 'react';
import { argmax, createRng, gaussian } from '@/lib/rl';

export function MaxBiasDemo() {
  const [numActions, setNumActions] = useState(8);
  const [sigma, setSigma] = useState(1.0);

  const stats = useMemo(() => {
    const rng = createRng(123);
    const trials = 400;
    let singleSum = 0;
    let doubleSum = 0;
    for (let t = 0; t < trials; t++) {
      // 所有动作真实均值均为 0
      const q1 = Array.from({ length: numActions }, () => gaussian(rng, 0, sigma));
      const q2 = Array.from({ length: numActions }, () => gaussian(rng, 0, sigma));
      singleSum += Math.max(...q1);
      const bestByQ1 = argmax(q1);
      doubleSum += q2[bestByQ1];
    }
    return { singleBias: singleSum / trials, doubleBias: doubleSum / trials };
  }, [numActions, sigma]);

  return (
    <div className="rounded-xl border border-border bg-card p-6 my-6 shadow-sm space-y-4">
      <p className="text-sm text-muted-foreground">
        ▶ 假设所有候选动作的真实价值都严格等于 <code>0</code>，僅因采样噪声 <code>N(0, σ²)</code>，直接取 <code>max_a Q(a)</code> 会产生显著的正向高估偏差：
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span>候选动作数 k = {numActions}</span>
          <input
            type="range"
            min={2}
            max={30}
            step={1}
            value={numActions}
            onChange={(e) => setNumActions(Number(e.target.value))}
            className="flex-1 accent-rose-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <span>噪声标准差 σ = {sigma.toFixed(1)}</span>
          <input
            type="range"
            min={0.2}
            max={2.5}
            step={0.1}
            value={sigma}
            onChange={(e) => setSigma(Number(e.target.value))}
            className="flex-1 accent-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-center">
          <div className="text-xs font-bold text-rose-400 mb-1">普通 Q-learning: E[max_a Q₁(a)]</div>
          <div className="text-2xl font-mono font-extrabold text-rose-400">+{stats.singleBias.toFixed(3)}</div>
          <div className="text-xs text-muted-foreground mt-1">动作数 k 越多、噪声越大，高估偏差越严重</div>
        </div>
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-center">
          <div className="text-xs font-bold text-emerald-400 mb-1">
            Double Q-learning: E[Q₂(argmax_a Q₁(a))]
          </div>
          <div className="text-2xl font-mono font-extrabold text-emerald-400">
            {stats.doubleBias >= 0 ? `+${stats.doubleBias.toFixed(3)}` : stats.doubleBias.toFixed(3)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">解耦“选动作 (Q₁)”与“评价值 (Q₂)”，期望无偏 (≈ 0)</div>
        </div>
      </div>
    </div>
  );
}
