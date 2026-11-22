import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { argmax, betaPdf, createRng, sampleBeta } from '@/lib/rl';
import { CLAMP, MOTION_THEME, Stage, type MotionBeat } from '../../kit';

const BEATS: MotionBeat[] = [
  {
    id: 'flat-prior',
    startFrame: 0,
    endFrame: 55,
    tag: 'Beat 1 · 无知先验 Beta(1, 1)',
    caption: '开局时我们对 4 台机器一无所知，每台的中奖率信念都是 [0, 1] 上的平坦均匀分布 Beta(1, 1)。',
    formula: 'Prior: θ_a ~ Beta(1, 1) = Uniform(0, 1)',
  },
  {
    id: 'sculpting',
    startFrame: 55,
    endFrame: 175,
    tag: 'Beat 2 · 飞镖采样与贝叶斯波峰雕塑',
    caption: '每一步从各曲线掷出采样飞镖 θ̃_a，最靠右者获选拉臂；随着观测增多，真实后验波峰愈发高耸尖锐！',
    formula: 'θ̃_a ~ Beta(α_a, β_a),   A_t = argmax_a θ̃_a',
  },
  {
    id: 'converged',
    startFrame: 175,
    endFrame: 240,
    tag: 'Beat 3 · 自动聚焦最优臂，实现 O(log T) 对数遗憾',
    caption: '绿色最优臂 (#3, q*=0.78) 的尖峰遥遥领先，飞镖几乎 100% 落在它的右侧，劣质臂不再浪费算力！',
    formula: 'α_a ← α_a + R_t,  β_a ← β_a + (1 - R_t)',
  },
];

const TRUE_P = [0.26, 0.50, 0.78, 0.40];
const ARMS = [
  { label: '臂 #1 (26%)', color: '#fb7185' },
  { label: '臂 #2 (50%)', color: '#facc15' },
  { label: '臂 #3 ★ (78%)', color: '#34d399' },
  { label: '臂 #4 (40%)', color: '#38bdf8' },
];

interface Snap {
  t: number;
  alpha: number[];
  beta: number[];
  samples: number[];
  chosen: number;
  reward: number;
}

// 预计算 40 步确定性 Thompson Sampling 演化快照
const SNAPS: Snap[] = (() => {
  const rng = createRng(2026);
  const a = [1, 1, 1, 1];
  const b = [1, 1, 1, 1];
  const out: Snap[] = [{ t: 0, alpha: a.slice(), beta: b.slice(), samples: [0.5, 0.5, 0.5, 0.5], chosen: -1, reward: 0 }];
  for (let t = 1; t <= 40; t++) {
    const samples = a.map((al, i) => sampleBeta(rng, al, b[i]));
    const chosen = argmax(samples);
    const reward = rng() < TRUE_P[chosen] ? 1 : 0;
    a[chosen] += reward;
    b[chosen] += 1 - reward;
    out.push({ t, alpha: a.slice(), beta: b.slice(), samples, chosen, reward });
  }
  return out;
})();

export const BayesianUCBSculptureMotion: React.FC = () => {
  const frame = useCurrentFrame();

  const stepFloat = interpolate(frame, [28, 225], [0, SNAPS.length - 1], CLAMP);
  const idx = Math.min(SNAPS.length - 1, Math.floor(stepFloat));
  const snap = SNAPS[idx];

  const xs = Array.from({ length: 101 }, (_, i) => i / 100);
  const curves = snap.alpha.map((al, i) => xs.map((x) => betaPdf(x, al, snap.beta[i])));
  const maxY = Math.max(3.2, ...curves.flat());

  const W = 1140;
  const H = 370;
  const padL = 54;
  const padR = 30;
  const padB = 46;
  const padT = 26;
  const xToPx = (x: number) => padL + x * (W - padL - padR);
  const yToPx = (y: number) => H - padB - (y / maxY) * (H - padT - padB);

  return (
    <Stage
      title="Thompson Sampling 贝叶斯波峰雕塑 & UCB 置信压帽"
      chapterLabel="Ch 02 · 多臂老虎机"
      world="chalkboard"
      beats={BEATS}
    >
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* 全宽数学黑板坐标平面 */}
        <div
          style={{
            flex: 1.5,
            borderRadius: 18,
            backgroundColor: 'rgba(12, 22, 34, 0.85)',
            border: '1px solid rgba(148,163,184,0.22)',
            padding: '10px 18px',
          }}
        >
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }}>
            {/* 网格底线 */}
            <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke="rgba(226,232,240,0.45)" strokeWidth={2} />
            {[0, 0.25, 0.5, 0.75, 1].map((v) => (
              <g key={v}>
                <line x1={xToPx(v)} y1={padT} x2={xToPx(v)} y2={H - padB} stroke="rgba(148,163,184,0.12)" strokeDasharray="4 4" />
                <text x={xToPx(v)} y={H - 16} textAnchor="middle" fill="#94a3b8" fontSize={14} fontFamily={MOTION_THEME.fontMono}>
                  {v.toFixed(2)}
                </text>
              </g>
            ))}

            {/* 4 条雕塑感 Beta 密度曲线 */}
            {curves.map((ys, i) => {
              const pts = ys.map((y, k) => `${xToPx(k / 100).toFixed(1)},${yToPx(y).toFixed(1)}`).join(' ');
              const area = `${padL},${H - padB} ${pts} ${W - padR},${H - padB}`;
              return (
                <g key={i}>
                  <polygon points={area} fill={ARMS[i].color} opacity={0.16} />
                  <polyline fill="none" stroke={ARMS[i].color} strokeWidth={3.5} points={pts} />
                  {/* 底部真值标记 */}
                  <polygon
                    points={`${xToPx(TRUE_P[i])},${H - padB} ${xToPx(TRUE_P[i]) - 6},${H - padB + 11} ${xToPx(TRUE_P[i]) + 6},${H - padB + 11}`}
                    fill={ARMS[i].color}
                  />
                </g>
              );
            })}

            {/* 当前步的 4 支贝叶斯采样飞镖 */}
            {snap.chosen >= 0 &&
              snap.samples.map((sVal, i) => {
                const cx = xToPx(sVal);
                const isWinner = snap.chosen === i;
                return (
                  <g key={`d-${i}`}>
                    <line
                      x1={cx}
                      y1={padT}
                      x2={cx}
                      y2={H - padB}
                      stroke={ARMS[i].color}
                      strokeWidth={isWinner ? 3.5 : 1.5}
                      strokeDasharray={isWinner ? 'none' : '5 4'}
                    />
                    <circle cx={cx} cy={isWinner ? padT + 14 : padT + 42} r={isWinner ? 9 : 5} fill={ARMS[i].color} stroke="#fff" strokeWidth={2} />
                    {isWinner && (
                      <text x={cx} y={padT + 4} textAnchor="middle" fill="#fff" fontSize={13} fontWeight={800} fontFamily={MOTION_THEME.fontMono}>
                        ★ θ̃={sVal.toFixed(2)} → 选中
                      </text>
                    )}
                  </g>
                );
              })}

            <text x={padL + 8} y={padT + 16} fill="#cbd5e1" fontSize={14} fontFamily={MOTION_THEME.fontMono}>
              拉臂总次数 t = {snap.t} / 40 · 密度峰值 = {maxY.toFixed(1)}
            </text>
          </svg>
        </div>

        {/* 底部 4 张精简后验 + UCB 上界对比卡片 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {ARMS.map((arm, i) => {
            const n = snap.alpha[i] + snap.beta[i] - 2;
            const mean = snap.alpha[i] / (snap.alpha[i] + snap.beta[i]);
            const ucbBonus = n > 0 ? Math.sqrt((1.2 * Math.log(Math.max(2, snap.t))) / n) : 0.9;
            const active = snap.chosen === i;
            return (
              <div
                key={arm.label}
                style={{
                  borderRadius: 12,
                  padding: '10px 14px',
                  backgroundColor: active ? `${arm.color}22` : 'rgba(15, 25, 38, 0.84)',
                  border: `2px solid ${active ? arm.color : 'rgba(148,163,184,0.2)'}`,
                  fontFamily: MOTION_THEME.fontMono,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800, color: arm.color }}>
                  <span>{arm.label}</span>
                  <span>N={n}</span>
                </div>
                <div style={{ fontSize: 12, color: '#e2e8f0', marginTop: 4 }}>
                  Beta({snap.alpha[i]}, {snap.beta[i]}) · μ={mean.toFixed(2)}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                  UCB 上界压帽: {(mean + ucbBonus).toFixed(2)} (+{ucbBonus.toFixed(2)})
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Stage>
  );
};
