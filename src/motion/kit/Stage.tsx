import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { MOTION_THEME, type MotionBeat } from './theme';
import { MOTION_WORLDS, type MotionWorldId } from './worlds';
import { activeBeat, fadeIn } from './primitives';

export interface StageProps {
  title: string;
  chapterLabel?: string;
  beats: MotionBeat[];
  world?: MotionWorldId;
  accent?: string;
  /** fullBleed = true 时主内容占满 1280×720（仅叠加轻量化浮层顶栏与底栏），适合自定义电影构图 */
  fullBleed?: boolean;
  children: React.ReactNode;
}

export const Stage: React.FC<StageProps> = ({
  title,
  chapterLabel = 'RL Motion Explainer',
  beats,
  world = 'cyber',
  accent,
  fullBleed = false,
  children,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const w = MOTION_WORLDS[world];
  const colorAccent = accent ?? w.accent;
  const { beat, index } = activeBeat(beats, frame);
  const captionAlpha = fadeIn(frame, beat.startFrame, 10);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: w.bg,
        color: w.text,
        fontFamily: w.fontDisplay,
        overflow: 'hidden',
      }}
    >
      {/* 视觉世界观背景层 */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: w.bgGradient }} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: w.pattern,
          backgroundSize: w.patternSize,
        }}
      />

      {/* 主舞台内容 */}
      <div
        style={
          fullBleed
            ? { position: 'absolute', inset: 0 }
            : { position: 'absolute', top: 88, left: 36, right: 36, bottom: 96 }
        }
      >
        {children}
      </div>

      {/* 顶部浮层导演栏 */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 36,
          right: 36,
          height: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 18px',
          borderRadius: w.badgeStyle === 'hud' ? 8 : 14,
          backgroundColor: w.panelBg,
          border: `1px solid ${w.panelBorder}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              padding: '3px 10px',
              borderRadius: w.badgeStyle === 'hud' ? 4 : 999,
              fontSize: 12,
              fontWeight: 700,
              backgroundColor: `${colorAccent}24`,
              color: colorAccent,
              border: `1px solid ${colorAccent}66`,
              fontFamily: MOTION_THEME.fontSans,
            }}
          >
            {chapterLabel}
          </span>
          <span style={{ fontSize: 17, fontWeight: 700, color: w.text }}>{title}</span>
          <span
            style={{
              padding: '3px 9px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: 'rgba(255,255,255,0.07)',
              color: w.text,
              fontFamily: MOTION_THEME.fontSans,
            }}
          >
            {beat.tag}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {beat.formula && (
            <span
              style={{
                padding: '4px 11px',
                borderRadius: 7,
                fontFamily: MOTION_THEME.fontMono,
                fontSize: 13,
                color: w.secondary,
                backgroundColor: `${w.secondary}18`,
                border: `1px solid ${w.secondary}55`,
              }}
            >
              {beat.formula}
            </span>
          )}
          <span style={{ fontFamily: MOTION_THEME.fontMono, fontSize: 12, color: w.textMuted }}>
            {String(frame).padStart(3, '0')}/{durationInFrames} · {(frame / fps).toFixed(1)}s
          </span>
        </div>
      </div>

      {/* 底部字幕与节拍轨 */}
      <div
        style={{
          position: 'absolute',
          left: 36,
          right: 36,
          bottom: 18,
          height: 64,
          borderRadius: w.badgeStyle === 'hud' ? 8 : 14,
          backgroundColor: w.panelBg,
          border: `1px solid ${w.panelBorder}`,
          padding: '9px 20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
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
                  height: 4,
                  borderRadius: 999,
                  backgroundColor: 'rgba(255,255,255,0.14)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${(p * 100).toFixed(1)}%`,
                    height: '100%',
                    borderRadius: 999,
                    backgroundColor: i === index ? colorAccent : 'rgba(255,255,255,0.45)',
                  }}
                />
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            opacity: captionAlpha,
            fontFamily: MOTION_THEME.fontSans,
          }}
        >
          <span style={{ fontSize: 15, color: w.text, fontWeight: 500 }}>{beat.caption}</span>
          <span style={{ fontSize: 12, color: w.textMuted, fontFamily: MOTION_THEME.fontMono }}>
            Beat {index + 1}/{beats.length}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
