import type { MotionEntry } from '../../types';
import { MOTION_THEME } from '../../kit';
import { BanditArcadeTrapMotion } from './BanditArcadeTrapMotion';
import { EpsilonCoinSplitMotion } from './EpsilonCoinSplitMotion';
import { BayesianUCBSculptureMotion } from './BayesianUCBSculptureMotion';

export const entries: MotionEntry[] = [
  {
    id: 'bandit-arcade-trap',
    chapter: '02-bandits',
    title: '霓虹赌场：纯贪心的局部最优锁死陷阱',
    description: '复古街机风格 + 电影推镜特写，演示纯贪心策略如何因开局一次倒霉永远错失 78% 黄金机台。',
    component: BanditArcadeTrapMotion,
    durationInFrames: 270,
    fps: MOTION_THEME.fps,
    width: MOTION_THEME.width,
    height: MOTION_THEME.height,
  },
  {
    id: 'epsilon-coin-split',
    chapter: '02-bandits',
    title: 'ε-贪心双通道分流 × 非平稳指数遗忘',
    description: '偏置硬币分流探索与利用双轨道，以及常数步长 α 如何用指数近因权重追踪飘移赌场。',
    component: EpsilonCoinSplitMotion,
    durationInFrames: 240,
    fps: MOTION_THEME.fps,
    width: MOTION_THEME.width,
    height: MOTION_THEME.height,
  },
  {
    id: 'bayesian-ucb-sculpture',
    chapter: '02-bandits',
    title: 'Thompson Sampling 贝叶斯波峰雕塑 & UCB 压帽',
    description: '3Blue1Brown 数学黑板风，实时绘制 4 条精确 Beta(α,β) 密度曲线随采样变尖收敛的完整过程。',
    component: BayesianUCBSculptureMotion,
    durationInFrames: 240,
    fps: MOTION_THEME.fps,
    width: MOTION_THEME.width,
    height: MOTION_THEME.height,
  },
];
