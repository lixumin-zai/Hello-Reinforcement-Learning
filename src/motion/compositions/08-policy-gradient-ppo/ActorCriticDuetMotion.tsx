import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { CLAMP, MOTION_THEME, Stage, type MotionBeat } from '../../kit';

const BEATS: MotionBeat[] = [
  {
    id: 'actor-act',
    startFrame: 0,
    endFrame: 65,
    tag: 'Beat 1 · 演员 (Actor π_θ) 上场表演动作 A_t',
    caption: '策略网络 Actor 接收状态 S_t，直接采样动作 A_t 与环境交互，收到奖励 R_{t+1} 与新状态 S_{t+1}。',
    formula: 'A_t ~ π_θ(· | S_t)',
  },
  {
    id: 'critic-score',
    startFrame: 65,
    endFrame: 140,
    tag: 'Beat 2 · 评论家 (Critic V_φ) 计算 TD 优势 δ_t',
    caption: '评论家不负责选动作，专门用价值网络 V_φ 计算刚才那一招比预期多赚了多少：δ_t = R + γV_φ(S′) - V_φ(S)。',
    formula: 'δ_t = R_{t+1} + γ V_φ(S_{t+1}) - V_φ(S_t)',
  },
  {
    id: 'dual-update',
    startFrame: 140,
    endFrame: 220,
    tag: 'Beat 3 · 双路共舞：同时更新 Actor 与 Critic',
    caption: 'TD 优势 δ_t 一方面指导 Actor 强化/削弱动作概率，另一方面修正 Critic 自身的估值误差，彻底告别 MC 高方差！',
    formula: 'θ ← θ + α_θ δ_t ∇log π_θ  |  φ ← φ + α_φ δ_t ∇V_φ',
  },
];

export const ActorCriticDuetMotion: React.FC = () => {
  const frame = useCurrentFrame();
  const pAct = interpolate(frame, [10, 58], [0, 1], CLAMP);
  const pCrit = interpolate(frame, [70, 130], [0, 1], CLAMP);
  const pUpd = interpolate(frame, [145, 205], [0, 1], CLAMP);

  return (
    <Stage
      title="Actor-Critic 双环共舞：演员决策 × 评论家实时打分"
      chapterLabel="Ch 08 · 策略梯度与 PPO"
      world="cyber"
      beats={BEATS}
    >
      <svg viewBox="0 0 1200 470" style={{ width: '100%', height: '100%' }}>
        {/* 左上：Actor */}
        <rect x={95} y={48} width={350} height={135} rx={22} fill="rgba(30,27,75,0.92)" stroke="#818cf8" strokeWidth={frame < 65 || frame >= 140 ? 4.5 : 2.5} />
        <text x={270} y={96} textAnchor="middle" fill="#e0e7ff" fontSize={22} fontWeight={800}>🎭 演员 Actor (策略网 π_θ)</text>
        <text x={270} y={130} textAnchor="middle" fill="#a5b4fc" fontSize={14}>输出动作概率分布，按优势 δ_t 更新 θ</text>
        <text x={270} y={158} textAnchor="middle" fill="#818cf8" fontSize={13} fontFamily={MOTION_THEME.fontMono}>Δθ ∝ δ_t · ∇_θ log π_θ(a|s)</text>

        {/* 左下：Critic */}
        <rect x={95} y={285} width={350} height={135} rx={22} fill="rgba(59,7,100,0.88)" stroke="#c084fc" strokeWidth={frame >= 65 ? 4.5 : 2.5} />
        <text x={270} y={333} textAnchor="middle" fill="#f3e8ff" fontSize={22} fontWeight={800}>🧐 评论家 Critic (价值网 V_φ)</text>
        <text x={270} y={367} textAnchor="middle" fill="#d8b4fe" fontSize={14}>评估状态好坏，输出低方差 TD 优势 δ_t</text>
        <text x={270} y={395} textAnchor="middle" fill="#c084fc" fontSize={13} fontFamily={MOTION_THEME.fontMono}>δ_t = r + γ V_φ(s′) - V_φ(s)</text>

        {/* 右中：Environment */}
        <rect x={765} y={168} width={335} height={135} rx={22} fill="rgba(4,47,46,0.92)" stroke="#2dd4bf" strokeWidth={3} />
        <text x={932} y={216} textAnchor="middle" fill="#ccfbf1" fontSize={22} fontWeight={800}>🌍 环境 Environment</text>
        <text x={932} y={250} textAnchor="middle" fill="#5eead4" fontSize={14}>接收动作 A_t，返回 R_&#123;t+1&#125;, S_&#123;t+1&#125;</text>

        {/* 动作流：Actor -> Env */}
        <path d="M 445 115 C 580 115, 650 185, 765 210" fill="none" stroke="#818cf8" strokeWidth={4} />
        {pAct > 0 && pAct < 1 && (
          <circle cx={interpolate(pAct, [0, 1], [445, 765], CLAMP)} cy={interpolate(pAct, [0, 1], [115, 210], CLAMP)} r={11} fill="#818cf8" stroke="#fff" strokeWidth={2} />
        )}
        <text x={615} y={128} textAnchor="middle" fill="#c7d2fe" fontSize={15} fontWeight={700}>动作 A_t</text>

        {/* 奖励状态流：Env -> Critic */}
        <path d="M 765 262 C 650 290, 580 352, 445 352" fill="none" stroke="#2dd4bf" strokeWidth={4} />
        {pCrit > 0 && pCrit < 1 && (
          <circle cx={interpolate(pCrit, [0, 1], [765, 445], CLAMP)} cy={interpolate(pCrit, [0, 1], [262, 352], CLAMP)} r={11} fill="#2dd4bf" stroke="#fff" strokeWidth={2} />
        )}
        <text x={620} y={356} textAnchor="middle" fill="#5eead4" fontSize={15} fontWeight={700}>奖励 R_&#123;t+1&#125;, 状态 S_&#123;t+1&#125;</text>

        {/* 核心优势脉冲：Critic -> Actor (TD 误差 δ_t) */}
        <line x1={270} y1={285} x2={270} y2={183} stroke="#facc15" strokeWidth={5} strokeDasharray="8 5" />
        {pUpd > 0 && pUpd < 1 && (
          <circle cx={270} cy={interpolate(pUpd, [0, 1], [285, 183], CLAMP)} r={12} fill="#facc15" stroke="#fff" strokeWidth={2.5} />
        )}
        <text x={365} y={240} textAnchor="middle" fill="#fde047" fontSize={16} fontWeight={800} fontFamily={MOTION_THEME.fontMono}>
          ⚡ 评价脉冲 δ_t / GAE
        </text>
      </svg>
    </Stage>
  );
};
