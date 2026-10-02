import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Brand, CaptionWord, Scene} from '../types';
import {SANS, TRANSITION_FRAMES} from '../theme';

export const sceneStarts = (scenes: Scene[], fps: number) => {
  const starts: number[] = [];
  let t = 0;
  scenes.forEach((s, i) => {
    starts.push(t);
    t += Math.round(s.durationSec * fps) - (i < scenes.length - 1 ? TRANSITION_FRAMES : 0);
  });
  return starts;
};

// When no ElevenLabs timings are supplied, spread each scene's narration across its scene,
// weighting by word length so long words stay on screen longer.
export const autoTimeWords = (scenes: Scene[], fps: number): CaptionWord[] => {
  const starts = sceneStarts(scenes, fps);
  const out: CaptionWord[] = [];
  scenes.forEach((s, i) => {
    const words = s.narration.split(/\s+/).filter(Boolean);
    if (!words.length) return;
    const startMs = (starts[i] / fps) * 1000 + 250;
    const endMs = ((starts[i] + Math.round(s.durationSec * fps) - TRANSITION_FRAMES) / fps) * 1000 - 150;
    const weights = words.map((w) => 2 + w.length);
    const total = weights.reduce((a, b) => a + b, 0);
    let t = startMs;
    words.forEach((w, k) => {
      const d = ((endMs - startMs) * weights[k]) / total;
      out.push({text: w, startMs: t, endMs: t + d});
      t += d;
    });
  });
  return out;
};

// Group into short "pages" of max 3 words, breaking after punctuation (Submagic-style).
const paginate = (words: CaptionWord[]) => {
  const pages: CaptionWord[][] = [];
  let cur: CaptionWord[] = [];
  words.forEach((w) => {
    cur.push(w);
    if (cur.length === 3 || /[.,!?;:—]$/.test(w.text)) {
      pages.push(cur);
      cur = [];
    }
  });
  if (cur.length) pages.push(cur);
  return pages;
};

export const Captions: React.FC<{words: CaptionWord[]; brand: Brand}> = ({words, brand}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const pages = paginate(words);
  const page = pages.find((p) => ms >= p[0].startMs - 60 && ms < p[p.length - 1].endMs + 80);
  if (!page) return null;
  const pageStartFrame = Math.round((page[0].startMs / 1000) * fps);
  const enter = spring({frame: frame - pageStartFrame, fps, config: {damping: 14, stiffness: 180}});
  return (
    <AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', top: 1250}}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '10px 18px',
          maxWidth: 940,
          transform: `translateY(${interpolate(enter, [0, 1], [40, 0])}px) scale(${interpolate(enter, [0, 1], [0.85, 1])})`,
          opacity: enter,
        }}
      >
        {page.map((w, i) => {
          const active = ms >= w.startMs && ms < w.endMs + 40;
          const wf = Math.round((w.startMs / 1000) * fps);
          const pop = spring({frame: frame - wf, fps, config: {damping: 10, stiffness: 260}});
          const clean = w.text.toUpperCase();
          return (
            <span
              key={i}
              style={{
                fontFamily: SANS,
                fontWeight: 900,
                fontSize: 92,
                lineHeight: 1.05,
                letterSpacing: -1,
                color: active ? brand.bg : '#FFFFFF',
                background: active ? brand.accent : 'transparent',
                padding: '4px 18px 8px',
                borderRadius: 18,
                transform: active ? `scale(${interpolate(pop, [0, 1], [0.9, 1.08])}) rotate(-2deg)` : 'scale(1)',
                textShadow: active ? 'none' : '0 6px 0 rgba(0,0,0,0.55), 0 0 24px rgba(0,0,0,0.6)',
                WebkitTextStroke: active ? undefined : '3px rgba(0,0,0,0.35)',
              }}
            >
              {clean}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
