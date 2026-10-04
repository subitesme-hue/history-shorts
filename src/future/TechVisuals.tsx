import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {FBrand, FIcon, TechVisual} from './types';
import {FIcons} from './FIcons';
import {GROTESK, a} from './style';

// All visuals draw inside a 1080 x 900 box (placed at y=260 by the scene).

/* AI: layered neural network with signals travelling forward */
const Neural: React.FC<{brand: FBrand}> = ({brand}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const layers = [3, 5, 5, 2];
  const xs = [170, 410, 670, 910];
  const pos = layers.map((n, li) => Array.from({length: n}).map((_, k) => ({x: xs[li], y: 450 + (k - (n - 1) / 2) * 150})));
  const edges: {x1: number; y1: number; x2: number; y2: number; li: number; k: number}[] = [];
  pos.forEach((L, li) => {
    if (li === pos.length - 1) return;
    L.forEach((p, i) => pos[li + 1].forEach((q, j) => edges.push({x1: p.x, y1: p.y, x2: q.x, y2: q.y, li, k: i * 7 + j})));
  });
  const grow = spring({frame: f, fps, config: {damping: 18}});
  const cycle = 36; // frames per layer hop
  return (
    <svg width={1080} height={900}>
      {edges.map((e, i) => (
        <line key={i} x1={e.x1} y1={e.y1} x2={e.x1 + (e.x2 - e.x1) * grow} y2={e.y1 + (e.y2 - e.y1) * grow} stroke={brand.text} strokeOpacity={0.14} strokeWidth={2.5} />
      ))}
      {edges
        .filter((e) => (e.k + e.li) % 3 === 0)
        .map((e, i) => {
          const local = ((f - e.li * cycle + e.k * 3) % (cycle * 3) + cycle * 3) % (cycle * 3);
          const p = local / cycle;
          if (p > 1 || f < e.li * cycle) return null;
          return <circle key={i} cx={e.x1 + (e.x2 - e.x1) * p} cy={e.y1 + (e.y2 - e.y1) * p} r={8} fill={brand.accent} opacity={Math.sin(p * Math.PI)} />;
        })}
      {pos.map((L, li) =>
        L.map((p, k) => {
          const pulse = 0.5 + 0.5 * Math.sin((f - li * cycle) / 8 + k);
          const out = li === pos.length - 1;
          return (
            <g key={`${li}-${k}`} transform={`translate(${p.x} ${p.y}) scale(${grow})`}>
              <circle r={out ? 44 : 34} fill={out ? brand.accentSoft : brand.bg} stroke={brand.text} strokeWidth={4} />
              <circle r={out ? 18 : 12} fill={brand.accent} opacity={0.35 + 0.65 * pulse} />
              {out && <circle r={44 + pulse * 26} fill="none" stroke={brand.accent} strokeWidth={3} opacity={1 - pulse} />}
            </g>
          );
        }),
      )}
      {['INPUT', 'LEARN', 'LEARN', 'OUTPUT'].map((l, i) => (
        <text key={i} x={xs[i]} y={820} textAnchor="middle" fontFamily={GROTESK} fontWeight={700} fontSize={26} letterSpacing={5} fill={brand.accent}>
          {l}
        </text>
      ))}
    </svg>
  );
};

/* Blockchain: blocks chained together, a new block is validated and locks in */
const Chain: React.FC<{brand: FBrand}> = ({brand}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const period = 70;
  const k = Math.floor(f / period);
  const t = (f % period) / period;
  const slide = interpolate(t, [0.55, 0.9], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const W = 230;
  const gap = 70;
  const y = 360;
  const blocks = [-1, 0, 1, 2, 3, 4];
  return (
    <svg width={1080} height={900}>
      {/* peer network above the chain */}
      {Array.from({length: 7}).map((_, i) => {
        const x = 120 + i * 140;
        const yy = 120 + (i % 2) * 60;
        const ping = ((f + i * 9) % 50) / 50;
        return (
          <g key={i}>
            {i < 6 && <line x1={x} y1={yy} x2={x + 140} y2={120 + ((i + 1) % 2) * 60} stroke={brand.text} strokeOpacity={0.15} strokeWidth={3} />}
            <circle cx={x} cy={yy} r={14} fill={brand.bg} stroke={brand.text} strokeWidth={4} />
            <circle cx={x} cy={yy} r={14 + ping * 30} fill="none" stroke={brand.accent} strokeWidth={2} opacity={1 - ping} />
          </g>
        );
      })}
      <g transform={`translate(${-slide * (W + gap)} 0)`}>
        {blocks.map((b) => {
          const x = 60 + b * (W + gap);
          const isNew = b === 3;
          const drop = isNew ? spring({frame: (f % period) - 4, fps, config: {damping: 12, stiffness: 120}}) : 1;
          const locked = !isNew || t > 0.45;
          const by = y - (1 - drop) * 300;
          return (
            <g key={b} opacity={b === 4 ? 0 : 1}>
              {b < 3 && (
                <g>
                  <rect x={x + W - 6} y={y + W / 2 - 22} width={gap + 12} height={44} rx={22} fill="none" stroke={brand.accent} strokeWidth={6} />
                </g>
              )}
              <rect x={x} y={by} width={W} height={W} rx={26} fill={locked ? brand.bg : a(brand.accentSoft, 0.35)} stroke={brand.text} strokeWidth={5} />
              <text x={x + 26} y={by + 52} fontFamily={GROTESK} fontWeight={700} fontSize={26} letterSpacing={3} fill={brand.accent}>
                BLOCK {1020 + k + b}
              </text>
              {[0, 1, 2].map((r) => (
                <rect key={r} x={x + 26} y={by + 82 + r * 30} width={(W - 52) * (0.9 - r * 0.2)} height={10} rx={5} fill={brand.text} opacity={0.18} />
              ))}
              <g transform={`translate(${x + W / 2 - 24} ${by + W - 74})`} color={locked ? brand.accent : brand.text}>
                <FIcons name="shield" size={48} stroke={7} />
              </g>
            </g>
          );
        })}
      </g>
      {/* validation ripple */}
      <circle cx={60 + 3 * (W + gap) - slide * (W + gap) + W / 2} cy={y + W / 2} r={60 + t * 300} fill="none" stroke={brand.accent} strokeWidth={4} opacity={t > 0.45 && t < 0.8 ? 1 - (t - 0.45) / 0.35 : 0} />
      <text x={540} y={760} textAnchor="middle" fontFamily={GROTESK} fontWeight={700} fontSize={30} letterSpacing={6} fill={brand.text} opacity={0.7}>
        SHARED · VERIFIED · PERMANENT
      </text>
    </svg>
  );
};

/* Robotics: articulated arm (2-joint inverse kinematics) moving boxes along a conveyor */
const ik = (bx: number, by: number, tx: number, ty: number, L1: number, L2: number) => {
  const dx = tx - bx;
  const dy = ty - by;
  const d = Math.min(Math.hypot(dx, dy), L1 + L2 - 1);
  const c2 = Math.max(-1, Math.min(1, (d * d - L1 * L1 - L2 * L2) / (2 * L1 * L2)));
  const opts = [Math.acos(c2), -Math.acos(c2)].map((q2) => {
    const q1 = Math.atan2(dy, dx) - Math.atan2(L2 * Math.sin(q2), L1 + L2 * Math.cos(q2));
    return {x: bx + Math.cos(q1) * L1, y: by + Math.sin(q1) * L1};
  });
  return opts[0].y < opts[1].y ? opts[0] : opts[1]; // elbow up
};

const Robot: React.FC<{brand: FBrand}> = ({brand}) => {
  const f = useCurrentFrame();
  const period = 96;
  const t = (f % period) / period;
  const ease = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, x)));
  const lerp = (p: {x: number; y: number}, q: {x: number; y: number}, k: number) => ({x: p.x + (q.x - p.x) * k, y: p.y + (q.y - p.y) * k});
  const pickLow = {x: 300, y: 660};
  const pickTop = {x: 300, y: 470};
  const mid = {x: 540, y: 330};
  const placeLow = {x: 780, y: 660};
  const placeTop = {x: 780, y: 470};
  const arc = (p: typeof mid, q: typeof mid, k: number) => {
    const e = ease(k);
    const a1 = lerp(p, mid, e);
    const a2 = lerp(mid, q, e);
    return lerp(a1, a2, e); // quadratic bezier through the top
  };
  let tip;
  if (t < 0.12) tip = lerp(pickTop, pickLow, ease(t / 0.12));
  else if (t < 0.22) tip = lerp(pickLow, pickTop, ease((t - 0.12) / 0.1));
  else if (t < 0.5) tip = arc(pickTop, placeTop, (t - 0.22) / 0.28);
  else if (t < 0.6) tip = lerp(placeTop, placeLow, ease((t - 0.5) / 0.1));
  else if (t < 0.7) tip = lerp(placeLow, placeTop, ease((t - 0.6) / 0.1));
  else tip = arc(placeTop, pickTop, (t - 0.7) / 0.3);
  const base = {x: 540, y: 720};
  const L1 = 300;
  const L2 = 260;
  const elbow = ik(base.x, base.y, tip.x, tip.y, L1, L2);
  const holding = t >= 0.12 && t < 0.6;
  const belt = (f * 2) % 60;
  const delivered = (f % period) / period;
  return (
    <svg width={1080} height={900}>
      <rect x={40} y={760} width={1000} height={40} rx={20} fill="none" stroke={brand.text} strokeWidth={5} />
      {Array.from({length: 17}).map((_, i) => (
        <line key={i} x1={60 + i * 60 + belt} y1={770} x2={50 + i * 60 + belt} y2={790} stroke={brand.text} strokeOpacity={0.3} strokeWidth={4} />
      ))}
      {/* box waiting at pick point, sliding in from the left */}
      {t >= 0.6 && <rect x={300 - 45 - (1 - ease((t - 0.6) / 0.3)) * 220} y={690} width={90} height={70} rx={8} fill={brand.accentSoft} stroke={brand.text} strokeWidth={4} />}
      {t < 0.12 && <rect x={255} y={690} width={90} height={70} rx={8} fill={brand.accentSoft} stroke={brand.text} strokeWidth={4} />}
      {/* delivered boxes moving off to the right */}
      {t >= 0.6 && <rect x={735 + ease((t - 0.6) / 0.4) * 140} y={690} width={90} height={70} rx={8} fill={brand.accentSoft} stroke={brand.text} strokeWidth={4} />}
      <rect x={875 + delivered * 140} y={690} width={90} height={70} rx={8} fill={brand.accentSoft} stroke={brand.text} strokeWidth={4} opacity={0.6 * (1 - delivered)} />
      {/* base */}
      <path d={`M${base.x - 110} 760 L${base.x - 70} ${base.y - 10} H${base.x + 70} L${base.x + 110} 760 Z`} fill={brand.bg} stroke={brand.text} strokeWidth={5} />
      {/* arm */}
      <line x1={base.x} y1={base.y} x2={elbow.x} y2={elbow.y} stroke={brand.text} strokeWidth={34} strokeLinecap="round" />
      <line x1={elbow.x} y1={elbow.y} x2={tip.x} y2={tip.y} stroke={brand.text} strokeWidth={26} strokeLinecap="round" />
      <circle cx={base.x} cy={base.y} r={30} fill={brand.accent} />
      <circle cx={elbow.x} cy={elbow.y} r={24} fill={brand.accent} />
      <circle cx={tip.x} cy={tip.y} r={16} fill={brand.accent} />
      <path d={`M${tip.x - 40} ${tip.y + 14} V${tip.y + 52} M${tip.x + 40} ${tip.y + 14} V${tip.y + 52} M${tip.x - 40} ${tip.y + 14} H${tip.x + 40}`} stroke={brand.text} strokeWidth={10} strokeLinecap="round" fill="none" />
      {holding && <rect x={tip.x - 45} y={tip.y + 30} width={90} height={70} rx={8} fill={brand.accentSoft} stroke={brand.text} strokeWidth={4} />}
      <path d={`M${tip.x} ${tip.y} L${tip.x - 80} ${tip.y + 170} H${tip.x + 80} Z`} fill={brand.accent} opacity={0.07 + 0.05 * Math.sin(f / 4)} />
    </svg>
  );
};

/* IoT / smart city: hub talking to connected things */
const Network: React.FC<{brand: FBrand}> = ({brand}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const icons: FIcon[] = ['home', 'car', 'energy', 'health', 'factory', 'retail', 'logistics', 'education'];
  const cx = 540;
  const cy = 430;
  const R = 330;
  return (
    <svg width={1080} height={900}>
      {[1, 2, 3].map((i) => {
        const p = ((f + i * 20) % 60) / 60;
        return <circle key={i} cx={cx} cy={cy} r={90 + p * 260} fill="none" stroke={brand.accent} strokeWidth={3} opacity={(1 - p) * 0.6} />;
      })}
      {icons.map((ic, i) => {
        const ang = (i / icons.length) * Math.PI * 2 - Math.PI / 2 + f * 0.002;
        const x = cx + Math.cos(ang) * R;
        const y = cy + Math.sin(ang) * R;
        const e = spring({frame: f - 4 - i * 4, fps, config: {damping: 12}});
        const pk = ((f + i * 11) % 44) / 44;
        const inbound = i % 2 === 0;
        const pp = inbound ? pk : 1 - pk;
        return (
          <g key={ic}>
            <line x1={cx} y1={cy} x2={cx + (x - cx) * e} y2={cy + (y - cy) * e} stroke={brand.text} strokeOpacity={0.2} strokeWidth={3} strokeDasharray="6 10" />
            <circle cx={x + (cx - x) * pp} cy={y + (cy - y) * pp} r={8} fill={brand.accent} opacity={e} />
            <g transform={`translate(${x} ${y}) scale(${e})`}>
              <circle r={62} fill={brand.bg} stroke={brand.text} strokeWidth={4} />
              <g transform="translate(-36 -36)" color={brand.text}>
                <FIcons name={ic} size={72} stroke={6} t={f} />
              </g>
            </g>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={92} fill={brand.text} />
      <circle cx={cx} cy={cy} r={92} fill="none" stroke={brand.accentSoft} strokeWidth={6} strokeDasharray="10 12" transform={`rotate(${f * 1.5} ${cx} ${cy})`} />
      <g transform={`translate(${cx - 44} ${cy - 44})`} color={brand.accentSoft}>
        <FIcons name="chip" size={88} stroke={6} />
      </g>
    </svg>
  );
};

/* Quantum / space / general frontier tech: orbits around a glowing core */
const Orbit: React.FC<{brand: FBrand}> = ({brand}) => {
  const f = useCurrentFrame();
  const cx = 540;
  const cy = 430;
  const orbits = [0, 60, 120];
  return (
    <svg width={1080} height={900}>
      <defs>
        <radialGradient id="core">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="45%" stopColor={brand.accentSoft} />
          <stop offset="100%" stopColor={brand.accent} stopOpacity={0} />
        </radialGradient>
      </defs>
      {Array.from({length: 60}).map((_, i) => {
        const ang = i * 2.399 + f * 0.004 * (i % 3 ? 1 : -1);
        const r = 40 + ((i * 37) % 300);
        return <circle key={i} cx={cx + Math.cos(ang) * r} cy={cy + Math.sin(ang) * r * 0.9} r={3} fill={brand.text} opacity={0.12 + 0.2 * Math.abs(Math.sin(f / 20 + i))} />;
      })}
      {orbits.map((rot, i) => {
        const ang = f * (0.05 + i * 0.012) + i * 2;
        const ex = cx + Math.cos(ang) * 360;
        const ey = cy + Math.sin(ang) * 120;
        const rad = (rot * Math.PI) / 180;
        const px = cx + (ex - cx) * Math.cos(rad) - (ey - cy) * Math.sin(rad);
        const py = cy + (ex - cx) * Math.sin(rad) + (ey - cy) * Math.cos(rad);
        return (
          <g key={i}>
            <ellipse cx={cx} cy={cy} rx={360} ry={120} fill="none" stroke={brand.text} strokeOpacity={0.35} strokeWidth={4} transform={`rotate(${rot} ${cx} ${cy})`} />
            <circle cx={px} cy={py} r={20} fill={brand.accent} />
            <circle cx={px} cy={py} r={34} fill="none" stroke={brand.accent} strokeWidth={3} opacity={0.5} />
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={120 + 10 * Math.sin(f / 10)} fill="url(#core)" />
      <circle cx={cx} cy={cy} r={46} fill={brand.text} />
    </svg>
  );
};

export const TechVisualView: React.FC<{visual: TechVisual; brand: FBrand}> = ({visual, brand}) => {
  switch (visual) {
    case 'chain':
      return <Chain brand={brand} />;
    case 'robot':
      return <Robot brand={brand} />;
    case 'network':
      return <Network brand={brand} />;
    case 'orbit':
      return <Orbit brand={brand} />;
    case 'neural':
    default:
      return <Neural brand={brand} />;
  }
};
