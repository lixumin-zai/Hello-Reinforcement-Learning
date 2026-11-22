'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, Cpu, AlertCircle } from 'lucide-react';

interface GroupOutput {
  id: number;
  snippet: string;
  answer: string;
  acc: 0 | 1;
  fmt: 0 | 0.2;
}

const INITIAL_GROUP: GroupOutput[] = [
  { id: 1, snippet: '<think>2x = 19 - 7 = 12, x = 6</think>', answer: '\\boxed{6}', acc: 1, fmt: 0.2 },
  { id: 2, snippet: '<think>2x = 19 + 7 = 26, x = 13</think>', answer: '\\boxed{13}', acc: 0, fmt: 0.2 },
  { id: 3, snippet: '直接心算应该是 6 吧', answer: '6（无标签）', acc: 1, fmt: 0 },
  { id: 4, snippet: '<think>19-7=12, 验算 2×6+7=19 ✓</think>', answer: '\\boxed{6}', acc: 1, fmt: 0.2 },
  { id: 5, snippet: '<think>2x = 12, 等等 12/2=5?</think>', answer: '\\boxed{5}', acc: 0, fmt: 0.2 },
  { id: 6, snippet: '2x=19-7 → x=7', answer: '7（格式错）', acc: 0, fmt: 0 },
];

export function GRPOGroupLab() {
  const [groupSize, setGroupSize] = useState<4 | 6>(6);
  const [outputs, setOutputs] = useState<GroupOutput[]>(INITIAL_GROUP);

  const active = outputs.slice(0, groupSize);
  const rewards = active.map((o) => o.acc + o.fmt);
  const mean = rewards.reduce((a, b) => a + b, 0) / rewards.length;
  const variance = rewards.reduce((s, r) => s + (r - mean) ** 2, 0) / rewards.length;
  const std = Math.sqrt(variance);
  const zeroStd = std < 1e-6;

  const advantages = rewards.map((r) => (zeroStd ? 0 : (r - mean) / std));

  const toggleAcc = (id: number) =>
    setOutputs((prev) => prev.map((o) => (o.id === id ? { ...o, acc: o.acc ? 0 : 1 } : o)));
  const toggleFmt = (id: number) =>
    setOutputs((prev) => prev.map((o) => (o.id === id ? { ...o, fmt: o.fmt > 0 ? 0 : 0.2 } : o)));

  const setPreset = (mode: 'mixed' | 'all-pass' | 'all-fail') => {
    if (mode === 'mixed') setOutputs(INITIAL_GROUP);
    if (mode === 'all-pass') setOutputs(INITIAL_GROUP.map((o) => ({ ...o, acc: 1, fmt: 0.2 })));
    if (mode === 'all-fail') setOutputs(INITIAL_GROUP.map((o) => ({ ...o, acc: 0, fmt: 0 })));
  };

  return (
    <div className="my-6 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm space-y-4 not-prose">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-bold flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-emerald-500" />
            GRPO 组相对优势实战台：零 Critic 如何算出每条推理链的 Â_i？
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            题目：<code>2x + 7 = 19</code>。点击下方每条采样的“正确/格式”徽章实时改分，体验组内 Z-score 归一化与 <strong>全对/全错时 σ = 0 零梯度现象</strong>！
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <button
            type="button"
            onClick={() => setGroupSize(groupSize === 6 ? 4 : 6)}
            className="px-2.5 py-1 rounded-md border border-border bg-background font-mono font-semibold"
          >
            组大小 G = {groupSize}
          </button>
          <button
            type="button"
            onClick={() => setPreset('mixed')}
            className="px-2.5 py-1 rounded-md border border-border hover:bg-muted"
          >
            混合组
          </button>
          <button
            type="button"
            onClick={() => setPreset('all-pass')}
            className="px-2.5 py-1 rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-500 font-semibold"
          >
            全对 (σ=0)
          </button>
          <button
            type="button"
            onClick={() => setPreset('all-fail')}
            className="px-2.5 py-1 rounded-md border border-rose-500/40 bg-rose-500/10 text-rose-500 font-semibold"
          >
            全错 (σ=0)
          </button>
        </div>
      </div>

      {/* 组统计摘要条 */}
      <div className="grid grid-cols-3 gap-2.5 text-center font-mono text-xs">
        <div className="rounded-xl border border-border bg-background p-2.5">
          <div className="text-[10px] text-muted-foreground">组均值 μ = mean(r)</div>
          <div className="text-base font-extrabold text-indigo-500">{mean.toFixed(3)}</div>
        </div>
        <div className="rounded-xl border border-border bg-background p-2.5">
          <div className="text-[10px] text-muted-foreground">组标准差 σ = std(r)</div>
          <div className={`text-base font-extrabold ${zeroStd ? 'text-rose-500' : 'text-teal-500'}`}>{std.toFixed(3)}</div>
        </div>
        <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 p-2.5">
          <div className="text-[10px] text-emerald-500">显存省去 Critic</div>
          <div className="text-base font-extrabold text-emerald-500">4 模型 → 2 模型</div>
        </div>
      </div>

      {/* σ = 0 边界警告 */}
      {zeroStd && (
        <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-600 dark:text-amber-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <strong>触发 GRPO 经典边界（σ = 0 零优势陷阱）：</strong>本组所有样本得分完全一致，所有相对优势{' '}
            <code>Â_i = 0</code>，策略梯度瞬间归零！这正是 DAPO 引入 <em>Dynamic Sampling</em>（丢弃全对/全错 Prompt）的直接动机。
          </span>
        </div>
      )}

      {/* 组内采样列表 + 双向优势条 */}
      <div className="space-y-2">
        {active.map((o, idx) => {
          const r = rewards[idx];
          const adv = advantages[idx];
          const pct = Math.min(50, (Math.abs(adv) / 2.0) * 50);
          return (
            <div
              key={o.id}
              className="rounded-xl border border-border bg-background p-3 grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-center text-xs"
            >
              <div className="lg:col-span-5 space-y-0.5">
                <div className="font-mono text-[11px] text-muted-foreground">
                  Rollout o_{o.id} · 答案 <strong className="text-foreground">{o.answer}</strong>
                </div>
                <div className="font-mono text-[11px] truncate text-foreground/90">{o.snippet}</div>
              </div>

              <div className="lg:col-span-3 flex items-center gap-1.5 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={() => toggleAcc(o.id)}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border ${
                    o.acc
                      ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-500 font-bold'
                      : 'border-rose-500/40 bg-rose-500/10 text-rose-500'
                  }`}
                >
                  {o.acc ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  正确 {o.acc ? '+1.0' : '0.0'}
                </button>
                <button
                  type="button"
                  onClick={() => toggleFmt(o.id)}
                  className={`px-2 py-1 rounded-md border ${
                    o.fmt > 0
                      ? 'border-indigo-500/50 bg-indigo-500/15 text-indigo-500 font-bold'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  格式 {o.fmt > 0 ? '+0.2' : '0'}
                </button>
                <span className="ml-auto font-bold">r={r.toFixed(1)}</span>
              </div>

              {/* 双向相对优势条 */}
              <div className="lg:col-span-4 flex items-center gap-2 font-mono">
                <div className="flex-1 h-4 rounded-full bg-muted relative overflow-hidden">
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-500" />
                  {adv >= 0 ? (
                    <div
                      className="absolute top-0.5 bottom-0.5 bg-emerald-500 rounded-r-full"
                      style={{ left: '50%', width: `${pct}%` }}
                    />
                  ) : (
                    <div
                      className="absolute top-0.5 bottom-0.5 bg-rose-500 rounded-l-full"
                      style={{ right: '50%', width: `${pct}%` }}
                    />
                  )}
                </div>
                <span
                  className={`w-16 text-right font-extrabold ${
                    adv > 0.05 ? 'text-emerald-500' : adv < -0.05 ? 'text-rose-500' : 'text-muted-foreground'
                  }`}
                >
                  Â={adv >= 0 ? '+' : ''}
                  {adv.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
