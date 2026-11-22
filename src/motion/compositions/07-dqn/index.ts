import type { MotionEntry } from '../../types';
import { MOTION_THEME } from '../../kit';
import { MountainCarTelemetryMotion } from './MountainCarTelemetryMotion';
import { DQNIndustrialPipelineMotion } from './DQNIndustrialPipelineMotion';

export const entries: MotionEntry[] = [
  {
    id: 'mountain-car-telemetry',
    chapter: '07-dqn',
    title: 'Mountain Car 物理摆荡 × 瓦片编码相空间遥测',
    description: '工程遥测 HUD 风，左侧运行真实山地车物理积分，右侧同步描绘相空间能量螺旋与重叠瓦片激活。',
    component: MountainCarTelemetryMotion,
    durationInFrames: 240,
    fps: MOTION_THEME.fps,
    width: MOTION_THEME.width,
    height: MOTION_THEME.height,
  },
  {
    id: 'dqn-industrial-pipeline',
    chapter: '07-dqn',
    title: 'DQN 工业数据流水线：经验回放 × 目标网络',
    description: '全景追踪像素帧进入环形回放池、随机抽样 Mini-batch、在线网反传与目标网周期拷贝的完整闭环。',
    component: DQNIndustrialPipelineMotion,
    durationInFrames: 230,
    fps: MOTION_THEME.fps,
    width: MOTION_THEME.width,
    height: MOTION_THEME.height,
  },
];
