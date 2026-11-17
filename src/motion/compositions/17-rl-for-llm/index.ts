import type { MotionEntry } from '../../types';
import { MOTION_THEME } from '../../kit';
import { GRPOGroupMotion } from './GRPOGroupMotion';

export const entries: MotionEntry[] = [
  {
    id: 'grpo-group',
    chapter: '17-rl-for-llm',
    title: 'GRPO 组采样与相对优势计算',
    description: '同一 Prompt 采样 G 条回答、可验证规则打分、组内均值/标准差归一化计算优势并更新策略。',
    component: GRPOGroupMotion,
    durationInFrames: 240,
    fps: MOTION_THEME.fps,
    width: MOTION_THEME.width,
    height: MOTION_THEME.height,
  },
];
