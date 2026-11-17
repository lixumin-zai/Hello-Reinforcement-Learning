'use client';

import React, { useState } from 'react';

export function PPOClipVisualizer() {
  const [adv, setAdv] = useState(1.0);
  const [eps, setEps] = useState(0.2);
  const [r, setR] = useState(1.25);

  const unclipped = r * adv;
  const clippedR = Math.max(1 - eps, Math.min(1 + eps, r));
  const clipped = clippedR * adv;
  const lClip = Math.min(unclipped, clipped);

  return (
    <div className="rounded-xl border border-border bg-card p-6 my-6 shadow-sm space-y-4">
      <p className="text-sm text-muted-foreground">
        ▶ 调节优势值 <code>Â_t</code>、截断半径 <code>ε</code> 与新旧策略概率比 <code>r_t(θ)</code>，观察 <code>L^CLIP</code> 如何阻止过激更新：
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
        <div>
          <div className="flex justify-between mb-1">
            <span>优势 Â_t</span>
            <span className={adv >= 0 ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
              {adv >= 0 ? `+${adv.toFixed(1)}` : adv.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min={-2}
            max={2}
            step={0.2}
            value={adv}
            onChange={(e) => setAdv(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span>截断阈值 ε</span>
            <span className="font-bold">{eps.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0.05}
            max={0.4}
            step={0.05}
            value={eps}
            onChange={(e) => setEps(Number(e.target.value))}
            className="w-full accent-teal-500"
          />
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span>概率比 r_t(θ)</span>
            <span className="font-bold">{r.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0.4}
            max={1.8}
            step={0.05}
            value={r}
            onChange={(e) => setR(Number(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center font-mono text-sm">
        <div className="rounded-xl border border-border bg-background p-3.5">
          <div className="text-xs text-muted-foreground mb-1">未截断项 r_t · Â_t</div>
          <div className="text-lg font-bold">{unclipped.toFixed(3)}</div>
        </div>
        <div className="rounded-xl border border-border bg-background p-3.5">
          <div className="text-xs text-muted-foreground mb-1">
            截断项 clip(r_t, {(1 - eps).toFixed(2)}, {(1 + eps).toFixed(2)}) · Â_t
          </div>
          <div className="text-lg font-bold">{clipped.toFixed(3)}</div>
        </div>
        <div className="rounded-xl border-2 border-indigo-500 bg-indigo-500/10 p-3.5">
          <div className="text-xs text-indigo-400 font-semibold mb-1">最终目标 L^CLIP = min(·, ·)</div>
          <div className="text-xl font-extrabold text-indigo-400">{lClip.toFixed(3)}</div>
        </div>
      </div>
    </div>
  );
}
