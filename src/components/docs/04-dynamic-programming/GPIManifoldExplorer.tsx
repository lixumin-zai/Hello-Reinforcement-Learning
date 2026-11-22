'use client';

import React, { useState } from 'react';

type Mode = 'pi' | 'vi' | 'td';

// 在 (x, y) 画布坐标里定义两条收敛流形：交汇于 (500, 145)
// 上线 V = v_π: y_top(x) = 45 + ((x - 70) / 430) * 100
// 下线 π = greedy(V): y_bot(x) = 250 - ((x - 70) / 430) * 105
const TRAJECTORIES: Record<Mode, { title: string; desc: string; color: string; pts: [number, number][] }> = {
  pi: {
    title: '策略迭代 (PI)：彻底评估 → 一步贪心',
    desc: '每次评估都严格走到上方 V = v_π 流形上（垂直向上），再跳到下方 π = greedy(V) 流形，步幅最大、轮次极少。',
    color: '#2dd4bf',
    pts: [
      [85, 246],
      [145, 62],
      [230, 211],
      [310, 101],
      [395, 170],
      [455, 134],
      [500, 145],
    ],
  },
  vi: {
    title: '价值迭代 (VI)：截断 1 步评估 → 立刻贪心',
    desc: '不等价值收敛到蓝线，只朝 V = v_π 走一小截，就立刻转向改进策略，走出细密的小锯齿直奔交点！',
    color: '#818cf8',
    pts: [
      [85, 246],
      [115, 195],
      [150, 230],
      [190, 175],
      [235, 209],
      [280, 160],
      [330, 186],
      [380, 148],
      [430, 162],
      [472, 143],
      [500, 145],
    ],
  },
  td: {
    title: '在线 TD / Actor-Critic：微幅随机同步演进',
    desc: '在每个样本上同时做微小的 Critic 评估更新与 Actor 策略梯度更新，带轻微采样抖动沿着中轴逼近最优不动点。',
    color: '#f59e0b',
    pts: [
      [85, 246],
      [128, 208],
      [165, 218],
      [212, 182],
      [255, 192],
      [308, 166],
      [352, 171],
      [402, 152],
      [448, 155],
      [482, 146],
      [500, 145],
    ],
  },
};

export function GPIManifoldExplorer() {
  const [mode, setMode] = useState<Mode>('pi');
  const [step, setStep] = useState(6);

  const tr = TRAJECTORIES[mode];
  const maxStep = tr.pts.length - 1;
  const curStep = Math.min(maxStep, step);
  const visiblePts = tr.pts.slice(0, curStep + 1);

  return (
    <div className="my-6 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm space-y-4 not-prose">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-bold">📐 广义策略迭代 (GPI) 几何流形图：对比三类算法的收敛步态</div>
          <p className="text-xs text-muted-foreground mt-0.5">
            切换不同算法模式并拖动步进滑块，观察评估与改进两股力量如何把状态点拉向交点 <code>(v*, π*)</code>！
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(['pi', 'vi', 'td'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setStep(TRAJECTORIES[m].pts.length - 1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                mode === m ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-border bg-background hover:bg-muted'
              }`}
            >
              {m === 'pi' ? '策略迭代 PI' : m === 'vi' ? '价值迭代 VI' : '在线 TD / Actor-Critic'}
            </button>
          ))}
        </div>
      </div>

      {/* 真实 SVG 双流形几何图 */}
      <div className="rounded-xl border border-border bg-zinc-950 p-3">
        <svg viewBox="0 0 580 285" className="w-full h-64">
          {/* 评估流形 V = v_π */}
          <line x1={60} y1={42} x2={520} y2={150} stroke="#2dd4bf" strokeWidth={3} />
          <text x={82} y={32} fill="#5eead4" fontSize={13} fontWeight={700}>
            策略评估流形：V = v_π
          </text>

          {/* 改进流形 π = greedy(V) */}
          <line x1={60} y1={252} x2={520} y2={140} stroke="#a855f7" strokeWidth={3} />
          <text x={82} y={272} fill="#d8b4fe" fontSize={13} fontWeight={700}>
            策略改进流形：π = greedy(V)
          </text>

          {/* 锯齿收敛折线 */}
          <polyline
            fill="none"
            stroke={tr.color}
            strokeWidth={3}
            strokeLinejoin="round"
            points={visiblePts.map((p) => p.join(',')).join(' ')}
          />
          {visiblePts.map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={i === curStep ? 7 : 4}
              fill={i === curStep ? '#fde047' : tr.color}
              stroke="#090d16"
              strokeWidth={1.5}
            />
          ))}

          {/* 最优不动点交汇星标 */}
          <g transform="translate(500, 145)">
            <circle r={11} fill="rgba(250,204,21,0.22)" stroke="#facc15" strokeWidth={2.5} />
            <text x={0} y={-18} textAnchor="middle" fill="#fde047" fontSize={13} fontWeight={800}>
              ★ (v*, π*)
            </text>
          </g>
        </svg>
      </div>

      <div className="flex items-center gap-3 text-xs font-mono">
        <span>推进步数：{curStep} / {maxStep}</span>
        <input
          type="range"
          min={0}
          max={maxStep}
          value={curStep}
          onChange={(e) => setStep(Number(e.target.value))}
          className="flex-1 accent-indigo-500"
        />
      </div>

      <div className="rounded-xl bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground leading-relaxed">
        <strong className="text-foreground">{tr.title}：</strong>
        {tr.desc}
      </div>
    </div>
  );
}
