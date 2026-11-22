'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Crown, Eye, EyeOff, FastForward, RotateCcw, Sparkles, Trophy, Zap } from 'lucide-react';
import {
  argmax,
  createRng,
  evolveMeans,
  makeCasinoBandit,
  pullFromMeans,
  runBandit,
} from '@/lib/rl';

type CasinoMode = 'bernoulli' | 'gaussian' | 'nonstationary';

const MACHINES = [
  { name: '樱桃经典', emoji: '🍒', border: 'border-rose-500/50', glow: 'from-rose-500/20 to-rose-950/30', badge: 'text-rose-400' },
  { name: '霓虹闪电', emoji: '⚡', border: 'border-amber-500/50', glow: 'from-amber-500/20 to-amber-950/30', badge: 'text-amber-400' },
  { name: '钻石金库', emoji: '💎', border: 'border-sky-500/50', glow: 'from-sky-500/20 to-sky-950/30', badge: 'text-sky-400' },
  { name: '赤龙秘宝', emoji: '🐉', border: 'border-emerald-500/50', glow: 'from-emerald-500/20 to-emerald-950/30', badge: 'text-emerald-400' },
  { name: '星空矩阵', emoji: '🪐', border: 'border-purple-500/50', glow: 'from-purple-500/20 to-purple-950/30', badge: 'text-purple-400' },
];

const REEL_SYMBOLS = ['🍒', '⚡', '💎', '7️⃣', '🪙', '🍀'];

export function BanditCasinoGame() {
  const [mode, setMode] = useState<CasinoMode>('bernoulli');
  const [totalRounds, setTotalRounds] = useState<30 | 50>(30);
  const [seed, setSeed] = useState(42);
  const [showLiveAI, setShowLiveAI] = useState(false);

  // 人类玩家状态
  const [round, setRound] = useState(0);
  const [counts, setCounts] = useState<number[]>([0, 0, 0, 0, 0]);
  const [estimates, setEstimates] = useState<number[]>([0, 0, 0, 0, 0]);
  const [recentDots, setRecentDots] = useState<number[][]>([[], [], [], [], []]);
  const [humanRewards, setHumanRewards] = useState<number[]>([]);
  const [humanRegret, setHumanRegret] = useState<number[]>([]);
  const [humanActions, setHumanActions] = useState<number[]>([]);
  const [lastPull, setLastPull] = useState<{ arm: number; reward: number; id: number } | null>(null);
  const [spinningArm, setSpinningArm] = useState<number | null>(null);
  const [reels, setReels] = useState<string[][]>(MACHINES.map((m) => [m.emoji, '7️⃣', m.emoji]));

  const env = useMemo(() => makeCasinoBandit(mode, seed), [mode, seed]);

  // 预先按同样环境与漂移轨迹计算每一轮的真实均值序列（保证人类和 4 个 AI 面对完全一致的世界）
  const meansTimeline = useMemo(() => {
    const envRng = createRng(seed * 31 + 17);
    const out: number[][] = [];
    let cur = env.means.slice();
    for (let t = 0; t < totalRounds; t++) {
      if (t > 0 && (env.driftStd || env.shockStep)) {
        cur = evolveMeans(env, cur, t, envRng);
      }
      out.push(cur.slice());
    }
    return out;
  }, [env, totalRounds, seed]);

  // 4 名 AI 选手使用同一环境后台陪跑
  const aiRuns = useMemo(() => {
    const greedy = runBandit(env, { type: 'epsilon-greedy', epsilon: 0 }, totalRounds, seed);
    const epsGreedy = runBandit(env, { type: 'epsilon-greedy', epsilon: 0.12 }, totalRounds, seed);
    const ucb = runBandit(env, { type: 'ucb', c: mode === 'gaussian' ? 1.8 : 0.9 }, totalRounds, seed);
    const thompson = runBandit(env, { type: 'thompson' }, totalRounds, seed);
    return { greedy, epsGreedy, ucb, thompson };
  }, [env, totalRounds, seed, mode]);

  const finished = round >= totalRounds;
  const humanTotal = humanRewards.reduce((a, b) => a + b, 0);
  const humanCumRegret = humanRegret[humanRegret.length - 1] ?? 0;

  const resetGame = (nextMode = mode, nextRounds = totalRounds, nextSeed = seed) => {
    setMode(nextMode);
    setTotalRounds(nextRounds);
    setSeed(nextSeed);
    setRound(0);
    setCounts([0, 0, 0, 0, 0]);
    setEstimates([0, 0, 0, 0, 0]);
    setRecentDots([[], [], [], [], []]);
    setHumanRewards([]);
    setHumanRegret([]);
    setHumanActions([]);
    setLastPull(null);
    setSpinningArm(null);
    setReels(MACHINES.map((m) => [m.emoji, '7️⃣', m.emoji]));
  };

  const pullArm = (arm: number) => {
    if (round >= totalRounds) return;
    const curMeans = meansTimeline[round];
    const rng = createRng(seed * 997 + round * 37 + arm * 13);
    const r = pullFromMeans(env.kind, curMeans, arm, rng);
    const bestMean = Math.max(...curMeans);
    const stepRegret = Math.max(0, bestMean - curMeans[arm]);

    const nextN = counts[arm] + 1;
    const nextQ = estimates[arm] + (r - estimates[arm]) / nextN;

    setCounts((c) => c.map((x, i) => (i === arm ? nextN : x)));
    setEstimates((q) => q.map((x, i) => (i === arm ? nextQ : x)));
    setRecentDots((d) => d.map((arr, i) => (i === arm ? [...arr.slice(-7), r] : arr)));
    setHumanRewards((arr) => [...arr, r]);
    setHumanRegret((arr) => [...arr, (arr[arr.length - 1] ?? 0) + stepRegret]);
    setHumanActions((arr) => [...arr, arm]);
    setRound((t) => t + 1);
    setLastPull({ arm, reward: r, id: round + 1 });
    setSpinningArm(arm);

    // 滚轮符号结果反馈：高奖励三连图标！
    const isWin = env.kind === 'bernoulli' ? r > 0.5 : r >= curMeans[arm];
    setReels((prev) =>
      prev.map((row, i) => {
        if (i !== arm) return row;
        if (isWin) return [MACHINES[arm].emoji, MACHINES[arm].emoji, MACHINES[arm].emoji];
        return [
          REEL_SYMBOLS[(round + arm) % REEL_SYMBOLS.length],
          '✖',
          REEL_SYMBOLS[(round + arm + 2) % REEL_SYMBOLS.length],
        ];
      }),
    );
  };

  // 清除拉杆闪烁动画状态
  useEffect(() => {
    if (spinningArm === null) return;
    const t = setTimeout(() => setSpinningArm(null), 260);
    return () => clearTimeout(t);
  }, [spinningArm]);

  // 自动按当前人类最高估计补完剩余回合（方便想快进看战报的读者）
  const fastForwardRest = () => {
    let rIdx = round;
    const c = counts.slice();
    const q = estimates.slice();
    const dots = recentDots.map((a) => a.slice());
    const rews = humanRewards.slice();
    const regs = humanRegret.slice();
    const acts = humanActions.slice();

    while (rIdx < totalRounds) {
      // 如果还有没试过的机台先试一遍，否则选当前均值最高者
      const untried = c.findIndex((n) => n === 0);
      const a = untried >= 0 ? untried : argmax(q);
      const curMeans = meansTimeline[rIdx];
      const rng = createRng(seed * 997 + rIdx * 37 + a * 13);
      const r = pullFromMeans(env.kind, curMeans, a, rng);
      const bestMean = Math.max(...curMeans);
      c[a]++;
      q[a] += (r - q[a]) / c[a];
      dots[a] = [...dots[a].slice(-7), r];
      rews.push(r);
      regs.push((regs[regs.length - 1] ?? 0) + Math.max(0, bestMean - curMeans[a]));
      acts.push(a);
      rIdx++;
    }
    setCounts(c);
    setEstimates(q);
    setRecentDots(dots);
    setHumanRewards(rews);
    setHumanRegret(regs);
    setHumanActions(acts);
    setRound(totalRounds);
  };

  // 键盘 1–5 快捷键拉动对应机台
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (finished) return;
    const num = Number(e.key);
    if (num >= 1 && num <= 5) {
      e.preventDefault();
      pullArm(num - 1);
    }
  };

  // 终局复盘数据
  const currentStepIdx = Math.max(0, round - 1);
  const competitors = [
    { name: '你 (Human)', color: '#fbbf24', reward: humanTotal, regret: humanCumRegret, series: humanRegret },
    {
      name: 'Thompson 采样',
      color: '#34d399',
      reward: round > 0 ? aiRuns.thompson.cumReward[currentStepIdx] : 0,
      regret: round > 0 ? aiRuns.thompson.regret[currentStepIdx] : 0,
      series: aiRuns.thompson.regret.slice(0, Math.max(1, round)),
    },
    {
      name: 'UCB1 乐观上界',
      color: '#a855f7',
      reward: round > 0 ? aiRuns.ucb.cumReward[currentStepIdx] : 0,
      regret: round > 0 ? aiRuns.ucb.regret[currentStepIdx] : 0,
      series: aiRuns.ucb.regret.slice(0, Math.max(1, round)),
    },
    {
      name: 'ε-greedy (0.12)',
      color: '#6366f1',
      reward: round > 0 ? aiRuns.epsGreedy.cumReward[currentStepIdx] : 0,
      regret: round > 0 ? aiRuns.epsGreedy.regret[currentStepIdx] : 0,
      series: aiRuns.epsGreedy.regret.slice(0, Math.max(1, round)),
    },
    {
      name: '纯贪心 (ε=0)',
      color: '#94a3b8',
      reward: round > 0 ? aiRuns.greedy.cumReward[currentStepIdx] : 0,
      regret: round > 0 ? aiRuns.greedy.regret[currentStepIdx] : 0,
      series: aiRuns.greedy.regret.slice(0, Math.max(1, round)),
    },
  ];
  const ranked = competitors.slice().sort((a, b) => a.regret - b.regret);

  // 人类玩家风格 AI 复盘诊断
  const coachDiagnosis = useMemo(() => {
    if (!finished) return '';
    const untriedCount = counts.filter((n) => n === 0).length;
    const first10Unique = new Set(humanActions.slice(0, 10)).size;
    const finalMeans = meansTimeline[totalRounds - 1];
    const bestFinalArm = argmax(finalMeans);
    const bestArmShare = counts[bestFinalArm] / totalRounds;

    if (untriedCount > 0) {
      return `你有 ${untriedCount} 台机台一次都没碰过！就像纯贪心策略一样，一旦过早认定某台顺手，就会永远错过隐藏的黄金机台。`;
    }
    if (mode === 'nonstationary' && humanActions.slice(25).filter((a) => a === bestFinalArm).length < 4) {
      return '第 25 轮赌场悄悄洗牌了！你还在依赖前 25 轮的旧印象，没能及时察觉赔率反转——这正是 2.2 节「常数步长 α 指数衰减」要解决的核心问题！';
    }
    if (humanCumRegret <= aiRuns.ucb.regret[totalRounds - 1]) {
      return `太强了！你的累积遗憾 (${humanCumRegret.toFixed(2)}) 竟然跑赢了 UCB1 算法！你精准地完成了初期试探（前 10 轮试了 ${first10Unique} 台）并迅速将 ${(bestArmShare * 100).toFixed(0)}% 的火力集中在黄金机台上。`;
    }
    if (bestArmShare < 0.35) {
      return `你非常谨慎（每台都拉了不少次），探索得足够充分，但“利用”阶段的下注还不够果断——UCB 和 Thompson 在确认优劣后会更果断地集中火力。`;
    }
    return `很稳健的博弈直觉！前 10 轮你试探了 ${first10Unique} 台机台，最终把 ${(bestArmShare * 100).toFixed(0)}% 的筹码投给了黄金机台。对比下方曲线，看看数学算法如何进一步压缩初期的探索遗憾。`;
  }, [finished, counts, humanActions, meansTimeline, totalRounds, mode, humanCumRegret, aiRuns.ucb.regret]);

  const maxChartRegret = Math.max(1, ...competitors.flatMap((c) => c.series));

  return (
    <div
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="my-6 rounded-2xl border-2 border-amber-500/35 bg-gradient-to-b from-zinc-950 via-[#150b24] to-zinc-950 text-zinc-100 p-5 md:p-6 shadow-xl space-y-5 outline-none focus:ring-2 focus:ring-amber-400/60 not-prose"
    >
      {/* 顶部霓虹灯牌 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-400/50 px-2.5 py-0.5 text-xs font-bold text-amber-300">
              🎰 霓虹赌场 · 人机多臂老虎机争霸赛
            </span>
            <span className="text-xs font-mono text-purple-300">
              按键盘 1–5 或点击机台拉杆
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            5 台老虎机隐藏着不同真实期望收益 q*(a)。在有限 {totalRounds} 轮内最大化总筹码，同时挑战后台 4 名 RL 算法选手！
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={mode}
            onChange={(e) => resetGame(e.target.value as CasinoMode, totalRounds, seed)}
            className="rounded-lg bg-zinc-900 border border-white/15 px-2.5 py-1.5 text-xs text-zinc-200"
          >
            <option value="bernoulli">🪙 经典胜率赌场 (0/1 伯努利)</option>
            <option value="gaussian">💎 高斯暴击赌场 (连续筹码)</option>
            <option value="nonstationary">🌪️ 非平稳漂移赌场 (第 25 轮洗牌!)</option>
          </select>
          <select
            value={totalRounds}
            onChange={(e) => resetGame(mode, Number(e.target.value) as 30 | 50, seed)}
            className="rounded-lg bg-zinc-900 border border-white/15 px-2.5 py-1.5 text-xs text-zinc-200"
          >
            <option value={30}>30 轮速战</option>
            <option value={50}>50 轮标准赛</option>
          </select>
          <button
            type="button"
            onClick={() => resetGame(mode, totalRounds, seed + 7)}
            className="inline-flex items-center gap-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-white/10 px-2.5 py-1.5 text-xs font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" /> 换新赌场
          </button>
        </div>
      </div>

      {/* 顶部 HUD 仪表盘 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5">
          <div className="text-[11px] text-zinc-400">剩余拉杆次数</div>
          <div className="text-xl font-mono font-extrabold text-amber-300">
            {totalRounds - round} <span className="text-xs text-zinc-500">/ {totalRounds}</span>
          </div>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5">
          <div className="text-[11px] text-zinc-400">你的累计筹码</div>
          <div className="text-xl font-mono font-extrabold text-emerald-400">
            {mode === 'bernoulli' ? `${humanTotal} 🪙` : `${humanTotal.toFixed(1)} 💎`}
          </div>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5">
          <div className="text-[11px] text-zinc-400">当前手气反馈</div>
          <div className="text-sm font-mono font-bold mt-1 truncate">
            {lastPull ? (
              <span className={lastPull.reward > (mode === 'gaussian' ? 2.5 : 0) ? 'text-emerald-400' : 'text-rose-400'}>
                #{lastPull.arm + 1} 号机 → {mode === 'bernoulli' ? (lastPull.reward ? '中奖 +1 🪙' : '未中 0') : `+${lastPull.reward.toFixed(2)}`}
              </span>
            ) : (
              <span className="text-zinc-500">等待开局…</span>
            )}
          </div>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setShowLiveAI((v) => !v)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-purple-300 hover:text-purple-200"
          >
            {showLiveAI ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showLiveAI ? '隐藏 AI 战况' : '偷看 AI 战况'}
          </button>
          {!finished && round > 0 && (
            <button
              type="button"
              onClick={fastForwardRest}
              title="按当前偏好快进至终局结算"
              className="inline-flex items-center gap-1 rounded bg-white/10 hover:bg-white/20 px-2 py-1 text-[11px]"
            >
              <FastForward className="w-3 h-3" /> 快进
            </button>
          )}
        </div>
      </div>

      {/* 非平稳洗牌暗中提示 */}
      {mode === 'nonstationary' && round >= 25 && !finished && (
        <div className="rounded-xl border border-amber-400/40 bg-amber-500/15 px-4 py-2 text-xs text-amber-200 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400 shrink-0" />
          <span>🌪️ <strong>赌场异动</strong>：第 25 轮已过，机台内部赔率已经发生洗牌！你发现原本热门的机台变冷了吗？</span>
        </div>
      )}

      {/* 5 台老虎机主舞台 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {MACHINES.map((m, i) => {
          const isSpinning = spinningArm === i;
          const isBestNow = finished && argmax(meansTimeline[totalRounds - 1]) === i;
          const revealedMean = meansTimeline[Math.max(0, round - 1)][i];
          return (
            <button
              key={m.name}
              type="button"
              disabled={finished}
              onClick={() => pullArm(i)}
              className={`group relative rounded-2xl border bg-gradient-to-b ${m.glow} ${m.border} p-3.5 text-center transition-all ${
                finished ? 'cursor-default' : 'hover:-translate-y-1 hover:shadow-[0_0_24px_-6px_rgba(251,191,36,0.5)] active:scale-95'
              } ${isBestNow ? 'ring-2 ring-amber-400 shadow-[0_0_28px_-4px_rgba(251,191,36,0.75)]' : ''}`}
            >
              {/* 顶部机台编号与皇冠 */}
              <div className="flex items-center justify-between text-[11px] font-mono mb-2">
                <span className="px-1.5 py-0.5 rounded bg-black/40 text-zinc-300">[{i + 1}]</span>
                <span className={`font-bold ${m.badge}`}>{m.name}</span>
                {isBestNow ? <Crown className="w-4 h-4 text-amber-400" /> : <span className="w-4" />}
              </div>

              {/* 三联老虎机滚轮窗口 */}
              <div
                className={`rounded-xl bg-black/75 border border-white/15 py-2.5 px-1.5 flex items-center justify-around text-xl mb-2.5 shadow-inner ${
                  isSpinning ? 'scale-105 border-amber-400' : ''
                }`}
              >
                {reels[i].map((sym, ri) => (
                  <span key={ri} className={isSpinning ? 'animate-bounce' : ''}>
                    {sym}
                  </span>
                ))}
              </div>

              {/* 玩家对该机台的经验估计 HUD */}
              <div className="space-y-1">
                <div className="text-sm font-mono font-extrabold text-white">
                  Q̂ = {counts[i] > 0 ? (mode === 'bernoulli' ? `${(estimates[i] * 100).toFixed(0)}%` : estimates[i].toFixed(2)) : '—'}
                </div>
                <div className="text-[11px] font-mono text-zinc-400">已拉 {counts[i]} 次</div>

                {/* 最近 8 次开奖小圆点 */}
                <div className="flex justify-center gap-1 h-2.5 items-center pt-1">
                  {recentDots[i].map((v, di) => (
                    <span
                      key={di}
                      className={`w-2 h-2 rounded-full ${
                        (mode === 'bernoulli' ? v > 0.5 : v >= 3) ? 'bg-emerald-400' : 'bg-rose-500/80'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* 终局揭晓隐藏真值 */}
              {finished && (
                <div className="mt-2.5 pt-2 border-t border-white/15 text-[11px] font-mono font-bold text-amber-300">
                  真实 q* = {mode === 'bernoulli' ? `${(revealedMean * 100).toFixed(0)}%` : revealedMean.toFixed(2)}
                </div>
              )}

              {!finished && (
                <div className="mt-2.5 rounded-lg bg-amber-400/15 group-hover:bg-amber-400 group-hover:text-zinc-950 text-amber-300 text-[11px] font-bold py-1 transition-colors">
                  拉动摇杆 ↓
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 实时偷看 AI 简表 */}
      {showLiveAI && !finished && round > 0 && (
        <div className="rounded-xl bg-black/40 border border-white/10 p-3.5 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
          {competitors.map((c) => (
            <div key={c.name} className="rounded-lg bg-white/5 px-2.5 py-2">
              <div style={{ color: c.color }} className="font-bold truncate">{c.name}</div>
              <div className="text-zinc-300 mt-0.5">筹码: {c.reward.toFixed(1)}</div>
              <div className="text-zinc-400">遗憾: {c.regret.toFixed(2)}</div>
            </div>
          ))}
        </div>
      )}

      {/* 终局复盘大战报 */}
      {finished && (
        <div className="rounded-2xl border border-amber-400/40 bg-black/55 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-bold text-base text-amber-300">
              <Trophy className="w-5 h-5" />
              <span>终局结算大战报 · 人类 vs 四大 RL 算法（同场同种子公平对决）</span>
            </div>
            <button
              type="button"
              onClick={() => resetGame(mode, totalRounds, seed + 13)}
              className="rounded-lg bg-amber-400 text-zinc-950 px-3.5 py-1.5 text-xs font-bold hover:bg-amber-300"
            >
              再来一局新赌场
            </button>
          </div>

          {/* 教练诊断 */}
          <div className="rounded-xl bg-indigo-500/15 border border-indigo-400/35 px-4 py-3 text-xs text-indigo-100 leading-relaxed flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
            <div>
              <strong>AI 教练复盘：</strong>
              {coachDiagnosis}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* 排名榜单（按累积遗憾从小到大，遗憾越低越强） */}
            <div className="lg:col-span-5 space-y-2">
              {ranked.map((c, idx) => (
                <div
                  key={c.name}
                  className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-mono border ${
                    c.name.startsWith('你')
                      ? 'bg-amber-500/15 border-amber-400/50'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 font-extrabold text-zinc-400">#{idx + 1}</span>
                    <span style={{ color: c.color }} className="font-bold">{c.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 mr-3">收益 {c.reward.toFixed(1)}</span>
                    <span className="text-amber-300 font-bold">遗憾 {c.regret.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 累积遗憾曲线对比 SVG */}
            <div className="lg:col-span-7 rounded-xl bg-zinc-950/90 border border-white/10 p-3">
              <div className="text-[11px] font-mono text-zinc-400 mb-1.5 flex justify-between">
                <span>累积遗憾 Regret(t) 演化曲线（越低越优秀）</span>
                <span>横轴：第 1 → {totalRounds} 轮</span>
              </div>
              <svg viewBox="0 0 520 175" className="w-full h-44">
                {[0.25, 0.5, 0.75, 1].map((g) => (
                  <line
                    key={g}
                    x1={32}
                    y1={155 - g * 135}
                    x2={505}
                    y2={155 - g * 135}
                    stroke="rgba(255,255,255,0.08)"
                    strokeDasharray="3 3"
                  />
                ))}
                {competitors.map((c) => {
                  const pts = c.series
                    .map((v, idx) => {
                      const x = 32 + (idx / Math.max(1, totalRounds - 1)) * 473;
                      const y = 155 - (v / maxChartRegret) * 135;
                      return `${x.toFixed(1)},${y.toFixed(1)}`;
                    })
                    .join(' ');
                  return (
                    <polyline
                      key={c.name}
                      fill="none"
                      stroke={c.color}
                      strokeWidth={c.name.startsWith('你') ? 3.2 : 2}
                      points={pts}
                    />
                  );
                })}
                <text x={4} y={24} fill="#94a3b8" fontSize={10}>
                  {maxChartRegret.toFixed(1)}
                </text>
                <text x={14} y={158} fill="#94a3b8" fontSize={10}>
                  0
                </text>
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
