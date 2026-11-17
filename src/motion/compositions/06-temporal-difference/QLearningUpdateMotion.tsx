import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { CLAMP, MOTION_THEME, Stage, type MotionBeat } from '../../kit';

const BEATS: MotionBeat[] = [
  {
    id: 'step',
    startFrame: 0,
    endFrame: 55,
    tag: 'Beat 1 · 采样交互 (s, a, r, s′)',
    caption: '智能体在状态 s 选择向右动作 a=→，到达新状态 s′ 并收到步长奖励 r = -0.04。',
    formula: 's --(a=→, r=-0.04)--> s′',
  },
  {
    id: 'max-next',
    startFrame: 55,
    endFrame: 125,
    tag: 'Beat 2 · 扫描下一状态的最大动作价值 max_a′ Q(s′, a′)',
    caption: '不管下一刻实际走哪步，Q-learning 直接取下一状态 s′ 四个方向中的最大 Q 值：max Q(s′, ·) = 0.80（向上）。',
    formula: 'max_{a′} Q(s′, a′) = Q(s′, ↑) = 0.80',
  },
  {
    id: 'update-cell',
    startFrame: 125,
    endFrame: 210,
    tag: 'Beat 3 · 回写更新 Q(s, →)',
    caption: '计算目标 -0.04 + 0.9×0.80 = 0.68，以 α=0.5 更新状态 s 右侧象限的 Q 值：0.20 → 0.44。',
    formula: 'Q(s,→) ← 0.20 + 0.5 × (0.68 - 0.20) = 0.44',
  },
];

export const QLearningUpdateMotion: React.FC = () => {
  const frame = useCurrentFrame();

  const scanMax = interpolate(frame, [60, 110], [0, 1], CLAMP);
  const updateMix = interpolate(frame, [130, 185], [0, 1], CLAMP);

  const qRight = 0.2 + (0.44 - 0.2) * updateMix;

  return (
    <Stage
      title="Q-learning 单步离策略更新拆解"
      chapterLabel="06 · 时序差分学习"
      accent={MOTION_THEME.agent}
      beats={BEATS}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 24, height: '100%' }}>
        {/* 左侧两个相邻网格的 Q 四向分解 */}
        <div
          style={{
            borderRadius: 18,
            backgroundColor: MOTION_THEME.bgCard,
            border: `1px solid ${MOTION_THEME.border}`,
            padding: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
          }}
        >
          {/* 状态 s 的四象限 Q 表 */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#a5b4fc' }}>当前状态 s</div>
            <div
              style={{
                width: 210,
                height: 210,
                borderRadius: 18,
                backgroundColor: '#0f172a',
                border: '2px solid #6366f1',
                position: 'relative',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gridTemplateRows: '1fr 1fr',
                gap: 6,
                padding: 12,
              }}
            >
              <QBox dir="↑" val="0.10" highlight={false} />
              <QBox dir="→" val={qRight.toFixed(2)} highlight={true} color="#f59e0b" />
              <QBox dir="←" val="0.05" highlight={false} />
              <QBox dir="↓" val="0.12" highlight={false} />
            </div>
          </div>

          <div style={{ fontFamily: MOTION_THEME.fontMono, fontSize: 15, color: '#fde68a', textAlign: 'center' }}>
            <div>a = →</div>
            <div style={{ fontSize: 28 }}>⟹</div>
            <div>r = -0.04</div>
          </div>

          {/* 下一状态 s' 的四象限 Q 表 */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#5eead4' }}>下一状态 s′</div>
            <div
              style={{
                width: 210,
                height: 210,
                borderRadius: 18,
                backgroundColor: '#0f172a',
                border: '2px solid #14b8a6',
                position: 'relative',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gridTemplateRows: '1fr 1fr',
                gap: 6,
                padding: 12,
              }}
            >
              <QBox dir="↑ (max)" val="0.80" highlight={scanMax > 0.2} color="#10b981" />
              <QBox dir="→" val="0.45" highlight={false} />
              <QBox dir="←" val="0.22" highlight={false} />
              <QBox dir="↓" val="0.30" highlight={false} />
            </div>
          </div>
        </div>

        {/* 右侧：公式代入过程 */}
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
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>为什么叫“离策略 (Off-Policy)”？</div>
            <div
              style={{
                padding: 16,
                borderRadius: 14,
                backgroundColor: 'rgba(15,23,42,0.75)',
                border: `1px solid ${MOTION_THEME.border}`,
                fontFamily: MOTION_THEME.fontMono,
                fontSize: 13,
                lineHeight: 1.85,
              }}
            >
              <div>旧值: Q(s, →) = 0.20</div>
              <div>即时奖励: r = -0.04</div>
              <div style={{ color: '#34d399' }}>下一状态最优: max_a′ Q(s′, a′) = 0.80</div>
              <div style={{ color: '#fde68a' }}>TD 目标 = -0.04 + 0.9 × 0.80 = 0.68</div>
              <div>TD 误差 δ = 0.68 - 0.20 = +0.48</div>
              <div style={{ color: '#a5b4fc', fontWeight: 700 }}>
                新值: Q(s, →) = {qRight.toFixed(2)}
              </div>
            </div>
          </div>

          <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.65 }}>
            <strong>SARSA</strong> 会用下一刻实际采样的动作 Q(s′, a′) 更新（怕摔下悬崖）；而{' '}
            <strong>Q-learning</strong> 永远假定从 s′ 开始会走最优动作 max_a′ Q(s′, a′)，因此能一边大胆探索、一边学习最优策略。
          </div>
        </div>
      </div>
    </Stage>
  );
};

function QBox({
  dir,
  val,
  highlight,
  color = '#6366f1',
}: {
  dir: string;
  val: string;
  highlight: boolean;
  color?: string;
}) {
  return (
    <div
      style={{
        borderRadius: 12,
        backgroundColor: highlight ? `${color}30` : 'rgba(30,41,59,0.75)',
        border: `2px solid ${highlight ? color : 'rgba(148,163,184,0.2)'}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{dir}</span>
      <span style={{ fontSize: 18, fontWeight: 800, fontFamily: MOTION_THEME.fontMono, color: '#f8fafc' }}>{val}</span>
    </div>
  );
}
