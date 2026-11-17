'use client';

import React, { useState } from 'react';

export function GRPOGroupAdvantage() {
  const [rewards, setRewards] = useState([1.0, 0.9, 0.2, 0.0]);

  const mean = rewards.reduce((a, b) => a + b, 0) / rewards.length;
  const variance = rewards.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) / rewards.length;
  const std = Math.max(Math.sqrt(variance), 1e-4);
  const advantages = rewards.map((r) => (r - mean) / std);

  return (
    <div className="rounded-xl border border-border bg-card p-6 my-6 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          ▶ 调整同一 Prompt 采样出的 4 条回答的奖励分 <code>r_i</code>，实时计算 GRPO 组内标准化优势 <code>Â_i = (r_i - μ) / σ</code>：
        </p>
        <span className="text-xs font-mono px-2.5 py-1 rounded bg-indigo-500/15 text-indigo-400 font-bold">
          组均值 μ = {mean.toFixed(2)} · 标准差 σ = {std.toFixed(2)}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {rewards.map((r, i) => {
          const adv = advantages[i];
          const pos = adv >= 0;
          return (
            <div key={i} className="rounded-xl border border-border bg-background p-4 space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="font-bold">采样回答 o_{i + 1}</span>
                <span>r_{i + 1} = {r.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={r}
                onChange={(e) =>
                  setRewards((prev) => prev.map((v, idx) => (idx === i ? Number(e.target.value) : v)))
                }
                className="w-full accent-indigo-500"
              />
              <div
                className={`rounded-lg px-2.5 py-1.5 text-center font-mono text-xs font-bold ${
                  pos ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'
                }`}
              >
                相对优势 Â_{i + 1} = {pos ? `+${adv.toFixed(2)}` : adv.toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
