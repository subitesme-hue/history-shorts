import React from 'react';
import {Composition} from 'remotion';
import {HistoryShort} from './HistoryShort';
import type {ShortProps} from './types';
import {FPS, H, TRANSITION_FRAMES, W} from './theme';
import sample from '../props.json';
import {FutureShort} from './future/FutureShort';
import futureSample from '../props-future.json';

export const RemotionRoot: React.FC = () => (
  <>
  <Composition
    id="FutureShort"
    component={FutureShort as any}
    width={W}
    height={H}
    fps={FPS}
    durationInFrames={300}
    defaultProps={futureSample as any}
    calculateMetadata={({props}) => {
      const p = props as any;
      const total = p.scenes.reduce((acc: number, s: any) => acc + Math.round(s.durationSec * FPS), 0) - TRANSITION_FRAMES * (p.scenes.length - 1);
      return {durationInFrames: total};
    }}
  />
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
  </>
);
