import type { MotionEntry } from '../../types';
import { MOTION_THEME } from '../../kit';
import { PPOClipMotion } from './PPOClipMotion';

export const entries: MotionEntry[] = [
  {
    id: 'ppo-clip',
    chapter: '11-trust-region',
    title: 'PPO-Clip 截断替代目标函数',
    description: '对比优势 A_t > 0 与 A_t < 0 两种情形下，概率比 r_t(θ) 超出 [1-ε, 1+ε] 时目标被剪平的过程。',
    component: PPOClipMotion,
    durationInFrames: 210,
    fps: MOTION_THEME.fps,
    width: MOTION_THEME.width,
    height: MOTION_THEME.height,
  },
];
