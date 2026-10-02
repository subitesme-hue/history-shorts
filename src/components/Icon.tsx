import React from 'react';
import type {IconName} from '../types';

// Simple, original line icons (stroke uses currentColor).
export const Icon: React.FC<{name: IconName; size?: number; color?: string; stroke?: number; spin?: number}> = ({
  name,
  size = 120,
  color = 'currentColor',
  stroke = 6,
  spin = 0,
}) => {
  const common = {fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  let body: React.ReactNode = null;
  switch (name) {
    case 'gear': {
      const teeth = Array.from({length: 8}).map((_, i) => (
        <rect key={i} x={46} y={4} width={8} height={16} rx={2} fill={color} transform={`rotate(${i * 45} 50 50)`} />
      ));
      body = (
        <g transform={`rotate(${spin} 50 50)`}>
          {teeth}
          <circle cx={50} cy={50} r={30} {...common} />
          <circle cx={50} cy={50} r={10} {...common} />
        </g>
      );
      break;
    }
    case 'clock':
      body = (
        <g {...common}>
          <circle cx={50} cy={50} r={38} />
          <line x1={50} y1={50} x2={50} y2={26} transform={`rotate(${spin} 50 50)`} />
          <line x1={50} y1={50} x2={66} y2={58} />
        </g>
      );
      break;
    case 'drum':
      body = (
        <g {...common}>
          <ellipse cx={50} cy={30} rx={34} ry={12} />
          <path d="M16 30 V70 A34 12 0 0 0 84 70 V30" />
          <line x1={30} y1={8} x2={44} y2={26} />
          <line x1={70} y1={8} x2={56} y2={26} />
        </g>
      );
      break;
    case 'engine':
      body = (
        <g {...common}>
          <rect x={30} y={14} width={40} height={40} rx={4} />
          <rect x={36} y={22} width={28} height={12} rx={2} />
          <line x1={50} y1={34} x2={50} y2={66} />
          <circle cx={50} cy={78} r={14} />
        </g>
      );
      break;
    case 'robot':
      body = (
        <g {...common}>
          <rect x={22} y={30} width={56} height={44} rx={10} />
          <circle cx={40} cy={50} r={5} />
          <circle cx={60} cy={50} r={5} />
          <line x1={40} y1={64} x2={60} y2={64} />
          <line x1={50} y1={30} x2={50} y2={16} />
          <circle cx={50} cy={12} r={4} />
        </g>
      );
      break;
    case 'book':
      body = (
        <g {...common}>
          <path d="M50 26 C40 18 24 18 14 22 V80 C24 76 40 76 50 84 C60 76 76 76 86 80 V22 C76 18 60 18 50 26 Z" />
          <line x1={50} y1={26} x2={50} y2={84} />
        </g>
      );
      break;
    case 'drop':
      body = <path {...common} d="M50 12 C50 12 22 46 22 64 A28 28 0 0 0 78 64 C78 46 50 12 50 12 Z" />;
      break;
    case 'bulb':
      body = (
        <g {...common}>
          <path d="M34 60 A26 26 0 1 1 66 60 C62 66 60 70 60 76 H40 C40 70 38 66 34 60 Z" />
          <line x1={42} y1={86} x2={58} y2={86} />
        </g>
      );
      break;
  }
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{overflow: 'visible'}}>
      {body}
    </svg>
  );
};
