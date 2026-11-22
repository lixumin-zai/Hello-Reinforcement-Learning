import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { CLAMP, MOTION_THEME, Stage, type MotionBeat } from '../../kit';

const BEATS: MotionBeat[] = [
  {
    id: 'prompt-state',
    startFrame: 0,
    endFrame: 55,
    tag: 'Step 1 · Prompt 即初始状态 s_0',
    caption: '大模型面对用户提示词 x，把当前全部上下文前缀当作 MDP 状态 s_0，准备在超大词表 |V| ≈ 10⁵ 中决策！',
    formula: 's_0 = x,   Action Space A = V (|V| ≈ 128,256)',
  },
  {
    id: 'token-sample',
    startFrame: 55,
    endFrame: 155,
    tag: 'Step 2 · 自回归采样 Token 与确定性转移',
    caption: '每步从策略 π_θ(a_t | s_t) 采样下一个 Token 并直接拼接为新状态 s_{t+1} = s_t ⊕ a_t，同时计算单步 KL 惩罚！',
    formula: 'a_t ~ π_θ(·|s_t),   r_t^{KL} = -β log(π_θ / π_ref)',
  },
  {
    id: 'sparse-eos',
    startFrame: 155,
    endFrame: 225,
    tag: 'Step 3 · 极度稀疏的终局奖励 R_T',
    caption: '中间所有思考 Token 的外部奖励全是 0；直到模型吐出 <EOS>，奖励模型或验证器才一次性给出终局分数 R_T = +1.0！',
    formula: 'R_t = 0 (t < T),   R_T = Verifier(x, y) = +1.0',
  },
  {
    id: 'credit-back',
    startFrame: 225,
    endFrame: 270,
    tag: 'Step 4 · 信用分配与 KL 锚定',
    caption: '正是这枚迟到的终局奖励，配合每步防止语言胡言乱语的 KL 锚点，驱动 LLM 学会更严谨的推理链！',
    formula: 'max E[ R(x,y) - β · D_KL(π_θ || π_ref) ]',
  },
];

const TOKENS = [
  { text: '<think>', pT: 0.82, pR: 0.16, kl: 1.63 },
  { text: '先算乘:', pT: 0.74, pR: 0.42, kl: 0.57 },
  { text: '8×3=24', pT: 0.94, pR: 0.85, kl: 0.10 },
  { text: '+17=41', pT: 0.91, pR: 0.76, kl: 0.18 },
  { text: '</think>', pT: 0.88, pR: 0.20, kl: 1.48 },
  { text: '41<EOS>', pT: 0.96, pR: 0.72, kl: 0.29 },
];

const VOCAB_BARS: { token: string; p: number; ref: number }[][] = [
  [
    { token: '<think>', p: 0.82, ref: 0.16 },
    { token: '答案', p: 0.08, ref: 0.48 },
    { token: '17+8', p: 0.05, ref: 0.22 },
    { token: '先算', p: 0.03, ref: 0.09 },
    { token: '75', p: 0.02, ref: 0.05 },
  ],
  [
    { token: '先算乘:', p: 0.74, ref: 0.42 },
    { token: '从左到右', p: 0.14, ref: 0.34 },
    { token: '优先级', p: 0.07, ref: 0.14 },
    { token: '25×3', p: 0.03, ref: 0.07 },
    { token: '嗯', p: 0.02, ref: 0.03 },
  ],
  [
    { token: '8×3=24', p: 0.94, ref: 0.85 },
    { token: '8×3=21', p: 0.03, ref: 0.08 },
    { token: '8×3=27', p: 0.015, ref: 0.04 },
    { token: '24', p: 0.01, ref: 0.02 },
    { token: '约24', p: 0.005, ref: 0.01 },
  ],
  [
    { token: '+17=41', p: 0.91, ref: 0.76 },
    { token: '+17=31', p: 0.04, ref: 0.11 },
    { token: '+17=43', p: 0.03, ref: 0.08 },
    { token: '等于41', p: 0.015, ref: 0.03 },
    { token: '41', p: 0.005, ref: 0.02 },
  ],
  [
    { token: '</think>', p: 0.88, ref: 0.20 },
    { token: '复核:', p: 0.07, ref: 0.14 },
    { token: '。', p: 0.03, ref: 0.50 },
    { token: '所以', p: 0.015, ref: 0.11 },
    { token: '<EOS>', p: 0.005, ref: 0.05 },
  ],
  [
    { token: '41<EOS>', p: 0.96, ref: 0.72 },
    { token: '75<EOS>', p: 0.02, ref: 0.14 },
    { token: '答案41', p: 0.01, ref: 0.08 },
    { token: '约41', p: 0.005, ref: 0.04 },
    { token: '不确定', p: 0.005, ref: 0.02 },
  ],
];

export const LLMTokenStreamMotion: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 每 22 帧吐出一个 Token（从第 52 帧开始）
  const emittedCount = Math.min(
    TOKENS.length,
    Math.max(0, Math.floor((frame - 48) / 22) + (frame >= 48 ? 1 : 0))
  );
  const activeIdx = Math.min(TOKENS.length - 1, Math.max(0, emittedCount - 1));
  const bars = VOCAB_BARS[activeIdx];

  const eosPulse = spring({ frame: Math.max(0, frame - 165), fps, config: { damping: 12, stiffness: 120 } });
  const backWave = interpolate(frame, [225, 265], [0, 1], CLAMP);

  const cumKL = TOKENS.slice(0, emittedCount).reduce((s, t) => s + t.kl, 0);
  const klGaugeAngle = interpolate(Math.min(6, cumKL), [0, 6], [-120, 60], CLAMP);

  return (
    <Stage
      title="把语言模型写成 Token 级 MDP：词表动作流与稀疏终局奖励"
      chapterLabel="Ch 10 · 大模型强化学习"
      world="terminal"
      beats={BEATS}
    >
      <svg viewBox="0 0 1200 470" style={{ width: '100%', height: '100%' }}>
        {/* 顶部 AI 终端窗口框 */}
        <rect x={44} y={24} width={720} height={240} rx={16} fill="rgba(13,17,23,0.92)" stroke="rgba(52,211,153,0.38)" strokeWidth={2} />
        <circle cx={68} cy={46} r={6} fill="#fb7185" />
        <circle cx={88} cy={46} r={6} fill="#facc15" />
        <circle cx={108} cy={46} r={6} fill="#34d399" />
        <text x={130} y={51} fill="#8b949e" fontSize={13} fontFamily={MOTION_THEME.fontMono}>
          llm-policy-mdp://autoregressive-rollout   (β = 0.05)
        </text>
        <line x1={44} y1={66} x2={764} y2={66} stroke="rgba(52,211,153,0.18)" />

        {/* Prompt 状态节点 s_0 */}
        <rect x={64} y={84} width={310} height={42} rx={10} fill="rgba(99,102,241,0.22)" stroke="#818cf8" strokeWidth={2} />
        <text x={80} y={110} fill="#e0e7ff" fontSize={16} fontWeight={700} fontFamily={MOTION_THEME.fontMono}>
          s_0 [Prompt]: 17 + 8 × 3 = ?
        </text>

        {/* Token 喷射流 */}
        {TOKENS.map((tok, i) => {
          const shown = i < emittedCount;
          const appearFrame = 48 + i * 22;
          const pop = spring({ frame: Math.max(0, frame - appearFrame), fps, config: { damping: 14, stiffness: 150 } });
          const col = i % 3;
          const row = Math.floor(i / 3);
          const x = 64 + col * 224;
          const y = 144 + row * 56;
          const isEos = i === TOKENS.length - 1;
          const highlight = i === activeIdx && frame < 225;

          return (
            <g key={tok.text} opacity={shown ? pop : 0.14}>
              <rect
                x={x}
                y={y}
                width={206}
                height={44}
                rx={10}
                fill={
                  isEos && shown
                    ? 'rgba(16,185,129,0.28)'
                    : highlight
                      ? 'rgba(52,211,153,0.2)'
                      : 'rgba(30,41,59,0.85)'
                }
                stroke={isEos && shown ? '#34d399' : highlight ? '#34d399' : '#334155'}
                strokeWidth={highlight || (isEos && shown) ? 2.5 : 1.5}
              />
              <text x={x + 12} y={y + 18} fill="#94a3b8" fontSize={11} fontFamily={MOTION_THEME.fontMono}>
                a_{i} | KL={tok.kl.toFixed(2)}
              </text>
              <text x={x + 12} y={y + 36} fill={isEos ? '#6ee7b7' : '#f8fafc'} fontSize={15} fontWeight={800} fontFamily={MOTION_THEME.fontMono}>
                {tok.text}
              </text>
              {shown && (
                <text
                  x={x + 196}
                  y={y + 34}
                  textAnchor="end"
                  fill={isEos ? '#fde047' : '#64748b'}
                  fontSize={12}
                  fontWeight={700}
                  fontFamily={MOTION_THEME.fontMono}
                >
                  {isEos ? 'R=+1' : 'R=0'}
                </text>
              )}
            </g>
          );
        })}

        {/* 信用回传光波 (Beat 4) */}
        {backWave > 0 && (
          <g opacity={backWave}>
            <rect
              x={64 + (1 - backWave) * 580}
              y={140}
              width={60}
              height={110}
              rx={12}
              fill="rgba(250,204,21,0.18)"
              stroke="#facc15"
              strokeWidth={2}
            />
          </g>
        )}

        {/* 右上：词表 Top-5 动作概率直方图 */}
        <rect x={792} y={24} width={364} height={240} rx={16} fill="rgba(13,17,23,0.92)" stroke="rgba(167,139,250,0.4)" strokeWidth={2} />
        <text x={814} y={54} fill="#e6edf3" fontSize={15} fontWeight={800} fontFamily={MOTION_THEME.fontMono}>
          词表 Top-5 动作分布 (t = {activeIdx})
        </text>
        <text x={814} y={74} fill="#94a3b8" fontSize={11.5} fontFamily={MOTION_THEME.fontMono}>
          ■ π_θ (绿)   □ π_ref 参考策略 (灰框)
        </text>

        {bars.map((b, idx) => {
          const y = 92 + idx * 33;
          const barW = b.p * 200;
          const refW = b.ref * 200;
          return (
            <g key={b.token}>
              <text x={814} y={y + 15} fill={idx === 0 ? '#34d399' : '#cbd5e1'} fontSize={13} fontWeight={idx === 0 ? 800 : 500} fontFamily={MOTION_THEME.fontMono}>
                {b.token}
              </text>
              <rect x={910} y={y + 2} width={200} height={18} rx={4} fill="rgba(30,41,59,0.7)" />
              <rect x={910} y={y + 2} width={barW} height={18} rx={4} fill={idx === 0 ? '#34d399' : '#818cf8'} />
              <rect x={910} y={y + 2} width={refW} height={18} rx={4} fill="none" stroke="#94a3b8" strokeWidth={1.8} strokeDasharray="3 2" />
              <text x={1118} y={y + 15} fill="#e2e8f0" fontSize={12} fontFamily={MOTION_THEME.fontMono}>
                {(b.p * 100).toFixed(0)}%
              </text>
            </g>
          );
        })}

        {/* 底部左侧：稀疏奖励时间轴 */}
        <rect x={44} y={286} width={720} height={156} rx={16} fill="rgba(13,17,23,0.88)" stroke="rgba(148,163,184,0.28)" strokeWidth={1.5} />
        <text x={68} y={316} fill="#cbd5e1" fontSize={14} fontWeight={700} fontFamily={MOTION_THEME.fontMono}>
          序列级稀疏奖励脉冲 R_t 与单步 KL 惩罚 (-β·log π_θ/π_ref)
        </text>
        <line x1={74} y1={396} x2={730} y2={396} stroke="#475569" strokeWidth={2} />
        {TOKENS.map((tok, i) => {
          const cx = 122 + i * 112;
          const active = i < emittedCount;
          const isLast = i === TOKENS.length - 1;
          const barH = isLast && active ? 62 * eosPulse : 0;
          const klH = active ? tok.kl * 14 : 0;
          return (
            <g key={tok.text}>
              {/* 负向 KL 惩罚小柱 */}
              {active && <rect x={cx - 16} y={396} width={32} height={klH} rx={3} fill="#f59e0b" opacity={0.8} />}
              {/* 终局正奖励大柱 */}
              {isLast && active && (
                <>
                  <rect x={cx - 22} y={396 - barH} width={44} height={barH} rx={6} fill="#34d399" />
                  <text x={cx} y={396 - barH - 8} textAnchor="middle" fill="#fde047" fontSize={15} fontWeight={900} fontFamily={MOTION_THEME.fontMono}>
                    +1.0 ★
                  </text>
                </>
              )}
              {!isLast && active && (
                <text x={cx} y={386} textAnchor="middle" fill="#64748b" fontSize={12} fontFamily={MOTION_THEME.fontMono}>
                  0
                </text>
              )}
              <text x={cx} y={432} textAnchor="middle" fill="#94a3b8" fontSize={11} fontFamily={MOTION_THEME.fontMono}>
                t={i}
              </text>
            </g>
          );
        })}

        {/* 底部右侧：KL 散度仪表盘 */}
        <rect x={792} y={286} width={364} height={156} rx={16} fill="rgba(13,17,23,0.92)" stroke="rgba(245,158,11,0.4)" strokeWidth={2} />
        <text x={974} y={314} textAnchor="middle" fill="#fde68a" fontSize={14} fontWeight={800} fontFamily={MOTION_THEME.fontMono}>
          累计 KL 锚定仪表 D_KL(π_θ || π_ref)
        </text>
        {/* 半圆弧刻度 */}
        <path d="M 884 405 A 90 90 0 0 1 1064 405" fill="none" stroke="#1e293b" strokeWidth={14} strokeLinecap="round" />
        <path d="M 884 405 A 90 90 0 0 1 1018 327" fill="none" stroke="#34d399" strokeWidth={14} strokeLinecap="round" opacity={0.85} />
        <path d="M 1018 327 A 90 90 0 0 1 1064 405" fill="none" stroke="#f43f5e" strokeWidth={14} strokeLinecap="round" opacity={0.85} />
        {/* 指针 */}
        <g transform={`translate(974, 405) rotate(${klGaugeAngle})`}>
          <line x1={0} y1={0} x2={0} y2={-74} stroke="#facc15" strokeWidth={4} strokeLinecap="round" />
          <circle cx={0} cy={0} r={8} fill="#facc15" />
        </g>
        <text x={974} y={432} textAnchor="middle" fill="#f8fafc" fontSize={16} fontWeight={800} fontFamily={MOTION_THEME.fontMono}>
          Σ log(π_θ/π_ref) = {cumKL.toFixed(2)} nats
        </text>
      </svg>
    </Stage>
  );
};
