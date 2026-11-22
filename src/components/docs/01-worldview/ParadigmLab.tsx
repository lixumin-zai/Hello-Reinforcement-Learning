'use client';

import React, { useState } from 'react';

const SCENARIOS = {
  drive: {
    name: '🚗 自动驾驶变道超车',
    supervised: {
      data: '人类老司机录制的 100 万帧（图像 → 方向盘转角）标签集',
      limit: '只能模仿人类平均水平；一旦车辆轻微偏离人类见过的车道中心，误差迅速累积（分布偏移 / Covariate Shift）。',
      loss: 'min_θ Σ ‖π_θ(s_i) - a_human‖²',
    },
    unsupervised: {
      data: '海量无标注行车记录仪视频流',
      limit: '能学会预测下一帧画面、识别车辆和车道线结构，但不知道“撞车不好、高效通行好”。',
      loss: 'max_θ Σ log p_θ(frame_{t+1} | frame_{1..t})',
    },
    rl: {
      data: '仿真器中智能体亲自驾驶产生的非独立同分布轨迹',
      limit: '仅凭“到达+10、碰撞-100、舒适度-0.1”的评价性标量奖励，能自己学会超越普通司机的防碰撞与博弈变道策略。',
      loss: 'max_π E_{τ~π}[ Σ γ^t R_{t+1} ]',
    },
  },
  chess: {
    name: '♟️ 国际象棋与围棋博弈',
    supervised: {
      data: '人类特级大师的百万盘历史棋谱 (盘面 → 落子)',
      limit: '天花板被锁死在人类棋谱之内，无法发现超越人类千年认知的新定式。',
      loss: 'min_θ -Σ log π_θ(a_master | s_i)',
    },
    unsupervised: {
      data: '无胜负标签的棋盘局面集合',
      limit: '只能聚类出“开局/中盘/残局”结构特征，无法做落子决策。',
      loss: 'min_θ ‖x - Dec(Enc(x))‖²',
    },
    rl: {
      data: 'AlphaZero 从零开始与自己对弈数千万盘',
      limit: '每盘棋直到终局才收到 +1/-1 的极度延迟奖励，却演化出颠覆人类常识的弃子与全局视野。',
      loss: 'max_π E[ R_final | π_self-play ]',
    },
  },
} as const;

const STATE_BINS = ['起点走廊', '近道岔口', '高风险桥', '安全绕路', '终点区'];

export function ParadigmLab() {
  const [scenario, setScenario] = useState<'drive' | 'chess'>('drive');
  const [policyShift, setPolicyShift] = useState(0); // 0 = 初期随机探索, 100 = 后期成熟策略

  const sc = SCENARIOS[scenario];
  // 静态监督数据集分布（永远不变）
  const staticDist = [35, 25, 18, 14, 8];
  // RL 动态分布 d^{π_θ}(s)：随着策略迭代剧烈漂移向高价值路径
  const t = policyShift / 100;
  const rlDist = [
    Math.round(40 * (1 - t) + 12 * t),
    Math.round(28 * (1 - t) + 16 * t),
    Math.round(18 * (1 - t) + 4 * t),
    Math.round(10 * (1 - t) + 34 * t),
    Math.round(4 * (1 - t) + 34 * t),
  ];

  return (
    <div className="my-6 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm space-y-5 not-prose">
      {/* 上半部分：同题三解法对比 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">1. 同一个任务，三种机器学习范式的本质区别</p>
        <div className="flex gap-2">
          {(['drive', 'chess'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setScenario(k)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                scenario === k
                  ? 'border-indigo-500 bg-indigo-500 text-white'
                  : 'border-border bg-background hover:bg-muted'
              }`}
            >
              {SCENARIOS[k].name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="rounded-xl border border-border bg-background p-4 space-y-2">
          <div className="font-bold text-sm text-sky-500">监督学习 (指导性反馈)</div>
          <div className="text-muted-foreground"><strong>数据：</strong>{sc.supervised.data}</div>
          <div className="text-muted-foreground"><strong>瓶颈：</strong>{sc.supervised.limit}</div>
          <code className="block rounded bg-muted px-2 py-1 text-[11px] font-mono">{sc.supervised.loss}</code>
        </div>
        <div className="rounded-xl border border-border bg-background p-4 space-y-2">
          <div className="font-bold text-sm text-purple-500">无监督 / 自监督 (结构发现)</div>
          <div className="text-muted-foreground"><strong>数据：</strong>{sc.unsupervised.data}</div>
          <div className="text-muted-foreground"><strong>瓶颈：</strong>{sc.unsupervised.limit}</div>
          <code className="block rounded bg-muted px-2 py-1 text-[11px] font-mono">{sc.unsupervised.loss}</code>
        </div>
        <div className="rounded-xl border-2 border-indigo-500/60 bg-indigo-500/5 p-4 space-y-2">
          <div className="font-bold text-sm text-indigo-500">强化学习 (评价性试错)</div>
          <div className="text-muted-foreground"><strong>数据：</strong>{sc.rl.data}</div>
          <div className="text-muted-foreground"><strong>优势：</strong>{sc.rl.limit}</div>
          <code className="block rounded bg-indigo-500/15 px-2 py-1 text-[11px] font-mono text-indigo-400">
            {sc.rl.loss}
          </code>
        </div>
      </div>

      {/* 下半部分：i.i.d. 假设破裂可视化 */}
      <div className="rounded-xl border border-border bg-background p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-sm font-bold">2. 直观体验“非平稳数据分布漂移” (i.i.d. 假设破裂)</div>
            <p className="text-xs text-muted-foreground">
              拖动策略迭代进度条：监督学习的训练集分布永远静止；而 RL 智能体每次更新策略 θ，它自己采样的状态分布 d^π(s) 都会剧烈移动！
            </p>
          </div>
          <span className="font-mono text-xs px-2.5 py-1 rounded bg-amber-500/15 text-amber-500 font-bold">
            策略训练进度：{policyShift}%
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          step={2}
          value={policyShift}
          onChange={(e) => setPolicyShift(Number(e.target.value))}
          className="w-full accent-indigo-500"
        />

        <div className="grid grid-cols-5 gap-3 items-end h-36 pt-2">
          {STATE_BINS.map((name, i) => (
            <div key={name} className="flex flex-col items-center justify-end h-full gap-1">
              <div className="flex items-end gap-1.5 h-24">
                <div className="flex flex-col items-center justify-end h-full">
                  <span className="text-[10px] font-mono text-muted-foreground">{staticDist[i]}%</span>
                  <div
                    style={{ height: `${staticDist[i] * 2}px` }}
                    className="w-5 rounded-t bg-slate-500/50"
                    title="监督学习静态数据集"
                  />
                </div>
                <div className="flex flex-col items-center justify-end h-full">
                  <span className="text-[10px] font-mono text-indigo-400 font-bold">{rlDist[i]}%</span>
                  <div
                    style={{ height: `${rlDist[i] * 2}px` }}
                    className="w-5 rounded-t bg-indigo-500 transition-all duration-150"
                    title="RL 策略采样分布 d^π(s)"
                  />
                </div>
              </div>
              <span className="text-[11px] text-center text-muted-foreground">{name}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-6 text-[11px] text-muted-foreground">
          <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-slate-500/50 mr-1" />监督学习：固定静态分布 p(x)</span>
          <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-indigo-500 mr-1" />强化学习：随策略移动的 d^π(s)</span>
        </div>
      </div>
    </div>
  );
}
