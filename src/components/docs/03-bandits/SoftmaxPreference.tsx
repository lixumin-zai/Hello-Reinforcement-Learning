'use client';

import React, { useState } from 'react';
import { softmax } from '@/lib/rl';

export function SoftmaxPreference() {
  const [prefs, setPrefs] = useState([1.5, 0.5, -0.5, 0.0]);
  const [temp, setTemp] = useState(1.0);

  const probs = softmax(prefs, temp);

  return (
    <div className="rounded-xl border border-border bg-card p-6 my-6 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          ▶ 调整各动作偏好值 <code>H_t(a)</code> 与温度参数 <code>τ</code>，观察 Softmax 策略分布 <code>π_t(a)</code>：
        </p>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span>温度 τ = {temp.toFixed(2)}</span>
          <input
            type="range"
            min={0.2}
            max={3.0}
            step={0.1}
            value={temp}
            onChange={(e) => setTemp(Number(e.target.value))}
            className="w-28 accent-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {prefs.map((h, i) => (
          <div key={i} className="rounded-xl border border-border bg-background p-3.5 space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span>动作 a_{i + 1}</span>
              <span className="font-bold text-indigo-500">π = {(probs[i] * 100).toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min={-3}
              max={3}
              step={0.1}
              value={h}
              onChange={(e) =>
                setPrefs((p) => p.map((v, idx) => (idx === i ? Number(e.target.value) : v)))
              }
              className="w-full accent-indigo-500"
            />
            <div className="text-[11px] font-mono text-muted-foreground">偏好 H = {h.toFixed(1)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
