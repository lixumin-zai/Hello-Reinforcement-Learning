'use client';

import React, { useState } from 'react';
import { ChevronRight, RotateCcw, Sparkles } from 'lucide-react';

interface VocabCandidate {
  token: string;
  pTheta: number;
  pRef: number;
}

interface TokenStep {
  chosen: string;
  chosenRef: string;
  candidates: VocabCandidate[];
  note: string;
}

const PROMPT = '计算: (17 + 8) × 3 = ?';

const STEPS: TokenStep[] = [
  {
    chosen: '<think>',
    chosenRef: '答案',
    candidates: [
      { token: '<think>', pTheta: 0.82, pRef: 0.14 },
      { token: '答案', pTheta: 0.08, pRef: 0.46 },
      { token: '首先', pTheta: 0.05, pRef: 0.22 },
      { token: '让我', pTheta: 0.03, pRef: 0.11 },
      { token: '25', pTheta: 0.02, pRef: 0.07 },
    ],
    note: 'RL 后训练让模型倾向先开启思考标签 <think> 进行显式推理，单步 KL 偏移较大。',
  },
  {
    chosen: '先算括号:',
    chosenRef: '是',
    candidates: [
      { token: '先算括号:', pTheta: 0.71, pRef: 0.38 },
      { token: '17+8', pTheta: 0.16, pRef: 0.32 },
      { token: '按优先级', pTheta: 0.07, pRef: 0.16 },
      { token: '直接乘', pTheta: 0.04, pRef: 0.09 },
      { token: '嗯', pTheta: 0.02, pRef: 0.05 },
    ],
    note: '状态 s_1 确定性地拼接了新 Token，无环境随机转移：s_{t+1} = s_t ⊕ a_t。',
  },
  {
    chosen: '17+8=25',
    chosenRef: '17+8=25',
    candidates: [
      { token: '17+8=25', pTheta: 0.93, pRef: 0.86 },
      { token: '17+8=24', pTheta: 0.03, pRef: 0.07 },
      { token: '17+8=26', pTheta: 0.02, pRef: 0.04 },
      { token: '25', pTheta: 0.01, pRef: 0.02 },
      { token: '等于25', pTheta: 0.01, pRef: 0.01 },
    ],
    note: '基础算术步骤上 π_θ 与 π_ref 高度一致，单步 KL 散度几乎为 0，语言流畅度得以保留。',
  },
  {
    chosen: '，再算',
    chosenRef: '，乘3',
    candidates: [
      { token: '，再算', pTheta: 0.64, pRef: 0.48 },
      { token: '，然后', pTheta: 0.21, pRef: 0.28 },
      { token: '，乘3', pTheta: 0.09, pRef: 0.15 },
      { token: '；', pTheta: 0.04, pRef: 0.06 },
      { token: '因此', pTheta: 0.02, pRef: 0.03 },
    ],
    note: '中间 Token 的外部环境奖励全为 0（极度稀疏！），仅靠单步 KL 惩罚提供软正则信号。',
  },
  {
    chosen: '25×3=75',
    chosenRef: '25×3=75',
    candidates: [
      { token: '25×3=75', pTheta: 0.91, pRef: 0.78 },
      { token: '25×3=65', pTheta: 0.03, pRef: 0.10 },
      { token: '25×3=85', pTheta: 0.03, pRef: 0.07 },
      { token: '75', pTheta: 0.02, pRef: 0.03 },
      { token: '约75', pTheta: 0.01, pRef: 0.02 },
    ],
    note: 'RL 策略把正确算式 25×3=75 的概率从 78% 抬升到 91%，大幅压低了粗心错算的概率。',
  },
  {
    chosen: '</think>',
    chosenRef: '。',
    candidates: [
      { token: '</think>', pTheta: 0.89, pRef: 0.18 },
      { token: '，复核一下', pTheta: 0.06, pRef: 0.11 },
      { token: '。', pTheta: 0.03, pRef: 0.52 },
      { token: '所以', pTheta: 0.01, pRef: 0.12 },
      { token: '<EOS>', pTheta: 0.01, pRef: 0.07 },
    ],
    note: '规范闭合思维链标签 </think>，准备输出可供验证器解析的最终答案。',
  },
  {
    chosen: '答案: 75 <EOS>',
    chosenRef: '答案: 75 <EOS>',
    candidates: [
      { token: '答案: 75 <EOS>', pTheta: 0.95, pRef: 0.72 },
      { token: '75 <EOS>', pTheta: 0.03, pRef: 0.16 },
      { token: '答案: 65 <EOS>', pTheta: 0.01, pRef: 0.06 },
      { token: '大约是 75', pTheta: 0.005, pRef: 0.04 },
      { token: '无法确定', pTheta: 0.005, pRef: 0.02 },
    ],
    note: '触发终结符 <EOS>！验证器或奖励模型在最后一步一次性发放终局稀疏奖励 R_T = +1.00！',
  },
];

export function TokenMDPSimulator() {
  const [stepIdx, setStepIdx] = useState(0);
  const [beta, setBeta] = useState(0.05);

  const cur = STEPS[stepIdx];
  const chosenCand = cur.candidates[0];

  const klTrace = STEPS.slice(0, stepIdx + 1).map((s, idx) => {
    const c = s.candidates[0];
    const logRatio = Math.log(c.pTheta / c.pRef);
    const klPenalty = -beta * logRatio;
    const isTerminal = idx === STEPS.length - 1;
    const extReward = isTerminal ? 1.0 : 0.0;
    return {
      step: idx,
      token: c.token,
      logRatio,
      klPenalty,
      extReward,
      totalReward: extReward + klPenalty,
    };
  });

  const cumKL = klTrace.reduce((s, r) => s + r.logRatio, 0);
  const totalReturn = klTrace.reduce((s, r) => s + r.totalReward, 0);

  return (
    <div className="my-6 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm space-y-4 not-prose">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-bold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            Token 级 MDP 生成透视器：逐词元拆解状态、词表动作与稀疏奖励
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            动作空间大小 <code>|V| ≈ 128,256</code>，每生成一个 Token 就是一次确定性状态转移，直到 <code>&lt;EOS&gt;</code> 才收到终局奖励。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStepIdx((i) => Math.min(STEPS.length - 1, i + 1))}
            disabled={stepIdx >= STEPS.length - 1}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-40"
          >
            生成下一步 Token <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setStepIdx(0)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border border-border hover:bg-muted"
          >
            <RotateCcw className="w-3.5 h-3.5" /> 重置
          </button>
        </div>
      </div>

      {/* 步骤快捷跳转 + β 控制 */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap gap-1.5">
          {STEPS.map((s, idx) => (
            <button
              key={s.chosen}
              type="button"
              onClick={() => setStepIdx(idx)}
              className={`px-2 py-1 rounded-md border transition-colors ${
                idx === stepIdx
                  ? 'border-emerald-500 bg-emerald-500/15 text-emerald-500 font-bold'
                  : idx < stepIdx
                    ? 'border-border bg-muted/60 text-foreground'
                    : 'border-border text-muted-foreground hover:bg-muted/30'
              }`}
            >
              t={idx}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2">
          <span className="text-muted-foreground">KL 系数 β =</span>
          <strong className="text-amber-500 w-10">{beta.toFixed(2)}</strong>
          <input
            type="range"
            min={0.01}
            max={0.25}
            step={0.01}
            value={beta}
            onChange={(e) => setBeta(Number(e.target.value))}
            className="w-24 accent-amber-500"
          />
        </label>
      </div>

      {/* 状态前缀 s_t 展示区 */}
      <div className="rounded-xl border border-border bg-zinc-950 p-4 space-y-2">
        <div className="text-[11px] font-mono text-zinc-400">
          当前状态 s_{stepIdx} = (Prompt x, 已生成前缀 y_{'<'}t) → 本步动作 a_{stepIdx} 拼接为 s_{stepIdx + 1}：
        </div>
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
          <span className="px-2.5 py-1 rounded-md bg-indigo-500/20 border border-indigo-400/40 text-indigo-300">
            [Prompt] {PROMPT}
          </span>
          {STEPS.slice(0, stepIdx).map((s, idx) => (
            <span key={idx} className="px-2 py-1 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-200">
              {s.chosen}
            </span>
          ))}
          <span className="px-2.5 py-1 rounded-md bg-emerald-500/25 border-2 border-emerald-400 text-emerald-300 font-bold shadow-sm">
            + a_{stepIdx}: {cur.chosen}
          </span>
        </div>
        <div className="text-xs text-emerald-400/90 pt-1">{cur.note}</div>
      </div>

      {/* 左右双栏：Top-5 词表概率对比 + 每步稀疏奖励/KL 轨迹 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 rounded-xl border border-border bg-background p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span>词表 Top-5 候选动作概率：π_θ (绿) vs π_ref (灰)</span>
            <span className="font-mono text-[11px] text-muted-foreground">t = {stepIdx}</span>
          </div>
          <div className="space-y-2">
            {cur.candidates.map((cand, i) => {
              const isSelected = i === 0;
              return (
                <div key={cand.token} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className={isSelected ? 'text-emerald-500 font-bold' : 'text-foreground'}>
                      {isSelected ? '▶ ' : '  '}
                      {cand.token}
                    </span>
                    <span className="text-muted-foreground">
                      π_θ <strong className="text-emerald-500">{(cand.pTheta * 100).toFixed(1)}%</strong> · π_ref{' '}
                      {(cand.pRef * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden relative">
                    <div
                      className="absolute inset-y-0 left-0 bg-zinc-400/45 rounded-full"
                      style={{ width: `${cand.pRef * 100}%` }}
                    />
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full ${
                        isSelected ? 'bg-emerald-500/85' : 'bg-indigo-500/60'
                      }`}
                      style={{ width: `${cand.pTheta * 100}%`, height: '55%' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 rounded-xl border border-border bg-background p-4 flex flex-col justify-between space-y-3">
          <div className="text-xs font-semibold">每步实际奖励 r_t = R_ext - β·log(π_θ / π_ref)</div>
          <div className="space-y-1.5 font-mono text-[11px] max-h-44 overflow-y-auto">
            {klTrace.map((row) => (
              <div
                key={row.step}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border ${
                  row.extReward > 0
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-500 font-bold'
                    : 'border-border bg-muted/30'
                }`}
              >
                <span className="truncate max-w-[115px]">
                  t={row.step} {row.token}
                </span>
                <span>
                  ext:{row.extReward > 0 ? '+1.0' : '0.0'} | kl:{row.klPenalty.toFixed(3)}
                </span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border text-xs font-mono">
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-2 text-center">
              <div className="text-[10px] text-amber-500">累计 KL 偏离</div>
              <div className="font-bold text-amber-500">{cumKL.toFixed(2)} nats</div>
            </div>
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2 text-center">
              <div className="text-[10px] text-emerald-500">当前累计回报 G_0</div>
              <div className="font-bold text-emerald-500">
                {totalReturn >= 0 ? '+' : ''}
                {totalReturn.toFixed(3)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 单步 KL 公式即时代入 */}
      <div className="rounded-xl bg-muted/50 px-3.5 py-2.5 text-xs font-mono text-muted-foreground">
        本步对数概率比：log(π_θ / π_ref) = log({chosenCand.pTheta.toFixed(2)} / {chosenCand.pRef.toFixed(2)}) ={' '}
        <strong className="text-foreground">{Math.log(chosenCand.pTheta / chosenCand.pRef).toFixed(3)}</strong>
        {' · '}KL 惩罚项 = <strong className="text-amber-500">{(-beta * Math.log(chosenCand.pTheta / chosenCand.pRef)).toFixed(4)}</strong>
      </div>
    </div>
  );
}
