'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Bot, RotateCcw, User } from 'lucide-react';
import {
  MC_GOAL_X,
  MC_MAX_V,
  MC_MAX_X,
  MC_MIN_X,
  mountainCarEnergyPolicy,
  mountainHeight,
  resetMountainCar,
  stepMountainCar,
  type MountainCarState,
} from '@/lib/rl';

export function MountainCarGame() {
  const [st, setSt] = useState<MountainCarState>(() => resetMountainCar(-0.5));
  const [driver, setDriver] = useState<'human' | 'ai'>('human');
  const [running, setRunning] = useState(false);
  const [phaseTrail, setPhaseTrail] = useState<[number, number][]>([[-0.5, 0]]);
  const [bestSteps, setBestSteps] = useState<number | null>(null);
  const actionRef = useRef<-1 | 0 | 1>(0);

  const reset = (nextDriver = driver, autoStart = false) => {
    setDriver(nextDriver);
    setSt(resetMountainCar(-0.5));
    setPhaseTrail([[-0.5, 0]]);
    actionRef.current = 0;
    setRunning(autoStart);
  };

  // 物理积分主循环 (30 Hz)
  useEffect(() => {
    if (!running || st.done) return;
    const id = setInterval(() => {
      setSt((prev) => {
        if (prev.done) return prev;
        const act = driver === 'ai' ? mountainCarEnergyPolicy(prev) : actionRef.current;
        const { state: next } = stepMountainCar(prev, act);
        setPhaseTrail((tr) => [...tr.slice(-160), [next.x, next.v]]);
        if (next.done) {
          setRunning(false);
          setBestSteps((b) => (b === null ? next.steps : Math.min(b, next.steps)));
        }
        return next;
      });
    }, 33);
    return () => clearInterval(id);
  }, [running, st.done, driver]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (driver !== 'human') return;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      e.preventDefault();
      actionRef.current = -1;
      if (!running && !st.done) setRunning(true);
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      e.preventDefault();
      actionRef.current = 1;
      if (!running && !st.done) setRunning(true);
    }
  };
  const onKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].includes(e.key)) actionRef.current = 0;
  };

  // 地形曲线 SVG 映射
  const xToPx = (x: number) => 30 + ((x - MC_MIN_X) / (MC_MAX_X - MC_MIN_X)) * 400;
  const yToPx = (y: number) => 115 - y * 78;
  const valleyPath = Array.from({ length: 73 }, (_, i) => {
    const x = MC_MIN_X + (i / 72) * (MC_MAX_X - MC_MIN_X);
    return `${xToPx(x).toFixed(1)},${yToPx(mountainHeight(x)).toFixed(1)}`;
  }).join(' ');

  const carX = xToPx(st.x);
  const carY = yToPx(mountainHeight(st.x));
  // 坡度切角（SVG y 向下）
  const slope = 3 * Math.cos(3 * st.x);
  const angleDeg = (-Math.atan(slope * 0.45) * 180) / Math.PI;

  return (
    <div
      tabIndex={0}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      className="my-6 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm space-y-4 outline-none focus:ring-2 focus:ring-indigo-500/50 not-prose"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-xs font-bold text-indigo-500">
              🚗 真实物理仿真小游戏 · Mountain Car 山地车
            </span>
            <span className="text-xs font-mono text-muted-foreground">连续状态 S = (位置 x, 速度 v)</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            先自己试试按住下方「向右油门」直接冲坡——引擎推力 (0.001) 小于重力 (0.0025)，你会卡死在半山腰！必须<strong>先倒车蓄势、荡秋千般冲顶</strong>，或一键看 RL 策略如何 105 步冲顶！
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
            <User className="w-3.5 h-3.5" /> 亲自驾驶
          </button>
          <button
            type="button"
            onClick={() => reset('ai', true)}
            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold border ${
              driver === 'ai' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-border bg-background'
            }`}
          >
            <Bot className="w-3.5 h-3.5" /> RL 能量泵接管
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
        {/* 左侧：真实山谷物理场景 */}
        <div className="lg:col-span-7 rounded-xl border border-border bg-zinc-950 p-3 space-y-2">
          <svg viewBox="0 0 460 220" className="w-full h-52">
            {/* 填充山体 */}
            <polygon points={`30,210 ${valleyPath} 430,210`} fill="rgba(56, 189, 248, 0.12)" />
            <polyline fill="none" stroke="#38bdf8" strokeWidth={3.5} points={valleyPath} />

            {/* 终点小旗 */}
            <g transform={`translate(${xToPx(MC_GOAL_X)}, ${yToPx(mountainHeight(MC_GOAL_X))})`}>
              <line x1={0} y1={0} x2={0} y2={-34} stroke="#facc15" strokeWidth={3} />
              <polygon points="0,-34 22,-26 0,-18" fill="#facc15" />
            </g>

            {/* 物理小车 */}
            <g transform={`translate(${carX}, ${carY - 9}) rotate(${angleDeg.toFixed(1)})`}>
              <rect x={-16} y={-9} width={32} height={14} rx={5} fill={driver === 'ai' ? '#10b981' : '#6366f1'} stroke="#fff" strokeWidth={1.8} />
              <circle cx={-9} cy={7} r={4.5} fill="#e2e8f0" />
              <circle cx={9} cy={7} r={4.5} fill="#e2e8f0" />
            </g>

            {/* 实时遥测角标 */}
            <text x={14} y={22} fill="#94a3b8" fontSize={11} fontFamily="monospace">
              步数 t = {st.steps} | x = {st.x.toFixed(3)} | v = {st.v >= 0 ? `+${st.v.toFixed(4)}` : st.v.toFixed(4)}
            </text>
            {st.done && (
              <text x={230} y={48} textAnchor="middle" fill="#fde047" fontSize={16} fontWeight={800}>
                🏁 成功冲顶！(耗时 {st.steps} 步，累积回报 -{st.steps})
              </text>
            )}
          </svg>

          {/* 触屏/鼠标按住油门控制条 */}
          {driver === 'human' && (
            <div className="flex items-center justify-center gap-3 pb-1">
              <button
                type="button"
                onPointerDown={() => {
                  actionRef.current = -1;
                  if (!running && !st.done) setRunning(true);
                }}
                onPointerUp={() => (actionRef.current = 0)}
                onPointerLeave={() => (actionRef.current = 0)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/50 hover:bg-indigo-500 hover:text-white text-indigo-300 px-4 py-2 text-xs font-bold select-none touch-none"
              >
                <ArrowLeft className="w-4 h-4" /> 按住向左加速 (←)
              </button>
              <button
                type="button"
                onPointerDown={() => {
                  actionRef.current = 1;
                  if (!running && !st.done) setRunning(true);
                }}
                onPointerUp={() => (actionRef.current = 0)}
                onPointerLeave={() => (actionRef.current = 0)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/50 hover:bg-indigo-500 hover:text-white text-indigo-300 px-4 py-2 text-xs font-bold select-none touch-none"
              >
                按住向右加速 (→) <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* 右侧：2D 相空间 (位置 x × 速度 v) 能量螺旋 */}
        <div className="lg:col-span-5 rounded-xl border border-border bg-background p-3.5 space-y-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="font-bold">相空间轨迹 (x, v)</span>
            <span className="text-muted-foreground">最佳冲顶：{bestSteps ?? '—'} 步</span>
          </div>
          <svg viewBox="0 0 260 190" className="w-full h-44 bg-zinc-950 rounded-lg border border-border">
            <line x1={20} y1={95} x2={245} y2={95} stroke="rgba(148,163,184,0.25)" strokeDasharray="3 3" />
            <line x1={225} y1={15} x2={225} y2={175} stroke="#facc15" strokeWidth={1.5} strokeDasharray="4 3" />
            <polyline
              fill="none"
              stroke={driver === 'ai' ? '#10b981' : '#818cf8'}
              strokeWidth={2.2}
              points={phaseTrail
                .map(([x, v]) => {
                  const px = 20 + ((x - MC_MIN_X) / (MC_MAX_X - MC_MIN_X)) * 220;
                  const py = 95 - (v / MC_MAX_V) * 76;
                  return `${px.toFixed(1)},${py.toFixed(1)}`;
                })
                .join(' ')}
            />
            <circle
              cx={20 + ((st.x - MC_MIN_X) / (MC_MAX_X - MC_MIN_X)) * 220}
              cy={95 - (st.v / MC_MAX_V) * 76}
              r={5}
              fill="#fde047"
            />
            <text x={24} y={24} fill="#94a3b8" fontSize={9} fontFamily="monospace">v = +0.07</text>
            <text x={24} y={176} fill="#94a3b8" fontSize={9} fontFamily="monospace">v = -0.07</text>
            <text x={218} y={24} textAnchor="end" fill="#fde047" fontSize={9} fontFamily="monospace">目标 x=0.5</text>
          </svg>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            注意观察相空间里向外盘旋的<strong>能量螺旋</strong>：因为 x 和 v 都是连续实数，表格法根本建不出表，必须靠瓦片编码或神经网络做函数近似！
          </p>
        </div>
      </div>
    </div>
  );
}
