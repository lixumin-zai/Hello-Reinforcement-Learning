'use client';

import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { createRng, drawCard, evalHand, type CardItem } from '@/lib/rl';

interface StepItem {
  pSum: number;
  dShow: number;
  usableAce: boolean;
  action: 'HIT' | 'STICK';
}

export function BlackjackGameLab() {
  const [deckSeed, setDeckSeed] = useState(101);
  const [drawIdx, setDrawIdx] = useState(0);
  const [playerCards, setPlayerCards] = useState<CardItem[]>(() => {
    const rng = createRng(101);
    return [drawCard(rng), drawCard(rng)];
  });
  const [dealerCards, setDealerCards] = useState<CardItem[]>(() => {
    const rng = createRng(202);
    return [drawCard(rng), drawCard(rng)];
  });
  const [phase, setPhase] = useState<'player' | 'done'>('player');
  const [outcome, setOutcome] = useState<{ text: string; reward: number } | null>(null);
  const [steps, setSteps] = useState<StepItem[]>([]);
  const [record, setRecord] = useState({ win: 0, draw: 0, lose: 0 });

  const pEval = evalHand(playerCards);
  const dEval = evalHand(dealerCards);
  const dealerShowVal = dealerCards[0]?.value === 1 ? 1 : dealerCards[0]?.value ?? 10;

  const dealNew = (nextSeed = deckSeed + 17) => {
    const rngP = createRng(nextSeed);
    const rngD = createRng(nextSeed + 999);
    setDeckSeed(nextSeed);
    setDrawIdx(0);
    setPlayerCards([drawCard(rngP), drawCard(rngP)]);
    setDealerCards([drawCard(rngD), drawCard(rngD)]);
    setPhase('player');
    setOutcome(null);
    setSteps([]);
  };

  const finish = (reward: number, text: string) => {
    setPhase('done');
    setOutcome({ reward, text });
    setRecord((r) => ({
      win: r.win + (reward > 0 ? 1 : 0),
      draw: r.draw + (reward === 0 ? 1 : 0),
      lose: r.lose + (reward < 0 ? 1 : 0),
    }));
  };

  const hit = () => {
    if (phase !== 'player') return;
    const rng = createRng(deckSeed * 31 + drawIdx + 7);
    const nextCard = drawCard(rng);
    setDrawIdx((i) => i + 1);
    setSteps((prev) => [...prev, { pSum: pEval.sum, dShow: dealerShowVal, usableAce: pEval.usableAce, action: 'HIT' }]);
    const nextHand = [...playerCards, nextCard];
    setPlayerCards(nextHand);
    const ev = evalHand(nextHand);
    if (ev.bust) finish(-1, `爆牌 (${ev.sum} 点)！本局奖励 R = -1`);
  };

  const stick = () => {
    if (phase !== 'player') return;
    setSteps((prev) => [...prev, { pSum: pEval.sum, dShow: dealerShowVal, usableAce: pEval.usableAce, action: 'STICK' }]);
    const dHand = dealerCards.slice();
    let dCount = 0;
    while (evalHand(dHand).sum < 17) {
      const rng = createRng(deckSeed * 43 + dCount + 500);
      dHand.push(drawCard(rng));
      dCount++;
    }
    setDealerCards(dHand);
    const dFinal = evalHand(dHand);
    if (dFinal.bust) finish(+1, `庄家爆牌 (${dFinal.sum} 点)！你赢了 R = +1`);
    else if (pEval.sum > dFinal.sum) finish(+1, `你 ${pEval.sum} 点击败庄家 ${dFinal.sum} 点！R = +1`);
    else if (pEval.sum < dFinal.sum) finish(-1, `庄家 ${dFinal.sum} 点胜过你的 ${pEval.sum} 点，R = -1`);
    else finish(0, `双方同为 ${pEval.sum} 点平局！R = 0`);
  };

  return (
    <div className="my-6 rounded-2xl border-2 border-amber-500/40 bg-gradient-to-b from-[#0b3325] via-[#07261c] to-[#051c14] text-emerald-50 p-5 md:p-6 shadow-xl space-y-5 not-prose">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-400/20 pb-3">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 border border-amber-300/40 px-2.5 py-0.5 text-xs font-bold text-amber-200">
            🃏 21 点实战牌桌 · 体验蒙特卡洛回合轨迹
          </span>
          <p className="text-xs text-emerald-200/80 mt-1">
            庄家规则固定（小于 17 必补牌）。仔细留意右上角的 <strong>MDP 状态三元组</strong>：每次选择都会被录成样本，回合结束瞬间统一回填胜负奖励！
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-emerald-300">胜 {record.win}</span>
          <span className="text-amber-300">平 {record.draw}</span>
          <span className="text-rose-300">负 {record.lose}</span>
        </div>
      </div>

      {/* 牌桌区 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 庄家手牌 */}
        <div className="rounded-xl bg-black/25 border border-emerald-400/20 p-4 space-y-3">
          <div className="flex justify-between text-xs font-mono">
            <span className="font-bold text-amber-200">🎩 庄家 Dealer</span>
            <span>{phase === 'done' ? `点数: ${dEval.sum}` : `明牌: ${dealerCards[0]?.rank} (+1 暗牌)`}</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {dealerCards.map((c, i) => (
              <PlayingCard key={i} card={c} hidden={phase === 'player' && i === 1} />
            ))}
          </div>
        </div>

        {/* 玩家手牌 */}
        <div className="rounded-xl bg-black/25 border border-amber-400/30 p-4 space-y-3">
          <div className="flex justify-between text-xs font-mono">
            <span className="font-bold text-emerald-300">🧑 你的手牌 Player</span>
            <span>
              当前点数: <strong className="text-amber-300 text-sm">{pEval.sum}</strong>{' '}
              {pEval.usableAce && <span className="text-teal-300">(含可用 A!)</span>}
            </span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {playerCards.map((c, i) => (
              <PlayingCard key={i} card={c} />
            ))}
          </div>
        </div>
      </div>

      {/* 当前状态三元组 + 操作按钮 */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-black/30 border border-white/10 px-4 py-3">
        <div className="text-xs font-mono">
          当前 RL 状态 <code className="text-amber-300">S_t = (玩家={pEval.sum}, 庄家明牌={dealerShowVal === 1 ? 'A' : dealerShowVal}, 可用A={pEval.usableAce ? 'True' : 'False'})</code>
        </div>

        <div className="flex gap-2">
          {phase === 'player' ? (
            <>
              <button
                type="button"
                onClick={hit}
                className="rounded-lg bg-amber-400 text-zinc-950 px-4 py-2 text-xs font-extrabold hover:bg-amber-300 transition-colors"
              >
                要牌 (HIT)
              </button>
              <button
                type="button"
                onClick={stick}
                className="rounded-lg bg-emerald-500 text-zinc-950 px-4 py-2 text-xs font-extrabold hover:bg-emerald-400 transition-colors"
              >
                停牌开奖 (STICK)
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => dealNew()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 text-zinc-950 px-4 py-2 text-xs font-extrabold hover:bg-amber-300"
            >
              <RotateCcw className="w-3.5 h-3.5" /> 发下一局新牌
            </button>
          )}
        </div>
      </div>

      {/* 回合结算 + MC 轨迹回填展示 */}
      {outcome && (
        <div className="rounded-xl bg-black/40 border border-amber-400/35 p-4 space-y-2 text-xs font-mono">
          <div className={`font-bold text-sm ${outcome.reward > 0 ? 'text-emerald-300' : outcome.reward < 0 ? 'text-rose-300' : 'text-amber-200'}`}>
            {outcome.text}
          </div>
          <div className="text-emerald-200/80">
            蒙特卡洛反向回填（γ = 1，本局所有决策点都收到完整终局回报 G = {outcome.reward > 0 ? `+${outcome.reward}` : outcome.reward}）：
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {steps.map((st, idx) => (
              <span key={idx} className="rounded-lg bg-emerald-950/90 border border-emerald-400/30 px-2.5 py-1 text-[11px]">
                Q(点{st.pSum}, 庄{st.dShow}, {st.usableAce ? '软A' : '硬'}, <strong>{st.action}</strong>) ← 融入 G={outcome.reward}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PlayingCard({ card, hidden = false }: { card: CardItem; hidden?: boolean }) {
  if (hidden) {
    return (
      <div className="w-14 h-20 rounded-xl bg-gradient-to-br from-indigo-700 to-indigo-950 border-2 border-amber-300/60 flex items-center justify-center shadow-md text-xl">
        🂠
      </div>
    );
  }
  const red = card.suit === '♥' || card.suit === '♦';
  return (
    <div
      className={`w-14 h-20 rounded-xl bg-amber-50 border border-zinc-300 shadow-md flex flex-col items-center justify-between p-1.5 font-mono font-extrabold ${
        red ? 'text-rose-600' : 'text-zinc-900'
      }`}
    >
      <div className="self-start text-xs leading-none">{card.rank}</div>
      <div className="text-2xl leading-none">{card.suit}</div>
      <div className="self-end text-xs leading-none">{card.rank}</div>
    </div>
  );
}
