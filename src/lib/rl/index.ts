/**
 * RL 算法内核（docs 与 motion 两条流共享）
 *
 * 约定：
 *  - 纯函数 / 无副作用 / 不依赖 DOM，可在服务端、浏览器、Remotion 渲染进程中运行
 *  - 随机性一律来自 createRng(seed)
 *  - 训练函数返回完整过程（trace / snapshots），而不是只返回最终结果
 *
 * 新增算法时：新建独立文件（如 mc.ts、policy-gradient.ts），并在此处 re-export。
 */
export * from './random';
export * from './gridworld';
export * from './dp';
export * from './td';
export * from './bandit';
export * from './color';
