import Link from 'next/link';
import { ArrowRight, Sparkles, Film, Layers, Cpu, Github } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function HomePage() {
  return (
    <main className="flex flex-col flex-1 relative overflow-hidden bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 selection:bg-zinc-200 dark:selection:bg-zinc-800 transition-colors duration-500">
      {/* Header with Theme Toggle */}
      <header className="absolute top-0 right-0 p-6 z-50">
        <ThemeToggle />
      </header>

      {/* Background Gradients */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-indigo-500/10 dark:from-indigo-500/20 via-transparent to-transparent pointer-events-none blur-3xl transition-colors duration-500" />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-teal-500/10 dark:bg-teal-500/20 rounded-full blur-[128px] pointer-events-none transition-colors duration-500" />
      <div className="absolute top-40 -left-40 w-[400px] h-[400px] bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-[128px] pointer-events-none transition-colors duration-500" />

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-[82vh] text-center px-4 py-20 max-w-5xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-8 rounded-full bg-zinc-100/80 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 backdrop-blur-md shadow-sm">
          <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Hello Reinforcement Learning · 交互文档 × Remotion 动效共奏
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-zinc-900 dark:text-white">
          从零读懂并亲手训练
          <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-teal-500 to-amber-500 drop-shadow-sm">
            强化学习与推理模型
          </span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed">
          涵盖 5 篇 19 章 68 节全景体系：从马尔可夫决策过程、多臂老虎机、动态规划、TD 与 Q-learning，一路深入到 DQN、PPO、RLHF 与 DeepSeek-R1 背后的 GRPO。
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap w-full max-w-2xl">
          <Link
            href="/docs"
            className="group flex items-center justify-center gap-2 bg-indigo-500 text-white px-8 py-4 rounded-full font-semibold hover:bg-indigo-600 transition-all shadow-[0_0_20px_-10px_rgba(99,102,241,0.5)] hover:-translate-y-0.5 w-full sm:w-auto min-w-[160px]"
          >
            开始阅读教程
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/motion"
            className="group flex items-center justify-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 px-8 py-4 rounded-full font-semibold hover:bg-zinc-800 dark:hover:bg-white transition-all hover:-translate-y-0.5 w-full sm:w-auto min-w-[160px]"
          >
            <Film className="w-4 h-4" />
            Remotion 动效工作台
          </Link>
          <Link
            href="/app"
            className="group flex items-center justify-center gap-2 border border-zinc-300 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/60 px-7 py-4 rounded-full font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all hover:-translate-y-0.5 w-full sm:w-auto"
          >
            RL 交互沙盒
          </Link>
          <Link
            href="https://github.com/lixumin-zai/Hello-Reinforcement-Learning"
            target="_blank"
            className="group flex items-center justify-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white px-4 py-3 font-medium transition-colors"
          >
            <Github className="w-4 h-4" />
            GitHub
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 w-full max-w-6xl mx-auto px-4 pb-24 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="group flex flex-col items-start text-left p-8 rounded-[2rem] bg-zinc-50/80 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700/50 transition-all backdrop-blur-sm">
          <div className="p-3 rounded-2xl bg-indigo-500/10 mb-6 group-hover:scale-110 transition-all duration-300">
            <Layers className="w-7 h-7 text-indigo-500 dark:text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold mb-3">19 章全景知识框架</h3>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            以 <code className="text-xs">framework.json</code> 为唯一真源驱动全站大纲，遵循 Sutton &amp; Barto 经典符号体系，无缝衔接现代大模型强化学习 (RLHF / DPO / GRPO)。
          </p>
        </div>

        <div className="group flex flex-col items-start text-left p-8 rounded-[2rem] bg-zinc-50/80 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700/50 transition-all backdrop-blur-sm">
          <div className="p-3 rounded-2xl bg-teal-500/10 mb-6 group-hover:scale-110 transition-all duration-300">
            <Cpu className="w-7 h-7 text-teal-500 dark:text-teal-400" />
          </div>
          <h3 className="text-xl font-bold mb-3">浏览器内实时训练</h3>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            内置确定性强化学习算法内核（GridWorld、价值迭代、策略迭代、SARSA、Q-learning、UCB、Thompson 采样），拖动滑块即可实时观察收敛过程。
          </p>
        </div>

        <div className="group flex flex-col items-start text-left p-8 rounded-[2rem] bg-zinc-50/80 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700/50 transition-all backdrop-blur-sm">
          <div className="p-3 rounded-2xl bg-amber-500/10 mb-6 group-hover:scale-110 transition-all duration-300">
            <Film className="w-7 h-7 text-amber-500 dark:text-amber-400" />
          </div>
          <h3 className="text-xl font-bold mb-3">Remotion 动效讲解共奏</h3>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            参考 Vibe Motion 代码动效架构，将 Bellman 备份、TD 误差、PPO 截断与 GRPO 组相对优势转化为可逐帧拖拽、可导出 MP4 的确定性动画。
          </p>
        </div>
      </section>
    </main>
  );
}
