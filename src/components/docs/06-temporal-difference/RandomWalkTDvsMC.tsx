'use client';

import React, { useMemo, useState } from 'react';
import { createRng } from '@/lib/rl';

const TRUE_V = [1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6];
const LABELS = ['A', 'B', 'C', 'D', 'E'];

export function RandomWalkTDvsMC() {
  const [episodes, setEpisodes] = useState(25);
  const [alpha, setAlpha] = useState(0.1);

  const { vTD, vMC } = useMemo(() => {
    const td = [0.5, 0.5, 0.5, 0.5, 0.5];
    const mc = [0.5, 0.5, 0.5, 0.5, 0.5];
    const rng = createRng(99);

    for (let ep = 0; ep < episodes; ep++) {
      let s = 2; // 从中心 C 出发
      const visited: number[] = [s];
      let finalR = 0;
      for (let step = 0; step < 200; step++) {
        const next = rng() < 0.5 ? s - 1 : s + 1;
        if (next < 0) {
          td[s] += alpha * (0 - td[s]);
          finalR = 0;
          break;
        }
        if (next >= 5) {
          td[s] += alpha * (1 - td[s]);
          finalR = 1;
          break;
        }
        td[s] += alpha * (td[next] - td[s]);
        s = next;
        visited.push(s);
      }
      for (const st of visited) {
        mc[st] += alpha * (finalR - mc[st]);
      }
    }
    return { vTD: td, vMC: mc };
  }, [episodes, alpha]);

  return (
    <div className="rounded-xl border border-border bg-card p-6 my-6 shadow-sm space-y-4">
      <p className="text-sm text-muted-foreground">
        ▶ Sutton &amp; Barto 经典 5 状态随机游走 (A–E)：拖动训练回合数，对比 <code>TD(0)</code> 与 <code>MC</code> 逼近真实价值 <code>[1/6..5/6]</code> 的速度：
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-28">回合数 = {episodes}</span>
          <input
            type="range"
            min={0}
            max={150}
            step={5}
            value={episodes}
            onChange={(e) => setEpisodes(Number(e.target.value))}
            className="flex-1 accent-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="w-28">步长 α = {alpha.toFixed(2)}</span>
          <input
            type="range"
            min={0.02}
            max={0.3}
            step={0.02}
            value={alpha}
            onChange={(e) => setAlpha(Number(e.target.value))}
            className="flex-1 accent-teal-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 text-center">
        {LABELS.map((lb, i) => (
          <div key={lb} className="rounded-xl border border-border bg-background p-3 space-y-1">
            <div className="font-bold text-sm">状态 {lb}</div>
            <div className="text-xs font-mono text-emerald-500">真值: {TRUE_V[i].toFixed(2)}</div>
            <div className="text-xs font-mono text-indigo-500 font-bold">TD: {vTD[i].toFixed(2)}</div>
            <div className="text-xs font-mono text-amber-500">MC: {vMC[i].toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
