import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import type {FBrand} from './types';
import {a} from './style';

// One continuous backdrop under every scene so cuts feel seamless:
// ivory paper + grain, faint dot grid, slowly turning gold orbit rings with satellites,
// drifting gold light leaks, rising gold dust, warm vignette.
export const Backdrop: React.FC<{brand: FBrand}> = ({brand}) => {
  const f = useCurrentFrame();
  const cx = 540;
  const cy = 760;
  const rings = [
    {r: 330, dash: '2 16', speed: 0.12, sat: 0.9},
    {r: 500, dash: '1 0', speed: -0.07, sat: -0.6},
    {r: 680, dash: '3 22', speed: 0.05, sat: 0.4},
  ];
  const dust = Array.from({length: 34}).map((_, i) => {
    const x = random(`fx${i}`) * 1080;
    const y = (random(`fy${i}`) * 1920 - f * (0.3 + random(`fs${i}`) * 0.6) + 1920 * 6) % 1920;
    const r = 1.4 + random(`fr${i}`) * 2.6;
    const o = 0.18 + random(`fo${i}`) * 0.35;
    return <circle key={i} cx={x} cy={y} r={r} fill={brand.accent} opacity={o} />;
  });
  const leak1x = 200 + Math.sin(f / 90) * 260;
  const leak1y = 300 + Math.cos(f / 120) * 160;
  const leak2x = 880 + Math.cos(f / 110) * 200;
  const leak2y = 1350 + Math.sin(f / 95) * 220;
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${brand.bg} 0%, ${brand.bg} 45%, ${brand.bg2} 100%)`}}>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <defs>
          <pattern id="fdots" width={54} height={54} patternUnits="userSpaceOnUse">
            <circle cx={27} cy={27} r={2} fill={brand.text} opacity={0.07} />
          </pattern>
          <radialGradient id="leak1">
            <stop offset="0%" stopColor={brand.accentSoft} stopOpacity={0.42} />
            <stop offset="100%" stopColor={brand.accentSoft} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="leak2">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.75} />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="fvig" cx="50%" cy="45%" r="78%">
            <stop offset="62%" stopColor={brand.bg2} stopOpacity={0} />
            <stop offset="100%" stopColor="#C9B48A" stopOpacity={0.55} />
          </radialGradient>
          <filter id="grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="table" tableValues="0 0.07" />
            </feComponentTransfer>
          </filter>
        </defs>
        <rect width={1080} height={1920} fill="url(#fdots)" />
        <circle cx={leak2x} cy={leak2y} r={620} fill="url(#leak2)" />
        <circle cx={leak1x} cy={leak1y} r={560} fill="url(#leak1)" />
        {rings.map((g, i) => (
          <g key={i} transform={`rotate(${f * g.speed} ${cx} ${cy})`}>
            <circle cx={cx} cy={cy} r={g.r} fill="none" stroke={brand.accentSoft} strokeOpacity={0.45} strokeWidth={2} strokeDasharray={g.dash} />
            <circle cx={cx + Math.cos(f * 0.01 * g.sat + i) * g.r} cy={cy + Math.sin(f * 0.01 * g.sat + i) * g.r} r={7} fill={brand.accent} opacity={0.55} />
          </g>
        ))}
        {dust}
        <rect width={1080} height={1920} fill="url(#fvig)" />
        <rect width={1080} height={1920} filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};
