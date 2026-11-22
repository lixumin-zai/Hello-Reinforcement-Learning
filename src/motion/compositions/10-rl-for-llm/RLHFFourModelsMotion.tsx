import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { CLAMP, MOTION_THEME, Stage, type MotionBeat } from '../../kit';

const BEATS: MotionBeat[] = [
  {
    id: 'rollout',
    startFrame: 0,
    endFrame: 65,
    tag: 'Stage 1 · Actor 采样生成 Rollout',
    caption: '给定 Prompt x，可训练的策略模型 Actor π_θ 采样生成完整回答 y，并同时送入其余三个大模型！',
    formula: 'y ~ π_θ(· | x)   (4 Large Models in GPU Memory!)',
  },
  {
    id: 'kl-reward',
    startFrame: 65,
    endFrame: 135,
    tag: 'Stage 2 · 冻结 Reference 与 Reward Model 打分',
    caption: '冻结的 π_ref 计算 KL 偏离惩罚防止语言崩坏，冻结的 Reward Model r_ψ 给出序列质量分，汇合成实际奖励！',
    formula: 'r_total = r_ψ(x, y) - β · log(π_θ(y|x) / π_ref(y|x))',
  },
  {
    id: 'critic-gae',
    startFrame: 135,
    endFrame: 200,
    tag: 'Stage 3 · Critic 估计状态价值与 GAE 优势',
    caption: '可训练的 Critic V_φ 逐 Token 预测基线价值，与实际奖励相减算出广义优势 Â_t，告诉每个词超常还是失常！',
    formula: 'Â_t = GAE(r_total, V_φ(s_t))',
  },
  {
    id: 'backprop',
    startFrame: 200,
    endFrame: 270,
    tag: 'Stage 4 · 双路反向传播（仅更新 Actor & Critic）',
    caption: 'PPO-Clip 梯度回传更新 Actor π_θ，均方误差回传更新 Critic V_φ；Reference 与 RM 始终保持冻结！',
    formula: 'Update θ (PPO-Clip) & φ (Value MSE) | Freeze π_ref, r_ψ',
  },
];

export const RLHFFourModelsMotion: React.FC = () => {
  const frame = useCurrentFrame();

  const p1 = interpolate(frame, [10, 58], [0, 1], CLAMP);
  const p2 = interpolate(frame, [70, 128], [0, 1], CLAMP);
  const p3 = interpolate(frame, [140, 192], [0, 1], CLAMP);
  const p4 = interpolate(frame, [205, 260], [0, 1], CLAMP);

  return (
    <Stage
      title="RLHF-PPO 四大模型协同数据流（显存四倍开销的由来）"
      chapterLabel="Ch 10 · 大模型强化学习"
      world="terminal"
      beats={BEATS}
    >
      <svg viewBox="0 0 1200 470" style={{ width: '100%', height: '100%' }}>
        {/* Prompt 入口 */}
        <rect x={38} y={185} width={135} height={74} rx={14} fill="rgba(99,102,241,0.22)" stroke="#818cf8" strokeWidth={2.5} />
        <text x={105} y={216} textAnchor="middle" fill="#e0e7ff" fontSize={16} fontWeight={800} fontFamily={MOTION_THEME.fontMono}>
          Prompt x
        </text>
        <text x={105} y={240} textAnchor="middle" fill="#94a3b8" fontSize={12} fontFamily={MOTION_THEME.fontMono}>
          人类提示词
        </text>

        {/* 模型 1: Actor π_θ (可训练) */}
        <rect
          x={235}
          y={44}
          width={230}
          height={102}
          rx={16}
          fill={frame >= 200 ? 'rgba(16,185,129,0.24)' : 'rgba(13,17,23,0.92)'}
          stroke="#34d399"
          strokeWidth={frame < 65 || frame >= 200 ? 3.5 : 2}
        />
        <text x={350} y={76} textAnchor="middle" fill="#6ee7b7" fontSize={18} fontWeight={900} fontFamily={MOTION_THEME.fontMono}>
          ① Actor π_θ
        </text>
        <text x={350} y={102} textAnchor="middle" fill="#cbd5e1" fontSize={13} fontFamily={MOTION_THEME.fontMono}>
          策略模型 · 采样 y
        </text>
        <rect x={288} y={114} width={124} height={22} rx={11} fill="rgba(52,211,153,0.2)" />
        <text x={350} y={129} textAnchor="middle" fill="#34d399" fontSize={11} fontWeight={800} fontFamily={MOTION_THEME.fontMono}>
          🔥 可训练 (Trainable)
        </text>

        {/* 模型 2: Reference π_ref (冻结) */}
        <rect
          x={555}
          y={44}
          width={230}
          height={102}
          rx={16}
          fill="rgba(13,17,23,0.92)"
          stroke="#38bdf8"
          strokeWidth={frame >= 65 && frame < 135 ? 3.5 : 2}
        />
        <text x={670} y={76} textAnchor="middle" fill="#7dd3fc" fontSize={18} fontWeight={900} fontFamily={MOTION_THEME.fontMono}>
          ② Reference π_ref
        </text>
        <text x={670} y={102} textAnchor="middle" fill="#cbd5e1" fontSize={13} fontFamily={MOTION_THEME.fontMono}>
          SFT 锚点 · 算 KL 惩罚
        </text>
        <rect x={612} y={114} width={116} height={22} rx={11} fill="rgba(56,189,248,0.18)" />
        <text x={670} y={129} textAnchor="middle" fill="#38bdf8" fontSize={11} fontWeight={800} fontFamily={MOTION_THEME.fontMono}>
          ❄ 冻结 (Frozen)
        </text>

        {/* 模型 3: Reward Model r_ψ (冻结) */}
        <rect
          x={555}
          y={184}
          width={230}
          height={102}
          rx={16}
          fill="rgba(13,17,23,0.92)"
          stroke="#f59e0b"
          strokeWidth={frame >= 65 && frame < 135 ? 3.5 : 2}
        />
        <text x={670} y={216} textAnchor="middle" fill="#fcd34d" fontSize={18} fontWeight={900} fontFamily={MOTION_THEME.fontMono}>
          ③ Reward r_ψ
        </text>
        <text x={670} y={242} textAnchor="middle" fill="#cbd5e1" fontSize={13} fontFamily={MOTION_THEME.fontMono}>
          人类偏好代理打分
        </text>
        <rect x={612} y={254} width={116} height={22} rx={11} fill="rgba(245,158,11,0.18)" />
        <text x={670} y={269} textAnchor="middle" fill="#f59e0b" fontSize={11} fontWeight={800} fontFamily={MOTION_THEME.fontMono}>
          ❄ 冻结 (Frozen)
        </text>

        {/* 模型 4: Critic V_φ (可训练) */}
        <rect
          x={555}
          y={326}
          width={230}
          height={102}
          rx={16}
          fill={frame >= 200 ? 'rgba(167,139,250,0.22)' : 'rgba(13,17,23,0.92)'}
          stroke="#a78bfa"
          strokeWidth={frame >= 135 ? 3.5 : 2}
        />
        <text x={670} y={358} textAnchor="middle" fill="#c4b5fd" fontSize={18} fontWeight={900} fontFamily={MOTION_THEME.fontMono}>
          ④ Critic V_φ
        </text>
        <text x={670} y={384} textAnchor="middle" fill="#cbd5e1" fontSize={13} fontFamily={MOTION_THEME.fontMono}>
          价值基线 · 降方差
        </text>
        <rect x={608} y={396} width={124} height={22} rx={11} fill="rgba(167,139,250,0.2)" />
        <text x={670} y={411} textAnchor="middle" fill="#c4b5fd" fontSize={11} fontWeight={800} fontFamily={MOTION_THEME.fontMono}>
          🔥 可训练 (Trainable)
        </text>

        {/* 右侧运算节点：总奖励混合器 & GAE 优势 */}
        <rect x={875} y={108} width={275} height={92} rx={14} fill="rgba(245,158,11,0.14)" stroke="#f59e0b" strokeWidth={2} opacity={frame >= 65 ? 1 : 0.3} />
        <text x={1012} y={142} textAnchor="middle" fill="#fde68a" fontSize={15} fontWeight={800} fontFamily={MOTION_THEME.fontMono}>
          总奖励 r_total
        </text>
        <text x={1012} y={172} textAnchor="middle" fill="#f8fafc" fontSize={14} fontFamily={MOTION_THEME.fontMono}>
          r_ψ(x,y) - β·D_KL
        </text>

        <rect x={875} y={266} width={275} height={116} rx={14} fill="rgba(167,139,250,0.16)" stroke="#a78bfa" strokeWidth={2.5} opacity={frame >= 135 ? 1 : 0.3} />
        <text x={1012} y={300} textAnchor="middle" fill="#ddd6fe" fontSize={16} fontWeight={900} fontFamily={MOTION_THEME.fontMono}>
          GAE 优势 & PPO-Clip
        </text>
        <text x={1012} y={330} textAnchor="middle" fill="#f8fafc" fontSize={14} fontFamily={MOTION_THEME.fontMono}>
          Â_t = GAE(r_total, V_φ)
        </text>
        <text x={1012} y={358} textAnchor="middle" fill="#34d399" fontSize={12.5} fontWeight={700} fontFamily={MOTION_THEME.fontMono}>
          驱动 Actor + Critic 梯度更新
        </text>

        {/* 前向连接线 */}
        <path d="M 173 206 L 235 95" fill="none" stroke="#818cf8" strokeWidth={2.5} />
        <path d="M 465 95 L 555 95" fill="none" stroke="#34d399" strokeWidth={2.5} />
        <path d="M 465 95 C 510 95, 510 235, 555 235" fill="none" stroke="#34d399" strokeWidth={2.5} />
        <path d="M 465 95 C 500 95, 500 377, 555 377" fill="none" stroke="#34d399" strokeWidth={2.5} />
        <path d="M 785 95 L 875 140" fill="none" stroke="#38bdf8" strokeWidth={2.5} />
        <path d="M 785 235 L 875 170" fill="none" stroke="#f59e0b" strokeWidth={2.5} />
        <path d="M 1012 200 L 1012 266" fill="none" stroke="#facc15" strokeWidth={2.5} />
        <path d="M 785 377 L 875 340" fill="none" stroke="#a78bfa" strokeWidth={2.5} />

        {/* Stage 1 流动数据光球 */}
        {p1 > 0 && p1 < 1 && (
          <>
            <circle cx={interpolate(p1, [0, 1], [465, 555], CLAMP)} cy={95} r={8} fill="#34d399" />
            <circle cx={interpolate(p1, [0, 1], [465, 555], CLAMP)} cy={interpolate(p1, [0, 1], [95, 235], CLAMP)} r={8} fill="#34d399" />
            <circle cx={interpolate(p1, [0, 1], [465, 555], CLAMP)} cy={interpolate(p1, [0, 1], [95, 377], CLAMP)} r={8} fill="#34d399" />
          </>
        )}

        {/* Stage 2 KL + Reward 汇合光球 */}
        {p2 > 0 && p2 < 1 && (
          <>
            <circle cx={interpolate(p2, [0, 1], [785, 875], CLAMP)} cy={interpolate(p2, [0, 1], [95, 140], CLAMP)} r={8} fill="#38bdf8" />
            <circle cx={interpolate(p2, [0, 1], [785, 875], CLAMP)} cy={interpolate(p2, [0, 1], [235, 170], CLAMP)} r={8} fill="#f59e0b" />
          </>
        )}

        {/* Stage 3 GAE 汇聚光球 */}
        {p3 > 0 && p3 < 1 && (
          <>
            <circle cx={1012} cy={interpolate(p3, [0, 1], [200, 266], CLAMP)} r={8} fill="#facc15" />
            <circle cx={interpolate(p3, [0, 1], [785, 875], CLAMP)} cy={interpolate(p3, [0, 1], [377, 340], CLAMP)} r={8} fill="#a78bfa" />
          </>
        )}

        {/* Stage 4 反向梯度弧线 & 脉冲 */}
        {p4 > 0 && (
          <g opacity={Math.min(1, p4 * 1.4)}>
            <path
              d="M 1012 382 C 1012 452, 350 452, 350 146"
              fill="none"
              stroke="#fb7185"
              strokeWidth={3}
              strokeDasharray="10 6"
            />
            <circle
              cx={interpolate(p4, [0, 1], [1012, 350], CLAMP)}
              cy={p4 < 0.5 ? interpolate(p4, [0, 0.5], [382, 444], CLAMP) : interpolate(p4, [0.5, 1], [444, 146], CLAMP)}
              r={10}
              fill="#fb7185"
              stroke="#fff"
              strokeWidth={2}
            />
            <rect x={232} y={326} width={250} height={84} rx={12} fill="rgba(244,63,94,0.14)" stroke="#fb7185" strokeWidth={2} />
            <text x={357} y={356} textAnchor="middle" fill="#fda4af" fontSize={14} fontWeight={800} fontFamily={MOTION_THEME.fontMono}>
              ⚠ 显存痛点：4× 模型驻留
            </text>
            <text x={357} y={380} textAnchor="middle" fill="#e2e8f0" fontSize={12} fontFamily={MOTION_THEME.fontMono}>
              Actor + Critic + Ref + RM
            </text>
            <text x={357} y={398} textAnchor="middle" fill="#34d399" fontSize={11.5} fontWeight={700} fontFamily={MOTION_THEME.fontMono}>
              → 催生了 DPO 与 GRPO！
            </text>
          </g>
        )}
      </svg>
    </Stage>
  );
};
