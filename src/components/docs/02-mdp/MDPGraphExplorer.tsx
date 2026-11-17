'use client';

import React, { useState } from 'react';
import { createRng, sampleCategorical } from '@/lib/rl';

interface Branch {
  to: string;
  prob: number;
}
interface ActionSpec {
  name: string;
  reward: number;
  branches: Branch[];
}

const STUDENT_MDP: Record<string, { label: string; terminal?: boolean; actions: ActionSpec[] }> = {
  C1: {
    label: '第一节课 C1',
    actions: [
      { name: '认真听课', reward: -2, branches: [{ to: 'C2', prob: 0.8 }, { to: 'C1', prob: 0.2 }] },
      { name: '刷手机摸鱼', reward: -1, branches: [{ to: 'Relax', prob: 0.9 }, { to: 'C1', prob: 0.1 }] },
    ],
  },
  Relax: {
    label: '刷手机 Relax',
    actions: [
      { name: '继续刷手机', reward: -1, branches: [{ to: 'Relax', prob: 0.9 }, { to: 'C1', prob: 0.1 }] },
      { name: '放下手机回课堂', reward: 0, branches: [{ to: 'C1', prob: 1.0 }] },
    ],
  },
  C2: {
    label: '第二节课 C2',
    actions: [
      { name: '考前冲刺复习', reward: -2, branches: [{ to: 'Pass', prob: 0.85 }, { to: 'C1', prob: 0.15 }] },
      { name: '直接去睡觉', reward: 0, branches: [{ to: 'Sleep', prob: 1.0 }] },
    ],
  },
  Pass: {
    label: '通过考试 (+10) ★',
    actions: [{ name: '进入睡眠终点', reward: +10, branches: [{ to: 'Sleep', prob: 1.0 }] }],
  },
  Sleep: {
    label: '睡眠（终止状态）',
    terminal: true,
    actions: [],
  },
};

export function MDPGraphExplorer() {
  const [state, setState] = useState<string>('C1');
  const [history, setHistory] = useState<string[]>(['C1']);
  const [totalR, setTotalR] = useState(0);
  const [stepSeed, setStepSeed] = useState(1);

  const cur = STUDENT_MDP[state];

  const takeAction = (act: ActionSpec) => {
    const rng = createRng(stepSeed * 97 + history.length);
    setStepSeed((s) => s + 1);
    const idx = sampleCategorical(
      rng,
      act.branches.map((b) => b.prob),
    );
    const next = act.branches[idx].to;
    setState(next);
    setTotalR((r) => r + act.reward);
    setHistory((h) => [...h, `${act.name}(${act.reward >= 0 ? '+' : ''}${act.reward}) → ${next}`]);
  };

  const reset = () => {
    setState('C1');
    setHistory(['C1']);
    setTotalR(0);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 my-6 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          ▶ 在经典「学生 MDP」中选择动作，体验转移概率 <code>p(s′ | s, a)</code> 与即时奖励 <code>r(s, a)</code>：
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-border bg-background px-3 py-1 text-xs font-medium hover:bg-muted"
        >
          重置回合
        </button>
      </div>

      {/* 状态徽章条 */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(STUDENT_MDP).map(([k, v]) => (
          <div
            key={k}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
              k === state
                ? 'border-teal-500 bg-teal-500/15 text-foreground shadow-sm'
                : 'border-border bg-background text-muted-foreground'
            }`}
          >
            {v.label}
          </div>
        ))}
      </div>

      {/* 可选动作 */}
      <div className="rounded-xl border border-border bg-background p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold">当前状态：{cur.label}</span>
          <span className="text-xs font-mono font-bold text-amber-500">累计奖励 ΣR = {totalR}</span>
        </div>

        {cur.terminal ? (
          <div className="text-sm text-emerald-500 font-semibold">
            🎉 已到达终止状态 Sleep！点击右上角「重置回合」再试一次。
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cur.actions.map((act) => (
              <button
                key={act.name}
                type="button"
                onClick={() => takeAction(act)}
                className="text-left rounded-lg border border-border bg-card hover:border-indigo-500 hover:bg-indigo-500/5 p-3.5 transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-indigo-500">{act.name}</span>
                  <span className="text-xs font-mono">
                    即时奖励 R = {act.reward >= 0 ? `+${act.reward}` : act.reward}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  转移分支：{act.branches.map((b) => `${b.to} (${(b.prob * 100).toFixed(0)}%)`).join(' · ')}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="text-xs font-mono text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 overflow-x-auto">
        轨迹 τ：{history.join('  ')}
      </div>
    </div>
  );
}
