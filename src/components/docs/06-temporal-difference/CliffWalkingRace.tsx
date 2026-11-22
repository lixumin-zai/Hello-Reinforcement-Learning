'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { ACTION_ARROWS, GridWorld, PRESETS, argmax, greedyPath, movingAverage, trainTD } from '@/lib/rl';

export function CliffWalkingRace() {
  const [epsilon, setEpsilon] = useState(0.1);
  const [episodes, setEpisodes] = useState(400);
  const [playing, setPlaying] = useState(true);
  const [tick, setTick] = useState(0);

  const env = useMemo(() => new GridWorld(PRESETS.cliff()), []);

  const { sarsa, qlearn, sPath, qPath, sCurve, qCurve } = useMemo(() => {
    const sRes = trainTD(env, { algorithm: 'sarsa', alpha: 0.5, gamma: 1.0, epsilon, episodes, seed: 11 });
    const qRes = trainTD(env, { algorithm: 'q-learning', alpha: 0.5, gamma: 1.0, epsilon, episodes, seed: 11 });
    return {
      sarsa: sRes,
      qlearn: qRes,
      sPath: greedyPath(env, sRes.Q),
      qPath: greedyPath(env, qRes.Q),
      sCurve: movingAverage(sRes.episodeReturns, 20),
      qCurve: movingAverage(qRes.episodeReturns, 20),
    };
  }, [env, epsilon, episodes]);

  // 动画驱动两个智能体沿各自学到的路径同步前进
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setTick((t) => t + 1), 240);
    return () => clearInterval(id);
  }, [playing]);

  const sAgentPos = sPath[tick % Math.max(1, sPath.length)];
  const qAgentPos = qPath[tick % Math.max(1, qPath.length)];
  const sPathSet = useMemo(() => new Set(sPath), [sPath]);
  const qPathSet = useMemo(() => new Set(qPath), [qPath]);

  const mapY = (v: number) => 145 - ((Math.max(-120, Math.min(-10, v)) + 120) / 110) * 125;

  return (
    <div className="my-6 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm space-y-4 not-prose">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-bold">🧗 4×12 悬崖行走双智能体同屏竞速：SARSA（安全绿队）vs Q-learning（贴崖蓝队）</div>
          <p className="text-xs text-muted-foreground mt-0.5">
            看上方动画路线 + 下方训练得分曲线：Q-learning 学出的贪心路径最短（贴着悬崖走），但训练期因为 ε 探索频频摔下悬崖，在线得分反而远输给绕远路的 SARSA！
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-500 text-white px-3 py-1.5 text-xs font-semibold hover:bg-indigo-600"
          >
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {playing ? '暂停行走' : '继续行走'}
          </button>
          <button
            type="button"
            onClick={() => setTick(0)}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground"
          >
            <RotateCcw className="w-3.5 h-3.5" /> 复位
          </button>
        </div>
      </div>

      {/* 超参控制 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
        <label className="rounded-lg border border-border bg-background p-2.5 space-y-1">
          <div className="flex justify-between"><span>探索率 ε (越大 SARSA 越怕悬崖)</span><strong>{epsilon.toFixed(2)}</strong></div>
          <input type="range" min={0.02} max={0.25} step={0.01} value={epsilon} onChange={(e) => setEpsilon(Number(e.target.value))} className="w-full accent-teal-500" />
        </label>
        <label className="rounded-lg border border-border bg-background p-2.5 space-y-1">
          <div className="flex justify-between"><span>训练回合数</span><strong>{episodes} 局</strong></div>
          <input type="range" min={100} max={600} step={50} value={episodes} onChange={(e) => setEpisodes(Number(e.target.value))} className="w-full accent-indigo-500" />
        </label>
      </div>

      {/* 4x12 悬崖地图（同时显示 SARSA 与 Q-learning 路线和实时运动智能体） */}
      <div className="overflow-x-auto rounded-xl border border-border bg-zinc-950 p-3">
        <div className="grid grid-cols-12 gap-1 min-w-[640px]">
          {Array.from({ length: env.nS }, (_, s) => {
            const t = env.cell(s);
            if (t === 'pit') {
              return (
                <div key={s} className="h-11 rounded bg-rose-950/90 border border-rose-500/40 text-rose-300 flex items-center justify-center text-[10px] font-bold">
                  🔥-100
                </div>
              );
            }
            const onS = sPathSet.has(s);
            const onQ = qPathSet.has(s);
            const hasS = sAgentPos === s;
            const hasQ = qAgentPos === s;
            return (
              <div
                key={s}
                className={`h-11 rounded border flex flex-col items-center justify-center relative text-xs font-mono ${
                  t === 'goal'
                    ? 'bg-amber-500/25 border-amber-400 text-amber-200 font-bold'
                    : onS && onQ
                      ? 'bg-purple-500/20 border-purple-400/60'
                      : onS
                        ? 'bg-emerald-500/20 border-emerald-400/60'
                        : onQ
                          ? 'bg-indigo-500/20 border-indigo-400/60'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                }`}
              >
                {hasS || hasQ ? (
                  <div className="flex gap-0.5 text-sm leading-none">
                    {hasS && <span title="SARSA 智能体">🟢</span>}
                    {hasQ && <span title="Q-learning 智能体">🔵</span>}
                  </div>
                ) : (
                  <span className="text-[11px] font-bold">
                    {t === 'goal' ? '★ G' : t === 'start' ? 'S' : ACTION_ARROWS[argmax(qlearn.Q[s])]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 训练期回合得分对比折线 */}
      <div className="rounded-xl border border-border bg-background p-3.5">
        <div className="flex flex-wrap justify-between text-xs font-mono mb-1">
          <span className="text-muted-foreground">训练期 20 回合滑动平均回报（越靠上越安全）</span>
          <span>
            <span className="text-emerald-500 font-bold mr-3">
              🟢 SARSA 末期均值: {sCurve.at(-1)?.toFixed(1)} (路径 {sPath.length - 1} 步)
            </span>
            <span className="text-indigo-500 font-bold">
              🔵 Q-learning 末期均值: {qCurve.at(-1)?.toFixed(1)} (路径 {qPath.length - 1} 步)
            </span>
          </span>
        </div>
        <svg viewBox="0 0 600 160" className="w-full h-36">
          <polyline
            fill="none"
            stroke="#10b981"
            strokeWidth={2.5}
            points={sCurve.map((v, i) => `${26 + (i / (sCurve.length - 1)) * 560},${mapY(v)}`).join(' ')}
          />
          <polyline
            fill="none"
            stroke="#6366f1"
            strokeWidth={2.2}
            points={qCurve.map((v, i) => `${26 + (i / (qCurve.length - 1)) * 560},${mapY(v)}`).join(' ')}
          />
          <text x={2} y={24} fontSize={9} fill="currentColor" opacity={0.55}>-10</text>
          <text x={2} y={148} fontSize={9} fill="currentColor" opacity={0.55}>-120</text>
        </svg>
      </div>
    </div>
  );
}
