import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { CLAMP, MOTION_THEME, Stage, type MotionBeat } from '../../kit';

const BEATS: MotionBeat[] = [
  {
    id: 'expand-a',
    startFrame: 0,
    endFrame: 60,
    tag: 'Beat 1 · 第一层分叉：策略选择 π(a|s)',
    caption: '站在空心状态节点 s，智能体按策略分布 π(a|s) 展开至各实心动作节点 (s, a)。',
    formula: 'v_π(s) = Σ_a π(a | s) · q_π(s, a)',
  },
  {
    id: 'expand-s',
    startFrame: 60,
    endFrame: 120,
    tag: 'Beat 2 · 第二层分叉：环境动力学 p(s′,r|s,a)',
    caption: '每个动作都可能受随机环境影响落入不同后继状态 s′，并产生即时奖励 r。',
    formula: 'q_π(s, a) = Σ_{s′,r} p(s′,r|s,a)[r + γ v_π(s′)]',
  },
  {
    id: 'backup-up',
    startFrame: 120,
    endFrame: 195,
    tag: 'Beat 3 · 自底向上发光回传 (Backup)',
    caption: '后继状态价值 r + γv(s′) 化作光点逆流而上，先汇成 q(s,a₁)=7.74 与 q(s,a₂)=5.64，再汇聚至根部！',
    formula: '期望备份: 0.6×7.74 + 0.4×5.64 = 6.90',
  },
  {
    id: 'optimality-switch',
    startFrame: 195,
    endFrame: 255,
    tag: 'Beat 4 · 切换为 Bellman 最优备份 (max_a)',
    caption: '把根部加权平均替换成 max_a：剪掉弱分支 a₂，锁定最强分支 a₁，直接得到最优价值 v*(s) = 7.74！',
    formula: 'v*(s) = max(7.74, 5.64) = 7.74',
  },
];

const LEAVES = [
  { x: 200, ax: 330, label: 's₁′', p: 0.8, r: 2, v: 6.5, ret: 7.85 },
  { x: 450, ax: 330, label: 's₂′', p: 0.2, r: 1, v: 7.0, ret: 7.30 },
  { x: 750, ax: 870, label: 's₃′', p: 0.5, r: 0, v: 5.0, ret: 4.50 },
  { x: 1000, ax: 870, label: 's₄′', p: 0.5, r: 3, v: 4.2, ret: 6.78 },
];

export const BellmanTreeMorphMotion: React.FC = () => {
  const frame = useCurrentFrame();
  const showAct = interpolate(frame, [5, 38], [0, 1], CLAMP);
  const showLeaf = interpolate(frame, [62, 95], [0, 1], CLAMP);
  const up1 = interpolate(frame, [122, 158], [0, 1], CLAMP);
  const up2 = interpolate(frame, [158, 192], [0, 1], CLAMP);
  const isOpt = frame >= 195;

  return (
    <Stage
      title="Bellman 备份树形变：从期望平均到最优剪枝"
      chapterLabel="Ch 03 · MDP 与 Bellman 方程"
      world="chalkboard"
      beats={BEATS}
    >
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <svg viewBox="0 0 1200 470" style={{ width: '100%', height: '100%' }}>
          {/* 根 -> 动作 */}
          {[
            { x: 330, label: 'π(a₁|s) = 0.6', dim: false },
            { x: 870, label: 'π(a₂|s) = 0.4', dim: isOpt },
          ].map((b, idx) => (
            <g key={idx} opacity={showAct * (b.dim ? 0.25 : 1)}>
              <line
                x1={600}
                y1={75}
                x2={b.x}
                y2={215}
                stroke={isOpt && idx === 0 ? '#facc15' : '#38bdf8'}
                strokeWidth={isOpt && idx === 0 ? 5 : 3}
              />
              <text x={(600 + b.x) / 2 + (idx === 0 ? -55 : 55)} y={142} textAnchor="middle" fill="#7dd3fc" fontSize={15} fontWeight={700}>
                {isOpt && idx === 0 ? '★ argmax 选中' : b.label}
              </text>
            </g>
          ))}

          {/* 动作 -> 后继叶子 */}
          {LEAVES.map((lf, i) => {
            const dim = isOpt && i >= 2;
            return (
              <g key={lf.label} opacity={showLeaf * (dim ? 0.22 : 1)}>
                <line
                  x1={lf.ax}
                  y1={215}
                  x2={lf.x}
                  y2={375}
                  stroke="#94a3b8"
                  strokeWidth={2.5}
                  strokeDasharray="6 4"
                />
                <text x={(lf.ax + lf.x) / 2} y={300} textAnchor="middle" fill="#cbd5e1" fontSize={13} fontFamily={MOTION_THEME.fontMono}>
                  p={lf.p}, r={lf.r}
                </text>
                {up1 > 0 && up1 < 1 && (
                  <circle
                    cx={interpolate(up1, [0, 1], [lf.x, lf.ax], CLAMP)}
                    cy={interpolate(up1, [0, 1], [375, 215], CLAMP)}
                    r={9}
                    fill="#facc15"
                  />
                )}
              </g>
            );
          })}

          {/* 二级回传粒子 */}
          {up2 > 0 && up2 < 1 && (
            <>
              <circle cx={interpolate(up2, [0, 1], [330, 600], CLAMP)} cy={interpolate(up2, [0, 1], [215, 75], CLAMP)} r={11} fill="#38bdf8" />
              <circle cx={interpolate(up2, [0, 1], [870, 600], CLAMP)} cy={interpolate(up2, [0, 1], [215, 75], CLAMP)} r={11} fill="#38bdf8" />
            </>
          )}

          {/* 根状态 s */}
          <g transform="translate(600, 75)">
            <circle r={48} fill="#0c1520" stroke={isOpt ? '#facc15' : '#38bdf8'} strokeWidth={4.5} />
            <text x={0} y={-8} textAnchor="middle" fill="#f8fafc" fontSize={16} fontWeight={800}>
              状态 s
            </text>
            <text x={0} y={16} textAnchor="middle" fill={isOpt ? '#fde047' : '#7dd3fc'} fontSize={15} fontFamily={MOTION_THEME.fontMono} fontWeight={800}>
              {isOpt ? 'v*=7.74' : up2 > 0.5 ? `v_π=${(6.9 * up2).toFixed(2)}` : 'v(s)=?'}
            </text>
          </g>

          {/* 动作节点 */}
          {[
            { x: 330, title: 'a₁ (最优)', q: 7.74, dim: false },
            { x: 870, title: 'a₂', q: 5.64, dim: isOpt },
          ].map((a) => (
            <g key={a.title} transform={`translate(${a.x}, 215)`} opacity={showAct * (a.dim ? 0.25 : 1)}>
              <circle r={34} fill="#1e293b" stroke={isOpt && !a.dim ? '#facc15' : '#818cf8'} strokeWidth={3.5} />
              <text x={0} y={-5} textAnchor="middle" fill="#f8fafc" fontSize={13} fontWeight={700}>{a.title}</text>
              <text x={0} y={15} textAnchor="middle" fill="#fde047" fontSize={13} fontFamily={MOTION_THEME.fontMono} fontWeight={800}>
                {up1 > 0.5 ? `q=${(a.q * up1).toFixed(2)}` : 'q=?'}
              </text>
            </g>
          ))}

          {/* 叶子节点 */}
          {LEAVES.map((lf, i) => (
            <g key={lf.label} transform={`translate(${lf.x}, 375)`} opacity={showLeaf * (isOpt && i >= 2 ? 0.22 : 1)}>
              <circle r={38} fill="#0f172a" stroke="#2dd4bf" strokeWidth={2.5} />
              <text x={0} y={-5} textAnchor="middle" fill="#f8fafc" fontSize={14} fontWeight={700}>{lf.label}: v={lf.v}</text>
              <text x={0} y={15} textAnchor="middle" fill="#5eead4" fontSize={12} fontFamily={MOTION_THEME.fontMono}>
                r+γv={lf.ret.toFixed(2)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </Stage>
  );
};
