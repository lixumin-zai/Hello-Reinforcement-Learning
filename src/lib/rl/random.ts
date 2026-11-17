/**
 * 确定性随机数工具。
 *
 * ⚠️ 本项目中所有交互组件与 Remotion 动效都必须使用这里的种子随机数，
 *    禁止 Math.random()：动效需要“同一帧永远渲染出同一画面”，
 *    交互组件需要“同一种子永远复现同一训练过程”，便于讲解与对照。
 */

export type RNG = () => number;

/** mulberry32：32 位种子 → [0, 1) 均匀分布 */
export function createRng(seed: number): RNG {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 标准正态分布（Box-Muller） */
export function gaussian(rng: RNG, mean = 0, std = 1): number {
  const u = Math.max(rng(), 1e-12);
  const v = rng();
  return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** [0, n) 的随机整数 */
export function randInt(rng: RNG, n: number): number {
  return Math.floor(rng() * n);
}

/** 按概率向量采样下标 */
export function sampleCategorical(rng: RNG, probs: number[]): number {
  const u = rng();
  let acc = 0;
  for (let i = 0; i < probs.length; i++) {
    acc += probs[i];
    if (u < acc) return i;
  }
  return probs.length - 1;
}

/** Beta(α, β) 采样（通过两个 Gamma 采样，Marsaglia-Tsang） */
export function sampleBeta(rng: RNG, alpha: number, beta: number): number {
  const x = sampleGamma(rng, alpha);
  const y = sampleGamma(rng, beta);
  return x / (x + y);
}

export function sampleGamma(rng: RNG, k: number): number {
  if (k < 1) return sampleGamma(rng, k + 1) * Math.pow(Math.max(rng(), 1e-12), 1 / k);
  const d = k - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x: number;
    let v: number;
    do {
      x = gaussian(rng);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = rng();
    if (u < 1 - 0.0331 * x ** 4) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

/** 数组取最大值下标（并列时取第一个；如需随机打破平局请传 rng） */
export function argmax(xs: number[], rng?: RNG): number {
  let best = -Infinity;
  let idx: number[] = [];
  xs.forEach((x, i) => {
    if (x > best + 1e-12) {
      best = x;
      idx = [i];
    } else if (Math.abs(x - best) <= 1e-12) idx.push(i);
  });
  return rng ? idx[randInt(rng, idx.length)] : idx[0];
}

export function softmax(xs: number[], temperature = 1): number[] {
  const m = Math.max(...xs);
  const e = xs.map((x) => Math.exp((x - m) / temperature));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
}
