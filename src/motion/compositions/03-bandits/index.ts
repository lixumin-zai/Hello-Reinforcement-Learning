import type { MotionEntry } from '../../types';
import { MOTION_THEME } from '../../kit';
import { EpsilonGreedyMotion } from './EpsilonGreedyMotion';
import { UCBConfidenceMotion } from './UCBConfidenceMotion';

export const entries: MotionEntry[] = [
  {
    id: 'epsilon-greedy-choice',
    chapter: '03-bandits',
    title: 'ε-贪心：掷骰探索 vs 贪心利用',
    description: '在 5 臂老虎机上逐步展示 ε 随机探索与 1-ε 贪心利用如何共同收敛到真实价值。',
    component: EpsilonGreedyMotion,
    durationInFrames: 210,
    fps: MOTION_THEME.fps,
    width: MOTION_THEME.width,
    height: MOTION_THEME.height,
  },
  {
    id: 'ucb-confidence',
    chapter: '03-bandits',
    title: 'UCB1 置信区间收缩与乐观选择',
    description: '置信上界 Q_t(a) + c√(ln t / N_t(a)) 随拉动次数收缩并自动锁定最优臂。',
    component: UCBConfidenceMotion,
    durationInFrames: 210,
    fps: MOTION_THEME.fps,
    width: MOTION_THEME.width,
    height: MOTION_THEME.height,
  },
];
