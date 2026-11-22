import type { MotionEntry } from '../../types';
import { MOTION_THEME } from '../../kit';
import { ContractionMappingMotion } from './ContractionMappingMotion';
import { ValueWavefieldMotion } from './ValueWavefieldMotion';
import { GPICameraZigzagMotion } from './GPICameraZigzagMotion';

export const entries: MotionEntry[] = [
  {
    id: 'contraction-mapping',
    chapter: '04-dynamic-programming',
    title: 'Banach γ-压缩映射：为何策略评估必然收敛',
    description: '二维价值空间中两个任意初值点经 Bellman 算子迭代后按 γ^k 螺旋收缩至唯一不动点 v_π。',
    component: ContractionMappingMotion,
    durationInFrames: 225,
    fps: MOTION_THEME.fps,
    width: MOTION_THEME.width,
    height: MOTION_THEME.height,
  },
  {
    id: 'value-wavefield',
    chapter: '04-dynamic-programming',
    title: '价值迭代：荧光等高线水波扩散与风场对齐',
    description: '等高线地形风，展示 5×5 迷宫中价值波浪绕障传播及策略箭头顺坡度锁定的过程。',
    component: ValueWavefieldMotion,
    durationInFrames: 240,
    fps: MOTION_THEME.fps,
    width: MOTION_THEME.width,
    height: MOTION_THEME.height,
  },
  {
    id: 'gpi-camera-zigzag',
    chapter: '04-dynamic-programming',
    title: '广义策略迭代 (GPI) 双流形相机跟拍',
    description: '虚拟摄影机跟拍状态点在评估与改进两条流形间弹跳收束，推镜锁定交点 (v*, π*)。',
    component: GPICameraZigzagMotion,
    durationInFrames: 220,
    fps: MOTION_THEME.fps,
    width: MOTION_THEME.width,
    height: MOTION_THEME.height,
  },
];
