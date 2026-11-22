import type { MotionEntry } from '../../types';
import { MOTION_THEME } from '../../kit';
import { AgentEnvPulseMotion } from './AgentEnvPulseMotion';

export const entries: MotionEntry[] = [
  {
    id: 'agent-env-pulse',
    chapter: '01-worldview',
    title: '智能体—环境电路闭环与信用回溯波',
    description: '霓虹电路数据流演示交互闭环，并在抵达终点后通过推镜特写展示延迟奖励如何沿轨迹倒流分配信用。',
    component: AgentEnvPulseMotion,
    durationInFrames: 270,
    fps: MOTION_THEME.fps,
    width: MOTION_THEME.width,
    height: MOTION_THEME.height,
  },
];
