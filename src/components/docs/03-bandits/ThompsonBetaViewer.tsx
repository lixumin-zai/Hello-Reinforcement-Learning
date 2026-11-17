'use client';

import React, { useState } from 'react';

export function ThompsonBetaViewer() {
  const [arms, setArms] = useState([
    { alpha: 2, beta: 5, trueP: 0.3 },
    { alpha: 6, beta: 4, trueP: 0.6 },
    { alpha: 10, beta: 2, trueP: 0.85 },
  ]);

  const observe = (idx: number, success: boolean) => {
    setArms((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, alpha: a.alpha + (success ? 1 : 0), beta: a.beta + (success ? 0 : 1) } : a)),
    );
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 my-6 shadow-sm space-y-4">
      <p className="text-sm text-muted-foreground">
        ▶ 为各臂手动注入「成功 (+1)」或「失败 (0)」观测，观察共轭后验 <code>Beta(α, β)</code> 均值与方差的实时收缩：
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {arms.map((a, i) => {
          const mean = a.alpha / (a.alpha + a.beta);
          const variance = (a.alpha * a.beta) / (Math.pow(a.alpha + a.beta, 2) * (a.alpha + a.beta + 1));
          return (
            <div key={i} className="rounded-xl border border-border bg-background p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm">臂 #{i + 1}</span>
                <span className="text-xs font-mono text-teal-500">Beta({a.alpha}, {a.beta})</span>
              </div>
              <div className="text-xs font-mono text-muted-foreground">
                后验均值 μ = {mean.toFixed(3)} · 标准差 σ = {Math.sqrt(variance).toFixed(3)}
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div style={{ width: `${(mean * 100).toFixed(1)}%` }} className="h-full bg-teal-500" />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => observe(i, true)}
                  className="flex-1 rounded bg-emerald-500/15 text-emerald-500 py-1 text-xs font-semibold hover:bg-emerald-500/25"
                >
                  +1 成功 (α++)
                </button>
                <button
                  type="button"
                  onClick={() => observe(i, false)}
                  className="flex-1 rounded bg-rose-500/15 text-rose-500 py-1 text-xs font-semibold hover:bg-rose-500/25"
                >
                  0 失败 (β++)
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
