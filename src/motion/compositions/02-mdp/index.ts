import type { MotionEntry } from '../../types';
import { MOTION_THEME } from '../../kit';
import { DiscountedReturnMotion } from './DiscountedReturnMotion';
import { BellmanBackupMotion } from './BellmanBackupMotion';

export const entries: MotionEntry[] = [
  {
    id: 'discounted-return',
    chapter: '02-mdp',
    title: '折扣回报 G_t 的衰减与汇聚',
    description: '未来奖励序列逐项乘以 γ^k 衰减并递归累加为 G_t = R_{t+1} + γ G_{t+1}。',
    component: DiscountedReturnMotion,
    durationInFrames: 210,
    fps: MOTION_THEME.fps,
    width: MOTION_THEME.width,
    height: MOTION_THEME.height,
  },
  {
    id: 'bellman-backup',
    chapter: '02-mdp',
    title: 'Bellman 期望与最优备份树',
    description: '从后继状态 s′ 经动作节点 (s,a) 向根状态 s 回传价值的完整备份过程。',
    component: BellmanBackupMotion,
    durationInFrames: 240,
    fps: MOTION_THEME.fps,
    width: MOTION_THEME.width,
    height: MOTION_THEME.height,
  },
];
