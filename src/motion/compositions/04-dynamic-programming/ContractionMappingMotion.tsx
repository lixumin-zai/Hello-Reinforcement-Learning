import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { CLAMP, MOTION_THEME, Stage, type MotionBeat } from '../../kit';

const BEATS: MotionBeat[] = [
  {
    id: 'two-guesses',
    startFrame: 0,
    endFrame: 60,
    tag: 'Beat 1 · 任意两个相差甚远的初始猜测 U₀, V₀',
    caption: '在二维状态价值空间 (V(s₁), V(s₂)) 中，随意选两个相距极远的初值猜测 U₀（蓝）与 V₀（玫红）。',
    formula: 'd_0 = ‖U_0 - V_0‖_∞ = 8.0',
  },
  {
    id: 'shrink',
    startFrame: 60,
    endFrame: 165,
    tag: 'Beat 2 · 每次应用 Bellman 算子 T^π，距离至少压缩 γ 倍',
    caption: '因为 ‖T^π U - T^π V‖_∞ ≤ γ ‖U - V‖_∞，每迭代一次，两者的最大距离都严格乘以 γ=0.75 向内坍缩！',
    formula: '‖T^π U_k - T^π V_k‖_∞ ≤ γ^k · ‖U_0 - V_0‖_∞',
  },
  {
    id: 'unique-fp',
    startFrame: 165,
    endFrame: 225,
    tag: 'Beat 3 · Banach 不动点定理：唯一收敛至真值 v_π',
    caption: '无论最初猜得多离谱，两条螺旋轨道最终都不可阻挡地锁死在唯一不动点 v_π = T^π v_π！',
    formula: 'lim_{k→∞} (T^π)^k V_0 = v_π  (唯一不动点)',
  },
];

// 精确 γ=0.72 螺旋压缩向唯一不动点 (600, 230)
const FP = { x: 600, y: 230 };
const buildOrbit = (dx0: number, dy0: number, steps = 9) =>
  Array.from({ length: steps }, (_, k) => {
    const scale = Math.pow(0.72, k);
    const angle = k * 0.42;
    const rx = (dx0 * Math.cos(angle) - dy0 * Math.sin(angle)) * scale;
    const ry = (dx0 * Math.sin(angle) + dy0 * Math.cos(angle)) * scale;
    return { x: FP.x + rx, y: FP.y + ry };
  });

const ORBIT_U = buildOrbit(-410, -155);
const ORBIT_V = buildOrbit(380, 165);

export const ContractionMappingMotion: React.FC = () => {
  const frame = useCurrentFrame();
  const kFloat = interpolate(frame, [45, 195], [0, ORBIT_U.length - 1], CLAMP);
  const k = Math.floor(kFloat);
  const frac = kFloat - k;

  const interpPt = (arr: { x: number; y: number }[]) => {
    const a = arr[k];
    const b = arr[Math.min(arr.length - 1, k + 1)];
    return { x: a.x + (b.x - a.x) * frac, y: a.y + (b.y - a.y) * frac };
  };
  const ptU = interpPt(ORBIT_U);
  const ptV = interpPt(ORBIT_V);
  const radius = Math.hypot(ptU.x - FP.x, ptU.y - FP.y);
  const distNorm = (8 * Math.pow(0.72, kFloat)).toFixed(2);

  return (
    <Stage
      title="为什么策略评估一定收敛？Banach γ-压缩映射几何证明"
      chapterLabel="Ch 04 · 动态规划"
      world="topographic"
      beats={BEATS}
    >
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <svg viewBox="0 0 1200 470" style={{ width: '100%', height: '100%' }}>
          {/* 坐标系十字线 */}
          <line x1={120} y1={FP.y} x2={1080} y2={FP.y} stroke="rgba(45,212,191,0.18)" strokeDasharray="6 6" />
          <line x1={FP.x} y1={30} x2={FP.x} y2={440} stroke="rgba(45,212,191,0.18)" strokeDasharray="6 6" />
          <text x={1060} y={FP.y - 10} textAnchor="end" fill="#67e8f9" fontSize={13} fontFamily={MOTION_THEME.fontMono}>V(s₁)</text>
          <text x={FP.x + 12} y={48} fill="#67e8f9" fontSize={13} fontFamily={MOTION_THEME.fontMono}>V(s₂)</text>

          {/* 收缩中的无穷范数等距方框 */}
          <rect
            x={FP.x - radius}
            y={FP.y - radius * 0.55}
            width={radius * 2}
            height={radius * 1.1}
            rx={16}
            fill="rgba(45,212,191,0.06)"
            stroke="rgba(45,212,191,0.45)"
            strokeWidth={2}
            strokeDasharray="8 6"
          />

          {/* 两条螺旋轨道历史痕迹 */}
          <polyline
            fill="none"
            stroke="#38bdf8"
            strokeWidth={3}
            points={[...ORBIT_U.slice(0, k + 1), ptU].map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
          />
          <polyline
            fill="none"
            stroke="#fb7185"
            strokeWidth={3}
            points={[...ORBIT_V.slice(0, k + 1), ptV].map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
          />

          {/* U_k 与 V_k 之间的当前距离连线 */}
          <line x1={ptU.x} y1={ptU.y} x2={ptV.x} y2={ptV.y} stroke="#facc15" strokeWidth={2.5} strokeDasharray="5 4" />

          {/* 中心唯一不动点 v_π */}
          <circle cx={FP.x} cy={FP.y} r={14} fill="#10b981" stroke="#fef08a" strokeWidth={3} />
          <text x={FP.x} y={FP.y + 34} textAnchor="middle" fill="#6ee7b7" fontSize={16} fontWeight={800}>
            ★ 唯一不动点 v_π = T^π v_π
          </text>

          {/* 运动中的 U_k 与 V_k 点 */}
          <circle cx={ptU.x} cy={ptU.y} r={11} fill="#38bdf8" stroke="#fff" strokeWidth={2.5} />
          <text x={ptU.x} y={ptU.y - 18} textAnchor="middle" fill="#bae6fd" fontSize={14} fontWeight={800}>
            U_{k}
          </text>
          <circle cx={ptV.x} cy={ptV.y} r={11} fill="#fb7185" stroke="#fff" strokeWidth={2.5} />
          <text x={ptV.x} y={ptV.y + 26} textAnchor="middle" fill="#fecdd3" fontSize={14} fontWeight={800}>
            V_{k}
          </text>
        </svg>

        {/* 左上角实时收缩距离 HUD */}
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 18,
            padding: '12px 18px',
            borderRadius: 14,
            backgroundColor: 'rgba(7, 29, 36, 0.9)',
            border: '1px solid rgba(45,212,191,0.4)',
            fontFamily: MOTION_THEME.fontMono,
          }}
        >
          <div style={{ fontSize: 12, color: '#67e8f9' }}>迭代轮次 k = {k}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fde047', marginTop: 2 }}>
            ‖U_k - V_k‖_∞ = {distNorm}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>每轮至少缩小至 0.72×</div>
        </div>
      </div>
    </Stage>
  );
};
