import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { CLAMP, MOTION_THEME, Stage, type MotionBeat } from '../../kit';

const BEATS: MotionBeat[] = [
  {
    id: 'select',
    startFrame: 0,
    endFrame: 65,
    tag: 'Phase 1 · Selection (选择)',
    caption: '从根节点出发，每层沿 UCT = W/N + c√(ln N_parent / N) 最高的枝干发光下探，平衡胜率与探索！',
    formula: 'UCT(s,a) = W/N + c √(ln N_p / N)',
  },
  {
    id: 'expand',
    startFrame: 65,
    endFrame: 120,
    tag: 'Phase 2 · Expansion (扩展)',
    caption: '到达尚未完全展开的叶子节点，沿着一个未试过的合法落子方向，萌发出一枚崭新的树节点！',
    formula: 'Expand new child node s_new',
  },
  {
    id: 'simulate',
    startFrame: 120,
    endFrame: 175,
    tag: 'Phase 3 · Simulation (模拟推演 / 价值网估值)',
    caption: '经典 MCTS 从新叶快进随机对弈至终局得胜负 z；AlphaZero 则直接用神经网络 V_θ(s_new) 瞬间估分！',
    formula: 'Rollout → z = +1 (WIN!)   or   v = V_θ(s_new)',
  },
  {
    id: 'backprop',
    startFrame: 175,
    endFrame: 245,
    tag: 'Phase 4 · Backpropagation (回传刷新)',
    caption: '胜负光球沿原路逆流回根节点，沿途所有祖先节点的访问次数 N 全部 +1，胜分 W 同步刷新！',
    formula: '∀ node ∈ path:  N ← N + 1,  W ← W + z',
  },
];

export const MCTSLivingTreeMotion: React.FC = () => {
  const frame = useCurrentFrame();

  const selP = interpolate(frame, [8, 58], [0, 1], CLAMP);
  const expP = interpolate(frame, [68, 108], [0, 1], CLAMP);
  const simP = interpolate(frame, [122, 166], [0, 1], CLAMP);
  const backP = interpolate(frame, [178, 232], [0, 1], CLAMP);

  const bpDone = backP > 0.75;

  return (
    <Stage
      title="蒙特卡洛树搜索 (MCTS)：选择 → 扩展 → 模拟 → 回传"
      chapterLabel="Ch 09 · 连续控制与规划"
      world="terminal"
      beats={BEATS}
    >
      <svg viewBox="0 0 1200 470" style={{ width: '100%', height: '100%' }}>
        {/* 已有树边 */}
        <line x1={600} y1={68} x2={340} y2={185} stroke={frame < 65 || frame >= 175 ? '#34d399' : '#475569'} strokeWidth={4} />
        <line x1={600} y1={68} x2={860} y2={185} stroke="#334155" strokeWidth={2.5} />
        <line x1={340} y1={185} x2={210} y2={305} stroke="#334155" strokeWidth={2.5} />
        <line x1={340} y1={185} x2={470} y2={305} stroke={frame < 65 || frame >= 175 ? '#34d399' : '#475569'} strokeWidth={4} />

        {/* Phase 2：萌发扩展的新树枝 */}
        {expP > 0 && (
          <line
            x1={470}
            y1={305}
            x2={470 + 130 * expP}
            y2={305 + 100 * expP}
            stroke="#a78bfa"
            strokeWidth={4}
          />
        )}

        {/* Phase 3：快速模拟波浪线 -> WIN +1 */}
        {simP > 0 && (
          <g opacity={simP}>
            <path
              d="M 642 405 Q 720 365 785 405 T 930 405"
              fill="none"
              stroke="#facc15"
              strokeWidth={3.5}
              strokeDasharray="8 6"
            />
            <rect x={935} y={376} width={165} height={58} rx={14} fill="rgba(250,204,21,0.2)" stroke="#facc15" strokeWidth={2.5} />
            <text x={1017} y={411} textAnchor="middle" fill="#fde047" fontSize={18} fontWeight={800} fontFamily={MOTION_THEME.fontMono}>
              🏆 WIN z = +1
            </text>
          </g>
        )}

        {/* Phase 1 下探光球 */}
        {selP > 0 && selP < 1 && (
          <circle
            cx={selP < 0.5 ? interpolate(selP, [0, 0.5], [600, 340], CLAMP) : interpolate(selP, [0.5, 1], [340, 470], CLAMP)}
            cy={selP < 0.5 ? interpolate(selP, [0, 0.5], [68, 185], CLAMP) : interpolate(selP, [0.5, 1], [185, 305], CLAMP)}
            r={12}
            fill="#facc15"
            stroke="#fff"
            strokeWidth={2.5}
          />
        )}

        {/* Phase 4 回传光球 */}
        {backP > 0 && backP < 1 && (
          <circle
            cx={
              backP < 0.33
                ? interpolate(backP, [0, 0.33], [600, 470], CLAMP)
                : backP < 0.66
                  ? interpolate(backP, [0.33, 0.66], [470, 340], CLAMP)
                  : interpolate(backP, [0.66, 1], [340, 600], CLAMP)
            }
            cy={
              backP < 0.33
                ? interpolate(backP, [0, 0.33], [405, 305], CLAMP)
                : backP < 0.66
                  ? interpolate(backP, [0.33, 0.66], [305, 185], CLAMP)
                  : interpolate(backP, [0.66, 1], [185, 68], CLAMP)
            }
            r={13}
            fill="#34d399"
            stroke="#fff"
            strokeWidth={3}
          />
        )}

        {/* 树节点 */}
        <TreeNode x={600} y={68} label="Root" stats={bpDone ? '12 / 21' : '11 / 20'} active={true} />
        <TreeNode x={340} y={185} label="高 UCT 分支" stats={bpDone ? '8 / 13' : '7 / 12'} active={true} />
        <TreeNode x={860} y={185} label="分支 B" stats="4 / 8" active={false} />
        <TreeNode x={210} y={305} label="叶 A1" stats="2 / 5" active={false} />
        <TreeNode x={470} y={305} label="叶 A2" stats={bpDone ? '6 / 8' : '5 / 7'} active={true} />

        {expP > 0.4 && (
          <TreeNode x={600} y={405} label="新扩展叶 ★" stats={bpDone ? '1 / 1' : '0 / 0'} active={true} color="#a78bfa" />
        )}
      </svg>
    </Stage>
  );
};

function TreeNode({
  x,
  y,
  label,
  stats,
  active,
  color = '#34d399',
}: {
  x: number;
  y: number;
  label: string;
  stats: string;
  active: boolean;
  color?: string;
}) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        x={-68}
        y={-30}
        width={136}
        height={60}
        rx={16}
        fill={active ? 'rgba(13,17,23,0.96)' : 'rgba(15,23,42,0.75)'}
        stroke={active ? color : '#475569'}
        strokeWidth={active ? 3.5 : 2}
      />
      <text x={0} y={-5} textAnchor="middle" fill="#e6edf3" fontSize={13} fontWeight={700}>{label}</text>
      <text x={0} y={17} textAnchor="middle" fill={active ? '#fde047' : '#94a3b8'} fontSize={14} fontWeight={800} fontFamily={MOTION_THEME.fontMono}>
        W/N = {stats}
      </text>
    </g>
  );
}
