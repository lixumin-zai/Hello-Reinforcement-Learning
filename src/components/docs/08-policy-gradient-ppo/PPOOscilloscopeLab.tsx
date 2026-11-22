'use client';

import React, { useState } from 'react';

export function PPOOscilloscopeLab() {
  const [adv, setAdv] = useState(1.2);
  const [eps, setEps] = useState(0.2);
  const [r, setR] = useState(1.32);

  const unclipped = r * adv;
  const clippedR = Math.max(1 - eps, Math.min(1 + eps, r));
  const clipped = clippedR * adv;
  const lClip = Math.min(unclipped, clipped);
  const isClippedDeadZone =
    (adv > 0 && r > 1 + eps) || (adv < 0 && r < 1 - eps);
  const gradSlope = isClippedDeadZone ? 0 : adv;

  const rToX = (rv: number) => 42 + ((rv - 0.3) / 1.5) * 480;
  const yToPx = (lv: number) => 118 - Math.max(-2.6, Math.min(2.6, lv)) * 38;

  const polyPts = Array.from({ length: 76 }, (_, i) => {
    const rv = 0.3 + (i / 75) * 1.5;
    const cR = Math.max(1 - eps, Math.min(1 + eps, rv));
    const val = Math.min(rv * adv, cR * adv);
    return `${rToX(rv).toFixed(1)},${yToPx(val).toFixed(1)}`;
  }).join(' ');

  return (
    <div className="my-6 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm space-y-4 not-prose">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-bold">✂️ PPO-Clip 精密交互示波器：亲眼看梯度在截断死区归零！</div>
          <p className="text-xs text-muted-foreground mt-0.5">
            把优势 <code>Â_t</code> 切到正数或负数，再把概率比 <code>r_t(θ)</code> 拖出绿色信赖带 <code>[1-ε, 1+ε]</code>，观察目标曲线被水平剪平、梯度瞬间归零！
          </p>
        </div>
        <span
          className={`font-mono text-xs px-3 py-1 rounded-full font-bold border ${
            isClippedDeadZone
              ? 'bg-amber-500/15 border-amber-500 text-amber-500'
              : 'bg-emerald-500/15 border-emerald-500 text-emerald-500'
          }`}
        >
          ∂L^CLIP/∂r = {gradSlope.toFixed(2)} {isClippedDeadZone ? '🔒 已触发截断死区 (梯度=0)' : '⚡ 活跃梯度区'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
        <label className="rounded-lg border border-border bg-background p-2.5 space-y-1">
          <div className="flex justify-between">
            <span>优势 Â_t</span>
            <strong className={adv >= 0 ? 'text-emerald-500' : 'text-rose-500'}>{adv >= 0 ? `+${adv.toFixed(1)}` : adv.toFixed(1)}</strong>
          </div>
          <input type="range" min={-2} max={2} step={0.2} value={adv} onChange={(e) => setAdv(Number(e.target.value))} className="w-full accent-indigo-500" />
        </label>
        <label className="rounded-lg border border-border bg-background p-2.5 space-y-1">
          <div className="flex justify-between"><span>截断半径 ε</span><strong className="text-teal-500">{eps.toFixed(2)}</strong></div>
          <input type="range" min={0.05} max={0.4} step={0.05} value={eps} onChange={(e) => setEps(Number(e.target.value))} className="w-full accent-teal-500" />
        </label>
        <label className="rounded-lg border border-border bg-background p-2.5 space-y-1">
          <div className="flex justify-between"><span>概率比 r_t(θ)</span><strong className="text-amber-500">{r.toFixed(2)}</strong></div>
          <input type="range" min={0.35} max={1.75} step={0.02} value={r} onChange={(e) => setR(Number(e.target.value))} className="w-full accent-amber-500" />
        </label>
      </div>

      <div className="rounded-xl border border-border bg-zinc-950 p-3">
        <svg viewBox="0 0 560 232" className="w-full h-56">
          {/* [1-ε, 1+ε] 信赖带 */}
          <rect
            x={rToX(1 - eps)}
            y={18}
            width={rToX(1 + eps) - rToX(1 - eps)}
            height={196}
            fill="rgba(20,184,166,0.14)"
            stroke="rgba(45,212,191,0.45)"
            strokeDasharray="4 4"
          />
          <line x1={32} y1={118} x2={530} y2={118} stroke="#475569" strokeWidth={1.5} />
          <line x1={rToX(1)} y1={18} x2={rToX(1)} y2={214} stroke="#475569" strokeDasharray="3 3" />

          {/* 未截断虚线 r*A */}
          <line x1={rToX(0.3)} y1={yToPx(0.3 * adv)} x2={rToX(1.8)} y2={yToPx(1.8 * adv)} stroke="#64748b" strokeWidth={2} strokeDasharray="6 4" />

          {/* 真实 L^CLIP 实线 */}
          <polyline fill="none" stroke={adv >= 0 ? '#2dd4bf' : '#fb7185'} strokeWidth={3.5} points={polyPts} />

          {/* 当前光点 */}
          <circle cx={rToX(r)} cy={yToPx(lClip)} r={7.5} fill="#facc15" stroke="#090d16" strokeWidth={2} />

          <text x={rToX(1 - eps)} y={226} textAnchor="middle" fill="#5eead4" fontSize={10} fontFamily="monospace">1-ε ({(1 - eps).toFixed(2)})</text>
          <text x={rToX(1)} y={226} textAnchor="middle" fill="#cbd5e1" fontSize={10} fontFamily="monospace">r=1</text>
          <text x={rToX(1 + eps)} y={226} textAnchor="middle" fill="#5eead4" fontSize={10} fontFamily="monospace">1+ε ({(1 + eps).toFixed(2)})</text>
        </svg>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
        <div className="rounded-lg bg-muted/50 p-2">未截断 r·Â = <strong>{unclipped.toFixed(2)}</strong></div>
        <div className="rounded-lg bg-muted/50 p-2">截断 clip(r)·Â = <strong>{clipped.toFixed(2)}</strong></div>
        <div className="rounded-lg bg-indigo-500/15 text-indigo-500 p-2 font-bold">L^CLIP = {lClip.toFixed(2)}</div>
      </div>
    </div>
  );
}
