import type { ComponentType } from 'react';

/**
 * 一条动效讲解（Remotion composition）的注册信息。
 * 同一份注册信息同时服务于：
 *  - 文档中的 <MotionPlayer id="..." />（@remotion/player 在浏览器内实时播放）
 *  - Remotion Studio / CLI 渲染 MP4（src/motion/remotion/Root.tsx）
 */
export interface MotionEntry {
  /** 全局唯一，kebab-case，与 framework.json 中 motions[].id 一致 */
  id: string;
  /** 所属章节目录，如 '01-introduction' */
  chapter: string;
  title: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<any>;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  defaultProps?: Record<string, unknown>;
}
