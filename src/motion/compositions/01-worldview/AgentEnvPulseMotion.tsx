import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { CLAMP, Camera, MOTION_THEME, Stage, springScale, type MotionBeat } from '../../kit';

const BEATS: MotionBeat[] = [
  {
    id: 'pulse-loop',
    startFrame: 0,
    endFrame: 70,
    tag: 'Beat 1 · 交互电路闭环',
    caption: '状态信号 S_t 从环境流向智能体，策略 π 输出动作脉冲 A_t 改变世界状态。',
    formula: 'S_t → A_t ~ π(·|S_t) → (R_{t+1}, S_{t+1})',
  },
  {
    id: 'silent-steps',
    startFrame: 70,
    endFrame: 135,
    tag: 'Beat 2 · 延迟奖励的“沉默步”',
    caption: '前 3 步每步只有微弱的步数代价 (-0.2)，智能体在迷雾中还不知道哪一步是制胜关键。',
    formula: 'R₁ = -0.2,  R₂ = -0.2,  R₃ = -0.2',
  },
  {
    id: 'jackpot',
    startFrame: 135,
    endFrame: 185,
    tag: 'Beat 3 · 抵达终点，触发 +15 大奖！',
    caption: '第 4 步推开宝藏大门，环境瞬间爆发 +15.0 终局正奖励，轨迹 τ 宣告完成。',
    formula: 'R₄ = +15.0  (Terminal Goal)',
  },
  {
    id: 'credit-backwave',
    startFrame: 185,
    endFrame: 270,
    tag: 'Beat 4 · 金色信用回溯波 (Credit Assignment)',
    caption: '镜头聚焦轨迹胶片：折扣回报 G_t 像倒流的高能光波，从终点按 γ=0.85 逐格倒传，给早先的关键抉择记功！',
    formula: 'G_t = R_{t+1} + γ G_{t+1}   (γ = 0.85)',
  },
];

const TAPE = [
  { t: 0, s: 'S₀ 起点', a: '→', r: -0.2, g: 8.69 },
  { t: 1, s: 'S₁ 岔口', a: '↑ (关键)', r: -0.2, g: 10.46 },
  { t: 2, s: 'S₂ 秘道', a: '→', r: -0.2, g: 12.55 },
  { t: 3, s: 'S₃ 门前', a: '→', r: 15.0, g: 15.0 },
];

export const AgentEnvPulseMotion: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 镜头运镜：Beat 4 平滑下推聚焦到轨迹信用回溯波
  const camZoom = interpolate(frame, [180, 215], [1, 1.16], CLAMP);
  const camPanY = interpolate(frame, [180, 215], [0, -56], CLAMP);

  const coreScale = springScale(frame, fps, 0);
  const pulse1 = ((frame % 54) / 54);
  const backwaveProgress = interpolate(frame, [192, 255], [3, -0.2], CLAMP);
  const jackpotBurst = interpolate(frame, [138, 165], [0, 1], CLAMP);

  return (
    <Stage
      title="智能体—环境电路闭环与延迟信用回溯"
      chapterLabel="Ch 01 · 强化学习世界观"
      world="cyber"
      beats={BEATS}
    >
      <Camera zoom={camZoom} panY={camPanY}>
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* 上半部：全宽霓虹电路 SVG 舞台（告别双栏卡片） */}
          <div style={{ flex: 1.35, position: 'relative' }}>
            <svg viewBox="0 0 1200 320" style={{ width: '100%', height: '100%' }}>
              <defs>
                <filter id="cyberGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* 上方高能动作电路：Agent -> Environment */}
              <path
                d="M 330 125 C 460 32, 740 32, 870 125"
                fill="none"
                stroke="#6366f1"
                strokeWidth={5}
                opacity={0.35}
              />
              <path
                d="M 330 125 C 460 32, 740 32, 870 125"
                fill="none"
                stroke="#a5b4fc"
                strokeWidth={2.5}
                strokeDasharray="14 14"
                strokeDashoffset={-frame * 2.2}
              />
              <text x={600} y={40} textAnchor="middle" fill="#c7d2fe" fontSize={16} fontWeight={700}>
                ⚡ 动作决策流 Action A_t ~ π(· | S_t)
              </text>

              {/* 下方状态+奖励反馈电路：Environment -> Agent */}
              <path
                d="M 870 195 C 740 288, 460 288, 330 195"
                fill="none"
                stroke="#14b8a6"
                strokeWidth={5}
                opacity={0.35}
              />
              <path
                d="M 870 195 C 740 288, 460 288, 330 195"
                fill="none"
                stroke="#5eead4"
                strokeWidth={2.5}
                strokeDasharray="12 12"
                strokeDashoffset={-frame * 2.2}
              />
              <text x={600} y={292} textAnchor="middle" fill="#5eead4" fontSize={15} fontWeight={700}>
                📡 状态观测 S_&#123;t+1&#125; &amp; 标量奖励 R_&#123;t+1&#125;
              </text>

              {/* 沿曲线飞行的脉冲能量球 */}
              <circle
                cx={interpolate(pulse1, [0, 1], [340, 860], CLAMP)}
                cy={125 - Math.sin(pulse1 * Math.PI) * 70}
                r={9}
                fill="#818cf8"
                filter="url(#cyberGlow)"
              />
              <circle
                cx={interpolate(pulse1, [0, 1], [860, 340], CLAMP)}
                cy={195 + Math.sin(pulse1 * Math.PI) * 70}
                r={9}
                fill={frame >= 135 ? '#fbbf24' : '#2dd4bf'}
                filter="url(#cyberGlow)"
              />

              {/* 左侧：智能体核心反应堆 */}
              <g transform={`translate(210, 160) scale(${coreScale})`}>
                <rect
                  x={-135}
                  y={-72}
                  width={270}
                  height={144}
                  rx={24}
                  fill="rgba(30, 27, 75, 0.92)"
                  stroke="#818cf8"
                  strokeWidth={3}
                />
                <text x={0} y={-20} textAnchor="middle" fill="#e0e7ff" fontSize={22} fontWeight={800}>
                  🤖 智能体 Agent
                </text>
                <text x={0} y={10} textAnchor="middle" fill="#a5b4fc" fontSize={14}>
                  策略 π(a|s) · 价值记忆 V(s)
                </text>
                <text x={0} y={40} textAnchor="middle" fill="#6366f1" fontSize={12} fontFamily={MOTION_THEME.fontMono}>
                  目标：max E[ Σ γ^t R_&#123;t+1&#125; ]
                </text>
              </g>

              {/* 右侧：世界环境矩阵 */}
              <g transform={`translate(990, 160) scale(${coreScale})`}>
                <rect
                  x={-135}
                  y={-72}
                  width={270}
                  height={144}
                  rx={24}
                  fill="rgba(4, 47, 46, 0.92)"
                  stroke={frame >= 135 ? '#fbbf24' : '#2dd4bf'}
                  strokeWidth={frame >= 135 ? 4 : 3}
                />
                <text x={0} y={-20} textAnchor="middle" fill="#ccfbf1" fontSize={22} fontWeight={800}>
                  🌍 环境 Environment
                </text>
                <text x={0} y={10} textAnchor="middle" fill="#5eead4" fontSize={14}>
                  动力学 p(s′, r | s, a)
                </text>
                <text
                  x={0}
                  y={42}
                  textAnchor="middle"
                  fill={frame >= 135 ? '#fde047' : '#94a3b8'}
                  fontSize={15}
                  fontWeight={800}
                  fontFamily={MOTION_THEME.fontMono}
                >
                  {frame >= 135 ? '👑 JACKPOT R = +15.0!' : '步数代价 R = -0.2'}
                </text>
                {jackpotBurst > 0 && jackpotBurst < 1 && (
                  <circle
                    r={60 + jackpotBurst * 90}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth={4 * (1 - jackpotBurst)}
                    opacity={1 - jackpotBurst}
                  />
                )}
              </g>
            </svg>
          </div>

          {/* 下半部：横向轨迹胶片 + 反向金色信用波 */}
          <div
            style={{
              flex: 1,
              borderRadius: 18,
              backgroundColor: 'rgba(10, 18, 36, 0.86)',
              border: '1px solid rgba(99,102,241,0.32)',
              padding: '16px 26px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>
                🎞️ 经验轨迹胶片 τ —— 观察终局奖励如何倒流分配信用
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontFamily: MOTION_THEME.fontMono,
                  color: frame >= 185 ? '#fde047' : '#94a3b8',
                  fontWeight: 700,
                }}
              >
                {frame >= 185 ? '◀━━ 金色信用波倒流中 (γ = 0.85)' : '前向探索采样中 ━━▶'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
              {TAPE.map((step, i) => {
                const appeared = interpolate(frame, [25 + i * 36, 45 + i * 36], [0, 1], CLAMP);
                const litByBackwave = frame >= 185 && backwaveProgress <= i + 0.35;
                return (
                  <div
                    key={step.t}
                    style={{
                      opacity: appeared,
                      transform: `translateY(${(1 - appeared) * 14}px) scale(${litByBackwave ? 1.04 : 1})`,
                      borderRadius: 14,
                      padding: '12px 14px',
                      backgroundColor: litByBackwave ? 'rgba(245, 158, 11, 0.18)' : 'rgba(15, 23, 42, 0.8)',
                      border: `2px solid ${litByBackwave ? '#fbbf24' : 'rgba(148,163,184,0.22)'}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: MOTION_THEME.fontMono }}>
                      <span style={{ color: '#94a3b8' }}>t = {step.t}</span>
                      <span style={{ color: step.r > 0 ? '#34d399' : '#fb7185', fontWeight: 700 }}>
                        R={step.r > 0 ? `+${step.r}` : step.r}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', marginTop: 4 }}>
                      {step.s} <span style={{ color: '#818cf8' }}>{step.a}</span>
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 13,
                        fontFamily: MOTION_THEME.fontMono,
                        fontWeight: 800,
                        color: litByBackwave ? '#fde047' : '#475569',
                      }}
                    >
                      {litByBackwave ? `信用回报 G_${step.t} = +${step.g.toFixed(2)}` : 'G_t = 待终局揭晓…'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Camera>
    </Stage>
  );
};
