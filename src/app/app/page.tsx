'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, RotateCcw, Sparkles, BookOpen, Film, Sliders } from 'lucide-react';
import {
  ACTION_ARROWS,
  GridWorld,
  PRESETS,
  greedyPath,
  movingAverage,
  trainTD,
  valueIteration,
  valueToColor,
  type TDAlgorithm,
} from '@/lib/rl';
import { ThemeToggle } from '@/components/ThemeToggle';

type EnvKey = 'simple' | 'classic' | 'cliff' | 'maze';
type Mode = 'dp-vi' | 'q-learning' | 'sarsa' | 'expected-sarsa';

const ENV_LABELS: Record<EnvKey, { name: string; desc: string }> = {
  simple: { name: '5×5 避障网格', desc: '确定性转移，适合观察价值传播与最短路径' },
  classic: { name: '4×3 经典世界 (含陷阱/打滑)', desc: 'Russell & Norvig 经典带随机打滑网格' },
  cliff: { name: '4×12 悬崖行走 (Cliff Walking)', desc: '对比 SARSA 安全路线 vs Q-learning 贴崖最优路线' },
  maze: { name: '6×9 迷宫 (Dyna Maze)', desc: '多障碍长路径规划基准环境' },
};

export default function RLLabPage() {
  const [envKey, setEnvKey] = useState<EnvKey>('simple');
  const [mode, setMode] = useState<Mode>('dp-vi');
  const [gamma, setGamma] = useState(0.92);
  const [alpha, setAlpha] = useState(0.4);
  const [epsilon, setEpsilon] = useState(0.12);
  const [episodes, setEpisodes] = useState(250);
  const [seed, setSeed] = useState(42);
  const [iterCursor, setIterCursor] = useState<number | null>(null);

  const env = useMemo(() => new GridWorld(PRESETS[envKey]()), [envKey]);

  const dpHistory = useMemo(() => valueIteration(env, gamma, 1e-4, 60), [env, gamma]);

  const tdResult = useMemo(() => {
    if (mode === 'dp-vi') return null;
    return trainTD(env, {
      algorithm: mode as TDAlgorithm,
      alpha,
      gamma,
      epsilon,
      episodes,
      seed,
    });
  }, [env, mode, alpha, gamma, epsilon, episodes, seed]);

  // 当前展示的状态价值与贪心策略
  const { V, Q, policy, maxStep, currentStep } = useMemo(() => {
    if (mode === 'dp-vi') {
      const maxS = dpHistory.length - 1;
      const idx = iterCursor === null ? maxS : Math.min(maxS, iterCursor);
      const snap = dpHistory[idx];
      return { V: snap.V, Q: null, policy: snap.policy, maxStep: maxS, currentStep: idx };
    }
    const maxS = tdResult!.snapshots.length - 1;
    const idx = iterCursor === null ? maxS : Math.min(maxS, iterCursor);
    const qSnap = tdResult!.snapshots[idx];
    const vFromQ = qSnap.map((row) => Math.max(...row));
    const pol = qSnap.map((row) => row.indexOf(Math.max(...row)));
    return { V: vFromQ, Q: qSnap, policy: pol, maxStep: maxS, currentStep: idx };
  }, [mode, dpHistory, tdResult, iterCursor]);

  const pathSet = useMemo(() => {
    if (Q) return new Set(greedyPath(env, Q));
    const synthQ = Array.from({ length: env.nS }, (_, s) =>
      Array.from({ length: 4 }, (__, a) => (policy[s] === a ? 1 : 0)),
    );
    return new Set(greedyPath(env, synthQ));
  }, [env, Q, policy]);

  const maxAbs = useMemo(() => Math.max(1, ...V.map((v) => Math.abs(v))), [V]);
  const smoothedReturns = useMemo(
    () => (tdResult ? movingAverage(tdResult.episodeReturns, 15) : []),
    [tdResult],
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* 顶部栏 */}
      <header className="border-b border-border bg-card/70 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Link>
          <span className="text-border">|</span>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span className="font-bold text-sm">RL 交互实验室 (Interactive GridWorld & TD Sandbox)</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/motion"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
          >
            <Film className="w-3.5 h-3.5 text-indigo-500" />
            动效工作台
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            教程文档
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl w-full mx-auto p-6">
        {/* 左侧控制面板 */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Sliders className="w-4 h-4 text-indigo-500" />
              环境与算法配置
            </div>

            {/* 选择环境 */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">1. 选择基准环境</label>
              <div className="grid grid-cols-1 gap-1.5">
                {(Object.keys(ENV_LABELS) as EnvKey[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      setEnvKey(k);
                      setIterCursor(null);
                    }}
                    className={`text-left rounded-lg border px-3 py-2 transition-colors ${
                      envKey === k
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-border bg-background hover:bg-muted/60'
                    }`}
                  >
                    <div className="text-xs font-semibold">{ENV_LABELS[k].name}</div>
                    <div className="text-[11px] text-muted-foreground">{ENV_LABELS[k].desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 选择算法 */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">2. 选择求解算法</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'dp-vi', label: '价值迭代 (DP)' },
                  { id: 'q-learning', label: 'Q-learning' },
                  { id: 'sarsa', label: 'SARSA' },
                  { id: 'expected-sarsa', label: 'Expected SARSA' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setMode(m.id as Mode);
                      setIterCursor(null);
                    }}
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                      mode === m.id
                        ? 'border-indigo-500 bg-indigo-500 text-white'
                        : 'border-border bg-background hover:bg-muted'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 超参数滑块 */}
            <div className="space-y-3 pt-2 border-t border-border text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">折扣因子 γ (Discount)</span>
                  <span className="font-mono font-bold">{gamma.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={0.99}
                  step={0.01}
                  value={gamma}
                  onChange={(e) => setGamma(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              {mode !== 'dp-vi' && (
                <>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">学习率 α (Step Size)</span>
                      <span className="font-mono font-bold">{alpha.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min={0.05}
                      max={0.9}
                      step={0.05}
                      value={alpha}
                      onChange={(e) => setAlpha(Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">探索率 ε (ε-greedy)</span>
                      <span className="font-mono font-bold">{epsilon.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min={0.01}
                      max={0.4}
                      step={0.01}
                      value={epsilon}
                      onChange={(e) => setEpsilon(Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">训练回合数 (Episodes)</span>
                      <span className="font-mono font-bold">{episodes}</span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={600}
                      step={25}
                      value={episodes}
                      onChange={(e) => setEpisodes(Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setSeed((s) => s + 1)}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background py-2 text-xs font-semibold hover:bg-muted transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    更换随机种子重训 (seed = {seed})
                  </button>
                </>
              )}
            </div>
          </div>
        </aside>

        {/* 右侧：网格可视化 + 过程回放滑块 + 学习曲线 */}
        <section className="lg:col-span-8 flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-card p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-base">
                  状态价值热力图 V(s) 与贪心策略 π(s)
                </h2>
                <p className="text-xs text-muted-foreground">
                  高亮蓝框表示从起点 S 出发的贪心轨迹；拖动下方进度条可回放每轮扫描/每个训练回合的演化。
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIterCursor(iterCursor === null ? 0 : null)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 text-white px-3 py-1.5 text-xs font-semibold hover:bg-indigo-600 transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                {iterCursor === null ? '从第 0 步回放' : '跳至最终收敛态'}
              </button>
            </div>

            {/* 迭代/回合时间轴滑块 */}
            <div className="rounded-lg bg-muted/50 p-3 flex items-center gap-3 text-xs">
              <span className="font-mono shrink-0">
                {mode === 'dp-vi' ? `扫描轮次 k = ${currentStep}/${maxStep}` : `训练回合 ep = ${currentStep + 1}/${maxStep + 1}`}
              </span>
              <input
                type="range"
                min={0}
                max={maxStep}
                value={currentStep}
                onChange={(e) => setIterCursor(Number(e.target.value))}
                className="flex-1 accent-indigo-500"
              />
            </div>

            {/* 网格本体 */}
            <div className="overflow-x-auto py-2 flex justify-center">
              <div
                className="grid gap-1.5"
                style={{
                  gridTemplateColumns: `repeat(${env.spec.cols}, minmax(54px, 68px))`,
                }}
              >
                {Array.from({ length: env.nS }, (_, s) => {
                  const type = env.cell(s);
                  const v = V[s];
                  const act = policy[s];
                  const onPath = pathSet.has(s);
                  if (type === 'wall') {
                    return (
                      <div
                        key={s}
                        className="aspect-square rounded-lg bg-zinc-800 text-zinc-500 flex items-center justify-center text-[11px] font-bold"
                      >
                        WALL
                      </div>
                    );
                  }
                  return (
                    <div
                      key={s}
                      style={{ backgroundColor: valueToColor(v, maxAbs, 0.72) }}
                      className={`aspect-square rounded-lg border flex flex-col items-center justify-center relative p-1 ${
                        onPath ? 'border-2 border-indigo-400 shadow-sm' : 'border-border'
                      }`}
                    >
                      {type !== 'empty' && (
                        <span className="absolute top-1 left-1.5 text-[10px] font-bold uppercase opacity-80">
                          {type === 'goal' ? 'G' : type === 'pit' ? 'X' : 'S'}
                        </span>
                      )}
                      <span className="text-base font-extrabold leading-none">
                        {type === 'goal'
                          ? '★'
                          : type === 'pit'
                            ? '☠'
                            : ACTION_ARROWS[act]}
                      </span>
                      <span className="text-[11px] font-mono mt-1 opacity-90">{v.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* TD 模式下显示回合回报曲线 */}
          {tdResult && (
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-sm">训练回合累积奖励曲线 (15 回合滑动平均)</span>
                <span className="text-xs font-mono text-muted-foreground">
                  末 10 回合均值：{(smoothedReturns.slice(-10).reduce((a, b) => a + b, 0) / 10).toFixed(2)}
                </span>
              </div>
              <RewardSparkline values={smoothedReturns} cursor={currentStep} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function RewardSparkline({ values, cursor }: { values: number[]; cursor: number }) {
  if (!values.length) return null;
  const min = Math.min(...values);
  const max = Math.max(...values, min + 1e-3);
  const w = 680;
  const h = 130;
  const pts = values
    .map((v, i) => {
      const x = (i / Math.max(1, values.length - 1)) * (w - 20) + 10;
      const y = h - 14 - ((v - min) / (max - min)) * (h - 28);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const cx = (cursor / Math.max(1, values.length - 1)) * (w - 20) + 10;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32">
      <polyline fill="none" stroke="#6366f1" strokeWidth="2.5" points={pts} />
      <line x1={cx} y1={8} x2={cx} y2={h - 8} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 3" />
    </svg>
  );
}
