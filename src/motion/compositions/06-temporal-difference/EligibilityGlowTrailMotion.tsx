import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { CLAMP, MOTION_THEME, Stage, type MotionBeat } from '../../kit';

const BEATS: MotionBeat[] = [
  {
    id: 'walk-trail',
    startFrame: 0,
    endFrame: 125,
    tag: 'Beat 1 · 留下随 (γλ)^k 衰减的荧光资格迹',
    caption: '智能体沿走廊走向奶酪，刚踩过的格子资格迹 z=1.0 最亮，更早走过的格子按 γλ 逐步暗淡。',
    formula: 'z_t(s) = γ λ z_{t-1}(s) + 𝟙(S_t = s)',
  },
  {
    id: 'cheese-hit',
    startFrame: 125,
    endFrame: 215,
    tag: 'Beat 2 · 触碰奶酪瞬间：TD 误差沿整条荧光带一次性回传！',
    caption: '无需像 TD(0) 那样每次只往前传 1 格！终局奖励 δ 瞬间照亮整条荧光尾迹，所有近期功臣同步按权重记功！',
    formula: '∀s:  V(s) ← V(s) + α · δ_t · z_t(s)',
  },
];

const CELLS = 7;

export const EligibilityGlowTrailMotion: React.FC = () => {
  const frame = useCurrentFrame();
  const posFloat = interpolate(frame, [10, 125], [0, CELLS - 1], CLAMP);
  const posIdx = Math.min(CELLS - 1, Math.floor(posFloat));
  const hitCheese = frame >= 125;
  const flashWave = interpolate(frame, [125, 195], [CELLS - 1, 0], CLAMP);
  const decay = 0.72;

  return (
    <Stage
      title="TD(λ) 资格迹：衰减荧光尾迹与瞬时全路径信用分配"
      chapterLabel="Ch 06 · 时序差分学习"
      world="telemetry"
      beats={BEATS}
    >
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 36, padding: '0 36px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${CELLS}, 1fr)`, gap: 18 }}>
          {Array.from({ length: CELLS }, (_, s) => {
            const visited = s <= posIdx;
            const age = Math.max(0, posIdx - s);
            const z = visited ? Math.pow(decay, age) : 0;
            const litGold = hitCheese && s >= flashWave && s < CELLS - 1;
            const vGain = litGold ? (5.0 * z).toFixed(2) : '0.00';

            return (
              <div
                key={s}
                style={{
                  height: 195,
                  borderRadius: 20,
                  backgroundColor: litGold
                    ? `rgba(250, 204, 21, ${(0.12 + z * 0.45).toFixed(2)})`
                    : `rgba(56, 189, 248, ${(0.06 + z * 0.42).toFixed(2)})`,
                  border: `3px solid ${
                    s === posIdx ? '#fde047' : litGold ? '#facc15' : visited ? '#38bdf8' : 'rgba(148,163,184,0.2)'
                  }`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '18px 10px',
                  boxShadow: litGold ? `0 0 ${Math.round(z * 36)}px rgba(250,204,21,0.5)` : 'none',
                }}
              >
                <div style={{ fontSize: 13, fontFamily: MOTION_THEME.fontMono, color: '#cbd5e1' }}>s_{s}</div>
                <div style={{ fontSize: 36 }}>{s === posIdx ? '🐭' : s === CELLS - 1 ? '🧀' : '·'}</div>
                <div style={{ textAlign: 'center', fontFamily: MOTION_THEME.fontMono }}>
                  <div style={{ fontSize: 12, color: '#7dd3fc', fontWeight: 700 }}>迹 z = {z.toFixed(2)}</div>
                  <div style={{ fontSize: 14, color: litGold ? '#fef08a' : '#64748b', fontWeight: 800, marginTop: 4 }}>
                    {s === CELLS - 1 ? '+10 ★' : `+${vGain}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', fontSize: 15, color: '#e2e8f0', fontFamily: MOTION_THEME.fontMono }}>
          λ = 0 退化为单步 TD(0)（仅奶酪前 1 格更新） · 0 &lt; λ &lt; 1 优雅折中 · λ = 1 等价于完整蒙特卡洛！
        </div>
      </div>
    </Stage>
  );
};
