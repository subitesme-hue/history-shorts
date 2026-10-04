import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CaptionWord} from '../types';
import type {FBrand, FScene} from './types';
import {CAPTION_TOP, GROTESK, a} from './style';
import {TRANSITION_FRAMES} from '../theme';

export const fSceneStarts = (scenes: FScene[], fps: number) => {
  const starts: number[] = [];
  let t = 0;
  scenes.forEach((s, i) => {
    starts.push(t);
    t += Math.round(s.durationSec * fps) - (i < scenes.length - 1 ? TRANSITION_FRAMES : 0);
  });
  return starts;
};

// Fallback timings when no voice timings exist (local preview): spread words across each scene.
export const fAutoTime = (scenes: FScene[], fps: number): CaptionWord[] => {
  const starts = fSceneStarts(scenes, fps);
  const out: CaptionWord[] = [];
  scenes.forEach((s, i) => {
    const words = s.narration.split(/\s+/).filter(Boolean);
    if (!words.length) return;
    const startMs = (starts[i] / fps) * 1000 + 250;
    const endMs = ((starts[i] + Math.round(s.durationSec * fps) - TRANSITION_FRAMES) / fps) * 1000 - 150;
    const weights = words.map((w) => 2 + w.length);
    const total = weights.reduce((x, y) => x + y, 0);
    let t = startMs;
    words.forEach((w, k) => {
      const d = ((endMs - startMs) * weights[k]) / total;
      out.push({text: w, startMs: t, endMs: t + d});
      t += d;
    });
  });
  return out;
};

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

// Navy word-by-word captions on ivory; the spoken word sits on a gold pill.
export const FCaptions: React.FC<{words: CaptionWord[]; brand: FBrand}> = ({words, brand}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const pages = paginate(words);
  const page = pages.find((p) => ms >= p[0].startMs - 60 && ms < p[p.length - 1].endMs + 80);
  if (!page) return null;
  const pageStart = Math.round((page[0].startMs / 1000) * fps);
  const enter = spring({frame: frame - pageStart, fps, config: {damping: 15, stiffness: 190}});
  return (
    <AbsoluteFill style={{top: CAPTION_TOP, alignItems: 'center', justifyContent: 'flex-start'}}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '8px 16px',
          maxWidth: 960,
          opacity: enter,
          transform: `translateY(${interpolate(enter, [0, 1], [34, 0])}px) scale(${interpolate(enter, [0, 1], [0.9, 1])})`,
        }}
      >
        {page.map((w, i) => {
          const on = ms >= w.startMs && ms < w.endMs + 40;
          const pop = spring({frame: frame - Math.round((w.startMs / 1000) * fps), fps, config: {damping: 11, stiffness: 260}});
          return (
            <span
              key={i}
              style={{
                fontFamily: GROTESK,
                fontWeight: 700,
                fontSize: 86,
                lineHeight: 1.08,
                letterSpacing: -1,
                color: brand.text,
                background: on ? brand.accentSoft : 'transparent',
                padding: '2px 18px 8px',
                borderRadius: 16,
                boxShadow: on ? `0 10px 30px ${a(brand.accent, 0.35)}` : 'none',
                transform: on ? `scale(${interpolate(pop, [0, 1], [0.92, 1.07])}) rotate(-1.5deg)` : 'none',
                textShadow: on ? 'none' : `0 0 18px ${a(brand.bg, 1)}, 0 0 6px ${a(brand.bg, 1)}`,
              }}
            >
              {w.text.toUpperCase()}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
