'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw, Sparkles, Play } from 'lucide-react';

type Tile = 'empty' | 'wall' | 'lava' | 'gem' | 'crown' | 'start';

const ROWS = 5;
const COLS = 5;
// 5x5 固定隐藏地图（玩家初始在 (4,0)，规则未知，需要试错发现）
const MAP: Tile[][] = [
  ['empty', 'lava', 'empty', 'gem', 'crown'],
  ['empty', 'wall', 'empty', 'wall', 'empty'],
  ['gem', 'empty', 'empty', 'lava', 'empty'],
  ['empty', 'wall', 'lava', 'empty', 'empty'],
  ['start', 'empty', 'empty', 'empty', 'gem'],
];

interface StepRecord {
  t: number;
  r: number;
  c: number;
  action: string;
  reward: number;
  nextR: number;
  nextC: number;
}

const keyOf = (r: number, c: number) => `${r},${c}`;

export function FogTreasureGame() {
  const [pos, setPos] = useState<[number, number]>([4, 0]);
  const [episode, setEpisode] = useState(1);
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set([keyOf(4, 0)]));
  const [collectedGems, setCollectedGems] = useState<Set<string>>(() => new Set());
  const [trace, setTrace] = useState<StepRecord[]>([]);
  const [epReturn, setEpReturn] = useState(0);
  const [status, setStatus] = useState<'playing' | 'won' | 'dead'>('playing');
  const [bestReturn, setBestReturn] = useState<number | null>(null);
  const [historyReturns, setHistoryReturns] = useState<number[]>([]);
  const [replayIdx, setReplayIdx] = useState<number | null>(null);
  const [revealAll, setRevealAll] = useState(false);

  const gamma = 0.85;

  const move = useCallback(
    (dr: number, dc: number, label: string) => {
      if (status !== 'playing') return;
      const [r, c] = pos;
      let nr = r + dr;
      let nc = c + dc;
      let hitWall = false;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || MAP[nr][nc] === 'wall') {
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && MAP[nr][nc] === 'wall') {
          setRevealed((prev) => new Set(prev).add(keyOf(nr, nc)));
        }
        nr = r;
        nc = c;
        hitWall = true;
      }

      const tile = MAP[nr][nc];
      let reward = hitWall ? -0.5 : -0.2;
      let nextStatus: 'playing' | 'won' | 'dead' = 'playing';

      if (tile === 'lava') {
        reward = -6;
        nextStatus = 'dead';
      } else if (tile === 'gem' && !collectedGems.has(keyOf(nr, nc))) {
        reward = +3;
        setCollectedGems((prev) => new Set(prev).add(keyOf(nr, nc)));
      } else if (tile === 'crown') {
        reward = +15;
        nextStatus = 'won';
      }

      const nextReturn = Number((epReturn + reward).toFixed(2));
      setRevealed((prev) => new Set(prev).add(keyOf(nr, nc)));
      setPos([nr, nc]);
      setEpReturn(nextReturn);
      setTrace((prev) => [...prev, { t: prev.length, r, c, action: label, reward, nextR: nr, nextC: nc }]);
      setStatus(nextStatus);
      setReplayIdx(null);

      if (nextStatus !== 'playing') {
        setHistoryReturns((h) => [...h, nextReturn]);
        setBestReturn((b) => (b === null ? nextReturn : Math.max(b, nextReturn)));
      }
    },
    [pos, status, collectedGems, epReturn],
  );

  // 支持方向键 / WASD 操作（仅在聚焦游戏框内或未输入时便捷控制）
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      e.preventDefault();
      move(-1, 0, '↑');
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      e.preventDefault();
      move(1, 0, '↓');
    } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      e.preventDefault();
      move(0, -1, '←');
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      e.preventDefault();
      move(0, 1, '→');
    }
  };

  // 回放信用分配动画：从终局倒流回 t=0
  useEffect(() => {
    if (replayIdx === null) return;
    if (replayIdx <= 0) return;
    const timer = setTimeout(() => setReplayIdx((i) => (i !== null && i > 0 ? i - 1 : i)), 280);
    return () => clearTimeout(timer);
  }, [replayIdx]);

  const startNextEpisode = (clearMemory = false) => {
    setPos([4, 0]);
    setCollectedGems(new Set());
    setTrace([]);
    setEpReturn(0);
    setStatus('playing');
    setReplayIdx(null);
    if (clearMemory) {
      setRevealed(new Set([keyOf(4, 0)]));
      setEpisode(1);
      setHistoryReturns([]);
      setBestReturn(null);
      setRevealAll(false);
    } else {
      setEpisode((e) => e + 1);
    }
  };

  // 计算每一步的折扣回报 G_t（用于信用分配可视化）
  const returnsG: number[] = [];
  let acc = 0;
  for (let i = trace.length - 1; i >= 0; i--) {
    acc = trace[i].reward + gamma * acc;
    returnsG[i] = acc;
  }

  const creditMap = new Map<string, number>();
  if (replayIdx !== null) {
    for (let i = trace.length - 1; i >= replayIdx; i--) {
      creditMap.set(keyOf(trace[i].r, trace[i].c), returnsG[i]);
    }
  }

  return (
    <div
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="my-6 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm space-y-5 outline-none focus:ring-2 focus:ring-indigo-500/50 not-prose"
    >
      {/* 顶部任务栏 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-xs font-bold text-indigo-500">
              🎮 互动小游戏 · 迷雾寻宝
            </span>
            <span className="text-xs font-mono text-muted-foreground">第 {episode} 回合 (Episode {episode})</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            你被投放在一座未知规则的 5×5 迷雾遗迹。点击下方方向按钮（或点此框后按键盘方向键 / WASD）亲自试错，寻找最高分宝藏路线！
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setRevealAll((v) => !v)}
            className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            {revealAll ? '恢复迷雾' : '上帝视角'}
          </button>
          <button
            type="button"
            onClick={() => startNextEpisode(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-3.5 h-3.5" /> 彻底重置记忆
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* 左侧：5x5 迷雾网格 */}
        <div className="lg:col-span-6 flex flex-col items-center gap-4">
          <div className="grid grid-cols-5 gap-2 p-3 rounded-xl bg-zinc-950/90 border border-zinc-800 shadow-inner">
            {MAP.map((row, r) =>
              row.map((tile, c) => {
                const k = keyOf(r, c);
                const isHere = pos[0] === r && pos[1] === c;
                const seen = revealAll || revealed.has(k);
                const credit = creditMap.get(k);
                const gemTaken = collectedGems.has(k);

                let bg = 'bg-zinc-900 border-zinc-800 text-zinc-600';
                let icon = '?';
                if (seen) {
                  if (tile === 'wall') {
                    bg = 'bg-zinc-700 border-zinc-600 text-zinc-300';
                    icon = '🧱';
                  } else if (tile === 'lava') {
                    bg = 'bg-rose-950/90 border-rose-500/60 text-rose-300';
                    icon = '🔥';
                  } else if (tile === 'crown') {
                    bg = 'bg-amber-500/25 border-amber-400 text-amber-200';
                    icon = '👑';
                  } else if (tile === 'gem') {
                    bg = gemTaken
                      ? 'bg-zinc-800/70 border-zinc-700 text-zinc-500'
                      : 'bg-teal-950/80 border-teal-400/60 text-teal-200';
                    icon = gemTaken ? '·' : '💎';
                  } else if (tile === 'start') {
                    bg = 'bg-indigo-950/70 border-indigo-500/40 text-indigo-300';
                    icon = 'S';
                  } else {
                    bg = 'bg-zinc-800/80 border-zinc-700 text-zinc-400';
                    icon = '·';
                  }
                }

                return (
                  <div
                    key={k}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl border flex flex-col items-center justify-center relative transition-all duration-200 ${bg} ${
                      isHere ? 'ring-2 ring-indigo-400 scale-105 shadow-lg' : ''
                    } ${credit !== undefined ? 'ring-2 ring-amber-400 bg-amber-500/25' : ''}`}
                  >
                    <span className="text-lg leading-none">{isHere ? '🤖' : icon}</span>
                    {credit !== undefined && (
                      <span className="text-[10px] font-mono font-bold text-amber-300 mt-1">
                        G={credit.toFixed(1)}
                      </span>
                    )}
                    {!credit && seen && tile === 'lava' && (
                      <span className="text-[9px] font-mono text-rose-300">-6</span>
                    )}
                    {!credit && seen && tile === 'crown' && (
                      <span className="text-[9px] font-mono text-amber-300">+15</span>
                    )}
                    {!credit && seen && tile === 'gem' && !gemTaken && (
                      <span className="text-[9px] font-mono text-teal-300">+3</span>
                    )}
                  </div>
                );
              }),
            )}
          </div>

          {/* 方向控制器 */}
          {status === 'playing' ? (
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => move(-1, 0, '↑')}
                className="w-11 h-9 rounded-lg border border-border bg-background hover:bg-muted flex items-center justify-center"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => move(0, -1, '←')}
                  className="w-11 h-9 rounded-lg border border-border bg-background hover:bg-muted flex items-center justify-center"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(1, 0, '↓')}
                  className="w-11 h-9 rounded-lg border border-border bg-background hover:bg-muted flex items-center justify-center"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(0, 1, '→')}
                  className="w-11 h-9 rounded-lg border border-border bg-background hover:bg-muted flex items-center justify-center"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => startNextEpisode(false)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 text-white px-4 py-2 text-xs font-semibold hover:bg-indigo-600"
              >
                <Play className="w-3.5 h-3.5" /> 带着记忆开始第 {episode + 1} 回合
              </button>
              {trace.length > 0 && (
                <button
                  type="button"
                  onClick={() => setReplayIdx(trace.length - 1)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/50 bg-amber-500/15 text-amber-500 px-3.5 py-2 text-xs font-semibold hover:bg-amber-500/25"
                >
                  <Sparkles className="w-3.5 h-3.5" /> 回放信用分配 (倒推 G_t)
                </button>
              )}
            </div>
          )}
        </div>

        {/* 右侧：实时遥测与轨迹记录器 */}
        <div className="lg:col-span-6 space-y-3">
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="rounded-xl border border-border bg-background p-3">
              <div className="text-[11px] text-muted-foreground">当前步数 t</div>
              <div className="text-lg font-mono font-bold">{trace.length}</div>
            </div>
            <div className="rounded-xl border border-border bg-background p-3">
              <div className="text-[11px] text-muted-foreground">本回合累计奖励</div>
              <div className={`text-lg font-mono font-bold ${epReturn >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {epReturn > 0 ? `+${epReturn.toFixed(1)}` : epReturn.toFixed(1)}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-background p-3">
              <div className="text-[11px] text-muted-foreground">历史最高分</div>
              <div className="text-lg font-mono font-bold text-amber-500">
                {bestReturn === null ? '—' : bestReturn.toFixed(1)}
              </div>
            </div>
          </div>

          {status !== 'playing' && (
            <div
              className={`rounded-xl border p-3.5 text-xs leading-relaxed ${
                status === 'won'
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300'
              }`}
            >
              {status === 'won' ? (
                <>
                  <strong>👑 找到宝藏！</strong>注意看：你在终点才收到 +15，但前面的每一步移动都在暗中促成了这次胜利。点击左侧
                  <strong>「回放信用分配」</strong>，观察折扣回报 $G_t$（$\gamma=0.85$）如何把功劳一步步倒传回你走过的格子！
                </>
              ) : (
                <>
                  <strong>🔥 踩中熔岩陷阱 (-6)！</strong>这就是试错学习的代价——但你现在记住了这个格子的位置。点击
                  <strong>「带着记忆开始下一回合」</strong>，避开陷阱继续探索！
                </>
              )}
            </div>
          )}

          {/* 经验轨迹日志 */}
          <div className="rounded-xl border border-border bg-background p-3.5">
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span>📼 实时经验轨迹 τ = (S_t, A_t, R_&#123;t+1&#125;, S_&#123;t+1&#125;)</span>
              <span className="font-mono text-muted-foreground">已探索 {revealed.size}/25 格</span>
            </div>
            <div className="max-h-44 overflow-y-auto space-y-1 font-mono text-[11px]">
              {trace.length === 0 ? (
                <div className="text-muted-foreground py-6 text-center">
                  迈出你的第一步，观察环境如何返回即时奖励与新状态…
                </div>
              ) : (
                trace
                  .slice()
                  .reverse()
                  .map((s) => (
                    <div
                      key={s.t}
                      className={`flex items-center justify-between px-2.5 py-1 rounded ${
                        replayIdx !== null && s.t >= replayIdx ? 'bg-amber-500/15 text-amber-400' : 'bg-muted/40'
                      }`}
                    >
                      <span>
                        t={s.t}: ({s.r},{s.c}) <strong className="text-indigo-500">{s.action}</strong> ({s.nextR},{s.nextC})
                      </span>
                      <span>
                        R=
                        <strong className={s.reward >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                          {s.reward > 0 ? `+${s.reward}` : s.reward}
                        </strong>
                        {replayIdx !== null && s.t >= replayIdx && (
                          <span className="ml-2 text-amber-400">G={returnsG[s.t].toFixed(1)}</span>
                        )}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>

          {historyReturns.length > 0 && (
            <div className="text-xs text-muted-foreground font-mono">
              各回合学习进步史：{historyReturns.map((v, i) => `Ep${i + 1}:${v.toFixed(1)}`).join(' → ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
