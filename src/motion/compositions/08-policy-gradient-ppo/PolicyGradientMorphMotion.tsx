import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { CLAMP, MOTION_THEME, Stage, type MotionBeat } from '../../kit';

const BEATS: MotionBeat[] = [
  {
    id: 'init-dist',
    startFrame: 0,
    endFrame: 60,
    tag: 'Beat 1 · 参数化随机策略 π_θ(a | s)',
    caption: '不同于 DQN 间接算 Q 值，策略梯度直接用 θ 参数化动作概率分布 π_θ，并对期望回报 J(θ) 做梯度上升！',
    formula: '∇_θ J(θ) = E_π [ ∇_θ log π_θ(A_t|S_t) · Â_t ]',
  },
  {
    id: 'push-pull',
    startFrame: 60,
    endFrame: 155,
    tag: 'Beat 2 · 好动作波峰被推高、坏动作波谷被压低',
    caption: '动作 a₂ 取得正优势 (Â > 0)，对数概率梯度将其概率推高；动作 a₄ 取得负优势 (Â < 0)，概率被迅速压低！',
    formula: 'Â > 0 ⇒ π_θ(a|s) ↑  |  Â < 0 ⇒ π_θ(a|s) ↓',
  },
  {
    id: 'hill-climb',
    startFrame: 155,
    endFrame: 225,
    tag: 'Beat 3 · 在参数山丘 J(θ) 上稳步登顶',
    caption: '减去基线 b(s) 后梯度方向大幅收束，右侧参数点 θ 沿着光滑等高线稳定攀向局部最优峰顶！',
    formula: 'θ_{k+1} = θ_k + α · ∇_θ J(θ_k)',
  },
];

export const PolicyGradientMorphMotion: React.FC = () => {
  const frame = useCurrentFrame();
  const morph = interpolate(frame, [62, 165], [0, 1], CLAMP);
  const climb = interpolate(frame, [55, 205], [0, 1], CLAMP);

  // 4 个离散动作的概率随策略梯度上升平滑重塑
  const startProbs = [0.25, 0.25, 0.25, 0.25];
  const endProbs = [0.14, 0.68, 0.13, 0.05];
  const probs = startProbs.map((p, i) => p + (endProbs[i] - p) * morph);
  const advLabels = ['-0.4', '+2.6 ★', '-0.3', '-1.9'];

  // 右侧等高线攀登点
  const tx = interpolate(climb, [0, 0.4, 0.75, 1], [110, 210, 315, 390], CLAMP);
  const ty = interpolate(climb, [0, 0.4, 0.75, 1], [310, 215, 140, 110], CLAMP);

  return (
    <Stage
      title="策略梯度直觉：动作概率波包变形 × 参数山丘梯度攀登"
      chapterLabel="Ch 08 · 策略梯度与 PPO"
      world="chalkboard"
      beats={BEATS}
    >
      <div style={{ width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 26, padding: '8px 20px', alignItems: 'center' }}>
        {/* 左侧：动作概率波包推拉变形 */}
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '18px 22px', borderRadius: 18, backgroundColor: 'rgba(12,21,32,0.84)', border: '1px solid rgba(148,163,184,0.22)' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#bae6fd' }}>策略分布 π_θ(a | s) 的概率重塑</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, alignItems: 'end', height: 280 }}>
            {probs.map((p, i) => {
              const isGood = i === 1;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                  <div style={{ fontFamily: MOTION_THEME.fontMono, fontSize: 14, fontWeight: 800, color: isGood ? '#34d399' : '#fb7185', marginBottom: 6 }}>
                    {(p * 100).toFixed(0)}%
                  </div>
                  <div
                    style={{
                      width: 78,
                      height: Math.max(14, p * 280),
                      borderRadius: 14,
                      background: isGood
                        ? 'linear-gradient(180deg, #34d399 0%, #059669 100%)'
                        : 'linear-gradient(180deg, #fb7185 0%, #be123c 100%)',
                      border: `2px solid ${isGood ? '#a7f3d0' : '#fecdd3'}`,
                    }}
                  />
                  <div style={{ marginTop: 10, fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>动作 a_{i + 1}</div>
                  <div style={{ fontSize: 12, fontFamily: MOTION_THEME.fontMono, color: isGood ? '#6ee7b7' : '#fda4af' }}>
                    Â = {advLabels[i]}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: MOTION_THEME.fontMono }}>
            无需环境模型 p(s′|s,a)，仅凭采样到的轨迹优势 Â_t 即可算出无偏上升方向！
          </div>
        </div>

        {/* 右侧：2D 等高线山峰梯度上升 */}
        <div style={{ height: '100%', borderRadius: 18, backgroundColor: 'rgba(12,21,32,0.84)', border: '1px solid rgba(148,163,184,0.22)', padding: 14 }}>
          <svg viewBox="0 0 520 400" style={{ width: '100%', height: '100%' }}>
            {[36, 78, 128, 185, 248].map((r) => (
              <ellipse key={r} cx={390} cy={110} rx={r * 1.15} ry={r * 0.78} fill="none" stroke="rgba(56,189,248,0.24)" strokeWidth={2} />
            ))}
            <circle cx={390} cy={110} r={10} fill="#facc15" />
            <text x={390} y={88} textAnchor="middle" fill="#fde047" fontSize={15} fontWeight={800}>★ 性能峰顶 J(θ*)</text>

            {/* 攀登路径 */}
            <polyline fill="none" stroke="#34d399" strokeWidth={4} strokeDasharray="8 5" points={`110,310 ${tx.toFixed(1)},${ty.toFixed(1)}`} />
            <circle cx={tx} cy={ty} r={11} fill="#38bdf8" stroke="#fff" strokeWidth={3} />
            <text x={tx} y={ty + 30} textAnchor="middle" fill="#bae6fd" fontSize={14} fontWeight={800} fontFamily={MOTION_THEME.fontMono}>
              θ_k
            </text>
          </svg>
        </div>
      </div>
    </Stage>
  );
};
