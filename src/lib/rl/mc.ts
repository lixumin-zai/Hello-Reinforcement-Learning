/**
 * 蒙特卡洛方法：
 *  - 完整 21 点 (Blackjack) 牌桌引擎（无限副牌采样、软 A / Usable Ace 规则）
 *  - On-Policy Monte Carlo Control（训练 10×10 策略热力图）
 *  - 离策略重要性采样（Ordinary IS vs Weighted IS 方差对比实验）
 */
import { createRng, randInt, type RNG } from './random';

export interface CardItem {
  rank: string;
  suit: '♠' | '♥' | '♦' | '♣';
  value: number; // A 为 1，J/Q/K 为 10
}

const RANKS: { rank: string; value: number }[] = [
  { rank: 'A', value: 1 },
  { rank: '2', value: 2 },
  { rank: '3', value: 3 },
  { rank: '4', value: 4 },
  { rank: '5', value: 5 },
  { rank: '6', value: 6 },
  { rank: '7', value: 7 },
  { rank: '8', value: 8 },
  { rank: '9', value: 9 },
  { rank: '10', value: 10 },
  { rank: 'J', value: 10 },
  { rank: 'Q', value: 10 },
  { rank: 'K', value: 10 },
];
const SUITS = ['♠', '♥', '♦', '♣'] as const;

export function drawCard(rng: RNG): CardItem {
  const r = RANKS[randInt(rng, RANKS.length)];
  const suit = SUITS[randInt(rng, SUITS.length)];
  return { rank: r.rank, suit, value: r.value };
}

/** 计算手牌点数及是否含“可用 A”(Usable Ace) */
export function evalHand(cards: CardItem[]): { sum: number; usableAce: boolean; bust: boolean } {
  const base = cards.reduce((a, c) => a + c.value, 0);
  const hasAce = cards.some((c) => c.value === 1);
  if (hasAce && base + 10 <= 21) return { sum: base + 10, usableAce: true, bust: false };
  return { sum: base, usableAce: false, bust: base > 21 };
}

export function drawCardValue(rng: RNG): number {
  return Math.min(10, randInt(rng, 13) + 1);
}

export interface BlackjackPolicyGrid {
  /** noAce[playerSum 12..21][dealerShow 1..10] -> 'hit' | 'stick' */
  noAce: ('hit' | 'stick')[][];
  /** withAce[playerSum 12..21][dealerShow 1..10] -> 'hit' | 'stick' */
  withAce: ('hit' | 'stick')[][];
  /** 状态最优价值估计 V(s) */
  vNoAce: number[][];
  vWithAce: number[][];
  episodes: number;
  winRate: number;
}

/**
 * 浏览器端高速 Monte Carlo Control (Exploring Starts / ε-soft) 训练 21 点策略
 * 状态索引：playerSum ∈ [12..21] (10), dealerShow ∈ [1..10] (10), usableAce ∈ {0,1} (2) => 200 状态
 */
export function trainBlackjackMC(episodes: number, seed = 42): BlackjackPolicyGrid {
  const rng = createRng(seed);
  const nStates = 200;
  // Q[s * 2 + a], N[s * 2 + a]; a=0 stick, a=1 hit
  const Q = new Float64Array(nStates * 2);
  const N = new Int32Array(nStates * 2);

  const idx = (pSum: number, dShow: number, ace: number) => ((ace * 10 + (pSum - 12)) * 10 + (dShow - 1));
  let wins = 0;

  for (let ep = 0; ep < episodes; ep++) {
    // 随机发初始牌（含探索性起点特性，覆盖所有合法状态）
    const dShow = drawCardValue(rng);
    const dHide = drawCardValue(rng);
    let pSum = randInt(rng, 10) + 12; // 12..21
    let pAce = randInt(rng, 2); // 0 or 1
    const trajectory: { s: number; a: number }[] = [];

    let firstAction = randInt(rng, 2); // 探索性首步
    let bust = false;

    for (let step = 0; step < 20; step++) {
      const s = idx(pSum, dShow, pAce);
      let a: number;
      if (step === 0) {
        a = firstAction;
      } else {
        const eps = 0.08;
        if (rng() < eps) a = randInt(rng, 2);
        else a = Q[s * 2 + 1] > Q[s * 2] ? 1 : 0;
      }
      trajectory.push({ s, a });
      if (a === 0) break; // Stick

      const card = drawCardValue(rng);
      if (card === 1 && pSum + 11 <= 21) {
        pSum += 11;
        pAce = 1;
      } else {
        pSum += card;
        if (pSum > 21 && pAce === 1) {
          pSum -= 10;
          pAce = 0;
        }
      }
      if (pSum > 21) {
        bust = true;
        break;
      }
    }

    let reward = 0;
    if (bust) {
      reward = -1;
    } else {
      let dSum = dShow + dHide;
      let dAce = dShow === 1 || dHide === 1 ? 1 : 0;
      if (dAce && dSum + 10 <= 21) dSum += 10;
      else dAce = 0;

      while (dSum < 17) {
        const c = drawCardValue(rng);
        if (c === 1 && dSum + 11 <= 21) {
          dSum += 11;
          dAce = 1;
        } else {
          dSum += c;
          if (dSum > 21 && dAce === 1) {
            dSum -= 10;
            dAce = 0;
          }
        }
      }
      if (dSum > 21 || pSum > dSum) reward = 1;
      else if (pSum < dSum) reward = -1;
      else reward = 0;
    }

    if (reward > 0) wins++;
    for (const { s, a } of trajectory) {
      const k = s * 2 + a;
      N[k]++;
      Q[k] += (reward - Q[k]) / N[k];
    }
  }

  const build = (ace: number) => {
    const pol: ('hit' | 'stick')[][] = [];
    const val: number[][] = [];
    for (let p = 12; p <= 21; p++) {
      const rowP: ('hit' | 'stick')[] = [];
      const rowV: number[] = [];
      for (let d = 1; d <= 10; d++) {
        const s = idx(p, d, ace);
        const qStick = Q[s * 2];
        const qHit = Q[s * 2 + 1];
        rowP.push(qHit > qStick ? 'hit' : 'stick');
        rowV.push(Math.max(qStick, qHit));
      }
      pol.push(rowP);
      val.push(rowV);
    }
    return { pol, val };
  };

  const n = build(0);
  const w = build(1);
  return {
    noAce: n.pol,
    withAce: w.pol,
    vNoAce: n.val,
    vWithAce: w.val,
    episodes,
    winRate: wins / Math.max(1, episodes),
  };
}

/**
 * 离策略重要性采样演示（Sutton & Barto 5.5 经典无界方差例子）：
 *  - 单状态：选左（概率 p_stay 继续留在原地，否则终局得 +1）；目标策略 π 永远选左，行为策略 b 以 probB 选左
 *  - 真实价值 v_π = 1.0，演示普通 IS 剧烈尖峰 vs 加权 IS 平稳收敛
 */
export function runImportanceSamplingDemo(
  episodes: number,
  behaviorLeftProb = 0.5,
  stayProb = 0.9,
  seed = 7,
): { ordinary: number[]; weighted: number[]; maxRho: number } {
  const rng = createRng(seed);
  const ordinary: number[] = [];
  const weighted: number[] = [];
  let sumRhoG = 0;
  let sumRho = 0;
  let maxRho = 0;

  for (let ep = 1; ep <= episodes; ep++) {
    let rho = 1;
    let G = 0;
    for (let step = 0; step < 60; step++) {
      // 行为策略 b 以 behaviorLeftProb 选左，目标策略 π 以 1.0 选左
      const chooseLeft = rng() < behaviorLeftProb;
      if (!chooseLeft) {
        rho = 0;
        G = 0;
        break;
      }
      rho *= 1 / behaviorLeftProb;
      if (rng() > stayProb) {
        G = 1;
        break;
      }
    }
    maxRho = Math.max(maxRho, rho);
    sumRhoG += rho * G;
    sumRho += rho;
    ordinary.push(sumRhoG / ep);
    weighted.push(sumRho > 0 ? sumRhoG / sumRho : 0);
  }
  return { ordinary, weighted, maxRho };
}
