// ⚠️ 自动生成：node scripts/scaffold-content.mjs —— 请勿手动编辑
import type { MotionEntry } from '../types';
import { entries as ch01_worldview } from './01-worldview';
import { entries as ch02_bandits } from './02-bandits';
import { entries as ch03_mdp_bellman } from './03-mdp-bellman';
import { entries as ch04_dynamic_programming } from './04-dynamic-programming';
import { entries as ch05_monte_carlo } from './05-monte-carlo';
import { entries as ch06_temporal_difference } from './06-temporal-difference';
import { entries as ch07_dqn } from './07-dqn';
import { entries as ch08_policy_gradient_ppo } from './08-policy-gradient-ppo';
import { entries as ch09_control_and_planning } from './09-control-and-planning';
import { entries as ch10_rl_for_llm } from './10-rl-for-llm';

export const motionEntries: MotionEntry[] = [
  ...ch01_worldview,
  ...ch02_bandits,
  ...ch03_mdp_bellman,
  ...ch04_dynamic_programming,
  ...ch05_monte_carlo,
  ...ch06_temporal_difference,
  ...ch07_dqn,
  ...ch08_policy_gradient_ppo,
  ...ch09_control_and_planning,
  ...ch10_rl_for_llm,
];
