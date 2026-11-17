'use client';

import React, { useState } from 'react';

const APPS = [
  {
    domain: '🤖 大语言模型对齐与推理 (RLHF / GRPO)',
    state: 'Prompt + 已生成的上下文 token 序列 x_{1..t}',
    action: '词表中的下一个 token a_t ∈ V',
    reward: '人类偏好奖励模型打分 / 数学与代码单元测试通过率 (+1/0) - KL 惩罚',
    algos: 'PPO, DPO, GRPO, REINFORCE++',
  },
  {
    domain: '🦾 机器人与双足运动控制',
    state: '关节角度、角速度、IMU 姿态、足端接触力传感器读数',
    action: '各电机目标力矩或目标关节位置（连续向量）',
    reward: '前进速度跟踪奖励 - 能耗惩罚 - 摔倒巨大负奖励',
    algos: 'PPO (Isaac Gym 并行仿真), SAC, TD3',
  },
  {
    domain: '🎮 复杂博弈与电子竞技',
    state: '棋盘局面 / 屏幕像素帧 / 单位视野特征',
    action: '落子坐标 / 技能释放与移动指令',
    reward: '终局胜负 (+1 / -1) 及稀疏阶段目标奖励',
    algos: 'AlphaZero, MuZero, IMPALA, League Self-Play',
  },
  {
    domain: '📱 推荐系统与广告出价',
    state: '用户画像、历史点击序列、当前上下文（时间/设备）',
    action: '推荐候选列表排序 / 实时竞价出价倍率',
    reward: '点击率、长时留存、完播时长、GMV 转化',
    algos: 'Contextual Bandits (LinUCB), SlateQ, 离线 CQL',
  },
  {
    domain: '🔬 芯片布局与科学发现',
    state: '当前网表图与已放置宏单元的坐标网格',
    action: '下一个宏单元放置的网格位置',
    reward: '负的线长 (Wirelength)、拥塞度与时序违例加权和',
    algos: 'PPO (Google AlphaChip),AlphaTensor (MCTS)',
  },
];

export function ApplicationMap() {
  const [idx, setIdx] = useState(0);
  const app = APPS[idx];

  return (
    <div className="rounded-xl border border-border bg-card p-6 my-6 shadow-sm">
      <p className="text-sm text-muted-foreground mb-4">
        ▶ 点击不同工业场景，查看如何把真实业务拆解为 MDP 的三要素 <strong>(状态 S, 动作 A, 奖励 R)</strong>：
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-5">
        {APPS.map((a, i) => (
          <button
            key={a.domain}
            type="button"
            onClick={() => setIdx(i)}
            className={`text-left rounded-lg border px-3.5 py-2.5 text-xs font-semibold transition-all ${
              i === idx
                ? 'border-indigo-500 bg-indigo-500/15 text-foreground'
                : 'border-border bg-background hover:bg-muted'
            }`}
          >
            {a.domain}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-background p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-xs font-bold text-teal-500 mb-1">状态空间 S (State)</div>
          <p className="text-muted-foreground">{app.state}</p>
        </div>
        <div>
          <div className="text-xs font-bold text-indigo-500 mb-1">动作空间 A (Action)</div>
          <p className="text-muted-foreground">{app.action}</p>
        </div>
        <div>
          <div className="text-xs font-bold text-amber-500 mb-1">奖励函数 R (Reward)</div>
          <p className="text-muted-foreground">{app.reward}</p>
        </div>
        <div>
          <div className="text-xs font-bold text-purple-500 mb-1">主流代表算法</div>
          <p className="font-mono text-xs mt-1">{app.algos}</p>
        </div>
      </div>
    </div>
  );
}
