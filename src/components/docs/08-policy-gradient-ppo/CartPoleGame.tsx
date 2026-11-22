'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Bot, RotateCcw, User } from 'lucide-react';
import {
  cartPoleSoftmaxProbRight,
  resetCartPole,
  stepCartPole,
  type CartPoleState,
} from '@/lib/rl';

export function CartPoleGame() {
  const [st, setSt] = useState<CartPoleState>(() => resetCartPole(0.05));
  const [driver, setDriver] = useState<'human' | 'ai'>('human');
  const [running, setRunning] = useState(false);
  const [bestHuman, setBestHuman] = useState(0);
  const [bestAI, setBestAI] = useState(0);
  const humanActRef = useRef<0 | 1>(1);

  const pRight = cartPoleSoftmaxProbRight(st);
  const pLeft = 1 - pRight;

  const reset = (nextDriver = driver, autoStart = false) => {
    setDriver(nextDriver);
    setSt(resetCartPole(nextDriver === 'ai' ? 0.08 : 0.04));
    setRunning(autoStart);
  };

  useEffect(() => {
    if (!running || st.done) return;
    const id = setInterval(() => {
      setSt((prev) => {
        if (prev.done) return prev;
        const pR = cartPoleSoftmaxProbRight(prev);
        const act: 0 | 1 = driver === 'ai' ? (pR >= 0.5 ? 1 : 0) : humanActRef.current;
        const { state: next } = stepCartPole(prev, act);
        if (driver === 'human') setBestHuman((b) => Math.max(b, next.steps));
        else setBestAI((b) => Math.max(b, next.steps));
        if (next.done || next.steps >= 500) setRunning(false);
        return next;
      });
    }, 24);
    return () => clearInterval(id);
  }, [running, st.done, driver]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (driver !== 'human') return;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      e.preventDefault();
      humanActRef.current = 0;
      if (!running && !st.done) setRunning(true);
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      e.preventDefault();
      humanActRef.current = 1;
      if (!running && !st.done) setRunning(true);
    }
  };

  const cartX = 240 + (st.x / 2.4) * 190;
  const poleLen = 96;
  const tipX = cartX + Math.sin(st.theta) * poleLen;
  const tipY = 148 - Math.cos(st.theta) * poleLen;
  const angleDeg = (st.theta * 180) / Math.PI;

  return (
    <div
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="my-6 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm space-y-4 outline-none focus:ring-2 focus:ring-indigo-500/50 not-prose"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-xs font-bold text-indigo-500">
              ⚖️ 真实物理小游戏 · CartPole 倒立摆平衡挑战
            </span>
            <span className="text-xs font-mono text-muted-foreground">4 维连续状态 (x, ẋ, θ, θ̇)</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            杆子偏角超过 ±12° 或小车出界即告失败！先点击「亲自顶杆」按左右方向键挑战能撑几步，再切换「策略梯度 π_θ 接管」看它如何丝滑稳住 500 步满分！
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => reset('human', true)}
            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold border ${
              driver === 'human' ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-border bg-background'
            }`}
          >
            <User className="w-3.5 h-3.5" /> 亲自顶杆
          </button>
          <button
            type="button"
            onClick={() => reset('ai', true)}
            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold border ${
              driver === 'ai' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-border bg-background'
            }`}
          >
            <Bot className="w-3.5 h-3.5" /> 策略梯度 π_θ 接管
          </button>
          <button
            type="button"
            onClick={() => reset(driver, false)}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground"
          >
            <RotateCcw className="w-3.5 h-3.5" /> 重置
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* 左侧物理轨道 */}
        <div className="lg:col-span-7 rounded-xl border border-border bg-zinc-950 p-3 space-y-2">
          <svg viewBox="0 0 480 205" className="w-full h-48">
            {/* 边界线 */}
            <line x1={48} y1={164} x2={432} y2={164} stroke="#475569" strokeWidth={4} strokeLinecap="round" />
            <line x1={50} y1={144} x2={50} y2={182} stroke="#f43f5e" strokeWidth={2} strokeDasharray="3 3" />
            <line x1={430} y1={144} x2={430} y2={182} stroke="#f43f5e" strokeWidth={2} strokeDasharray="3 3" />

            {/* ±12° 安全锥 */}
            <line x1={cartX} y1={148} x2={cartX - 24} y2={48} stroke="rgba(244,63,94,0.22)" strokeDasharray="4 4" />
            <line x1={cartX} y1={148} x2={cartX + 24} y2={48} stroke="rgba(244,63,94,0.22)" strokeDasharray="4 4" />

            {/* 小车 */}
            <rect
              x={cartX - 28}
              y={144}
              width={56}
              height={22}
              rx={6}
              fill={driver === 'ai' ? '#10b981' : '#6366f1'}
              stroke="#fff"
              strokeWidth={2}
            />

            {/* 倒立摆杆 */}
            <line
              x1={cartX}
              y1={148}
              x2={tipX}
              y2={tipY}
              stroke={st.done ? '#f43f5e' : '#facc15'}
              strokeWidth={7}
              strokeLinecap="round"
            />
            <circle cx={cartX} cy={148} r={6} fill="#fff" />

            <text x={14} y={22} fill="#cbd5e1" fontSize={11} fontFamily="monospace">
              存活步数 = {st.steps} / 500 | 倾角 θ = {angleDeg >= 0 ? `+${angleDeg.toFixed(1)}°` : `${angleDeg.toFixed(1)}°`}
            </text>
            {st.done && (
              <text x={240} y={44} textAnchor="middle" fill="#fb7185" fontSize={15} fontWeight={800}>
                💥 杆子倒了！本局坚持 {st.steps} 步
              </text>
            )}
            {!st.done && st.steps >= 500 && (
              <text x={240} y={44} textAnchor="middle" fill="#34d399" fontSize={15} fontWeight={800}>
                🏆 500 步满分通关！
              </text>
            )}
          </svg>

          {driver === 'human' && (
            <div className="flex justify-center gap-3 pb-1">
              <button
                type="button"
                onClick={() => {
                  humanActRef.current = 0;
                  if (!running && !st.done) setRunning(true);
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/20 border border-indigo-500/50 hover:bg-indigo-500 hover:text-white text-indigo-300 px-4 py-2 text-xs font-bold"
              >
                <ArrowLeft className="w-4 h-4" /> 向左推车 (←)
              </button>
              <button
                type="button"
                onClick={() => {
                  humanActRef.current = 1;
                  if (!running && !st.done) setRunning(true);
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/20 border border-indigo-500/50 hover:bg-indigo-500 hover:text-white text-indigo-300 px-4 py-2 text-xs font-bold"
              >
                向右推车 (→) <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* 右侧：随机策略输出概率 π_θ(a | s) 实时仪表 */}
        <div className="lg:col-span-5 rounded-xl border border-border bg-background p-4 space-y-3 text-xs font-mono">
          <div className="font-bold text-sm text-foreground">实时随机策略分布 π_θ(a | S_t)</div>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between mb-1">
                <span>π_θ(向左 | s)</span>
                <strong className="text-sky-500">{(pLeft * 100).toFixed(1)}%</strong>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div style={{ width: `${(pLeft * 100).toFixed(1)}%` }} className="h-full bg-sky-500" />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>π_θ(向右 | s)</span>
                <strong className="text-emerald-500">{(pRight * 100).toFixed(1)}%</strong>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div style={{ width: `${(pRight * 100).toFixed(1)}%` }} className="h-full bg-emerald-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border text-center">
            <div className="rounded-lg bg-muted/50 p-2">
              <div className="text-[10px] text-muted-foreground">你的最佳纪录</div>
              <div className="text-base font-extrabold text-indigo-500">{bestHuman} 步</div>
            </div>
            <div className="rounded-lg bg-muted/50 p-2">
              <div className="text-[10px] text-muted-foreground">π_θ AI 纪录</div>
              <div className="text-base font-extrabold text-emerald-500">{bestAI} 步</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
