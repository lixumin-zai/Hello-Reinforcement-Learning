import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { ACTION_ARROWS, GridWorld, PRESETS, valueIteration, valueToColor } from '@/lib/rl';
import { CLAMP, MOTION_THEME, Stage, type MotionBeat } from '../../kit';

const BEATS: MotionBeat[] = [
  {
    id: 'zero',
    startFrame: 0,
    endFrame: 42,
    tag: 'Beat 1 · 全场清零 V_0(s) = 0',
    caption: '5×5 地形初始化为 0，只有右上角宝藏格 ★ 蓄势待发。',
    formula: 'V_0(s) = 0',
  },
  {
    id: 'wave',
    startFrame: 42,
    endFrame: 175,
    tag: 'Beat 2 · Bellman 最优水波绕障扩散',
    caption: '每轮同步扫描应用 V_{k+1}(s) = max_a [r + γ V_k(s′)]，荧光价值波从宝藏绕过墙体一层层传遍全图！',
    formula: 'V_{k+1}(s) = max_a Σ p(s′,r|s,a)[r + γ V_k(s′)]',
  },
  {
    id: 'windfield',
    startFrame: 175,
    endFrame: 240,
    tag: 'Beat 3 · 等高线梯度催生最优风场 π*',
    caption: '价值场收敛至 V* 后，每格顺着最高价值坡度指向邻居，瞬间拼出绕过所有障碍的最短路径！',
    formula: 'π*(s) = argmax_a Q*(s, a)',
  },
];

const ENV = new GridWorld(PRESETS.simple());
const SNAPS = valueIteration(ENV, 0.9, 1e-4, 15);

export const ValueWavefieldMotion: React.FC = () => {
  const frame = useCurrentFrame();
  const k = Math.min(SNAPS.length - 1, Math.floor(interpolate(frame, [24, 185], [0, SNAPS.length - 1], CLAMP)));
  const snap = SNAPS[k];

  return (
    <Stage
      title="价值迭代：荧光等高线水波扩散与最优策略风场"
      chapterLabel="Ch 04 · 动态规划"
      world="topographic"
      beats={BEATS}
    >
      <div style={{ width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 26, alignItems: 'center', padding: '0 24px' }}>
        {/* 左侧 5×5 地形等高热力场 */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 86px)', gridTemplateRows: 'repeat(5, 86px)', gap: 9 }}>
            {Array.from({ length: ENV.nS }, (_, s) => {
              const t = ENV.cell(s);
              if (t === 'wall') {
                return (
                  <div
                    key={s}
                    style={{
                      borderRadius: 14,
                      backgroundColor: '#0f172a',
                      border: '2px solid #334155',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      color: '#64748b',
                      fontWeight: 800,
                    }}
                  >
                    WALL
                  </div>
                );
              }
              const v = snap.V[s];
              const isGoal = t === 'goal';
              return (
                <div
                  key={s}
                  style={{
                    borderRadius: 14,
                    backgroundColor: isGoal ? 'rgba(16,185,129,0.42)' : valueToColor(v, 1, 0.8),
                    border: `2px solid ${isGoal ? '#34d399' : v > 0 ? 'rgba(45,212,191,0.55)' : 'rgba(148,163,184,0.18)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: v > 0.7 || isGoal ? '0 0 22px rgba(45,212,191,0.32)' : 'none',
                  }}
                >
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#ecfeff', lineHeight: 1 }}>
                    {isGoal ? '★ G' : v > 0 ? ACTION_ARROWS[snap.policy[s]] : '·'}
                  </span>
                  <span style={{ fontSize: 12, fontFamily: MOTION_THEME.fontMono, color: '#cffafe', marginTop: 6 }}>
                    {isGoal ? '+1.00' : v.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 右侧：水波推进遥测 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ padding: 16, borderRadius: 14, backgroundColor: 'rgba(7,29,36,0.86)', border: '1px solid rgba(45,212,191,0.35)' }}>
              <div style={{ fontSize: 12, color: '#67e8f9' }}>扫描波次 k</div>
              <div style={{ fontSize: 34, fontWeight: 800, fontFamily: MOTION_THEME.fontMono, color: '#2dd4bf' }}>
                {k} / {SNAPS.length - 1}
              </div>
            </div>
            <div style={{ padding: 16, borderRadius: 14, backgroundColor: 'rgba(7,29,36,0.86)', border: '1px solid rgba(45,212,191,0.35)' }}>
              <div style={{ fontSize: 12, color: '#67e8f9' }}>最大波峰变化 Δ_k</div>
              <div style={{ fontSize: 30, fontWeight: 800, fontFamily: MOTION_THEME.fontMono, color: '#fde047' }}>
                {Number.isFinite(snap.delta) ? snap.delta.toFixed(4) : '∞'}
              </div>
            </div>
          </div>

          <div style={{ padding: 18, borderRadius: 14, backgroundColor: 'rgba(7,29,36,0.86)', border: '1px solid rgba(45,212,191,0.28)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#a5f3fc', marginBottom: 10 }}>
              每一轮扫描的 Δ_k 衰减柱谱（第 k 轮刚好到达距离终点 k 步的格子）：
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 115 }}>
              {SNAPS.slice(1).map((s, idx) => (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                  <div
                    style={{
                      width: '100%',
                      height: Math.max(5, Math.min(95, s.delta * 96)),
                      borderRadius: 6,
                      backgroundColor: idx + 1 <= k ? '#2dd4bf' : 'rgba(148,163,184,0.2)',
                    }}
                  />
                  <span style={{ fontSize: 10, color: '#67e8f9', marginTop: 4 }}>{idx + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Stage>
  );
};
