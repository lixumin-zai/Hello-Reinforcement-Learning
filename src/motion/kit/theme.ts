import { RL_COLORS } from '@/lib/rl/color';

export const MOTION_THEME = {
  width: 1280,
  height: 720,
  fps: 30,
  bg: '#090d16',
  bgPanel: 'rgba(15, 23, 42, 0.82)',
  bgCard: 'rgba(30, 41, 59, 0.72)',
  border: 'rgba(148, 163, 184, 0.18)',
  borderStrong: 'rgba(148, 163, 184, 0.35)',
  text: '#f8fafc',
  textMuted: '#94a3b8',
  textDim: '#64748b',
  ...RL_COLORS,
  fontSans: 'Inter, -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
  fontMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
} as const;

export interface MotionBeat {
  id: string;
  startFrame: number;
  endFrame: number;
  /** 节拍短标签，例如 "Step 1 · 观测状态" */
  tag: string;
  /** 底部同步解说字幕 */
  caption: string;
  /** 右上角同步高亮的关键公式（纯文本/Unicode 数学符号） */
  formula?: string;
}
