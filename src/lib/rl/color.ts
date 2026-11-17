/**
 * 统一的语义配色（交互组件与动效共用，保证“同一概念同一颜色”）。
 *
 * - agent   智能体 / 策略 / 动作     → 靛蓝
 * - env     环境 / 状态 / 转移       → 青绿
 * - reward  奖励 / 回报 / 目标       → 琥珀
 * - value   价值 / Q 值 / Critic     → 紫
 * - danger  惩罚 / 陷阱 / 误差       → 玫红
 */
export const RL_COLORS = {
  agent: '#6366f1',
  env: '#14b8a6',
  reward: '#f59e0b',
  value: '#a855f7',
  danger: '#f43f5e',
  muted: '#94a3b8',
} as const;

export type RLColorKey = keyof typeof RL_COLORS;

/** 价值 → 颜色（负值玫红，正值青绿，0 为透明），用于热力图 */
export function valueToColor(v: number, maxAbs: number, alpha = 0.85): string {
  const m = Math.max(maxAbs, 1e-6);
  const x = Math.max(-1, Math.min(1, v / m));
  const [r, g, b] = x >= 0 ? [20, 184, 166] : [244, 63, 94];
  return `rgba(${r}, ${g}, ${b}, ${(Math.abs(x) * alpha).toFixed(3)})`;
}
