import type { MotionEntry } from '../../types';
import { MOTION_THEME } from '../../kit';
import { TDSpringPhysicsMotion } from './TDSpringPhysicsMotion';
import { SARSAvsQSplitMotion } from './SARSAvsQSplitMotion';
import { EligibilityGlowTrailMotion } from './EligibilityGlowTrailMotion';

export const entries: MotionEntry[] = [
  {
    id: 'td-spring-physics',
    chapter: '06-temporal-difference',
    title: 'TD(0) 机械弹簧模型：用估计牵引估计',
    description: '工程遥测物理风，用真实弹性线圈弹簧呈现 TD 误差 δ_t 如何按步长 α 拉动状态价值更新。',
    component: TDSpringPhysicsMotion,
    durationInFrames: 220,
    fps: MOTION_THEME.fps,
    width: MOTION_THEME.width,
    height: MOTION_THEME.height,
  },
  {
    id: 'sarsa-vs-q-split',
    chapter: '06-temporal-difference',
    title: '分屏竞速：悬崖边的 SARSA vs Q-learning',
    description: '上下双屏实时对比在策略避险的 SARSA 与离策略贴崖疾行的 Q-learning 的路径分岔。',
    component: SARSAvsQSplitMotion,
    durationInFrames: 230,
    fps: MOTION_THEME.fps,
    width: MOTION_THEME.width,
    height: MOTION_THEME.height,
  },
  {
    id: 'eligibility-glow-trail',
    chapter: '06-temporal-difference',
    title: 'TD(λ) 荧光资格迹：瞬时全路径信用回传',
    description: '智能体沿走廊留下按 (γλ)^k 衰减的荧光尾迹，触碰终局奖励时整条路径同步亮起更新。',
    component: EligibilityGlowTrailMotion,
    durationInFrames: 215,
    fps: MOTION_THEME.fps,
    width: MOTION_THEME.width,
    height: MOTION_THEME.height,
  },
];
