import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { CLAMP, Camera, MOTION_THEME, Stage, pulseAt, type MotionBeat } from '../../kit';

const BEATS: MotionBeat[] = [
  {
    id: 'lineup',
    startFrame: 0,
    endFrame: 55,
    tag: 'Beat 1 · 走进霓虹赌场',
    caption: '4 台老虎机隐藏着截然不同的真实胜率 q*(a)，但外观完全看不出端倪——3 号黄金机其实高达 78%！',
    formula: '真实胜率未知: q*(a) = [42%, 25%, 78%, 55%]',
  },
  {
    id: 'unlucky-pull',
    startFrame: 55,
    endFrame: 125,
    tag: 'Beat 2 · 黄金 3 号机首抽倒霉！',
    caption: '镜头推近 3 号机：纯贪心智能体试拉 3 号机，偏偏撞上 22% 的倒霉未中 (R=0)，估计值瞬间打入冷宫 Q̂=0.00！',
    formula: 'Pull #3 → R = 0  ⇒  Q̂(3) = 0.00',
  },
  {
    id: 'lock-in',
    startFrame: 125,
    endFrame: 205,
    tag: 'Beat 3 · 1 号平庸机连中，贪心彻底锁死',
    caption: '转而拉动 1 号机运气不错中了奖 (Q̂=1.00)。此后纯贪心只认 argmax Q̂，永远困在 42% 的 1 号机！',
    formula: 'A_t = argmax Q̂(a) ≡ #1  (永久错失 #3)',
  },
  {
    id: 'reveal',
    startFrame: 205,
    endFrame: 270,
    tag: 'Beat 4 · 拉远揭秘：线性增长的巨大遗憾',
    caption: '镜头拉远揭晓真相：因为缺少探索机制，纯贪心每轮白白损失 78% - 42% = 36% 期望收益，遗憾呈 O(T) 飙升！',
    formula: 'Regret(T) = Σ [q*(a*) - q*(A_t)] = Θ(T)',
  },
];

const CABINETS = [
  { id: 1, name: '樱桃 1 号', icon: '🍒', trueP: '42%', color: '#f43f5e' },
  { id: 2, name: '闪电 2 号', icon: '⚡', trueP: '25%', color: '#a855f7' },
  { id: 3, name: '黄金 3 号 ★', icon: '💎', trueP: '78%', color: '#fbbf24' },
  { id: 4, name: '赤龙 4 号', icon: '🐉', trueP: '55%', color: '#10b981' },
];

export const BanditArcadeTrapMotion: React.FC = () => {
  const frame = useCurrentFrame();

  // 电影运镜：Beat 2 推近聚焦 3 号机，Beat 3 摇向 1 号机，Beat 4 拉回全景揭晓
  const zoomIn3 = interpolate(frame, [52, 74], [1, 1.38], CLAMP);
  const zoomOut3 = interpolate(frame, [118, 134], [0, -0.14], CLAMP);
  const zoomReset = interpolate(frame, [198, 222], [0, -0.24], CLAMP);
  const camZoom = zoomIn3 + zoomOut3 + zoomReset;

  const panX =
    interpolate(frame, [52, 74], [0, -145], CLAMP) +
    interpolate(frame, [120, 146], [0, 395], CLAMP) +
    interpolate(frame, [198, 222], [0, -250], CLAMP);

  const lever3Pull = pulseAt(frame, 82, 16);
  const lever1Pull = pulseAt(frame, 152, 14) + pulseAt(frame, 180, 14);
  const revealTruth = interpolate(frame, [208, 232], [0, 1], CLAMP);

  return (
    <Stage
      title="为什么纯贪心会翻车？霓虹赌场的「局部最优锁死陷阱」"
      chapterLabel="Ch 02 · 多臂老虎机"
      world="arcade"
      beats={BEATS}
    >
      <Camera zoom={camZoom} panX={panX} panY={camZoom > 1.1 ? 18 : 0}>
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 24,
            padding: '0 24px',
          }}
        >
          {/* 4 台复古街机老虎机 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 28 }}>
            {CABINETS.map((cab, idx) => {
              const isArm3 = idx === 2;
              const isArm1 = idx === 0;
              const leverAngle = isArm3 ? lever3Pull * 42 : isArm1 ? lever1Pull * 42 : 0;
              const coinPop = isArm1 ? pulseAt(frame, 162, 14) : 0;
              const missFlash = isArm3 ? pulseAt(frame, 94, 14) : 0;

              let qText = 'Q̂ = 0.00';
              let pulls = 0;
              if (isArm3 && frame >= 88) {
                qText = 'Q̂ = 0.00 (打入冷宫!)';
                pulls = 1;
              }
              if (isArm1 && frame >= 158) {
                const count = Math.min(20, 1 + Math.floor(interpolate(frame, [158, 250], [0, 19], CLAMP)));
                pulls = count;
                qText = count === 1 ? 'Q̂ = 1.00 (锁定!)' : 'Q̂ = 0.45 (反复拉!)';
              }

              const symbols =
                isArm3 && frame >= 88
                  ? ['✖', '💎', '✖']
                  : isArm1 && frame >= 158
                    ? ['🍒', '🍒', '🍒']
                    : [cab.icon, '7️⃣', cab.icon];

              return (
                <div
                  key={cab.id}
                  style={{
                    position: 'relative',
                    borderRadius: 22,
                    background: 'linear-gradient(180deg, rgba(46,16,68,0.95) 0%, rgba(20,8,34,0.98) 100%)',
                    border: `3px solid ${
                      isArm3 && revealTruth > 0.3
                        ? '#fbbf24'
                        : isArm1 && frame >= 150
                          ? '#f43f5e'
                          : 'rgba(216,180,254,0.32)'
                    }`,
                    padding: '18px 16px 20px',
                    boxShadow:
                      isArm3 && revealTruth > 0.3
                        ? '0 0 36px rgba(251,191,36,0.45)'
                        : '0 12px 30px rgba(0,0,0,0.45)',
                  }}
                >
                  {/* 顶部跑马灯珠 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    {[0, 1, 2, 3, 4, 5].map((b) => (
                      <div
                        key={b}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 999,
                          backgroundColor: (Math.floor(frame / 6) + b + idx) % 2 === 0 ? cab.color : 'rgba(255,255,255,0.18)',
                        }}
                      />
                    ))}
                  </div>

                  {/* 机台名称 */}
                  <div style={{ textAlign: 'center', fontSize: 17, fontWeight: 800, color: '#fef3c7', marginBottom: 12 }}>
                    {cab.name}
                  </div>

                  {/* 三联滚轮屏幕 */}
                  <div
                    style={{
                      borderRadius: 14,
                      backgroundColor: '#09040f',
                      border: `2px solid ${missFlash > 0.2 ? '#f43f5e' : coinPop > 0.2 ? '#34d399' : 'rgba(255,255,255,0.16)'}`,
                      padding: '18px 10px',
                      display: 'flex',
                      justifyContent: 'space-around',
                      fontSize: 32,
                      marginBottom: 14,
                    }}
                  >
                    {symbols.map((s, si) => (
                      <span key={si}>{s}</span>
                    ))}
                  </div>

                  {/* 机械摇杆 */}
                  <div
                    style={{
                      position: 'absolute',
                      right: -14,
                      top: 96,
                      width: 10,
                      height: 64,
                      borderRadius: 6,
                      backgroundColor: '#cbd5e1',
                      transformOrigin: '50% 90%',
                      transform: `rotate(${leverAngle}deg)`,
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: -10,
                        left: -5,
                        width: 20,
                        height: 20,
                        borderRadius: 999,
                        backgroundColor: cab.color,
                        border: '2px solid #fff',
                      }}
                    />
                  </div>

                  {/* 估计值仪表 */}
                  <div
                    style={{
                      borderRadius: 10,
                      backgroundColor: 'rgba(0,0,0,0.45)',
                      padding: '8px 10px',
                      textAlign: 'center',
                      fontFamily: MOTION_THEME.fontMono,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 800, color: isArm3 && frame >= 88 ? '#fb7185' : '#fde68a' }}>
                      {qText}
                    </div>
                    <div style={{ fontSize: 11, color: '#c4b5fd', marginTop: 3 }}>已拉动 N = {pulls} 次</div>
                  </div>

                  {/* 终局揭晓隐藏真实胜率 */}
                  <div
                    style={{
                      opacity: revealTruth,
                      marginTop: 10,
                      borderRadius: 8,
                      padding: '6px 8px',
                      textAlign: 'center',
                      fontFamily: MOTION_THEME.fontMono,
                      fontSize: 13,
                      fontWeight: 800,
                      backgroundColor: isArm3 ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.08)',
                      color: isArm3 ? '#fde047' : '#e2e8f0',
                    }}
                  >
                    真实胜率 q* = {cab.trueP}
                  </div>

                  {/* 弹出反馈徽章 */}
                  {missFlash > 0.1 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 66,
                        left: '50%',
                        transform: `translate(-50%, ${-missFlash * 28}px)`,
                        padding: '4px 12px',
                        borderRadius: 999,
                        backgroundColor: '#e11d48',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: 13,
                      }}
                    >
                      MISS (R = 0)
                    </div>
                  )}
                  {coinPop > 0.1 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 66,
                        left: '50%',
                        transform: `translate(-50%, ${-coinPop * 32}px)`,
                        padding: '4px 12px',
                        borderRadius: 999,
                        backgroundColor: '#10b981',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: 13,
                      }}
                    >
                      +1 🪙 WIN!
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 底部教训条 */}
          <div
            style={{
              opacity: revealTruth,
              alignSelf: 'center',
              padding: '10px 26px',
              borderRadius: 999,
              backgroundColor: 'rgba(244,63,94,0.22)',
              border: '1px solid rgba(244,63,94,0.6)',
              fontSize: 15,
              fontWeight: 700,
              color: '#fecdd3',
            }}
          >
            🚨 结论：纯贪心 (ε=0) 仅凭 1 次随机噪声就把 78% 的黄金 3 号机永久封杀——这就是为什么 RL 必须引入“探索”！
          </div>
        </div>
      </Camera>
    </Stage>
  );
};
