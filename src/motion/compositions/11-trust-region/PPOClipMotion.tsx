import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { CLAMP, MOTION_THEME, Stage, type MotionBeat } from '../../kit';

const BEATS: MotionBeat[] = [
  {
    id: 'ratio',
    startFrame: 0,
    endFrame: 55,
    tag: 'Beat 1 · 重要性概率比 r_t(θ)',
    caption: '定义新旧策略在同一动作上的概率比 r_t(θ) = π_θ(a_t|s_t) / π_{θ_old}(a_t|s_t)，旧策略处 r = 1。',
    formula: 'r_t(θ) = π_θ(a_t | s_t) / π_{θ_old}(a_t | s_t)',
  },
  {
    id: 'pos-adv',
    startFrame: 55,
    endFrame: 135,
    tag: 'Beat 2 · 好动作 (A_t > 0)：超过 1+ε 后被剪平',
    caption: '当优势 A_t > 0 时我们想增大 r_t，但一旦 r_t > 1+ε (1.2)，目标被剪平，梯度归零，防止一步更新过猛。',
    formula: 'A_t > 0:  L^CLIP = min(r·A, (1+ε)·A)',
  },
  {
    id: 'neg-adv',
    startFrame: 135,
    endFrame: 210,
    tag: 'Beat 3 · 坏动作 (A_t < 0)：低于 1-ε 后被剪平',
    caption: '当优势 A_t < 0 时我们想减小 r_t，但一旦 r_t < 1-ε (0.8)，目标同样被剪平，避免把动作概率压崩。',
    formula: 'A_t < 0:  L^CLIP = min(r·A, (1-ε)·A)',
  },
];

export const PPOClipMotion: React.FC = () => {
  const frame = useCurrentFrame();

  const cursorPos = interpolate(frame, [55, 130], [0.6, 1.55], CLAMP);
  const cursorNeg = interpolate(frame, [135, 205], [1.4, 0.45], CLAMP);

  return (
    <Stage
      title="PPO-Clip 截断替代目标：把策略更新锁在信赖域 [1-ε, 1+ε]"
      chapterLabel="11 · 信赖域与 PPO"
      accent={MOTION_THEME.env}
      beats={BEATS}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, height: '100%' }}>
        {/* 左图：A > 0 */}
        <ClipPlot
          title="情形一：好动作 (优势 Â_t = +1 > 0)"
          subtitle="鼓励提高概率 (r ↑)，但在 r = 1 + ε = 1.2 处封顶"
          positive={true}
          cursorR={cursorPos}
          active={frame >= 50 && frame < 135}
        />
        {/* 右图：A < 0 */}
        <ClipPlot
          title="情形二：坏动作 (优势 Â_t = -1 < 0)"
          subtitle="鼓励降低概率 (r ↓)，但在 r = 1 - ε = 0.8 处封顶"
          positive={false}
          cursorR={cursorNeg}
          active={frame >= 135}
        />
      </div>
    </Stage>
  );
};

function ClipPlot({
  title,
  subtitle,
  positive,
  cursorR,
  active,
}: {
  title: string;
  subtitle: string;
  positive: boolean;
  cursorR: number;
  active: boolean;
}) {
  // r 范围 [0.4, 1.6] -> x [70, 490]
  const rToX = (r: number) => 70 + ((r - 0.4) / 1.2) * 420;
  // L 范围 [-1.6, 1.6] -> y [300, 60]
  const lToY = (l: number) => 180 - (l / 1.6) * 115;

  const eps = 0.2;
  const unclippedL = positive ? cursorR : -cursorR;
  const clippedR = Math.max(1 - eps, Math.min(1 + eps, cursorR));
  const clippedL = positive ? Math.min(cursorR, 1 + eps) : Math.min(-cursorR, -(1 - eps));

  return (
    <div
      style={{
        borderRadius: 18,
        backgroundColor: MOTION_THEME.bgCard,
        border: `2px solid ${active ? MOTION_THEME.env : MOTION_THEME.border}`,
        padding: '18px 22px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: 12, color: MOTION_THEME.textMuted, marginTop: 2 }}>{subtitle}</div>
      </div>

      <svg viewBox="0 0 540 310" style={{ width: '100%', height: 270 }}>
        {/* [1-ε, 1+ε] 绿色信赖域带 */}
        <rect
          x={rToX(0.8)}
          y={30}
          width={rToX(1.2) - rToX(0.8)}
          height={240}
          fill="rgba(20, 184, 166, 0.12)"
          stroke="rgba(20, 184, 166, 0.35)"
          strokeDasharray="4 4"
        />
        <text x={rToX(1.0)} y={48} textAnchor="middle" fill="#5eead4" fontSize={11} fontWeight={700}>
          [1-ε, 1+ε] 信赖域
        </text>

        {/* 坐标轴 */}
        <line x1={60} y1={180} x2={500} y2={180} stroke="#475569" strokeWidth={1.5} />
        <line x1={rToX(1.0)} y1={30} x2={rToX(1.0)} y2={270} stroke="#475569" strokeWidth={1.5} strokeDasharray="3 3" />

        {/* 未截断虚线 r*A */}
        <line
          x1={rToX(0.4)}
          y1={lToY(positive ? 0.4 : -0.4)}
          x2={rToX(1.6)}
          y2={lToY(positive ? 1.6 : -1.6)}
          stroke="#94a3b8"
          strokeWidth={2}
          strokeDasharray="6 4"
        />

        {/* L^CLIP 实线 */}
        {positive ? (
          <polyline
            fill="none"
            stroke="#2dd4bf"
            strokeWidth={4}
            points={`${rToX(0.4)},${lToY(0.4)} ${rToX(1.2)},${lToY(1.2)} ${rToX(1.6)},${lToY(1.2)}`}
          />
        ) : (
          <polyline
            fill="none"
            stroke="#f43f5e"
            strokeWidth={4}
            points={`${rToX(0.4)},${lToY(-0.8)} ${rToX(0.8)},${lToY(-0.8)} ${rToX(1.6)},${lToY(-1.6)}`}
          />
        )}

        {/* 游标点 */}
        <circle cx={rToX(cursorR)} cy={lToY(clippedL)} r={8} fill="#fde047" stroke="#0f172a" strokeWidth={2} />

        {/* 刻度文字 */}
        <text x={rToX(0.8)} y={288} textAnchor="middle" fill="#cbd5e1" fontSize={12}>
          1-ε (0.8)
        </text>
        <text x={rToX(1.0)} y={288} textAnchor="middle" fill="#cbd5e1" fontSize={12}>
          r=1
        </text>
        <text x={rToX(1.2)} y={288} textAnchor="middle" fill="#cbd5e1" fontSize={12}>
          1+ε (1.2)
        </text>
      </svg>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: MOTION_THEME.fontMono,
          fontSize: 12,
          color: '#e2e8f0',
          paddingTop: 6,
          borderTop: `1px solid ${MOTION_THEME.border}`,
        }}
      >
        <span>r_t = {cursorR.toFixed(2)}</span>
        <span>未截断 = {unclippedL.toFixed(2)}</span>
        <span style={{ color: '#fde047', fontWeight: 700 }}>
          L^CLIP = {clippedL.toFixed(2)} {clippedR !== cursorR ? '(已截断 · 梯度=0)' : ''}
        </span>
      </div>
    </div>
  );
}
