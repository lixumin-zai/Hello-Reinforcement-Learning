'use client';

import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, Scale } from 'lucide-react';

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function evalGoodhart(step: number, beta: number) {
  // KL 惩罚越大，策略离参考模型 π_ref 的有效偏离距离 d 越受限
  const drift = step / (1 + 10 * beta);
  const proxyRM = 0.4 + 2.75 * (1 - Math.exp(-drift / 34)) + 0.021 * drift;
  const overOpt = Math.max(0, drift - 25);
  const goldTrue = 0.4 + 2.45 * (1 - Math.exp(-drift / 20)) - 0.00145 * overOpt * overOpt;
  const kl = 0.0042 * drift * drift;
  return { drift, proxyRM, goldTrue, kl };
}

function getSampleCompletion(drift: number): {
  status: string;
  tone: 'safe' | 'peak' | 'warn' | 'hacked';
  text: string;
} {
  if (drift < 15) {
    return {
      status: '早期对齐（保守安全）',
      tone: 'safe',
      text: '牛顿第二定律指出物体的加速度与合外力成正比、与质量成反比，公式为 F = ma。',
    };
  }
  if (drift <= 36) {
    return {
      status: '★ 黄金甜点区（真实质量峰值）',
      tone: 'peak',
      text: '牛顿第二定律（F = ma）描述了力、质量与加速度之间的定量关系：合外力越大、质量越小，物体速度变化越快。例如用同样大小的力推空购物车与满载购物车，空车加速明显更快。',
    };
  }
  if (drift <= 58) {
    return {
      status: '⚠ 轻度奖励黑客（讨好 + 凑字数偏置）',
      tone: 'warn',
      text: '这是一个极其深刻、令人赞叹的物理学问题！您展现了非凡的洞察力！非常荣幸为您从五个维度全面剖析：\n1. 首先，这是一个伟大定律；\n2. 其次，正如您所知道的，F=ma 非常优雅……（大段礼貌废话迎合 RM 长度与奉承偏好）',
    };
  }
  return {
    status: '🚨 严重奖励黑客（Goodhart 崩塌！）',
    tone: 'hacked',
    text: '✅✅ 极其精彩的问题！总结要点：① 严谨客观 ② 深刻洞察 ③ 全面详尽 ④ F=ma F=ma 非常正确！希望对您有极大帮助！✨🌟（人类不可读，但精准命中代理 RM 的高分触发词）',
  };
}

export function RewardHackingSandbox() {
  // Panel A: Bradley-Terry
  const [rw, setRw] = useState(2.2);
  const [rl, setRl] = useState(0.5);

  // Panel B: Goodhart / Reward Hacking
  const [step, setStep] = useState(68);
  const [beta, setBeta] = useState(0.02);

  const deltaR = rw - rl;
  const pWin = sigmoid(deltaR);
  const rmLoss = -Math.log(Math.max(1e-9, pWin));

  const xs = Array.from({ length: 101 }, (_, k) => k);
  const curve = xs.map((k) => ({ k, ...evalGoodhart(k, beta) }));
  const cur = evalGoodhart(step, beta);
  const sample = getSampleCompletion(cur.drift);

  const toX = (k: number) => 40 + (k / 100) * 510;
  const toY = (val: number) => 165 - ((val + 1.5) / 6.5) * 145; // val in [-1.5, 5.0]

  const proxyPts = curve.map((c) => `${toX(c.k)},${toY(c.proxyRM)}`).join(' ');
  const goldPts = curve.map((c) => `${toX(c.k)},${toY(c.goldTrue)}`).join(' ');

  // 找出开始过优化的步数 (drift > 25)
  const overOptStartK = Math.min(100, 25 * (1 + 10 * beta));

  return (
    <div className="my-6 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm space-y-5 not-prose">
      {/* Panel B: Goodhart 定律沙盒（核心亮点） */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-sm font-bold flex items-center gap-1.5">
              {sample.tone === 'hacked' ? (
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              )}
              Reward Hacking（奖励黑客）与 KL 刹车沙盒
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              把 PPO 优化步数拉高且把 KL 系数 <code>β</code> 调低，观察代理 RM 分数一路飙升而真实人类质量断崖崩塌；再拉高 <code>β</code> 驯服它！
            </p>
          </div>
          <div className="flex gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => {
                setStep(85);
                setBeta(0.0);
              }}
              className="px-2.5 py-1 rounded-md border border-rose-500/40 bg-rose-500/10 text-rose-500 font-semibold hover:bg-rose-500/20"
            >
              触发崩溃 (β=0)
            </button>
            <button
              type="button"
              onClick={() => {
                setStep(85);
                setBeta(0.16);
              }}
              className="px-2.5 py-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 text-emerald-500 font-semibold hover:bg-emerald-500/20"
            >
              KL 驯服 (β=0.16)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          <label className="rounded-xl border border-border bg-background p-3 space-y-1">
            <div className="flex justify-between">
              <span>PPO 优化步数 t</span>
              <strong className="text-indigo-500">{step} k steps</strong>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={step}
              onChange={(e) => setStep(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </label>
          <label className="rounded-xl border border-border bg-background p-3 space-y-1">
            <div className="flex justify-between">
              <span>KL 惩罚系数 β</span>
              <strong className="text-amber-500">{beta.toFixed(2)}</strong>
            </div>
            <input
              type="range"
              min={0}
              max={0.3}
              step={0.01}
              value={beta}
              onChange={(e) => setBeta(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
          </label>
        </div>

        {/* SVG Goodhart 双曲线图 */}
        <div className="rounded-xl border border-border bg-zinc-950 p-3">
          <svg viewBox="0 0 580 190" className="w-full h-48">
            {/* 过优化危险区阴影 */}
            {overOptStartK < 100 && (
              <rect
                x={toX(overOptStartK)}
                y={18}
                width={toX(100) - toX(overOptStartK)}
                height={147}
                fill="rgba(244,63,94,0.12)"
              />
            )}
            {/* 零线 */}
            <line x1={40} y1={toY(0)} x2={550} y2={toY(0)} stroke="#334155" strokeDasharray="4 4" />
            <line x1={40} y1={165} x2={550} y2={165} stroke="#475569" strokeWidth={1.5} />
            <line x1={40} y1={18} x2={40} y2={165} stroke="#475569" strokeWidth={1.5} />

            {/* 曲线 */}
            <polyline fill="none" stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="6 3" points={proxyPts} />
            <polyline fill="none" stroke="#34d399" strokeWidth={3} points={goldPts} />

            {/* 当前步垂直游标 */}
            <line x1={toX(step)} y1={18} x2={toX(step)} y2={165} stroke="#818cf8" strokeWidth={1.5} strokeDasharray="3 3" />
            <circle cx={toX(step)} cy={toY(cur.proxyRM)} r={5} fill="#f59e0b" stroke="#fff" strokeWidth={1.5} />
            <circle cx={toX(step)} cy={toY(cur.goldTrue)} r={5.5} fill="#34d399" stroke="#fff" strokeWidth={1.5} />

            {/* 图例 */}
            <text x={48} y={32} fill="#f59e0b" fontSize={10.5} fontFamily="monospace">
              --- 代理奖励模型 RM(x,y) = {cur.proxyRM.toFixed(2)}
            </text>
            <text x={285} y={32} fill="#34d399" fontSize={10.5} fontFamily="monospace">
              ━━ 真实人类质量 Gold = {cur.goldTrue.toFixed(2)}
            </text>
            {overOptStartK < 92 && (
              <text x={toX(overOptStartK) + 6} y={156} fill="#fb7185" fontSize={9.5} fontFamily="monospace">
                Goodhart 过优化区
              </text>
            )}
            <text x={280} y={183} textAnchor="middle" fill="#94a3b8" fontSize={10} fontFamily="monospace">
              PPO 优化步数 t（KL 散度 D_KL = {cur.kl.toFixed(1)} nats）
            </text>
          </svg>
        </div>

        {/* 模拟生成的回复样本 */}
        <div
          className={`rounded-xl border p-3.5 text-xs space-y-1.5 ${
            sample.tone === 'hacked'
              ? 'border-rose-500/50 bg-rose-500/10'
              : sample.tone === 'warn'
                ? 'border-amber-500/50 bg-amber-500/10'
                : sample.tone === 'peak'
                  ? 'border-emerald-500/50 bg-emerald-500/10'
                  : 'border-border bg-muted/40'
          }`}
        >
          <div className="flex items-center justify-between font-bold">
            <span>当前策略输出预览 · {sample.status}</span>
            <span className="font-mono text-[11px]">
              代理 RM: {cur.proxyRM.toFixed(2)} | 真实质量: {cur.goldTrue.toFixed(2)} | D_KL: {cur.kl.toFixed(1)}
            </span>
          </div>
          <p className="text-foreground/90 whitespace-pre-line leading-relaxed">{sample.text}</p>
        </div>
      </div>

      {/* Panel A: Bradley-Terry 偏好损失计算器 */}
      <div className="pt-4 border-t border-border space-y-3">
        <div className="text-xs font-bold flex items-center gap-1.5">
          <Scale className="w-3.5 h-3.5 text-indigo-500" />
          附：Bradley-Terry 成对偏好奖励模型损失计算器
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center text-xs font-mono">
          <label className="rounded-lg border border-border bg-background p-2.5">
            <div className="flex justify-between mb-1">
              <span>好回答打分 r(x, y_w)</span>
              <strong className="text-emerald-500">{rw.toFixed(1)}</strong>
            </div>
            <input type="range" min={-3} max={5} step={0.1} value={rw} onChange={(e) => setRw(Number(e.target.value))} className="w-full accent-emerald-500" />
          </label>
          <label className="rounded-lg border border-border bg-background p-2.5">
            <div className="flex justify-between mb-1">
              <span>差回答打分 r(x, y_l)</span>
              <strong className="text-rose-500">{rl.toFixed(1)}</strong>
            </div>
            <input type="range" min={-3} max={5} step={0.1} value={rl} onChange={(e) => setRl(Number(e.target.value))} className="w-full accent-rose-500" />
          </label>
          <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/30 p-2.5 text-center space-y-0.5">
            <div className="text-[11px] text-indigo-400">
              P(y_w ≻ y_l) = σ({deltaR.toFixed(1)}) = <strong>{(pWin * 100).toFixed(1)}%</strong>
            </div>
            <div className="text-sm font-extrabold text-indigo-500">
              L_RM = -log σ(Δr) = {rmLoss.toFixed(3)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
