'use client';

import React, { useState } from 'react';

const MODULES = [
  { id: 'double', name: 'Double DQN', gain: 18, desc: '在线网选动作 + 目标网估值，消除 Q 值系统性高估' },
  { id: 'per', name: '优先经验回放 (PER)', gain: 42, desc: '按 TD 误差 |δ_i|^α 优先重播高惊喜样本（消融贡献最大之一！）' },
  { id: 'dueling', name: 'Dueling 架构', gain: 22, desc: '拆分 V(s) 与 A(s,a)，冗余动作状态下泛化极快' },
  { id: 'multistep', name: 'Multi-Step (n=3)', gain: 48, desc: '向前看 3 步真实奖励再自举，信用回传速度飙升（消融贡献第一梯队！）' },
  { id: 'noisy', name: 'Noisy Nets', gain: 25, desc: '在全连接层权重注入可学习噪声，替代死板的 ε-greedy' },
  { id: 'c51', name: '分布式 RL (C51)', gain: 52, desc: '预测 51 个支撑原子上的完整回报分布 Z(s,a) 而非单一均值' },
] as const;

export function RainbowAblationLab() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    double: true,
    per: true,
    dueling: true,
    multistep: true,
    noisy: true,
    c51: true,
  });

  const baseDQN = 79; // 2015 Nature DQN Atari 57 中位数人类归一化得分约 79%
  const activeBonus = MODULES.reduce((acc, m) => acc + (enabled[m.id] ? m.gain : 0), 0);
  // 叠加协同增益示意（Rainbow 全开实测约 ~223%–230% 人类中位数）
  const score = Math.round(baseDQN + activeBonus * 0.72);

  // 对比「标量均值」vs「C51 双峰回报分布」
  const atoms = [0.02, 0.06, 0.14, 0.18, 0.09, 0.03, 0.02, 0.05, 0.14, 0.17, 0.08, 0.02];

  return (
    <div className="my-6 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm space-y-4 not-prose">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-bold">🌈 Rainbow 六大组件消融实验板 × C51 双峰分布直觉</div>
          <p className="text-xs text-muted-foreground mt-0.5">
            勾选或关闭任意组件，查看 DeepMind Rainbow 论文中「拿掉哪一块掉分最狠」（提示：试试关闭 PER、Multi-Step 和 C51！）。
          </p>
        </div>
        <span className="font-mono text-xs px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-500 font-bold">
          估算 Atari 中位得分：{score}% 人类水平
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
        {MODULES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setEnabled((prev) => ({ ...prev, [m.id]: !prev[m.id] }))}
            className={`text-left rounded-xl border p-3 transition-all ${
              enabled[m.id] ? 'border-indigo-500 bg-indigo-500/10' : 'border-border bg-background opacity-60'
            }`}
          >
            <div className="flex justify-between font-bold mb-1">
              <span>{enabled[m.id] ? '✅' : '⬜'} {m.name}</span>
              <span className="font-mono text-indigo-500">+{m.gain}</span>
            </div>
            <div className="text-[11px] text-muted-foreground leading-relaxed">{m.desc}</div>
          </button>
        ))}
      </div>

      {/* C51 分布式直方图 vs 标量均值 */}
      <div className="rounded-xl border border-border bg-background p-4 space-y-2">
        <div className="flex justify-between text-xs">
          <span className="font-bold">为什么 C51 预测“完整概率分布 Z(s,a)”比只预测均值 E[Z] 强得多？</span>
          <span className="font-mono text-amber-500">均值 E[Z] = 0.0（但真实结果要么大赚 +10、要么大亏 -10！）</span>
        </div>
        <div className="grid grid-cols-12 gap-1.5 items-end h-24 pt-2">
          {atoms.map((p, i) => (
            <div key={i} className="flex flex-col items-center justify-end h-full">
              <div
                style={{ height: `${Math.round(p * 380)}px` }}
                className={`w-full rounded-t ${enabled.c51 ? 'bg-gradient-to-t from-indigo-600 to-teal-400' : 'bg-zinc-600/40'}`}
              />
              <span className="text-[9px] font-mono text-muted-foreground mt-1">{-11 + i * 2}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
