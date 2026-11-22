import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { CLAMP, MOTION_THEME, Stage, type MotionBeat } from '../../kit';

const BEATS: MotionBeat[] = [
  {
    id: 'memoryless',
    startFrame: 0,
    endFrame: 65,
    tag: 'Beat 1 · 马尔可夫无记忆性',
    caption: '只要知道当前状态 S_t，未来的转移概率就彻底独立于过去走过的全部历史轨迹。',
    formula: 'P(S_{t+1} | S_t, A_t, …, S_0) = P(S_{t+1} | S_t, A_t)',
  },
  {
    id: 'stochastic-walk',
    startFrame: 65,
    endFrame: 155,
    tag: 'Beat 2 · 随机转移与奖励发射',
    caption: '发光粒子在黑板拓扑图上按 p(s′,r|s,a) 游走，每次跃迁都在边上弹出对应的即时奖励。',
    formula: 'Σ_{s′, r} p(s′, r | s, a) = 1',
  },
  {
    id: 'visitation',
    startFrame: 155,
    endFrame: 220,
    tag: 'Beat 3 · 状态访问分布 d^π(s) 平滑收敛',
    caption: '长时间运行策略 π 后，各状态的访问占比趋于平稳分布 d^π(s)，成为后续策略梯度的积分测度。',
    formula: 'd^π(s′) = Σ_s d^π(s) P^π(s′ | s)',
  },
];

const NODES = [
  { id: 'C1', label: 'C1 听课', x: 180, y: 120, color: '#38bdf8', freq: 0.30 },
  { id: 'C2', label: 'C2 冲刺', x: 480, y: 120, color: '#38bdf8', freq: 0.32 },
  { id: 'Relax', label: '摸鱼', x: 180, y: 310, color: '#fb7185', freq: 0.14 },
  { id: 'Pass', label: '通关 +10', x: 740, y: 215, color: '#facc15', freq: 0.24 },
];
const PATH = [0, 2, 0, 1, 3, 0, 1, 3];

export const MarkovChalkboardMotion: React.FC = () => {
  const frame = useCurrentFrame();
  const walkF = interpolate(frame, [25, 200], [0, PATH.length - 1.01], CLAMP);
  const seg = Math.floor(walkF);
  const frac = walkF - seg;
  const from = NODES[PATH[seg]];
  const to = NODES[PATH[seg + 1]];
  const px = from.x + (to.x - from.x) * frac;
  const py = from.y + (to.y - from.y) * frac;
  const freqMix = interpolate(frame, [80, 205], [0.15, 1], CLAMP);

  return (
    <Stage
      title="马尔可夫决策过程 (MDP)：黑板上的概率拓扑游走"
      chapterLabel="Ch 03 · MDP 与 Bellman 方程"
      world="chalkboard"
      beats={BEATS}
    >
      <div style={{ width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 22 }}>
        <div style={{ position: 'relative' }}>
          <svg viewBox="0 0 860 440" style={{ width: '100%', height: '100%' }}>
            {/* 粉笔风格手绘感弧线 */}
            <path d="M 235 110 Q 330 65 425 110" fill="none" stroke="#38bdf8" strokeWidth={3} strokeDasharray="6 4" />
            <text x={330} y={76} textAnchor="middle" fill="#7dd3fc" fontSize={14} fontStyle="italic">p = 0.8, r = -2</text>

            <path d="M 165 170 Q 125 215 165 260" fill="none" stroke="#fb7185" strokeWidth={2.8} strokeDasharray="6 4" />
            <text x={96} y={220} textAnchor="middle" fill="#fda4af" fontSize={14} fontStyle="italic">摸鱼 -1</text>

            <path d="M 535 130 Q 645 135 695 182" fill="none" stroke="#facc15" strokeWidth={3.5} />
            <text x={635} y={132} textAnchor="middle" fill="#fde047" fontSize={14} fontWeight={700} fontStyle="italic">
              p = 0.85, r = +10 ★
            </text>

            {NODES.map((n, i) => {
              const lit = PATH[seg] === i;
              return (
                <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
                  <circle
                    r={52}
                    fill="rgba(12, 21, 32, 0.85)"
                    stroke={lit ? '#facc15' : n.color}
                    strokeWidth={lit ? 4.5 : 2.5}
                  />
                  <text x={0} y={6} textAnchor="middle" fill="#f8fafc" fontSize={17} fontWeight={700}>
                    {n.label}
                  </text>
                </g>
              );
            })}

            {/* 发光游走粒子 */}
            <circle cx={px} cy={py} r={12} fill="#facc15" stroke="#fff" strokeWidth={2.5} />
          </svg>
        </div>

        {/* 右侧：手写黑板公式 + 分布收敛 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 20,
            padding: '16px 24px',
            borderLeft: '1px dashed rgba(148,163,184,0.28)',
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, color: '#facc15', fontStyle: 'italic' }}>
            MDP = ( S, A, P, R, γ )
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {NODES.map((n) => (
              <div key={n.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: '#e2e8f0' }}>{n.label}</span>
                  <span style={{ fontFamily: MOTION_THEME.fontMono, color: n.color }}>
                    d^π = {(n.freq * freqMix * 100).toFixed(0)}%
                  </span>
                </div>
                <div style={{ height: 9, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                  <div style={{ width: `${(n.freq * freqMix * 100).toFixed(1)}%`, height: '100%', backgroundColor: n.color }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7 }}>
            提示：在打 Atari 游戏时，单帧截图不满足马尔可夫性（看不出球往哪飞）；将最近 4 帧堆叠为 S_t 后即可近似恢复马尔可夫性质。
          </div>
        </div>
      </div>
    </Stage>
  );
};
