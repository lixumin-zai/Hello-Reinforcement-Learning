'use client';

import React, { useState } from 'react';

export function BackupDiagram() {
  const [kind, setKind] = useState<'expectation' | 'optimality'>('expectation');
  const [pi1, setPi1] = useState(0.6);
  const gamma = 0.9;

  // 动作 a1, a2 的备份值
  const q1 = 0.8 * (2 + gamma * 6.5) + 0.2 * (1 + gamma * 7.0); // 7.74
  const q2 = 0.5 * (0 + gamma * 5.0) + 0.5 * (3 + gamma * 4.2); // 5.64
  const pi2 = Number((1 - pi1).toFixed(2));
  const vVal = kind === 'expectation' ? pi1 * q1 + pi2 * q2 : Math.max(q1, q2);

  return (
    <div className="rounded-xl border border-border bg-card p-6 my-6 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          ▶ 切换「Bellman 期望方程」与「Bellman 最优方程」，并调节策略概率 <code>π(a₁|s)</code>：
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setKind('expectation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              kind === 'expectation' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            期望方程 v_π(s) = Σ π·q
          </button>
          <button
            type="button"
            onClick={() => setKind('optimality')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              kind === 'optimality' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            最优方程 v_*(s) = max_a q
          </button>
        </div>
      </div>

      {kind === 'expectation' && (
        <div className="flex items-center gap-3 text-xs">
          <span className="font-mono">π(a₁|s) = {pi1.toFixed(2)}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={pi1}
            onChange={(e) => setPi1(Number(e.target.value))}
            className="flex-1 accent-indigo-500"
          />
          <span className="font-mono">π(a₂|s) = {pi2.toFixed(2)}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="text-xs text-muted-foreground mb-1">动作分支 a₁ (向右)</div>
          <div className="text-lg font-mono font-bold text-indigo-500">q(s, a₁) = {q1.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            0.8×(2+0.9×6.5) + 0.2×(1+0.9×7.0)
          </div>
        </div>

        <div className="rounded-xl border-2 border-purple-500 bg-purple-500/10 p-4">
          <div className="text-xs font-semibold text-purple-400 mb-1">
            {kind === 'expectation' ? '根状态期望价值 v_π(s)' : '根状态最优价值 v_*(s)'}
          </div>
          <div className="text-2xl font-mono font-extrabold">{vVal.toFixed(2)}</div>
          <div className="text-xs font-mono text-muted-foreground mt-1">
            {kind === 'expectation'
              ? `${pi1.toFixed(2)}×${q1.toFixed(2)} + ${pi2.toFixed(2)}×${q2.toFixed(2)}`
              : `max(${q1.toFixed(2)}, ${q2.toFixed(2)})`}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background p-4">
          <div className="text-xs text-muted-foreground mb-1">动作分支 a₂ (向下)</div>
          <div className="text-lg font-mono font-bold text-indigo-500">q(s, a₂) = {q2.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            0.5×(0+0.9×5.0) + 0.5×(3+0.9×4.2)
          </div>
        </div>
      </div>
    </div>
  );
}
