'use client';

import React, { useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';

const STEPS = [
  { s: 's₀ (起点)', a: '向右 →', r: -0.04, sNext: 's₁ (走廊)', note: '迈出第一步，消耗少量步数能量 (-0.04)' },
  { s: 's₁ (走廊)', a: '向右 →', r: -0.04, sNext: 's₂ (岔路口)', note: '继续向目标靠近，尚未获得终点大奖' },
  { s: 's₂ (岔路口)', a: '向下 ↓', r: -1.0, sNext: 's_pit (陷阱)', note: '误入陷阱格，收到负向惩罚 (-1.00)，回合重置' },
  { s: 's₂ (岔路口)', a: '向上 ↑', r: +1.0, sNext: 's_goal (宝藏)', note: '吸取教训改走上方，抵达终点获得 +1.00 奖励！' },
];

export function AgentEnvLoop() {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<'observe' | 'act' | 'reward'>('observe');

  const cur = STEPS[idx];

  const advance = () => {
    if (phase === 'observe') setPhase('act');
    else if (phase === 'act') setPhase('reward');
    else {
      setPhase('observe');
      setIdx((i) => (i + 1) % STEPS.length);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 my-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <p className="text-sm text-muted-foreground">
          ▶ 点击「单步推进」，观察智能体与环境之间 <code>S_t → A_t → (R_&#123;t+1&#125;, S_&#123;t+1&#125;)</code> 的信号传递
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={advance}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3.5 py-1.5 text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <Play className="w-3.5 h-3.5" />
            单步推进 ({phase === 'observe' ? '1. 感知状态' : phase === 'act' ? '2. 执行动作' : '3. 接收奖励'})
          </button>
          <button
            type="button"
            onClick={() => {
              setIdx(0);
              setPhase('observe');
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            重置
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center my-4">
        {/* Agent */}
        <div
          className={`rounded-xl border p-4 transition-all ${
            phase === 'act' ? 'border-indigo-500 bg-indigo-500/10 shadow-md' : 'border-border bg-background'
          }`}
        >
          <div className="text-xs font-mono text-indigo-500 font-bold mb-1">AGENT · 智能体</div>
          <div className="text-base font-bold mb-2">策略 π(a | s)</div>
          <div className="text-xs text-muted-foreground">
            当前感知：<span className="font-mono text-foreground font-semibold">{cur.s}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            输出动作：<span className="font-mono text-indigo-500 font-semibold">{cur.a}</span>
          </div>
        </div>

        {/* Signal bridge */}
        <div className="flex flex-col items-center justify-center gap-2 py-2">
          <div
            className={`w-full rounded-lg border px-3 py-2 text-center text-xs font-mono transition-all ${
              phase === 'act'
                ? 'border-indigo-500 bg-indigo-500/15 text-indigo-400 font-bold'
                : 'border-border bg-muted/40 text-muted-foreground'
            }`}
          >
            动作 A_t = {cur.a} ⟶
          </div>
          <div
            className={`w-full rounded-lg border px-3 py-2 text-center text-xs font-mono transition-all ${
              phase === 'observe'
                ? 'border-teal-500 bg-teal-500/15 text-teal-400 font-bold'
                : 'border-border bg-muted/40 text-muted-foreground'
            }`}
          >
            ⟵ 状态 S_t = {cur.s}
          </div>
          <div
            className={`w-full rounded-lg border px-3 py-2 text-center text-xs font-mono transition-all ${
              phase === 'reward'
                ? 'border-amber-500 bg-amber-500/15 text-amber-400 font-bold'
                : 'border-border bg-muted/40 text-muted-foreground'
            }`}
          >
            ⟵ 奖励 R_&#123;t+1&#125; = {cur.r > 0 ? `+${cur.r.toFixed(2)}` : cur.r.toFixed(2)}
          </div>
        </div>

        {/* Environment */}
        <div
          className={`rounded-xl border p-4 transition-all ${
            phase === 'reward' ? 'border-teal-500 bg-teal-500/10 shadow-md' : 'border-border bg-background'
          }`}
        >
          <div className="text-xs font-mono text-teal-500 font-bold mb-1">ENVIRONMENT · 环境</div>
          <div className="text-base font-bold mb-2">动力学 p(s′, r | s, a)</div>
          <div className="text-xs text-muted-foreground">
            下一状态：<span className="font-mono text-foreground font-semibold">{cur.sNext}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            即时奖励：
            <span className={`font-mono font-bold ${cur.r >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {' '}
              {cur.r > 0 ? `+${cur.r.toFixed(2)}` : cur.r.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-muted/60 px-4 py-2.5 text-xs text-muted-foreground flex items-center justify-between">
        <span>💡 {cur.note}</span>
        <span className="font-mono">样本 #{idx + 1}/{STEPS.length}</span>
      </div>
    </div>
  );
}
