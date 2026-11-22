import type { MotionEntry } from '../../types';
import { MOTION_THEME } from '../../kit';
import { MCTSLivingTreeMotion } from './MCTSLivingTreeMotion';

export const entries: MotionEntry[] = [
  {
    id: 'mcts-living-tree',
    chapter: '09-control-and-planning',
    title: 'MCTS 有机搜索树：选择 → 扩展 → 模拟 → 回传',
    description: '分形树生长风，逐步演示 UCT 下探、新叶萌发、快速模拟得胜与 W/N 统计回传全过程。',
    component: MCTSLivingTreeMotion,
    durationInFrames: 245,
    fps: MOTION_THEME.fps,
    width: MOTION_THEME.width,
    height: MOTION_THEME.height,
  },
];
