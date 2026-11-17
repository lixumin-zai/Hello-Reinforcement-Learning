import type { MotionEntry } from '../../types';
import { MOTION_THEME } from '../../kit';
import { ValueIterationGridMotion } from './ValueIterationGridMotion';
import { GPIZigzagMotion } from './GPIZigzagMotion';

export const entries: MotionEntry[] = [
  {
    id: 'value-iteration-grid',
    chapter: '04-dynamic-programming',
    title: '5×5 网格价值迭代与最优路径生成',
    description: '调用真实 valueIteration 算法，逐轮展示价值从终点向外扩散并锁定最优策略箭头。',
    component: ValueIterationGridMotion,
    durationInFrames: 240,
    fps: MOTION_THEME.fps,
    width: MOTION_THEME.width,
    height: MOTION_THEME.height,
  },
  {
    id: 'gpi-zigzag',
    chapter: '04-dynamic-programming',
    title: '广义策略迭代 (GPI) 锯齿收敛几何图',
    description: '策略评估流形 V=v_π 与贪心改进流形 π=greedy(V) 之间的交替拉扯与不动点收敛。',
    component: GPIZigzagMotion,
    durationInFrames: 210,
    fps: MOTION_THEME.fps,
    width: MOTION_THEME.width,
    height: MOTION_THEME.height,
  },
];
