import type { MotionEntry } from '../../types';
import { MOTION_THEME } from '../../kit';
import { AgentEnvLoopMotion } from './AgentEnvLoopMotion';

export const entries: MotionEntry[] = [
  {
    id: 'agent-env-loop',
    chapter: '01-introduction',
    title: '智能体-环境交互循环',
    description: '观察状态 S_t → 执行动作 A_t → 获得奖励 R_{t+1} 与新状态 S_{t+1} 的完整闭环。',
    component: AgentEnvLoopMotion,
    durationInFrames: 240,
    fps: MOTION_THEME.fps,
    width: MOTION_THEME.width,
    height: MOTION_THEME.height,
  },
];
