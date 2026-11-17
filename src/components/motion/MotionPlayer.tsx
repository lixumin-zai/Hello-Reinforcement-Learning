'use client';

import React, { useMemo, useRef, useState } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { Film, Play, Pause, RotateCcw, Gauge } from 'lucide-react';
import { motionEntries } from '@/motion/compositions';

export interface MotionPlayerProps {
  /** 对应 src/motion/compositions 中注册的 MotionEntry.id */
  id: string;
  /** 可选覆盖标题 */
  title?: string;
  /** 是否默认自动循环播放 */
  autoPlay?: boolean;
}

const RATES = [0.5, 1, 1.5, 2] as const;

export function MotionPlayer({ id, title, autoPlay = true }: MotionPlayerProps) {
  const entry = useMemo(() => motionEntries.find((m) => m.id === id), [id]);
  const playerRef = useRef<PlayerRef>(null);
  const [playing, setPlaying] = useState(autoPlay);
  const [rateIdx, setRateIdx] = useState(1);

  if (!entry) {
    return (
      <div className="my-6 rounded-xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
        🎬 动效 <code className="text-foreground">{id}</code> 尚未在 <code>src/motion/compositions</code> 注册。
      </div>
    );
  }

  const playbackRate = RATES[rateIdx];

  const togglePlay = () => {
    const p = playerRef.current;
    if (!p) return;
    if (playing) {
      p.pause();
      setPlaying(false);
    } else {
      p.play();
      setPlaying(true);
    }
  };

  const restart = () => {
    const p = playerRef.current;
    if (!p) return;
    p.seekTo(0);
    p.play();
    setPlaying(true);
  };

  return (
    <div className="my-6 rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      {/* 顶部工具栏 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-xs font-semibold text-indigo-500 dark:text-indigo-400">
            <Film className="h-3.5 w-3.5" />
            Remotion 动作讲解
          </span>
          <span className="font-semibold text-sm text-foreground truncate">{title ?? entry.title}</span>
          <span className="hidden sm:inline text-xs text-muted-foreground truncate">— {entry.description}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={togglePlay}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {playing ? '暂停' : '播放'}
          </button>
          <button
            type="button"
            onClick={restart}
            title="从头播放"
            className="inline-flex items-center rounded-md border border-border bg-background p-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setRateIdx((i) => (i + 1) % RATES.length)}
            title="切换倍速"
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Gauge className="h-3 w-3" />
            {playbackRate}x
          </button>
        </div>
      </div>

      {/* Remotion Player 画布 */}
      <div className="relative w-full bg-[#090d16]">
        <Player
          ref={playerRef}
          component={entry.component}
          inputProps={entry.defaultProps ?? {}}
          durationInFrames={entry.durationInFrames}
          fps={entry.fps}
          compositionWidth={entry.width}
          compositionHeight={entry.height}
          playbackRate={playbackRate}
          loop
          autoPlay={autoPlay}
          controls
          acknowledgeRemotionLicense
          style={{ width: '100%', aspectRatio: `${entry.width} / ${entry.height}` }}
        />
      </div>
    </div>
  );
}
