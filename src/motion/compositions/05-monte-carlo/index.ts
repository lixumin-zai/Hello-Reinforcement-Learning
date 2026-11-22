import type { MotionEntry } from '../../types';
import { MOTION_THEME } from '../../kit';
import { MCTabletopRewindMotion } from './MCTabletopRewindMotion';
import { ISReweightScaleMotion } from './ISReweightScaleMotion';

export const entries: MotionEntry[] = [
  {
    id: 'mc-tabletop-rewind',
    chapter: '05-monte-carlo',
    title: '蒙特卡洛 21 点绿绒牌桌 × 终局时间倒带',
    description: '绿绒牌桌风，正向打完一整局 21 点后启动时间倒带特效，反向累加回报 G_t 更新价值。',
    component: MCTabletopRewindMotion,
    durationInFrames: 225,
    fps: MOTION_THEME.fps,
    width: MOTION_THEME.width,
    height: MOTION_THEME.height,
  },
  {
    id: 'is-reweight-scale',
    chapter: '05-monte-carlo',
    title: '离策略重要性采样：连乘尖峰爆炸 vs 加权归一化',
    description: '对比普通 IS 被 2⁵=32× 长轨迹样本拽飞，以及加权 IS 如何通过 Σρ 分母稳住估计。',
    component: ISReweightScaleMotion,
    durationInFrames: 225,
    fps: MOTION_THEME.fps,
    width: MOTION_THEME.width,
    height: MOTION_THEME.height,
  },
];
