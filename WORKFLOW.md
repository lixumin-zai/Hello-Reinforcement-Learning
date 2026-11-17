# Hello-Reinforcement-Learning 双流共奏工作流 (Dual-Stream Workflow)

> **核心理念**：先把整套强化学习内容框架 (`framework/framework.json`) 设计完整，再通过**文档流 (Docs Stream)** 与 **动效流 (Remotion Motion Stream)** 两条并行共奏的工作流逐步落地每一章的正文、交互实验室与逐帧动作讲解。

```mermaid
flowchart TD
    F["0. 内容框架唯一真源\nframework/framework.json\n(5 篇 · 19 章 · 68 节)"]
    S["scripts/scaffold-content.mjs\n幂等生成 MDX 骨架 + outline.md + 动效注册表"]
    K["共享确定性算法内核\nsrc/lib/rl/*\n(GridWorld / DP / TD / Bandit / 种子随机数)"]

    F --> S
    K --> D
    K --> M

    subgraph D["流 A：文档与交互组件流 (Docs & Playground Stream)"]
      D1["撰写章节 MDX 正文\n直觉 → 数学公式 (KaTeX) → 算法伪代码"]
      D2["开发交互组件\nsrc/components/docs/<chapter>/<Name>.tsx"]
      D1 --> D2
    end

    subgraph M["流 B：Remotion 动效共奏流 (Motion Explainer Stream)"]
      M1["拆解语义节拍 (Semantic Beats)\n输入状态 → 动作 → 数学反应 → 可见结果"]
      M2["编写确定性 Remotion 镜头\nsrc/motion/compositions/<chapter>/*.tsx"]
      M1 --> M2
    end

    S --> D
    S --> M
    D2 --> J["合流点：MDX 内嵌 <Component /> + <MotionPlayer id='...' />"]
    M2 --> J
    J --> C["质检与构建闭环\nnpm run lint:content && npm run build"]
```

---

## 一、四阶段标准作业程序 (SOP)

### Phase 1：框架先行（Framework First）

1. 所有章节、小节、核心知识点 (`points`)、规划的交互组件 (`components`)、规划的动作讲解镜头 (`motions`) 统一声明在 [`framework/framework.json`](./framework/framework.json)。
2. 运行脚手架：
   ```bash
   node scripts/scaffold-content.mjs
   ```
   自动同步生成：
   - `outline.md`（全景大纲视图）
   - `content/docs/**/meta.json` 与未完成小节的骨架 `.mdx`（幂等，绝不覆盖已脱掉 `@status: skeleton` 的正文）
   - `src/motion/compositions/index.ts`（动效总注册表）

### Phase 2：共享算法内核（Deterministic RL Kernel）

- 位于 [`src/lib/rl/`](./src/lib/rl/)。
- 所有算法必须使用 `createRng(seed)`（禁止 `Math.random()`），并返回完整过程快照（`snapshots` / `trace`），以便：
  - **交互组件**能拖动参数滑块实时重算；
  - **Remotion 动效**能根据 `useCurrentFrame()` 确定性索引任意时刻的状态。

### Phase 3：双流并行生产（Docs Stream ∥ Motion Stream）

| 维度 | 流 A：文档与交互组件流 | 流 B：Remotion 动作讲解流 |
| --- | --- | --- |
| **专属 Skill** | `.agents/skills/rl-docs-author/SKILL.md` | `.agents/skills/rl-motion-director/SKILL.md` |
| **核心职责** | 讲清“为什么”（数学推导）与“调参会发生什么”（交互实验） | 讲清“一步更新/一次备份在时间上是如何发生的”（连续空间动画） |
| **产物目录** | `content/docs/<chapter>/*.mdx`<br>`src/components/docs/<chapter>/*.tsx` | `src/motion/compositions/<chapter>/*.tsx`<br>`src/motion/compositions/<chapter>/index.ts` |
| **硬性规范** | 首行 `'use client'`、亮暗主题自适应、使用 Fumadocs `Callout`/`Cards` | 遵守 [`src/motion/HARD_RULES.md`](./src/motion/HARD_RULES.md)：纯 `frame` 驱动、`interpolate` 必带 `clamp` |
| **独立预览** | `npm run dev` → `/docs/<chapter>` 或 `/app` | `npm run dev` → `/motion` 或 `npm run motion:studio` |

### Phase 4：合流质检与提交（Verification & Commit）

每完成一个小节或一个镜头，执行：

```bash
npm run lint:content   # 检查框架对齐、组件存在性、动效注册、确定性红线
npm run types:check    # MDX 类型生成 + TypeScript 严格检查
```

通过后立即按语义提交 Git（`feat(docs): ...` / `feat(motion): ...`）。
