'use client';

import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { softmax } from '@/lib/rl';

export function SoftmaxGradientLab() {
  const [H, setH] = useState([0.8, 0.2, -0.4, 0.0]);
  const [tau, setTau] = useState(1.0);
  const [useBaseline, setUseBaseline] = useState(true);
  const [avgR, setAvgR] = useState(4.0);
  const [sampleR, setSampleR] = useState(5.2);
  const [chosenArm, setChosenArm] = useState(0);
  const [lastDelta, setLastDelta] = useState<number[] | null>(null);

  const pi = softmax(H, tau);

  const applyStep = () => {
    const alpha = 0.25;
    const base = useBaseline ? avgR : 0;
    const deltas = H.map((_, i) => alpha * (sampleR - base) * ((i === chosenArm ? 1 : 0) - pi[i]));
    setH((prev) => prev.map((v, i) => Number((v + deltas[i]).toFixed(3))));
    setAvgR((r) => Number((0.8 * r + 0.2 * sampleR).toFixed(2)));
    setLastDelta(deltas);
  };

  return (
    <div className="my-6 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm space-y-4 not-prose">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-bold">🌡️ 梯度老虎机 (Softmax 偏好更新与基线效应)</div>
          <p className="text-xs text-muted-foreground mt-0.5">
            把奖励整体平移到 <code>R = +4.0</code> 附近，分别勾选和取消「基线 R̄」执行更新，感受没有基线时为何所有选中动作都会被盲目推高！
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setH([0.8, 0.2, -0.4, 0.0]);
            setAvgR(4.0);
            setLastDelta(null);
          }}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="w-3.5 h-3.5" /> 重置
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
        <label className="rounded-lg border border-border bg-background p-2.5 space-y-1">
          <div className="flex justify-between">
            <span>温度 τ</span>
            <strong>{tau.toFixed(2)}</strong>
          </div>
          <input type="range" min={0.2} max={3} step={0.1} value={tau} onChange={(e) => setTau(Number(e.target.value))} className="w-full accent-indigo-500" />
        </label>
        <label className="rounded-lg border border-border bg-background p-2.5 space-y-1">
          <div className="flex justify-between">
            <span>本次实得奖励 R_t</span>
            <strong className="text-amber-500">{sampleR.toFixed(1)}</strong>
          </div>
          <input type="range" min={1} max={8} step={0.2} value={sampleR} onChange={(e) => setSampleR(Number(e.target.value))} className="w-full accent-amber-500" />
        </label>
        <div className="rounded-lg border border-border bg-background p-2.5 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={useBaseline} onChange={(e) => setUseBaseline(e.target.checked)} className="accent-indigo-500" />
            <span>启用基线 R̄={avgR.toFixed(1)}</span>
          </label>
          <button
            type="button"
            onClick={applyStep}
            className="rounded-lg bg-indigo-500 text-white px-3 py-1.5 font-semibold hover:bg-indigo-600"
          >
            更新一步
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {H.map((val, i) => (
          <div
            key={i}
            onClick={() => setChosenArm(i)}
            className={`cursor-pointer rounded-xl border p-3.5 space-y-2 transition-all ${
              chosenArm === i ? 'border-indigo-500 bg-indigo-500/10' : 'border-border bg-background hover:bg-muted/40'
            }`}
          >
            <div className="flex justify-between text-xs font-mono">
              <span className="font-bold">动作 a_{i + 1} {chosenArm === i ? '✓选中' : ''}</span>
              <span className="text-indigo-500 font-bold">{(pi[i] * 100).toFixed(1)}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <div style={{ width: `${(pi[i] * 100).toFixed(1)}%` }} className="h-full bg-indigo-500 transition-all" />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
              <span>H = {val.toFixed(2)}</span>
              {lastDelta && (
                <span className={lastDelta[i] >= 0 ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                  Δ={lastDelta[i] >= 0 ? `+${lastDelta[i].toFixed(2)}` : lastDelta[i].toFixed(2)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
