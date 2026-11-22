'use client';

import React, { useState } from 'react';

export function DuelingCarViz() {
  const [scene, setScene] = useState<'straight' | 'obstacle'>('straight');
  const [vVal, setVVal] = useState(8.0);
  const [adv, setAdv] = useState<[number, number, number]>([0.1, 0.2, -0.1]);

  const applyPreset = (s: 'straight' | 'obstacle') => {
    setScene(s);
    if (s === 'straight') {
      setVVal(8.5);
      setAdv([0.1, 0.2, 0.0]);
    } else {
      setVVal(2.0);
      setAdv([+3.2, -6.5, +2.8]);
    }
  };

  const meanA = (adv[0] + adv[1] + adv[2]) / 3;
  const qVals = adv.map((a) => vVal + (a - meanA));
  const labels = ['⬅ 向左变道', '⬆ 保持直行', '➡ 向右变道'];

  return (
    <div className="my-6 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm space-y-4 not-prose">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-bold">🔀 Dueling DQN 解耦解剖：Q(s,a) = V(s) + (A(s,a) - mean A)</div>
          <p className="text-xs text-muted-foreground mt-0.5">
            切换两种驾驶路况，感受为什么把「路面本身有多安全 V(s)」和「往哪打方向盘更好 A(s,a)」拆开两条流学得快得多！
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => applyPreset('straight')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
              scene === 'straight' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-border bg-background'
            }`}
          >
            🛣️ 空旷直道（动作差异极小）
          </button>
          <button
            type="button"
            onClick={() => applyPreset('obstacle')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
              scene === 'obstacle' ? 'border-rose-500 bg-rose-500 text-white' : 'border-border bg-background'
            }`}
          >
            🚨 正前方来车（必须紧急变道！）
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background p-4 space-y-3 text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="w-36 font-bold text-purple-500">状态价值流 V(s) = {vVal.toFixed(1)}</span>
          <input type="range" min={-5} max={12} step={0.5} value={vVal} onChange={(e) => setVVal(Number(e.target.value))} className="flex-1 accent-purple-500" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {labels.map((lb, i) => (
            <div key={lb} className="rounded-xl border border-border bg-card p-3 space-y-2">
              <div className="font-bold text-foreground">{lb}</div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>原始 A(s,a)</span>
                <strong>{adv[i] >= 0 ? `+${adv[i].toFixed(1)}` : adv[i].toFixed(1)}</strong>
              </div>
              <input
                type="range"
                min={-8}
                max={6}
                step={0.2}
                value={adv[i]}
                onChange={(e) =>
                  setAdv((prev) => prev.map((x, idx) => (idx === i ? Number(e.target.value) : x)) as [number, number, number])
                }
                className="w-full accent-indigo-500"
              />
              <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-1.5 text-center font-extrabold text-indigo-500">
                合成 Q = {qVals[i].toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        <div className="text-[11px] text-muted-foreground pt-1">
          减去均值 mean(A) = {meanA.toFixed(2)} 强制满足 Σ(A - mean A) = 0，解决了「V+10、A-10 得出相同 Q」的不可辨识性问题！
        </div>
      </div>
    </div>
  );
}
