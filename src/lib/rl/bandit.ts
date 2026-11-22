/**
 * 多臂老虎机引擎：
 *  - 支持平稳高斯、平稳伯努利、以及「非平稳随机游走漂移」模式
 *  - 提供精确 Beta(α, β) 概率密度函数 (Lanczos Log-Gamma 近似)，供真实 PDF 曲线绘制
 *  - 支持 ε-greedy / 乐观初值 / UCB1 / Thompson Sampling / Gradient Bandit 五类策略
 */
import { argmax, createRng, gaussian, randInt, sampleBeta, sampleCategorical, softmax, type RNG } from './random';

export interface BanditEnv {
  k: number;
  /** 初始每臂真实期望 q*(a) */
  means: number[];
  kind: 'gaussian' | 'bernoulli';
  /** 若 > 0，则每一步各臂真实均值发生 N(0, driftStd²) 随机游走（非平稳环境） */
  driftStd?: number;
  /** 若设置，在第 shockStep 步发生突变（高收益与低收益机台大洗牌） */
  shockStep?: number;
}

export function makeGaussianBandit(k = 5, seed = 1, driftStd = 0): BanditEnv {
  const rng = createRng(seed);
  return { k, means: Array.from({ length: k }, () => gaussian(rng, 0, 1.1)), kind: 'gaussian', driftStd };
}

export function makeBernoulliBandit(means: number[], driftStd = 0, shockStep?: number): BanditEnv {
  return { k: means.length, means: means.slice(), kind: 'bernoulli', driftStd, shockStep };
}

/** 构造预设 5 机台赌场的期望奖励表（保证各台梯度拉开、好玩且具迷惑性） */
export function makeCasinoBandit(mode: 'bernoulli' | 'gaussian' | 'nonstationary', seed = 42): BanditEnv {
  const rng = createRng(seed);
  // 打乱 5 个梯度的机台顺序，确保玩家不能靠位置猜中
  const baseBernoulli = [0.22, 0.36, 0.48, 0.62, 0.78];
  const baseGaussian = [1.2, 2.3, 3.0, 3.9, 5.1];
  const arr = (mode === 'gaussian' ? baseGaussian : baseBernoulli).slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(rng, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  if (mode === 'nonstationary') {
    return { k: 5, means: arr, kind: 'bernoulli', driftStd: 0.015, shockStep: 25 };
  }
  return { k: 5, means: arr, kind: mode === 'gaussian' ? 'gaussian' : 'bernoulli', driftStd: 0 };
}

/** 推进环境真值一步（用于非平稳漂移或第 shockStep 步洗牌） */
export function evolveMeans(env: BanditEnv, means: number[], t: number, rng: RNG): number[] {
  let next = means.slice();
  if (env.shockStep && t === env.shockStep) {
    // 反转强弱：原本最差的变黄金机台，原本最好的变冷机
    const sorted = [...next].sort((a, b) => a - b);
    const minV = sorted[0];
    const maxV = sorted[sorted.length - 1];
    next = next.map((m) => Number((minV + maxV - m).toFixed(4)));
  }
  if (env.driftStd && env.driftStd > 0) {
    next = next.map((m) => {
      const moved = m + gaussian(rng, 0, env.driftStd!);
      return env.kind === 'bernoulli' ? Math.max(0.08, Math.min(0.92, moved)) : moved;
    });
  }
  return next;
}

export function pullFromMeans(kind: 'gaussian' | 'bernoulli', means: number[], a: number, rng: RNG): number {
  return kind === 'gaussian' ? gaussian(rng, means[a], 1.2) : rng() < means[a] ? 1 : 0;
}

export function pull(env: BanditEnv, a: number, rng: RNG): number {
  return pullFromMeans(env.kind, env.means, a, rng);
}

export type BanditAgentSpec =
  | { type: 'epsilon-greedy'; epsilon: number; initial?: number; stepSize?: number; decay?: boolean }
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
  scores: number[];
  /** 当前时刻真实均值快照（非平稳模式下会变化） */
  trueMeans: number[];
  bestArm: number;
}

export interface BanditRun {
  steps: BanditStep[];
  rewards: number[];
  cumReward: number[];
  optimal: boolean[];
  regret: number[];
}

export function runBandit(env: BanditEnv, spec: BanditAgentSpec, T: number, seed = 7): BanditRun {
  const rng = createRng(seed);
  const envRng = createRng(seed * 31 + 17);
  const k = env.k;
  const init = spec.type === 'epsilon-greedy' ? (spec.initial ?? 0) : 0;
  const Q = Array(k).fill(init);
  const N = Array(k).fill(0);
  const H = Array(k).fill(0);
  const alphaB = Array(k).fill(1);
  const betaB = Array(k).fill(1);
  let avgR = 0;
  let means = env.means.slice();

  const steps: BanditStep[] = [];
  const rewards: number[] = [];
  const cumReward: number[] = [];
  const optimal: boolean[] = [];
  const regret: number[] = [];
  let cumRegret = 0;
  let totalR = 0;

  for (let t = 0; t < T; t++) {
    if (t > 0 && (env.driftStd || env.shockStep)) {
      means = evolveMeans(env, means, t, envRng);
    }
    const best = argmax(means);
    const bestMean = means[best];

    let a = 0;
    let explored = false;
    let scores: number[] = Q.slice();
    if (spec.type === 'epsilon-greedy') {
      const eps = spec.decay ? spec.epsilon / Math.sqrt(t + 1) : spec.epsilon;
      if (rng() < eps) {
        a = randInt(rng, k);
        explored = true;
      } else a = argmax(Q, rng);
    } else if (spec.type === 'ucb') {
      const untried = N.findIndex((n) => n === 0);
      scores = Q.map((q, i) => (N[i] === 0 ? Infinity : q + spec.c * Math.sqrt(Math.log(t + 1) / N[i])));
      a = untried >= 0 ? untried : argmax(scores, rng);
    } else if (spec.type === 'thompson') {
      if (env.kind === 'bernoulli') {
        scores = alphaB.map((al, i) => sampleBeta(rng, al, betaB[i]));
      } else {
        // 高斯共轭后验近似 N(Q_i, 1 / (N_i + 1))
        scores = Q.map((q, i) => gaussian(rng, q, 1.2 / Math.sqrt(N[i] + 1)));
      }
      a = argmax(scores);
    } else {
      scores = softmax(H);
      a = sampleCategorical(rng, scores);
    }

    const r = pullFromMeans(env.kind, means, a, rng);
    N[a]++;
    if (spec.type === 'epsilon-greedy' && spec.stepSize) Q[a] += spec.stepSize * (r - Q[a]);
    else Q[a] += (r - Q[a]) / N[a];

    if (spec.type === 'thompson' && env.kind === 'bernoulli') {
      alphaB[a] += r;
      betaB[a] += 1 - r;
    }
    if (spec.type === 'gradient') {
      const pi = softmax(H);
      const b = spec.baseline ? avgR : 0;
      for (let i = 0; i < k; i++) H[i] += spec.alpha * (r - b) * ((i === a ? 1 : 0) - pi[i]);
    }
    avgR += (r - avgR) / (t + 1);
    totalR += r;
    cumRegret += Math.max(0, bestMean - means[a]);

    steps.push({
      t,
      action: a,
      reward: r,
      explored,
      estimates: Q.slice(),
      counts: N.slice(),
      scores,
      trueMeans: means.slice(),
      bestArm: best,
    });
    rewards.push(r);
    cumReward.push(totalR);
    optimal.push(a === best);
    regret.push(cumRegret);
  }
  return { steps, rewards, cumReward, optimal, regret };
}

export function averageRuns(
  makeEnv: (run: number) => BanditEnv,
  spec: BanditAgentSpec,
  T: number,
  runs: number,
): { avgReward: number[]; optimalRate: number[]; avgRegret: number[] } {
  const avgReward = Array(T).fill(0);
  const optimalRate = Array(T).fill(0);
  const avgRegret = Array(T).fill(0);
  for (let i = 0; i < runs; i++) {
    const res = runBandit(makeEnv(i), spec, T, 1000 + i);
    for (let t = 0; t < T; t++) {
      avgReward[t] += res.rewards[t] / runs;
      optimalRate[t] += (res.optimal[t] ? 1 : 0) / runs;
      avgRegret[t] += res.regret[t] / runs;
    }
  }
  return { avgReward, optimalRate, avgRegret };
}

/** Lanczos log-Gamma 近似，精度 ~1e-12 */
export function logGamma(z: number): number {
  const p = [
    676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  let x = 0.99999999999980993;
  const zm = z - 1;
  for (let i = 0; i < p.length; i++) x += p[i] / (zm + i + 1);
  const t = zm + p.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (zm + 0.5) * Math.log(t) - t + Math.log(x);
}

/** 精确 Beta(α, β) 概率密度函数，用于 SVG 平滑分布曲线 */
export function betaPdf(x: number, alpha: number, beta: number): number {
  if (x <= 0.0005 || x >= 0.9995) {
    if (alpha === 1 && beta === 1) return 1;
    return 0;
  }
  const logB = logGamma(alpha) + logGamma(beta) - logGamma(alpha + beta);
  return Math.exp((alpha - 1) * Math.log(x) + (beta - 1) * Math.log(1 - x) - logB);
}
