import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { runBandit } from '@/lib/rl/bandit';
import { CLAMP, MOTION_THEME, Stage, type MotionBeat } from '../../kit';

const BEATS: MotionBeat[] = [
  {
    id: 'optimism',
    startFrame: 0,
    endFrame: 65,
    tag: 'Beat 1 · 面对不确定性保持乐观',
    caption: 'UCB 给每个臂的均值估计 Q_t(a) 加上一项“不确定性奖励” c·√(ln t / N_t(a))，构成置信上界。',
    formula: 'UCB(a) = Q_t(a) + c · √(ln t / N_t(a))',
  },
  {
    id: 'shrink',
    startFrame: 65,
    endFrame: 150,
    tag: 'Beat 2 · 被拉动越少，上界加成越高',
    caption: '当某个臂被拉动后，分母 N_t(a) 增大，它的紫色不确定性区间迅速收缩，促使智能体去试其他不确定臂。',
    formula: 'N_t(a) ↑  ⇒  √(ln t / N_t(a)) ↓',
  },
  {
    id: 'lock',
    startFrame: 150,
    endFrame: 210,
    tag: 'Beat 3 · 自动聚焦最优臂',
    caption: '随着劣质臂的上界纷纷低于最优臂 #3 的均值，UCB 无需随机掷骰，自然把算力集中到最优臂上。',
    formula: 'A_t = argmax_a [ Q_t(a) + c √(ln t / N_t(a)) ]',
  },
];

const ENV = {
  k: 4,
  means: [0.35, 0.55, 0.85, 0.45],
  kind: 'bernoulli' as const,
};
const C = 0.8;
const SIM = runBandit(ENV, { type: 'ucb', c: C }, 28, 11);

export const UCBConfidenceMotion: React.FC = () => {
  const frame = useCurrentFrame();
  // 从第 4 步（所有臂都至少试过 1 次）开始展示
  const idx = Math.min(
    SIM.steps.length - 1,
    Math.floor(interpolate(frame, [0, 195], [4, SIM.steps.length - 1], CLAMP)),
  );
  const st = SIM.steps[idx];
  const t = st.t + 1;

  return (
    <Stage
      title="UCB 置信上界：用不确定性引导探索"
      chapterLabel="03 · 多臂老虎机"
      accent={MOTION_THEME.value}
      beats={BEATS}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24, height: '100%' }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>均值 Q_t(a)（蓝） + 置信加成 Bonus（紫）</span>
            <span style={{ fontSize: 13, fontFamily: MOTION_THEME.fontMono, color: '#e9d5ff' }}>
              t = {t} · 选中上界最高：臂 #{st.action + 1}
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 24,
              alignItems: 'end',
              height: 300,
              padding: '16px 14px 8px',
              borderBottom: `1px solid ${MOTION_THEME.border}`,
            }}
          >
            {ENV.means.map((m, i) => {
              const q = st.estimates[i];
              const n = Math.max(1, st.counts[i]);
              const bonus = C * Math.sqrt(Math.log(t) / n);
              const ucb = q + bonus;
              const chosen = st.action === i;
              const scale = 150;
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    height: '100%',
                  }}
                >
                  <div
                    style={{
                      fontFamily: MOTION_THEME.fontMono,
                      fontSize: 12,
                      fontWeight: 700,
                      color: chosen ? '#f0abfc' : '#cbd5e1',
                      marginBottom: 6,
                    }}
                  >
                    UCB={ucb.toFixed(2)}
                  </div>
                  <div
                    style={{
                      width: 76,
                      display: 'flex',
                      flexDirection: 'column',
                       justifyContent: 'flex-end',
                      borderRadius: 12,
                      overflow: 'hidden',
                      border: chosen ? '2px solid #f0abfc' : `1px solid ${MOTION_THEME.border}`,
                    }}
                  >
                    {/* 上半截：不确定性 Bonus */}
                    <div
                      style={{
                        height: Math.min(130, bonus * scale),
                        background: 'linear-gradient(180deg, rgba(168,85,247,0.85), rgba(168,85,247,0.4))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontFamily: MOTION_THEME.fontMono,
                        color: '#faf5ff',
                      }}
                    >
                      +{bonus.toFixed(2)}
                    </div>
                    {/* 下半截：经验均值 Q */}
                    <div
                      style={{
                        height: Math.max(12, q * scale),
                        backgroundColor: MOTION_THEME.agent,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontFamily: MOTION_THEME.fontMono,
                        color: '#e0e7ff',
                      }}
                    >
                      {q.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ marginTop: 10, fontSize: 14, fontWeight: 700 }}>
                    臂 #{i + 1} {i === 2 ? '★' : ''}
                  </div>
                  <div style={{ fontSize: 12, color: MOTION_THEME.textMuted, fontFamily: MOTION_THEME.fontMono }}>
                    N={n} · q*={m}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: 12, color: MOTION_THEME.textMuted }}>
            蓝色底座 = 当前经验均值 Q_t(a)；紫色顶冠 = 不确定性奖励 c√(ln t / N_t(a))；总高度即 UCB 分数。
          </div>
        </div>

        {/* 右侧公式说明 */}
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
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>为什么 UCB 比 ε-greedy 更聪明？</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, lineHeight: 1.65 }}>
              <div
                style={{
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor: 'rgba(99, 102, 241, 0.14)',
                  border: '1px solid rgba(99, 102, 241, 0.35)',
                }}
              >
                <strong style={{ color: '#a5b4fc' }}>① 利用项 Q_t(a)</strong>
                <div style={{ color: '#cbd5e1', marginTop: 4 }}>偏好历史平均回报高的臂。</div>
              </div>
              <div
                style={{
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor: 'rgba(168, 85, 247, 0.14)',
                  border: '1px solid rgba(168, 85, 247, 0.35)',
                }}
              >
                <strong style={{ color: '#e9d5ff' }}>② 探索项 c · √(ln t / N_t(a))</strong>
                <div style={{ color: '#cbd5e1', marginTop: 4 }}>
                  来自 Hoeffding 不等式：N_t(a) 越小，均值估计的置信区间越宽，越值得去核实。
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: 14,
              borderRadius: 12,
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              border: `1px solid ${MOTION_THEME.border}`,
              fontFamily: MOTION_THEME.fontMono,
              fontSize: 12,
              color: '#fde68a',
            }}
          >
            定理：UCB1 的期望累积遗憾满足 O(log T) 对数上界，远优于常数 ε-greedy 的 O(T) 线性遗憾。
          </div>
        </div>
      </div>
    </Stage>
  );
};
