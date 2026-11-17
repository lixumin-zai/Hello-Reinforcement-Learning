'use client';

import React, { useState } from 'react';

const PARADIGMS = {
  supervised: {
    name: '监督学习 (Supervised Learning)',
    tagline: '有老师手把手教“标准答案”',
    data: '带标签的独立同分布样本集 {(x_i, y_i)}',
    feedback: '直接告知正确标签 y*（指导性信号 Instructive Feedback）',
    chess: '收集人类大师的百万盘棋谱，给定盘面 x，预测大师走哪一步 y（模仿，上限受限于老师水平）。',
    formula: 'min_θ  E_{(x,y)~D} [ L(f_θ(x), y) ]',
  },
  unsupervised: {
    name: '无监督/自监督学习 (Unsupervised Learning)',
    tagline: '没有老师，也沒有奖惩，寻找数据内在结构',
    data: '无标签原始数据 {x_i}',
    chess: '对海量棋盘局面做聚类或学习低维表示，发现“开放线”、“王城安全”等潜在特征，但不直接回答怎么赢。',
    feedback: '无外部评价信号，依赖重构误差、对比损失或似然最大化',
    formula: 'max_θ  E_{x~D} [ log p_θ(x) ]',
  },
  rl: {
    name: '强化学习 (Reinforcement Learning)',
    tagline: '没有标准答案，只有试错后的好坏打分',
    data: '智能体自己与环境交互生成的非独立同分布轨迹 τ',
    feedback: '延迟、稀疏的标量奖励 R_t（评价性信号 Evaluative Feedback）',
    chess: '只告诉智能体“赢 +1、输 -1、和 0”，让它在自博弈中尝试千万盘，最终发现超越人类千年的全新下法 (AlphaZero)。',
    formula: 'max_π  E_{τ ~ π} [ Σ_{t=0..∞} γ^t R_{t+1} ]',
  },
} as const;

type Key = keyof typeof PARADIGMS;

export function ParadigmComparison() {
  const [active, setActive] = useState<Key>('rl');
  const item = PARADIGMS[active];

  return (
    <div className="rounded-xl border border-border bg-card p-6 my-6 shadow-sm">
      <p className="text-sm text-muted-foreground mb-4">
        ▶ 点击切换三大机器学习范式，对比它们在<strong>同一任务（下国际象棋）</strong>上的建模差异：
      </p>

      <div className="flex flex-wrap gap-2 mb-5">
        {(Object.keys(PARADIGMS) as Key[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setActive(k)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              active === k
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {PARADIGMS[k].name}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-background p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <div>
            <h4 className="font-bold text-base">{item.name}</h4>
            <p className="text-xs text-muted-foreground">{item.tagline}</p>
          </div>
          <code className="text-xs px-3 py-1 rounded-md bg-muted font-mono">{item.formula}</code>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="rounded-lg bg-muted/40 p-3.5">
            <div className="text-xs font-semibold text-muted-foreground mb-1">📊 数据来源</div>
            <div>{item.data}</div>
          </div>
          <div className="rounded-lg bg-muted/40 p-3.5">
            <div className="text-xs font-semibold text-muted-foreground mb-1">📡 反馈信号</div>
            <div>{item.feedback}</div>
          </div>
          <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/30 p-3.5">
            <div className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 mb-1">♟️ 以「下棋」为例</div>
            <div>{item.chess}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
