import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { CLAMP, MOTION_THEME, Stage, type MotionBeat } from '../../kit';

const BEATS: MotionBeat[] = [
  {
    id: 'before',
    startFrame: 0,
    endFrame: 55,
    tag: 'Beat 1 · 迈步前的旧估计 V(S_t) = 3.0',
    caption: '在状态 S_t，智能体对当前价值的估计标尺停在 V(S_t) = 3.00。',
    formula: '旧估计 V(S_t) = 3.00',
  },
  {
    id: 'stretch',
    startFrame: 55,
    endFrame: 125,
    tag: 'Beat 2 · 迈出一步，TD 目标拉开机械弹簧 δ_t！',
    caption: '收到奖励 R=2.0 并抵达 V(S′)=6.0，自举目标 R + γV(S′) = 7.40 将红弹簧瞬间拉长 δ_t = +4.40！',
    formula: 'δ_t = [R_{t+1} + γ V(S_{t+1})] - V(S_t) = +4.40',
  },
  {
    id: 'snap',
    startFrame: 125,
    endFrame: 220,
    tag: 'Beat 3 · 弹簧回缩，按步长 α = 0.5 牵引 V(S_t) 滑向 5.20',
    caption: '物理弹簧释放张力，将旧估计游标顺着误差方向拉进 α·δ_t = +2.20，完成单步在线自举更新！',
    formula: 'V(S_t) ← 3.00 + 0.5 × 4.40 = 5.20',
  },
];

export const TDSpringPhysicsMotion: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const targetAppear = interpolate(frame, [58, 92], [0, 1], CLAMP);
  const pullSpring = spring({
    frame: Math.max(0, frame - 128),
    fps,
    config: { damping: 11, stiffness: 120, mass: 0.9 },
  });
  const pullMix = frame < 128 ? 0 : interpolate(pullSpring, [0, 1], [0, 1], CLAMP);

  const vNow = 3.0 + 2.2 * pullMix;
  const targetVal = 7.4;

  // 水平标尺映射：数值 [0, 10] -> x [120, 1080]
  const valToX = (v: number) => 120 + (v / 10) * 960;
  const xOld = valToX(vNow);
  const xTarget = valToX(targetVal);

  // 生成逼真的锯齿形机械弹簧 SVG Path
  const coils = 14;
  const springPts: string[] = [`M ${xOld.toFixed(1)} 210`];
  for (let i = 1; i < coils; i++) {
    const px = xOld + ((xTarget - xOld) * i) / coils;
    const py = 210 + (i % 2 === 0 ? -24 : 24);
    springPts.push(`L ${px.toFixed(1)} ${py}`);
  }
  springPts.push(`L ${xTarget.toFixed(1)} 210`);

  return (
    <Stage
      title="TD(0) 自举与时序差分误差 δ_t：机械弹簧牵引模型"
      chapterLabel="Ch 06 · 时序差分学习"
      world="telemetry"
      beats={BEATS}
    >
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '14px 20px' }}>
        {/* 主水平机械标尺 + 弹簧力学 SVG */}
        <svg viewBox="0 0 1200 320" style={{ width: '100%', height: 320 }}>
          {/* 精密刻度轨道 */}
          <rect x={100} y={196} width={1000} height={28} rx={14} fill="rgba(30,41,59,0.85)" stroke="rgba(148,163,184,0.3)" strokeWidth={2} />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((tick) => (
            <g key={tick}>
              <line x1={valToX(tick)} y1={226} x2={valToX(tick)} y2={244} stroke="#64748b" strokeWidth={2} />
              <text x={valToX(tick)} y={266} textAnchor="middle" fill="#94a3b8" fontSize={14} fontFamily={MOTION_THEME.fontMono}>
                {tick}.0
              </text>
            </g>
          ))}

          {/* 拉伸中的物理机械红弹簧 */}
          {targetAppear > 0.1 && (
            <g opacity={targetAppear}>
              <path d={springPts.join(' ')} fill="none" stroke="#fb7185" strokeWidth={4.5} strokeLinejoin="round" />
              <text
                x={(xOld + xTarget) / 2}
                y={166}
                textAnchor="middle"
                fill="#fda4af"
                fontSize={18}
                fontWeight={800}
                fontFamily={MOTION_THEME.fontMono}
              >
                弹簧张力 δ_t = +{(targetVal - vNow).toFixed(2)}
              </text>
            </g>
          )}

          {/* 游标 1：V(S_t) 滑块 */}
          <g transform={`translate(${xOld}, 210)`}>
            <rect x={-46} y={-52} width={92} height={42} rx={10} fill="#4f46e5" stroke="#c7d2fe" strokeWidth={2.5} />
            <text x={0} y={-26} textAnchor="middle" fill="#fff" fontSize={16} fontWeight={800} fontFamily={MOTION_THEME.fontMono}>
              V={vNow.toFixed(2)}
            </text>
            <circle r={13} fill="#818cf8" stroke="#fff" strokeWidth={3} />
            <text x={0} y={84} textAnchor="middle" fill="#a5b4fc" fontSize={15} fontWeight={700}>
              估计游标 V(S_t)
            </text>
          </g>

          {/* 游标 2：TD 目标锚点 */}
          <g transform={`translate(${xTarget}, 210)`} opacity={targetAppear}>
            <rect x={-64} y={-52} width={128} height={42} rx={10} fill="#d97706" stroke="#fef08a" strokeWidth={2.5} />
            <text x={0} y={-26} textAnchor="middle" fill="#fff" fontSize={15} fontWeight={800} fontFamily={MOTION_THEME.fontMono}>
              Target=7.40
            </text>
            <circle r={13} fill="#fbbf24" stroke="#fff" strokeWidth={3} />
            <text x={0} y={84} textAnchor="middle" fill="#fde68a" fontSize={14} fontWeight={700}>
              R(2.0) + γV(S′)(5.4)
            </text>
          </g>
        </svg>

        {/* 底部三栏遥测对比卡 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, fontFamily: MOTION_THEME.fontMono, fontSize: 13 }}>
          <div style={{ padding: '12px 16px', borderRadius: 12, backgroundColor: 'rgba(18,22,30,0.9)', border: '1px solid rgba(148,163,184,0.22)' }}>
            <div style={{ color: '#fbbf24', fontWeight: 800 }}>MC：采样 · 不自举</div>
            <div style={{ color: '#94a3b8', marginTop: 4 }}>等整局结束用完整回报 G_t 拉动（零偏差、高方差）</div>
          </div>
          <div style={{ padding: '12px 16px', borderRadius: 12, backgroundColor: 'rgba(244,63,94,0.14)', border: '2px solid #fb7185' }}>
            <div style={{ color: '#fda4af', fontWeight: 800 }}>TD(0)：采样 · 单步自举 ★</div>
            <div style={{ color: '#ffe4e6', marginTop: 4 }}>迈出 1 步立刻用 R + γV(S′) 拉动（低方差、在线每步学）</div>
          </div>
          <div style={{ padding: '12px 16px', borderRadius: 12, backgroundColor: 'rgba(18,22,30,0.9)', border: '1px solid rgba(148,163,184,0.22)' }}>
            <div style={{ color: '#38bdf8', fontWeight: 800 }}>DP：全期望 · 单步自举</div>
            <div style={{ color: '#94a3b8', marginTop: 4 }}>依赖已知转移矩阵 p 遍历所有后继状态求和</div>
          </div>
        </div>
      </div>
    </Stage>
  );
};
