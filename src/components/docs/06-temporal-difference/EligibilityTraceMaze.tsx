'use client';

import React, { useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';

// 沿着一条 8 格走廊走向终点的奶酪 (+10)
const CORRIDOR_LEN = 8;

export function EligibilityTraceMaze() {
  const [lambda, setLambda] = useState(0.75);
  const [gamma, setGamma] = useState(0.9);
  const [pos, setPos] = useState(0);
  const [traces, setTraces] = useState<number[]>(() => [1, 0, 0, 0, 0, 0, 0, 0]);
  const [values, setValues] = useState<number[]>(() => Array(CORRIDOR_LEN).fill(0));
  const [lastFlash, setLastFlash] = useState(false);

  const stepForward = () => {
    const alpha = 0.5;
    if (pos >= CORRIDOR_LEN - 1) {
      // 重置回到起点开始下一回合（保留学到的 V，清空迹）
      setPos(0);
      setTraces([1, 0, 0, 0, 0, 0, 0, 0]);
      setLastFlash(false);
      return;
    }

    const nextPos = pos + 1;
    const reachedGoal = nextPos === CORRIDOR_LEN - 1;
    const reward = reachedGoal ? 10 : 0;
    const tdError = reward + (reachedGoal ? 0 : gamma * values[nextPos]) - values[pos];

    // 后向视角 TD(λ)：所有带非零资格迹的历史状态同步按 δ · z(s) 更新！
    const nextV = values.map((v, s) => v + alpha * tdError * traces[s]);
    const nextZ = traces.map((z, s) => {
      const decayed = gamma * lambda * z;
      return s === nextPos ? decayed + 1 : decayed;
    });

    setValues(nextV);
    setTraces(nextZ);
    setPos(nextPos);
    setLastFlash(reachedGoal);
  };

  const resetAll = () => {
    setPos(0);
    setTraces([1, 0, 0, 0, 0, 0, 0, 0]);
    setValues(Array(CORRIDOR_LEN).fill(0));
    setLastFlash(false);
  };

  return (
    <div className="my-6 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm space-y-4 not-prose">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-bold">✨ 荧光资格迹走廊：直观对比 λ = 0（单步 TD）与 λ = 0.8（整条光迹瞬间更新）</div>
          <p className="text-xs text-muted-foreground mt-0.5">
            反复点击「向前走 1 步」直奔右侧 🧀 奶酪 (+10)。先用 <code>λ = 0</code> 走一遍（只有奶酪前 1 格更新！），再调到 <code>λ = 0.85</code> 重置走一遍，亲眼看整条荧光路径一瞬间全部点亮！
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={stepForward}
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-500 text-white px-3.5 py-1.5 text-xs font-semibold hover:bg-indigo-600"
          >
            <Play className="w-3.5 h-3.5" />
            {pos >= CORRIDOR_LEN - 1 ? '下一回合 (保留 V)' : '向前走 1 步 →'}
          </button>
          <button
            type="button"
            onClick={resetAll}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground"
          >
            <RotateCcw className="w-3.5 h-3.5" /> 清零重来
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
        <label className="rounded-lg border border-border bg-background p-2.5 space-y-1">
          <div className="flex justify-between">
            <span>资格迹衰减 λ (0=TD(0), 1=MC)</span>
            <strong className="text-amber-500">{lambda.toFixed(2)}</strong>
          </div>
          <input type="range" min={0} max={1} step={0.05} value={lambda} onChange={(e) => setLambda(Number(e.target.value))} className="w-full accent-amber-500" />
        </label>
        <label className="rounded-lg border border-border bg-background p-2.5 space-y-1">
          <div className="flex justify-between"><span>折扣因子 γ</span><strong className="text-teal-500">{gamma.toFixed(2)}</strong></div>
          <input type="range" min={0.6} max={0.99} step={0.01} value={gamma} onChange={(e) => setGamma(Number(e.target.value))} className="w-full accent-teal-500" />
        </label>
      </div>

      {/* 8 格荧光走廊 */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {Array.from({ length: CORRIDOR_LEN }, (_, s) => {
          const z = traces[s];
          const v = values[s];
          const isHere = s === pos;
          const isGoal = s === CORRIDOR_LEN - 1;
          return (
            <div
              key={s}
              style={{
                backgroundColor: lastFlash && v > 0.05
                  ? `rgba(250, 204, 21, ${Math.min(0.45, 0.12 + z * 0.4)})`
                  : `rgba(99, 102, 241, ${Math.min(0.45, z * 0.45)})`,
              }}
              className={`rounded-xl border p-2.5 text-center transition-all ${
                isHere ? 'border-2 border-amber-400 scale-105' : 'border-border'
              }`}
            >
              <div className="text-lg leading-none">{isHere ? '🐭' : isGoal ? '🧀' : `s${s}`}</div>
              <div className="text-[10px] font-mono text-amber-500 font-bold mt-1.5">z={z.toFixed(2)}</div>
              <div className="text-[11px] font-mono font-bold mt-0.5">V={v.toFixed(2)}</div>
            </div>
          );
        })}
      </div>

      {lastFlash && (
        <div className="rounded-lg bg-amber-500/15 border border-amber-500/40 px-4 py-2 text-xs text-amber-700 dark:text-amber-300">
          ⚡ 吃到奶酪 (+10)！本步 TD 误差 δ 沿着所有非零资格迹 z(s) 一次性完成了信用回传：
          {lambda === 0 ? '因为 λ = 0，只有 s6 一格收到了更新！' : `因为 λ = ${lambda.toFixed(2)}，整条走廊上的历史状态全部同步上涨！`}
        </div>
      )}
    </div>
  );
}
