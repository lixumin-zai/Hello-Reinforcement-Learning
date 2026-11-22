import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { CLAMP, MOTION_THEME, Stage, type MotionBeat } from '../../kit';

const BEATS: MotionBeat[] = [
  {
    id: 'collect',
    startFrame: 0,
    endFrame: 70,
    tag: 'Beat 1 · 交互采集四元组写入环形回放池',
    caption: '在线网络 Q_θ 与环境交互，将高相关性的连续帧 (s, a, r, s′) 持续压入经验回放池 (Replay Buffer)。',
    formula: 'D ← D ∪ { (S_t, A_t, R_{t+1}, S_{t+1}) }',
  },
  {
    id: 'sample',
    startFrame: 70,
    endFrame: 150,
    tag: 'Beat 2 · 随机抽取 Mini-Batch，打破时间相关性！',
    caption: '训练时从百万历史池中均匀随机抽样小批量，彻底抹去相邻帧相关性并让每条经验被高效复用多次。',
    formula: '(s_j, a_j, r_j, s′_j) ~ Uniform(D)',
  },
  {
    id: 'target-sync',
    startFrame: 150,
    endFrame: 230,
    tag: 'Beat 3 · 冻结目标网络 θ⁻ 稳住靶子，每 C 步周期同步',
    caption: 'TD 目标由冻结的旧参数 Q_{θ⁻} 计算，防止“追尾巴震荡”；梯度只更新在线网络 θ，每隔 C 步再拷贝 θ⁻ ← θ！',
    formula: 'L(θ) = E[ (r + γ max Q_{θ⁻}(s′,a′) - Q_θ(s,a))² ]',
  },
];

export const DQNIndustrialPipelineMotion: React.FC = () => {
  const frame = useCurrentFrame();
  const packetCollect = (frame % 45) / 45;
  const batchHighlight = frame >= 70;
  const syncPulse = interpolate(frame, [175, 215], [0, 1], CLAMP);

  return (
    <Stage
      title="DQN 工业流水线：经验回放打乱相关性 × 目标网络冻结靶子"
      chapterLabel="Ch 07 · 函数近似与 DQN"
      world="telemetry"
      beats={BEATS}
    >
      <svg viewBox="0 0 1200 470" style={{ width: '100%', height: '100%' }}>
        {/* 1. 环境方块 */}
        <rect x={45} y={70} width={210} height={115} rx={18} fill="rgba(4,47,46,0.9)" stroke="#2dd4bf" strokeWidth={3} />
        <text x={150} y={115} textAnchor="middle" fill="#ccfbf1" fontSize={20} fontWeight={800}>🎮 Atari 环境</text>
        <text x={150} y={145} textAnchor="middle" fill="#5eead4" fontSize={13}>4 帧堆叠像素 S_t</text>

        {/* 2. 环形 Replay Buffer */}
        <rect x={345} y={48} width={310} height={160} rx={20} fill="rgba(18,22,30,0.92)" stroke="#fbbf24" strokeWidth={3} />
        <text x={500} y={82} textAnchor="middle" fill="#fde68a" fontSize={18} fontWeight={800}>🗄️ 经验回放池 D (10⁶ 槽位)</text>
        {Array.from({ length: 8 }, (_, i) => {
          const picked = batchHighlight && (i === 1 || i === 4 || i === 6);
          return (
            <rect
              key={i}
              x={368 + (i % 4) * 68}
              y={100 + Math.floor(i / 4) * 46}
              width={56}
              height={34}
              rx={8}
              fill={picked ? 'rgba(250,204,21,0.35)' : 'rgba(30,41,59,0.8)'}
              stroke={picked ? '#facc15' : '#475569'}
              strokeWidth={picked ? 2.5 : 1.5}
            />
          );
        })}

        {/* 3. 在线网络 Q_θ */}
        <rect x={765} y={50} width={385} height={135} rx={18} fill="rgba(30,27,75,0.92)" stroke="#818cf8" strokeWidth={3} />
        <text x={958} y={92} textAnchor="middle" fill="#e0e7ff" fontSize={20} fontWeight={800}>🧠 在线网络 Online Q_θ(s, a)</text>
        <text x={958} y={122} textAnchor="middle" fill="#a5b4fc" fontSize={14} fontFamily={MOTION_THEME.fontMono}>
          实时梯度下降：θ ← θ - α ∇_θ L(θ)
        </text>
        <text x={958} y={152} textAnchor="middle" fill="#818cf8" fontSize={13}>接收随机 Mini-Batch，预测 Q_θ(s_j, a_j)</text>

        {/* 4. 冻结目标网络 Q_{θ^-} */}
        <rect
          x={765}
          y={275}
          width={385}
          height={135}
          rx={18}
          fill="rgba(15,23,42,0.94)"
          stroke={syncPulse > 0.1 && syncPulse < 0.9 ? '#38bdf8' : '#64748b'}
          strokeWidth={syncPulse > 0.1 && syncPulse < 0.9 ? 4 : 3}
        />
        <text x={958} y={317} textAnchor="middle" fill="#bae6fd" fontSize={20} fontWeight={800}>🧊 目标网络 Target Q_&#123;θ⁻&#125;(s′, a′)</text>
        <text x={958} y={348} textAnchor="middle" fill="#7dd3fc" fontSize={14} fontFamily={MOTION_THEME.fontMono}>
          无梯度冻结计算：y_j = r_j + γ max Q_&#123;θ⁻&#125;
        </text>
        <text x={958} y={378} textAnchor="middle" fill="#94a3b8" fontSize={13}>每 C = 10,000 步同步一次 θ⁻ ← θ</text>

        {/* 5. 损失函数汇总框 */}
        <rect x={345} y={288} width={310} height={110} rx={18} fill="rgba(244,63,94,0.16)" stroke="#fb7185" strokeWidth={3} />
        <text x={500} y={330} textAnchor="middle" fill="#fecdd3" fontSize={18} fontWeight={800}>📉 均方贝尔曼误差 MSE Loss</text>
        <text x={500} y={362} textAnchor="middle" fill="#fda4af" fontSize={14} fontFamily={MOTION_THEME.fontMono}>
          L(θ) = ( y_j - Q_θ(s_j, a_j) )²
        </text>

        {/* 数据流连线 */}
        <line x1={255} y1={125} x2={345} y2={125} stroke="#2dd4bf" strokeWidth={3.5} />
        <circle cx={interpolate(packetCollect, [0, 1], [255, 345], CLAMP)} cy={125} r={7} fill="#2dd4bf" />

        <line x1={655} y1={115} x2={765} y2={115} stroke="#facc15" strokeWidth={3.5} strokeDasharray="8 5" />
        <line x1={655} y1={165} x2={765} y2={315} stroke="#38bdf8" strokeWidth={3} strokeDasharray="8 5" />
        <line x1={765} y1={345} x2={655} y2={345} stroke="#fb7185" strokeWidth={3.5} />

        {/* 周期硬拷贝脉冲 θ -> θ⁻ */}
        <line x1={958} y1={185} x2={958} y2={275} stroke="#38bdf8" strokeWidth={4} strokeDasharray="6 6" />
        {syncPulse > 0 && syncPulse < 1 && (
          <circle cx={958} cy={interpolate(syncPulse, [0, 1], [185, 275], CLAMP)} r={12} fill="#38bdf8" stroke="#fff" strokeWidth={2.5} />
        )}
        <text x={1060} y={236} fill="#7dd3fc" fontSize={13} fontWeight={800} fontFamily={MOTION_THEME.fontMono}>
          每 C 步拷贝 θ⁻ ← θ
        </text>
      </svg>
    </Stage>
  );
};
