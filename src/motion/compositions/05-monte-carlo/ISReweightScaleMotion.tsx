import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { CLAMP, MOTION_THEME, Stage, type MotionBeat } from '../../kit';

const BEATS: MotionBeat[] = [
  {
    id: 'off-policy',
    startFrame: 0,
    endFrame: 65,
    tag: 'Beat 1 · 用“别人 b”的数据评估“自己 π”',
    caption: '我们手里只有行为策略 b 采集的历史轨迹，想评估目标策略 π 的价值，必须给每条轨迹乘上重要性采样比 ρ。',
    formula: 'ρ = Π_{k=t}^{T-1} [ π(A_k|S_k) / b(A_k|S_k) ]',
  },
  {
    id: 'explosion',
    startFrame: 65,
    endFrame: 150,
    tag: 'Beat 2 · 连乘引发的权重尖峰爆炸！',
    caption: '假设每步比值为 2×，一条走 5 步的罕见轨迹会被连乘放大成 2⁵ = 32×，瞬间把普通重要性采样均值拽向天际！',
    formula: '普通 IS:  V = (1/n) Σ ρ_i G_i   (方差爆炸!)',
  },
  {
    id: 'weighted',
    startFrame: 150,
    endFrame: 225,
    tag: 'Beat 3 · 加权重要性采样 (Weighted IS) 稳住天平',
    caption: '把分母从样本数 n 改为权重总和 Σ ρ_i 后，哪怕出现 32× 怪兽样本，估计值也永远被钳制在真实回报区间内！',
    formula: '加权 IS:  V = (Σ ρ_i G_i) / (Σ ρ_i)  ∈ [0, 1]',
  },
];

const SAMPLES = [
  { id: '轨迹 #1', len: 1, rho: 0, g: 0, note: 'b 走偏了 → ρ=0' },
  { id: '轨迹 #2', len: 2, rho: 4, g: 1, note: '2步连乘 2² = 4×' },
  { id: '轨迹 #3', len: 1, rho: 0, g: 0, note: 'b 走偏了 → ρ=0' },
  { id: '轨迹 #4 (罕见长轨!)', len: 5, rho: 32, g: 1, note: '5步连乘 2⁵ = 32×!' },
];

export const ISReweightScaleMotion: React.FC = () => {
  const frame = useCurrentFrame();
  const explodeMix = interpolate(frame, [72, 128], [0, 1], CLAMP);
  const weightedMix = interpolate(frame, [152, 198], [0, 1], CLAMP);

  const ordVal = (4 + 32 * explodeMix) / 4; // 从 1.0 暴涨到 9.0!
  const wisVal = 1.0;

  return (
    <Stage
      title="离策略重要性采样：连乘权重爆炸 vs 加权归一化"
      chapterLabel="Ch 05 · 蒙特卡洛方法"
      world="tabletop"
      beats={BEATS}
    >
      <div style={{ width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 24, padding: '8px 24px', alignItems: 'center' }}>
        {/* 左侧：4 条轨迹的重加权筹码柱 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {SAMPLES.map((s, i) => {
            const isMonster = i === 3;
            const barW = isMonster ? 12 + explodeMix * 84 : s.rho === 0 ? 4 : 24;
            return (
              <div
                key={s.id}
                style={{
                  borderRadius: 14,
                  padding: '12px 16px',
                  backgroundColor: isMonster && explodeMix > 0.3 ? 'rgba(244,63,94,0.22)' : 'rgba(5,36,26,0.88)',
                  border: `2px solid ${isMonster && explodeMix > 0.3 ? '#fb7185' : 'rgba(217,179,98,0.35)'}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontFamily: MOTION_THEME.fontMono, marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, color: '#fefce8' }}>{s.id}</span>
                  <span style={{ color: isMonster ? '#fda4af' : '#a7f3d0' }}>{s.note}</span>
                </div>
                <div style={{ height: 14, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.4)', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${barW}%`,
                      height: '100%',
                      backgroundColor: isMonster ? '#f43f5e' : '#eab308',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* 右侧：普通 IS vs 加权 IS 读数对比 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              borderRadius: 16,
              padding: '20px 22px',
              backgroundColor: 'rgba(244,63,94,0.16)',
              border: '2px solid #fb7185',
              fontFamily: MOTION_THEME.fontMono,
            }}
          >
            <div style={{ fontSize: 13, color: '#fecdd3' }}>普通重要性采样 Ordinary IS (除以 n=4)</div>
            <div style={{ fontSize: 38, fontWeight: 900, color: '#fb7185', marginTop: 6 }}>
              V̂ = {ordVal.toFixed(2)} <span style={{ fontSize: 14 }}>(真值仅 1.00!)</span>
            </div>
            <div style={{ fontSize: 12, color: '#fda4af', marginTop: 6 }}>无偏但方差极大甚至无穷大</div>
          </div>

          <div
            style={{
              opacity: 0.35 + weightedMix * 0.65,
              borderRadius: 16,
              padding: '20px 22px',
              backgroundColor: 'rgba(16,185,129,0.2)',
              border: '2px solid #34d399',
              fontFamily: MOTION_THEME.fontMono,
            }}
          >
            <div style={{ fontSize: 13, color: '#a7f3d0' }}>加权重要性采样 Weighted IS (除以 Σρ=36)</div>
            <div style={{ fontSize: 38, fontWeight: 900, color: '#34d399', marginTop: 6 }}>
              V̂ = {wisVal.toFixed(2)} <span style={{ fontSize: 14 }}>(稳如泰山!)</span>
            </div>
            <div style={{ fontSize: 12, color: '#6ee7b7', marginTop: 6 }}>虽有微小初始偏差但渐近收敛且方差极低</div>
          </div>
        </div>
      </div>
    </Stage>
  );
};
