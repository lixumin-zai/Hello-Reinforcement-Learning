'use client';

import React, { useMemo, useState } from 'react';
import { Crosshair, FastForward, RotateCcw } from 'lucide-react';
import { argmax, betaPdf, createRng, sampleBeta } from '@/lib/rl';

const TRUE_PROBS = [0.28, 0.52, 0.76, 0.42];
const ARM_META = [
  { name: '臂 #1', color: '#f43f5e' },
  { name: '臂 #2', color: '#f59e0b' },
  { name: '臂 #3 (★最优)', color: '#10b981' },
  { name: '臂 #4', color: '#6366f1' },
];

export function ThompsonBetaArena() {
  const [alpha, setAlpha] = useState([1, 1, 1, 1]);
  const [beta, setBeta] = useState([1, 1, 1, 1]);
  const [step, setStep] = useState(0);
  const [darts, setDarts] = useState<number[] | null>(null);
  const [lastOutcome, setLastOutcome] = useState<{ arm: number; reward: number } | null>(null);
  const [ucbC, setUcbC] = useState(1.0);

  const runSteps = (count: number) => {
    const a = alpha.slice();
    const b = beta.slice();
    let curStep = step;
    let lastDarts: number[] = [];
    let lastArm = 0;
    let lastR = 0;

    for (let k = 0; k < count; k++) {
      const rng = createRng(404 + curStep * 53);
      const samples = a.map((al, i) => sampleBeta(rng, al, b[i]));
      const chosen = argmax(samples);
      const r = rng() < TRUE_PROBS[chosen] ? 1 : 0;
      a[chosen] += r;
      b[chosen] += 1 - r;
      lastDarts = samples;
      lastArm = chosen;
      lastR = r;
      curStep++;
    }
    setAlpha(a);
    setBeta(b);
    setStep(curStep);
    setDarts(lastDarts);
    setLastOutcome({ arm: lastArm, reward: lastR });
  };

  const reset = () => {
    setAlpha([1, 1, 1, 1]);
    setBeta([1, 1, 1, 1]);
    setStep(0);
    setDarts(null);
    setLastOutcome(null);
  };

  // 计算 4 条精确 Beta PDF 曲线（100 个采样点）
  const { paths, maxY } = useMemo(() => {
    const xs = Array.from({ length: 101 }, (_, i) => i / 100);
    const ysPerArm = alpha.map((al, idx) => xs.map((x) => betaPdf(x, al, beta[idx])));
    const peak = Math.max(2.5, ...ysPerArm.flat());
    const W = 620;
    const H = 200;
    const padL = 32;
    const padR = 16;
    const padB = 26;
    const padT = 14;
    const built = ysPerArm.map((ys) => {
      const pts = ys.map((y, i) => {
        const px = padL + (i / 100) * (W - padL - padR);
        const py = H - padB - (y / peak) * (H - padT - padB);
        return `${px.toFixed(1)},${py.toFixed(1)}`;
      });
      const line = pts.join(' ');
      const area = `${padL},${H - padB} ${line} ${W - padR},${H - padB}`;
      return { line, area };
    });
    return { paths: built, maxY: peak };
  }, [alpha, beta]);

  const xToSvg = (x: number) => 32 + x * (620 - 32 - 16);

  return (
    <div className="my-6 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm space-y-4 not-prose">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-bold">🎯 Thompson Sampling 真实 Beta(α, β) 密度曲线 + UCB 置信气压计对照</div>
          <p className="text-xs text-muted-foreground mt-0.5">
            点击「发射采样飞镖」：系统从每条 Beta 曲线中各掷出一支飞镖 θ̃_a，最靠右的飞镖赢得拉臂权，随后按胜负重塑该曲线！
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => runSteps(1)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 text-white px-3.5 py-1.5 text-xs font-semibold hover:bg-indigo-600"
          >
            <Crosshair className="w-3.5 h-3.5" /> 发射采样飞镖 (+1 步)
          </button>
          <button
            type="button"
            onClick={() => runSteps(10)}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted"
          >
            <FastForward className="w-3.5 h-3.5" /> +10 步
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-3.5 h-3.5" /> 重置先验
          </button>
        </div>
      </div>

      {/* 精确 SVG Beta PDF 曲线图 */}
      <div className="rounded-xl border border-border bg-background p-3">
        <div className="flex justify-between text-[11px] font-mono text-muted-foreground mb-1">
          <span>步数 t = {step} · 纵轴：后验概率密度 p(θ | D)，峰值 {maxY.toFixed(1)}</span>
          {lastOutcome && (
            <span className={lastOutcome.reward ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
              上次飞镖命中 臂 #{lastOutcome.arm + 1} → {lastOutcome.reward ? '中奖 (+1, α++)' : '未中 (0, β++)'}
            </span>
          )}
        </div>

        <svg viewBox="0 0 620 205" className="w-full h-56">
          {/* 坐标底轴与刻度 */}
          <line x1={32} y1={174} x2={604} y2={174} stroke="currentColor" opacity={0.25} />
          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <g key={v}>
              <line x1={xToSvg(v)} y1={14} x2={xToSvg(v)} y2={174} stroke="currentColor" opacity={0.07} />
              <text x={xToSvg(v)} y={192} textAnchor="middle" fontSize={10} fill="currentColor" opacity={0.6}>
                {v.toFixed(2)}
              </text>
            </g>
          ))}

          {/* 4 条真实 Beta 密度曲线 + 填充 */}
          {paths.map((p, i) => (
            <g key={i}>
              <polygon points={p.area} fill={ARM_META[i].color} opacity={0.14} />
              <polyline fill="none" stroke={ARM_META[i].color} strokeWidth={2.5} points={p.line} />
              {/* 真实胜率 q*(a) 底部小三角标记 */}
              <polygon
                points={`${xToSvg(TRUE_PROBS[i])},174 ${xToSvg(TRUE_PROBS[i]) - 4},181 ${xToSvg(TRUE_PROBS[i]) + 4},181`}
                fill={ARM_META[i].color}
              />
            </g>
          ))}

          {/* 本轮发射的 4 支采样飞镖 θ̃_a */}
          {darts &&
            darts.map((val, i) => {
              const cx = xToSvg(val);
              const winner = lastOutcome?.arm === i;
              return (
                <g key={`dart-${i}`}>
                  <line
                    x1={cx}
                    y1={18}
                    x2={cx}
                    y2={174}
                    stroke={ARM_META[i].color}
                    strokeWidth={winner ? 2.6 : 1.4}
                    strokeDasharray={winner ? 'none' : '4 3'}
                  />
                  <circle cx={cx} cy={winner ? 24 : 42} r={winner ? 6 : 4} fill={ARM_META[i].color} />
                </g>
              );
            })}
        </svg>
      </div>

      {/* 同期 UCB 置信气压计对照 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold">同期观测下的 UCB1 置信上界气压计对照（均值 + 不确定性 Bonus）</span>
          <div className="flex items-center gap-2 font-mono">
            <span>c = {ucbC.toFixed(1)}</span>
            <input type="range" min={0.2} max={2} step={0.1} value={ucbC} onChange={(e) => setUcbC(Number(e.target.value))} className="w-24 accent-purple-500" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs font-mono">
          {ARM_META.map((m, i) => {
            const n = alpha[i] + beta[i] - 2;
            const qHat = n > 0 ? (alpha[i] - 1) / n : 0.5;
            const bonus = n > 0 ? ucbC * Math.sqrt(Math.log(Math.max(2, step)) / n) : 1;
            const ucb = Math.min(1.8, qHat + bonus);
            return (
              <div key={m.name} className="rounded-xl border border-border bg-background p-3 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span style={{ color: m.color }} className="font-bold">{m.name}</span>
                  <span className="text-[10px] text-muted-foreground">Beta({alpha[i]},{beta[i]})</span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  N={n} · Q̂={qHat.toFixed(2)} · UCB={ucb.toFixed(2)}
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden flex">
                  <div style={{ width: `${Math.min(100, qHat * 65)}%`, backgroundColor: m.color }} className="h-full" />
                  <div style={{ width: `${Math.min(100 - qHat * 65, bonus * 65)}%`, backgroundColor: m.color, opacity: 0.35 }} className="h-full" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
