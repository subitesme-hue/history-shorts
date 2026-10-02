import React from 'react';

// Proper toothed gear path. Two gears mesh when their pitch radii touch and speeds are r1/r2 inverse.
export const gearPath = (teeth: number, r: number, depth: number) => {
  const pts: string[] = [];
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const corners = [
      [a - step * 0.25, r - depth],
      [a - step * 0.15, r + depth],
      [a + step * 0.15, r + depth],
      [a + step * 0.25, r - depth],
    ];
    corners.forEach(([ang, rad]) => pts.push(`${(Math.cos(ang) * rad).toFixed(2)},${(Math.sin(ang) * rad).toFixed(2)}`));
  }
  return `M${pts.join(' L')} Z`;
};

export const Gear: React.FC<{
  cx: number;
  cy: number;
  r: number;
  teeth: number;
  angle: number;
  color: string;
  hole?: string;
  opacity?: number;
}> = ({cx, cy, r, teeth, angle, color, hole, opacity = 1}) => {
  const depth = r * 0.09;
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${angle})`} opacity={opacity}>
      <path d={gearPath(teeth, r, depth)} fill={color} />
      <circle r={r * 0.62} fill="none" stroke={hole ?? 'rgba(0,0,0,0.25)'} strokeWidth={r * 0.06} />
      {Array.from({length: 5}).map((_, i) => (
        <rect key={i} x={-r * 0.05} y={-r * 0.6} width={r * 0.1} height={r * 0.45} fill={hole ?? 'rgba(0,0,0,0.25)'} transform={`rotate(${i * 72})`} />
      ))}
      <circle r={r * 0.16} fill={hole ?? 'rgba(0,0,0,0.35)'} />
    </g>
  );
};
