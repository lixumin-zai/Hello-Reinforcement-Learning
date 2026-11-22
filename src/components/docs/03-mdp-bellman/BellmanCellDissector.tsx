'use client';

import React, { useMemo, useState } from 'react';
import { ACTION_ARROWS, ACTION_NAMES, GridWorld, PRESETS, qFromV, valueIteration, valueToColor } from '@/lib/rl';

export function BellmanCellDissector() {
  const [selected, setSelected] = useState(5); // 默认聚焦一个有意思的中间格
  const [mode, setMode] = useState<'optimality' | 'expectation'>('optimality');
  const [gamma, setGamma] = useState(0.9);
  const [hoveredAct, setHoveredAct] = useState<number | null>(null);

  const env = useMemo(() => new GridWorld(PRESETS.classic()), []);
  const converged = useMemo(() => {
    const snaps = valueIteration(env, gamma, 1e-4, 60);
    return snaps[snaps.length - 1];
  }, [env, gamma]);

  const V = converged.V;
  const qVals = useMemo(() => qFromV(env, V, selected, gamma), [env, V, selected, gamma]);
  const bestAct = qVals.indexOf(Math.max(...qVals));
  const vExpect = qVals.reduce((a, b) => a + 0.25 * b, 0);
  const vStar = Math.max(...qVals);

  return (
    <div className="my-6 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm space-y-4 not-prose">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-bold">🔍 交互式 Bellman 单格解剖器（4×3 随机打滑世界, slip = 0.2）</div>
          <p className="text-xs text-muted-foreground mt-0.5">
            点击左侧任意网格状态 <code>s</code>，右侧实时展开该格子的完整两层 Bellman 备份树与精确代入算式！
          </p>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setMode('optimality')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
              mode === 'optimality' ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-border bg-background'
            }`}
          >
            Bellman 最优 (max_a)
          </button>
          <button
            type="button"
            onClick={() => setMode('expectation')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
              mode === 'expectation' ? 'border-teal-500 bg-teal-500 text-white' : 'border-border bg-background'
            }`}
          >
            Bellman 期望 (均匀 π=0.25)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* 左侧：可点击的 4x3 网格 */}
        <div className="lg:col-span-5 flex flex-col items-center gap-3">
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: env.nS }, (_, s) => {
              const t = env.cell(s);
              const isSel = s === selected;
              if (t === 'wall') {
                return (
                  <div key={s} className="w-16 h-16 rounded-xl bg-zinc-800 text-zinc-500 flex items-center justify-center text-xs font-bold">
                    WALL
                  </div>
                );
              }
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelected(s)}
                  style={{ backgroundColor: valueToColor(V[s], 1, 0.72) }}
                  className={`w-16 h-16 rounded-xl border flex flex-col items-center justify-center transition-all ${
                    isSel ? 'ring-2 ring-amber-400 border-amber-400 scale-105 shadow-md' : 'border-border hover:scale-102'
                  }`}
                >
                  <span className="text-[10px] font-mono opacity-75">s_{s}</span>
                  <span className="text-sm font-extrabold leading-none my-0.5">
                    {t === 'goal' ? '★ +1' : t === 'pit' ? '☠ -1' : ACTION_ARROWS[converged.policy[s]]}
                  </span>
                  <span className="text-[11px] font-mono">{V[s].toFixed(2)}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono w-full max-w-[272px]">
            <span>γ = {gamma.toFixed(2)}</span>
            <input
              type="range"
              min={0.5}
              max={0.99}
              step={0.01}
              value={gamma}
              onChange={(e) => setGamma(Number(e.target.value))}
              className="flex-1 accent-indigo-500"
            />
          </div>
        </div>

        {/* 右侧：选中格子的 4 动作两层备份树解剖 */}
        <div className="lg:col-span-7 rounded-xl border border-border bg-background p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
            <span className="font-bold text-sm">
              解剖状态 <code className="text-amber-500">s_{selected}</code> ({env.isTerminal(selected) ? '终止状态' : `坐标 r=${env.rc(selected)[0]}, c=${env.rc(selected)[1]}`})
            </span>
            <span className="font-mono text-xs font-bold text-indigo-500">
              {mode === 'optimality'
                ? `v*(s_${selected}) = max q = ${vStar.toFixed(3)}`
                : `v_π(s_${selected}) = Σ 0.25·q = ${vExpect.toFixed(3)}`}
            </span>
          </div>

          {env.isTerminal(selected) ? (
            <div className="text-xs text-muted-foreground py-6 text-center">
              终止状态的后续价值定义为 0（进入该格瞬间已结算终局奖励）。请点击其他非终止格查看两层备份展开！
            </div>
          ) : (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((a) => {
                const trans = env.transitions(selected, a);
                const isBest = a === bestAct;
                const active = hoveredAct === a || (hoveredAct === null && isBest && mode === 'optimality');
                return (
                  <div
                    key={a}
                    onMouseEnter={() => setHoveredAct(a)}
                    onMouseLeave={() => setHoveredAct(null)}
                    className={`rounded-lg border p-2.5 text-xs transition-all ${
                      active ? 'border-indigo-500 bg-indigo-500/10' : 'border-border bg-card/60'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono mb-1">
                      <span className="font-bold">
                        动作 {ACTION_ARROWS[a]} ({ACTION_NAMES[a]}) {isBest ? '★ 最优分支' : ''}
                      </span>
                      <span className="font-extrabold text-indigo-500">q(s_{selected}, {ACTION_ARROWS[a]}) = {qVals[a].toFixed(3)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 font-mono text-[11px] text-muted-foreground">
                      {trans.map((tr, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-muted/70">
                          p={tr.prob.toFixed(1)} → s_{tr.next}[r={tr.reward.toFixed(2)} + {gamma}×{(tr.done ? 0 : V[tr.next]).toFixed(2)}]
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
