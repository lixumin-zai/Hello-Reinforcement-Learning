import { interpolate, spring } from 'remotion';
import type { MotionBeat } from './theme';

export const CLAMP = {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
} as const;

/** 在 [start, start + duration] 内从 0 线性过渡到 1 */
export function fadeIn(frame: number, start: number, duration = 15): number {
  return interpolate(frame, [start, start + Math.max(1, duration)], [0, 1], CLAMP);
}

/** 在 [start, end] 内计算进度 0..1 */
export function progressBetween(frame: number, start: number, end: number): number {
  return interpolate(frame, [start, Math.max(start + 1, end)], [0, 1], CLAMP);
}

/** 弹性缩放 0 -> 1 */
export function springScale(frame: number, fps: number, delay = 0, damping = 14, stiffness = 140): number {
  const s = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping, stiffness, mass: 0.8 },
  });
  return interpolate(s, [0, 1], [0, 1], CLAMP);
}

/** 在指定帧附近产生一次柔和脉冲 (0 -> 1 -> 0) */
export function pulseAt(frame: number, peakFrame: number, halfWidth = 12): number {
  if (frame < peakFrame - halfWidth || frame > peakFrame + halfWidth) return 0;
  return frame <= peakFrame
    ? interpolate(frame, [peakFrame - halfWidth, peakFrame], [0, 1], CLAMP)
    : interpolate(frame, [peakFrame, peakFrame + halfWidth], [1, 0], CLAMP);
}

/** 根据当前帧找到激活的语义节拍 */
export function activeBeat(beats: MotionBeat[], frame: number): { beat: MotionBeat; index: number; progress: number } {
  for (let i = 0; i < beats.length; i++) {
    const b = beats[i];
    if (frame >= b.startFrame && frame < b.endFrame) {
      return {
        beat: b,
        index: i,
        progress: progressBetween(frame, b.startFrame, b.endFrame),
      };
    }
  }
  const last = beats[beats.length - 1];
  return { beat: last, index: beats.length - 1, progress: 1 };
}
