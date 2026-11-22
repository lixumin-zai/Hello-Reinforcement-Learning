import type { MotionEntry } from '../../types';
import { LLMTokenStreamMotion } from './LLMTokenStreamMotion';
import { RLHFFourModelsMotion } from './RLHFFourModelsMotion';
import { GRPOLaserVerifyMotion } from './GRPOLaserVerifyMotion';

/** 第 10 章：强化学习与大语言模型——RLHF、DPO 与 GRPO 的动效讲解注册表 */
export const entries: MotionEntry[] = [
  {
    id: 'llm-token-stream',
    title: 'LLM Token 级 MDP 流与稀疏奖励',
    chapter: '10-rl-for-llm',
    description: '现代 AI 终端风：逐 Token 展示自回归动作流、Top-5 词表分布变化、KL 散度仪表与终局稀疏奖励脉冲。',
    component: LLMTokenStreamMotion,
    durationInFrames: 270,
    fps: 30,
    width: 1280,
    height: 720,
  },
  {
    id: 'rlhf-four-models',
    title: 'RLHF-PPO 四大模型数据流闭环',
    chapter: '10-rl-for-llm',
    description: 'AI 系统架构风：动态演练 Actor、冻结 Reference、冻结 Reward Model 与 Critic 协同前向打分与双路反向更新。',
    component: RLHFFourModelsMotion,
    durationInFrames: 270,
    fps: 30,
    width: 1280,
    height: 720,
  },
  {
    id: 'grpo-laser-verify',
    title: 'DeepSeek-R1 / GRPO 激光质检流水线',
    chapter: '10-rl-for-llm',
    description: 'AI 终端激光质检风：4 条并行思维链经规则验证激光打分、组内 Z-score 归一化为红绿优势光谱并省掉 Critic 显存。',
    component: GRPOLaserVerifyMotion,
    durationInFrames: 270,
    fps: 30,
    width: 1280,
    height: 720,
  },
];
