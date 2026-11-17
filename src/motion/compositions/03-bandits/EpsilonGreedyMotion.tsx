import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { runBandit } from '@/lib/rl/bandit';
import { CLAMP, MOTION_THEME, Stage, type MotionBeat } from '../../kit';

const BEATS: MotionBeat[] = [
  {
    id: 'coin',
    startFrame: 0,
    endFrame: 60,
    tag: 'Beat 1 · 投掷 ε 硬币',
    caption: '每一步先投掷一枚偏置硬币：以 1-ε 概率贪心利用当前最高估计臂，以 ε 概率随机探索任意臂。',
    formula: 'P(探索) = ε = 0.2,  P(利用) = 1 - ε = 0.8',
  },
  {
    id: 'pull',
    startFrame: 60,
    endFrame: 150,
    tag: 'Beat 2 · 交替探索与利用',
    caption: '观察多步拉臂过程：橙色高亮代表随机探索 (Explore)，靛蓝高亮代表贪心利用 (Exploit)。',
    formula: 'A_t = argmax_a Q_t(a)  或  Uniform(1..k)',
  },
  {
    id: 'converge',
    startFrame: 150,
    endFrame: 210,
    tag: 'Beat 3 · 增量更新逼近真实均值',
    caption: '每次拉动后按 Q_{n+1} = Q_n + (R_n - Q_n)/n 更新均值，估计柱逐步逼近虚线所示的真实价值 q*(a)。',
    formula: 'Q_{n+1}(a) = Q_n(a) + (1/n)[R_n - Q_n(a)]',
  },
];

const ENV = {
  k: 5,
  means: [0.25, 0.55, 0.82, 0.4, 0.65],
  kind: 'bernoulli' as const,
};

// 预先确定性运行 30 步
const SIM = runBandit(ENV, { type: 'epsilon-greedy', epsilon: 0.25 }, 30, 19);

export const EpsilonGreedyMotion: React.FC = () => {
  const frame = useCurrentFrame();

  const stepIdx = Math.min(
    SIM.steps.length - 1,
    Math.floor(interpolate(frame, [10, 195], [0, SIM.steps.length - 1], CLAMP)),
  );
  const st = SIM.steps[stepIdx];

  return (
    <Stage
      title="ε-贪心策略：在探索 (Explore) 与利用 (Exploit) 之间摇摆"
      chapterLabel="03 · 多臂老虎机"
      accent={MOTION_THEME.agent}
      beats={BEATS}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 24, height: '100%' }}>
        {/* 左侧：5 臂估计值 vs 真实均值 */}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>5 臂伯努利老虎机：估计值 Q_t(a) vs 真实率 q*(a)</span>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                backgroundColor: st.explored ? 'rgba(245,158,11,0.2)' : 'rgba(99,102,241,0.2)',
                color: st.explored ? '#fbbf24' : '#a5b4fc',
                border: `1px solid ${st.explored ? '#f59e0b' : '#6366f1'}`,
              }}
            >
              t = {st.t + 1} · {st.explored ? '🎲 随机探索 (Explore)' : '🎯 贪心利用 (Exploit)'}
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 18,
              alignItems: 'end',
              height: 300,
              padding: '16px 8px 8px',
              borderBottom: `1px solid ${MOTION_THEME.border}`,
            }}
          >
            {ENV.means.map((trueM, i) => {
              const est = st.estimates[i];
              const chosen = st.action === i;
              const fullH = 220;
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
                      color: chosen ? '#fde68a' : '#cbd5e1',
                      marginBottom: 6,
                    }}
                  >
                    Q={est.toFixed(2)}
                  </div>
                  <div style={{ position: 'relative', width: 64, height: fullH, display: 'flex', alignItems: 'flex-end' }}>
                    {/* 真实均值水平参考线 */}
                    <div
                      style={{
                        position: 'absolute',
                        left: -6,
                        right: -6,
                        bottom: trueM * fullH,
                        borderTop: '2px dashed #2dd4bf',
                      }}
                    />
                    <div
                      style={{
                        width: '100%',
                        height: Math.max(6, est * fullH),
                        borderRadius: 10,
                        backgroundColor: chosen
                          ? st.explored
                            ? MOTION_THEME.reward
                            : MOTION_THEME.agent
                          : 'rgba(148, 163, 184, 0.35)',
                        border: chosen ? '2px solid #f8fafc' : '1px solid transparent',
                      }}
                    />
                  </div>
                  <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: chosen ? '#fff' : '#cbd5e1' }}>
                    臂 #{i + 1} {i === 2 ? '★' : ''}
                  </div>
                  <div style={{ fontSize: 11, color: MOTION_THEME.textMuted, fontFamily: MOTION_THEME.fontMono }}>
                    N={st.counts[i]} · q*={trueM}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: 12, color: MOTION_THEME.textMuted }}>
            青色虚线代表未知的真实获奖率 q*(a)（臂 #3 最优，q*=0.82）；实心柱代表当前样本均值估计 Q_t(a)。
          </div>
        </div>

        {/* 右侧：当前步决策分解 */}
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
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>单步决策账本</div>
            <div
              style={{
                padding: 16,
                borderRadius: 14,
                backgroundColor: 'rgba(15, 23, 42, 0.72)',
                border: `1px solid ${MOTION_THEME.border}`,
                fontFamily: MOTION_THEME.fontMono,
                fontSize: 13,
                lineHeight: 1.9,
              }}
            >
              <div>当前步号: t = {st.t + 1} / 30</div>
              <div>
                决策模式:{' '}
                <span style={{ color: st.explored ? '#fbbf24' : '#818cf8', fontWeight: 700 }}>
                  {st.explored ? '探索 (随机数 < ε)' : '利用 (argmax Q)'}
                </span>
              </div>
              <div>选中动作: A_t = 臂 #{st.action + 1}</div>
              <div>
                即时奖励:{' '}
                <span style={{ color: st.reward > 0 ? '#34d399' : '#f87171', fontWeight: 700 }}>
                  R_t = {st.reward}
                </span>
              </div>
              <div>拉动次数: N(a) = {st.counts[st.action]}</div>
              <div>更新后估计: Q(a) = {st.estimates[st.action].toFixed(3)}</div>
            </div>

            <div
              style={{
                marginTop: 16,
                padding: 16,
                borderRadius: 14,
                backgroundColor: 'rgba(20, 184, 166, 0.1)',
                border: '1px solid rgba(20, 184, 166, 0.35)',
              }}
            >
              <div style={{ fontSize: 12, color: '#5eead4', marginBottom: 4 }}>累积遗憾 (Cumulative Regret)</div>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: MOTION_THEME.fontMono, color: '#ccfbf1' }}>
                {SIM.regret[stepIdx].toFixed(2)}
              </div>
            </div>
          </div>

          <div style={{ fontSize: 12, color: MOTION_THEME.textMuted, lineHeight: 1.6 }}>
            纯贪心 (ε=0) 容易永久卡在次优臂；ε-greedy 保证了所有臂被无限次访问，但随机探索也会盲目拉动已知很差的臂。
          </div>
        </div>
      </div>
    </Stage>
  );
};
