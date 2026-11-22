'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Film, BookOpen, Terminal } from 'lucide-react';
import { motionEntries } from '@/motion/compositions';
import { MotionPlayer } from '@/components/motion/MotionPlayer';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function MotionStudioPage() {
  const [selectedId, setSelectedId] = useState(motionEntries[0]?.id ?? 'agent-env-pulse');
  const current = motionEntries.find((m) => m.id === selectedId) ?? motionEntries[0];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* 顶栏 */}
      <header className="border-b border-border bg-card/70 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Link>
          <span className="text-border">|</span>
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-indigo-500" />
            <span className="font-bold text-sm">Remotion 动作讲解工作台 (Motion Explainer Studio)</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/docs"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            阅读文档
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* 主体：左侧镜头目录 + 右侧实时播放器 */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 max-w-7xl w-full mx-auto gap-6 p-6">
        <aside className="lg:col-span-4 space-y-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              共奏流 · 动作镜头库 ({motionEntries.length} 个可编辑镜头)
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              参考 Vibe Motion 架构，所有镜头由 <code className="text-foreground">useCurrentFrame()</code> 与{' '}
              <code className="text-foreground">src/lib/rl</code> 确定性算法驱动，既可在文档内嵌播放，也可通过 CLI 导出 MP4。
            </p>
          </div>

          <div className="space-y-2 max-h-[72vh] overflow-y-auto pr-1">
            {motionEntries.map((item) => {
              const active = item.id === current?.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full text-left rounded-xl border p-3.5 transition-all ${
                    active
                      ? 'border-indigo-500 bg-indigo-500/10 shadow-sm'
                      : 'border-border bg-card hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-mono text-indigo-500 dark:text-indigo-400">{item.chapter}</span>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {item.durationInFrames}f @ {item.fps}fps
                    </span>
                  </div>
                  <div className="font-semibold text-sm text-foreground">{item.title}</div>
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="lg:col-span-8 flex flex-col gap-4">
          {current && (
            <>
              <MotionPlayer key={current.id} id={current.id} />

              <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-bold text-base">{current.title}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{current.description}</p>
                  </div>
                  <Link
                    href={`/docs/${current.chapter}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3.5 py-1.5 text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    前往对应章节 ({current.chapter})
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-border text-xs font-mono">
                  <div className="rounded-lg bg-muted/60 p-3 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span className="truncate">MDX 内嵌：{`<MotionPlayer id="${current.id}" />`}</span>
                  </div>
                  <div className="rounded-lg bg-muted/60 p-3 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="truncate">导出视频：{`npm run motion:render -- ${current.id}`}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
