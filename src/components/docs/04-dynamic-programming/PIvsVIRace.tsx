'use client';

import React, { useMemo, useState } from 'react';
import { ACTION_ARROWS, GridWorld, PRESETS, policyIteration, valueIteration, valueToColor } from '@/lib/rl';

export function PIvsVIRace() {
  const [preset, setPreset] = useState<'simple' | 'classic' | 'maze'>('simple');
  const [gamma, setGamma] = useState(0.92);

  const env = useMemo(() => new GridWorld(PRESETS[preset]()), [preset]);
  const viSnaps = useMemo(() => valueIteration(env, gamma, 1e-4, 120), [env, gamma]);
  const piSnaps = useMemo(() => policyIteration(env, gamma, 30), [env, gamma]);

  const [viIdx, setViIdx] = useState(999);
  const [piIdx, setPiIdx] = useState(999);

  const curVI = viSnaps[Math.min(viSnaps.length - 1, viIdx)];
  const curPI = piSnaps[Math.min(piSnaps.length - 1, piIdx)];
  const piRounds = piSnaps.filter((s) => s.phase === 'improve').length;

  return (
    <div className="my-6 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm space-y-4 not-prose">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-bold">⚔️ 策略迭代 (PI) vs 价值迭代 (VI) 同屏性能对照台</div>
          <p className="text-xs text-muted-foreground mt-0.5">
            切换不同复杂度的地图，拖动各自进度条对比：PI 仅需极少外层策略改进轮次，VI 每轮扫描极轻量！
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'simple', label: '5×5 避障网格' },
            { id: 'classic', label: '4×3 打滑网格' },
            { id: 'maze', label: '6×9 Dyna 迷宫' },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setPreset(p.id as typeof preset);
                setViIdx(999);
                setPiIdx(999);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                preset === p.id ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-border bg-background'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs font-mono">
        <span>折扣 γ = {gamma.toFixed(2)}</span>
        <input type="range" min={0.6} max={0.99} step={0.01} value={gamma} onChange={(e) => setGamma(Number(e.target.value))} className="flex-1 accent-indigo-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 左侧：策略迭代 */}
        <div className="rounded-xl border border-border bg-background p-4 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-teal-500">策略迭代 (Policy Iteration)</span>
            <span className="font-mono text-muted-foreground">共 {piRounds} 轮策略改进即精确收敛</span>
          </div>
          <input
            type="range"
            min={0}
            max={piSnaps.length - 1}
            value={Math.min(piSnaps.length - 1, piIdx)}
            onChange={(e) => setPiIdx(Number(e.target.value))}
            className="w-full accent-teal-500"
          />
          <MiniGrid env={env} V={curPI.V} policy={curPI.policy} />
          <div className="text-[11px] font-mono text-center text-muted-foreground">
            步骤 {Math.min(piSnaps.length - 1, piIdx) + 1}/{piSnaps.length} · 阶段：{curPI.phase === 'evaluate' ? '完整策略评估 E' : '贪心策略改进 I'}
          </div>
        </div>

        {/* 右侧：价值迭代 */}
        <div className="rounded-xl border border-border bg-background p-4 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-indigo-500">价值迭代 (Value Iteration)</span>
            <span className="font-mono text-muted-foreground">共 {viSnaps.length - 1} 次单步最优扫描收敛</span>
          </div>
          <input
            type="range"
            min={0}
            max={viSnaps.length - 1}
            value={Math.min(viSnaps.length - 1, viIdx)}
            onChange={(e) => setViIdx(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
          <MiniGrid env={env} V={curVI.V} policy={curVI.policy} />
          <div className="text-[11px] font-mono text-center text-muted-foreground">
            扫描 k = {Math.min(viSnaps.length - 1, viIdx)}/{viSnaps.length - 1} · Δ = {Number.isFinite(curVI.delta) ? curVI.delta.toFixed(4) : '∞'}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniGrid({ env, V, policy }: { env: GridWorld; V: number[]; policy: number[] }) {
  const compact = env.spec.cols > 6;
  return (
    <div className="flex justify-center overflow-x-auto py-1">
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${env.spec.cols}, ${compact ? '34px' : '48px'})` }}
      >
        {Array.from({ length: env.nS }, (_, s) => {
          const t = env.cell(s);
          if (t === 'wall') {
            return <div key={s} className={`${compact ? 'h-8 text-[9px]' : 'h-12 text-[10px]'} rounded bg-zinc-800 text-zinc-500 flex items-center justify-center`}>#</div>;
          }
          return (
            <div
              key={s}
              style={{ backgroundColor: valueToColor(V[s], 1, 0.72) }}
              className={`${compact ? 'h-8' : 'h-12'} rounded border border-border flex flex-col items-center justify-center leading-none`}
            >
              <span className={compact ? 'text-[11px] font-bold' : 'text-xs font-extrabold'}>
                {t === 'goal' ? '★' : t === 'pit' ? '☠' : ACTION_ARROWS[policy[s]]}
              </span>
              {!compact && <span className="text-[10px] font-mono mt-0.5">{V[s].toFixed(2)}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
