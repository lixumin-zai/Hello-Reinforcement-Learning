import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { CLAMP, MOTION_THEME, Stage, type MotionBeat } from '../../kit';

const BEATS: MotionBeat[] = [
  {
    id: 'ratio',
    startFrame: 0,
    endFrame: 50,
    tag: 'Beat 1 · 双通道示波器：概率比 r_t(θ)',
    caption: '横轴是新旧策略概率比 r_t(θ) = π_θ / π_{θ_old}，中间绿色安全带即信赖域 [1-ε, 1+ε] = [0.8, 1.2]。',
    formula: 'r_t(θ) = π_θ(A_t|S_t) / π_{θ_old}(A_t|S_t)',
  },
  {
    id: 'ch1',
    startFrame: 50,
    endFrame: 135,
    tag: 'Beat 2 · CH1 (好动作 Â > 0)：撞上 1+ε 限位板，梯度归零！',
    caption: '左侧光点右移试图推高好动作概率；一旦越过 1.2 限位墙，L^CLIP 被水平剪平，梯度表瞬间归零防止步子迈太大！',
    formula: 'Â > 0:  L^CLIP = min(r·Â, (1+ε)·Â)',
  },
  {
    id: 'ch2',
    startFrame: 135,
    endFrame: 220,
    tag: 'Beat 3 · CH2 (坏动作 Â < 0)：撞上 1-ε 限位板，梯度归零！',
    caption: '右侧光点左移压低坏动作概率；一旦跌破 0.8 限位墙，同样被剪平封顶，防止把策略熵瞬间压塌！',
    formula: 'Â < 0:  L^CLIP = min(r·Â, (1-ε)·Â)',
  },
];

export const PPOClipOscilloscopeMotion: React.FC = () => {
  const frame = useCurrentFrame();
  const rPos = interpolate(frame, [52, 130], [0.65, 1.56], CLAMP);
  const rNeg = interpolate(frame, [136, 210], [1.38, 0.44], CLAMP);

  return (
    <Stage
      title="PPO-Clip 双通道示波器：机械限位截断与零梯度死区"
      chapterLabel="Ch 08 · 策略梯度与 PPO"
      world="telemetry"
      beats={BEATS}
    >
      <div style={{ width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, padding: '6px 14px' }}>
        <ScopeChannel title="CH1 · 好动作 (Â_t = +1.0 > 0)" positive={true} r={rPos} active={frame >= 48 && frame < 135} />
        <ScopeChannel title="CH2 · 坏动作 (Â_t = -1.0 < 0)" positive={false} r={rNeg} active={frame >= 135} />
      </div>
    </Stage>
  );
};

function ScopeChannel({ title, positive, r, active }: { title: string; positive: boolean; r: number; active: boolean }) {
  const eps = 0.2;
  const rToX = (v: number) => 55 + ((v - 0.35) / 1.3) * 440;
  const lToY = (v: number) => 175 - (v / 1.6) * 120;
  const clippedVal = positive ? Math.min(r, 1 + eps) : Math.min(-r, -(1 - eps));
  const dead = (positive && r > 1 + eps) || (!positive && r < 1 - eps);

  return (
    <div
      style={{
        borderRadius: 16,
        backgroundColor: 'rgba(13, 16, 21, 0.94)',
        border: `2px solid ${active ? (dead ? '#facc15' : '#38bdf8') : 'rgba(148,163,184,0.22)'}`,
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc' }}>{title}</span>
        <span
          style={{
            padding: '3px 10px',
            borderRadius: 6,
            fontFamily: MOTION_THEME.fontMono,
            fontSize: 12,
            fontWeight: 800,
            backgroundColor: dead ? 'rgba(250,204,21,0.2)' : 'rgba(56,189,248,0.16)',
            color: dead ? '#fde047' : '#7dd3fc',
          }}
        >
          {dead ? '🔒 CLIP 死区 · 梯度 = 0' : `⚡ 梯度 = ${positive ? '+1.0' : '-1.0'}`}
        </span>
      </div>

      <svg viewBox="0 0 540 315" style={{ width: '100%', height: 290 }}>
        {/* 信赖带 */}
        <rect x={rToX(0.8)} y={24} width={rToX(1.2) - rToX(0.8)} height={252} fill="rgba(45,212,191,0.12)" stroke="rgba(45,212,191,0.4)" strokeDasharray="5 4" />
        {/* 机械限位壁 */}
        <line x1={rToX(positive ? 1.2 : 0.8)} y1={24} x2={rToX(positive ? 1.2 : 0.8)} y2={276} stroke="#facc15" strokeWidth={3} />

        <line x1={40} y1={175} x2={510} y2={175} stroke="#475569" strokeWidth={1.5} />
        <line x1={rToX(0.35)} y1={lToY(positive ? 0.35 : -0.35)} x2={rToX(1.65)} y2={lToY(positive ? 1.65 : -1.65)} stroke="#64748b" strokeWidth={2} strokeDasharray="6 4" />

        {positive ? (
          <polyline fill="none" stroke="#2dd4bf" strokeWidth={4.5} points={`${rToX(0.35)},${lToY(0.35)} ${rToX(1.2)},${lToY(1.2)} ${rToX(1.65)},${lToY(1.2)}`} />
        ) : (
          <polyline fill="none" stroke="#fb7185" strokeWidth={4.5} points={`${rToX(0.35)},${lToY(-0.8)} ${rToX(0.8)},${lToY(-0.8)} ${rToX(1.65)},${lToY(-1.65)}`} />
        )}

        <circle cx={rToX(r)} cy={lToY(clippedVal)} r={10} fill="#facc15" stroke="#090d16" strokeWidth={2.5} />

        <text x={rToX(0.8)} y={298} textAnchor="middle" fill="#cbd5e1" fontSize={12} fontFamily={MOTION_THEME.fontMono}>0.8</text>
        <text x={rToX(1.0)} y={298} textAnchor="middle" fill="#cbd5e1" fontSize={12} fontFamily={MOTION_THEME.fontMono}>r=1</text>
        <text x={rToX(1.2)} y={298} textAnchor="middle" fill="#cbd5e1" fontSize={12} fontFamily={MOTION_THEME.fontMono}>1.2</text>
      </svg>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: MOTION_THEME.fontMono, fontSize: 13, color: '#e2e8f0' }}>
        <span>r_t = {r.toFixed(2)}</span>
        <span style={{ color: '#fde047', fontWeight: 800 }}>L^CLIP = {clippedVal.toFixed(2)}</span>
      </div>
    </div>
  );
}
