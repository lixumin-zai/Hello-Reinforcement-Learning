import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { MOTION_THEME, type MotionBeat } from './theme';
import { activeBeat, fadeIn } from './primitives';

export interface StageProps {
  title: string;
  chapterLabel?: string;
  beats: MotionBeat[];
  accent?: string;
  children: React.ReactNode;
}

/**
 * 统一的 1280×720 动效舞台（L1 Kit）：
 *  - 深色网格与光晕背景
 *  - 顶部导演信息栏（章节、标题、当前节拍胶囊、右上角公式 HUD、帧时间码）
 *  - 中央主画布区域（留出安全边距）
 *  - 底部语义节拍进度条 + 同步讲解字幕
 */
export const Stage: React.FC<StageProps> = ({
  title,
  chapterLabel = 'RL Motion Explainer',
  beats,
  accent = MOTION_THEME.agent,
  children,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const { beat, index } = activeBeat(beats, frame);
  const captionAlpha = fadeIn(frame, beat.startFrame, 10);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: MOTION_THEME.bg,
        color: MOTION_THEME.text,
        fontFamily: MOTION_THEME.fontSans,
        overflow: 'hidden',
      }}
    >
      {/* 背景网格 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(to right, rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.06) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* 顶部柔和光晕 */}
      <div
        style={{
          position: 'absolute',
          top: -180,
          left: '50%',
          width: 760,
          height: 360,
          transform: 'translateX(-50%)',
          background: `radial-gradient(ellipse at center, ${accent}30 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      {/* 顶部栏 */}
      <div
        style={{
          position: 'absolute',
          top: 24,
          left: 40,
          right: 40,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          borderRadius: 14,
          backgroundColor: MOTION_THEME.bgPanel,
          border: `1px solid ${MOTION_THEME.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 0.4,
              backgroundColor: `${accent}26`,
              color: accent,
              border: `1px solid ${accent}66`,
            }}
          >
            {chapterLabel}
          </span>
          <span style={{ fontSize: 18, fontWeight: 700, color: MOTION_THEME.text }}>{title}</span>
          <span
            style={{
              padding: '3px 10px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              backgroundColor: 'rgba(255,255,255,0.06)',
              color: '#e2e8f0',
            }}
          >
            {beat.tag}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {beat.formula && (
            <span
              style={{
                padding: '5px 12px',
                borderRadius: 8,
                fontFamily: MOTION_THEME.fontMono,
                fontSize: 13,
                color: '#fde68a',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
              }}
            >
              {beat.formula}
            </span>
          )}
          <span
            style={{
              fontFamily: MOTION_THEME.fontMono,
              fontSize: 12,
              color: MOTION_THEME.textDim,
            }}
          >
            F{String(frame).padStart(3, '0')}/{durationInFrames} · {(frame / fps).toFixed(1)}s
          </span>
        </div>
      </div>

      {/* 主舞台内容区 */}
      <div
        style={{
          position: 'absolute',
          top: 96,
          left: 40,
          right: 40,
          bottom: 104,
        }}
      >
        {children}
      </div>

      {/* 底部字幕与节拍轨 */}
      <div
        style={{
          position: 'absolute',
          left: 40,
          right: 40,
          bottom: 22,
          height: 68,
          borderRadius: 14,
          backgroundColor: MOTION_THEME.bgPanel,
          border: `1px solid ${MOTION_THEME.border}`,
          padding: '10px 22px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* 节拍分段进度条 */}
        <div style={{ display: 'flex', gap: 8 }}>
          {beats.map((b, i) => {
            const p =
              frame <= b.startFrame
                ? 0
                : frame >= b.endFrame
                  ? 1
                  : (frame - b.startFrame) / Math.max(1, b.endFrame - b.startFrame);
            return (
              <div
                key={b.id}
                style={{
                  flex: Math.max(1, b.endFrame - b.startFrame),
                  height: 5,
                  borderRadius: 999,
                  backgroundColor: 'rgba(148, 163, 184, 0.18)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${(p * 100).toFixed(1)}%`,
                    height: '100%',
                    borderRadius: 999,
                    backgroundColor: i === index ? accent : 'rgba(148, 163, 184, 0.55)',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* 旁白字幕 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            opacity: captionAlpha,
          }}
        >
          <span style={{ fontSize: 15, color: '#f1f5f9', fontWeight: 500 }}>{beat.caption}</span>
          <span style={{ fontSize: 12, color: MOTION_THEME.textMuted, fontFamily: MOTION_THEME.fontMono }}>
            Beat {index + 1}/{beats.length}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
