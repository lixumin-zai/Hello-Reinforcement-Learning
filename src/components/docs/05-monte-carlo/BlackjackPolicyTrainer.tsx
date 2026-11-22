'use client';

import React, { useMemo, useState } from 'react';
import { trainBlackjackMC } from '@/lib/rl';

export function BlackjackPolicyTrainer() {
  const [episodes, setEpisodes] = useState(20000);
  const [usableAce, setUsableAce] = useState(false);

  const result = useMemo(() => trainBlackjackMC(episodes, 77), [episodes]);
  const grid = usableAce ? result.withAce : result.noAce;
  const vals = usableAce ? result.vWithAce : result.vNoAce;

  return (
    <div className="my-6 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm space-y-4 not-prose">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-bold">🔥 21 点 Monte Carlo Control 实时策略演化热力图（复现 Sutton &amp; Barto 图 5.2）</div>
          <p className="text-xs text-muted-foreground mt-0.5">
            点击不同训练局数，亲眼看着 10×10 决策表从杂乱噪声逐渐收敛出赌场职业玩家的最优「要牌 / 停牌」阶梯边界！
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[500, 3000, 20000, 60000].map((ep) => (
            <button
              key={ep}
              type="button"
              onClick={() => setEpisodes(ep)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold border ${
                episodes === ep ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-border bg-background hover:bg-muted'
              }`}
            >
              {ep.toLocaleString()} 局
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setUsableAce(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
              !usableAce ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-border bg-background'
            }`}
          >
            无可用 A (Hard Hand)
          </button>
          <button
            type="button"
            onClick={() => setUsableAce(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
              usableAce ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-border bg-background'
            }`}
          >
            有可用 A (Soft Hand / 软点数)
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-amber-500/80 inline-block" /> HIT (要牌)
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-emerald-500/80 inline-block" /> STICK (停牌)
          </span>
        </div>
      </div>

      {/* 10x10 策略矩阵（玩家点数 21 ↓ 12 × 庄家明牌 A, 2..10） */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[540px] border-collapse text-center font-mono text-[11px]">
          <thead>
            <tr>
              <th className="p-1.5 text-muted-foreground">玩家\庄家</th>
              {['A', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map((d) => (
                <th key={d} className="p-1.5 font-bold text-foreground">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }, (_, ri) => {
              const pSum = 21 - ri; // 自顶向下 21 -> 12
              const rowIdx = pSum - 12;
              return (
                <tr key={pSum}>
                  <td className="p-1.5 font-bold text-foreground">{pSum}</td>
                  {grid[rowIdx].map((act, ci) => {
                    const isStick = act === 'stick';
                    const v = vals[rowIdx][ci];
                    return (
                      <td key={ci} className="p-0.5">
                        <div
                          title={`玩家=${pSum}, 庄家明牌=${ci === 0 ? 'A' : ci + 1} → ${act.toUpperCase()} (V=${v.toFixed(2)})`}
                          className={`rounded-md py-1.5 font-bold border ${
                            isStick
                              ? 'bg-emerald-500/25 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                              : 'bg-amber-500/25 border-amber-500/40 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {isStick ? 'S' : 'H'}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        💡 观察「无可用 A」的经典规律：当庄家明牌是 2–6（庄家爆牌风险高）时，玩家在 12–16 点就果断停牌 (S)；当庄家明牌是 7–A 时，玩家必须冒险要牌 (H) 直到至少 17 点！
      </p>
    </div>
  );
}
