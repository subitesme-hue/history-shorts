import React from 'react';
import type {FIcon} from './types';

// Original line icons on a 100x100 grid. Stroke = currentColor.
export const FIcons: React.FC<{name: FIcon; size?: number; stroke?: number; t?: number}> = ({name, size = 100, stroke = 5, t = 0}) => {
  const s = {fill: 'none', stroke: 'currentColor', strokeWidth: stroke, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  let body: React.ReactNode;
  switch (name) {
    case 'factory':
      body = (
        <g {...s}>
          <path d="M12 84 V48 L32 60 V48 L52 60 V48 L72 60 V30 H84 V84 Z" />
          <line x1={8} y1={84} x2={92} y2={84} />
          <circle cx={78} cy={20 - (t % 20) * 0.4} r={4 + (t % 20) * 0.15} opacity={1 - (t % 20) / 20} />
        </g>
      );
      break;
    case 'health':
      body = (
        <g {...s}>
          <rect x={18} y={18} width={64} height={64} rx={16} />
          <path d="M50 34 V66 M34 50 H66" />
        </g>
      );
      break;
    case 'finance':
      body = (
        <g {...s}>
          <path d="M14 38 L50 16 L86 38 Z" />
          <path d="M24 42 V72 M42 42 V72 M58 42 V72 M76 42 V72" />
          <line x1={14} y1={82} x2={86} y2={82} />
        </g>
      );
      break;
    case 'retail':
      body = (
        <g {...s}>
          <path d="M10 18 H22 L32 64 H78 L86 32 H28" />
          <circle cx={38} cy={80} r={6} />
          <circle cx={72} cy={80} r={6} />
        </g>
      );
      break;
    case 'logistics':
      body = (
        <g {...s}>
          <rect x={8} y={30} width={52} height={36} rx={3} />
          <path d="M60 42 H78 L90 56 V66 H60" />
          <circle cx={26} cy={74} r={8} />
          <circle cx={74} cy={74} r={8} />
        </g>
      );
      break;
    case 'education':
      body = (
        <g {...s}>
          <path d="M8 40 L50 22 L92 40 L50 58 Z" />
          <path d="M26 48 V70 C38 80 62 80 74 70 V48" />
          <line x1={92} y1={40} x2={92} y2={62} />
        </g>
      );
      break;
    case 'home':
      body = (
        <g {...s}>
          <path d="M14 48 L50 18 L86 48" />
          <path d="M24 42 V84 H76 V42" />
          <rect x={42} y={58} width={16} height={26} />
        </g>
      );
      break;
    case 'farm':
      body = (
        <g {...s}>
          <path d="M50 86 V40" />
          <path d="M50 58 C36 58 28 48 28 36 C40 36 50 44 50 58 Z" />
          <path d="M50 48 C64 48 72 38 72 26 C60 26 50 34 50 48 Z" />
          <line x1={20} y1={86} x2={80} y2={86} />
        </g>
      );
      break;
    case 'city':
      body = (
        <g {...s}>
          <path d="M10 86 H90" />
          <path d="M18 86 V44 H36 V86 M40 86 V20 H60 V86 M64 86 V52 H82 V86" />
          <path d="M46 32 H54 M46 44 H54 M46 56 H54" />
        </g>
      );
      break;
    case 'energy':
      body = <path {...s} d="M56 8 L22 56 H48 L42 92 L78 40 H52 Z" />;
      break;
    case 'car':
      body = (
        <g {...s}>
          <path d="M12 64 V50 L24 32 H76 L88 50 V64 Z" />
          <circle cx={30} cy={68} r={8} />
          <circle cx={70} cy={68} r={8} />
          <line x1={24} y1={48} x2={76} y2={48} />
        </g>
      );
      break;
    case 'chip':
      body = (
        <g {...s}>
          <rect x={26} y={26} width={48} height={48} rx={6} />
          <rect x={40} y={40} width={20} height={20} rx={2} />
          <path d="M38 26 V12 M50 26 V12 M62 26 V12 M38 74 V88 M50 74 V88 M62 74 V88 M26 38 H12 M26 50 H12 M26 62 H12 M74 38 H88 M74 50 H88 M74 62 H88" />
        </g>
      );
      break;
    case 'shield':
      body = (
        <g {...s}>
          <path d="M50 10 L84 22 V48 C84 70 68 84 50 92 C32 84 16 70 16 48 V22 Z" />
          <path d="M34 50 L46 62 L68 38" />
        </g>
      );
      break;
    case 'globe':
      body = (
        <g {...s}>
          <circle cx={50} cy={50} r={38} />
          <ellipse cx={50} cy={50} rx={16} ry={38} />
          <path d="M12 50 H88 M18 30 H82 M18 70 H82" />
        </g>
      );
      break;
    case 'people':
      body = (
        <g {...s}>
          <circle cx={36} cy={34} r={12} />
          <path d="M14 80 C14 62 24 54 36 54 C48 54 58 62 58 80" />
          <circle cx={68} cy={38} r={10} />
          <path d="M62 56 C76 54 86 62 86 78" />
        </g>
      );
      break;
    case 'chart':
    default:
      body = (
        <g {...s}>
          <path d="M12 86 H90 M12 86 V12" />
          <path d="M22 70 L42 52 L56 62 L84 28" />
          <path d="M70 28 H84 V42" />
        </g>
      );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{overflow: 'visible'}}>
      {body}
    </svg>
  );
};
