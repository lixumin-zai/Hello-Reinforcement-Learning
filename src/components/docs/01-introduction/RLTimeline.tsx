'use client';

import React, { useState } from 'react';

const MILESTONES = [
  {
    year: '1950s',
    title: 'Bellman 方程与动态规划',
    tag: '最优控制源流',
    desc: 'Richard Bellman 提出马尔可夫决策过程 (MDP) 与著名的 Bellman 最优性原理，奠定强化学习的数学骨架。',
  },
  {
    year: '1988–1989',
    title: 'TD(λ) 与 Q-learning 诞生',
    tag: '现代 RL 奠基',
    desc: 'Sutton 提出时序差分学习 TD(λ)，Watkins 提出离策略 Q-learning，两大源流正式合流。',
  },
  {
    year: '1992',
    title: 'TD-Gammon 击败西洋双陆棋大师',
    tag: '首次神经 RL 突破',
    desc: 'Tesauro 用多层感知机 + TD(λ) 自博弈训练双陆棋，首次证明神经网络价值近似在复杂博弈中的潜力。',
  },
  {
    year: '2013 / 2015',
    title: 'DeepMind DQN 征服 Atari 2600',
    tag: '深度强化学习元年',
    desc: '结合卷积神经网络、经验回放与目标网络，直接从原始像素学会 49 款 Atari 游戏（Nature 2015）。',
  },
  {
    year: '2016–2019',
    title: 'AlphaGo → AlphaZero → MuZero',
    tag: '超人类博弈与规划',
    desc: '蒙特卡洛树搜索 + 深度策略价值网络击败李世石与柯洁；MuZero 在未知规则下学会隐空间规划。',
  },
  {
    year: '2017',
    title: 'PPO (Proximal Policy Optimization)',
    tag: '工业界标准算法',
    desc: 'Schulman 等人提出截断替代目标 PPO，凭借出色的稳定性与简洁实现成为机器人与大模型对齐的默认基石。',
  },
  {
    year: '2022–2025',
    title: 'RLHF (InstructGPT) → DPO → GRPO (DeepSeek-R1)',
    tag: '大模型与推理时代',
    desc: '强化学习从游戏走进通用人工智能核心：RLHF 对齐人类偏好，GRPO + 可验证奖励激发长思维链推理涌现。',
  },
];

export function RLTimeline() {
  const [selected, setSelected] = useState(MILESTONES.length - 1);
  const item = MILESTONES[selected];

  return (
    <div className="rounded-xl border border-border bg-card p-6 my-6 shadow-sm">
      <p className="text-sm text-muted-foreground mb-4">▶ 点击年份节点，回顾强化学习七十年演进中的关键突破：</p>

      <div className="flex flex-wrap gap-2 mb-5">
        {MILESTONES.map((m, i) => (
          <button
            key={m.year}
            type="button"
            onClick={() => setSelected(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all ${
              i === selected
                ? 'border-indigo-500 bg-indigo-500 text-white'
                : 'border-border bg-background hover:bg-muted'
            }`}
          >
            {m.year}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-background p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span className="text-lg font-bold">{item.title}</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-500 font-semibold">
            {item.tag}
          </span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
      </div>
    </div>
  );
}
