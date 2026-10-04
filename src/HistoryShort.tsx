import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {fade} from '@remotion/transitions/fade';
import type {Scene, ShortProps} from './types';
import {SANS, TRANSITION_FRAMES} from './theme';
import {Background} from './components/Background';
import {Captions, autoTimeWords, sceneStarts} from './components/Captions';
import {Counter, Globe, Hook, IconGrid, Legacy, Machine, Outro} from './scenes/Scenes';
import {MusicBed, pickTrack} from './components/MusicBed';

const renderScene = (s: Scene, brand: ShortProps['brand']) => {
  switch (s.type) {
    case 'hook':
      return <Hook s={s} brand={brand} />;
    case 'globe':
      return <Globe s={s} brand={brand} />;
    case 'counter':
      return <Counter s={s} brand={brand} />;
    case 'iconGrid':
      return <IconGrid s={s} brand={brand} />;
    case 'machine':
      return <Machine s={s} brand={brand} />;
    case 'legacy':
      return <Legacy s={s} brand={brand} />;
    case 'outro':
      return <Outro s={s} brand={brand} />;
  }
};

const presentations = [
  () => slide({direction: 'from-bottom'}),
  () => wipe({direction: 'from-right'}),
  () => fade(),
  () => slide({direction: 'from-right'}),
];

const ProgressBar: React.FC<{color: string}> = ({color}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  return (
    <div style={{position: 'absolute', top: 0, left: 0, height: 10, width: `${(frame / durationInFrames) * 100}%`, background: color}} />
  );
};

const Bug: React.FC<{brand: ShortProps['brand']}> = ({brand}) => {
  const frame = useCurrentFrame();
  const o = 1; // visible from frame 0 so the brand shows in the platform thumbnail
  return (
    <div style={{position: 'absolute', top: 70, left: 70, opacity: o, display: 'flex', alignItems: 'center', gap: 14}}>
      <div style={{width: 16, height: 16, borderRadius: 8, background: brand.accent}} />
      <span style={{fontFamily: SANS, fontWeight: 900, fontSize: 30, letterSpacing: 4, color: brand.text}}>{brand.name}</span>
      <span style={{fontFamily: SANS, fontWeight: 600, fontSize: 26, letterSpacing: 3, color: brand.accent}}>· FORGOTTEN INNOVATORS</span>
    </div>
  );
};

export const HistoryShort: React.FC<ShortProps> = ({brand, scenes, voiceoverUrl, musicUrl, musicFile, musicVolume, captions, sfx = true}) => {
  const {fps} = useVideoConfig();
  const words = captions && captions.length ? captions : autoTimeWords(scenes, fps);
  const starts = sceneStarts(scenes, fps);
  return (
    <AbsoluteFill style={{backgroundColor: brand.bg}}>
      <Background brand={brand} />
      <TransitionSeries>
        {scenes.map((s, i) => (
          <React.Fragment key={i}>
            <TransitionSeries.Sequence durationInFrames={Math.round(s.durationSec * fps)}>
              {renderScene(s, brand)}
              {s.voiceFile && <Audio src={staticFile(s.voiceFile)} />}
            </TransitionSeries.Sequence>
            {i < scenes.length - 1 && (
              <TransitionSeries.Transition presentation={presentations[i % presentations.length]() as any} timing={linearTiming({durationInFrames: TRANSITION_FRAMES})} />
            )}
          </React.Fragment>
        ))}
      </TransitionSeries>
      <Captions words={words} brand={brand} />
      <Bug brand={brand} />
      <ProgressBar color={brand.accent} />
      {voiceoverUrl && <Audio src={voiceoverUrl} />}
      {/* Background music: musicFile / musicUrl from props, otherwise a history track picked from the script */}
      {musicFile !== 'none' && (
        <MusicBed src={musicFile || musicUrl || pickTrack(scenes.map((sc) => sc.narration).join(' '), 'history')} words={words} base={musicVolume ?? 0.4} />
      )}
      {sfx &&
        starts.slice(1).map((st, i) => (
          <Sequence key={i} from={st - 4} durationInFrames={30}>
            <Audio src={staticFile('sfx/whoosh.wav')} volume={0.5} />
          </Sequence>
        ))}
      {sfx && (
        <Sequence from={6} durationInFrames={30}>
          <Audio src={staticFile('sfx/hit.wav')} volume={0.6} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
