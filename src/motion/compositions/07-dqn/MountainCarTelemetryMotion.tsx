import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import {
  MC_GOAL_X,
  MC_MAX_V,
  MC_MAX_X,
  MC_MIN_X,
  mountainCarEnergyPolicy,
  mountainHeight,
  resetMountainCar,
  stepMountainCar,
  type MountainCarState,
} from '@/lib/rl';
import { CLAMP, MOTION_THEME, Stage, type MotionBeat } from '../../kit';

const BEATS: MotionBeat[] = [
  {
    id: 'underpowered',
    startFrame: 0,
    endFrame: 75,
    tag: 'Beat 1 · 连续物理世界：小引擎冲不上高坡',
    caption: '山地车在连续状态 (x, v) 中起步，油门推力小于重力，必须先倒车爬向左坡积攒势能！',
    formula: 'v_{t+1} = v_t + 0.001·a - 0.0025·cos(3x_t)',
  },
  {
    id: 'pump-tiles',
    startFrame: 75,
    endFrame: 170,
    tag: 'Beat 2 · 瓦片编码泛化 + 相空间能量螺旋扩张',
    caption: '多层错位瓦片将连续坐标映射到稀疏特征向量 φ(s)，能量泵策略顺势加速，右侧相空间螺旋一圈圈扩大！',
    formula: 'v̂(s, w) = wᵀ φ(s)   (多层重叠瓦片特征)',
  },
  {
    id: 'summit',
    startFrame: 170,
    endFrame: 240,
    tag: 'Beat 3 · 势能化动能，一举越过 x = 0.50 山顶小旗！',
    caption: '两次蓄力摆荡后动能突破势垒，106 步成功夺旗，证明了连续状态空间下函数近似的威力。',
    formula: 'x_t ≥ 0.50  ⇒  终局达标!',
  },
];

// 预先确定性积分整条山地车 RL 冲顶轨迹
const TRAJ: MountainCarState[] = (() => {
  let s = resetMountainCar(-0.5);
  const out = [s];
  for (let i = 0; i < 130 && !s.done; i++) {
    s = stepMountainCar(s, mountainCarEnergyPolicy(s)).state;
    out.push(s);
  }
  return out;
})();

export const MountainCarTelemetryMotion: React.FC = () => {
  const frame = useCurrentFrame();
  const idx = Math.min(TRAJ.length - 1, Math.floor(interpolate(frame, [10, 215], [0, TRAJ.length - 1], CLAMP)));
  const st = TRAJ[idx];

  const xToPx = (x: number) => 40 + ((x - MC_MIN_X) / (MC_MAX_X - MC_MIN_X)) * 560;
  const yToPx = (y: number) => 225 - y * 135;
  const valley = Array.from({ length: 73 }, (_, i) => {
    const x = MC_MIN_X + (i / 72) * (MC_MAX_X - MC_MIN_X);
    return `${xToPx(x).toFixed(1)},${yToPx(mountainHeight(x)).toFixed(1)}`;
  }).join(' ');

  const cx = xToPx(st.x);
  const cy = yToPx(mountainHeight(st.x));
  const ang = (-Math.atan(3 * Math.cos(3 * st.x) * 0.48) * 180) / Math.PI;

  // 当前在 4x4 瓦片中的激活坐标
  const tileCol = Math.min(3, Math.floor(((st.x - MC_MIN_X) / (MC_MAX_X - MC_MIN_X)) * 4));
  const tileRow = Math.min(3, Math.floor(((MC_MAX_V - st.v) / (2 * MC_MAX_V)) * 4));

  return (
    <Stage
      title="连续状态空间遥测：Mountain Car 物理摆荡 × 相空间瓦片激活"
      chapterLabel="Ch 07 · 函数近似与 DQN"
      world="telemetry"
      beats={BEATS}
    >
      <div style={{ width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 22, padding: '6px 14px' }}>
        {/* 左侧：物理山谷与小车 */}
        <div style={{ borderRadius: 16, backgroundColor: 'rgba(18,22,30,0.9)', border: '1px solid rgba(148,163,184,0.25)', padding: 14 }}>
          <svg viewBox="0 0 640 390" style={{ width: '100%', height: '100%' }}>
            <polygon points={`40,375 ${valley} 600,375`} fill="rgba(56,189,248,0.12)" />
            <polyline fill="none" stroke="#38bdf8" strokeWidth={4} points={valley} />

            {/* 终点旗 */}
            <g transform={`translate(${xToPx(MC_GOAL_X)}, ${yToPx(mountainHeight(MC_GOAL_X))})`}>
              <line x1={0} y1={0} x2={0} y2={-48} stroke="#facc15" strokeWidth={4} />
              <polygon points="0,-48 34,-36 0,-24" fill="#facc15" />
            </g>

            {/* 物理小车 */}
            <g transform={`translate(${cx}, ${cy - 12}) rotate(${ang.toFixed(1)})`}>
              <rect x={-22} y={-12} width={44} height={20} rx={6} fill="#10b981" stroke="#fff" strokeWidth={2.5} />
              <circle cx={-12} cy={10} r={6} fill="#e2e8f0" />
              <circle cx={12} cy={10} r={6} fill="#e2e8f0" />
            </g>

            <text x={24} y={32} fill="#e2e8f0" fontSize={15} fontFamily={MOTION_THEME.fontMono} fontWeight={700}>
              STEP {String(st.steps).padStart(3, '0')} | POS x = {st.x.toFixed(3)} | VEL v = {st.v >= 0 ? `+${st.v.toFixed(4)}` : st.v.toFixed(4)}
            </text>
          </svg>
        </div>

        {/* 右侧：相空间螺旋 + 4×4 瓦片编码网格高亮 */}
        <div style={{ borderRadius: 16, backgroundColor: 'rgba(18,22,30,0.9)', border: '1px solid rgba(148,163,184,0.25)', padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#7dd3fc' }}>相空间 (x, v) 轨迹与重叠瓦片激活</div>
          <svg viewBox="0 0 420 330" style={{ width: '100%', height: 320 }}>
            {/* 4x4 瓦片底格 */}
            {Array.from({ length: 4 }, (_, r) =>
              Array.from({ length: 4 }, (__, c) => {
                const active = r === tileRow && c === tileCol;
                return (
                  <rect
                    key={`${r}-${c}`}
                    x={30 + c * 90}
                    y={20 + r * 70}
                    width={90}
                    height={70}
                    fill={active ? 'rgba(250,204,21,0.24)' : 'rgba(30,41,59,0.45)'}
                    stroke={active ? '#facc15' : 'rgba(148,163,184,0.22)'}
                    strokeWidth={active ? 3 : 1}
                  />
                );
              }),
            )}
            {/* 第二层错位瓦片虚线框 */}
            <rect
              x={30 + tileCol * 90 + 18}
              y={20 + tileRow * 70 + 14}
              width={90}
              height={70}
              fill="rgba(56,189,248,0.16)"
              stroke="#38bdf8"
              strokeWidth={2}
              strokeDasharray="5 4"
            />

            {/* 相空间螺旋折线 */}
            <polyline
              fill="none"
              stroke="#34d399"
              strokeWidth={3.2}
              points={TRAJ.slice(0, idx + 1)
                .map((p) => {
                  const px = 30 + ((p.x - MC_MIN_X) / (MC_MAX_X - MC_MIN_X)) * 360;
                  const py = 160 - (p.v / MC_MAX_V) * 140;
                  return `${px.toFixed(1)},${py.toFixed(1)}`;
                })
                .join(' ')}
            />
            <circle
              cx={30 + ((st.x - MC_MIN_X) / (MC_MAX_X - MC_MIN_X)) * 360}
              cy={160 - (st.v / MC_MAX_V) * 140}
              r={8}
              fill="#fde047"
              stroke="#0f172a"
              strokeWidth={2}
            />
          </svg>
          <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: MOTION_THEME.fontMono }}>
            当前激活瓦片：Layer1({tileRow},{tileCol}) + Layer2 错位邻域 → 泛化共享权重 w
          </div>
        </div>
      </div>
    </Stage>
  );
};
