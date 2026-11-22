import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { CLAMP, MOTION_THEME, Stage, type MotionBeat } from '../../kit';

const BEATS: MotionBeat[] = [
  {
    id: 'cliff-setup',
    startFrame: 0,
    endFrame: 55,
    tag: 'Beat 1 · 悬崖行走同一战场',
    caption: '底边整排是掉下去扣 -100 的悬崖，每步消耗 -1。两个智能体都在 ε=0.1 的探索噪声下学习！',
    formula: '每步 -1 · 坠崖 -100 (回起点) · 终点 G',
  },
  {
    id: 'diverge',
    startFrame: 55,
    endFrame: 155,
    tag: 'Beat 2 · 策略分岔：SARSA 走高地 vs Q-learning 贴崖边',
    caption: '上方 SARSA 用下一步真实含噪动作 Q(S′,A′) 更新，学会远离悬崖；下方 Q-learning 用 max_a′ Q(S′,a′) 更新，贴崖疾行！',
    formula: 'SARSA: Q(S′,A′)   vs   Q-learning: max_{a′} Q(S′,a′)',
  },
  {
    id: 'tradeoff',
    startFrame: 155,
    endFrame: 230,
    tag: 'Beat 3 · 在线收益 vs 离线最优的经典悖论',
    caption: '只要仍开着 ε=0.1 探索，贴崖的 Q-learning 偶发手滑就会狂扣 -100；而关掉 ε 部署评估时，Q-learning 的路径最短！',
    formula: '在线训练得分: SARSA > Q-learning；贪心路径: Q-learning 最优',
  },
];

export const SARSAvsQSplitMotion: React.FC = () => {
  const frame = useCurrentFrame();
  const walkP = interpolate(frame, [45, 200], [0, 1], CLAMP);

  // SARSA 安全顶轨路径坐标 (10 格宽示意)
  const sarsaX = interpolate(walkP, [0, 0.2, 0.8, 1], [80, 80, 680, 680], CLAMP);
  const sarsaY = interpolate(walkP, [0, 0.2, 0.8, 1], [150, 42, 42, 150], CLAMP);

  // Q-learning 贴崖近轨路径坐标
  const qX = interpolate(walkP, [0, 0.12, 0.88, 1], [80, 80, 680, 680], CLAMP);
  const qY = interpolate(walkP, [0, 0.12, 0.88, 1], [150, 108, 108, 150], CLAMP);

  return (
    <Stage
      title="分屏竞速：SARSA（在策略避险）vs Q-learning（离策略激进）"
      chapterLabel="Ch 06 · 时序差分学习"
      world="telemetry"
      beats={BEATS}
    >
      <div style={{ width: '100%', height: '100%', display: 'grid', gridTemplateRows: '1fr 1fr', gap: 18, padding: '4px 16px' }}>
        {/* 上屏：SARSA */}
        <TrackPanel
          title="🟢 上轨道：SARSA（在策略 On-Policy）— 顾忌 ε 探索手滑风险，果断绕行顶层安全通道"
          formula="Q(s,a) ← Q(s,a) + α [ r + γ Q(s′, a′) - Q(s,a) ]"
          color="#10b981"
          pathPoints="80,150 80,42 680,42 680,150"
          agentX={sarsaX}
          agentY={sarsaY}
          scoreText="训练期平均得分 ≈ -24"
        />
        {/* 下屏：Q-learning */}
        <TrackPanel
          title="🔵 下轨道：Q-learning（离策略 Off-Policy）— 永远按理想 max_a′ 估值，大胆贴着悬崖走最短路"
          formula="Q(s,a) ← Q(s,a) + α [ r + γ max_{a′} Q(s′, a′) - Q(s,a) ]"
          color="#6366f1"
          pathPoints="80,150 80,108 680,108 680,150"
          agentX={qX}
          agentY={qY}
          scoreText="训练期平均得分 ≈ -48 (偶发坠崖) | 贪心评估 -13 ★"
        />
      </div>
    </Stage>
  );
};

function TrackPanel({
  title,
  formula,
  color,
  pathPoints,
  agentX,
  agentY,
  scoreText,
}: {
  title: string;
  formula: string;
  color: string;
  pathPoints: string;
  agentX: number;
  agentY: number;
  scoreText: string;
}) {
  return (
    <div
      style={{
        borderRadius: 16,
        backgroundColor: 'rgba(18, 22, 30, 0.9)',
        border: `2px solid ${color}66`,
        padding: '12px 20px',
        display: 'grid',
        gridTemplateColumns: '1.5fr 1fr',
        gap: 18,
        alignItems: 'center',
      }}
    >
      <svg viewBox="0 0 760 185" style={{ width: '100%', height: '100%' }}>
        {/* 悬崖危险带 */}
        <rect x={125} y={132} width={510} height={38} rx={8} fill="rgba(244,63,94,0.28)" stroke="#f43f5e" strokeWidth={2} />
        <text x={380} y={156} textAnchor="middle" fill="#fda4af" fontSize={14} fontWeight={800}>
          🔥🔥🔥 悬崖区域 CLIFF (掉落扣 -100 并强制回起点 S) 🔥🔥🔥
        </text>
        {/* 起点与终点 */}
        <rect x={55} y={132} width={54} height={38} rx={8} fill="#1e293b" stroke="#94a3b8" strokeWidth={2} />
        <text x={82} y={156} textAnchor="middle" fill="#fff" fontSize={14} fontWeight={800}>S</text>
        <rect x={653} y={132} width={54} height={38} rx={8} fill="rgba(250,204,21,0.25)" stroke="#facc15" strokeWidth={2} />
        <text x={680} y={156} textAnchor="middle" fill="#fde047" fontSize={14} fontWeight={800}>★ G</text>

        {/* 学到的路线 */}
        <polyline fill="none" stroke={color} strokeWidth={5} strokeDasharray="10 6" points={pathPoints} />
        {/* 移动智能体 */}
        <circle cx={agentX} cy={agentY} r={14} fill={color} stroke="#fff" strokeWidth={3} />
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', lineHeight: 1.4 }}>{title}</div>
        <div
          style={{
            padding: '8px 10px',
            borderRadius: 8,
            backgroundColor: 'rgba(0,0,0,0.42)',
            fontFamily: MOTION_THEME.fontMono,
            fontSize: 12,
            color: '#fde68a',
          }}
        >
          {formula}
        </div>
        <div style={{ fontSize: 12, fontFamily: MOTION_THEME.fontMono, color, fontWeight: 700 }}>{scoreText}</div>
      </div>
    </div>
  );
}
