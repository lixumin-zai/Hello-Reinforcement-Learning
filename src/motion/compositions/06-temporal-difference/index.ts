import type { MotionEntry } from '../../types';
import { MOTION_THEME } from '../../kit';
import { TDErrorMotion } from './TDErrorMotion';
import { QLearningUpdateMotion } from './QLearningUpdateMotion';

export const entries: MotionEntry[] = [
  {
    id: 'td-error',
    chapter: '06-temporal-difference',
    title: 'TD(0) 自举目标与 TD 误差牵引',
    description: '可视化 TD 目标 R_{t+1} + γV(S_{t+1}) 与当前估计 V(S_t) 之间的误差 δ_t 如何拉动价值更新。',
    component: TDErrorMotion,
    durationInFrames: 210,
    fps: MOTION_THEME.fps,
    width: MOTION_THEME.width,
    height: MOTION_THEME.height,
  },
  {
    id: 'q-learning-update',
    chapter: '06-temporal-difference',
    title: 'Q-learning 单步离策略更新',
    description: '智能体移动、扫描下一状态 max Q(s′,·)、计算 TD 目标并回写 Q(s,a) 的分步拆解。',
    component: QLearningUpdateMotion,
    durationInFrames: 210,
    fps: MOTION_THEME.fps,
    width: MOTION_THEME.width,
    height: MOTION_THEME.height,
  },
];
