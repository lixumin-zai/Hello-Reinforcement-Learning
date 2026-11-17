import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { CLAMP, MOTION_THEME, Stage, type MotionBeat } from '../../kit';

const BEATS: MotionBeat[] = [
  {
    id: 'raw-rewards',
    startFrame: 0,
    endFrame: 60,
    tag: 'Beat 1 · 未来奖励序列',
    caption: '从时刻 t 出发，智能体在未来各步依次收到原始奖励 R_{t+1}, R_{t+2}, R_{t+3}, …',
    formula: 'R_{t+1}, R_{t+2}, R_{t+3}, R_{t+4}, R_{t+5}',
  },
  {
    id: 'discount-weight',
    startFrame: 60,
    endFrame: 135,
    tag: 'Beat 2 · 乘以折扣权重 γ^k',
    caption: '离现在越远的奖励不确定性越高：第 t+k+1 步的奖励乘上衰减系数 γ^k（此处 γ = 0.8）。',
    formula: 'γ^k · R_{t+k+1}  (γ = 0.8)',
  },
  {
    id: 'accumulate',
    startFrame: 135,
    endFrame: 210,
    tag: 'Beat 3 · 累加汇聚为回报 G_t',
    caption: '将衰减后的各步奖励求和，并利用递归关系 G_t = R_{t+1} + γ G_{t+1} 紧凑表达。',
    formula: 'G_t = Σ_{k=0..∞} γ^k R_{t+k+1} = R_{t+1} + γ G_{t+1}',
  },
];

const STEPS = [
  { k: 0, label: 'R_{t+1}', raw: 10 },
  { k: 1, label: 'R_{t+2}', raw: 10 },
  { k: 2, label: 'R_{t+3}', raw: 10 },
  { k: 3, label: 'R_{t+4}', raw: 10 },
  { k: 4, label: 'R_{t+5}', raw: 10 },
];
const GAMMA = 0.8;

export const DiscountedReturnMotion: React.FC = () => {
  const frame = useCurrentFrame();

  const discountMix = interpolate(frame, [65, 125], [0, 1], CLAMP);
  const sumProgress = interpolate(frame, [140, 195], [0, 1], CLAMP);

  const items = STEPS.map((s) => {
    const weight = Math.pow(GAMMA, s.k);
    const currentFactor = 1 * (1 - discountMix) + weight * discountMix;
    const value = s.raw * currentFactor;
    return { ...s, weight, currentFactor, value };
  });

  const totalDiscounted = items.reduce((acc, it) => acc + sRawDiscount(it.raw, it.weight), 0);
  const currentAccum = items.reduce((acc, it, idx) => {
    const itemP = interpolate(sumProgress, [idx * 0.16, idx * 0.16 + 0.36], [0, 1], CLAMP);
    return acc + it.raw * it.weight * itemP;
  }, 0);

  return (
    <Stage
      title="折扣回报 G_t 的衰减与递归汇聚"
      chapterLabel="02 · 马尔可夫决策过程"
      accent={MOTION_THEME.reward}
      beats={BEATS}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 24, height: '100%' }}>
        {/* 左侧：5 根奖励柱的衰减过程 */}
        <div
          style={{
            borderRadius: 18,
            backgroundColor: MOTION_THEME.bgCard,
            border: `1px solid ${MOTION_THEME.border}`,
            padding: '24px 28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>未来各步奖励权重 (γ = {GAMMA})</span>
            <span style={{ fontSize: 13, color: MOTION_THEME.textMuted, fontFamily: MOTION_THEME.fontMono }}>
              有效视野 ≈ 1/(1-γ) = {(1 / (1 - GAMMA)).toFixed(1)} 步
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 18,
              alignItems: 'end',
              height: 310,
              padding: '20px 8px 8px',
              borderBottom: `1px solid ${MOTION_THEME.border}`,
            }}
          >
            {items.map((it, idx) => {
              const enter = interpolate(frame, [idx * 8, idx * 8 + 18], [0, 1], CLAMP);
              const fullH = 210;
              const barH = fullH * it.currentFactor * enter;
              return (
                <div
                  key={it.k}
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
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#fde68a',
                      marginBottom: 8,
                    }}
                  >
                    {it.value.toFixed(2)}
                  </div>
                  <div style={{ position: 'relative', width: 64, height: fullH, display: 'flex', alignItems: 'flex-end' }}>
                    {/* 原始高度虚线框 */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 12,
                        border: '1px dashed rgba(245, 158, 11, 0.35)',
                        opacity: discountMix,
                      }}
                    />
                    <div
                      style={{
                        width: '100%',
                        height: barH,
                        borderRadius: 12,
                        background: 'linear-gradient(180deg, #fbbf24 0%, #d97706 100%)',
                        boxShadow: '0 0 24px rgba(245, 158, 11, 0.25)',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      fontFamily: MOTION_THEME.fontMono,
                      fontSize: 13,
                      color: '#e2e8f0',
                      fontWeight: 600,
                    }}
                  >
                    γ^{it.k} · {it.label}
                  </div>
                  <div style={{ fontSize: 12, color: MOTION_THEME.textMuted, fontFamily: MOTION_THEME.fontMono }}>
                    权重 = {it.currentFactor.toFixed(3)}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: 13, color: MOTION_THEME.textMuted }}>
            虚线框代表未折扣时的原始奖励 R = 10；橙色实心柱代表乘以 γ^k 后的当前现值。
          </div>
        </div>

        {/* 右侧：累积回报能量槽 + 递归拆解 */}
        <div
          style={{
            borderRadius: 18,
            backgroundColor: MOTION_THEME.bgCard,
            border: `1px solid ${MOTION_THEME.border}`,
            padding: '24px 26px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>累积折扣回报 G_t</div>
            <div style={{ fontSize: 13, color: MOTION_THEME.textMuted, marginBottom: 20 }}>
              前 5 步折扣和（满额 {totalDiscounted.toFixed(2)}）
            </div>

            <div
              style={{
                fontSize: 44,
                fontWeight: 800,
                fontFamily: MOTION_THEME.fontMono,
                color: '#fbbf24',
                marginBottom: 14,
              }}
            >
              G_t = {currentAccum.toFixed(2)}
            </div>

            {/* 进度槽 */}
            <div
              style={{
                height: 22,
                borderRadius: 999,
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: `1px solid ${MOTION_THEME.border}`,
                overflow: 'hidden',
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  width: `${((currentAccum / totalDiscounted) * 100).toFixed(1)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #f59e0b, #fde047)',
                }}
              />
            </div>

            {/* 递归关系卡片 */}
            <div
              style={{
                padding: 16,
                borderRadius: 14,
                backgroundColor: 'rgba(15, 23, 42, 0.72)',
                border: `1px solid ${MOTION_THEME.border}`,
              }}
            >
              <div style={{ fontSize: 13, color: '#93c5fd', fontWeight: 700, marginBottom: 8 }}>
                🔑 核心递归恒等式（Bellman 方程的起点）
              </div>
              <div
                style={{
                  fontFamily: MOTION_THEME.fontMono,
                  fontSize: 15,
                  color: '#f8fafc',
                  lineHeight: 1.8,
                }}
              >
                <div>G_t = R_&#123;t+1&#125; + γ R_&#123;t+2&#125; + γ² R_&#123;t+3&#125; + …</div>
                <div style={{ color: '#fde68a' }}>
                  {'    '}= R_&#123;t+1&#125; + γ (R_&#123;t+2&#125; + γ R_&#123;t+3&#125; + …)
                </div>
                <div style={{ color: '#34d399', fontWeight: 700 }}>{'    '}= R_&#123;t+1&#125; + γ · G_&#123;t+1&#125;</div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 12, color: MOTION_THEME.textMuted, lineHeight: 1.6 }}>
            当 γ → 0 时智能体只看眼前一步（近视）；当 γ → 1 时智能体同等重视远期回报（远视）。
          </div>
        </div>
      </div>
    </Stage>
  );
};

function sRawDiscount(raw: number, w: number): number {
  return raw * w;
}
