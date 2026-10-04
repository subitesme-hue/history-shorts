import React, {useMemo} from 'react';
import {Audio, interpolate, staticFile, useVideoConfig} from 'remotion';
import type {CaptionWord} from '../types';

// Background music that sits under the narration: full level between phrases,
// dipped while words are spoken, faded in at the start and out at the end.
export const MusicBed: React.FC<{src: string; words: CaptionWord[]; base?: number}> = ({src, words, base = 0.4}) => {
  const {fps, durationInFrames: total} = useVideoConfig();
  const curve = useMemo(() => {
    const c = new Float32Array(total);
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
      c[f] = base * duck * fadeIn * fadeOut;
    }
    return c;
  }, [words, fps, total, base]);
  return <Audio src={src.startsWith('http') ? src : staticFile(src)} loop volume={(f) => curve[Math.min(curve.length - 1, Math.max(0, f))]} />;
};

// Same text -> same track, different shorts -> rotating tracks.
export const pickTrack = (seed: string, prefix: string, count = 4) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return `music/${prefix}-${(h % count) + 1}.mp3`;
};
