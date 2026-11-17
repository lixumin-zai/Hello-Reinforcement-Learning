'use client';

import React, { useMemo, useState } from 'react';
import { runBandit } from '@/lib/rl';

const ENV = { k: 4, means: [0.35, 0.55, 0.85, 0.45], kind: 'bernoulli' as const };

export function UCBVisualizer() {
  const [c, setC] = useState(1.0);
  const [stepIdx, setStepIdx] = useState(12);

  const sim = useMemo(() => runBandit(ENV, { type: 'ucb', c }, 40, 11), [c]);
  const st = sim.steps[Math.min(sim.steps.length - 1, Math.max(4, stepIdx))];
  const t = st.t + 1;

  return (
    <div className="rounded-xl border border-border bg-card p-6 my-6 shadow-sm space-y-4">
      <p className="text-sm text-muted-foreground">
        ▶ 调节探索系数 <code>c</code> 与步数滑块 <code>t</code>，观察 UCB 置信上界如何驱动动作选择：
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-24 font-mono">系数 c = {c.toFixed(1)}</span>
          <input
            type="range"
            min={0.2}
            max={2.5}
            step={0.1}
            value={c}
            onChange={(e) => setC(Number(e.target.value))}
            className="flex-1 accent-purple-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="w-24 font-mono">步数 t = {t}</span>
          <input
            type="range"
            min={4}
            max={39}
            step={1}
            value={stepIdx}
            onChange={(e) => setStepIdx(Number(e.target.value))}
            className="flex-1 accent-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {ENV.means.map((m, i) => {
          const q = st.estimates[i];
          const n = Math.max(1, st.counts[i]);
          const bonus = c * Math.sqrt(Math.log(t) / n);
          const ucb = q + bonus;
          const active = st.action === i;
          return (
            <div
              key={i}
              className={`rounded-xl border p-3.5 text-center ${
                active ? 'border-purple-500 bg-purple-500/10' : 'border-border bg-background'
              }`}
            >
              <div className="text-xs font-bold mb-1">
                臂 #{i + 1} {i === 2 ? '★' : ''}
              </div>
              <div className="text-base font-mono font-extrabold text-purple-400">UCB = {ucb.toFixed(2)}</div>
              <div className="text-[11px] font-mono text-muted-foreground mt-1">
                Q={q.toFixed(2)} + Bonus={bonus.toFixed(2)}
              </div>
              <div className="text-[11px] font-mono text-muted-foreground">N={n} · q*={m}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
