import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { CLAMP, MOTION_THEME, Stage, type MotionBeat } from '../../kit';

const BEATS: MotionBeat[] = [
  {
    id: 'coin-toss',
    startFrame: 0,
    endFrame: 70,
    tag: 'Beat 1 · 偏置硬币分流器',
    caption: '每一步开始先掷一次 ε 硬币：小概率 ε 进入上方「随机探索通道」，大概率 1-ε 进入下方「贪心利用高速」。',
    formula: 'P(Explore) = ε,   P(Exploit) = 1 - ε',
  },
  {
    id: 'two-lanes',
    startFrame: 70,
    endFrame: 150,
    tag: 'Beat 2 · 双通道并行保障全局覆盖',
    caption: '只要 ε > 0，每一台机台在无穷步中都会被无限次试探，彻底杜绝纯贪心的永久锁死。',
    formula: 'lim_{t→∞} N_t(a) = ∞  ⇒  Q_t(a) → q*(a)',
  },
  {
    id: 'recency',
    startFrame: 150,
    endFrame: 240,
    tag: 'Beat 3 · 非平稳世界：常数步长 α 指数遗忘',
    caption: '当赌场赔率随时间漂移时，用常数 α 替代 1/n，让近期观测权重最大、远古记忆按 (1-α)^k 指数衰减！',
    formula: 'Q_{n+1} = (1-α)^n Q₁ + Σ α(1-α)^{n-i} R_i',
  },
];

const ALPHA = 0.35;
const HISTORY = [0, 1, 2, 3, 4, 5]; // 0=最新, 5=最久远

export const EpsilonCoinSplitMotion: React.FC = () => {
  const frame = useCurrentFrame();

  const coinSpin = Math.cos(frame * 0.25);
  const packet = (frame % 48) / 48;
  const isExplorePacket = Math.floor(frame / 48) % 3 === 1;
  const decayReveal = interpolate(frame, [150, 215], [0, 1], CLAMP);

  return (
    <Stage
      title="ε-贪心双通道分流 × 非平稳指数遗忘记忆"
      chapterLabel="Ch 02 · 多臂老虎机"
      world="arcade"
      beats={BEATS}
    >
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* 上半区：偏置硬币分流电路 */}
        <div
          style={{
            flex: 1.15,
            borderRadius: 18,
            backgroundColor: 'rgba(26, 12, 40, 0.85)',
            border: '1px solid rgba(251, 191, 36, 0.35)',
            padding: '10px 20px',
          }}
        >
          <svg viewBox="0 0 1160 250" style={{ width: '100%', height: '100%' }}>
            {/* 左侧旋转 ε 硬币 */}
            <g transform="translate(150, 125)">
              <ellipse
                rx={Math.max(12, Math.abs(coinSpin) * 56)}
                ry={56}
                fill={isExplorePacket ? '#f59e0b' : '#6366f1'}
                stroke="#fef3c7"
                strokeWidth={4}
              />
              <text x={0} y={7} textAnchor="middle" fill="#fff" fontSize={22} fontWeight={800}>
                {isExplorePacket ? 'ε' : '1-ε'}
              </text>
              <text x={0} y={84} textAnchor="middle" fill="#fde68a" fontSize={13} fontWeight={700}>
                随机分流器 u ~ U(0,1)
              </text>
            </g>

            {/* 上方分叉：探索通道 */}
            <path d="M 215 110 C 350 45, 520 45, 760 65" fill="none" stroke="#f59e0b" strokeWidth={4} strokeDasharray="8 6" />
            <rect x={760} y={24} width={350} height={80} rx={16} fill="rgba(245,158,11,0.16)" stroke="#fbbf24" strokeWidth={2.5} />
            <text x={935} y={56} textAnchor="middle" fill="#fde68a" fontSize={17} fontWeight={800}>
              🎲 随机探索通道 (概率 ε)
            </text>
            <text x={935} y={82} textAnchor="middle" fill="#fed7aa" fontSize={13}>
              等概率探索任意机台，发现隐藏黄金臂
            </text>

            {/* 下方分叉：利用通道 */}
            <path d="M 215 140 C 350 205, 520 205, 760 185" fill="none" stroke="#818cf8" strokeWidth={6} />
            <rect x={760} y={144} width={350} height={80} rx={16} fill="rgba(99,102,241,0.18)" stroke="#818cf8" strokeWidth={2.5} />
            <text x={935} y={176} textAnchor="middle" fill="#e0e7ff" fontSize={17} fontWeight={800}>
              🎯 贪心利用通道 (概率 1 - ε)
            </text>
            <text x={935} y={202} textAnchor="middle" fill="#c7d2fe" fontSize={13}>
              果断押注当前 argmax Q̂(a)，收割筹码
            </text>

            {/* 移动决策球 */}
            <circle
              cx={interpolate(packet, [0, 1], [215, 755], CLAMP)}
              cy={
                isExplorePacket
                  ? interpolate(packet, [0, 0.5, 1], [110, 52, 65], CLAMP)
                  : interpolate(packet, [0, 0.5, 1], [140, 198, 185], CLAMP)
              }
              r={11}
              fill={isExplorePacket ? '#fbbf24' : '#a5b4fc'}
              stroke="#fff"
              strokeWidth={2}
            />
          </svg>
        </div>

        {/* 下半区：常数步长 α 的指数遗忘波纹 vs 样本平均 1/n */}
        <div
          style={{
            flex: 1,
            borderRadius: 18,
            backgroundColor: 'rgba(26, 12, 40, 0.85)',
            border: '1px solid rgba(244, 114, 182, 0.35)',
            padding: '16px 26px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#fef3c7' }}>
              🌊 非平稳环境追踪：为什么常数步长 α = {ALPHA} 能快速忘掉“过期赔率”？
            </span>
            <span style={{ fontSize: 12, fontFamily: MOTION_THEME.fontMono, color: '#f9a8d4' }}>
              权重 w_k = α · (1 - α)^k （越靠近现在权重越高）
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 18, alignItems: 'end', height: 135 }}>
            {HISTORY.slice()
              .reverse()
              .map((age) => {
                const w = ALPHA * Math.pow(1 - ALPHA, age);
                const uniformW = 1 / 6;
                const barH = Math.max(12, w * 260 * decayReveal);
                return (
                  <div key={age} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'end', height: '100%' }}>
                    <div style={{ fontSize: 12, fontFamily: MOTION_THEME.fontMono, color: '#fde68a', fontWeight: 700, marginBottom: 4 }}>
                      {(w * 100).toFixed(1)}%
                    </div>
                    <div style={{ position: 'relative', width: 76, height: 96, display: 'flex', alignItems: 'flex-end' }}>
                      {/* 样本平均 1/n 的平坦虚线 */}
                      <div
                        style={{
                          position: 'absolute',
                          left: -4,
                          right: -4,
                          bottom: uniformW * 260,
                          borderTop: '2px dashed #94a3b8',
                        }}
                      />
                      <div
                        style={{
                          width: '100%',
                          height: barH,
                          borderRadius: 10,
                          background: 'linear-gradient(180deg, #f472b6 0%, #9333ea 100%)',
                        }}
                      />
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12, fontFamily: MOTION_THEME.fontMono, color: '#e9d5ff' }}>
                      {age === 0 ? '最新 R_t' : `${age} 步前`}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </Stage>
  );
};
