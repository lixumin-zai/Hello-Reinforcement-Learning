'use client';

import React, { useMemo, useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import {
  GridWorld,
  PRESETS,
  policyEvaluation,
  uniformPolicy,
  valueToColor,
  type CellType,
} from '@/lib/rl';

const BRUSHES: { type: CellType; label: string; icon: string }[] = [
  { type: 'wall', label: '画墙壁', icon: '🧱' },
  { type: 'goal', label: '放宝藏 (+1)', icon: '★' },
  { type: 'pit', label: '放陷阱 (-1)', icon: '☠' },
  { type: 'empty', label: '橡皮擦', icon: '⬜' },
];

export function GridPaintDPLab() {
  const [cells, setCells] = useState<CellType[]>(() => PRESETS.simple().cells.slice());
  const [brush, setBrush] = useState<CellType>('wall');
  const [slip, setSlip] = useState(0);
  const [gamma, setGamma] = useState(0.9);
  const [iter, setIter] = useState(12);

  const env = useMemo(
    () =>
      new GridWorld({
        rows: 5,
        cols: 5,
        cells,
        goalReward: 1,
        pitReward: -1,
        stepReward: -0.04,
        slip,
      }),
    [cells, slip],
  );

  const history = useMemo(() => policyEvaluation(env, uniformPolicy(env), gamma, 1e-4, 80), [env, gamma]);
  const k = Math.min(history.length - 1, iter);
  const snap = history[k];
  const deltas = history.slice(1).map((h) => h.delta);
  const maxD = Math.max(0.1, ...deltas);

  const paintCell = (idx: number) => {
    setCells((prev) => prev.map((c, i) => (i === idx ? brush : c)));
  };

  return (
    <div className="my-6 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm space-y-4 not-prose">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-bold">🗺️ 可绘制地图的 DP 策略评估显微镜（均匀随机策略 π=0.25）</div>
          <p className="text-xs text-muted-foreground mt-0.5">
            选好画笔后<strong>点击左侧网格自由改造地形</strong>（加墙/加宝藏/加陷阱/开冰面打滑），再拖动扫描轮次 <code>k</code> 观察价值扩散与 Δ_k 指数收敛！
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setCells(PRESETS.simple().cells.slice());
            setSlip(0);
            setIter(12);
          }}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="w-3.5 h-3.5" /> 恢复默认地图
        </button>
      </div>

      {/* 画笔工具栏 + 冰面开关 */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/40 p-2.5">
        <div className="flex flex-wrap gap-1.5">
          {BRUSHES.map((b) => (
            <button
              key={b.type}
              type="button"
              onClick={() => setBrush(b.type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                brush === b.type
                  ? 'border-teal-500 bg-teal-500 text-white'
                  : 'border-border bg-background hover:bg-muted'
              }`}
            >
              {b.icon} {b.label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-xs font-mono px-2">
          <input
            type="checkbox"
            checked={slip > 0}
            onChange={(e) => setSlip(e.target.checked ? 0.2 : 0)}
            className="accent-teal-500"
          />
          <span>❄️ 冰面打滑 (slip=0.2)</span>
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* 左侧可编辑网格 */}
        <div className="lg:col-span-6 flex flex-col items-center gap-3">
          <div className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: env.nS }, (_, s) => {
              const t = env.cell(s);
              if (t === 'wall') {
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => paintCell(s)}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 flex items-center justify-center text-base hover:opacity-80"
                  >
                    🧱
                  </button>
                );
              }
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => paintCell(s)}
                  style={{ backgroundColor: valueToColor(snap.V[s], 0.8, 0.72) }}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border border-border flex flex-col items-center justify-center hover:ring-2 hover:ring-teal-400 transition-all"
                >
                  <span className="text-sm font-bold leading-none">
                    {t === 'goal' ? '★' : t === 'pit' ? '☠' : `s${s}`}
                  </span>
                  <span className="text-[11px] font-mono mt-1">
                    {t === 'goal' ? '+1.0' : t === 'pit' ? '-1.0' : snap.V[s].toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 右侧：迭代控制与 Δ_k 压缩收敛图 */}
        <div className="lg:col-span-6 space-y-3">
          <div className="rounded-xl border border-border bg-background p-4 space-y-3 text-xs font-mono">
            <div className="flex justify-between items-center">
              <span>扫描轮次 k = <strong className="text-teal-500">{k}</strong> / {history.length - 1}</span>
              <button
                type="button"
                onClick={() => setIter((v) => (v + 1 > history.length - 1 ? 0 : v + 1))}
                className="inline-flex items-center gap-1 rounded bg-teal-500 text-white px-2.5 py-1 font-semibold hover:bg-teal-600"
              >
                <Play className="w-3 h-3" /> 单轮推进
              </button>
            </div>
            <input
              type="range"
              min={0}
              max={history.length - 1}
              value={k}
              onChange={(e) => setIter(Number(e.target.value))}
              className="w-full accent-teal-500"
            />
            <div className="flex justify-between items-center pt-1">
              <span>折扣 γ = {gamma.toFixed(2)}</span>
              <input
                type="range"
                min={0.5}
                max={0.98}
                step={0.02}
                value={gamma}
                onChange={(e) => setGamma(Number(e.target.value))}
                className="w-36 accent-indigo-500"
              />
            </div>
            <div className="rounded-lg bg-muted/50 px-3 py-2 flex justify-between">
              <span>本轮最大变化量 Δ_k = ‖V_k - V_{'{k-1}'}‖_∞</span>
              <strong className="text-amber-500">{Number.isFinite(snap.delta) ? snap.delta.toFixed(4) : '∞'}</strong>
            </div>
          </div>

          {/* Δ_k 指数收敛折线图 */}
          <div className="rounded-xl border border-border bg-background p-3.5">
            <div className="text-[11px] font-mono text-muted-foreground mb-1">
              压缩映射收敛曲线：Δ_k 按 γ^k 几何衰减至 0
            </div>
            <svg viewBox="0 0 360 115" className="w-full h-28">
              <polyline
                fill="none"
                stroke="#14b8a6"
                strokeWidth={2.5}
                points={deltas
                  .map((d, i) => {
                    const x = 14 + (i / Math.max(1, deltas.length - 1)) * 332;
                    const y = 102 - (d / maxD) * 86;
                    return `${x.toFixed(1)},${y.toFixed(1)}`;
                  })
                  .join(' ')}
              />
              {k > 0 && (
                <circle
                  cx={14 + ((k - 1) / Math.max(1, deltas.length - 1)) * 332}
                  cy={102 - ((deltas[k - 1] ?? 0) / maxD) * 86}
                  r={5}
                  fill="#f59e0b"
                />
              )}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
