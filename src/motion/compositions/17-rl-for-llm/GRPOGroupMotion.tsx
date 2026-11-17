import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { CLAMP, MOTION_THEME, Stage, type MotionBeat } from '../../kit';

const BEATS: MotionBeat[] = [
  {
    id: 'group-sample',
    startFrame: 0,
    endFrame: 55,
    tag: 'Beat 1 · 对同一 Prompt 采样一组回答 (G = 4)',
    caption: '给定数学题 Prompt q，策略 π_θ 并行采样一组 G=4 条推理链输出 {o_1, o_2, o_3, o_4}。',
    formula: '{o_1, …, o_G} ~ π_{θ_old}(· | q)',
  },
  {
    id: 'rule-reward',
    startFrame: 55,
    endFrame: 115,
    tag: 'Beat 2 · 可验证规则奖励打分 (RLVR)',
    caption: '无需训练庞大的神经奖励模型：用确定性验证器检查答案正确性 + 格式规范，给出奖励 {r_1..r_4}。',
    formula: 'r_i = R_acc(o_i) + R_format(o_i)',
  },
  {
    id: 'group-norm',
    startFrame: 115,
    endFrame: 175,
    tag: 'Beat 3 · 组内标准化计算相对优势 Â_i（省掉 Critic！）',
    caption: '用组内均值 μ 与标准差 σ 直接将奖励标准化为相对优势 Â_i = (r_i - μ) / σ，彻底省去与策略同规模的 Critic 网络！',
    formula: 'Â_i = (r_i - mean(r)) / std(r)',
  },
  {
    id: 'update',
    startFrame: 175,
    endFrame: 240,
    tag: 'Beat 4 · PPO-Clip + KL 正则更新策略',
    caption: '正优势回答 (Â_i > 0) 概率被强化，负优势回答被抑制，同时用 KL(π_θ || π_ref) 防止偏离基座模型。',
    formula: 'J_GRPO(θ) = (1/G) Σ min(r_i Â_i, clip(r_i) Â_i) - β D_KL',
  },
];

const SAMPLES = [
  { id: 'o₁', cot: '<think> 设 x=3, 代入验证… </think> 答案: 12 ✓', reward: 1.0, adv: +1.18 },
  { id: 'o₂', cot: '<think> 分步因式分解… </think> 答案: 12 ✓', reward: 0.9, adv: +0.85 },
  { id: 'o₃', cot: '<think> 算错符号… </think> 答案: 8 ✗ (格式正确)', reward: 0.2, adv: -0.95 },
  { id: 'o₄', cot: '直接猜答案 5 ✗ (无 <think> 标签)', reward: 0.0, adv: -1.08 },
];

export const GRPOGroupMotion: React.FC = () => {
  const frame = useCurrentFrame();

  const showSamples = interpolate(frame, [5, 45], [0, 1], CLAMP);
  const showRewards = interpolate(frame, [58, 100], [0, 1], CLAMP);
  const showAdv = interpolate(frame, [118, 165], [0, 1], CLAMP);
  const showUpdate = interpolate(frame, [178, 220], [0, 1], CLAMP);

  return (
    <Stage
      title="GRPO (Group Relative Policy Optimization)：无 Critic 的组相对策略优化"
      chapterLabel="17 · 强化学习与大模型"
      accent={MOTION_THEME.agent}
      beats={BEATS}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 24, height: '100%' }}>
        {/* 左侧：Prompt -> 4 条采样回答 -> 奖励 -> 组内相对优势 */}
        <div
          style={{
            borderRadius: 18,
            backgroundColor: MOTION_THEME.bgCard,
            border: `1px solid ${MOTION_THEME.border}`,
            padding: '18px 22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              backgroundColor: 'rgba(99, 102, 241, 0.14)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              fontSize: 13,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>
              <strong style={{ color: '#a5b4fc' }}>Prompt q：</strong>解方程 2x + 3 = 27，请给出推理过程与最终答案。
            </span>
            <span style={{ fontFamily: MOTION_THEME.fontMono, color: '#cbd5e1' }}>Group Size G = 4</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {SAMPLES.map((s, idx) => {
              const pos = s.adv > 0;
              return (
                <div
                  key={s.id}
                  style={{
                    opacity: showSamples,
                    padding: '12px 14px',
                    borderRadius: 12,
                    backgroundColor: 'rgba(15, 23, 42, 0.78)',
                    border: `1px solid ${
                      showUpdate > 0.3 ? (pos ? '#34d399' : '#f43f5e') : MOTION_THEME.border
                    }`,
                    display: 'grid',
                    gridTemplateColumns: '42px 1fr 96px 128px',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <span
                    style={{
                      fontFamily: MOTION_THEME.fontMono,
                      fontWeight: 800,
                      color: '#a5b4fc',
                      fontSize: 14,
                    }}
                  >
                    {s.id}
                  </span>
                  <span style={{ fontSize: 13, color: '#e2e8f0', fontFamily: MOTION_THEME.fontMono }}>{s.cot}</span>

                  {/* 奖励徽章 */}
                  <div
                    style={{
                      opacity: showRewards,
                      textAlign: 'right',
                      fontFamily: MOTION_THEME.fontMono,
                      fontSize: 13,
                      color: '#fde68a',
                      fontWeight: 700,
                    }}
                  >
                    r_{idx + 1} = {s.reward.toFixed(1)}
                  </div>

                  {/* 组内相对优势条 */}
                  <div
                    style={{
                      opacity: showAdv,
                      padding: '4px 10px',
                      borderRadius: 8,
                      textAlign: 'center',
                      fontFamily: MOTION_THEME.fontMono,
                      fontSize: 13,
                      fontWeight: 800,
                      backgroundColor: pos ? 'rgba(16, 185, 129, 0.18)' : 'rgba(244, 63, 94, 0.18)',
                      color: pos ? '#34d399' : '#fda4af',
                      border: `1px solid ${pos ? '#10b981' : '#f43f5e'}`,
                    }}
                  >
                    Â_{idx + 1} = {s.adv > 0 ? `+${s.adv.toFixed(2)}` : s.adv.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12,
              fontFamily: MOTION_THEME.fontMono,
              color: MOTION_THEME.textMuted,
            }}
          >
            <span>组均值 μ = mean(r) = 0.525</span>
            <span>组标准差 σ = std(r) = 0.432</span>
            <span style={{ color: '#5eead4' }}>Σ Â_i = 0（零均值自平衡基线）</span>
          </div>
        </div>

        {/* 右侧：PPO vs GRPO 架构对比 */}
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
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>为什么 DeepSeek-R1 选择 GRPO？</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, lineHeight: 1.65 }}>
              <div
                style={{
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.35)',
                }}
              >
                <strong style={{ color: '#fda4af' }}>传统 PPO 的显存痛点</strong>
                <div style={{ color: '#cbd5e1', marginTop: 4 }}>
                  需要同时驻留 Policy、Reference、Reward、<strong>Value (Critic)</strong> 四个大模型；在长思维链上训练逐 token 的 Critic 既慢又极耗显存。
                </div>
              </div>
              <div
                style={{
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                }}
              >
                <strong style={{ color: '#34d399' }}>GRPO 的核心简化</strong>
                <div style={{ color: '#cbd5e1', marginTop: 4 }}>
                  同一题目采样 G 条回答，<strong>用组内平均分 μ 代替 Critic 基线 V(s)</strong>：比同组平均答得好的获得正优势，比平均差的获得负优势，显存开销直降近半！
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: 12,
              borderRadius: 10,
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              border: `1px solid ${MOTION_THEME.border}`,
              fontSize: 12,
              color: '#fde68a',
            }}
          >
            💡 可验证奖励 (RLVR) + GRPO 让模型无需人工标注思维过程，就能自发涌现出自我反思与验算行为。
          </div>
        </div>
      </div>
    </Stage>
  );
};
