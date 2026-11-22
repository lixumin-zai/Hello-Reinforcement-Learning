'use client';

import React, { useState } from 'react';

const DOMAINS = [
  {
    id: 'llm',
    name: '🤖 大语言模型后训练 (RLHF / GRPO)',
    state: '用户提示词 q + 已经生成的 token 前缀 y_{1..t}',
    action: '从词表 V (约 10⁵ 个词元) 中采样下一个 token y_{t+1}',
    reward: '回答结束时的偏好奖励模型打分，或数学/代码单元测试验证结果 (+1 / 0)，辅以 -β·KL 惩罚',
    trap: '奖励黑客 (Reward Hacking)：如果只靠神经奖励模型打分而不加 KL 约束，模型会迅速学会写冗长空洞的“讨好式废话”来骗取高分！',
    algo: 'PPO / DPO / GRPO (DeepSeek-R1)',
  },
  {
    id: 'robot',
    name: '🦾 人形机器人双足行走',
    state: '本体感知：各关节角度/角速度、IMU 躯干倾角、历史指令队列',
    action: '12–29 个伺服电机的连续目标力矩或 PD 控制目标角',
    reward: '线速度跟踪奖励 - 关节能耗惩罚 - 躯干晃动惩罚 - 摔倒终止负奖励',
    trap: '动作抖动与 Sim2Real 鸿沟：仿真里如果漏掉电机力矩限制或摩擦随机化，策略在真实世界会瞬间高频抖动并摔毁。',
    algo: 'PPO (Isaac Gym 大规模并行) / SAC / TD3',
  },
  {
    id: 'game',
    name: '🎮 复杂博弈与即时战略 (AlphaZero / OpenAI Five)',
    state: '棋盘历史 8 步特征平面，或游戏全局小地图与己方单位属性向量',
    action: '合法落子坐标 / 技能释放、走位与集火指令',
    reward: '终局胜负 (+1 / -1)，MOBA 中可辅以阶段性经济/击杀奖励塑形',
    trap: '探索稀疏与策略循环：在非传递博弈（石头剪刀布式克制）中，单纯和最新自己对弈会遗忘旧克制策略，需用联盟自博弈 (League)。',
    algo: 'MCTS + 策略价值网络 / 分布式 PPO',
  },
  {
    id: 'recsys',
    name: '📱 信息流推荐与实时出价',
    state: '用户长期兴趣画像、近期点击/完播序列、时段与设备上下文',
    action: '从百万候选池召回/重排展示的下一刷内容列表',
    reward: '点击、完播、互动、次日留存的长期加权回报',
    trap: '标题党陷阱：只优化单次点击率 (短视 γ=0) 会诱发标题党伤害长期留存；离线训练则面临 OOD 动作外推高估。',
    algo: 'Contextual Bandits (LinUCB) / 离线 RL (CQL / IQL)',
  },
  {
    id: 'chip',
    name: '🔬 芯片宏单元布局 (AlphaChip)',
    state: '芯片网表图结构（GNN 编码）+ 画布上已放置的宏单元坐标掩码',
    action: '为当前待放置宏单元选择画布上的二维网格坐标',
    reward: '全部放完后计算真实布线长度 (Wirelength)、拥塞度与密度负加权和',
    trap: '计算代价高昂：真实 EDA 布局布线评估一次耗时数小时，必须设计高保真的快速代理奖励指标。',
    algo: '图神经网络 + PPO',
  },
];

const ERAS = [
  { year: '1957', name: 'Bellman 动态规划', wave: '理论奠基', note: 'Richard Bellman 提出 MDP 与 Bellman 最优性原理。' },
  { year: '1988–89', name: 'TD(λ) & Q-learning', wave: '表格时代', note: 'Sutton 提出时序差分，Watkins 提出 Q-learning，无模型 RL 正式成型。' },
  { year: '1992', name: 'TD-Gammon', wave: '神经初探', note: 'MLP + TD(λ) 自博弈达到人类西洋双陆棋世界级水平。' },
  { year: '2015', name: 'DQN (Nature)', wave: '深度 RL 元年', note: '经验回放 + 目标网络，直接从原始像素学会 49 款 Atari 游戏。' },
  { year: '2016–19', name: 'AlphaGo → MuZero', wave: '规划巅峰', note: '深度策略价值网络 + MCTS 征服围棋，并在未知规则下学会隐空间规划。' },
  { year: '2017', name: 'PPO', wave: '工业标准', note: '一阶截断替代目标兼具稳定与简洁，成为机器人与 LLM 对齐核心引擎。' },
  { year: '2022–25', name: 'RLHF → DPO → GRPO', wave: '通用推理时代', note: '强化学习走出游戏进入大模型核心：对齐人类偏好并自发涌现长思维链推理。' },
];

export function MDPModelingStudio() {
  const [domainIdx, setDomainIdx] = useState(0);
  const [eraIdx, setEraIdx] = useState(ERAS.length - 1);
  const d = DOMAINS[domainIdx];

  return (
    <div className="my-6 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm space-y-6 not-prose">
      {/* 1. 五大工业场景 MDP 拆解 */}
      <div className="space-y-3">
        <div className="text-sm font-bold">🔧 工业场景 MDP 拆解工作台（含真实工程陷阱）</div>
        <div className="flex flex-wrap gap-2">
          {DOMAINS.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setDomainIdx(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                i === domainIdx
                  ? 'border-indigo-500 bg-indigo-500 text-white shadow-sm'
                  : 'border-border bg-background hover:bg-muted'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-background p-4 grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
          <div className="rounded-lg bg-teal-500/8 border border-teal-500/25 p-3">
            <div className="font-bold text-teal-600 dark:text-teal-400 mb-1">状态空间 S (State)</div>
            <div className="text-muted-foreground leading-relaxed">{d.state}</div>
          </div>
          <div className="rounded-lg bg-indigo-500/8 border border-indigo-500/25 p-3">
            <div className="font-bold text-indigo-600 dark:text-indigo-400 mb-1">动作空间 A (Action)</div>
            <div className="text-muted-foreground leading-relaxed">{d.action}</div>
          </div>
          <div className="rounded-lg bg-amber-500/8 border border-amber-500/25 p-3">
            <div className="font-bold text-amber-600 dark:text-amber-400 mb-1">奖励设计 R (Reward)</div>
            <div className="text-muted-foreground leading-relaxed">{d.reward}</div>
          </div>
          <div className="rounded-lg bg-rose-500/8 border border-rose-500/30 p-3">
            <div className="font-bold text-rose-600 dark:text-rose-400 mb-1">⚠️ 工程最大陷阱</div>
            <div className="text-muted-foreground leading-relaxed">{d.trap}</div>
          </div>
          <div className="md:col-span-2 flex items-center justify-between rounded-lg bg-muted/50 px-3.5 py-2">
            <span className="text-muted-foreground">主流算法栈</span>
            <span className="font-mono font-bold text-foreground">{d.algo}</span>
          </div>
        </div>
      </div>

      {/* 2. 七十年演进血缘时间轴 */}
      <div className="space-y-3 pt-4 border-t border-border">
        <div className="text-sm font-bold">🕰️ 强化学习 70 年演进脉络</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
          {ERAS.map((e, i) => (
            <button
              key={e.year}
              type="button"
              onClick={() => setEraIdx(i)}
              className={`rounded-lg border px-2 py-2 text-center transition-all ${
                i === eraIdx
                  ? 'border-indigo-500 bg-indigo-500/15 text-foreground font-bold'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              <div className="font-mono text-[11px] text-indigo-500">{e.year}</div>
              <div className="text-[11px] truncate mt-0.5">{e.name}</div>
            </button>
          ))}
        </div>
        <div className="rounded-xl border border-border bg-background p-4 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div>
            <span className="font-bold text-sm mr-2">{ERAS[eraIdx].name}</span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-500 font-semibold">
              {ERAS[eraIdx].wave}
            </span>
            <p className="text-muted-foreground mt-1.5">{ERAS[eraIdx].note}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
