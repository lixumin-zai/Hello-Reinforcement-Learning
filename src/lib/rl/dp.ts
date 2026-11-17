/**
 * 动态规划：策略评估 / 策略改进 / 策略迭代 / 价值迭代。
 * 所有函数都是纯函数，返回新数组，方便交互组件“逐步回放”与 Remotion 按帧索引。
 */
import { GridWorld } from './gridworld';
import { argmax } from './random';

/** 随机策略：π[s][a] */
export type Policy = number[][];

export function uniformPolicy(env: GridWorld): Policy {
  return Array.from({ length: env.nS }, () => Array(env.nA).fill(1 / env.nA));
}

/** 确定性贪心策略 → 概率形式 */
export function greedyToPolicy(env: GridWorld, actions: number[]): Policy {
  return actions.map((a) => Array.from({ length: env.nA }, (_, i) => (i === a ? 1 : 0)));
}

/** 单状态的 Q 值：q(s,a) = Σ p(s',r|s,a)[r + γV(s')] */
export function qFromV(env: GridWorld, V: number[], s: number, gamma: number): number[] {
  return Array.from({ length: env.nA }, (_, a) =>
    env.transitions(s, a).reduce((acc, t) => acc + t.prob * (t.reward + (t.done ? 0 : gamma * V[t.next])), 0),
  );
}

/** 一次完整的同步扫描（Bellman 期望备份），返回新的 V 与最大变化量 */
export function policyEvaluationSweep(env: GridWorld, policy: Policy, V: number[], gamma: number) {
  const next = V.slice();
  let delta = 0;
  for (const s of env.states()) {
    if (env.isTerminal(s)) {
      next[s] = 0;
      continue;
    }
    const q = qFromV(env, V, s, gamma);
    next[s] = policy[s].reduce((acc, p, a) => acc + p * q[a], 0);
    delta = Math.max(delta, Math.abs(next[s] - V[s]));
  }
  return { V: next, delta };
}

/** 迭代策略评估直到收敛，返回每轮快照 */
export function policyEvaluation(env: GridWorld, policy: Policy, gamma: number, theta = 1e-4, maxIter = 500) {
  let V = Array(env.nS).fill(0);
  const history: { V: number[]; delta: number }[] = [{ V, delta: Infinity }];
  for (let i = 0; i < maxIter; i++) {
    const r = policyEvaluationSweep(env, policy, V, gamma);
    V = r.V;
    history.push(r);
    if (r.delta < theta) break;
  }
  return history;
}

/** 贪心策略改进：返回每个状态的最优动作 */
export function greedyActions(env: GridWorld, V: number[], gamma: number): number[] {
  return Array.from({ length: env.nS }, (_, s) =>
    env.isWall(s) || env.isTerminal(s) ? 0 : argmax(qFromV(env, V, s, gamma)),
  );
}

/** 一次价值迭代扫描（Bellman 最优备份） */
export function valueIterationSweep(env: GridWorld, V: number[], gamma: number) {
  const next = V.slice();
  let delta = 0;
  for (const s of env.states()) {
    if (env.isTerminal(s)) {
      next[s] = 0;
      continue;
    }
    next[s] = Math.max(...qFromV(env, V, s, gamma));
    delta = Math.max(delta, Math.abs(next[s] - V[s]));
  }
  return { V: next, delta };
}

export interface VISnapshot {
  V: number[];
  delta: number;
  policy: number[];
}

/** 完整价值迭代，返回每轮快照（含当时的贪心策略） */
export function valueIteration(env: GridWorld, gamma: number, theta = 1e-4, maxIter = 200): VISnapshot[] {
  let V = Array(env.nS).fill(0);
  const out: VISnapshot[] = [{ V, delta: Infinity, policy: greedyActions(env, V, gamma) }];
  for (let i = 0; i < maxIter; i++) {
    const r = valueIterationSweep(env, V, gamma);
    V = r.V;
    out.push({ ...r, policy: greedyActions(env, V, gamma) });
    if (r.delta < theta) break;
  }
  return out;
}

export interface PISnapshot {
  phase: 'evaluate' | 'improve';
  V: number[];
  policy: number[];
  stable: boolean;
}

/** 策略迭代，返回评估/改进交替的快照 */
export function policyIteration(env: GridWorld, gamma: number, maxIter = 30): PISnapshot[] {
  let actions = Array(env.nS).fill(0);
  let pol: Policy = uniformPolicy(env);
  const out: PISnapshot[] = [];
  for (let i = 0; i < maxIter; i++) {
    const hist = policyEvaluation(env, pol, gamma);
    const V = hist[hist.length - 1].V;
    out.push({ phase: 'evaluate', V, policy: actions, stable: false });
    const nextActions = greedyActions(env, V, gamma);
    const stable = i > 0 && nextActions.every((a, s) => a === actions[s]);
    actions = nextActions;
    pol = greedyToPolicy(env, actions);
    out.push({ phase: 'improve', V, policy: actions, stable });
    if (stable) break;
  }
  return out;
}
