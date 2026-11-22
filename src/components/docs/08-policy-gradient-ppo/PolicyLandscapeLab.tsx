'use client';

import React, { useMemo, useState } from 'react';
import { createRng, gaussian } from '@/lib/rl';

export function PolicyLandscapeLab() {
  const [useBaseline, setUseBaseline] = useState(true);
  const [offset, setOffset] = useState(10); // 给所有奖励整体加一个正偏移 +10

  // 生成 12 条随机采样梯度箭头：真实期望梯度指向右上 (dx=+55, dy=-42)
  const arrows = useMemo(() => {
    const rng = createRng(303);
    return Array.from({ length: 12 }, () => {
      // 模拟单次轨迹的对数梯度方向 u (均值为正指向峰顶，但有随机正负分量)
      const ux = gaussian(rng, 0.55, 0.7);
      const uy = gaussian(rng, -0.42, 0.7);
      const trueAdv = gaussian(rng, 0.8, 1.2); // 零均值附近的真实相对优劣
      const weight = useBaseline ? trueAdv : trueAdv + offset;
      // 缩放以展示方向与长度离散度
      const scale = useBaseline ? 22 : 6.5;
      return {
        dx: Math.max(-110, Math.min(110, ux * weight * scale)),
        dy: Math.max(-90, Math.min(90, uy * weight * scale)),
      };
    });
  }, [useBaseline, offset]);

  const meanDx = arrows.reduce((a, b) => a + b.dx, 0) / arrows.length;
  const meanDy = arrows.reduce((a, b) => a + b.dy, 0) / arrows.length;
  const variance = arrows.reduce((acc, a) => acc + Math.pow(a.dx - meanDx, 2) + Math.pow(a.dy - meanDy, 2), 0) / arrows.length;

  return (
    <div className="my-6 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm space-y-4 not-prose">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-bold">⛰️ 2D 策略梯度地形攀登器：基线 b(s) 如何暴降梯度方差？</div>
          <p className="text-xs text-muted-foreground mt-0.5">
            把奖励整体加上常数偏移 <code>+{offset}</code>，切换「启用/关闭基线 b(s)」，观察 12 条随机采样梯度箭头的散乱程度（注意期望方向完全不变，但方差差了十倍！）。
          </p>
        </div>
        <button
          type="button"
          onClick={() => setUseBaseline((v) => !v)}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border ${
            useBaseline ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-rose-500 bg-rose-500 text-white'
          }`}
        >
          {useBaseline ? '✅ 已启用基线 G_t - b(s)' : '❌ 未启用基线（纯 REINFORCE）'}
        </button>
      </div>

      <div className="flex items-center gap-3 text-xs font-mono">
        <span>全局奖励平移偏移 +{offset}</span>
        <input type="range" min={0} max={25} step={1} value={offset} onChange={(e) => setOffset(Number(e.target.value))} className="flex-1 accent-indigo-500" />
        <span className={useBaseline ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
          样本梯度方差 = {variance.toFixed(0)}
        </span>
      </div>

      <div className="rounded-xl border border-border bg-zinc-950 p-2">
        <svg viewBox="0 0 560 220" className="w-full h-52">
          {/* J(θ) 椭圆等高线，峰顶在 (410, 62) */}
          {[28, 62, 102, 150, 205].map((r, i) => (
            <ellipse
              key={r}
              cx={410}
              cy={62}
              rx={r * 1.45}
              ry={r * 0.78}
              fill="none"
              stroke="rgba(56,189,248,0.22)"
              strokeWidth={1.5}
              strokeDasharray={i % 2 === 0 ? 'none' : '5 4'}
            />
          ))}
          <circle cx={410} cy={62} r={7} fill="#facc15" />
          <text x={410} y={46} textAnchor="middle" fill="#fde047" fontSize={11} fontWeight={800}>★ 最优峰顶 J(θ*)</text>

          {/* 当前参数点 θ = (210, 145) 及 12 条采样梯度向量 */}
          {arrows.map((a, i) => (
            <line
              key={i}
              x1={210}
              y1={145}
              x2={210 + a.dx}
              y2={145 + a.dy}
              stroke={useBaseline ? 'rgba(52,211,153,0.62)' : 'rgba(251,113,133,0.58)'}
              strokeWidth={2}
            />
          ))}
          {/* 平均期望梯度箭头（无偏！） */}
          <line x1={210} y1={145} x2={210 + meanDx} y2={145 + meanDy} stroke="#facc15" strokeWidth={4} />
          <circle cx={210} cy={145} r={7} fill="#fff" stroke="#6366f1" strokeWidth={3} />
          <text x={210} y={168} textAnchor="middle" fill="#e2e8f0" fontSize={11} fontFamily="monospace">当前 θ_t</text>
        </svg>
      </div>
    </div>
  );
}
