'use client';

import React, { useMemo, useState } from 'react';
import { GridWorld, PRESETS, argmax, createRng, randInt } from '@/lib/rl';

function runDynaQ(env: GridWorld, planningSteps: number, episodes = 30, seed = 42): number[] {
  const rng = createRng(seed);
  const Q = Array.from({ length: env.nS }, () => Array(4).fill(0));
  const model = new Map<string, { next: number; reward: number; done: boolean }>();
  const seenKeys: { s: number; a: number }[] = [];
  const seenSet = new Set<string>();
  const lengths: number[] = [];

  for (let ep = 0; ep < episodes; ep++) {
    let s = env.startState();
    let steps = 0;
    for (; steps < 400; steps++) {
      const a = rng() < 0.1 ? randInt(rng, 4) : argmax(Q[s], rng);
      const { next, reward, done } = env.step(s, a, rng);
      Q[s][a] += 0.25 * (reward + (done ? 0 : 0.95 * Math.max(...Q[next])) - Q[s][a]);

      // 1. 学习确定性环境模型 M(s, a) -> (s', r)
      const k = `${s},${a}`;
      model.set(k, { next, reward, done });
      if (!seenSet.has(k)) {
        seenSet.add(k);
        seenKeys.push({ s, a });
      }

      // 2. 脑内想象规划 n 步（不消耗任何真实环境交互！）
      for (let p = 0; p < planningSteps; p++) {
        const pick = seenKeys[randInt(rng, seenKeys.length)];
        const m = model.get(`${pick.s},${pick.a}`)!;
        Q[pick.s][pick.a] += 0.25 * (m.reward + (m.done ? 0 : 0.95 * Math.max(...Q[m.next])) - Q[pick.s][pick.a]);
      }

      s = next;
      if (done) break;
    }
    lengths.push(steps + 1);
  }
  return lengths;
}

export function DynaQPlannerLab() {
  const [nPlan, setNPlan] = useState(25);
  const env = useMemo(() => new GridWorld(PRESETS.maze()), []);

  const { pureQ, plan5, customPlan } = useMemo(
    () => ({
      pureQ: runDynaQ(env, 0, 28, 7),
      plan5: runDynaQ(env, 5, 28, 7),
      customPlan: runDynaQ(env, nPlan, 28, 7),
    }),
    [env, nPlan],
  );

  const maxSteps = 320;
  const toPts = (arr: number[]) =>
    arr
      .map((v, i) => `${36 + (i / (arr.length - 1)) * 535},${156 - (Math.min(maxSteps, v) / maxSteps) * 136}`)
      .join(' ');

  return (
    <div className="my-6 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm space-y-4 not-prose">
      <div>
        <div className="text-sm font-bold">🌀 6×9 Dyna Maze 实战对照（复现 Sutton &amp; Barto 图 8.2）：脑内想象提速 5 倍！</div>
        <p className="text-xs text-muted-foreground mt-0.5">
          每与真实迷宫交互 1 步，在记忆模型里脑补规划 <code>n</code> 步。观察为什么 <code>n = 0</code>（纯无模型 Q-learning）第 15 回合还在绕远路，而 <code>n = {nPlan}</code> 第 3 回合就已锁定 14 步最短路线！
        </p>
      </div>

      <div className="flex items-center gap-3 text-xs font-mono">
        <span>你的脑内规划步数 n = <strong className="text-emerald-500">{nPlan}</strong></span>
        <input type="range" min={1} max={50} step={1} value={nPlan} onChange={(e) => setNPlan(Number(e.target.value))} className="flex-1 accent-emerald-500" />
      </div>

      <div className="rounded-xl border border-border bg-background p-3">
        <div className="flex flex-wrap justify-between text-xs font-mono mb-1">
          <span className="text-muted-foreground">纵轴：每回合走完迷宫所需步数（越低收敛越快）</span>
          <span>
            <span className="text-rose-500 font-bold mr-3">■ n=0 纯 Q-learning (第10局:{pureQ[9]}步)</span>
            <span className="text-indigo-500 font-bold mr-3">■ n=5 (第10局:{plan5[9]}步)</span>
            <span className="text-emerald-500 font-bold">■ n={nPlan} (第10局:{customPlan[9]}步)</span>
          </span>
        </div>
        <svg viewBox="0 0 590 170" className="w-full h-44">
          <polyline fill="none" stroke="#f43f5e" strokeWidth={2.2} points={toPts(pureQ)} />
          <polyline fill="none" stroke="#6366f1" strokeWidth={2.4} points={toPts(plan5)} />
          <polyline fill="none" stroke="#10b981" strokeWidth={3} points={toPts(customPlan)} />
          <text x={2} y={24} fontSize={9} fill="currentColor" opacity={0.55}>320步</text>
          <text x={8} y={158} fontSize={9} fill="currentColor" opacity={0.55}>14步</text>
        </svg>
      </div>
    </div>
  );
}
