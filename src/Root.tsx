import React from 'react';
import {Composition} from 'remotion';
import {HistoryShort} from './HistoryShort';
import type {ShortProps} from './types';
import {FPS, H, TRANSITION_FRAMES, W} from './theme';
import sample from '../props.json';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="HistoryShort"
    component={HistoryShort as any}
    width={W}
    height={H}
    fps={FPS}
    durationInFrames={300}
    defaultProps={sample as unknown as ShortProps}
    calculateMetadata={({props}) => {
      const p = props as unknown as ShortProps;
      const total = p.scenes.reduce((a, s) => a + Math.round(s.durationSec * FPS), 0) - TRANSITION_FRAMES * (p.scenes.length - 1);
      return {durationInFrames: total};
    }}
  />
);
