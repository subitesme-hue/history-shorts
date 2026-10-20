import React from 'react';
import {AbsoluteFill, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

// Shared by both series. "look" carries the series palette + fonts.
export type CinemaLook = {
  dark: boolean; // history = navy/cream (dark), future = ivory/navy (light)
  bg: string;
  text: string;
  accent: string;
  label: string; // font for the lower-third label
  display: string; // font for fallback headline
};

const rgba = (hex: string, alpha: number) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

/** Full-bleed AI clip: slow push-in, slowed down (never below 0.6x) so the clip always covers the scene. */
export const ClipLayer: React.FC<{clip: string; durationSec: number; clipSec?: number; look: CinemaLook}> = ({clip, durationSec, clipSec = 8, look}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const total = durationSec * fps;
  const rate = Math.max(0.6, Math.min(1, (clipSec - 0.2) / durationSec));
  const zoom = interpolate(frame, [0, total], [1.04, 1.12]);
  const x = interpolate(frame, [0, total], [-10, 10]);
  return (
    <AbsoluteFill style={{backgroundColor: '#000', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${zoom}) translateX(${x}px)`}}>
        <OffthreadVideo src={staticFile(clip)} muted playbackRate={rate} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
      {/* Series grade: navy shadows for History, warm ivory haze for Future */}
      <AbsoluteFill style={{background: look.dark ? rgba(look.bg, 0.12) : rgba('#F7E7C2', 0.08), mixBlendMode: look.dark ? 'multiply' : 'soft-light'}} />
      {/* Top band so the brand bug reads, bottom band so the captions read */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${rgba('#000000', 0.5)} 0%, ${rgba('#000000', 0)} 16%, ${rgba('#000000', 0)} 55%, ${rgba('#000000', 0.55)} 78%, ${rgba('#000000', 0.7)} 100%)`,
        }}
      />
      <AbsoluteFill style={{boxShadow: 'inset 0 0 260px rgba(0,0,0,0.55)'}} />
    </AbsoluteFill>
  );
};

/** Gold place / year tag that slides in above the captions. */
export const LowerThird: React.FC<{text: string; look: CinemaLook; top?: number}> = ({text, look, top = 1110}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const e = spring({frame: frame - 6, fps, config: {damping: 16, stiffness: 150}});
  if (!text) return null;
  return (
    <div style={{position: 'absolute', top, left: 70, display: 'flex', alignItems: 'center', gap: 18, opacity: e, transform: `translateX(${(1 - e) * -60}px)`}}>
      <div style={{width: interpolate(e, [0, 1], [0, 56]), height: 6, background: look.accent, borderRadius: 3}} />
      <div
        style={{
          fontFamily: look.label,
          fontWeight: 800,
          fontSize: 36,
          letterSpacing: 6,
          color: '#FFFFFF',
          background: rgba('#000000', 0.38),
          padding: '8px 18px',
          borderRadius: 10,
          borderLeft: `4px solid ${look.accent}`,
          textShadow: '0 2px 10px rgba(0,0,0,0.6)',
        }}
      >
        {text.toUpperCase()}
      </div>
    </div>
  );
};

/** Cinema scene: AI clip + label. Without a clip (generation failed or no key) it shows an animated title card. */
export const CinemaScene: React.FC<{s: {durationSec: number; label?: string; clip?: string; clipSec?: number; narration: string}; look: CinemaLook}> = ({s, look}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (s.clip) {
    return (
      <AbsoluteFill>
        <ClipLayer clip={s.clip} durationSec={s.durationSec} clipSec={s.clipSec} look={look} />
        <LowerThird text={s.label || ''} look={look} />
      </AbsoluteFill>
    );
  }
  // Fallback: big label on the series background (which is already drawn underneath).
  const e = spring({frame: frame - 2, fps, config: {damping: 14, stiffness: 120}});
  const zoom = interpolate(frame, [0, s.durationSec * fps], [1, 1.06]);
  const text = s.label || s.narration.split(/[.,;:!?]/)[0];
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: '0 90px', top: -180, transform: `scale(${zoom})`}}>
      <div style={{width: interpolate(e, [0, 1], [0, 160]), height: 6, background: look.accent, borderRadius: 3, marginBottom: 40}} />
      <div style={{fontFamily: look.display, fontWeight: 900, fontSize: text.length > 28 ? 84 : 110, lineHeight: 1.08, textAlign: 'center', color: look.text, opacity: e, transform: `translateY(${(1 - e) * 30}px)`}}>
        {text}
      </div>
    </AbsoluteFill>
  );
};
