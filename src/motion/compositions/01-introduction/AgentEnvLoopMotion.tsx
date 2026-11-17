import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { CLAMP, MOTION_THEME, Stage, springScale, type MotionBeat } from '../../kit';

const BEATS: MotionBeat[] = [
  {
    id: 'observe',
    startFrame: 0,
    endFrame: 55,
    tag: 'Beat 1 · 感知状态 S_t',
    caption: '环境向智能体呈现当前状态 S_t（例如机器人在网格中的位置坐标与传感器读数）。',
    formula: 'S_t ∈ S',
  },
  {
    id: 'act',
    startFrame: 55,
    endFrame: 110,
    tag: 'Beat 2 · 策略决策 A_t',
    caption: '智能体依据策略 π(a|S_t) 采样并输出动作 A_t，作用于环境。',
    formula: 'A_t ~ π(· | S_t)',
  },
  {
    id: 'transition',
    startFrame: 110,
    endFrame: 165,
    tag: 'Beat 3 · 环境转移与奖励',
    caption: '环境根据动力学 p(s′, r | S_t, A_t) 转移到新状态 S_{t+1}，并反馈标量奖励 R_{t+1}。',
    formula: 'R_{t+1}, S_{t+1} ~ p(· | S_t, A_t)',
  },
  {
    id: 'trajectory',
    startFrame: 165,
    endFrame: 240,
    tag: 'Beat 4 · 轨迹累积与策略更新',
    caption: '这一闭环不断重复，产生轨迹 τ = (S_0, A_0, R_1, S_1, …)，智能体的目标是最大化累积折扣奖励。',
    formula: 'G_t = R_{t+1} + γ R_{t+2} + γ² R_{t+3} + …',
  },
];

const TRAJECTORY = [
  { t: 0, s: 's₀ (起点)', a: '向右 →', r: '-0.04', sNext: 's₁' },
  { t: 1, s: 's₁ (走廊)', a: '向右 →', r: '-0.04', sNext: 's₂' },
  { t: 2, s: 's₂ (路口)', a: '向上 ↑', r: '+1.00', sNext: 's₃ (终点)' },
];

export const AgentEnvLoopMotion: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const agentEnter = springScale(frame, fps, 0);
  const envEnter = springScale(frame, fps, 8);

  // 三个信号包在各自节拍内的推进进度 0..1
  const statePacket = interpolate(frame, [6, 48], [0, 1], CLAMP);
  const actionPacket = interpolate(frame, [60, 102], [0, 1], CLAMP);
  const rewardPacket = interpolate(frame, [115, 158], [0, 1], CLAMP);

  // 当前展示的交互步
  const stepIndex = frame < 110 ? 0 : frame < 185 ? 1 : 2;
  const current = TRAJECTORY[stepIndex];

  return (
    <Stage title="智能体—环境交互闭环 (Agent-Environment Loop)" chapterLabel="01 · 强化学习导论" beats={BEATS}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 24, height: '100%' }}>
        {/* 左侧：环路主视觉 SVG */}
        <div
          style={{
            position: 'relative',
            borderRadius: 18,
            backgroundColor: MOTION_THEME.bgCard,
            border: `1px solid ${MOTION_THEME.border}`,
            padding: 16,
          }}
        >
          <svg viewBox="0 0 680 460" style={{ width: '100%', height: '100%' }}>
            <defs>
              <linearGradient id="actionGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={MOTION_THEME.agent} />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
              <linearGradient id="stateGrad" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%" stopColor={MOTION_THEME.env} />
                <stop offset="100%" stopColor="#2dd4bf" />
              </linearGradient>
            </defs>

            {/* 上方通道：智能体 -> 环境 (Action A_t) */}
            <path
              d="M 340 85 C 510 85, 560 140, 560 220"
              fill="none"
              stroke={MOTION_THEME.agent}
              strokeWidth={4}
              strokeDasharray="8 6"
              opacity={0.45}
            />
            <path
              d="M 120 220 C 120 140, 170 85, 340 85"
              fill="none"
              stroke={MOTION_THEME.agent}
              strokeWidth={4}
              strokeDasharray="8 6"
              opacity={0.45}
            />
            <text x={340} y={56} textAnchor="middle" fill="#a5b4fc" fontSize={16} fontWeight={700}>
              动作 A_t = {current.a}
            </text>

            {/* 下方通道：环境 -> 智能体 (State S_{t+1} & Reward R_{t+1}) */}
            <path
              d="M 560 260 C 560 355, 480 390, 340 390 C 200 390, 120 355, 120 260"
              fill="none"
              stroke={MOTION_THEME.env}
              strokeWidth={4}
              opacity={0.45}
            />
            <text x={340} y={426} textAnchor="middle" fill="#5eead4" fontSize={15} fontWeight={700}>
              状态 S_&#123;t+1&#125; = {current.sNext}
            </text>

            {/* 内圈：奖励通道 R_{t+1} */}
            <path
              d="M 480 250 C 430 330, 250 330, 200 250"
              fill="none"
              stroke={MOTION_THEME.reward}
              strokeWidth={3}
              strokeDasharray="5 5"
              opacity={0.65}
            />
            <text x={340} y={325} textAnchor="middle" fill="#fcd34d" fontSize={14} fontWeight={700}>
              奖励 R_&#123;t+1&#125; = {current.r}
            </text>

            {/* 运动信号球 1：状态感知 */}
            {frame >= 6 && frame <= 55 && (
              <circle
                cx={interpolate(statePacket, [0, 1], [520, 160], CLAMP)}
                cy={interpolate(Math.sin(statePacket * Math.PI), [0, 1], [240, 385], CLAMP)}
                r={11}
                fill={MOTION_THEME.env}
              />
            )}

            {/* 运动信号球 2：动作发出 */}
            {frame >= 55 && frame <= 110 && (
              <circle
                cx={interpolate(actionPacket, [0, 1], [160, 520], CLAMP)}
                cy={interpolate(Math.sin(actionPacket * Math.PI), [0, 1], [220, 85], CLAMP)}
                r={12}
                fill={MOTION_THEME.agent}
              />
            )}

            {/* 运动信号球 3：新状态 + 奖励返回 */}
            {frame >= 110 && frame <= 165 && (
              <>
                <circle
                  cx={interpolate(rewardPacket, [0, 1], [520, 160], CLAMP)}
                  cy={interpolate(Math.sin(rewardPacket * Math.PI), [0, 1], [250, 390], CLAMP)}
                  r={11}
                  fill={MOTION_THEME.env}
                />
                <circle
                  cx={interpolate(rewardPacket, [0, 1], [480, 200], CLAMP)}
                  cy={interpolate(Math.sin(rewardPacket * Math.PI), [0, 1], [250, 310], CLAMP)}
                  r={9}
                  fill={MOTION_THEME.reward}
                />
              </>
            )}

            {/* 左侧节点：Agent 智能体 */}
            <g transform={`translate(140, 235) scale(${agentEnter})`}>
              <rect
                x={-95}
                y={-58}
                width={190}
                height={116}
                rx={20}
                fill="#1e1b4b"
                stroke={MOTION_THEME.agent}
                strokeWidth={frame >= 55 && frame < 110 ? 4 : 2}
              />
              <text x={0} y={-14} textAnchor="middle" fill="#e0e7ff" fontSize={20} fontWeight={800}>
                🤖 智能体 Agent
              </text>
              <text x={0} y={16} textAnchor="middle" fill="#a5b4fc" fontSize={13}>
                策略 π(a | s) · 价值 V(s)
              </text>
              <text x={0} y={38} textAnchor="middle" fill="#818cf8" fontSize={12}>
                当前观测: {current.s}
              </text>
            </g>

            {/* 右侧节点：Environment 环境 */}
            <g transform={`translate(540, 235) scale(${envEnter})`}>
              <rect
                x={-95}
                y={-58}
                width={190}
                height={116}
                rx={20}
                fill="#042f2e"
                stroke={MOTION_THEME.env}
                strokeWidth={frame >= 110 && frame < 165 ? 4 : 2}
              />
              <text x={0} y={-14} textAnchor="middle" fill="#ccfbf1" fontSize={20} fontWeight={800}>
                🌍 环境 Env
              </text>
              <text x={0} y={16} textAnchor="middle" fill="#5eead4" fontSize={13}>
                转移 p(s′, r | s, a)
              </text>
              <text x={0} y={38} textAnchor="middle" fill="#2dd4bf" fontSize={12}>
                时间步 t = {current.t} → {current.t + 1}
              </text>
            </g>
          </svg>
        </div>

        {/* 右侧：经验轨迹胶片 (Trajectory Tape) */}
        <div
          style={{
            borderRadius: 18,
            backgroundColor: MOTION_THEME.bgCard,
            border: `1px solid ${MOTION_THEME.border}`,
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>
              📼 交互轨迹记录 (Trajectory τ)
            </div>
            <div style={{ fontSize: 12, color: MOTION_THEME.textMuted, marginBottom: 16 }}>
              每一步产生一个四元组 (S_t, A_t, R_&#123;t+1&#125;, S_&#123;t+1&#125;)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {TRAJECTORY.map((step, i) => {
                const appear = interpolate(frame, [20 + i * 65, 42 + i * 65], [0, 1], CLAMP);
                const active = i === stepIndex;
                return (
                  <div
                    key={step.t}
                    style={{
                      opacity: appear,
                      transform: `translateY(${(1 - appear) * 14}px)`,
                      padding: '12px 14px',
                      borderRadius: 12,
                      backgroundColor: active ? 'rgba(99, 102, 241, 0.16)' : 'rgba(15, 23, 42, 0.65)',
                      border: `1px solid ${active ? MOTION_THEME.agent : MOTION_THEME.border}`,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 12,
                        fontFamily: MOTION_THEME.fontMono,
                        color: MOTION_THEME.textMuted,
                        marginBottom: 6,
                      }}
                    >
                      <span>Step t = {step.t}</span>
                      <span style={{ color: step.r.startsWith('+') ? '#34d399' : '#fbbf24', fontWeight: 700 }}>
                        R = {step.r}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                      <span style={{ color: '#5eead4', fontWeight: 600 }}>{step.s}</span>
                      <span style={{ color: MOTION_THEME.textDim }}>→</span>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 6,
                          backgroundColor: 'rgba(99, 102, 241, 0.22)',
                          color: '#c7d2fe',
                          fontWeight: 600,
                        }}
                      >
                        {step.a}
                      </span>
                      <span style={{ color: MOTION_THEME.textDim }}>→</span>
                      <span style={{ color: '#5eead4', fontWeight: 600 }}>{step.sNext}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 累计回报卡片 */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 12,
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
            }}
          >
            <div style={{ fontSize: 12, color: '#fde68a', marginBottom: 4 }}>奖励假设 (Reward Hypothesis)</div>
            <div style={{ fontSize: 13, color: '#fef3c7', lineHeight: 1.5 }}>
              智能体的一切目标都可以描述为<strong>最大化期望累积标量奖励</strong> E[G_t]。
            </div>
          </div>
        </div>
      </div>
    </Stage>
  );
};
