# Remotion 动效讲解硬规则（HARD_RULES）

> 参考 [vibe-motion/remotion-starter](https://github.com/vibe-motion/remotion-starter) 与 [vibe-motion/remotion-code-motion-explainer](https://github.com/vibe-motion/remotion-code-motion-explainer) 制定。
> 所有 `src/motion/compositions/**` 下的动效组件必须严格遵守本文件。

---

## 1. 逐帧确定性（Frame Determinism）

Remotion 在预览 scrubbing 和多进程并发渲染时，会**乱序**调用组件渲染任意帧 `frame`。因此同一 `frame` 无论渲染多少次，画面必须 **100% 一致**：

1. **禁止裸 CSS 动画**：禁止 `transition:`、Tailwind `transition-*` / `animate-*` / `duration-*`、以及不带负延时锁帧的 `@keyframes`。所有随时间变化的属性必须由 `useCurrentFrame()` 经 `interpolate()` 或 `spring()` 算出后写入 inline `style`。
2. **禁止非确定性随机与时钟**：禁止 `Math.random()`、`Date.now()`、`performance.now()`。需要随机数或仿真轨迹时，一律调用 `@/lib/rl` 中的 `createRng(seed)` 或确定性算法函数（如 `valueIteration`、`trainTD`、`runBandit`）。
3. **`interpolate()` 必须带 `clamp` 且 `inputRange` 严格递增**：
   ```ts
   interpolate(frame, [start, end], [from, to], {
     extrapolateLeft: 'clamp',
     extrapolateRight: 'clamp',
   });
   ```

## 2. 语义节拍与连续空间叙事（Code Motion Explainer 原则）

每个算法动作讲解不是 PPT 翻页，而是**同一视觉世界中的状态演化**：

```text
输入状态 (Input State) → 动作 (Action) → 数学/系统反应 (Mechanism) → 可见结果 (Visible Result) → 镜头接力 (Handoff)
```

- **持续对象（Persistent Actors）**：状态节点、网格单元、价值柱状图、公式项在整个 composition 生命周期中保持挂载，通过位置、缩放、颜色、高亮变化表达因果关系。
- **语义节拍（Semantic Beats）**：每个动效拆分为 3–5 个 `Beat`（包含帧区间 `[startFrame, endFrame]`、顶部阶段标签 `tag`、底部旁白字幕 `caption`、当前高亮公式 `formula`），统一交给 `<Stage />` 渲染。
- **语义配色一致**：复用 `@/lib/rl` 中的 `RL_COLORS`（智能体/动作 `#6366f1`、环境/状态 `#14b8a6`、奖励/目标 `#f59e0b`、价值/Q `#a855f7`、误差/惩罚 `#f43f5e`）。

## 3. 双端复用契约

每个动效在 `src/motion/compositions/<chapter>/index.ts` 中导出为 `MotionEntry`，同时用于：
- **文档内嵌**：MDX 中 `<MotionPlayer id="..." />`（基于 `@remotion/player`，支持播放/暂停/逐帧拖动/倍速/节拍跳转）
- **独立动效工作台**：`/motion` 页面与 `npm run motion:studio` / `npm run motion:render`
