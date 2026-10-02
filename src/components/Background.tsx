import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import type {Brand} from '../types';

// Navy blueprint background: drifting grid, gold dust, vignette. Same on every scene so cuts feel seamless.
export const Background: React.FC<{brand: Brand}> = ({brand}) => {
  const frame = useCurrentFrame();
  const shift = (frame * 0.6) % 90;
  const dust = Array.from({length: 40}).map((_, i) => {
    const x = random(`x${i}`) * 1080;
    const y = (random(`y${i}`) * 1920 - frame * (0.4 + random(`s${i}`) * 0.8) + 1920 * 4) % 1920;
    const r = 1.5 + random(`r${i}`) * 3;
    const o = 0.15 + random(`o${i}`) * 0.35;
    return <circle key={i} cx={x} cy={y} r={r} fill={brand.accent} opacity={o} />;
  });
  return (
    <AbsoluteFill style={{backgroundColor: brand.bg}}>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <defs>
          <pattern id="grid" width={90} height={90} patternUnits="userSpaceOnUse" patternTransform={`translate(0 ${shift})`}>
            <path d="M90 0 H0 V90" fill="none" stroke={brand.text} strokeOpacity={0.06} strokeWidth={2} />
          </pattern>
          <radialGradient id="glow" cx="50%" cy="38%" r="60%">
            <stop offset="0%" stopColor={brand.accent} stopOpacity={0.16} />
            <stop offset="100%" stopColor={brand.bg} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="vig" cx="50%" cy="50%" r="75%">
            <stop offset="60%" stopColor="#000" stopOpacity={0} />
            <stop offset="100%" stopColor="#000" stopOpacity={0.55} />
          </radialGradient>
        </defs>
        <rect width={1080} height={1920} fill="url(#grid)" />
        <rect width={1080} height={1920} fill="url(#glow)" />
        {dust}
        <rect width={1080} height={1920} fill="url(#vig)" />
      </svg>
    </AbsoluteFill>
  );
};
