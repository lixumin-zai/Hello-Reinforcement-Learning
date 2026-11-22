# Hello-Reinforcement-Learning

> **强化学习全景交互教程 × Remotion 动效讲解共奏工作台**  
> 基于 Next.js 16 + Fumadocs 16 + Tailwind v4 + KaTeX 与 [Vibe Motion](https://github.com/vibe-motion)（Remotion 代码驱动动效）构建。

---

## ✨ 核心亮点

1. **4 阶梯 · 10 章 · 34 节零空壳全景体系 (`framework/framework.json`)**
   - **L1 探索直觉（Ch 01–02）**：RL 世界观、迷雾寻宝、多臂老虎机霓虹赌场、$\varepsilon$-贪心、UCB 与 Thompson 贝叶斯采样。
   - **L2 经典算法核心（Ch 03–06）**：马尔可夫决策过程、Bellman 方程与压缩映射、动态规划（VI / PI / GPI）、蒙特卡洛二十一点、时序差分（TD / SARSA / Q-learning / Double Q / Eligibility Traces）。
   - **L3 深度强化学习（Ch 07–08）**：函数近似与死亡三角、DQN（Experience Replay / Target Network / Double / Dueling / Rainbow）、策略梯度定理、Actor-Critic & GAE、TRPO 与 PPO-Clip。
   - **L4 连续控制、规划与大模型后训练（Ch 09–10）**：DDPG / TD3 / 最大熵 SAC、Dyna-Q 与 Dreamer 世界模型、MCTS 与 AlphaZero / MuZero、Token 级 MDP、RLHF & Reward Hacking、DPO 完整逐行推导、以及 DeepSeek-R1 背后的 **GRPO / RLVR 与工程排错手册**。

2. **因题施教：6 大完整可玩小游戏 / 物理仿真 + 40+ 定制交互实验室**
   - **《迷雾寻宝大冒险》** (`FogTreasureGame`)：零先验试错 + 信用分配倒带动画
   - **《5 机霓虹老虎机赌场》** (`BanditCasinoGame`)：真手摇对战 4 大 AI 算法 + 突变环境 + AI 教练诊断
   - **《翡翠绿绒二十一点牌桌》** (`BlackjackGameLab` & `BlackjackPolicyTrainer`)：发牌博弈 + 6 万局实时热力图训练
   - **《山地车动能冲坡挑战》** (`MountainCarGame`)：真实物理引擎 + 相空间螺旋轨迹
   - **《倒立摆 CartPole 平衡挑战》** (`CartPoleGame`)：键盘顶杆计时 + 策略梯度控制器接管
   - **《井字棋 MCTS 透视对弈台》** (`MCTSTicTacToeGame`)：人机对弈 + 实时可视化真实搜索树生长

3. **双流共奏：24 支覆盖 7 套差异化视觉世界观的 Remotion 确定性动效**
   - **流 A：交互文档流 (`.agents/skills/rl-docs-author`)** — 负责数学推导、可运行 Python/PyTorch 代码、交互实验室与章节自测。
   - **流 B：Remotion 动效共奏流 (`.agents/skills/rl-motion-director`)** — 遵守 [`src/motion/HARD_RULES.md`](./src/motion/HARD_RULES.md) 确定性规范，按章节打造 7 套视觉语言（`cyber` 霓虹电路 / `arcade` 复古赌场 / `chalkboard` 3B1B 黑板 / `topographic` 等高波纹 / `tabletop` 绿绒牌桌 / `telemetry` 工程示波器 / `terminal` AI 终端），支持文档内 `<MotionPlayer />` 逐帧播放与 CLI 导出 MP4。
   - **共享确定性算法内核 (`src/lib/rl/`)** — 交互组件与 Remotion 镜头共用同一套带种子随机数 (`createRng`) 的 RL 算法与物理引擎。

---

## 🧭 三大核心入口

- `/docs` — 10 章 34 节零空壳交互教程（含全局符号速查表 `/docs/notation`）
- `/motion` — Remotion 动作讲解工作台（24 支确定性镜头实时逐帧浏览）
- `/app` — RL 交互沙盒（自由绘制迷宫 / 悬崖 / 冰面，实时对比 DP、SARSA 与 Q-learning）

---

## 🚀 快速开始

```bash
npm install
npm run dev                         # 启动开发服务器
npm run lint:content -- --strict    # 严格校验 34/34 章节、组件、24 支动效与确定性红线
npm run types:check                 # 生成 Fumadocs MDX 类型并执行 TypeScript 检查
npm run build                       # 全站静态 + 动态生产构建
npm run motion:studio               # 启动 Remotion Studio 预览与编辑镜头
npm run motion:render -- <id>       # 将指定镜头渲染导出为 MP4 视频
```
