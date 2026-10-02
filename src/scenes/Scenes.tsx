import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {geoGraticule10, geoOrthographic, geoPath} from 'd3-geo';
import {feature} from 'topojson-client';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import landTopo from 'world-atlas/land-110m.json';
import type {
  Brand,
  CounterScene,
  GlobeScene,
  HookScene,
  IconGridScene,
  LegacyScene,
  MachineScene,
  OutroScene,
} from '../types';
import {SANS, SERIF} from '../theme';
import {Gear} from '../components/Gear';
import {Icon} from '../components/Icon';

const land = feature(landTopo as any, (landTopo as any).objects.land) as any;

const useEnter = (delay = 0, damping = 14) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - delay, fps, config: {damping, stiffness: 140}});
};

const Kicker: React.FC<{text: string; brand: Brand; delay?: number}> = ({text, brand, delay = 0}) => {
  const e = useEnter(delay);
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 18, opacity: e, transform: `translateY(${(1 - e) * 30}px)`}}>
      <div style={{width: interpolate(e, [0, 1], [0, 70]), height: 6, background: brand.accent, borderRadius: 3}} />
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, letterSpacing: 8, color: brand.accent}}>{text.toUpperCase()}</div>
    </div>
  );
};

/* ---------------- HOOK ---------------- */
export const Hook: React.FC<{s: HookScene; brand: Brand}> = ({s, brand}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const words = s.headline.split(' ');
  const hl = useEnter(10 + words.length * 4);
  const underline = interpolate(frame, [22 + words.length * 4, 40 + words.length * 4], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const zoom = interpolate(frame, [0, s.durationSec * fps], [1, 1.08]);
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <Gear cx={860} cy={420} r={260} teeth={24} angle={frame * 0.6} color={brand.accent} opacity={0.14} />
        <Gear cx={500} cy={220} r={150} teeth={14} angle={-frame * 0.6 * (24 / 14) + 9} color={brand.accent} opacity={0.1} />
        <Gear cx={230} cy={1020} r={190} teeth={18} angle={-frame * 0.5} color={brand.text} opacity={0.05} />
      </svg>
      <AbsoluteFill style={{padding: '0 90px', justifyContent: 'center', top: -250, transform: `scale(${zoom})`}}>
        <Kicker text={s.kicker} brand={brand} />
        <div style={{marginTop: 40, display: 'flex', flexWrap: 'wrap', gap: '0 26px'}}>
          {words.map((w, i) => {
            const e = spring({frame: frame - 8 - i * 4, fps, config: {damping: 13, stiffness: 160}});
            return (
              <span
                key={i}
                style={{
                  fontFamily: SERIF,
                  fontWeight: 900,
                  fontSize: 122,
                  lineHeight: 1.08,
                  color: brand.text,
                  opacity: e,
                  transform: `translateY(${(1 - e) * 60}px)`,
                  display: 'inline-block',
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
        <div style={{position: 'relative', alignSelf: 'flex-start', marginTop: 10, opacity: hl, transform: `scale(${interpolate(hl, [0, 1], [1.4, 1])})`, transformOrigin: 'left center'}}>
          <span style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 150, color: brand.accent}}>{s.highlight}</span>
          <div style={{position: 'absolute', left: 0, bottom: 6, height: 12, width: `${underline * 100}%`, background: brand.accent, borderRadius: 6}} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------------- GLOBE ---------------- */
export const Globe: React.FC<{s: GlobeScene; brand: Brand}> = ({s, brand}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = interpolate(frame, [0, 2.4 * fps], [0, 1], {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const lon = interpolate(t, [0, 1], [-s.lon - 120, -s.lon]);
  const lat = interpolate(t, [0, 1], [0, -s.lat * 0.7]);
  const scale = interpolate(t, [0, 1], [320, 400]);
  const proj = geoOrthographic().translate([540, 600]).scale(scale).rotate([lon, lat]).clipAngle(90);
  const path = geoPath(proj);
  const pin = proj([s.lon, s.lat]);
  const pinIn = spring({frame: frame - 2.4 * fps, fps, config: {damping: 9, stiffness: 160}});
  const pulse = ((frame - 2.4 * fps) % 40) / 40;
  const card = spring({frame: frame - 2.8 * fps, fps, config: {damping: 15}});
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <defs>
          <radialGradient id="ocean" cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#1C3A6B" />
            <stop offset="100%" stopColor="#0A1A38" />
          </radialGradient>
        </defs>
        <circle cx={540} cy={600} r={scale + 26} fill="none" stroke={brand.accent} strokeOpacity={0.25} strokeWidth={3} strokeDasharray="4 14" transform={`rotate(${frame * 0.3} 540 600)`} />
        <path d={path({type: 'Sphere'} as any) ?? ''} fill="url(#ocean)" stroke={brand.accent} strokeWidth={4} />
        <path d={path(geoGraticule10()) ?? ''} fill="none" stroke={brand.text} strokeOpacity={0.12} strokeWidth={1.5} />
        <path d={path(land) ?? ''} fill={brand.text} fillOpacity={0.88} stroke={brand.bg} strokeWidth={1} />
        {pin && frame > 2.4 * fps && (
          <g transform={`translate(${pin[0]} ${pin[1]})`}>
            <circle r={20 + pulse * 70} fill="none" stroke={brand.accent} strokeWidth={5} opacity={1 - pulse} />
            <g transform={`translate(0 ${(1 - pinIn) * -120}) scale(${pinIn})`}>
              <path d="M0 0 C-10 -22 -30 -38 -30 -62 A30 30 0 1 1 30 -62 C30 -38 10 -22 0 0 Z" fill={brand.accent} />
              <circle cy={-62} r={11} fill={brand.bg} />
            </g>
          </g>
        )}
      </svg>
      <AbsoluteFill style={{top: 1060 - 50 * card, alignItems: 'center', opacity: card}}>
        <div style={{background: 'rgba(10,22,48,0.85)', border: `3px solid ${brand.accent}`, borderRadius: 28, padding: '20px 44px', textAlign: 'center'}}>
          <div style={{fontFamily: SERIF, fontWeight: 900, fontSize: 64, color: brand.text}}>{s.place}</div>
          <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 4, color: brand.accent, marginTop: 4}}>{s.sub.toUpperCase()}</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------------- COUNTER ---------------- */
export const Counter: React.FC<{s: CounterScene; brand: Brand}> = ({s, brand}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = interpolate(frame, [6, 2.2 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.poly(4))});
  const val = Math.round(p * s.to);
  const done = spring({frame: frame - 2.2 * fps, fps, config: {damping: 8, stiffness: 200}});
  const lbl = spring({frame: frame - 2.4 * fps, fps, config: {damping: 15}});
  const R = 330;
  const C = 2 * Math.PI * R;
  return (
    <AbsoluteFill style={{alignItems: 'center'}}>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <circle cx={540} cy={580} r={R} fill="none" stroke={brand.text} strokeOpacity={0.08} strokeWidth={26} />
        <circle
          cx={540}
          cy={580}
          r={R}
          fill="none"
          stroke={brand.accent}
          strokeWidth={26}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - p)}
          transform="rotate(-90 540 580)"
        />
        {Array.from({length: 60}).map((_, i) => (
          <line key={i} x1={540} y1={580 - R - 50} x2={540} y2={580 - R - (i % 5 === 0 ? 80 : 64)} stroke={brand.accent} strokeOpacity={i / 60 < p ? 0.8 : 0.15} strokeWidth={4} transform={`rotate(${i * 6} 540 580)`} />
        ))}
      </svg>
      <div style={{position: 'absolute', top: 580 - 120, width: 1080, textAlign: 'center', fontFamily: SERIF, fontWeight: 900, fontSize: 230, lineHeight: 1, color: brand.text, transform: `scale(${1 + done * 0.06 - (done > 0.99 ? 0.06 : 0) * 0})`}}>
        {val}
      </div>
      <div style={{position: 'absolute', top: 580 + 130, width: 1080, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 36, letterSpacing: 10, color: brand.accent}}>CE</div>
      <div style={{position: 'absolute', top: 980, width: 900, left: 90, textAlign: 'center', opacity: lbl, transform: `translateY(${(1 - lbl) * 40}px)`}}>
        <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 52, lineHeight: 1.2, color: brand.text}}>{s.label}</div>
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: brand.accent, marginTop: 14}}>{s.sub.toUpperCase()}</div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- ICON GRID ---------------- */
export const IconGrid: React.FC<{s: IconGridScene; brand: Brand}> = ({s, brand}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const cols = 10;
  const rows = Math.ceil(s.count / cols);
  const cell = 92;
  const gx = (1080 - cols * cell) / 2;
  const gy = 560;
  const shown = Math.floor(interpolate(frame, [8, 2.4 * fps], [0, s.count], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const head = spring({frame, fps, config: {damping: 13}});
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 230, width: 1080, textAlign: 'center', opacity: head, transform: `scale(${interpolate(head, [0, 1], [0.6, 1])})`}}>
        <div style={{fontFamily: SERIF, fontWeight: 900, fontSize: 210, lineHeight: 1, color: brand.accent}}>
          {Math.min(shown, s.count) || ''}
          {shown < s.count ? '' : ''}
        </div>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, letterSpacing: 6, color: brand.text, marginTop: 6}}>{s.label.toUpperCase()}</div>
      </div>
      {Array.from({length: s.count}).map((_, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols);
        const appear = 8 + (i / s.count) * (2.4 * fps - 8);
        const e = spring({frame: frame - appear, fps, config: {damping: 10, stiffness: 220}});
        return (
          <div key={i} style={{position: 'absolute', left: gx + c * cell + 8, top: gy + r * cell + 8, transform: `scale(${e})`, color: i % 7 === 3 ? brand.accent : brand.text, opacity: 0.25 + 0.75 * e}}>
            <Icon name={s.icon} size={cell - 16} stroke={7} spin={frame * (i % 2 ? 2 : -2)} />
          </div>
        );
      })}
      <div style={{position: 'absolute', top: gy + rows * cell + 20, width: 1080, textAlign: 'center', fontFamily: SANS, fontWeight: 600, fontSize: 30, letterSpacing: 3, color: brand.text, opacity: 0.6}}>
        {s.value}
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- MACHINE (programmable drum) ---------------- */
export const Machine: React.FC<{s: MachineScene; brand: Brand}> = ({s, brand}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const speed = 3;
  const half = Math.floor(s.durationSec * fps * 0.55);
  // Pegs pattern changes halfway: "move the pegs, change the rhythm".
  const patternA = [0, 2, 4, 6];
  const patternB = [0, 1, 3, 4, 5, 7];
  const pattern = frame < half ? patternA : patternB;
  const spacing = 110;
  const drumY = 760;
  const strikerX = 540;
  const offset = (frame * speed) % (spacing * 8);
  const pegs: number[] = [];
  for (let rep = -1; rep < 3; rep++) pattern.forEach((p) => pegs.push(rep * spacing * 8 + p * spacing - offset + 120));
  const hit = pegs.some((x) => Math.abs(x - strikerX) < 16);
  const lastHit = pegs.map((x) => strikerX - x).filter((d) => d >= 0 && d < 60);
  const lift = lastHit.length ? interpolate(Math.min(...lastHit), [0, 60], [1, 0], {extrapolateRight: 'clamp'}) : 0;
  const swap = spring({frame: frame - half, fps, config: {damping: 10}});
  const title = spring({frame, fps, config: {damping: 14}});
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 230, left: 90, right: 90, opacity: title}}>
        <Kicker text={s.title} brand={brand} />
      </div>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        {/* drive gears */}
        <Gear cx={150} cy={drumY + 230} r={110} teeth={16} angle={frame * speed * 0.5} color={brand.accent} opacity={0.9} />
        <Gear cx={150 + 110 + 72} cy={drumY + 230 - 10} r={72} teeth={10} angle={-frame * speed * 0.5 * (16 / 10) + 18} color={brand.text} opacity={0.8} />
        {/* water stream feeding the wheel */}
        {Array.from({length: 7}).map((_, i) => (
          <circle key={i} cx={150 + Math.sin((frame + i * 9) / 6) * 4} cy={((frame * 9 + i * 40) % 280) + 380} r={9} fill="#5FB4FF" opacity={0.7} />
        ))}
        {/* drum (peg cylinder) */}
        <rect x={60} y={drumY - 70} width={960} height={140} rx={70} fill="#13274D" stroke={brand.accent} strokeWidth={5} />
        {Array.from({length: 14}).map((_, i) => {
          const x = ((i * 80 - offset * 1) % 1120) + 1120;
          return <line key={i} x1={(x % 1120) - 20} y1={drumY - 66} x2={(x % 1120) - 20} y2={drumY + 66} stroke={brand.text} strokeOpacity={0.08} strokeWidth={3} />;
        })}
        {pegs
          .filter((x) => x > 80 && x < 1000)
          .map((x, i) => (
            <rect key={i} x={x - 16} y={drumY - 104} width={32} height={50} rx={8} fill={brand.accent} opacity={frame >= half ? interpolate(swap, [0, 1], [0.2, 1]) : 1} />
          ))}
        {/* striker lever */}
        <g transform={`rotate(${-lift * 18} ${strikerX + 160} ${drumY - 150})`}>
          <rect x={strikerX - 20} y={drumY - 168} width={200} height={26} rx={13} fill={brand.text} />
          <circle cx={strikerX + 160} cy={drumY - 155} r={18} fill={brand.accent} />
        </g>
        {/* drum being hit */}
        <g transform={`translate(${strikerX - 60} ${drumY - 340}) scale(${1 + (hit ? 0.12 : 0)})`} style={{color: brand.text}}>
          <foreignObject width={130} height={130}>
            <Icon name="drum" size={120} color={hit ? brand.accent : brand.text} stroke={7} />
          </foreignObject>
        </g>
        {hit &&
          Array.from({length: 6}).map((_, i) => (
            <line key={i} x1={strikerX + Math.cos((i * Math.PI) / 3 + 0.5) * 85} y1={drumY - 280 + Math.sin((i * Math.PI) / 3 + 0.5) * 85} x2={strikerX + Math.cos((i * Math.PI) / 3 + 0.5) * 130} y2={drumY - 280 + Math.sin((i * Math.PI) / 3 + 0.5) * 130} stroke={brand.accent} strokeWidth={6} strokeLinecap="round" opacity={0.8} />
          ))}
      </svg>
      {/* steps */}
      <div style={{position: 'absolute', top: drumY + 120, left: 380, right: 60, display: 'flex', flexDirection: 'column', gap: 18}}>
        {s.steps.map((st, i) => {
          const at = Math.round((i / s.steps.length) * s.durationSec * fps * 0.85) + 6;
          const e = spring({frame: frame - at, fps, config: {damping: 14}});
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 18, opacity: e, transform: `translateX(${(1 - e) * 80}px)`}}>
              <div style={{width: 52, height: 52, borderRadius: 26, background: brand.accent, color: brand.bg, fontFamily: SANS, fontWeight: 900, fontSize: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>{i + 1}</div>
              <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 34, color: brand.text}}>{st}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- LEGACY (then → now) ---------------- */
export const Legacy: React.FC<{s: LegacyScene; brand: Brand}> = ({s, brand}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{padding: '230px 70px 0'}}>
      <Kicker text={s.title} brand={brand} />
      <div style={{display: 'flex', flexDirection: 'column', gap: 34, marginTop: 50}}>
        {s.items.map((it, i) => {
          const e = spring({frame: frame - 8 - i * 14, fps, config: {damping: 14}});
          const arrow = interpolate(frame, [20 + i * 14, 40 + i * 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 26,
                background: 'rgba(255,255,255,0.05)',
                border: `2px solid rgba(212,166,58,${0.25 + 0.5 * arrow})`,
                borderRadius: 30,
                padding: '26px 30px',
                opacity: e,
                transform: `translateX(${(1 - e) * -120}px)`,
              }}
            >
              <div style={{color: brand.accent, flexShrink: 0}}>
                <Icon name={it.icon} size={110} stroke={6} spin={frame * 3} />
              </div>
              <div style={{flex: 1}}>
                <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 28, letterSpacing: 3, color: brand.text, opacity: 0.6}}>{it.then.toUpperCase()}</div>
                <div style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: 6}}>
                  <div style={{width: 60 * arrow, height: 5, background: brand.accent, borderRadius: 3}} />
                  <div style={{fontFamily: SERIF, fontWeight: 900, fontSize: 52, color: brand.text, opacity: arrow}}>{it.now}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- OUTRO ---------------- */
export const Outro: React.FC<{s: OutroScene; brand: Brand}> = ({s, brand}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const a = spring({frame, fps, config: {damping: 13}});
  const b = spring({frame: frame - 12, fps, config: {damping: 14}});
  const c = spring({frame: frame - 24, fps, config: {damping: 12}});
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', top: -260}}>
      <svg width={1080} height={1920} style={{position: 'absolute', top: 260}}>
        <Gear cx={540} cy={960} r={420} teeth={36} angle={frame * 0.3} color={brand.accent} opacity={0.07} />
      </svg>
      <div style={{fontFamily: SERIF, fontWeight: 900, fontSize: 140, color: brand.text, opacity: a, transform: `scale(${interpolate(a, [0, 1], [1.3, 1])})`, textAlign: 'center', lineHeight: 1}}>{s.name}</div>
      <div style={{width: 300 * b, height: 8, background: brand.accent, borderRadius: 4, margin: '30px 0'}} />
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 46, letterSpacing: 10, color: brand.accent, opacity: b}}>{s.years}</div>
      <div style={{marginTop: 70, opacity: c, transform: `translateY(${(1 - c) * 40}px)`, textAlign: 'center'}}>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: brand.text}}>{s.cta}</div>
        <div style={{marginTop: 40, display: 'inline-flex', alignItems: 'center', gap: 20, border: `3px solid ${brand.accent}`, borderRadius: 999, padding: '14px 40px'}}>
          <span style={{fontFamily: SANS, fontWeight: 900, fontSize: 40, color: brand.accent}}>{brand.name}</span>
          <span style={{fontFamily: SANS, fontWeight: 600, fontSize: 34, color: brand.text}}>{brand.url}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
