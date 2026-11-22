import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { CLAMP, Camera, Stage, type MotionBeat } from '../../kit';

const BEATS: MotionBeat[] = [
  {
    id: 'manifolds',
    startFrame: 0,
    endFrame: 50,
    tag: 'Beat 1 · 评估与改进的双流形',
    caption: '青色直线是「价值自洽流形」V = v_π，紫色直线是「贪心最优流形」π = greedy(V)。',
    formula: 'V = v_π   ∩   π = greedy(V)   =   (v*, π*)',
  },
  {
    id: 'bounce',
    startFrame: 50,
    endFrame: 165,
    tag: 'Beat 2 · 镜头跟拍锯齿弹跳收敛',
    caption: '评估把状态点推向青线、改进把状态点拉向紫线；两股看似相互破坏的力量，在几何上共同把误差越压越小！',
    formula: 'π_0 → V^{π_0} → π_1 → V^{π_1} → …',
  },
  {
    id: 'lock',
    startFrame: 165,
    endFrame: 220,
    tag: 'Beat 3 · 推镜锁定交点 (v*, π*)',
    caption: '镜头推进特写交点：当状态点同时落在两条直线上，策略与价值达到全局最优不动点！',
    formula: 'v* = v_{π*},   π* = greedy(v*)',
  },
];

const PTS = [
  { x: 170, y: 375 },
  { x: 295, y: 112 },
  { x: 430, y: 322 },
  { x: 560, y: 158 },
  { x: 685, y: 274 },
  { x: 795, y: 196 },
  { x: 890, y: 238 },
  { x: 960, y: 220 },
];

export const GPICameraZigzagMotion: React.FC = () => {
  const frame = useCurrentFrame();
  const segF = interpolate(frame, [45, 180], [0, PTS.length - 1], CLAMP);
  const seg = Math.floor(segF);
  const frac = segF - seg;
  const cur = {
    x: PTS[seg].x + ((PTS[Math.min(PTS.length - 1, seg + 1)].x - PTS[seg].x) * frac),
    y: PTS[seg].y + ((PTS[Math.min(PTS.length - 1, seg + 1)].y - PTS[seg].y) * frac),
  };

  // Beat 3 顺滑推镜特写到交点 (960, 220)
  const zoom = interpolate(frame, [160, 200], [1, 1.48], CLAMP);
  const panX = interpolate(frame, [160, 200], [0, -280], CLAMP);

  return (
    <Stage
      title="广义策略迭代 (GPI)：评估与改进的双流形相机跟拍"
      chapterLabel="Ch 04 · 动态规划"
      world="topographic"
      beats={BEATS}
    >
      <Camera zoom={zoom} panX={panX}>
        <svg viewBox="0 0 1200 470" style={{ width: '100%', height: '100%' }}>
          {/* 双流形 */}
          <line x1={120} y1={84} x2={1030} y2={232} stroke="#2dd4bf" strokeWidth={4.5} />
          <text x={150} y={66} fill="#5eead4" fontSize={18} fontWeight={800}>
            策略评估目标：V = v_π
          </text>

          <line x1={120} y1={386} x2={1030} y2={208} stroke="#c084fc" strokeWidth={4.5} />
          <text x={150} y={424} fill="#e9d5ff" fontSize={18} fontWeight={800}>
            策略改进目标：π = greedy(V)
          </text>

          {/* 锯齿折线 */}
          <polyline
            fill="none"
            stroke="#facc15"
            strokeWidth={4}
            points={[...PTS.slice(0, seg + 1), cur].map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
          />
          {PTS.slice(0, seg + 1).map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={6} fill="#fde047" />
          ))}
          <circle cx={cur.x} cy={cur.y} r={11} fill="#fff" stroke="#facc15" strokeWidth={4} />

          {/* 最优交点 */}
          <g transform="translate(960, 220)">
            <circle r={18} fill="rgba(250,204,21,0.22)" stroke="#facc15" strokeWidth={3.5} />
            <text x={0} y={-28} textAnchor="middle" fill="#fde047" fontSize={20} fontWeight={800}>
              ★ (v*, π*)
            </text>
          </g>
        </svg>
      </Camera>
    </Stage>
  );
};
