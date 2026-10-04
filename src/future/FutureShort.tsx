import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {fade} from '@remotion/transitions/fade';
import type {CaptionWord} from '../types';
import type {FBrand, FScene, FutureProps} from './types';
import {TRANSITION_FRAMES} from '../theme';
import {FUTURE_BRAND, GROTESK, a} from './style';
import {Backdrop} from './Backdrop';
import {FCaptions, fAutoTime, fSceneStarts} from './FCaptions';
import {Hook, Impact, Outro, Shift, Stat, Steps, Tech} from './FScenes';

const renderScene = (s: FScene, brand: FBrand) => {
  switch (s.type) {
    case 'hook':
      return <Hook s={s} brand={brand} />;
    case 'shift':
      return <Shift s={s} brand={brand} />;
    case 'stat':
      return <Stat s={s} brand={brand} />;
    case 'tech':
      return <Tech s={s} brand={brand} />;
    case 'steps':
      return <Steps s={s} brand={brand} />;
    case 'impact':
      return <Impact s={s} brand={brand} />;
    case 'outro':
      return <Outro s={s} brand={brand} />;
  }
};

const presentations = [
  () => fade(),
  () => slide({direction: 'from-bottom'}),
  () => wipe({direction: 'from-left'}),
  () => slide({direction: 'from-right'}),
];

// Slow push-in on every scene ("camera drift").
const Drift: React.FC<{dur: number; children: React.ReactNode}> = ({dur, children}) => {
  const f = useCurrentFrame();
  const sc = interpolate(f, [0, dur], [1, 1.035]);
  return <AbsoluteFill style={{transform: `scale(${sc})`}}>{children}</AbsoluteFill>;
};

// Diagonal gold light band sweeping across at each cut.
const GoldSweep: React.FC<{brand: FBrand}> = ({brand}) => {
  const f = useCurrentFrame();
  const x = interpolate(f, [0, 20], [-900, 1500], {extrapolateRight: 'clamp'});
  const o = interpolate(f, [0, 6, 16, 20], [0, 0.85, 0.6, 0], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          top: -400,
          left: x,
          width: 520,
          height: 2800,
          transform: 'rotate(18deg)',
          opacity: o,
          background: `linear-gradient(90deg, ${a(brand.accentSoft, 0)} 0%, ${a(brand.accentSoft, 0.55)} 40%, ${a('#FFFFFF', 0.8)} 50%, ${a(brand.accentSoft, 0.55)} 60%, ${a(brand.accentSoft, 0)} 100%)`,
          mixBlendMode: 'screen',
        }}
      />
    </AbsoluteFill>
  );
};

const Bug: React.FC<{brand: FBrand}> = ({brand}) => (
  <div style={{position: 'absolute', top: 72, left: 70, display: 'flex', alignItems: 'center', gap: 14}}>
    <div style={{width: 16, height: 16, borderRadius: 8, background: brand.accent}} />
    <span style={{fontFamily: GROTESK, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: brand.text}}>{brand.name}</span>
    <span style={{fontFamily: GROTESK, fontWeight: 600, fontSize: 26, letterSpacing: 4, color: brand.accent}}>· {brand.series}</span>
  </div>
);

const Progress: React.FC<{brand: FBrand}> = ({brand}) => {
  const f = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  return (
    <>
      <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 8, background: a(brand.text, 0.08)}} />
      <div style={{position: 'absolute', top: 0, left: 0, height: 8, width: `${(f / durationInFrames) * 100}%`, background: brand.accent}} />
    </>
  );
};

// Music volume per frame: full between phrases, dipped under the voice, faded in/out.
const useMusicCurve = (words: CaptionWord[], fps: number, total: number, base: number) =>
  useMemo(() => {
    const curve = new Float32Array(total);
    const speech = words.map((w) => [w.startMs, w.endMs]);
    let j = 0;
    for (let f = 0; f < total; f++) {
      const ms = (f / fps) * 1000;
      while (j < speech.length - 1 && speech[j][1] < ms - 1000) j++;
      let dist = Infinity;
      for (let k = Math.max(0, j - 2); k < Math.min(speech.length, j + 6); k++) {
        const [s, e] = speech[k];
        const d = ms < s ? s - ms : ms > e ? ms - e : 0;
        if (d < dist) dist = d;
      }
      const duck = interpolate(dist, [0, 450], [0.42, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
      const fadeIn = interpolate(f, [0, fps * 1.2], [0.35, 1], {extrapolateRight: 'clamp'});
      const fadeOut = interpolate(f, [total - fps * 2, total - 1], [1, 0], {extrapolateLeft: 'clamp'});
      curve[f] = base * duck * fadeIn * fadeOut;
    }
    return curve;
  }, [words, fps, total, base]);

export const FutureShort: React.FC<FutureProps> = ({brand: brandIn, scenes, captions, musicFile, musicVolume, sfx = true}) => {
  const {fps, durationInFrames} = useVideoConfig();
  const brand = {...FUTURE_BRAND, ...(brandIn || {})};
  const words = captions && captions.length ? captions : fAutoTime(scenes, fps);
  const starts = fSceneStarts(scenes, fps);
  const curve = useMusicCurve(words, fps, durationInFrames, musicVolume ?? 0.4);
  return (
    <AbsoluteFill style={{backgroundColor: brand.bg}}>
      <Backdrop brand={brand} />
      <TransitionSeries>
        {scenes.map((s, i) => (
          <React.Fragment key={i}>
            <TransitionSeries.Sequence durationInFrames={Math.round(s.durationSec * fps)}>
              <Drift dur={Math.round(s.durationSec * fps)}>{renderScene(s, brand)}</Drift>
              {s.voiceFile && <Audio src={staticFile(s.voiceFile)} />}
            </TransitionSeries.Sequence>
            {i < scenes.length - 1 && (
              <TransitionSeries.Transition presentation={presentations[i % presentations.length]() as any} timing={linearTiming({durationInFrames: TRANSITION_FRAMES})} />
            )}
          </React.Fragment>
        ))}
      </TransitionSeries>
      {starts.slice(1).map((st, i) => (
        <Sequence key={`sw${i}`} from={st - 6} durationInFrames={22}>
          <GoldSweep brand={brand} />
        </Sequence>
      ))}
      <FCaptions words={words} brand={brand} />
      <Bug brand={brand} />
      <Progress brand={brand} />
      {musicFile && <Audio src={staticFile(musicFile)} loop volume={(f) => curve[Math.min(curve.length - 1, Math.max(0, f))]} />}
      {sfx &&
        starts.slice(1).map((st, i) => (
          <Sequence key={`wh${i}`} from={st - 4} durationInFrames={30}>
            <Audio src={staticFile('sfx/whoosh.wav')} volume={0.3} />
          </Sequence>
        ))}
      {sfx && (
        <Sequence from={6} durationInFrames={30}>
          <Audio src={staticFile('sfx/hit.wav')} volume={0.4} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
