---
name: rl-docs-author
description: 强化学习交互文档流（Docs & Playground Stream）工作流技能。当需要填充或升级 content/docs 下的强化学习章节正文、推导公式或开发 src/components/docs 下的可交互强化学习组件时使用。
---

# RL 文档与交互组件流 (rl-docs-author)

## 适用场景

将 `content/docs/<chapter>/<section>.mdx` 中的 `@status: skeleton` 骨架页升级为包含**完整讲解 + KaTeX 数学公式 + 可交互 React 实验组件 + Remotion 动效内嵌**的正式章节。

## 五步执行流程

1. **对齐框架**：读取 `framework/framework.json` 中对应小节的 `points`、`components`、`motions`。
2. **检查/扩展算法内核**：若交互组件需要新的 RL 算法，优先在 `src/lib/rl/` 中以纯函数 + `createRng(seed)` 实现，不要在 UI 组件里散落不可复用的算法逻辑。
3. **开发交互组件 (`src/components/docs/<chapter>/<ComponentName>.tsx`)**：
   - 首行必须为 `'use client';`
   - 容器统一使用：`rounded-xl border border-border bg-card p-6 my-6 shadow-sm`
   - 必须同时适配亮色与暗色模式（使用 `bg-card`、`text-foreground`、`text-muted-foreground`、`border-border` 等语义变量）
   - 顶部提供一行清晰的操作引导（例如 `▶ 拖动折扣因子 γ 滑块，观察未来奖励权重的指数衰减`）
4. **撰写 MDX 正文 (`content/docs/<chapter>/<slug>.mdx`)**：
   - 移除 `{/* @status: skeleton ... */}` 标记
   - 按「直觉引入 → 形式化定义与公式推导 → 算法伪代码/步骤 → 交互实验室 `<ComponentName />` → 动效讲解 `<MotionPlayer id="..." />` → 小结与下一节卡片」组织结构
5. **运行质检**：执行 `npm run lint:content` 与 `npm run types:check`。
