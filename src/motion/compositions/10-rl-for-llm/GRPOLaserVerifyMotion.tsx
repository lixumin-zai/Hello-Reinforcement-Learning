import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { CLAMP, MOTION_THEME, Stage, type MotionBeat } from '../../kit';

const BEATS: MotionBeat[] = [
  {
    id: 'group-rollout',
    startFrame: 0,
    endFrame: 65,
    tag: 'Phase 1 · 组采样 Rollout（彻底砍掉 Critic！）',
    caption: '对同一道数学题并行采样 G=4 条 <think> 思维链；不再需要庞大的 Critic 价值网络，显存立省近半！',
    formula: '{o_1, o_2, o_3, o_4} ~ π_old(·|q)   [No Critic V_φ!]',
  },
  {
    id: 'laser-verify',
    startFrame: 65,
    endFrame: 135,
    tag: 'Phase 2 · 可验证规则激光质检 (RLVR)',
    caption: '用确定性数学/代码规则验证器逐条激光扫描：答对且格式规范拿高分，错算拿零分——杜绝神经 RM 奖励黑客！',
    formula: 'r_i = RuleVerifier(q, o_i) ∈ {1.2, 0.2, 1.0, 0.0}',
  },
  {
    id: 'group-norm',
    startFrame: 135,
    endFrame: 205,
    tag: 'Phase 3 · 组内相对优势归一化 Â_i',
    caption: '把组内均值 μ=0.60 当作动态基线、除以标准差 σ=0.51：高于平均的推理链得正优势(绿)，低于平均得负优势(红)！',
    formula: 'Â_i = (r_i - μ) / σ = [+1.18, -0.78, +0.78, -1.18]',
  },
  {
    id: 'policy-update',
    startFrame: 205,
    endFrame: 270,
    tag: 'Phase 4 · 强化正确推理路径，涌现 Aha Moment',
    caption: '沿绿/红相对优势做 PPO-Clip 更新，长思考与自我验算链条被不断放大，DeepSeek-R1 式推理能力自发涌现！',
    formula: 'J_GRPO(θ) = E[ min(ρ Â_i, clip(ρ, 1±ε) Â_i) - β D_KL ]',
  },
];

const STREAMS = [
  { id: 'o₁', think: '<think>2x=12 → x=6, 验算✓</think> \\boxed{6}', r: 1.2, adv: +1.18, pass: true },
  { id: 'o₂', think: '<think>2x=26 → x=13</think> \\boxed{13}', r: 0.2, adv: -0.78, pass: false },
  { id: 'o₃', think: '心算 19-7=12 得 x=6 (缺格式)', r: 1.0, adv: +0.78, pass: true },
  { id: 'o₄', think: '直接猜 x=7 (算错且无标签)', r: 0.0, adv: -1.18, pass: false },
];

export const GRPOLaserVerifyMotion: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rolloutP = interpolate(frame, [6, 56], [0, 1], CLAMP);
  const laserY = interpolate(frame, [68, 128], [46, 408], CLAMP);
  const normP = interpolate(frame, [138, 192], [0, 1], CLAMP);
  const backP = interpolate(frame, [208, 258], [0, 1], CLAMP);
  const ahaPop = spring({ frame: Math.max(0, frame - 220), fps, config: { damping: 12, stiffness: 130 } });

  return (
    <Stage
      title="DeepSeek-R1 / GRPO 激光质检流水线：零 Critic 组相对优势"
      chapterLabel="Ch 10 · 大模型强化学习"
      world="terminal"
      beats={BEATS}
    >
      <svg viewBox="0 0 1200 470" style={{ width: '100%', height: '100%' }}>
        {/* 左侧 Prompt 发射器 */}
        <rect x={34} y={145} width={155} height={116} rx={16} fill="rgba(99,102,241,0.22)" stroke="#818cf8" strokeWidth={2.5} />
        <text x={111} y={182} textAnchor="middle" fill="#e0e7ff" fontSize={16} fontWeight={900} fontFamily={MOTION_THEME.fontMono}>
          Prompt q
        </text>
        <text x={111} y={208} textAnchor="middle" fill="#cbd5e1" fontSize={13} fontFamily={MOTION_THEME.fontMono}>
          2x + 7 = 19
        </text>
        <text x={111} y={236} textAnchor="middle" fill="#34d399" fontSize={12} fontWeight={700} fontFamily={MOTION_THEME.fontMono}>
          并行采样 G = 4
        </text>

        {/* 被划掉的 Critic 虚影框 */}
        <rect x={34} y={300} width={155} height={78} rx={14} fill="rgba(244,63,94,0.08)" stroke="rgba(244,63,94,0.45)" strokeWidth={1.8} strokeDasharray="6 4" />
        <text x={111} y={332} textAnchor="middle" fill="#fda4af" fontSize={14} fontWeight={800} fontFamily={MOTION_THEME.fontMono}>
          Critic V_φ
        </text>
        <text x={111} y={356} textAnchor="middle" fill="#fb7185" fontSize={11.5} fontWeight={700} fontFamily={MOTION_THEME.fontMono}>
          ✕ 已移除 (省 50% 显存)
        </text>
        <line x1={46} y1={312} x2={176} y2={366} stroke="#fb7185" strokeWidth={2.5} />

        {/* 4 条平行推理链 */}
        {STREAMS.map((st, idx) => {
          const y = 46 + idx * 94;
          const cy = y + 36;
          const scanned = frame >= 68 && laserY >= cy;
          const barW = Math.abs(st.adv) * 76 * normP;
          const isPos = st.adv > 0;

          return (
            <g key={st.id}>
              {/* 发射连线 */}
              <path
                d={`M 189 203 C 218 203, 218 ${cy}, 244 ${cy}`}
                fill="none"
                stroke={isPos && backP > 0 ? '#34d399' : '#475569'}
                strokeWidth={isPos && backP > 0 ? 3.5 : 2}
              />

              {/* 推理链卡片 */}
              <rect
                x={244}
                y={y}
                width={420 * rolloutP}
                height={72}
                rx={12}
                fill={
                  scanned
                    ? st.pass
                      ? 'rgba(16,185,129,0.16)'
                      : 'rgba(244,63,94,0.14)'
                    : 'rgba(13,17,23,0.92)'
                }
                stroke={scanned ? (st.pass ? '#34d399' : '#fb7185') : '#334155'}
                strokeWidth={2}
              />
              {rolloutP > 0.65 && (
                <>
                  <text x={260} y={y + 28} fill="#94a3b8" fontSize={13} fontWeight={800} fontFamily={MOTION_THEME.fontMono}>
                    Rollout {st.id}
                  </text>
                  <text x={260} y={y + 52} fill="#e6edf3" fontSize={13.5} fontFamily={MOTION_THEME.fontMono}>
                    {st.think}
                  </text>
                </>
              )}

              {/* Phase 2：规则验证打分印章 */}
              {scanned && (
                <g>
                  <rect
                    x={684}
                    y={y + 12}
                    width={126}
                    height={48}
                    rx={10}
                    fill={st.pass ? 'rgba(16,185,129,0.22)' : 'rgba(244,63,94,0.22)'}
                    stroke={st.pass ? '#34d399' : '#fb7185'}
                    strokeWidth={2}
                  />
                  <text
                    x={747}
                    y={y + 42}
                    textAnchor="middle"
                    fill={st.pass ? '#6ee7b7' : '#fda4af'}
                    fontSize={16}
                    fontWeight={900}
                    fontFamily={MOTION_THEME.fontMono}
                  >
                    {st.pass ? '✓' : '✗'} r={st.r.toFixed(1)}
                  </text>
                </g>
              )}

              {/* Phase 3：相对优势红绿光谱条 */}
              {normP > 0 && (
                <g>
                  {/* 中轴线 x=1010 */}
                  <rect
                    x={isPos ? 1010 : 1010 - barW}
                    y={y + 18}
                    width={barW}
                    height={36}
                    rx={6}
                    fill={isPos ? '#34d399' : '#fb7185'}
                  />
                  <text
                    x={isPos ? 1018 + barW : 1002 - barW}
                    y={y + 42}
                    textAnchor={isPos ? 'start' : 'end'}
                    fill={isPos ? '#6ee7b7' : '#fda4af'}
                    fontSize={15}
                    fontWeight={900}
                    fontFamily={MOTION_THEME.fontMono}
                  >
                    {st.adv > 0 ? `+${st.adv.toFixed(2)}` : st.adv.toFixed(2)}
                  </text>
                </g>
              )}

              {/* Phase 4：反向强化光球回传 */}
              {backP > 0 && backP < 1 && (
                <circle
                  cx={interpolate(backP, [0, 1], [860, 244], CLAMP)}
                  cy={cy}
                  r={8}
                  fill={isPos ? '#34d399' : '#fb7185'}
                  stroke="#fff"
                  strokeWidth={2}
                />
              )}
            </g>
          );
        })}

        {/* Phase 2 激光扫描光束 */}
        {frame >= 68 && frame <= 135 && (
          <g>
            <line x1={236} y1={laserY} x2={816} y2={laserY} stroke="#34d399" strokeWidth={4} />
            <rect x={236} y={laserY - 12} width={580} height={24} fill="rgba(52,211,153,0.16)" />
          </g>
        )}

        {/* Phase 3 右侧组统计棱镜中轴 */}
        {normP > 0 && (
          <g opacity={normP}>
            <line x1={1010} y1={42} x2={1010} y2={412} stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 4" />
            <rect x={858} y={420} width={304} height={34} rx={8} fill="rgba(30,41,59,0.9)" stroke="#475569" />
            <text x={1010} y={442} textAnchor="middle" fill="#e2e8f0" fontSize={13} fontWeight={700} fontFamily={MOTION_THEME.fontMono}>
              组基线 μ = 0.60 · 标准差 σ = 0.51
            </text>
          </g>
        )}

        {/* Phase 4 Aha Moment 徽章 */}
        {frame >= 220 && (
          <g opacity={ahaPop}>
            <rect x={244} y={418} width={566} height={38} rx={10} fill="rgba(250,204,21,0.18)" stroke="#facc15" strokeWidth={2} />
            <text x={527} y={442} textAnchor="middle" fill="#fde047" fontSize={14.5} fontWeight={900} fontFamily={MOTION_THEME.fontMono}>
              ✨ 绿色正优势链条被持续放大 → 模型自发涌现“复核与反思” Aha Moment！
            </text>
          </g>
        )}
      </svg>
    </Stage>
  );
};
