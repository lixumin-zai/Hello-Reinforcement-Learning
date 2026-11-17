import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { CLAMP, MOTION_THEME, Stage, type MotionBeat } from '../../kit';

const BEATS: MotionBeat[] = [
  {
    id: 'branch-actions',
    startFrame: 0,
    endFrame: 60,
    tag: 'Beat 1 · 策略展开 π(a|s)',
    caption: '从根状态 s 出发，策略 π(a|s) 给出选择每个动作 a 的概率分支（空心状态点 → 实心动作点）。',
    formula: 'q_π(s, a) ↔ π(a | s)',
  },
  {
    id: 'branch-next',
    startFrame: 60,
    endFrame: 120,
    tag: 'Beat 2 · 环境动力学展开 p(s′,r|s,a)',
    caption: '每个动作节点 (s,a) 再由环境转移概率 p(s′|s,a) 分叉到后继状态 s′，并产生即时奖励 r。',
    formula: 'r + γ v_π(s′)  (γ = 0.9)',
  },
  {
    id: 'backup-q',
    startFrame: 120,
    endFrame: 180,
    tag: 'Beat 3 · 向上回传至动作价值 q_π(s,a)',
    caption: '后继状态的价值 v(s′) 乘以 γ 加上即时奖励 r，按转移概率加权回传，得到各动作的 q_π(s,a)。',
    formula: 'q_π(s,a) = Σ p(s′|s,a) [r + γ v_π(s′)]',
  },
  {
    id: 'backup-v',
    startFrame: 180,
    endFrame: 240,
    tag: 'Beat 4 · 汇总至根状态价值 v_π(s)',
    caption: '期望备份按 π(a|s) 加权平均得到 v_π(s) = 6.91；若取 max_a 则得到 Bellman 最优备份 v_*(s) = 7.72！',
    formula: 'v_π(s) = Σ π(a|s) q_π(s,a) = 6.91',
  },
];

// 精确数值示例：γ = 0.9
// 动作 a1 (π=0.6): p=0.8 -> s1'(r=2, v=6.5 => 2+0.9*6.5=7.85), p=0.2 -> s2'(r=1, v=7.0 => 1+0.9*7=7.30) => q(s,a1)=0.8*7.85+0.2*7.30 = 7.74
// 动作 a2 (π=0.4): p=0.5 -> s3'(r=0, v=5.0 => 4.50), p=0.5 -> s4'(r=3, v=4.2 => 6.78) => q(s,a2)=0.5*4.50+0.5*6.78 = 5.64
// v_π(s) = 0.6 * 7.74 + 0.4 * 5.64 = 4.644 + 2.256 = 6.90
const LEAVES = [
  { id: 's1', x: 130, ax: 215, label: 's₁′', p: 0.8, r: 2, v: 6.5, ret: 7.85 },
  { id: 's2', x: 300, ax: 215, label: 's₂′', p: 0.2, r: 1, v: 7.0, ret: 7.3 },
  { id: 's3', x: 480, ax: 565, label: 's₃′', p: 0.5, r: 0, v: 5.0, ret: 4.5 },
  { id: 's4', x: 650, ax: 565, label: 's₄′', p: 0.5, r: 3, v: 4.2, ret: 6.78 },
];

export const BellmanBackupMotion: React.FC = () => {
  const frame = useCurrentFrame();

  const showActions = interpolate(frame, [5, 35], [0, 1], CLAMP);
  const showLeaves = interpolate(frame, [62, 95], [0, 1], CLAMP);
  const backupToQ = interpolate(frame, [122, 165], [0, 1], CLAMP);
  const backupToV = interpolate(frame, [182, 220], [0, 1], CLAMP);

  return (
    <Stage
      title="Bellman 备份图 (Backup Diagram)：自底向上的价值回传"
      chapterLabel="02 · 马尔可夫决策过程"
      accent={MOTION_THEME.value}
      beats={BEATS}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24, height: '100%' }}>
        {/* 左侧备份树 SVG */}
        <div
          style={{
            borderRadius: 18,
            backgroundColor: MOTION_THEME.bgCard,
            border: `1px solid ${MOTION_THEME.border}`,
            padding: 12,
          }}
        >
          <svg viewBox="0 0 780 460" style={{ width: '100%', height: '100%' }}>
            {/* 根 -> 动作 连线 */}
            {[
              { x: 215, pi: 'π(a₁|s) = 0.6' },
              { x: 565, pi: 'π(a₂|s) = 0.4' },
            ].map((act, i) => (
              <g key={i} opacity={showActions}>
                <line
                  x1={390}
                  y1={70}
                  x2={act.x}
                  y2={215}
                  stroke={backupToV > 0 ? MOTION_THEME.value : MOTION_THEME.agent}
                  strokeWidth={backupToV > 0 ? 4 : 2.5}
                />
                <text
                  x={(390 + act.x) / 2 + (i === 0 ? -46 : 46)}
                  y={135}
                  textAnchor="middle"
                  fill="#c7d2fe"
                  fontSize={13}
                  fontWeight={600}
                >
                  {act.pi}
                </text>
              </g>
            ))}

            {/* 动作 -> 后继状态 连线 */}
            {LEAVES.map((lf) => (
              <g key={lf.id} opacity={showLeaves}>
                <line
                  x1={lf.ax}
                  y1={215}
                  x2={lf.x}
                  y2={370}
                  stroke={backupToQ > 0 ? MOTION_THEME.reward : MOTION_THEME.env}
                  strokeWidth={backupToQ > 0 ? 3.5 : 2}
                  strokeDasharray="6 4"
                />
                <text
                  x={(lf.ax + lf.x) / 2}
                  y={295}
                  textAnchor="middle"
                  fill="#5eead4"
                  fontSize={12}
                  fontWeight={600}
                >
                  p={lf.p}, r={lf.r}
                </text>

                {/* 回传粒子：叶子 -> 动作 */}
                {backupToQ > 0 && backupToQ < 1 && (
                  <circle
                    cx={interpolate(backupToQ, [0, 1], [lf.x, lf.ax], CLAMP)}
                    cy={interpolate(backupToQ, [0, 1], [370, 215], CLAMP)}
                    r={8}
                    fill={MOTION_THEME.reward}
                  />
                )}
              </g>
            ))}

            {/* 回传粒子：动作 -> 根 */}
            {backupToV > 0 && backupToV < 1 && (
              <>
                <circle
                  cx={interpolate(backupToV, [0, 1], [215, 390], CLAMP)}
                  cy={interpolate(backupToV, [0, 1], [215, 70], CLAMP)}
                  r={10}
                  fill={MOTION_THEME.value}
                />
                <circle
                  cx={interpolate(backupToV, [0, 1], [565, 390], CLAMP)}
                  cy={interpolate(backupToV, [0, 1], [215, 70], CLAMP)}
                  r={10}
                  fill={MOTION_THEME.value}
                />
              </>
            )}

            {/* 根状态节点 s */}
            <g transform="translate(390, 70)">
              <circle
                r={40}
                fill="#1e1b4b"
                stroke={backupToV > 0.8 ? '#c084fc' : MOTION_THEME.env}
                strokeWidth={4}
              />
              <text x={0} y={-6} textAnchor="middle" fill="#f8fafc" fontSize={15} fontWeight={800}>
                状态 s
              </text>
              <text x={0} y={16} textAnchor="middle" fill="#e9d5ff" fontSize={14} fontWeight={700}>
                {backupToV > 0.5 ? `v(s)=${(6.9 * backupToV).toFixed(2)}` : 'v(s) = ?'}
              </text>
            </g>

            {/* 两个动作实心节点 */}
            {[
              { x: 215, label: 'a₁ (向右)', q: 7.74 },
              { x: 565, label: 'a₂ (向下)', q: 5.64 },
            ].map((act, i) => (
              <g key={i} transform={`translate(${act.x}, 215)`} opacity={showActions}>
                <circle r={30} fill="#312e81" stroke={MOTION_THEME.agent} strokeWidth={3} />
                <text x={0} y={-4} textAnchor="middle" fill="#e0e7ff" fontSize={12} fontWeight={700}>
                  {act.label}
                </text>
                <text x={0} y={14} textAnchor="middle" fill="#fde68a" fontSize={12} fontWeight={700}>
                  {backupToQ > 0.5 ? `q=${(act.q * backupToQ).toFixed(2)}` : 'q = ?'}
                </text>
              </g>
            ))}

            {/* 四个后继状态叶子节点 */}
            {LEAVES.map((lf) => (
              <g key={lf.id} transform={`translate(${lf.x}, 370)`} opacity={showLeaves}>
                <circle r={32} fill="#042f2e" stroke={MOTION_THEME.env} strokeWidth={2.5} />
                <text x={0} y={-5} textAnchor="middle" fill="#ccfbf1" fontSize={13} fontWeight={700}>
                  {lf.label}: v={lf.v}
                </text>
                <text x={0} y={14} textAnchor="middle" fill="#fcd34d" fontSize={11} fontWeight={600}>
                  r+γv={lf.ret.toFixed(2)}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* 右侧：期望备份 vs 最优备份对照 */}
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
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>分步数值账本 (γ = 0.9)</div>

            <div
              style={{
                padding: 14,
                borderRadius: 12,
                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                border: `1px solid ${MOTION_THEME.border}`,
                fontFamily: MOTION_THEME.fontMono,
                fontSize: 13,
                lineHeight: 1.75,
                marginBottom: 14,
              }}
            >
              <div style={{ color: '#93c5fd', fontWeight: 700 }}>① 动作价值回传：</div>
              <div>q(s, a₁) = 0.8×7.85 + 0.2×7.30 = 7.74</div>
              <div>q(s, a₂) = 0.5×4.50 + 0.5×6.78 = 5.64</div>
            </div>

            <div
              style={{
                padding: 14,
                borderRadius: 12,
                backgroundColor: 'rgba(168, 85, 247, 0.14)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                fontFamily: MOTION_THEME.fontMono,
                fontSize: 13,
                lineHeight: 1.75,
                marginBottom: 14,
              }}
            >
              <div style={{ color: '#e9d5ff', fontWeight: 700 }}>② Bellman 期望备份（按策略加权）：</div>
              <div>v_π(s) = 0.6 × 7.74 + 0.4 × 5.64</div>
              <div style={{ color: '#f0abfc', fontSize: 16, fontWeight: 800 }}>v_π(s) = 6.90</div>
            </div>

            <div
              style={{
                padding: 14,
                borderRadius: 12,
                backgroundColor: 'rgba(20, 184, 166, 0.12)',
                border: '1px solid rgba(20, 184, 166, 0.4)',
                fontFamily: MOTION_THEME.fontMono,
                fontSize: 13,
                lineHeight: 1.75,
              }}
            >
              <div style={{ color: '#5eead4', fontWeight: 700 }}>③ Bellman 最优备份（取 max_a）：</div>
              <div>v_*(s) = max(7.74, 5.64) = 7.74</div>
            </div>
          </div>

          <div style={{ fontSize: 12, color: MOTION_THEME.textMuted }}>
            空心圆代表状态节点 s，实心圆代表状态-动作对 (s, a)。所有 DP 与 TD 算法本质上都在剪裁这棵备份树。
          </div>
        </div>
      </div>
    </Stage>
  );
};
