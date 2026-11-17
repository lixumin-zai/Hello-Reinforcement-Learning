import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { CLAMP, MOTION_THEME, Stage, type MotionBeat } from '../../kit';

const BEATS: MotionBeat[] = [
  {
    id: 'two-manifolds',
    startFrame: 0,
    endFrame: 55,
    tag: 'Beat 1 · 两条目标约束线',
    caption: '上方蓝线代表“价值与当前策略一致” V = v_π；下方紫线代表“策略对当前价值贪心” π = greedy(V)。',
    formula: '评估目标: V = v_π   vs   改进目标: π = greedy(V)',
  },
  {
    id: 'zigzag',
    startFrame: 55,
    endFrame: 155,
    tag: 'Beat 2 · 评估与改进交替拉扯',
    caption: '策略评估将状态点拉向 V=v_π 线，贪心策略改进又将其拉向 π=greedy(V) 线，折线逐步收窄。',
    formula: 'π_0 → V^{π_0} → π_1 → V^{π_1} → …',
  },
  {
    id: 'fixed-point',
    startFrame: 155,
    endFrame: 210,
    tag: 'Beat 3 · 交汇于 Bellman 最优不动点 (v*, π*)',
    caption: '当两条线相交时，策略既对自身价值贪心、价值又精确等于该策略的真实价值 —— 即达全局最优 (v*, π*)！',
    formula: 'v* = v_{π*},   π* = greedy(v*)',
  },
];

// 锯齿收敛点序列：奇数在评估线上，偶数在改进线上，最终交于 (560, 215)
const POINTS = [
  { x: 110, y: 340, label: '(V₀, π₀)' },
  { x: 195, y: 120, label: '评估 V→v_π₀' },
  { x: 275, y: 300, label: '改进 π₁=greedy' },
  { x: 355, y: 155, label: '评估 V→v_π₁' },
  { x: 425, y: 265, label: '改进 π₂=greedy' },
  { x: 485, y: 185, label: '评估 V→v_π₂' },
  { x: 560, y: 215, label: '★ (v*, π*)' },
];

export const GPIZigzagMotion: React.FC = () => {
  const frame = useCurrentFrame();

  const segProgress = interpolate(frame, [40, 175], [0, POINTS.length - 1], CLAMP);
  const activeSegments = Math.floor(segProgress);
  const partial = segProgress - activeSegments;

  return (
    <Stage
      title="广义策略迭代 (Generalized Policy Iteration, GPI)"
      chapterLabel="04 · 动态规划"
      accent={MOTION_THEME.value}
      beats={BEATS}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 24, height: '100%' }}>
        <div
          style={{
            borderRadius: 18,
            backgroundColor: MOTION_THEME.bgCard,
            border: `1px solid ${MOTION_THEME.border}`,
            padding: 16,
          }}
        >
          <svg viewBox="0 0 680 440" style={{ width: '100%', height: '100%' }}>
            {/* 上方线：V = v_π */}
            <line x1={90} y1={95} x2={590} y2={222} stroke={MOTION_THEME.env} strokeWidth={4} />
            <text x={115} y={76} fill="#5eead4" fontSize={15} fontWeight={700}>
              一致性流形：V = v_π（策略评估目标）
            </text>

            {/* 下方线：π = greedy(V) */}
            <line x1={90} y1={355} x2={590} y2={208} stroke={MOTION_THEME.value} strokeWidth={4} />
            <text x={115} y={392} fill="#e9d5ff" fontSize={15} fontWeight={700}>
              贪心流形：π = greedy(V)（策略改进目标）
            </text>

            {/* 已完成的折线段 */}
            {POINTS.slice(0, -1).map((pt, i) => {
              if (i > activeSegments) return null;
              const next = POINTS[i + 1];
              const p = i === activeSegments ? partial : 1;
              const x2 = pt.x + (next.x - pt.x) * p;
              const y2 = pt.y + (next.y - pt.y) * p;
              const isEval = i % 2 === 0;
              return (
                <g key={i}>
                  <line
                    x1={pt.x}
                    y1={pt.y}
                    x2={x2}
                    y2={y2}
                    stroke={isEval ? '#38bdf8' : '#f472b6'}
                    strokeWidth={3.5}
                    strokeDasharray={isEval ? 'none' : '6 4'}
                  />
                  <circle cx={pt.x} cy={pt.y} r={7} fill="#f8fafc" />
                </g>
              );
            })}

            {/* 最优交点 */}
            <g transform="translate(560, 215)">
              <circle
                r={interpolate(frame, [155, 190], [9, 16], CLAMP)}
                fill={MOTION_THEME.reward}
                stroke="#fef08a"
                strokeWidth={3}
              />
              <text x={0} y={-24} textAnchor="middle" fill="#fde047" fontSize={16} fontWeight={800}>
                ★ (v*, π*)
              </text>
            </g>
          </svg>
        </div>

        <div
          style={{
            borderRadius: 18,
            backgroundColor: MOTION_THEME.bgCard,
            border: `1px solid ${MOTION_THEME.border}`,
            padding: '22px 24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>为什么说几乎所有 RL 算法都是 GPI？</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, lineHeight: 1.65 }}>
              <div
                style={{
                  padding: 12,
                  borderRadius: 10,
                  backgroundColor: 'rgba(15, 23, 42, 0.72)',
                  border: `1px solid ${MOTION_THEME.border}`,
                }}
              >
                <strong style={{ color: '#5eead4' }}>策略迭代 (Policy Iteration)</strong>
                <div style={{ color: '#cbd5e1' }}>每次评估都彻底走到蓝线上，再一步贪心跳到紫线上。</div>
              </div>
              <div
                style={{
                  padding: 12,
                  borderRadius: 10,
                  backgroundColor: 'rgba(15, 23, 42, 0.72)',
                  border: `1px solid ${MOTION_THEME.border}`,
                }}
              >
                <strong style={{ color: '#a5b4fc' }}>价值迭代 (Value Iteration)</strong>
                <div style={{ color: '#cbd5e1' }}>朝蓝线只迈出 1 次扫描，就立刻转向紫线做贪心改进。</div>
              </div>
              <div
                style={{
                  padding: 12,
                  borderRadius: 10,
                  backgroundColor: 'rgba(15, 23, 42, 0.72)',
                  border: `1px solid ${MOTION_THEME.border}`,
                }}
              >
                <strong style={{ color: '#f0abfc' }}>MC / SARSA / Q-learning / Actor-Critic</strong>
                <div style={{ color: '#cbd5e1' }}>
                  在每一个样本或小批量上微幅评估（Critic），随即微幅改进策略（Actor / ε-greedy）。
                </div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 12, color: MOTION_THEME.textMuted }}>
            评估与改进看似在把状态拉向不同方向，实则在几何上共同向交点 (v*, π*) 压缩。
          </div>
        </div>
      </div>
    </Stage>
  );
};
