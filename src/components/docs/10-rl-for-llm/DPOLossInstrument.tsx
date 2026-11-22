'use client';

import React, { useState } from 'react';
import { Gauge } from 'lucide-react';

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function DPOLossInstrument() {
  const [logRatioW, setLogRatioW] = useState(0.8);
  const [logRatioL, setLogRatioL] = useState(-0.6);
  const [beta, setBeta] = useState(0.15);

  const rHatW = beta * logRatioW;
  const rHatL = beta * logRatioL;
  const margin = rHatW - rHatL; // u = β log(π_w/ref_w) - β log(π_l/ref_l)
  const dpoLoss = -Math.log(Math.max(1e-9, sigmoid(margin)));
  const gradWeight = sigmoid(-margin); // σ(r_l - r_w)

  const us = Array.from({ length: 121 }, (_, i) => -4 + (i / 120) * 8);
  const toX = (u: number) => 38 + ((u + 4) / 8) * 510;
  const toLossY = (val: number) => 152 - (Math.min(4.2, val) / 4.2) * 126;
  const toWeightY = (w: number) => 152 - w * 126;

  const lossPts = us.map((u) => `${toX(u)},${toLossY(-Math.log(Math.max(1e-9, sigmoid(u))))}`).join(' ');
  const weightPts = us.map((u) => `${toX(u)},${toWeightY(sigmoid(-u))}`).join(' ');

  const clampedMargin = Math.max(-4, Math.min(4, margin));

  return (
    <div className="my-6 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm space-y-4 not-prose">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-bold flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-purple-500" />
            DPO 隐式奖励与动态错题加权仪表盘
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            配分函数 <code>Z(x)</code> 在相减时完美抵消！拖动好/差回答的对数概率比，观察 DPO 如何自动给“答反的样本”施加接近 100% 的纠错梯度权重。
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          <button
            type="button"
            onClick={() => {
              setLogRatioW(-2.5);
              setLogRatioL(2.8);
              setBeta(0.25);
            }}
            className="px-2 py-1 rounded-md border border-rose-500/40 bg-rose-500/10 text-rose-500 font-semibold"
          >
            严重答反
          </button>
          <button
            type="button"
            onClick={() => {
              setLogRatioW(0);
              setLogRatioL(0);
              setBeta(0.15);
            }}
            className="px-2 py-1 rounded-md border border-border bg-muted/50"
          >
            刚起步 (u=0)
          </button>
          <button
            type="button"
            onClick={() => {
              setLogRatioW(3.0);
              setLogRatioL(-2.8);
              setBeta(0.35);
            }}
            className="px-2 py-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 text-emerald-500 font-semibold"
          >
            已充分拉开
          </button>
        </div>
      </div>

      {/* 三滑块控制 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
        <label className="rounded-xl border border-border bg-background p-3 space-y-1">
          <div className="flex justify-between">
            <span>log π(y_w)/π_ref(y_w)</span>
            <strong className="text-emerald-500">{logRatioW.toFixed(2)}</strong>
          </div>
          <input
            type="range"
            min={-4}
            max={4}
            step={0.1}
            value={logRatioW}
            onChange={(e) => setLogRatioW(Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
          <div className="text-[10px] text-muted-foreground">隐式好奖励 r̂_w = {rHatW.toFixed(3)}</div>
        </label>

        <label className="rounded-xl border border-border bg-background p-3 space-y-1">
          <div className="flex justify-between">
            <span>log π(y_l)/π_ref(y_l)</span>
            <strong className="text-rose-500">{logRatioL.toFixed(2)}</strong>
          </div>
          <input
            type="range"
            min={-4}
            max={4}
            step={0.1}
            value={logRatioL}
            onChange={(e) => setLogRatioL(Number(e.target.value))}
            className="w-full accent-rose-500"
          />
          <div className="text-[10px] text-muted-foreground">隐式差奖励 r̂_l = {rHatL.toFixed(3)}</div>
        </label>

        <label className="rounded-xl border border-border bg-background p-3 space-y-1">
          <div className="flex justify-between">
            <span>KL 温度系数 β</span>
            <strong className="text-amber-500">{beta.toFixed(2)}</strong>
          </div>
          <input
            type="range"
            min={0.05}
            max={0.5}
            step={0.01}
            value={beta}
            onChange={(e) => setBeta(Number(e.target.value))}
            className="w-full accent-amber-500"
          />
          <div className="text-[10px] text-muted-foreground">常见取值：0.1 ~ 0.5</div>
        </label>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center font-mono">
        <div className="rounded-xl border border-border bg-background p-3">
          <div className="text-[10px] text-muted-foreground">隐式奖励差 Margin u = r̂_w - r̂_l</div>
          <div className={`text-xl font-extrabold mt-0.5 ${margin >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {margin >= 0 ? '+' : ''}
            {margin.toFixed(3)}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-background p-3">
          <div className="text-[10px] text-muted-foreground">DPO 损失 -log σ(u)</div>
          <div className="text-xl font-extrabold text-indigo-500 mt-0.5">{dpoLoss.toFixed(3)}</div>
        </div>
        <div className="rounded-xl border border-purple-500/40 bg-purple-500/10 p-3">
          <div className="text-[10px] text-purple-400">动态梯度权重 σ(-u) = σ(r̂_l - r̂_w)</div>
          <div className="text-xl font-extrabold text-purple-400 mt-0.5">{(gradWeight * 100).toFixed(1)}%</div>
        </div>
      </div>

      {/* SVG 损失曲线 + 梯度权重曲线 */}
      <div className="rounded-xl border border-border bg-zinc-950 p-3">
        <svg viewBox="0 0 580 176" className="w-full h-44">
          <rect x={38} y={26} width={toX(0) - 38} height={126} fill="rgba(244,63,94,0.10)" />
          <line x1={38} y1={152} x2={548} y2={152} stroke="#475569" strokeWidth={1.5} />
          <line x1={toX(0)} y1={22} x2={toX(0)} y2={152} stroke="#64748b" strokeDasharray="4 4" />

          <polyline fill="none" stroke="#818cf8" strokeWidth={2.5} points={lossPts} />
          <polyline fill="none" stroke="#c084fc" strokeWidth={2.5} strokeDasharray="6 3" points={weightPts} />

          {/* 当前 Margin 标线 */}
          <line x1={toX(clampedMargin)} y1={24} x2={toX(clampedMargin)} y2={152} stroke="#facc15" strokeWidth={1.5} />
          <circle cx={toX(clampedMargin)} cy={toLossY(dpoLoss)} r={5} fill="#818cf8" stroke="#fff" strokeWidth={1.5} />
          <circle cx={toX(clampedMargin)} cy={toWeightY(gradWeight)} r={5} fill="#c084fc" stroke="#fff" strokeWidth={1.5} />

          <text x={46} y={20} fill="#818cf8" fontSize={10.5} fontFamily="monospace">
            ━━ DPO Loss -log σ(u)
          </text>
          <text x={215} y={20} fill="#c084fc" fontSize={10.5} fontFamily="monospace">
            --- 动态错题梯度权重 σ(-u)
          </text>
          <text x={46} y={144} fill="#fb7185" fontSize={9.5} fontFamily="monospace">
            ← 错题区 (u &lt; 0)：强力放大梯度！
          </text>
          <text x={toX(0) + 12} y={144} fill="#34d399" fontSize={9.5} fontFamily="monospace">
            正确区 (u &gt; 0)：梯度温柔衰减 →
          </text>
          <text x={toX(0)} y={168} textAnchor="middle" fill="#94a3b8" fontSize={10} fontFamily="monospace">
            u = 0（好坏打平）
          </text>
        </svg>
      </div>
    </div>
  );
}
