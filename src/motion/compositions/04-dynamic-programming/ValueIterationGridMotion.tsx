import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { ACTION_ARROWS, GridWorld, PRESETS, valueIteration, valueToColor } from '@/lib/rl';
import { CLAMP, MOTION_THEME, Stage, type MotionBeat } from '../../kit';

const BEATS: MotionBeat[] = [
  {
    id: 'init',
    startFrame: 0,
    endFrame: 45,
    tag: 'Beat 1 · 初始化 V_0(s) = 0',
    caption: '5×5 网格世界初始化所有状态价值 V_0(s) = 0。右上角 G 为目标 (+1)，灰色格为不可穿越的墙壁。',
    formula: 'V_0(s) = 0  (∀s ∈ S)',
  },
  {
    id: 'wave',
    startFrame: 45,
    endFrame: 165,
    tag: 'Beat 2 · Bellman 最优备份波向外扩散',
    caption: '每一轮同步扫描应用 V_{k+1}(s) = max_a Σ p(s′,r|s,a)[r + γV_k(s′)]，价值像水波一样从终点传向起点。',
    formula: 'V_{k+1}(s) = max_a [ r + γ V_k(s′) ]',
  },
  {
    id: 'optimal',
    startFrame: 165,
    endFrame: 240,
    tag: 'Beat 3 · 收敛至 V* 并提取最优策略 π*',
    caption: '当最大变化量 Δ → 0 时价值收敛，每个格子指向高价值邻居的贪心箭头即构成最短避障策略 π*。',
    formula: 'π*(s) = argmax_a [ r + γ V*(s′) ]',
  },
];

const ENV = new GridWorld(PRESETS.simple());
const GAMMA = 0.9;
const SNAPSHOTS = valueIteration(ENV, GAMMA, 1e-4, 20);

export const ValueIterationGridMotion: React.FC = () => {
  const frame = useCurrentFrame();

  const iterFloat = interpolate(frame, [20, 185], [0, SNAPSHOTS.length - 1], CLAMP);
  const k = Math.min(SNAPSHOTS.length - 1, Math.floor(iterFloat));
  const snap = SNAPSHOTS[k];

  return (
    <Stage
      title="价值迭代 (Value Iteration)：价值水波扩散与最优策略对齐"
      chapterLabel="04 · 动态规划"
      accent={MOTION_THEME.env}
      beats={BEATS}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 24, height: '100%' }}>
        {/* 左侧 5×5 网格热力图 */}
        <div
          style={{
            borderRadius: 18,
            backgroundColor: MOTION_THEME.bgCard,
            border: `1px solid ${MOTION_THEME.border}`,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${ENV.spec.cols}, 82px)`,
              gridTemplateRows: `repeat(${ENV.spec.rows}, 82px)`,
              gap: 8,
            }}
          >
            {Array.from({ length: ENV.nS }, (_, s) => {
              const type = ENV.cell(s);
              const v = snap.V[s];
              const act = snap.policy[s];
              if (type === 'wall') {
                return (
                  <div
                    key={s}
                    style={{
                      borderRadius: 12,
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      color: '#64748b',
                      fontWeight: 700,
                    }}
                  >
                    WALL
                  </div>
                );
              }
              const isGoal = type === 'goal';
              return (
                <div
                  key={s}
                  style={{
                    borderRadius: 12,
                    backgroundColor: isGoal ? 'rgba(16, 185, 129, 0.35)' : valueToColor(v, 1, 0.78),
                    border: isGoal ? '2px solid #34d399' : `1px solid ${MOTION_THEME.borderStrong}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  {type === 'start' && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 4,
                        left: 6,
                        fontSize: 10,
                        color: '#a5b4fc',
                        fontWeight: 700,
                      }}
                    >
                      S
                    </span>
                  )}
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', lineHeight: 1 }}>
                    {isGoal ? '★ G' : v > 0 ? ACTION_ARROWS[act] : '·'}
                  </span>
                  <span
                    style={{
                      marginTop: 6,
                      fontSize: 12,
                      fontFamily: MOTION_THEME.fontMono,
                      color: '#e2e8f0',
                      fontWeight: 600,
                    }}
                  >
                    {isGoal ? '+1.00' : v.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 右侧：迭代监控与收敛说明 */}
        <div
          style={{
            borderRadius: 18,
            backgroundColor: MOTION_THEME.bgCard,
            border: `1px solid ${MOTION_THEME.border}`,
            padding: '22px 26px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>同步扫描监控 (Synchronous Sweep)</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
              <div
                style={{
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor: 'rgba(15, 23, 42, 0.75)',
                  border: `1px solid ${MOTION_THEME.border}`,
                }}
              >
                <div style={{ fontSize: 12, color: MOTION_THEME.textMuted }}>当前迭代轮次 k</div>
                <div style={{ fontSize: 32, fontWeight: 800, fontFamily: MOTION_THEME.fontMono, color: '#5eead4' }}>
                  k = {k} / {SNAPSHOTS.length - 1}
                </div>
              </div>
              <div
                style={{
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor: 'rgba(15, 23, 42, 0.75)',
                  border: `1px solid ${MOTION_THEME.border}`,
                }}
              >
                <div style={{ fontSize: 12, color: MOTION_THEME.textMuted }}>最大价值变化 Δ_k</div>
                <div style={{ fontSize: 28, fontWeight: 800, fontFamily: MOTION_THEME.fontMono, color: '#fbbf24' }}>
                  {Number.isFinite(snap.delta) ? snap.delta.toFixed(4) : '∞'}
                </div>
              </div>
            </div>

            {/* 各轮 Δ 衰减条 */}
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#cbd5e1' }}>
              Bellman 最优算子 γ-压缩映射收敛过程：
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 110, padding: '8px 0' }}>
              {SNAPSHOTS.slice(1).map((s, idx) => {
                const active = idx + 1 <= k;
                const h = Math.max(4, Math.min(96, s.delta * 95));
                return (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      height: '100%',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: h,
                        borderRadius: 6,
                        backgroundColor: active ? MOTION_THEME.env : 'rgba(148,163,184,0.2)',
                      }}
                    />
                    <span style={{ fontSize: 10, color: MOTION_THEME.textMuted, marginTop: 4 }}>{idx + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              padding: 14,
              borderRadius: 12,
              backgroundColor: 'rgba(20, 184, 166, 0.1)',
              border: '1px solid rgba(20, 184, 166, 0.35)',
              fontSize: 13,
              color: '#ccfbf1',
              lineHeight: 1.6,
            }}
          >
            注意观察：第 k 轮扫描刚好让距离终点 k 步的状态第一次获得正价值，共 9 轮扫描即可传遍整个 5×5 迷宫。
          </div>
        </div>
      </div>
    </Stage>
  );
};
