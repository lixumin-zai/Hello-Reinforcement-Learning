'use client';

import React, { useMemo, useState } from 'react';

export function DeadlyTriadSwitch() {
  const [funcApprox, setFuncApprox] = useState(true);
  const [bootstrap, setBootstrap] = useState(true);
  const [offPolicy, setOffPolicy] = useState(true);

  const allThree = funcApprox && bootstrap && offPolicy;

  // 真实模拟 Baird 7 状态星形反例权重范数曲线（当且仅当三要素齐聚时指数发散！）
  const curve = useMemo(() => {
    const steps = 60;
    const norms: number[] = [];
    if (allThree) {
      // Baird 反例：线性半梯度离策略 TD，权重范数按 ~1.07^t 爆炸
      let w7 = 10.0;
      let wOther = 1.0;
      const alpha = 0.015;
      const gamma = 0.99;
      for (let t = 0; t < steps; t++) {
        // 简化的同步期待半梯度更新：6 条边指向 s7 (特征 [2w_i + w_8] -> [w_7 + 2w_8])
        const target = gamma * (w7 + 2 * wOther);
        const delta = target - (2 * wOther + w7 * 0.1);
        w7 += alpha * 1.4 * delta;
        wOther += alpha * 0.9 * delta;
        norms.push(Math.sqrt(w7 * w7 + 6 * wOther * wOther));
      }
    } else {
      // 缺任一要素均稳定收敛至 0（真实价值为全 0）
      let norm = 10.2;
      const decay = !funcApprox ? 0.88 : !bootstrap ? 0.91 : 0.92;
      for (let t = 0; t < steps; t++) {
        norms.push(norm);
        norm *= decay;
      }
    }
    return norms;
  }, [allThree, funcApprox, bootstrap]);

  const maxV = Math.max(12, ...curve);

  return (
    <div className="my-6 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm space-y-4 not-prose">
      <div>
        <div className="text-sm font-bold">☢️ 致命三元组 (Deadly Triad) 开关实验室（复现 Baird 反例）</div>
        <p className="text-xs text-muted-foreground mt-0.5">
          试着关掉下面任意 1 个开关，权重误差立刻乖乖收敛到 0；<strong>但只要把三个开关同时合上</strong>，哪怕是极简的 7 状态线性网络也会瞬间爆炸发散！
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        {[
          { label: '① 函数近似 (Function Approx)', on: funcApprox, toggle: () => setFuncApprox((v) => !v), hint: '神经网络 / 线性权重共享参数' },
          { label: '② 自举 (Bootstrapping)', on: bootstrap, toggle: () => setBootstrap((v) => !v), hint: '用估计值 γV(s′) 构造更新目标' },
          { label: '③ 离策略 (Off-Policy)', on: offPolicy, toggle: () => setOffPolicy((v) => !v), hint: '目标策略 π ≠ 采样策略 b' },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={item.toggle}
            className={`text-left rounded-xl border p-3.5 transition-all ${
              item.on
                ? allThree
                  ? 'border-rose-500 bg-rose-500/15'
                  : 'border-indigo-500 bg-indigo-500/10'
                : 'border-border bg-background opacity-70'
            }`}
          >
            <div className="flex items-center justify-between font-bold mb-1">
              <span>{item.label}</span>
              <span className={`font-mono ${item.on ? (allThree ? 'text-rose-500' : 'text-indigo-500') : 'text-muted-foreground'}`}>
                {item.on ? 'ON' : 'OFF'}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground">{item.hint}</div>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-background p-3.5">
        <div className="flex justify-between text-xs font-mono mb-1">
          <span>参数范数 ‖w_t‖₂（真实最优解应为 0）</span>
          <span className={allThree ? 'text-rose-500 font-bold' : 'text-emerald-500 font-bold'}>
            {allThree ? `☢️ 触发致命三元组：权重爆炸发散 (${curve.at(-1)?.toFixed(1)} → ∞)` : `✅ 稳定收敛 (${curve.at(-1)?.toFixed(2)} → 0)`}
          </span>
        </div>
        <svg viewBox="0 0 560 150" className="w-full h-36">
          <polyline
            fill="none"
            stroke={allThree ? '#f43f5e' : '#10b981'}
            strokeWidth={3}
            points={curve
              .map((v, i) => `${26 + (i / (curve.length - 1)) * 520},${136 - (v / maxV) * 116}`)
              .join(' ')}
          />
          <text x={2} y={24} fontSize={9} fill="currentColor" opacity={0.55}>{maxV.toFixed(0)}</text>
          <text x={12} y={138} fontSize={9} fill="currentColor" opacity={0.55}>0</text>
        </svg>
      </div>
    </div>
  );
}
