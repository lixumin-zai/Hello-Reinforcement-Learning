'use client';

import React, { useState } from 'react';

export function GAESpectrumLab() {
  const [gamma, setGamma] = useState(0.95);
  const [lambda, setLambda] = useState(0.9);
  const [deltas, setDeltas] = useState([1.2, -0.5, 0.8, 2.0, -0.4, 1.5]);

  const weights = deltas.map((_, l) => Math.pow(gamma * lambda, l));
  const terms = deltas.map((d, l) => d * weights[l]);
  const gae = terms.reduce((a, b) => a + b, 0);

  return (
    <div className="my-6 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm space-y-4 not-prose">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-bold">🎛️ 广义优势估计 GAE(γ, λ) 光谱调节器</div>
          <p className="text-xs text-muted-foreground mt-0.5">
            拖动 <code>λ</code> 从 <code>0</code>（纯单步 TD 优势 δ₀）平滑滑到 <code>1</code>（高方差蒙特卡洛优势），观察各未来步 TD 残差权重 <code>(γλ)^l</code>！
          </p>
        </div>
        <span className="font-mono text-xs px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-500 font-bold">
          Â₀^GAE = {gae >= 0 ? `+${gae.toFixed(3)}` : gae.toFixed(3)}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
        <label className="rounded-lg border border-border bg-background p-2.5 space-y-1">
          <div className="flex justify-between"><span>折扣因子 γ</span><strong className="text-teal-500">{gamma.toFixed(2)}</strong></div>
          <input type="range" min={0.7} max={1.0} step={0.01} value={gamma} onChange={(e) => setGamma(Number(e.target.value))} className="w-full accent-teal-500" />
        </label>
        <label className="rounded-lg border border-border bg-background p-2.5 space-y-1">
          <div className="flex justify-between"><span>GAE 平滑系数 λ (PPO 常用 0.95)</span><strong className="text-indigo-500">{lambda.toFixed(2)}</strong></div>
          <input type="range" min={0} max={1} step={0.05} value={lambda} onChange={(e) => setLambda(Number(e.target.value))} className="w-full accent-indigo-500" />
        </label>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 text-center font-mono text-xs">
        {deltas.map((d, l) => (
          <div key={l} className="rounded-xl border border-border bg-background p-3 space-y-1.5">
            <div className="text-[11px] text-muted-foreground">步 +{l}</div>
            <div className="h-14 flex items-end justify-center">
              <div
                style={{ height: `${Math.max(4, weights[l] * 52)}px` }}
                className="w-7 rounded-t bg-indigo-500"
                title={`权重 (γλ)^${l} = ${weights[l].toFixed(3)}`}
              />
            </div>
            <div className="text-[10px] text-indigo-500 font-bold">w={weights[l].toFixed(2)}</div>
            <input
              type="range"
              min={-3}
              max={3}
              step={0.2}
              value={d}
              onChange={(e) => setDeltas((prev) => prev.map((x, idx) => (idx === l ? Number(e.target.value) : x)))}
              className="w-full accent-amber-500"
            />
            <div className="text-[10px] text-muted-foreground">δ_{l}={d.toFixed(1)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
