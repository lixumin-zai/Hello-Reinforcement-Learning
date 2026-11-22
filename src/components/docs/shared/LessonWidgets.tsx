'use client';

import React, { useState } from 'react';
import { CheckCircle2, HelpCircle, Lightbulb, BookOpen, Clock } from 'lucide-react';

export function LessonHeader({
  difficulty,
  time = '15 分钟',
  prereqs = [],
  goals = [],
}: {
  difficulty: 1 | 2 | 3 | 4 | 5;
  time?: string;
  prereqs?: string[];
  goals?: string[];
}) {
  const labels = ['', '入门直觉', '基础博弈', '数学核心', '深度进阶', '前沿硬核'];
  const colors = [
    '',
    'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30',
    'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
  ];

  return (
    <div className="my-5 rounded-xl border border-border bg-card/70 p-4 space-y-3 not-prose">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-semibold ${colors[difficulty]}`}>
          {'★'.repeat(difficulty)}
          {'☆'.repeat(5 - difficulty)} · {labels[difficulty]}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-0.5 text-muted-foreground">
          <Clock className="w-3 h-3" /> 预计精读 + 实验 {time}
        </span>
        {prereqs.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-0.5 text-muted-foreground">
            <BookOpen className="w-3 h-3" /> 前置：{prereqs.join(' · ')}
          </span>
        )}
      </div>

      {goals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-xs text-muted-foreground">
          {goals.map((g, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
              <span>{g}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export function QuizBox({ title = '本节自测：检验你是否真的理解了', questions }: { title?: string; questions: QuizQuestion[] }) {
  const [picks, setPicks] = useState<Record<number, number>>({});

  return (
    <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-5 shadow-sm not-prose">
      <div className="flex items-center gap-2 font-bold text-base text-foreground">
        <HelpCircle className="w-5 h-5 text-indigo-500" />
        <span>{title}</span>
      </div>

      <div className="space-y-5">
        {questions.map((q, qi) => {
          const picked = picks[qi];
          const answered = picked !== undefined;
          const correct = picked === q.answerIndex;
          return (
            <div key={qi} className="rounded-xl border border-border bg-background p-4 space-y-3">
              <div className="text-sm font-semibold text-foreground">
                Q{qi + 1}. {q.question}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options.map((opt, oi) => {
                  let cls = 'border-border bg-card hover:bg-muted/70 text-foreground';
                  if (answered) {
                    if (oi === q.answerIndex) cls = 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold';
                    else if (oi === picked) cls = 'border-rose-500 bg-rose-500/15 text-rose-700 dark:text-rose-300';
                    else cls = 'border-border bg-card/40 text-muted-foreground opacity-70';
                  }
                  return (
                    <button
                      key={oi}
                      type="button"
                      onClick={() => setPicks((p) => ({ ...p, [qi]: oi }))}
                      className={`text-left rounded-lg border px-3 py-2 text-xs transition-colors ${cls}`}
                    >
                      <span className="font-mono font-bold mr-1.5">{String.fromCharCode(65 + oi)}.</span>
                      {opt}
                    </button>
                  );
                })}
              </div>
              {answered && (
                <div
                  className={`rounded-lg px-3.5 py-2.5 text-xs leading-relaxed flex items-start gap-2 ${
                    correct
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-500/10 text-amber-800 dark:text-amber-300'
                  }`}
                >
                  <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong>{correct ? '回答正确！' : `正确答案是 ${String.fromCharCode(65 + q.answerIndex)}。`}</strong>{' '}
                    {q.explanation}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
