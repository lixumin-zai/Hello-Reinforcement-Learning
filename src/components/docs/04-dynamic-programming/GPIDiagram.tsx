'use client';

import React, { useState } from 'react';

const STEPS = [
  { tag: '初始状态 (V₀, π₀)', desc: '随机初始化价值估计 V₀ 与策略 π₀，两者既不自洽也不最优。' },
  { tag: '评估步 E₁：V → v_{π₀}', desc: '固定策略 π₀，通过 Bellman 期望备份更新 V，使价值逼近真实 v_{π₀}。' },
  { tag: '改进步 I₁：π₁ ← greedy(V)', desc: '固定当前价值估计 V，对每个状态取 argmax_a Q(s,a)，得到更优策略 π₁。' },
  { tag: '评估步 E₂：V → v_{π₁}', desc: '由于策略改变了，旧价值不再准确，再次把价值拉向新策略的真实价值 v_{π₁}。' },
  { tag: '收敛不动点 (v*, π*)', desc: '当评估与改进都不再产生变化时，Bellman 最优方程严格成立！' },
];

export function GPIDiagram() {
  const [idx, setIdx] = useState(0);

  return (
    <div className="rounded-xl border border-border bg-card p-6 my-6 shadow-sm space-y-4">
      <p className="text-sm text-muted-foreground">
        ▶ 点击下方阶段按钮，逐步观察广义策略迭代 (GPI) 中「策略评估」与「策略改进」如何相互作用：
      </p>

      <div className="flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <button
            key={s.tag}
            type="button"
            onClick={() => setIdx(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
              i === idx ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-border bg-background hover:bg-muted'
            }`}
          >
            {s.tag}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-background p-4 text-sm">
        <div className="font-bold mb-1">{STEPS[idx].tag}</div>
        <p className="text-muted-foreground">{STEPS[idx].desc}</p>
      </div>
    </div>
  );
}
