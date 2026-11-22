'use client';

import React, { useState } from 'react';

function gaussPdf(x: number, mu: number, sigma: number): number {
  return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
}

export function KLTrustRegionRadar() {
  const [muNew, setMuNew] = useState(0.35);
  const [sigmaNew, setSigmaNew] = useState(0.9);
  const deltaLimit = 0.2;

  // 旧策略固定为 N(0, 1)，精确闭式 D_KL(N(0,1) || N(mu, sigma))
  const kl = Math.log(sigmaNew / 1) + (1 + muNew * muNew) / (2 * sigmaNew * sigmaNew) - 0.5;
  const breached = kl > deltaLimit;

  const xs = Array.from({ length: 121 }, (_, i) => -4 + (i / 120) * 8);
  const toPts = (mu: number, sig: number) =>
    xs
      .map((x) => {
        const px = 20 + ((x + 4) / 8) * 520;
        const py = 152 - Math.min(1, gaussPdf(x, mu, sig) / 0.85) * 130;
        return `${px.toFixed(1)},${py.toFixed(1)}`;
      })
      .join(' ');

  return (
    <div className="my-6 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm space-y-4 not-prose">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-bold">🛡️ 双高斯策略 KL 信赖域雷达：为何不用参数距离 ‖θ - θ_old‖₂？</div>
          <p className="text-xs text-muted-foreground mt-0.5">
            试试把新策略标准差 <code>σ_new</code> 调小到 <code>0.4</code>（参数改动很小！），观察 KL 散度如何瞬间暴涨触发红色信赖域警报！
          </p>
        </div>
        <span
          className={`font-mono text-xs px-3 py-1 rounded-full font-bold border ${
            breached
              ? 'bg-rose-500/15 border-rose-500 text-rose-500'
              : 'bg-emerald-500/15 border-emerald-500 text-emerald-500'
          }`}
        >
          D_KL = {kl.toFixed(3)} {breached ? `> ${deltaLimit} 🚨 超出信赖域！` : `≤ ${deltaLimit} ✅ 安全区内`}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
        <label className="rounded-lg border border-border bg-background p-2.5 space-y-1">
          <div className="flex justify-between"><span>新策略均值 μ_new (旧=0.0)</span><strong>{muNew.toFixed(2)}</strong></div>
          <input type="range" min={-2} max={2} step={0.05} value={muNew} onChange={(e) => setMuNew(Number(e.target.value))} className="w-full accent-indigo-500" />
        </label>
        <label className="rounded-lg border border-border bg-background p-2.5 space-y-1">
          <div className="flex justify-between"><span>新策略标准差 σ_new (旧=1.0)</span><strong>{sigmaNew.toFixed(2)}</strong></div>
          <input type="range" min={0.3} max={2.0} step={0.05} value={sigmaNew} onChange={(e) => setSigmaNew(Number(e.target.value))} className="w-full accent-teal-500" />
        </label>
      </div>

      <div className="rounded-xl border border-border bg-zinc-950 p-3">
        <svg viewBox="0 0 560 168" className="w-full h-40">
          <line x1={20} y1={152} x2={540} y2={152} stroke="#475569" strokeWidth={1.5} />
          <polygon points={`20,152 ${toPts(0, 1)} 540,152`} fill="rgba(56,189,248,0.16)" />
          <polyline fill="none" stroke="#38bdf8" strokeWidth={2.5} strokeDasharray="6 4" points={toPts(0, 1)} />

          <polygon points={`20,152 ${toPts(muNew, sigmaNew)} 540,152`} fill={breached ? 'rgba(244,63,94,0.22)' : 'rgba(52,211,153,0.22)'} />
          <polyline fill="none" stroke={breached ? '#f43f5e' : '#34d399'} strokeWidth={3} points={toPts(muNew, sigmaNew)} />
        </svg>
      </div>
    </div>
  );
}
