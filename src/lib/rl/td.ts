/**
 * 时序差分控制：Q-learning / SARSA / Expected SARSA。
 *
 * 训练过程以“逐步记录”的方式返回（trace），
 * 交互组件可以回放任意一步，Remotion 动效可以按帧索引同一份 trace。
 */
import { GridWorld } from './gridworld';
import { argmax, createRng, randInt, type RNG } from './random';

export type TDAlgorithm = 'q-learning' | 'sarsa' | 'expected-sarsa';

export interface TDConfig {
  algorithm: TDAlgorithm;
  alpha: number;
  gamma: number;
  epsilon: number;
  episodes: number;
  maxSteps?: number;
  seed?: number;
  /** 记录逐步 trace 的回合数上限（前若干回合），0 表示不记录 */
  traceEpisodes?: number;
}

export interface TDStep {
  episode: number;
  t: number;
  s: number;
  a: number;
  r: number;
  next: number;
  done: boolean;
  /** TD 目标 */
  target: number;
  /** TD 误差 δ */
  delta: number;
  qBefore: number;
  qAfter: number;
}

export interface TDResult {
  Q: number[][];
  episodeReturns: number[];
  episodeLengths: number[];
  trace: TDStep[];
  /** 每回合结束后的 Q 快照（用于回放学习过程） */
  snapshots: number[][][];
}

export function epsilonGreedy(q: number[], epsilon: number, rng: RNG): number {
  return rng() < epsilon ? randInt(rng, q.length) : argmax(q, rng);
}

export function trainTD(env: GridWorld, cfg: TDConfig): TDResult {
  const rng = createRng(cfg.seed ?? 42);
  const { alpha, gamma, epsilon } = cfg;
  const maxSteps = cfg.maxSteps ?? 500;
  const traceEpisodes = cfg.traceEpisodes ?? 0;
  const Q = Array.from({ length: env.nS }, () => Array(env.nA).fill(0));
  const episodeReturns: number[] = [];
  const episodeLengths: number[] = [];
  const trace: TDStep[] = [];
  const snapshots: number[][][] = [];

  for (let ep = 0; ep < cfg.episodes; ep++) {
    let s = env.startState();
    let a = epsilonGreedy(Q[s], epsilon, rng);
    let G = 0;
    let t = 0;
    for (; t < maxSteps; t++) {
      const { next, reward, done } = env.step(s, a, rng);
      G += reward;
      const nextA = epsilonGreedy(Q[next], epsilon, rng);
      let bootstrap = 0;
      if (!done) {
        if (cfg.algorithm === 'q-learning') bootstrap = Math.max(...Q[next]);
        else if (cfg.algorithm === 'sarsa') bootstrap = Q[next][nextA];
        else {
          const best = argmax(Q[next]);
          bootstrap = Q[next].reduce(
            (acc, q, i) => acc + q * (epsilon / env.nA + (i === best ? 1 - epsilon : 0)),
            0,
          );
        }
      }
      const target = reward + gamma * bootstrap;
      const qBefore = Q[s][a];
      const delta = target - qBefore;
      Q[s][a] = qBefore + alpha * delta;
      if (ep < traceEpisodes)
        trace.push({ episode: ep, t, s, a, r: reward, next, done, target, delta, qBefore, qAfter: Q[s][a] });
      s = next;
      a = nextA;
      if (done) break;
    }
    episodeReturns.push(G);
    episodeLengths.push(t + 1);
    snapshots.push(Q.map((row) => row.slice()));
  }
  return { Q, episodeReturns, episodeLengths, trace, snapshots };
}

/** 从 Q 表提取贪心路径（用于展示学到的路线） */
export function greedyPath(env: GridWorld, Q: number[][], maxLen = 100): number[] {
  const path = [env.startState()];
  const seen = new Set(path);
  let s = path[0];
  for (let i = 0; i < maxLen && !env.isTerminal(s); i++) {
    s = env.move(s, argmax(Q[s]));
    if (seen.has(s)) break;
    seen.add(s);
    path.push(s);
  }
  return path;
}

/** 滑动平均，用于平滑学习曲线 */
export function movingAverage(xs: number[], window = 10): number[] {
  const out: number[] = [];
  let sum = 0;
  xs.forEach((x, i) => {
    sum += x;
    if (i >= window) sum -= xs[i - window];
    out.push(sum / Math.min(i + 1, window));
  });
  return out;
}
