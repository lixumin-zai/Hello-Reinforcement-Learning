'use client';

import React, { useState } from 'react';

export function DiscountHorizonLab() {
  const [gamma, setGamma] = useState(0.55);

  // 走廊设计：起点在格 1；向左走 1 步拿到近处 +2 糖果；向右走 5 步拿到远处 +10 皇冠
  const gLeft = Math.pow(gamma, 1) * 2;
  const gRight = Math.pow(gamma, 5) * 10;
  // 临界点：2γ = 10γ⁵ => γ⁴ = 0.2 => γ* = 0.2^(1/4) ≈ 0.6687
  const criticalGamma = Math.pow(0.2, 0.25);
  const preferFar = gRight >= gLeft;
  const horizon = gamma < 0.999 ? (1 / (1 - gamma)).toFixed(1) : '∞';

  const weights = Array.from({ length: 8 }, (_, k) => Math.pow(gamma, k));

  return (
    <div className="my-6 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm space-y-5 not-prose">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-bold">🔭 折扣望远镜实验室：亲眼看 γ 跨越临界点反转最优策略！</div>
          <p className="text-xs text-muted-foreground mt-0.5">
            智能体站在走廊第 1 格：<strong>向左 1 步</strong>立得 +2 糖果，<strong>向右 5 步</strong>可得 +10 宝藏。拖动 <code>γ</code> 跨过 <code>γ* ≈ 0.67</code>！
          </p>
        </div>
        <span className="font-mono text-xs px-3 py-1 rounded-full bg-amber-500/15 text-amber-500 font-bold">
          γ = {gamma.toFixed(2)} · 有效视野 ≈ {horizon} 步
        </span>
      </div>

      {/* γ 滑块 */}
      <div className="space-y-1">
        <input
          type="range"
          min={0.1}
          max={0.99}
          step={0.01}
          value={gamma}
          onChange={(e) => setGamma(Number(e.target.value))}
          className="w-full accent-amber-500"
        />
        <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
          <span>0.10 (极度短视)</span>
          <span className="text-amber-500 font-bold">▲ 策略反转临界点 γ* = {criticalGamma.toFixed(3)}</span>
          <span>0.99 (极度远见)</span>
        </div>
      </div>

      {/* 走廊场景可视化 */}
      <div className="rounded-xl border border-border bg-background p-4 space-y-3">
        <div className="grid grid-cols-7 gap-2 text-center">
          {[
            { icon: '🍬', label: '糖果 +2', step: '1 步', active: !preferFar, color: 'border-rose-500 bg-rose-500/15' },
            { icon: '🤖', label: preferFar ? '最优：向右 ➔' : '最优：⬅ 向左', step: '起点 S', active: true, color: 'border-indigo-500 bg-indigo-500/15' },
            { icon: '·', label: '走廊', step: '2 步', active: preferFar, color: 'border-teal-500/40 bg-teal-500/5' },
            { icon: '·', label: '走廊', step: '3 步', active: preferFar, color: 'border-teal-500/40 bg-teal-500/5' },
            { icon: '·', label: '走廊', step: '4 步', active: preferFar, color: 'border-teal-500/40 bg-teal-500/5' },
            { icon: '·', label: '走廊', step: '5 步', active: preferFar, color: 'border-teal-500/40 bg-teal-500/5' },
            { icon: '👑', label: '宝藏 +10', step: '5 步', active: preferFar, color: 'border-emerald-500 bg-emerald-500/15' },
          ].map((cell, i) => (
            <div
              key={i}
              className={`rounded-xl border p-2.5 transition-all ${cell.active ? cell.color : 'border-border bg-muted/30 opacity-60'}`}
            >
              <div className="text-xl">{cell.icon}</div>
              <div className="text-[11px] font-bold mt-1">{cell.label}</div>
              <div className="text-[10px] font-mono text-muted-foreground">{cell.step}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className={`rounded-lg border p-3 ${!preferFar ? 'border-rose-500 bg-rose-500/10' : 'border-border bg-card'}`}>
            <div>向左拿糖果现值：G_left = γ¹ × 2 = <strong className="text-base">{gLeft.toFixed(3)}</strong></div>
          </div>
          <div className={`rounded-lg border p-3 ${preferFar ? 'border-emerald-500 bg-emerald-500/10' : 'border-border bg-card'}`}>
            <div>向右拿宝藏现值：G_right = γ⁵ × 10 = <strong className="text-base">{gRight.toFixed(3)}</strong></div>
          </div>
        </div>
      </div>

      {/* 未来 8 步折扣权重衰减柱 */}
      <div className="grid grid-cols-8 gap-2 items-end h-28 pt-2 border-t border-border">
        {weights.map((w, k) => (
          <div key={k} className="flex flex-col items-center justify-end h-full">
            <span className="text-[10px] font-mono text-amber-500">{w.toFixed(2)}</span>
            <div
              style={{ height: `${Math.max(4, w * 64)}px` }}
              className="w-full max-w-[34px] rounded-t bg-gradient-to-t from-amber-600 to-amber-300"
            />
            <span className="text-[10px] font-mono text-muted-foreground mt-1">γ^{k}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
