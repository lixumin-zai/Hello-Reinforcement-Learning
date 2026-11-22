'use client';

import React, { useState } from 'react';
import { Activity, Stethoscope, Wrench } from 'lucide-react';

interface DiagnosisCase {
  id: string;
  label: string;
  badge: string;
  metric2Name: string;
  rewardCurve: number[];
  metric2Curve: number[];
  metric2Color: string;
  symptom: string;
  rootCause: string;
  fixes: string[];
}

const CASES: DiagnosisCase[] = [
  {
    id: 'entropy-collapse',
    label: '1. 熵塌缩 (Entropy Collapse)',
    badge: '探索过早死亡',
    metric2Name: '策略熵 H(π)',
    rewardCurve: [0.1, 0.25, 0.42, 0.46, 0.47, 0.47, 0.47, 0.48, 0.47, 0.47],
    metric2Curve: [1.0, 0.72, 0.35, 0.12, 0.05, 0.03, 0.02, 0.02, 0.01, 0.01],
    metric2Color: '#38bdf8',
    symptom: '训练刚开始几百步策略熵 H(π) 就断崖跌到接近 0；Reward 迅速停在平庸平台不再增长，生成回答高度模板化、重复同一句式。',
    rootCause: '学习率过高、KL 系数过小或缺乏熵正则，导致早期偶然得分稍高的局部模式被迅速“马太效应”锁死，模型彻底丧失采样多样性。',
    fixes: [
      '调高熵奖励系数 c_ent（PPO）或在 GRPO 中增大采样温度 T (如 1.0) 与组大小 G',
      '使用 DAPO 的 Clip-Higher（如 ε_high = 0.28 > ε_low = 0.20）放宽低概率探索 Token 的上升空间',
      '降低 Actor 学习率（大模型 RL 常用 1e-6 ~ 5e-7），加长 Warmup 步数',
    ],
  },
  {
    id: 'kl-explosion',
    label: '2. KL 散度爆炸',
    badge: '策略漂移发疯',
    metric2Name: 'KL 散度 D_KL',
    rewardCurve: [0.15, 0.35, 0.58, 0.72, 0.55, 0.18, -0.25, -0.6, -0.8, -0.9],
    metric2Curve: [0.02, 0.06, 0.14, 0.28, 0.52, 0.78, 0.95, 1.0, 1.0, 1.0],
    metric2Color: '#f43f5e',
    symptom: 'D_KL(π_θ || π_ref) 呈指数飙升（超过 15~30 nats），随后模型开始输出乱码、重复词或切换语种，Reward 骤降。',
    rootCause: '单步更新步长过大（mini-batch 复用 epoch 过多、ε 过大或优势未做归一化），导致概率比 r_t(θ) 失控偏离参考模型。',
    fixes: [
      '启用自适应 KL 惩罚（Adaptive KL Controller）或增大 β（如从 0.01 提到 0.04~0.1）',
      'PPO / GRPO 开启 KL 早停（Target KL Early Stopping）：当 batch KL > 1.5 × target_kl 时中止当前轮更新',
      '检查 Advantage 是否做了标准差归一化，并将梯度裁剪 max_grad_norm 设为 0.5 ~ 1.0',
    ],
  },
  {
    id: 'value-divergence',
    label: '3. Critic / Value Loss 发散',
    badge: '优势估计失真',
    metric2Name: 'Critic Value Loss',
    rewardCurve: [0.1, 0.22, 0.31, 0.28, 0.24, 0.19, 0.21, 0.18, 0.15, 0.14],
    metric2Curve: [0.18, 0.22, 0.31, 0.48, 0.65, 0.74, 0.88, 0.92, 0.96, 1.0],
    metric2Color: '#a78bfa',
    symptom: 'Value Loss 剧烈震荡或持续攀升，Explained Variance 跌破 0，Actor 的策略梯度因为“瞎打分的评论家”变成纯噪声。',
    rootCause: 'Critic 初始化未对齐 RM 尺度（直接拿 SFT 初始化却不先 Warmup Critic），或者奖励尺度过大未经归一化。',
    fixes: [
      'RLHF 中必须用 Reward Model 权重初始化 Critic，并在前 50~100 步冻结 Actor 单独 Warmup Critic',
      '对外部奖励做 Running Mean/Std 归一化或直接裁剪到 [-5, 5]',
      '在可验证任务（数学/代码）中直接切换为 GRPO，彻底移除 Critic 网络！',
    ],
  },
  {
    id: 'reward-hacking',
    label: '4. 奖励黑客 (Reward Hacking)',
    badge: '高分低能刷分',
    metric2Name: '平均输出长度 (Tokens)',
    rewardCurve: [0.15, 0.32, 0.52, 0.68, 0.79, 0.86, 0.92, 0.96, 0.98, 1.0],
    metric2Curve: [0.20, 0.24, 0.28, 0.36, 0.52, 0.70, 0.84, 0.93, 0.98, 1.0],
    metric2Color: '#f59e0b',
    symptom: '训练曲线看起来“完美飙升”（代理 Reward 屡创新高），但人工抽查或验证集准确率暴跌，输出长度暴涨 3~5 倍。',
    rootCause: '策略发现了神经奖励模型 RM 的表面捷径（如长度偏置、过度奉承、堆砌列表格式）而非真正提升能力。',
    fixes: [
      '永远监控“独立验证集真实指标 + 平均生成长度”，绝不只盯训练代理 Reward！',
      '增大 KL 约束 β 或改用可验证规则奖励（RLVR：单元测试 / 数学符号等价判定）',
      '定期用新生成的黑客样本做人工标注并迭代重训 Reward Model（Iterative RLHF）',
    ],
  },
  {
    id: 'grad-nan',
    label: '5. 梯度爆炸 / 突然 NaN',
    badge: '数值稳定性事故',
    metric2Name: '梯度范数 Grad Norm',
    rewardCurve: [0.1, 0.26, 0.44, 0.58, 0.66, 0.72, 0.12, 0.0, 0.0, 0.0],
    metric2Curve: [0.08, 0.10, 0.12, 0.15, 0.22, 0.98, 0.05, 0.0, 0.0, 0.0],
    metric2Color: '#fb7185',
    symptom: '前几千步稳步上涨，某一步 Grad Norm 突然暴冲 100 倍，紧接着 Loss 变 NaN，模型权重永久损坏。',
    rootCause: 'FP16 精度下重要性采样比率 exp(log π - log π_old) 溢出、极短/全零标准差除以 0，或 log(0) 出现 -inf。',
    fixes: [
      '训练全流程使用 BF16 而非 FP16，并在计算 log_prob / ratio / KL 时强制升精度为 FP32！',
      '对 log_ratio 做安全截断 clamp(-20, 20)，GRPO 分母加防零项 std + 1e-4（或按 Dr.GRPO 去掉除以 std）',
      '开启全局梯度裁剪 clip_grad_norm_(1.0) 与异常步骤自动跳过机制',
    ],
  },
];

export function RLCurveDoctor() {
  const [caseId, setCaseId] = useState(CASES[0].id);
  const c = CASES.find((item) => item.id === caseId) ?? CASES[0];

  const toX = (i: number) => 36 + (i / 9) * 488;
  const toY = (v: number) => 136 - ((v + 1.0) / 2.1) * 110; // reward in [-1, 1.1]
  const toY2 = (v: number) => 136 - v * 112; // metric2 in [0, 1]

  const rPts = c.rewardCurve.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');
  const mPts = c.metric2Curve.map((v, i) => `${toX(i)},${toY2(v)}`).join(' ');

  return (
    <div className="my-6 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm space-y-4 not-prose">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-bold flex items-center gap-1.5">
            <Stethoscope className="w-4 h-4 text-rose-500" />
            RL 训练异常曲线诊断室（Curve Doctor）
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            强化学习调参一半时间都在看 TensorBoard / WandB 曲线。选择下方 5 种高频事故，掌握看图断案与一键处方：
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-500">{c.badge}</span>
      </div>

      {/* 病例切换标签 */}
      <div className="flex flex-wrap gap-1.5">
        {CASES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCaseId(item.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              item.id === c.id
                ? 'border-rose-500 bg-rose-500/15 text-rose-500 font-bold'
                : 'border-border bg-background hover:bg-muted text-muted-foreground'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 曲线监测仪 */}
      <div className="rounded-xl border border-border bg-zinc-950 p-3">
        <svg viewBox="0 0 560 160" className="w-full h-40">
          <line x1={36} y1={136} x2={528} y2={136} stroke="#475569" strokeWidth={1.5} />
          <line x1={36} y1={20} x2={36} y2={136} stroke="#475569" strokeWidth={1.5} />
          {/* 异常高发区背景 */}
          <rect x={toX(4)} y={20} width={toX(9) - toX(4)} height={116} fill="rgba(244,63,94,0.08)" />

          <polyline fill="none" stroke="#34d399" strokeWidth={2.8} points={rPts} />
          <polyline fill="none" stroke={c.metric2Color} strokeWidth={2.5} strokeDasharray="6 3" points={mPts} />

          {c.rewardCurve.map((v, i) => (
            <circle key={i} cx={toX(i)} cy={toY(v)} r={3.5} fill="#34d399" />
          ))}

          <text x={46} y={32} fill="#34d399" fontSize={10.5} fontFamily="monospace">
            ━━ 训练 Reward 曲线
          </text>
          <text x={210} y={32} fill={c.metric2Color} fontSize={10.5} fontFamily="monospace">
            --- {c.metric2Name}
          </text>
          <text x={280} y={153} textAnchor="middle" fill="#94a3b8" fontSize={10} fontFamily="monospace">
            训练步数 (Training Steps) →
          </text>
        </svg>
      </div>

      {/* 诊断与处方 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="rounded-xl border border-border bg-background p-3.5 space-y-2">
          <div className="font-bold flex items-center gap-1.5 text-amber-500">
            <Activity className="w-3.5 h-3.5" /> 症状与数学根因
          </div>
          <p className="text-foreground/90 leading-relaxed">
            <strong>现象：</strong>
            {c.symptom}
          </p>
          <p className="text-muted-foreground leading-relaxed">
            <strong>根因：</strong>
            {c.rootCause}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/5 p-3.5 space-y-2">
          <div className="font-bold flex items-center gap-1.5 text-emerald-500">
            <Wrench className="w-3.5 h-3.5" /> 工程修复处方
          </div>
          <ul className="space-y-1.5 list-disc pl-4 text-foreground/90 leading-relaxed">
            {c.fixes.map((fix) => (
              <li key={fix}>{fix}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
