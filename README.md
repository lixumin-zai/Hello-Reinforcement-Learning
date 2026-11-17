# Hello-Reinforcement-Learning

> **强化学习全景交互指南 × Remotion 动效讲解共奏工作台**  
> 参考 `Hello-SVG`（Next.js 16 + Fumadocs 16 + Tailwind v4 + KaTeX）与 [Vibe Motion](https://github.com/vibe-motion)（Remotion 代码驱动动效）构建。

---

## ✨ 核心特性

1. **框架先行，单一真源 (`framework/framework.json`)**
   - 完整覆盖 **5 篇、19 个部分、68 节**强化学习全景体系：从 MDP、多臂老虎机、动态规划、蒙特卡洛、时序差分（SARSA / Q-learning），一路到函数近似、DQN、策略梯度、PPO、连续控制、MCTS/AlphaZero、以及大模型后训练 **RLHF / DPO / GRPO (DeepSeek-R1)**。
   - 运行 `node scripts/scaffold-content.mjs` 幂等生成 `outline.md`、章节 `meta.json`、骨架 MDX 与动效注册表。

2. **双流共奏工作流（详见 [`WORKFLOW.md`](./WORKFLOW.md)）**
   - **流 A：交互文档流 (`.agents/skills/rl-docs-author`)** — 负责数学推导、伪代码与浏览器内实时交互实验室（`src/components/docs/**`）。
   - **流 B：Remotion 动作讲解共奏流 (`.agents/skills/rl-motion-director`)** — 参考 `vibe-motion/remotion-code-motion-explainer` 与 `remotion-starter`，遵守 [`src/motion/HARD_RULES.md`](./src/motion/HARD_RULES.md) 逐帧确定性规范，在文档内通过 `<MotionPlayer id="..." />` 实时播放，并支持独立工作台 `/motion` 与 MP4 导出。
   - **共享算法内核 (`src/lib/rl/`)** — 交互组件与 Remotion 动画调用同一套基于种子随机数 (`createRng`) 的确定性 RL 算法实现。

3. **三大核心入口**
   - `/docs` — 19 章全景交互文档
   - `/motion` — Remotion 动作讲解工作台（12 个核心 RL 过程镜头）
   - `/app` — RL 交互沙盒（GridWorld / 悬崖行走 / 迷宫 + DP 价值迭代 / Q-learning / SARSA 实时训练与回放）

---

## 🚀 快速开始

```bash
npm install
npm run dev              # 启动开发服务器
npm run lint:content     # 对照 framework.json 检查章节进度、组件引用与 Remotion 确定性红线
npm run types:check      # 生成 MDX 类型并执行 TypeScript 检查
npm run motion:studio    # 启动 Remotion Studio 预览与编辑镜头
```
