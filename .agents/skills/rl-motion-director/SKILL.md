---
name: rl-motion-director
description: 强化学习 Remotion 动效讲解共奏流（Motion Explainer Stream）技能。参考 vibe-motion/remotion-code-motion-explainer 与 remotion-starter，把强化学习算法步骤、Bellman 备份、TD 误差、策略更新转化为确定性、可逐帧验证的 Remotion 动画。
---

# RL Remotion 动效导演流 (rl-motion-director)

## 核心铁律

动手写代码前必读 `src/motion/HARD_RULES.md`：
1. **100% 帧驱动**：所有动画值由 `useCurrentFrame()` + `interpolate(..., CLAMP)` / `spring()` 计算，严禁 CSS `transition` 或 `animate-*`。
2. **100% 确定性**：严禁 `Math.random()` / `Date.now()`，一律调用 `@/lib/rl` 中的确定性函数或 `createRng(seed)`。
3. **连续空间与语义节拍**：使用 `src/motion/kit` 提供的 `<Stage beats={BEATS} />`，将每个算法讲解拆分为 3–4 个语义节拍（`input state → action → mechanism → visible result`），保持核心视觉对象跨节拍连续演化。

## 新增一个动效镜头的步骤

1. 在 `src/motion/compositions/<chapter>/<Name>Motion.tsx` 中编写组件，外层包裹 `<Stage title="..." chapterLabel="..." beats={BEATS}>`。
2. 在 `src/motion/compositions/<chapter>/index.ts` 的 `entries` 数组中注册 `MotionEntry`（`id` 与 `framework/framework.json` 中 `motions[].id` 一致）。
3. 在对应的 MDX 文件中使用 `<MotionPlayer id="<motion-id>" />` 嵌入，或访问 `/motion` 工作台预览。
4. 运行 `npm run lint:content` 验证确定性红线与注册表完整性。
