import type { MotionEntry } from '../../types';
import { MOTION_THEME } from '../../kit';
import { PolicyGradientMorphMotion } from './PolicyGradientMorphMotion';
import { ActorCriticDuetMotion } from './ActorCriticDuetMotion';
import { PPOClipOscilloscopeMotion } from './PPOClipOscilloscopeMotion';

export const entries: MotionEntry[] = [
  {
    id: 'policy-gradient-morph',
    chapter: '08-policy-gradient-ppo',
    title: '策略梯度直觉：概率波包变形 × 参数山丘登顶',
    description: '数学黑板风，展示正负优势如何推高/压低动作概率并驱动 θ 沿 J(θ) 等高线攀升。',
    component: PolicyGradientMorphMotion,
    durationInFrames: 225,
    fps: MOTION_THEME.fps,
    width: MOTION_THEME.width,
    height: MOTION_THEME.height,
  },
  {
    id: 'actor-critic-duet',
    chapter: '08-policy-gradient-ppo',
    title: 'Actor-Critic 双环共舞：演员行动 × 评论家打分',
    description: '霓虹电路风，清晰呈现 Actor 与 Critic 围绕 TD 优势脉冲 δ_t 同步更新的协作闭环。',
    component: ActorCriticDuetMotion,
    durationInFrames: 220,
    fps: MOTION_THEME.fps,
    width: MOTION_THEME.width,
    height: MOTION_THEME.height,
  },
  {
    id: 'ppo-clip-oscilloscope',
    chapter: '08-policy-gradient-ppo',
    title: 'PPO-Clip 双通道示波器与零梯度机械限位',
    description: '工程示波器风，左右分示正负优势下概率比撞上 1±ε 限位壁后梯度归零的保护机制。',
    component: PPOClipOscilloscopeMotion,
    durationInFrames: 220,
    fps: MOTION_THEME.fps,
    width: MOTION_THEME.width,
    height: MOTION_THEME.height,
  },
];
