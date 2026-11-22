/**
 * 7 套差异化视觉世界观（Visual Worlds）——彻底打破千篇一律的深色两栏模板。
 * 每个章节按知识点气质匹配专属视觉语言：
 *  - cyber       第 1 章：霓虹电路脉冲（深海蓝黑 + 电路光轨）
 *  - arcade      第 2 章：复古霓虹赌场（暖紫酒红 + 霓虹灯珠 + 金币琥珀光）
 *  - chalkboard  第 3 章：3Blue1Brown 数学黑板（哑光石板蓝 + 粉笔光晕 + 衬线数学字体）
 *  - topographic 第 4 章：等高线水波地形（深青海域 + 荧光等高波纹）
 *  - tabletop    第 5 章：经典绿绒牌桌（翡翠绒布绿 + 黄铜边框 + 象牙牌面）
 *  - telemetry   第 6–8 章：精密工程遥测 HUD（碳灰实验室 + 示波器刻度 + 物理弹簧/曲线）
 *  - terminal    第 9–10 章：现代 AI 终端与分形树（深石墨底 + 激光扫描 + Token 流）
 */
export type MotionWorldId =
  | 'cyber'
  | 'arcade'
  | 'chalkboard'
  | 'topographic'
  | 'tabletop'
  | 'telemetry'
  | 'terminal';

export interface WorldStyle {
  bg: string;
  bgGradient: string;
  pattern: string;
  patternSize: string;
  panelBg: string;
  panelBorder: string;
  accent: string;
  secondary: string;
  text: string;
  textMuted: string;
  fontDisplay: string;
  badgeStyle: 'pill' | 'brass' | 'chalk' | 'hud';
}

export const MOTION_WORLDS: Record<MotionWorldId, WorldStyle> = {
  cyber: {
    bg: '#060a14',
    bgGradient: 'radial-gradient(ellipse at 25% 15%, rgba(99,102,241,0.22) 0%, transparent 55%), radial-gradient(ellipse at 80% 85%, rgba(20,184,166,0.18) 0%, transparent 50%)',
    pattern: 'linear-gradient(to right, rgba(99,102,241,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(99,102,241,0.08) 1px, transparent 1px)',
    patternSize: '48px 48px',
    panelBg: 'rgba(10, 18, 36, 0.84)',
    panelBorder: 'rgba(99, 102, 241, 0.28)',
    accent: '#818cf8',
    secondary: '#2dd4bf',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    fontDisplay: 'Inter, -apple-system, "PingFang SC", sans-serif',
    badgeStyle: 'pill',
  },
  arcade: {
    bg: '#16091f',
    bgGradient: 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.28) 0%, transparent 55%), radial-gradient(ellipse at 15% 90%, rgba(236,72,153,0.24) 0%, transparent 55%), radial-gradient(ellipse at 88% 85%, rgba(168,85,247,0.24) 0%, transparent 50%)',
    pattern: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 4px)',
    patternSize: '100% 4px',
    panelBg: 'rgba(34, 15, 48, 0.88)',
    panelBorder: 'rgba(251, 191, 36, 0.42)',
    accent: '#fbbf24',
    secondary: '#f472b6',
    text: '#fef3c7',
    textMuted: '#d8b4fe',
    fontDisplay: 'Inter, -apple-system, "PingFang SC", sans-serif',
    badgeStyle: 'brass',
  },
  chalkboard: {
    bg: '#0c1520',
    bgGradient: 'radial-gradient(circle at 50% 42%, rgba(56,189,248,0.12) 0%, transparent 62%), radial-gradient(circle at 80% 18%, rgba(250,204,21,0.08) 0%, transparent 45%)',
    pattern: 'radial-gradient(rgba(226,232,240,0.07) 1px, transparent 1px)',
    patternSize: '28px 28px',
    panelBg: 'rgba(15, 25, 38, 0.82)',
    panelBorder: 'rgba(148, 163, 184, 0.25)',
    accent: '#38bdf8',
    secondary: '#facc15',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    fontDisplay: 'Georgia, "Noto Serif SC", "Songti SC", serif',
    badgeStyle: 'chalk',
  },
  topographic: {
    bg: '#05151a',
    bgGradient: 'radial-gradient(circle at 72% 28%, rgba(16,185,129,0.22) 0%, transparent 52%), radial-gradient(circle at 20% 80%, rgba(14,165,233,0.18) 0%, transparent 50%)',
    pattern: 'radial-gradient(circle at 50% 50%, transparent 0, transparent 42px, rgba(45,212,191,0.06) 43px, transparent 44px)',
    patternSize: '90px 90px',
    panelBg: 'rgba(7, 29, 36, 0.84)',
    panelBorder: 'rgba(45, 212, 191, 0.30)',
    accent: '#2dd4bf',
    secondary: '#38bdf8',
    text: '#ecfeff',
    textMuted: '#67e8f9',
    fontDisplay: 'Inter, -apple-system, "PingFang SC", sans-serif',
    badgeStyle: 'pill',
  },
  tabletop: {
    bg: '#09241b',
    bgGradient: 'radial-gradient(ellipse at 50% 45%, rgba(16,185,129,0.22) 0%, rgba(6,32,24,0.8) 70%)',
    pattern: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
    patternSize: '18px 18px',
    panelBg: 'rgba(6, 42, 31, 0.88)',
    panelBorder: 'rgba(217, 179, 98, 0.45)',
    accent: '#eab308',
    secondary: '#34d399',
    text: '#fefce8',
    textMuted: '#a7f3d0',
    fontDisplay: 'Georgia, "PingFang SC", serif',
    badgeStyle: 'brass',
  },
  telemetry: {
    bg: '#0d1015',
    bgGradient: 'radial-gradient(ellipse at 18% 12%, rgba(244,63,94,0.16) 0%, transparent 45%), radial-gradient(ellipse at 85% 20%, rgba(59,130,246,0.16) 0%, transparent 48%)',
    pattern: 'linear-gradient(to right, rgba(148,163,184,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.07) 1px, transparent 1px)',
    patternSize: '32px 32px',
    panelBg: 'rgba(18, 22, 30, 0.90)',
    panelBorder: 'rgba(148, 163, 184, 0.24)',
    accent: '#fb7185',
    secondary: '#38bdf8',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    fontDisplay: 'Inter, -apple-system, "PingFang SC", sans-serif',
    badgeStyle: 'hud',
  },
  terminal: {
    bg: '#080b10',
    bgGradient: 'radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.18) 0%, transparent 52%), radial-gradient(ellipse at 80% 90%, rgba(99,102,241,0.18) 0%, transparent 52%)',
    pattern: 'linear-gradient(to right, rgba(52,211,153,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(52,211,153,0.05) 1px, transparent 1px)',
    patternSize: '36px 36px',
    panelBg: 'rgba(13, 17, 23, 0.92)',
    panelBorder: 'rgba(52, 211, 153, 0.28)',
    accent: '#34d399',
    secondary: '#a78bfa',
    text: '#e6edf3',
    textMuted: '#8b949e',
    fontDisplay: 'Inter, -apple-system, "PingFang SC", sans-serif',
    badgeStyle: 'hud',
  },
};
