/**
 * 多臂老虎机：环境 + ε-greedy / UCB / Thompson / Gradient 四类智能体。
 */
import { argmax, createRng, gaussian, randInt, sampleBeta, sampleCategorical, softmax, type RNG } from './random';

export interface BanditEnv {
  k: number;
  /** 每臂真实期望 q*(a) */
  means: number[];
  /** 'gaussian'：奖励 ~ N(q*, 1)；'bernoulli'：奖励 ~ Bernoulli(q*) */
  kind: 'gaussian' | 'bernoulli';
}

export function makeGaussianBandit(k = 10, seed = 1): BanditEnv {
  const rng = createRng(seed);
  return { k, means: Array.from({ length: k }, () => gaussian(rng)), kind: 'gaussian' };
}

export function makeBernoulliBandit(means: number[]): BanditEnv {
  return { k: means.length, means, kind: 'bernoulli' };
}

export function pull(env: BanditEnv, a: number, rng: RNG): number {
  return env.kind === 'gaussian' ? gaussian(rng, env.means[a], 1) : rng() < env.means[a] ? 1 : 0;
}

export type BanditAgentSpec =
  | { type: 'epsilon-greedy'; epsilon: number; initial?: number; stepSize?: number }
  | { type: 'ucb'; c: number }
  | { type: 'thompson' }
  | { type: 'gradient'; alpha: number; baseline: boolean };

export interface BanditStep {
  t: number;
  action: number;
  reward: number;
  explored: boolean;
  estimates: number[];
  counts: number[];
  /** UCB 上界 / Thompson 采样值 / Gradient 概率（视智能体而定） */
  scores: number[];
}

export interface BanditRun {
  steps: BanditStep[];
  rewards: number[];
  optimal: boolean[];
  regret: number[];
}

export function runBandit(env: BanditEnv, spec: BanditAgentSpec, T: number, seed = 7): BanditRun {
  const rng = createRng(seed);
  const k = env.k;
  const init = spec.type === 'epsilon-greedy' ? (spec.initial ?? 0) : 0;
  const Q = Array(k).fill(init);
  const N = Array(k).fill(0);
  const H = Array(k).fill(0);
  const alphaB = Array(k).fill(1);
  const betaB = Array(k).fill(1);
  let avgR = 0;
  const best = argmax(env.means);
  const bestMean = env.means[best];
  const steps: BanditStep[] = [];
  const rewards: number[] = [];
  const optimal: boolean[] = [];
  const regret: number[] = [];
  let cumRegret = 0;

  for (let t = 0; t < T; t++) {
    let a = 0;
    let explored = false;
    let scores: number[] = Q.slice();
    if (spec.type === 'epsilon-greedy') {
      if (rng() < spec.epsilon) {
        a = randInt(rng, k);
        explored = true;
      } else a = argmax(Q, rng);
    } else if (spec.type === 'ucb') {
      const untried = N.findIndex((n) => n === 0);
      scores = Q.map((q, i) => (N[i] === 0 ? Infinity : q + spec.c * Math.sqrt(Math.log(t + 1) / N[i])));
      a = untried >= 0 ? untried : argmax(scores, rng);
    } else if (spec.type === 'thompson') {
      scores = alphaB.map((al, i) => sampleBeta(rng, al, betaB[i]));
      a = argmax(scores);
    } else {
      scores = softmax(H);
      a = sampleCategorical(rng, scores);
    }

    const r = pull(env, a, rng);
    N[a]++;
    if (spec.type === 'epsilon-greedy' && spec.stepSize) Q[a] += spec.stepSize * (r - Q[a]);
    else Q[a] += (r - Q[a]) / N[a];
    if (spec.type === 'thompson') {
      alphaB[a] += r;
      betaB[a] += 1 - r;
    }
    if (spec.type === 'gradient') {
      const pi = softmax(H);
      const b = spec.baseline ? avgR : 0;
      for (let i = 0; i < k; i++) H[i] += spec.alpha * (r - b) * ((i === a ? 1 : 0) - pi[i]);
    }
    avgR += (r - avgR) / (t + 1);
    cumRegret += bestMean - env.means[a];

    steps.push({ t, action: a, reward: r, explored, estimates: Q.slice(), counts: N.slice(), scores });
    rewards.push(r);
    optimal.push(a === best);
    regret.push(cumRegret);
  }
  return { steps, rewards, optimal, regret };
}

/** 多次独立运行取平均（用于绘制平滑曲线） */
export function averageRuns(
  makeEnv: (run: number) => BanditEnv,
  spec: BanditAgentSpec,
  T: number,
  runs: number,
): { avgReward: number[]; optimalRate: number[] } {
  const avgReward = Array(T).fill(0);
  const optimalRate = Array(T).fill(0);
  for (let i = 0; i < runs; i++) {
    const res = runBandit(makeEnv(i), spec, T, 1000 + i);
    for (let t = 0; t < T; t++) {
      avgReward[t] += res.rewards[t] / runs;
      optimalRate[t] += (res.optimal[t] ? 1 : 0) / runs;
    }
  }
  return { avgReward, optimalRate };
}
