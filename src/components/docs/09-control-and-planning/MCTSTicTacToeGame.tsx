'use client';

import React, { useState } from 'react';
import { RotateCcw, TreePine } from 'lucide-react';
import { checkWinner, runTicTacToeMCTS, type Board, type MCTSSearchResult } from '@/lib/rl';

const POS_NAMES = ['左上', '中上', '右上', '左中', '天元', '右中', '左下', '中下', '右下'];

export function MCTSTicTacToeGame() {
  const [board, setBoard] = useState<Board>(Array(9).fill(0));
  const [iterations, setIterations] = useState(350);
  const [lastSearch, setLastSearch] = useState<MCTSSearchResult | null>(null);
  const [moveCount, setMoveCount] = useState(0);

  const winner = checkWinner(board);

  const handleCellClick = (idx: number) => {
    if (winner !== null || board[idx] !== 0) return;

    // 1. 玩家 X 落子
    const afterPlayer = board.slice();
    afterPlayer[idx] = 1;
    const w1 = checkWinner(afterPlayer);
    if (w1 !== null) {
      setBoard(afterPlayer);
      return;
    }

    // 2. AI (O = -1) 实时运行真实蒙特卡洛树搜索 MCTS！
    const search = runTicTacToeMCTS(afterPlayer, -1, iterations, 1.41, 100 + moveCount * 31 + idx);
    const afterAI = afterPlayer.slice();
    if (search.bestMove >= 0) afterAI[search.bestMove] = -1;

    setBoard(afterAI);
    setLastSearch(search);
    setMoveCount((c) => c + 1);
  };

  const reset = () => {
    setBoard(Array(9).fill(0));
    setLastSearch(null);
    setMoveCount(0);
  };

  return (
    <div className="my-6 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm space-y-4 not-prose">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-500">
              ⭕❌ 完整对弈小游戏 · 井字棋 MCTS 搜索树透视台
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            你执 <strong>X</strong> 先手！每落一子，右侧立即实时剖开 AI 脑海中的 <strong>MCTS 搜索树</strong>（各候选分支的访问次数 N、估算胜率 W/N 与 UCT 分数）。把模拟次数调低到 20，你能战胜它；调到 500，它将无懈可击！
          </p>
        </div>

        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted"
        >
          <RotateCcw className="w-3.5 h-3.5" /> 重新开局
        </button>
      </div>

      {/* MCTS 搜索预算滑块 */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-muted/40 px-4 py-2 text-xs font-mono">
        <span>AI 每步 MCTS 模拟推演预算：<strong className="text-emerald-500">{iterations} 次 Rollout</strong></span>
        <input
          type="range"
          min={15}
          max={800}
          step={15}
          value={iterations}
          onChange={(e) => setIterations(Number(e.target.value))}
          className="flex-1 min-w-[140px] accent-emerald-500"
        />
        <span className="text-muted-foreground">{iterations < 50 ? '🐣 萌新 AI（可击败）' : iterations > 300 ? '🧠 满血大师 AI' : '⚖️ 进阶 AI'}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* 左侧：3×3 井字棋盘 */}
        <div className="lg:col-span-5 flex flex-col items-center gap-3">
          <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
            {board.map((cell, i) => {
              const stat = lastSearch?.children.find((c) => c.move === i);
              const isAiBest = lastSearch?.bestMove === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleCellClick(i)}
                  className={`w-20 h-20 rounded-xl border text-3xl font-black flex flex-col items-center justify-center transition-all ${
                    cell === 1
                      ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300'
                      : cell === -1
                        ? isAiBest
                          ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 ring-2 ring-emerald-400'
                          : 'bg-teal-500/15 border-teal-500/40 text-teal-300'
                        : 'bg-zinc-900 border-zinc-700 hover:border-indigo-400 text-zinc-500'
                  }`}
                >
                  <span>{cell === 1 ? 'X' : cell === -1 ? 'O' : ''}</span>
                  {cell === 0 && stat && (
                    <span className="text-[9px] font-mono text-zinc-400">N={stat.visits}</span>
                  )}
                </button>
              );
            })}
          </div>

          {winner !== null && (
            <div
              className={`rounded-xl px-4 py-2 text-xs font-bold border ${
                winner === 1
                  ? 'bg-indigo-500/15 border-indigo-500 text-indigo-400'
                  : winner === -1
                    ? 'bg-rose-500/15 border-rose-500 text-rose-400'
                    : 'bg-amber-500/15 border-amber-500 text-amber-400'
              }`}
            >
              {winner === 1 ? '🎉 你击败了 MCTS AI！试着调高推演预算再战！' : winner === -1 ? '🤖 MCTS AI 获胜！' : '🤝 双方战成和棋！'}
            </div>
          )}
        </div>

        {/* 右侧：实时生长的 MCTS 搜索树统计面板 */}
        <div className="lg:col-span-7 rounded-xl border border-border bg-background p-4 space-y-3">
          <div className="flex items-center justify-between text-xs border-b border-border pb-2">
            <span className="font-bold inline-flex items-center gap-1.5 text-emerald-500">
              <TreePine className="w-4 h-4" /> AI 上一步的 MCTS 决策树剖面
            </span>
            <span className="font-mono text-muted-foreground">
              {lastSearch ? `总访问 N_root = ${lastSearch.totalVisits}` : '等待你落第一子…'}
            </span>
          </div>

          {!lastSearch ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              点击左侧棋盘任意空位（推荐先点「天元」或「左上角」），立刻透视 MCTS 搜索树如何分配探索预算！
            </div>
          ) : (
            <div className="space-y-2">
              {lastSearch.children.slice(0, 6).map((ch, rank) => {
                const share = (ch.visits / Math.max(1, lastSearch.totalVisits)) * 100;
                return (
                  <div
                    key={ch.move}
                    className={`rounded-lg border p-2.5 text-xs font-mono ${
                      rank === 0 ? 'border-emerald-500 bg-emerald-500/10' : 'border-border bg-card/50'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold">
                        {rank === 0 ? '★ AI 选定：' : '候选：'}
                        {POS_NAMES[ch.move]} (格 {ch.move})
                      </span>
                      <span>
                        访问 <strong className="text-emerald-500">N={ch.visits}</strong> ({share.toFixed(0)}%) · 胜率{' '}
                        <strong className="text-amber-500">{(ch.winRate * 100).toFixed(0)}%</strong>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-1">
                      <div style={{ width: `${share.toFixed(1)}%` }} className="h-full bg-emerald-500" />
                    </div>
                    {ch.topReplies.length > 0 && (
                      <div className="text-[10px] text-muted-foreground">
                        预判你的热门应对：{ch.topReplies.map((r) => `${POS_NAMES[r.move]}(N=${r.visits})`).join(' · ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
