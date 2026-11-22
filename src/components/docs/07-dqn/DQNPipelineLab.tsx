'use client';

import React, { useState } from 'react';
import { RefreshCw, Shuffle } from 'lucide-react';
import { createRng } from '@/lib/rl';

interface TransitionItem {
  id: number;
  ep: number;
  s: string;
  a: string;
  r: number;
}

const INIT_BUF: TransitionItem[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  ep: Math.floor(i / 4) + 1,
  s: `帧#${i + 1}`,
  a: ['←', '→', '↑', '→'][i % 4],
  r: i % 5 === 4 ? +1 : 0,
}));

export function DQNPipelineLab() {
  const [buffer, setBuffer] = useState<TransitionItem[]>(INIT_BUF);
  const [writeHead, setWriteHead] = useState(0);
  const [batchIds, setBatchIds] = useState<number[]>([2, 6, 9, 11]);
  const [useTargetNet, setUseTargetNet] = useState(true);
  const [stepCount, setStepCount] = useState(12);
  const [seed, setSeed] = useState(1);

  const pushOne = () => {
    const nextId = stepCount + 1;
    const item: TransitionItem = {
      id: nextId,
      ep: Math.floor(nextId / 4) + 1,
      s: `帧#${nextId}`,
      a: ['↑', '→', '←', '→'][nextId % 4],
      r: nextId % 5 === 0 ? +1 : 0,
    };
    setBuffer((prev) => prev.map((x, i) => (i === writeHead ? item : x)));
    setWriteHead((h) => (h + 1) % 12);
    setStepCount(nextId);
  };

  const sampleBatch = () => {
    const rng = createRng(seed * 97 + stepCount);
    setSeed((s) => s + 1);
    const picked = new Set<number>();
    while (picked.size < 4) picked.add(buffer[Math.floor(rng() * buffer.length)].id);
    setBatchIds([...picked]);
  };

  // 有/无 Target Net 的 TD Loss 曲线示意
  const lossCurve = Array.from({ length: 40 }, (_, i) => {
    if (useTargetNet) return 1.8 * Math.exp(-i / 14) + 0.12 + 0.08 * Math.sin(i * 0.9) * Math.exp(-i / 20);
    return 1.2 + 0.85 * Math.sin(i * 1.4) + 0.04 * i;
  });

  return (
    <div className="my-6 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm space-y-4 not-prose">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-bold">🧠 DQN 两大稳压器交互解剖：环形经验回放 × 目标网络冻结</div>
          <p className="text-xs text-muted-foreground mt-0.5">
            点击「写入新经验」覆盖旧槽位、点击「随机抽样 Mini-batch」打破时间相关性；再切换下方「目标网络开关」观察 TD Loss 震荡差异！
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={pushOne}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted"
          >
            <RefreshCw className="w-3.5 h-3.5" /> 写入 1 条新经验
          </button>
          <button
            type="button"
            onClick={sampleBatch}
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-500 text-white px-3 py-1.5 text-xs font-semibold hover:bg-indigo-600"
          >
            <Shuffle className="w-3.5 h-3.5" /> 随机抽取 Batch (4条)
          </button>
        </div>
      </div>

      {/* 12 槽位环形经验回放队列 */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 font-mono text-[11px]">
        {buffer.map((item, idx) => {
          const inBatch = batchIds.includes(item.id);
          const isHead = idx === writeHead;
          return (
            <div
              key={idx}
              className={`rounded-xl border p-2.5 transition-all ${
                inBatch
                  ? 'border-2 border-amber-400 bg-amber-500/15 scale-103 shadow-sm'
                  : 'border-border bg-background'
              }`}
            >
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Ep{item.ep}</span>
                {isHead && <span className="text-teal-500 font-bold">↓写指针</span>}
              </div>
              <div className="font-bold text-foreground mt-0.5">
                {item.s} {item.a}
              </div>
              <div className={item.r > 0 ? 'text-emerald-500 font-bold' : 'text-muted-foreground'}>
                r = {item.r > 0 ? '+1' : '0'} {inBatch ? '★采样' : ''}
              </div>
            </div>
          );
        })}
      </div>

      {/* 目标网络开关 + TD Loss 稳定性对照 */}
      <div className="rounded-xl border border-border bg-background p-4 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <label className="flex items-center gap-2 font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={useTargetNet}
              onChange={(e) => setUseTargetNet(e.target.checked)}
              className="accent-emerald-500"
            />
            <span>🧊 启用冻结目标网络 Target Network (每 C 步同步 θ⁻ ← θ)</span>
          </label>
          <span className={`font-mono font-bold ${useTargetNet ? 'text-emerald-500' : 'text-rose-500'}`}>
            {useTargetNet ? '靶子静止 → TD Loss 平滑下降' : '⚠️ 移动靶子追尾 → TD Loss 剧烈震荡发散'}
          </span>
        </div>

        <svg viewBox="0 0 560 115" className="w-full h-28">
          <polyline
            fill="none"
            stroke={useTargetNet ? '#10b981' : '#f43f5e'}
            strokeWidth={2.6}
            points={lossCurve.map((v, i) => `${16 + (i / 39) * 528},${104 - Math.min(92, v * 28)}`).join(' ')}
          />
        </svg>
      </div>
    </div>
  );
}
