'use client';

import React, { useMemo, useState } from 'react';
import { createRng } from '@/lib/rl';

const TRUE_V = [1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6];
const NAMES = ['A', 'B', 'C', 'D', 'E'];

function rms(v: number[]): number {
  return Math.sqrt(v.reduce((acc, x, i) => acc + Math.pow(x - TRUE_V[i], 2), 0) / 5);
}

export function RandomWalkArena() {
  const [alphaTD, setAlphaTD] = useState(0.1);
  const [alphaMC, setAlphaMC] = useState(0.04);
  const [epCursor, setEpCursor] = useState(60);

  // 运行 25 次独立随机游走实验求平均 RMS 曲线（100 回合）+ 保留第 1 次实验各回合的估计值
  const data = useMemo(() => {
    const E = 100;
    const runs = 25;
    const rmsTD = Array(E).fill(0);
    const rmsMC = Array(E).fill(0);
    const tdSnaps: number[][] = [];
    const mcSnaps: number[][] = [];

    for (let run = 0; run < runs; run++) {
      const rng = createRng(700 + run * 19);
      const vTD = [0.5, 0.5, 0.5, 0.5, 0.5];
      const vMC = [0.5, 0.5, 0.5, 0.5, 0.5];

      for (let ep = 0; ep < E; ep++) {
        let s = 2; // C 居中出发
        const visited = [s];
        let finalR = 0;
        for (let step = 0; step < 200; step++) {
          const next = rng() < 0.5 ? s - 1 : s + 1;
          if (next < 0) {
            vTD[s] += alphaTD * (0 - vTD[s]);
            finalR = 0;
            break;
          }
          if (next >= 5) {
            vTD[s] += alphaTD * (1 - vTD[s]);
            finalR = 1;
            break;
          }
          vTD[s] += alphaTD * (vTD[next] - vTD[s]);
          s = next;
          visited.push(s);
        }
        for (const st of visited) vMC[st] += alphaMC * (finalR - vMC[st]);

        rmsTD[ep] += rms(vTD) / runs;
        rmsMC[ep] += rms(vMC) / runs;
        if (run === 0) {
          tdSnaps.push(vTD.slice());
          mcSnaps.push(vMC.slice());
        }
      }
    }
    return { rmsTD, rmsMC, tdSnaps, mcSnaps };
  }, [alphaTD, alphaMC]);

  const idx = Math.min(99, Math.max(0, epCursor - 1));
  const curTD = data.tdSnaps[idx];
  const curMC = data.mcSnaps[idx];
  const maxRms = 0.28;

  const toPts = (arr: number[]) =>
    arr
      .map((v, i) => `${36 + (i / 99) * 350},${150 - (Math.min(maxRms, v) / maxRms) * 130}`)
      .join(' ');

  return (
    <div className="my-6 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm space-y-4 not-prose">
      <div>
        <div className="text-sm font-bold">🚶 5 状态随机游走实验（复现 Sutton &amp; Barto 图 6.2）：TD(0) vs MC 精度对决</div>
        <p className="text-xs text-muted-foreground mt-0.5">
          小人从中央 C 出发，每步 50% 向左、50% 向右；撞最左终点得 0，撞最右终点得 +1。真实价值精确为 <code>[1/6, 2/6, 3/6, 4/6, 5/6]</code>。
        </p>
      </div>

      {/* 链状地形示意图 */}
      <div className="grid grid-cols-7 gap-2 items-center text-center text-xs font-mono">
        <div className="rounded-xl bg-rose-500/15 border border-rose-500/40 py-3 font-bold text-rose-500">终点 0</div>
        {NAMES.map((n, i) => (
          <div key={n} className="rounded-xl border border-border bg-background p-2.5 space-y-0.5">
            <div className="font-extrabold text-sm">{n} {i === 2 ? '🤖' : ''}</div>
            <div className="text-[10px] text-emerald-500">真 {TRUE_V[i].toFixed(2)}</div>
            <div className="text-[10px] text-indigo-500 font-bold">TD {curTD[i].toFixed(2)}</div>
            <div className="text-[10px] text-amber-500">MC {curMC[i].toFixed(2)}</div>
          </div>
        ))}
        <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/40 py-3 font-bold text-emerald-500">终点 +1</div>
      </div>

      {/* 参数滑块 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
        <label className="rounded-lg border border-border bg-background p-2.5 space-y-1">
          <div className="flex justify-between"><span>观察回合 ep</span><strong className="text-foreground">{epCursor}</strong></div>
          <input type="range" min={1} max={100} value={epCursor} onChange={(e) => setEpCursor(Number(e.target.value))} className="w-full accent-indigo-500" />
        </label>
        <label className="rounded-lg border border-border bg-background p-2.5 space-y-1">
          <div className="flex justify-between"><span>TD(0) 步长 α</span><strong className="text-indigo-500">{alphaTD.toFixed(2)}</strong></div>
          <input type="range" min={0.02} max={0.25} step={0.01} value={alphaTD} onChange={(e) => setAlphaTD(Number(e.target.value))} className="w-full accent-indigo-500" />
        </label>
        <label className="rounded-lg border border-border bg-background p-2.5 space-y-1">
          <div className="flex justify-between"><span>MC 步长 α</span><strong className="text-amber-500">{alphaMC.toFixed(2)}</strong></div>
          <input type="range" min={0.01} max={0.15} step={0.01} value={alphaMC} onChange={(e) => setAlphaMC(Number(e.target.value))} className="w-full accent-amber-500" />
        </label>
      </div>

      {/* RMS 误差对比曲线 SVG */}
      <div className="rounded-xl border border-border bg-background p-3.5">
        <div className="flex justify-between text-[11px] font-mono text-muted-foreground mb-1">
          <span>25 次独立实验平均 RMS 误差（越低越准）</span>
          <span>
            <span className="text-indigo-500 font-bold mr-3">■ TD(0): {data.rmsTD[idx].toFixed(3)}</span>
            <span className="text-amber-500 font-bold">■ MC: {data.rmsMC[idx].toFixed(3)}</span>
          </span>
        </div>
        <svg viewBox="0 0 410 165" className="w-full h-40">
          <polyline fill="none" stroke="#6366f1" strokeWidth={2.8} points={toPts(data.rmsTD)} />
          <polyline fill="none" stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="6 3" points={toPts(data.rmsMC)} />
          <line
            x1={36 + (idx / 99) * 350}
            y1={16}
            x2={36 + (idx / 99) * 350}
            y2={152}
            stroke="currentColor"
            opacity={0.35}
            strokeDasharray="3 3"
          />
          <text x={4} y={24} fontSize={9} fill="currentColor" opacity={0.55}>0.28</text>
          <text x={14} y={154} fontSize={9} fill="currentColor" opacity={0.55}>0.0</text>
        </svg>
      </div>
    </div>
  );
}
