import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { CLAMP, MOTION_THEME, Stage, type MotionBeat } from '../../kit';

const BEATS: MotionBeat[] = [
  {
    id: 'expand',
    startFrame: 0,
    endFrame: 65,
    tag: 'Beat 1 · 展开无穷未来奖励级数',
    caption: '折扣回报 G_t 把未来每一步的奖励乘以几何衰减权重 γ^k 后全部加总。',
    formula: 'G_t = R_{t+1} + γ R_{t+2} + γ² R_{t+3} + γ³ R_{t+4} + …',
  },
  {
    id: 'factor',
    startFrame: 65,
    endFrame: 145,
    tag: 'Beat 2 · 从第二项起提取公因式 γ',
    caption: '将 R_{t+2} 及以后的所有项放进金色括号，统一提出一个公因式 γ —— 括号内竟与 G_{t+1} 严丝合缝！',
    formula: 'G_t = R_{t+1} + γ ( R_{t+2} + γ R_{t+3} + γ² R_{t+4} + … )',
  },
  {
    id: 'fold',
    startFrame: 145,
    endFrame: 220,
    tag: 'Beat 3 · 几何折叠为 Bellman 递归源头',
    caption: '整串无穷级数瞬间折叠为紧凑的 G_t = R_{t+1} + γ G_{t+1} —— 这正是所有 Bellman 方程的诞生地！',
    formula: 'G_t = R_{t+1} + γ · G_{t+1}',
  },
];

const TERMS = [
  { k: 0, sym: 'R_{t+1}', val: 10, w: 1.0 },
  { k: 1, sym: 'γ R_{t+2}', val: 8.0, w: 0.8 },
  { k: 2, sym: 'γ² R_{t+3}', val: 6.4, w: 0.64 },
  { k: 3, sym: 'γ³ R_{t+4}', val: 5.12, w: 0.512 },
  { k: 4, sym: 'γ⁴ R_{t+5}', val: 4.10, w: 0.410 },
];

export const DiscountSeriesFoldMotion: React.FC = () => {
  const frame = useCurrentFrame();
  const bracketMix = interpolate(frame, [68, 118], [0, 1], CLAMP);
  const foldMix = interpolate(frame, [148, 198], [0, 1], CLAMP);

  return (
    <Stage
      title="几何级数折叠：从无穷回报推导出 G_t = R_{t+1} + γ G_{t+1}"
      chapterLabel="Ch 03 · MDP 与 Bellman 方程"
      world="chalkboard"
      beats={BEATS}
    >
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', padding: '16px 36px' }}>
        {/* 上部：可视化几何衰减方块列 */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 22, height: 220 }}>
          {TERMS.map((item, i) => {
            const isTail = i > 0;
            const tailCollapse = isTail ? 1 - foldMix * 0.72 : 1;
            const h = item.w * 175;
            return (
              <div
                key={item.k}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  opacity: isTail ? 1 - foldMix * 0.65 : 1,
                  transform: isTail ? `scaleX(${tailCollapse.toFixed(3)}) translateX(${-foldMix * i * 32}px)` : 'none',
                }}
              >
                <span style={{ fontFamily: MOTION_THEME.fontMono, fontSize: 13, color: isTail ? '#facc15' : '#38bdf8', marginBottom: 6 }}>
                  {item.val.toFixed(1)}
                </span>
                <div
                  style={{
                    width: 112,
                    height: h,
                    borderRadius: 12,
                    background: isTail
                      ? 'linear-gradient(180deg, rgba(250,204,21,0.72), rgba(217,119,6,0.35))'
                      : 'linear-gradient(180deg, rgba(56,189,248,0.85), rgba(2,132,199,0.45))',
                    border: `2px solid ${isTail ? '#facc15' : '#38bdf8'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: MOTION_THEME.fontMono,
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#fff',
                  }}
                >
                  {item.sym}
                </div>
              </div>
            );
          })}
        </div>

        {/* 下部：3Blue1Brown 风格黑板方程形态演变 */}
        <div
          style={{
            alignSelf: 'center',
            padding: '22px 38px',
            borderRadius: 18,
            border: '1px dashed rgba(148,163,184,0.35)',
            backgroundColor: 'rgba(12, 21, 32, 0.78)',
            textAlign: 'center',
            fontFamily: MOTION_THEME.fontMono,
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 800, color: '#f8fafc', letterSpacing: 0.6 }}>
            <span style={{ color: '#e2e8f0' }}>G_t = </span>
            <span style={{ color: '#38bdf8' }}>R_&#123;t+1&#125;</span>
            <span style={{ color: '#e2e8f0' }}> + </span>
            {foldMix > 0.55 ? (
              <span style={{ color: '#facc15', padding: '4px 14px', borderRadius: 10, backgroundColor: 'rgba(250,204,21,0.16)', border: '2px solid #facc15' }}>
                γ · G_&#123;t+1&#125;
              </span>
            ) : (
              <span
                style={{
                  color: '#facc15',
                  padding: bracketMix > 0.2 ? '4px 12px' : 0,
                  borderRadius: 10,
                  border: bracketMix > 0.2 ? '2px dashed rgba(250,204,21,0.75)' : 'none',
                }}
              >
                {bracketMix > 0.2 ? 'γ · ( R_{t+2} + γ R_{t+3} + γ² R_{t+4} + … )' : 'γ R_{t+2} + γ² R_{t+3} + γ³ R_{t+4} + …'}
              </span>
            )}
          </div>
          <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 12 }}>
            当 γ = 0.8 时，有效规划视野 ≈ 1/(1 - 0.8) = 5.0 步；对任意有界奖励 |R| ≤ R_max，级数绝对收敛于 R_max / (1 - γ)
          </div>
        </div>
      </div>
    </Stage>
  );
};
