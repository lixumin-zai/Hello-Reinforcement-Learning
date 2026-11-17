import React from 'react';
import { Composition } from 'remotion';
import { motionEntries } from '../compositions';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {motionEntries.map((entry) => (
        <Composition
          key={entry.id}
          id={entry.id}
          component={entry.component}
          durationInFrames={entry.durationInFrames}
          fps={entry.fps}
          width={entry.width}
          height={entry.height}
          defaultProps={entry.defaultProps ?? {}}
        />
      ))}
    </>
  );
};
