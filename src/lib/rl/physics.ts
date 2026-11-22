/**
 * 经典连续状态物理仿真引擎（与 Gymnasium 物理方程严格一致）：
 *  1. Mountain Car（山地车）：位置 x ∈ [-1.2, 0.6], 速度 v ∈ [-0.07, 0.07]
 *  2. CartPole（倒立摆）：小车位置 x, 速度 xDot, 摆杆倾角 theta, 角速度 thetaDot
 */

export interface MountainCarState {
  x: number;
  v: number;
  steps: number;
  done: boolean;
}

export const MC_MIN_X = -1.2;
export const MC_MAX_X = 0.6;
export const MC_GOAL_X = 0.5;
export const MC_MAX_V = 0.07;

export function resetMountainCar(x0 = -0.5): MountainCarState {
  return { x: x0, v: 0, steps: 0, done: false };
}

/** action: -1 向左加速, 0 滑行, +1 向右加速 */
export function stepMountainCar(st: MountainCarState, action: -1 | 0 | 1): { state: MountainCarState; reward: number } {
  if (st.done) return { state: st, reward: 0 };
  let v = st.v + action * 0.001 + Math.cos(3 * st.x) * -0.0025;
  v = Math.max(-MC_MAX_V, Math.min(MC_MAX_V, v));
  let x = st.x + v;
  if (x < MC_MIN_X) {
    x = MC_MIN_X;
    if (v < 0) v = 0;
  }
  const done = x >= MC_GOAL_X;
  return {
    state: { x, v, steps: st.steps + 1, done },
    reward: done ? 0 : -1,
  };
}

/** 能量泵（学到的近最优策略）：顺着当前速度方向推油门即可荡秋千冲顶 */
export function mountainCarEnergyPolicy(st: MountainCarState): -1 | 0 | 1 {
  return st.v >= 0 ? 1 : -1;
}

/** 山地车地形高度 y = sin(3x) */
export function mountainHeight(x: number): number {
  return Math.sin(3 * x);
}

// =========================================================================
// CartPole 倒立摆物理引擎（Barto, Sutton, Anderson 1983 精确欧拉积分）
// =========================================================================
export interface CartPoleState {
  x: number;
  xDot: number;
  theta: number; // 弧度，0 为竖直向上
  thetaDot: number;
  steps: number;
  done: boolean;
}

const GRAVITY = 9.8;
const MASS_CART = 1.0;
const MASS_POLE = 0.1;
const TOTAL_MASS = MASS_CART + MASS_POLE;
const HALF_LEN = 0.5;
const POLE_MASS_LEN = MASS_POLE * HALF_LEN;
const FORCE_MAG = 10.0;
const TAU = 0.02;

export function resetCartPole(theta0 = 0.06): CartPoleState {
  return { x: 0, xDot: 0, theta: theta0, thetaDot: 0, steps: 0, done: false };
}

/** action: 0 向左推 (-F), 1 向右推 (+F) */
export function stepCartPole(st: CartPoleState, action: 0 | 1): { state: CartPoleState; reward: number } {
  if (st.done) return { state: st, reward: 0 };
  const force = action === 1 ? FORCE_MAG : -FORCE_MAG;
  const cosT = Math.cos(st.theta);
  const sinT = Math.sin(st.theta);
  const temp = (force + POLE_MASS_LEN * st.thetaDot * st.thetaDot * sinT) / TOTAL_MASS;
  const thetaAcc = (GRAVITY * sinT - cosT * temp) / (HALF_LEN * (4 / 3 - (MASS_POLE * cosT * cosT) / TOTAL_MASS));
  const xAcc = temp - (POLE_MASS_LEN * thetaAcc * cosT) / TOTAL_MASS;

  const x = st.x + TAU * st.xDot;
  const xDot = st.xDot + TAU * xAcc;
  const theta = st.theta + TAU * st.thetaDot;
  const thetaDot = st.thetaDot + TAU * thetaAcc;
  const done = Math.abs(x) > 2.4 || Math.abs(theta) > (12 * Math.PI) / 180;

  return {
    state: { x, xDot, theta, thetaDot, steps: st.steps + 1, done },
    reward: done ? 0 : 1,
  };
}

/** 策略梯度学到的线性 Softmax 策略 π_θ(Right | s) = σ(w · s) */
export function cartPoleSoftmaxProbRight(st: CartPoleState, weights = [0.6, 1.2, 6.5, 2.8]): number {
  const z = weights[0] * st.x + weights[1] * st.xDot + weights[2] * st.theta + weights[3] * st.thetaDot;
  return 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, z))));
}
