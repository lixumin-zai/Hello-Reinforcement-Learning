import type { MotionEntry } from '../../types';
import { MOTION_THEME } from '../../kit';
import { MarkovChalkboardMotion } from './MarkovChalkboardMotion';
import { DiscountSeriesFoldMotion } from './DiscountSeriesFoldMotion';
import { BellmanTreeMorphMotion } from './BellmanTreeMorphMotion';

export const entries: MotionEntry[] = [
  {
    id: 'markov-chalkboard',
    chapter: '03-mdp-bellman',
    title: 'MDP 黑板拓扑游走与平稳分布收敛',
    description: '3Blue1Brown 数学黑板风，粒子在学生 MDP 上游走并实时汇聚出状态访问分布 d^π(s)。',
    component: MarkovChalkboardMotion,
    durationInFrames: 220,
    fps: MOTION_THEME.fps,
    width: MOTION_THEME.width,
    height: MOTION_THEME.height,
  },
  {
    id: 'discount-series-fold',
    chapter: '03-mdp-bellman',
    title: '几何级数折叠：推导 G_t = R_{t+1} + γ G_{t+1}',
    description: '未来奖励方块按 γ^k 衰减并折叠进公因式括号，几何直观推导回报递归式。',
    component: DiscountSeriesFoldMotion,
    durationInFrames: 220,
    fps: MOTION_THEME.fps,
    width: MOTION_THEME.width,
    height: MOTION_THEME.height,
  },
  {
    id: 'bellman-tree-morph',
    chapter: '03-mdp-bellman',
    title: 'Bellman 备份树形变：期望平均 vs 最优剪枝',
    description: '发光价值沿两层概率树自底向上回传至根部，并动态切换为 max_a 最优剪枝备份。',
    component: BellmanTreeMorphMotion,
    durationInFrames: 255,
    fps: MOTION_THEME.fps,
    width: MOTION_THEME.width,
    height: MOTION_THEME.height,
  },
];
