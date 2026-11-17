import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { CLAMP, MOTION_THEME, Stage, type MotionBeat } from '../../kit';

const BEATS: MotionBeat[] = [
  {
    id: 'before',
    startFrame: 0,
    endFrame: 55,
    tag: 'Beat 1 · 转移前估计 V(S_t)',
    caption: '在状态 S_t 时，智能体对当前状态价值的旧估计为 V(S_t) = 4.0。',
    formula: '旧估计 V(S_t) = 4.0',
  },
  {
    id: 'bootstrap',
    startFrame: 55,
    endFrame: 120,
    tag: 'Beat 2 · 迈出一步，构造自举目标 (TD Target)',
    caption: '执行动作到达 S_{t+1}，收到即时奖励 R_{t+1}=2.0，并用下一状态估计 γV(S_{t+1})=5.4 拼出 TD 目标 7.4。',
    formula: 'TD Target = R_{t+1} + γ V(S_{t+1}) = 2.0 + 0.9×6.0 = 7.4',
  },
  {
    id: 'spring-pull',
    startFrame: 120,
    endFrame: 210,
    tag: 'Beat 3 · TD 误差 δ_t 牵引 V(S_t) 更新',
    caption: 'TD 目标与旧估计之差 δ_t = +3.4 像一根弹簧，按步长 α = 0.5 将 V(S_t) 向上拉升至 5.7。',
    formula: 'V(S_t) ← V(S_t) + α · δ_t = 4.0 + 0.5 × 3.4 = 5.7',
  },
];

export const TDErrorMotion: React.FC = () => {
  const frame = useCurrentFrame();

  const showTarget = interpolate(frame, [58, 95], [0, 1], CLAMP);
  const pullProgress = interpolate(frame, [130, 185], [0, 1], CLAMP);

  const vOld = 4.0;
  const target = 7.4;
  const alpha = 0.5;
  const vCurrent = vOld + alpha * (target - vOld) * pullProgress;

  const scale = 28; // 1 单位价值 = 28px

  return (
    <Stage
      title="TD(0) 自举与时序差分误差 δ_t：用估计更新估计"
      chapterLabel="06 · 时序差分学习"
      accent={MOTION_THEME.danger}
      beats={BEATS}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, height: '100%' }}>
        <div
          style={{
            borderRadius: 18,
            backgroundColor: MOTION_THEME.bgCard,
            border: `1px solid ${MOTION_THEME.border}`,
            padding: '24px 32px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700 }}>状态价值标尺（1 格 = 1.0）</div>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-around',
              height: 300,
              borderBottom: `1px solid ${MOTION_THEME.border}`,
              paddingBottom: 10,
            }}
          >
            {/* 柱 1：当前 V(S_t) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontFamily: MOTION_THEME.fontMono, fontSize: 15, fontWeight: 800, color: '#a5b4fc', marginBottom: 8 }}>
                V(S_t) = {vCurrent.toFixed(2)}
              </div>
              <div
                style={{
                  width: 96,
                  height: vCurrent * scale,
                  borderRadius: 12,
                  background: 'linear-gradient(180deg, #818cf8, #4f46e5)',
                  border: '2px solid #c7d2fe',
                }}
              />
              <div style={{ marginTop: 10, fontSize: 14, fontWeight: 700 }}>当前估计 V(S_t)</div>
            </div>

            {/* 中间：TD 误差 δ_t 弹簧指示 */}
            <div
              style={{
                opacity: showTarget,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginBottom: 90,
              }}
            >
              <div
                style={{
                  padding: '8px 14px',
                  borderRadius: 999,
                  backgroundColor: 'rgba(244, 63, 94, 0.18)',
                  border: '1px solid #fb7185',
                  color: '#fda4af',
                  fontFamily: MOTION_THEME.fontMono,
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                δ_t = +3.40
              </div>
              <div style={{ fontSize: 12, color: MOTION_THEME.textMuted, marginTop: 6 }}>
                步长 α = 0.5 ⇒ ΔV = +1.70
              </div>
            </div>

            {/* 柱 2：TD 目标 R_{t+1} + γV(S_{t+1}) */}
            <div style={{ opacity: showTarget, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontFamily: MOTION_THEME.fontMono, fontSize: 15, fontWeight: 800, color: '#fde68a', marginBottom: 8 }}>
                TD Target = 7.40
              </div>
              <div
                style={{
                  width: 96,
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: '2px solid #fde047',
                }}
              >
                <div
                  style={{
                    height: 5.4 * scale,
                    backgroundColor: MOTION_THEME.env,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontFamily: MOTION_THEME.fontMono,
                    fontWeight: 700,
                    color: '#042f2e',
                  }}
                >
                  γV(S&#39;)=5.4
                </div>
                <div
                  style={{
                    height: 2.0 * scale,
                    backgroundColor: MOTION_THEME.reward,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontFamily: MOTION_THEME.fontMono,
                    fontWeight: 700,
                    color: '#451a03',
                  }}
                >
                  R=2.0
                </div>
              </div>
              <div style={{ marginTop: 10, fontSize: 14, fontWeight: 700 }}>自举目标 R + γV(S′)</div>
            </div>
          </div>

          <div style={{ fontSize: 12, color: MOTION_THEME.textMuted }}>
            无需像蒙特卡洛那样等回合结束，TD 在迈出一步后就用 R_&#123;t+1&#125; + γV(S_&#123;t+1&#125;) 充当“临时真值”。
          </div>
        </div>

        {/* 右侧对比 */}
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
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>MC vs TD vs DP 三剑客对照</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
              <div style={{ padding: 12, borderRadius: 12, backgroundColor: 'rgba(15,23,42,0.72)', border: `1px solid ${MOTION_THEME.border}` }}>
                <strong style={{ color: '#fbbf24' }}>蒙特卡洛 (MC)：采样 + 不自举</strong>
                <div style={{ fontFamily: MOTION_THEME.fontMono, marginTop: 4, color: '#cbd5e1' }}>
                  目标 = 完整回报 G_t（高方差、零偏差）
                </div>
              </div>
              <div style={{ padding: 12, borderRadius: 12, backgroundColor: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.4)' }}>
                <strong style={{ color: '#fda4af' }}>时序差分 (TD)：采样 + 自举</strong>
                <div style={{ fontFamily: MOTION_THEME.fontMono, marginTop: 4, color: '#ffe4e6' }}>
                  目标 = R_&#123;t+1&#125; + γV(S_&#123;t+1&#125;)（低方差、在线每步更新）
                </div>
              </div>
              <div style={{ padding: 12, borderRadius: 12, backgroundColor: 'rgba(15,23,42,0.72)', border: `1px solid ${MOTION_THEME.border}` }}>
                <strong style={{ color: '#5eead4' }}>动态规划 (DP)：全期望 + 自举</strong>
                <div style={{ fontFamily: MOTION_THEME.fontMono, marginTop: 4, color: '#cbd5e1' }}>
                  目标 = E_π[R_&#123;t+1&#125; + γV(S_&#123;t+1&#125;)]（需要已知转移模型 p）
                </div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 12, color: MOTION_THEME.textMuted }}>
            神经科学发现：大脑多巴胺神经元的放电信号与 TD 误差 δ_t 的数学曲线高度吻合。
          </div>
        </div>
      </div>
    </Stage>
  );
};
