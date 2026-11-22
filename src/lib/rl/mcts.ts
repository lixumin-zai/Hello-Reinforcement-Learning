/**
 * 井字棋 (Tic-Tac-Toe) + 完整可透视蒙特卡洛树搜索 (MCTS) 引擎。
 * 暴露每一步搜索的树节点统计（访问次数 N、累计胜分 W、UCT 值）供实时可视化。
 */
import { createRng, randInt, type RNG } from './random';

export type Mark = 0 | 1 | -1; // 0 空, 1 玩家 X, -1 AI O
export type Board = Mark[]; // 长度 9

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function checkWinner(board: Board): Mark | 'draw' | null {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] !== 0 && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  if (board.every((v) => v !== 0)) return 'draw';
  return null;
}

export function legalMoves(board: Board): number[] {
  const out: number[] = [];
  for (let i = 0; i < 9; i++) if (board[i] === 0) out.push(i);
  return out;
}

export interface MCTSChildStat {
  move: number;
  visits: number;
  wins: number; // 从根节点行动方视角看的得分（胜 +1, 和 +0.5, 负 0）
  winRate: number;
  uct: number;
  /** 二级子展开前 3 个热门应对 */
  topReplies: { move: number; visits: number; winRate: number }[];
}

export interface MCTSSearchResult {
  bestMove: number;
  totalVisits: number;
  children: MCTSChildStat[];
  /** 最后一次迭代的四阶段路径，用于单步拆解 */
  lastTrace: {
    selectedPath: number[];
    expandedMove: number | null;
    rolloutWinner: Mark | 'draw';
  };
}

interface InternalNode {
  board: Board;
  playerToMove: 1 | -1;
  move: number | null;
  parent: InternalNode | null;
  children: InternalNode[];
  untried: number[];
  visits: number;
  wins: number; // 站在 parent.playerToMove（走这一步的人）视角
}

function uctScore(child: InternalNode, parentVisits: number, c: number): number {
  if (child.visits === 0) return Infinity;
  return child.wins / child.visits + c * Math.sqrt(Math.log(Math.max(1, parentVisits)) / child.visits);
}

function rollout(board: Board, player: 1 | -1, rng: RNG): Mark | 'draw' {
  const b = board.slice();
  let p: 1 | -1 = player;
  for (;;) {
    const w = checkWinner(b);
    if (w !== null) return w;
    const moves = legalMoves(b);
    b[moves[randInt(rng, moves.length)]] = p;
    p = p === 1 ? -1 : 1;
  }
}

export function runTicTacToeMCTS(
  board: Board,
  playerToMove: 1 | -1,
  iterations = 400,
  c = 1.41,
  seed = 42,
): MCTSSearchResult {
  const rng = createRng(seed);
  const root: InternalNode = {
    board: board.slice(),
    playerToMove,
    move: null,
    parent: null,
    children: [],
    untried: legalMoves(board),
    visits: 0,
    wins: 0,
  };

  let lastSelected: number[] = [];
  let lastExpanded: number | null = null;
  let lastWinner: Mark | 'draw' = 'draw';

  for (let it = 0; it < iterations; it++) {
    let node = root;
    const path: number[] = [];

    // 1. Selection
    while (node.untried.length === 0 && node.children.length > 0) {
      let best = node.children[0];
      let bestScore = -Infinity;
      for (const ch of node.children) {
        const sc = uctScore(ch, node.visits, c);
        if (sc > bestScore) {
          bestScore = sc;
          best = ch;
        }
      }
      node = best;
      if (node.move !== null) path.push(node.move);
    }

    // 2. Expansion
    let expanded: number | null = null;
    if (checkWinner(node.board) === null && node.untried.length > 0) {
      const mIdx = randInt(rng, node.untried.length);
      const move = node.untried.splice(mIdx, 1)[0];
      const nextBoard = node.board.slice();
      nextBoard[move] = node.playerToMove;
      const child: InternalNode = {
        board: nextBoard,
        playerToMove: node.playerToMove === 1 ? -1 : 1,
        move,
        parent: node,
        children: [],
        untried: checkWinner(nextBoard) === null ? legalMoves(nextBoard) : [],
        visits: 0,
        wins: 0,
      };
      node.children.push(child);
      node = child;
      expanded = move;
    }

    // 3. Simulation
    const winner = rollout(node.board, node.playerToMove, rng);

    // 4. Backpropagation
    let cur: InternalNode | null = node;
    while (cur !== null) {
      cur.visits++;
      if (cur.parent !== null) {
        const mover = cur.parent.playerToMove;
        if (winner === mover) cur.wins += 1;
        else if (winner === 'draw') cur.wins += 0.5;
      }
      cur = cur.parent;
    }

    lastSelected = path;
    lastExpanded = expanded;
    lastWinner = winner;
  }

  const children: MCTSChildStat[] = root.children
    .map((ch) => ({
      move: ch.move!,
      visits: ch.visits,
      wins: ch.wins,
      winRate: ch.visits > 0 ? ch.wins / ch.visits : 0,
      uct: uctScore(ch, root.visits, c),
      topReplies: ch.children
        .slice()
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 3)
        .map((r) => ({ move: r.move!, visits: r.visits, winRate: r.visits > 0 ? r.wins / r.visits : 0 })),
    }))
    .sort((a, b) => b.visits - a.visits);

  return {
    bestMove: children[0]?.move ?? legalMoves(board)[0] ?? -1,
    totalVisits: root.visits,
    children,
    lastTrace: {
      selectedPath: lastSelected,
      expandedMove: lastExpanded,
      rolloutWinner: lastWinner,
    },
  };
}
