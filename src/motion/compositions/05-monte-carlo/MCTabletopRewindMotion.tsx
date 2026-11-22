import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { CLAMP, MOTION_THEME, Stage, type MotionBeat } from '../../kit';

const BEATS: MotionBeat[] = [
  {
    id: 'deal-forward',
    startFrame: 0,
    endFrame: 95,
    tag: 'Beat 1 · 前向玩完一整局 21 点',
    caption: '蒙特卡洛方法不需要知道发牌概率表：先老老实实打完一整局，记录沿途经历的 (S_0, A_0), (S_1, A_1)！',
    formula: 'τ = (S_0=13, HIT) → (S_1=19, STICK) → R_T = +1',
  },
  {
    id: 'win-reveal',
    startFrame: 95,
    endFrame: 135,
    tag: 'Beat 2 · 终局开奖：庄家爆牌，赢得 +1 筹码！',
    caption: '回合落幕瞬间拿到终局回报 R_T = +1.0（之前所有中间步的即时奖励都是 0）。',
    formula: 'G_T = 0,   R_T = +1.0',
  },
  {
    id: 'rewind-backprop',
    startFrame: 135,
    endFrame: 225,
    tag: 'Beat 3 · ⏪ 时间倒带 (Rewind)：反向累加 G_t 更新均值',
    caption: '从 t = T-1 倒序回溯至 t = 0，只需 O(T) 一次扫描就能把回报 G_t 精准写入本局走过的每一个状态！',
    formula: 'G ← R_{t+1} + γ G;   V(S_t) ← V(S_t) + (1/N)[G - V(S_t)]',
  },
];

const HAND_STEPS = [
  { t: 0, state: '点 13 · 庄明 6', action: 'HIT 要牌', card: '6♠', vBefore: '0.12', vAfter: '0.26' },
  { t: 1, state: '点 19 · 庄明 6', action: 'STICK 停牌', card: '10♥', vBefore: '0.54', vAfter: '0.62' },
  { t: 2, state: '庄家爆牌 (23点)', action: '终局结算', card: '★ +1', vBefore: '—', vAfter: '+1.00' },
];

export const MCTabletopRewindMotion: React.FC = () => {
  const frame = useCurrentFrame();
  const isRewind = frame >= 135;
  const rewindCursor = interpolate(frame, [140, 210], [2, 0], CLAMP);

  return (
    <Stage
      title="蒙特卡洛预测：21 点绿绒牌桌正向采样 × 终局时间倒带"
      chapterLabel="Ch 05 · 蒙特卡洛方法"
      world="tabletop"
      beats={BEATS}
    >
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', padding: '10px 36px' }}>
        {/* 顶部播放状态灯 */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span
            style={{
              padding: '8px 24px',
              borderRadius: 999,
              fontFamily: MOTION_THEME.fontMono,
              fontSize: 16,
              fontWeight: 800,
              backgroundColor: isRewind ? 'rgba(234,179,8,0.22)' : 'rgba(52,211,153,0.18)',
              border: `2px solid ${isRewind ? '#eab308' : '#34d399'}`,
              color: isRewind ? '#fef08a' : '#a7f3d0',
            }}
          >
            {isRewind ? '⏪ REWIND 反向回溯 G_t 中（t = T-1 → 0）' : '▶ FORWARD 正向打牌采样中（t = 0 → T）'}
          </span>
        </div>

        {/* 三张牌桌状态节点 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 36, alignItems: 'center' }}>
          {HAND_STEPS.map((st, idx) => {
            const dealt = interpolate(frame, [12 + idx * 36, 32 + idx * 36], [0, 1], CLAMP);
            const updated = isRewind && rewindCursor <= idx + 0.15;
            return (
              <div
                key={st.t}
                style={{
                  opacity: dealt,
                  transform: `translateY(${(1 - dealt) * 24}px) scale(${updated ? 1.05 : 1})`,
                  borderRadius: 20,
                  padding: '22px 20px',
                  backgroundColor: updated ? 'rgba(234, 179, 8, 0.2)' : 'rgba(5, 36, 26, 0.88)',
                  border: `3px solid ${updated ? '#eab308' : 'rgba(217,179,98,0.4)'}`,
                  textAlign: 'center',
                  boxShadow: updated ? '0 0 32px rgba(234,179,8,0.35)' : '0 10px 24px rgba(0,0,0,0.4)',
                }}
              >
                {/* 象牙扑克牌图形 */}
                <div
                  style={{
                    width: 82,
                    height: 108,
                    margin: '0 auto 14px',
                    borderRadius: 12,
                    backgroundColor: '#fefce8',
                    color: st.card.includes('♥') ? '#dc2626' : '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 28,
                    fontWeight: 900,
                    fontFamily: MOTION_THEME.fontMono,
                    boxShadow: '0 6px 14px rgba(0,0,0,0.4)',
                  }}
                >
                  {st.card}
                </div>

                <div style={{ fontSize: 13, fontFamily: MOTION_THEME.fontMono, color: '#a7f3d0' }}>Step t = {st.t}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fefce8', marginTop: 4 }}>{st.state}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fde047', marginTop: 4 }}>{st.action}</div>

                <div
                  style={{
                    marginTop: 14,
                    padding: '8px 10px',
                    borderRadius: 10,
                    backgroundColor: 'rgba(0,0,0,0.38)',
                    fontFamily: MOTION_THEME.fontMono,
                    fontSize: 13,
                    color: updated ? '#fef08a' : '#6ee7b7',
                    fontWeight: 700,
                  }}
                >
                  {updated ? `更新后 V = ${st.vAfter} (融入 G=+1)` : `旧估计 V = ${st.vBefore}`}
                </div>
              </div>
            );
          })}
        </div>

        {/* 底部线性复杂度说明 */}
        <div style={{ textAlign: 'center', fontSize: 14, color: '#a7f3d0', fontFamily: MOTION_THEME.fontMono }}>
          优势：完全无偏 (Unbiased) 且无需环境模型 p；代价：必须等整局打完才能更新，且完整轨迹方差偏高！
        </div>
      </div>
    </Stage>
  );
};
