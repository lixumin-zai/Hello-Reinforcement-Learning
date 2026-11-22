import React from 'react';

export interface CameraProps {
  /** 缩放倍率，1 为全景，>1 为推近特写 */
  zoom?: number;
  /** 画面水平平移（px） */
  panX?: number;
  /** 画面垂直平移（px） */
  panY?: number;
  /** 轻微倾斜角度（deg） */
  rotate?: number;
  children: React.ReactNode;
}

/**
 * 确定性 2D 虚拟摄影机（Camera Rig）：
 * 通过外层 transform 实现电影级推镜（Zoom-in）、摇镜（Pan）与微倾，
 * 所有数值必须由 useCurrentFrame() + interpolate()/spring() 计算传入。
 */
export const Camera: React.FC<CameraProps> = ({ zoom = 1, panX = 0, panY = 0, rotate = 0, children }) => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        transformOrigin: '50% 50%',
        transform: `translate3d(${panX.toFixed(2)}px, ${panY.toFixed(2)}px, 0) scale(${zoom.toFixed(4)}) rotate(${rotate.toFixed(3)}deg)`,
      }}
    >
      {children}
    </div>
  );
};
