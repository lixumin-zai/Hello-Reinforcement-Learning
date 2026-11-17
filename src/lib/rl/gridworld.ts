/**
 * 网格世界（GridWorld）—— 全书最常用的教学环境。
 *
 * 状态编号：s = row * cols + col；动作：0↑ 1→ 2↓ 3←
 * 支持：墙、终止格（带奖励）、陷阱、每步奖励、打滑概率（随机转移）。
 */

export const ACTIONS = [0, 1, 2, 3] as const;
export type Action = (typeof ACTIONS)[number];
export const ACTION_ARROWS = ['↑', '→', '↓', '←'] as const;
export const ACTION_NAMES = ['上', '右', '下', '左'] as const;
const DR = [-1, 0, 1, 0];
const DC = [0, 1, 0, -1];

export type CellType = 'empty' | 'wall' | 'goal' | 'pit' | 'start';

export interface GridWorldSpec {
  rows: number;
  cols: number;
  /** 每格类型，长度 rows*cols */
  cells: CellType[];
  /** 进入终止格时获得的奖励 */
  goalReward: number;
  pitReward: number;
  /** 每走一步的奖励（通常为负，鼓励走最短路） */
  stepReward: number;
  /** 打滑概率：以该概率随机走向垂直方向之一 */
  slip: number;
}

export interface Transition {
  prob: number;
  next: number;
  reward: number;
  done: boolean;
}

/** 用字符画定义网格：. 空  # 墙  G 目标  X 陷阱  S 起点 */
export function parseGrid(
  rowsStr: string[],
  opts: Partial<Omit<GridWorldSpec, 'rows' | 'cols' | 'cells'>> = {},
): GridWorldSpec {
  const map: Record<string, CellType> = { '.': 'empty', '#': 'wall', G: 'goal', X: 'pit', S: 'start' };
  const cells = rowsStr.flatMap((r) => r.split('').map((ch) => map[ch] ?? 'empty'));
  return {
    rows: rowsStr.length,
    cols: rowsStr[0].length,
    cells,
    goalReward: opts.goalReward ?? 1,
    pitReward: opts.pitReward ?? -1,
    stepReward: opts.stepReward ?? -0.04,
    slip: opts.slip ?? 0,
  };
}

export const PRESETS = {
  /** Russell & Norvig 经典 4×3 网格 */
  classic: () => parseGrid(['...G', '.#.X', 'S...'], { stepReward: -0.04, slip: 0.2 }),
  /** 确定性 5×5 网格，适合讲价值传播 */
  simple: () => parseGrid(['....G', '.##..', '...#.', '.#...', 'S....'], { stepReward: -0.04 }),
  /** 悬崖行走 4×12（Sutton & Barto 例 6.6） */
  cliff: () =>
    parseGrid(['............', '............', '............', 'SXXXXXXXXXXG'], {
      stepReward: -1,
      pitReward: -100,
      goalReward: 0,
    }),
  /** 迷宫（Dyna-Q 例 8.1） */
  maze: () =>
    parseGrid(['.......#G', '..#....#.', 'S.#....#.', '..#......', '.....#...', '.........'], {
      stepReward: 0,
      goalReward: 1,
    }),
};

export class GridWorld {
  readonly spec: GridWorldSpec;
  readonly nS: number;
  readonly nA = 4;

  constructor(spec: GridWorldSpec) {
    this.spec = spec;
    this.nS = spec.rows * spec.cols;
  }

  rc(s: number): [number, number] {
    return [Math.floor(s / this.spec.cols), s % this.spec.cols];
  }
  idx(r: number, c: number): number {
    return r * this.spec.cols + c;
  }
  cell(s: number): CellType {
    return this.spec.cells[s];
  }
  isTerminal(s: number): boolean {
    const t = this.cell(s);
    return t === 'goal' || t === 'pit';
  }
  isWall(s: number): boolean {
    return this.cell(s) === 'wall';
  }
  /** 可作为状态的格子（非墙） */
  states(): number[] {
    return Array.from({ length: this.nS }, (_, s) => s).filter((s) => !this.isWall(s));
  }
  startState(): number {
    const s = this.spec.cells.indexOf('start');
    return s >= 0 ? s : this.states().find((x) => !this.isTerminal(x))!;
  }

  /** 确定性地移动一步（撞墙/出界则原地不动） */
  move(s: number, a: number): number {
    const [r, c] = this.rc(s);
    const nr = r + DR[a];
    const nc = c + DC[a];
    if (nr < 0 || nr >= this.spec.rows || nc < 0 || nc >= this.spec.cols) return s;
    const ns = this.idx(nr, nc);
    return this.isWall(ns) ? s : ns;
  }

  reward(next: number): number {
    const t = this.cell(next);
    if (t === 'goal') return this.spec.goalReward;
    if (t === 'pit') return this.spec.pitReward;
    return this.spec.stepReward;
  }

  /** 完整的转移分布 p(s', r | s, a) —— 动态规划需要 */
  transitions(s: number, a: number): Transition[] {
    if (this.isTerminal(s)) return [{ prob: 1, next: s, reward: 0, done: true }];
    const { slip } = this.spec;
    const outcomes: [number, number][] = [[a, 1 - slip]];
    if (slip > 0) outcomes.push([(a + 1) % 4, slip / 2], [(a + 3) % 4, slip / 2]);
    const merged = new Map<number, number>();
    for (const [act, p] of outcomes) {
      const ns = this.move(s, act);
      merged.set(ns, (merged.get(ns) ?? 0) + p);
    }
    return [...merged].map(([next, prob]) => ({
      prob,
      next,
      reward: this.reward(next),
      done: this.isTerminal(next),
    }));
  }

  /** 采样一步（无模型方法用） */
  step(s: number, a: number, rng: () => number): { next: number; reward: number; done: boolean } {
    const ts = this.transitions(s, a);
    let u = rng();
    for (const t of ts) {
      if (u < t.prob) return t;
      u -= t.prob;
    }
    return ts[ts.length - 1];
  }
}
