'use client';

import React, { useMemo, useState } from 'react';
import { createRng, makeGaussianBandit, pull } from '@/lib/rl';

export function BanditPlayground() {
  const [seed, setSeed] = useState(11);
  const env = useMemo(() => makeGaussianBandit(6, seed), [seed]);
  const [counts, setCounts] = useState<number[]>(Array(6).fill(0));
  const [estimates, setEstimates] = useState<number[]>(Array(6).fill(0));
  const [totalR, setTotalR] = useState(0);
  const [regret, setRegret] = useState(0);
  const [reveal, setReveal] = useState(false);

  const bestMean = Math.max(...env.means);
  const totalPulls = counts.reduce((a, b) => a + b, 0);

  const handlePull = (a: number) => {
    const rng = createRng(seed * 1000 + totalPulls * 13 + a);
    const r = pull(env, a, rng);
    const nextN = counts[a] + 1;
    const nextQ = estimates[a] + (r - estimates[a]) / nextN;
    setCounts((c) => c.map((x, i) => (i === a ? nextN : x)));
    setEstimates((q) => q.map((x, i) => (i === a ? nextQ : x)));
    setTotalR((s) => s + r);
    setRegret((rg) => rg + (bestMean - env.means[a]));
  };

  const reset = (nextSeed = seed) => {
    setSeed(nextSeed);
    setCounts(Array(6).fill(0));
    setEstimates(Array(6).fill(0));
    setTotalR(0);
    setRegret(0);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 my-6 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          ▶ 亲自点击拉动 6 个老虎机臂，根据观测到的均值估计 <code>Q_t(a)</code> 寻找最优臂：
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            className="rounded-lg border border-border bg-background px-3 py-1 text-xs font-medium hover:bg-muted"
          >
            {reveal ? '隐藏真实均值 q*(a)' : '揭晓真实均值 q*(a)'}
          </button>
          <button
            type="button"
            onClick={() => reset(seed + 1)}
            className="rounded-lg border border-border bg-background px-3 py-1 text-xs font-medium hover:bg-muted"
          >
            换一局新机器
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {env.means.map((m, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handlePull(i)}
            className="rounded-xl border border-border bg-background hover:border-indigo-500 p-3.5 text-center transition-all hover:-translate-y-0.5"
          >
            <div className="text-xs font-bold text-indigo-500 mb-1">拉动臂 #{i + 1}</div>
            <div className="text-lg font-mono font-extrabold">Q = {estimates[i].toFixed(2)}</div>
            <div className="text-[11px] font-mono text-muted-foreground mt-1">已拉 N = {counts[i]} 次</div>
            {reveal && (
              <div className="text-[11px] font-mono text-emerald-500 mt-1 font-semibold">
                真实 q* = {m.toFixed(2)}
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap justify-between gap-2 rounded-lg bg-muted/50 px-4 py-2.5 text-xs font-mono">
        <span>总步数 t = {totalPulls}</span>
        <span>累计奖励 ΣR = {totalR.toFixed(2)}</span>
        <span className="text-amber-500 font-bold">累积遗憾 Regret = {regret.toFixed(2)}</span>
      </div>
    </div>
  );
}
