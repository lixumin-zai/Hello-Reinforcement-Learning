'use client';

import React, { useState } from 'react';

const DEFAULT_REWARDS = [1, 1, 1, 1, 2, 2, 5, 10];

export function DiscountSlider() {
  const [gamma, setGamma] = useState(0.85);
  const [rewards, setRewards] = useState<number[]>(DEFAULT_REWARDS);

  const weights = rewards.map((_, k) => Math.pow(gamma, k));
  const terms = rewards.map((r, k) => r * weights[k]);
  const totalG = terms.reduce((a, b) => a + b, 0);
  const horizon = gamma < 0.999 ? (1 / (1 - gamma)).toFixed(1) : '∞';

  return (
    <div className="rounded-xl border border-border bg-card p-6 my-6 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          ▶ 拖动折扣因子 <code>γ</code>，观察未来各步奖励权重 <code>γ^k</code> 与总回报 <code>G_t</code> 的实时变化：
        </p>
        <span className="text-xs font-mono px-2.5 py-1 rounded bg-amber-500/15 text-amber-500 font-bold">
          G_t = {totalG.toFixed(2)} · 有效视野 ≈ {horizon} 步
        </span>
      </div>

      <div className="flex items-center gap-4">
        <label className="text-xs font-semibold w-28 shrink-0">γ = {gamma.toFixed(2)}</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={gamma}
          onChange={(e) => setGamma(Number(e.target.value))}
          className="flex-1 accent-amber-500"
        />
        <button
          type="button"
          onClick={() => setRewards(DEFAULT_REWARDS)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          重置奖励
        </button>
      </div>

      <div className="grid grid-cols-8 gap-2 items-end h-44 pt-4 px-2 border-b border-border">
        {rewards.map((r, k) => {
          const w = weights[k];
          const val = terms[k];
          return (
            <div key={k} className="flex flex-col items-center justify-end h-full">
              <span className="text-[11px] font-mono font-bold text-amber-500 mb-1">{val.toFixed(2)}</span>
              <div
                style={{ height: `${Math.max(6, w * 115)}px` }}
                className="w-full max-w-[42px] rounded-t-md bg-gradient-to-t from-amber-600 to-amber-400 transition-all"
              />
              <span className="text-[11px] font-mono mt-1.5">k={k}</span>
              <span className="text-[10px] font-mono text-muted-foreground">γ^{k}={w.toFixed(2)}</span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>点击切换奖励分布：</span>
        <button
          type="button"
          onClick={() => setRewards([1, 1, 1, 1, 1, 1, 1, 1])}
          className="px-2.5 py-1 rounded border border-border bg-background hover:bg-muted"
        >
          恒定奖励 [1,1,…,1]
        </button>
        <button
          type="button"
          onClick={() => setRewards([0, 0, 0, 0, 0, 0, 0, 20])}
          className="px-2.5 py-1 rounded border border-border bg-background hover:bg-muted"
        >
          远期大奖 [0,…,0,20]
        </button>
        <button
          type="button"
          onClick={() => setRewards([5, -1, -1, -1, -1, -1, -1, 15])}
          className="px-2.5 py-1 rounded border border-border bg-background hover:bg-muted"
        >
          先甜后苦再大奖
        </button>
      </div>
    </div>
  );
}
