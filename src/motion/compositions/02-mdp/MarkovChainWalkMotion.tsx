import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { CLAMP, MOTION_THEME, Stage, type MotionBeat } from '../../kit';

const BEATS: MotionBeat[] = [
  {
    id: 'markov-prop',
    startFrame: 0,
    endFrame: 60,
    tag: 'Beat 1 · 马尔可夫性质（无记忆性）',
    caption: '给定当前状态 S_t，下一状态 S_{t+1} 的条件概率分布只取决于 S_t 与 A_t，而与过去历史轨迹无关。',
    formula: 'P(S_{t+1} | S_t, A_t, …, S_0, A_0) = P(S_{t+1} | S_t, A_t)',
  },
  {
    id: 'transition',
    startFrame: 60,
    endFrame: 135,
    tag: 'Beat 2 · 状态转移图与随机分支',
    caption: '在学生 MDP 中，选择“听课”有 0.9 概率进阶通过，选“刷手机”则有 0.8 概率继续留在原地消耗时间。',
    formula: 'Σ_{s′ ∈ S} p(s′ | s, a) = 1',
  },
  {
    id: 'stationary',
    startFrame: 135,
    endFrame: 210,
    tag: 'Beat 3 · 轨迹采样与状态访问分布',
    caption: '随着粒子在状态图上游走，各状态的经验访问频率逐渐收敛至策略诱导的平稳分布 d^π(s)。',
    formula: 'd^π(s′) = Σ_s d^π(s) Σ_a π(a|s) p(s′|s,a)',
  },
];

const NODES = [
  { id: 'C1', label: '第一节课 C1', x: 140, y: 130, r: '-2', freq: 0.28 },
  { id: 'C2', label: '第二节课 C2', x: 380, y: 130, r: '-2', freq: 0.34 },
  { id: 'FB', label: '刷手机 Relax', x: 140, y: 330, r: '-1', freq: 0.16 },
  { id: 'Pass', label: '通过考试 Pass', x: 560, y: 230, r: '+10', freq: 0.22 },
];

const WALK_ORDER = [0, 2, 0, 1, 3, 0, 1, 3];

export const MarkovChainWalkMotion: React.FC = () => {
  const frame = useCurrentFrame();

  const walkStep = Math.min(
    WALK_ORDER.length - 2,
    Math.floor(interpolate(frame, [20, 195], [0, WALK_ORDER.length - 1.01], CLAMP)),
  );
  const segT = interpolate(frame, [20, 195], [0, WALK_ORDER.length - 1.01], CLAMP) - walkStep;
  const fromNode = NODES[WALK_ORDER[walkStep]];
  const toNode = NODES[WALK_ORDER[walkStep + 1]];

  const px = fromNode.x + (toNode.x - fromNode.x) * segT;
  const py = fromNode.y + (toNode.y - fromNode.y) * segT;

  const freqMix = interpolate(frame, [90, 195], [0.2, 1], CLAMP);

  return (
    <Stage
      title="马尔可夫决策过程 (MDP) 状态转移与轨迹游走"
      chapterLabel="02 · 马尔可夫决策过程"
      accent={MOTION_THEME.env}
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
            {/* 有向边 */}
            <line x1={140} y1={130} x2={380} y2={130} stroke="#5eead4" strokeWidth={3} />
            <text x={260} y={112} textAnchor="middle" fill="#5eead4" fontSize={12}>
              听课 p=0.8 (r=-2)
            </text>

            <line x1={140} y1={130} x2={140} y2={330} stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="6 4" />
            <text x={82} y={235} textAnchor="middle" fill="#fbbf24" fontSize={12}>
              摸鱼 (r=-1)
            </text>

            <line x1={380} y1={130} x2={560} y2={230} stroke="#34d399" strokeWidth={3.5} />
            <text x={495} y={162} textAnchor="middle" fill="#34d399" fontSize={12} fontWeight={700}>
              复习 p=0.9 (r=+10)
            </text>

            {/* 状态节点 */}
            {NODES.map((n, idx) => {
              const active = WALK_ORDER[walkStep] === idx;
              return (
                <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
                  <circle
                    r={46}
                    fill={n.id === 'Pass' ? '#064e3b' : '#0f172a'}
                    stroke={active ? '#fde047' : MOTION_THEME.env}
                    strokeWidth={active ? 4 : 2.5}
                  />
                  <text x={0} y={-6} textAnchor="middle" fill="#f8fafc" fontSize={13} fontWeight={700}>
                    {n.id}
                  </text>
                  <text x={0} y={14} textAnchor="middle" fill="#fde68a" fontSize={12} fontFamily={MOTION_THEME.fontMono}>
                    R = {n.r}
                  </text>
                </g>
              );
            })}

            {/* 游走粒子 */}
            <circle cx={px} cy={py} r={12} fill="#fde047" stroke="#0f172a" strokeWidth={3} />
          </svg>
        </div>

        {/* 右侧：MDP 五元组与状态访问频率 */}
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
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>状态访问频率分布 d^π(s)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {NODES.map((n) => (
                <div key={n.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span>{n.label}</span>
                    <span style={{ fontFamily: MOTION_THEME.fontMono, color: '#5eead4' }}>
                      {((n.freq * freqMix) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div style={{ height: 10, borderRadius: 999, backgroundColor: 'rgba(15,23,42,0.8)', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${(n.freq * freqMix * 100).toFixed(1)}%`,
                        height: '100%',
                        backgroundColor: MOTION_THEME.env,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              padding: 14,
              borderRadius: 12,
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              border: `1px solid ${MOTION_THEME.border}`,
              fontSize: 12,
              lineHeight: 1.7,
              color: '#cbd5e1',
            }}
          >
            <strong style={{ color: '#fde68a' }}>MDP 五元组 (S, A, P, R, γ)：</strong>
            <div>当前状态 S_t 已经浓缩了做出未来最优决策所需的全部历史信息。</div>
          </div>
        </div>
      </div>
    </Stage>
  );
};
