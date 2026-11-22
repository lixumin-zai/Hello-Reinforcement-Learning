'use client';

import React, { useMemo, useState } from 'react';
import { argmax, createRng, gaussian } from '@/lib/rl';

export function MaxBiasTrapLab() {
  const [kBranches, setKBranches] = useState(10);
  const [sigma, setSigma] = useState(1.0);

  // 精确复现 Sutton & Barto 例 6.7 (图 6.5):
  // 状态 A 有两个动作: Right -> 立即终局 R=0; Left -> 进入状态 B (R=0)
  // 状态 B 有 kBranches 个动作，全部终局，奖励均服从 N(-0.1, sigma²)（真实期望全为负 -0.1！）
  const sim = useMemo(() => {
    const E = 220;
    const runs = 40;
    const leftQ = Array(E).fill(0);
    const leftDQ = Array(E).fill(0);

    for (let run = 0; run < runs; run++) {
      const rng = createRng(900 + run * 29);
      // 1. 普通 Q-learning
      const qA = [0, 0]; // 0=Right, 1=Left
      const qB = Array(kBranches).fill(0);
      // 2. Double Q-learning
      const dq1A = [0, 0], dq2A = [0, 0];
      const dq1B = Array(kBranches).fill(0), dq2B = Array(kBranches).fill(0);

      for (let ep = 0; ep < E; ep++) {
        // --- Q-learning ---
        const a1 = rng() < 0.1 ? (rng() < 0.5 ? 0 : 1) : argmax(qA, rng);
        if (a1 === 1) {
          leftQ[ep] += 1 / runs;
          qA[1] += 0.1 * (0 + Math.max(...qB) - qA[1]);
          const bAct = rng() < 0.1 ? Math.floor(rng() * kBranches) : argmax(qB, rng);
          const r = gaussian(rng, -0.1, sigma);
          qB[bAct] += 0.1 * (r - qB[bAct]);
        } else {
          qA[0] += 0.1 * (0 - qA[0]);
        }

        // --- Double Q-learning ---
        const sumA = [dq1A[0] + dq2A[0], dq1A[1] + dq2A[1]];
        const a2 = rng() < 0.1 ? (rng() < 0.5 ? 0 : 1) : argmax(sumA, rng);
        if (a2 === 1) {
          leftDQ[ep] += 1 / runs;
          if (rng() < 0.5) {
            dq1A[1] += 0.1 * (0 + dq2B[argmax(dq1B, rng)] - dq1A[1]);
          } else {
            dq2A[1] += 0.1 * (0 + dq1B[argmax(dq2B, rng)] - dq2A[1]);
          }
          const sumB = dq1B.map((v, i) => v + dq2B[i]);
          const bAct = rng() < 0.1 ? Math.floor(rng() * kBranches) : argmax(sumB, rng);
          const r = gaussian(rng, -0.1, sigma);
          if (rng() < 0.5) dq1B[bAct] += 0.1 * (r - dq1B[bAct]);
          else dq2B[bAct] += 0.1 * (r - dq2B[bAct]);
        } else {
          if (rng() < 0.5) dq1A[0] += 0.1 * (0 - dq1A[0]);
          else dq2A[0] += 0.1 * (0 - dq2A[0]);
        }
      }
    }
    return { leftQ, leftDQ };
  }, [kBranches, sigma]);

  const toPts = (arr: number[]) =>
    arr.map((v, i) => `${32 + (i / (arr.length - 1)) * 548},${158 - v * 138}`).join(' ');

  return (
    <div className="my-6 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm space-y-4 not-prose">
      <div>
        <div className="text-sm font-bold">🎲 Sutton &amp; Barto 经典 A→B 最大化偏差陷阱（40 局平均）</div>
        <p className="text-xs text-muted-foreground mt-0.5">
          状态 A 向右直接拿 <code>0</code>（最优）；向左进入状态 B，B 有 <code>k</code> 个动作，每个真实期望全是 <code>-0.1</code>（含噪声 <code>σ</code>）。按理应该永远向右，但看普通 Q-learning 如何被 <code>max</code> 骗得疯狂向左！
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
        <label className="rounded-lg border border-border bg-background p-2.5 space-y-1">
          <div className="flex justify-between"><span>状态 B 的分支动作数 k</span><strong className="text-rose-500">{kBranches}</strong></div>
          <input type="range" min={2} max={30} step={2} value={kBranches} onChange={(e) => setKBranches(Number(e.target.value))} className="w-full accent-rose-500" />
        </label>
        <label className="rounded-lg border border-border bg-background p-2.5 space-y-1">
          <div className="flex justify-between"><span>状态 B 奖励噪声标准差 σ</span><strong className="text-indigo-500">{sigma.toFixed(1)}</strong></div>
          <input type="range" min={0.2} max={2.0} step={0.2} value={sigma} onChange={(e) => setSigma(Number(e.target.value))} className="w-full accent-indigo-500" />
        </label>
      </div>

      <div className="rounded-xl border border-border bg-background p-3">
        <div className="flex justify-between text-xs font-mono mb-1">
          <span className="text-muted-foreground">纵轴：从 A 误选“向左”进陷阱的比例（最优下界 = 5%）</span>
          <span>
            <span className="text-rose-500 font-bold mr-3">■ 普通 Q-learning: {((sim.leftQ.at(-1) ?? 0) * 100).toFixed(0)}%</span>
            <span className="text-emerald-500 font-bold">■ Double Q: {((sim.leftDQ.at(-1) ?? 0) * 100).toFixed(0)}%</span>
          </span>
        </div>
        <svg viewBox="0 0 600 172" className="w-full h-44">
          {/* 最优 5% 下界线 */}
          <line x1={32} y1={158 - 0.05 * 138} x2={580} y2={158 - 0.05 * 138} stroke="#94a3b8" strokeDasharray="4 4" />
          <polyline fill="none" stroke="#f43f5e" strokeWidth={2.6} points={toPts(sim.leftQ)} />
          <polyline fill="none" stroke="#10b981" strokeWidth={2.6} points={toPts(sim.leftDQ)} />
          <text x={2} y={24} fontSize={9} fill="currentColor" opacity={0.55}>100%</text>
          <text x={8} y={158} fontSize={9} fill="currentColor" opacity={0.55}>0%</text>
        </svg>
      </div>
    </div>
  );
}
