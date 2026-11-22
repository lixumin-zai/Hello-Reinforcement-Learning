'use client';

import React, { useState } from 'react';
import { Play, RotateCcw, Sparkles } from 'lucide-react';
import { createRng, sampleCategorical } from '@/lib/rl';

interface Edge {
  to: string;
  prob: number;
}
interface Act {
  name: string;
  reward: number;
  edges: Edge[];
}

export function InteractiveStudentMDP() {
  const [focusProb, setFocusProb] = useState(0.8);
  const [curState, setCurState] = useState('C1');
  const [trace, setTrace] = useState<string[]>(['C1']);
  const [totalR, setTotalR] = useState(0);
  const [seed, setSeed] = useState(11);
  const [visits, setVisits] = useState<Record<string, number>>({ C1: 1, Relax: 0, C2: 0, Pass: 0, Sleep: 0 });

  const graph: Record<string, { label: string; x: number; y: number; terminal?: boolean; actions: Act[] }> = {
    C1: {
      label: '第一节课 C1',
      x: 110,
      y: 95,
      actions: [
        { name: '专注听课', reward: -2, edges: [{ to: 'C2', prob: focusProb }, { to: 'C1', prob: Number((1 - focusProb).toFixed(2)) }] },
        { name: '摸鱼刷手机', reward: -1, edges: [{ to: 'Relax', prob: 0.9 }, { to: 'C1', prob: 0.1 }] },
      ],
    },
    Relax: {
      label: '刷手机 Relax',
      x: 110,
      y: 240,
      actions: [
        { name: '继续刷', reward: -1, edges: [{ to: 'Relax', prob: 0.85 }, { to: 'C1', prob: 0.15 }] },
        { name: '收心回课堂', reward: 0, edges: [{ to: 'C1', prob: 1.0 }] },
      ],
    },
    C2: {
      label: '第二节课 C2',
      x: 330,
      y: 95,
      actions: [
        { name: '冲刺复习', reward: -2, edges: [{ to: 'Pass', prob: focusProb }, { to: 'C1', prob: Number((1 - focusProb).toFixed(2)) }] },
        { name: '提前放弃睡觉', reward: 0, edges: [{ to: 'Sleep', prob: 1.0 }] },
      ],
    },
    Pass: {
      label: '通过考试 ★',
      x: 525,
      y: 95,
      actions: [{ name: '庆祝后休息', reward: +10, edges: [{ to: 'Sleep', prob: 1.0 }] }],
    },
    Sleep: {
      label: '睡眠 (终止)',
      x: 525,
      y: 240,
      terminal: true,
      actions: [],
    },
  };

  const node = graph[curState];

  const takeAction = (act: Act) => {
    const rng = createRng(seed * 73 + trace.length * 19);
    setSeed((s) => s + 1);
    const chosen = act.edges[sampleCategorical(rng, act.edges.map((e) => e.prob))].to;
    setCurState(chosen);
    setTotalR((r) => r + act.reward);
    setTrace((t) => [...t, `${act.name}(${act.reward >= 0 ? '+' : ''}${act.reward})→${chosen}`]);
    setVisits((v) => ({ ...v, [chosen]: (v[chosen] ?? 0) + 1 }));
  };

  // 一键用“勤奋策略”蒙特卡洛采样 100 条完整回合，观察平稳访问频率与平均回报
  const [batchStats, setBatchStats] = useState<{ avgG: number; passRate: number; freqs: Record<string, number> } | null>(null);
  const runBatch = () => {
    const rng = createRng(seed * 131 + Math.round(focusProb * 100));
    const counts: Record<string, number> = { C1: 0, Relax: 0, C2: 0, Pass: 0, Sleep: 0 };
    let sumG = 0;
    let passes = 0;
    const episodes = 120;
    for (let ep = 0; ep < episodes; ep++) {
      let s = 'C1';
      let G = 0;
      let gammaPow = 1;
      for (let step = 0; step < 30; step++) {
        counts[s]++;
        if (s === 'Sleep') break;
        if (s === 'Pass') passes++;
        const act = graph[s].actions[0]; // 勤奋策略：总是选第一个学习动作
        G += gammaPow * act.reward;
        gammaPow *= 0.9;
        const idx = sampleCategorical(rng, act.edges.map((e) => e.prob));
        s = act.edges[idx].to;
      }
    }
    const totalVisits = Object.values(counts).reduce((a, b) => a + b, 0);
    const freqs: Record<string, number> = {};
    for (const k of Object.keys(counts)) freqs[k] = counts[k] / totalVisits;
    setBatchStats({ avgG: sumG / episodes, passRate: passes / episodes, freqs });
  };

  const reset = () => {
    setCurState('C1');
    setTrace(['C1']);
    setTotalR(0);
    setVisits({ C1: 1, Relax: 0, C2: 0, Pass: 0, Sleep: 0 });
  };

  return (
    <div className="my-6 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm space-y-4 not-prose">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-bold">🕸️ 可编程拓扑图「学生 MDP」：手动走轨迹 + 一键 120 局蒙特卡洛采样</div>
          <p className="text-xs text-muted-foreground mt-0.5">
            调节环境动力学 <code>p(专注进阶)</code>，体验环境随机性如何同时影响状态分布与期望回报！
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={runBatch}
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-500 text-white px-3 py-1.5 text-xs font-semibold hover:bg-indigo-600"
          >
            <Sparkles className="w-3.5 h-3.5" /> 采样 120 回合 (勤奋策略)
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-3.5 h-3.5" /> 重置
          </button>
        </div>
      </div>

      {/* 环境概率滑块 */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-muted/40 px-4 py-2.5 text-xs font-mono">
        <span>听课/复习成功进阶概率 p = <strong className="text-teal-500">{focusProb.toFixed(2)}</strong></span>
        <input
          type="range"
          min={0.3}
          max={1.0}
          step={0.05}
          value={focusProb}
          onChange={(e) => {
            setFocusProb(Number(e.target.value));
            setBatchStats(null);
          }}
          className="flex-1 min-w-[140px] accent-teal-500"
        />
        <span className="text-muted-foreground">走神停滞概率 = {(1 - focusProb).toFixed(2)}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* 左侧 SVG 拓扑图 */}
        <div className="lg:col-span-7 rounded-xl border border-border bg-zinc-950 p-3">
          <svg viewBox="0 0 640 315" className="w-full h-64">
            <defs>
              <marker id="arrMdp" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
              </marker>
            </defs>
            {/* 有向边 */}
            <line x1={156} y1={95} x2={280} y2={95} stroke="#2dd4bf" strokeWidth={2.5} markerEnd="url(#arrMdp)" />
            <text x={218} y={83} textAnchor="middle" fill="#5eead4" fontSize={11} fontFamily="monospace">
              听课 p={focusProb.toFixed(2)}
            </text>

            <line x1={110} y1={136} x2={110} y2={198} stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 3" markerEnd="url(#arrMdp)" />
            <text x={58} y={170} textAnchor="middle" fill="#fbbf24" fontSize={11}>摸鱼 -1</text>

            <line x1={376} y1={95} x2={474} y2={95} stroke="#34d399" strokeWidth={2.5} markerEnd="url(#arrMdp)" />
            <text x={425} y={83} textAnchor="middle" fill="#34d399" fontSize={11} fontFamily="monospace">
              复习 p={focusProb.toFixed(2)}
            </text>

            <line x1={360} y1={132} x2={486} y2={212} stroke="#94a3b8" strokeWidth={1.8} strokeDasharray="4 4" markerEnd="url(#arrMdp)" />
            <line x1={525} y1={136} x2={525} y2={198} stroke="#fbbf24" strokeWidth={2.5} markerEnd="url(#arrMdp)" />
            <text x={576} y={170} textAnchor="middle" fill="#fde047" fontSize={11} fontWeight="bold">+10 ★</text>

            {/* 节点 */}
            {Object.entries(graph).map(([k, n]) => {
              const active = k === curState;
              return (
                <g key={k} transform={`translate(${n.x}, ${n.y})`}>
                  <rect
                    x={-54}
                    y={-34}
                    width={108}
                    height={68}
                    rx={14}
                    fill={active ? 'rgba(99,102,241,0.3)' : '#0f172a'}
                    stroke={active ? '#818cf8' : n.terminal ? '#64748b' : '#2dd4bf'}
                    strokeWidth={active ? 3.5 : 2}
                  />
                  <text x={0} y={-4} textAnchor="middle" fill="#f8fafc" fontSize={12} fontWeight={700}>
                    {n.label}
                  </text>
                  <text x={0} y={16} textAnchor="middle" fill="#94a3b8" fontSize={10} fontFamily="monospace">
                    访问 {visits[k] ?? 0} 次
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* 右侧：交互决策面板 */}
        <div className="lg:col-span-5 space-y-3">
          <div className="rounded-xl border border-border bg-background p-4 space-y-2.5">
            <div className="flex justify-between text-xs font-mono">
              <span>当前所在：<strong className="text-indigo-500">{node.label}</strong></span>
              <span>本局 ΣR = <strong className="text-amber-500">{totalR}</strong></span>
            </div>

            {node.terminal ? (
              <div className="text-xs text-emerald-500 font-semibold py-2">
                ✅ 已到达终止状态 Sleep！点击「重置」重新体验。
              </div>
            ) : (
              <div className="space-y-2">
                {node.actions.map((act) => (
                  <button
                    key={act.name}
                    type="button"
                    onClick={() => takeAction(act)}
                    className="w-full text-left rounded-lg border border-border bg-card hover:border-indigo-500 p-3 transition-colors"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-indigo-500 inline-flex items-center gap-1">
                        <Play className="w-3 h-3" /> {act.name}
                      </span>
                      <span className="font-mono">R = {act.reward >= 0 ? `+${act.reward}` : act.reward}</span>
                    </div>
                    <div className="text-[11px] font-mono text-muted-foreground mt-1">
                      {act.edges.map((e) => `→ ${e.to} (${(e.prob * 100).toFixed(0)}%)`).join(' · ')}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {batchStats && (
            <div className="rounded-xl border border-teal-500/35 bg-teal-500/10 p-3.5 text-xs font-mono space-y-1">
              <div className="font-bold text-teal-600 dark:text-teal-300">
                120 回合采样统计（γ=0.9）：平均回报 G₀ = {batchStats.avgG.toFixed(2)}
              </div>
              <div className="text-muted-foreground">
                各状态访问占比：{Object.entries(batchStats.freqs).map(([k, v]) => `${k}:${(v * 100).toFixed(0)}%`).join(' · ')}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="text-[11px] font-mono text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 overflow-x-auto">
        当前轨迹 τ：{trace.join('  ')}
      </div>
    </div>
  );
}
