import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {FBrand, FHook, FImpact, FOutro, FShift, FStat, FSteps, FTech} from './types';
import {DISPLAY, GROTESK, SAFE_TOP, a} from './style';
import {FIcons} from './FIcons';
import {TechVisualView} from './TechVisuals';

const useIn = (delay = 0, damping = 14, stiffness = 140) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - delay, fps, config: {damping, stiffness}});
};

const Kicker: React.FC<{text: string; brand: FBrand; delay?: number; instant?: boolean; center?: boolean}> = ({text, brand, delay = 0, instant, center}) => {
  const anim = useIn(delay);
  const e = instant ? 1 : anim;
  return (
    <div style={{display: 'flex', alignItems: 'center', justifyContent: center ? 'center' : 'flex-start', gap: 18, opacity: e, transform: `translateY(${(1 - e) * 26}px)`}}>
      <div style={{width: interpolate(e, [0, 1], [0, 64]), height: 5, background: brand.accent, borderRadius: 3}} />
      <div style={{fontFamily: GROTESK, fontWeight: 700, fontSize: 36, letterSpacing: 9, color: brand.accent}}>{text.toUpperCase()}</div>
      {center && <div style={{width: interpolate(e, [0, 1], [0, 64]), height: 5, background: brand.accent, borderRadius: 3}} />}
    </div>
  );
};

// Shrinks long display text so it never overflows.
const fit = (text: string, base: number, maxChars: number) => (text.length > maxChars ? Math.max(base * 0.6, Math.round((base * maxChars) / text.length)) : base);

/* ---------- HOOK: art-deco sunburst + headline that settles, gold payoff word ---------- */
export const Hook: React.FC<{s: FHook; brand: FBrand}> = ({s, brand}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const words = s.headline.split(' ');
  const hl = useIn(4, 12);
  const size = fit(s.headline, 124, 30);
  const sweep = interpolate(frame, [10, 40], [-400, 1400], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const zoom = interpolate(frame, [0, s.durationSec * fps], [1, 1.06]);
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g transform={`rotate(${frame * 0.15} 540 760)`}>
          {Array.from({length: 48}).map((_, i) => {
            const ang = (i / 48) * Math.PI * 2;
            const len = i % 2 ? 520 : 680;
            return (
              <line
                key={i}
                x1={540 + Math.cos(ang) * 200}
                y1={760 + Math.sin(ang) * 200}
                x2={540 + Math.cos(ang) * len}
                y2={760 + Math.sin(ang) * len}
                stroke={brand.accentSoft}
                strokeOpacity={i % 2 ? 0.28 : 0.45}
                strokeWidth={i % 2 ? 2 : 3}
              />
            );
          })}
        </g>
        <circle cx={540} cy={760} r={200} fill="none" stroke={brand.accent} strokeOpacity={0.35} strokeWidth={3} />
      </svg>
      <AbsoluteFill style={{padding: '0 84px', justifyContent: 'center', top: -110, transform: `scale(${zoom})`}}>
        <Kicker text={s.kicker} brand={brand} instant />
        <div style={{marginTop: 36, display: 'flex', flexWrap: 'wrap', gap: '0 24px'}}>
          {words.map((w, i) => {
            // visible from frame 0 (thumbnail), words only settle into place
            const e = spring({frame: frame - i * 3, fps, config: {damping: 12, stiffness: 140}});
            return (
              <span key={i} style={{fontFamily: DISPLAY, fontSize: size, lineHeight: 1.04, color: brand.text, display: 'inline-block', transform: `translateY(${(1 - e) * 16}px)`}}>
                {w}
              </span>
            );
          })}
        </div>
        <div style={{position: 'relative', alignSelf: 'flex-start', marginTop: 6, transform: `scale(${interpolate(hl, [0, 1], [1.12, 1])})`, transformOrigin: 'left center'}}>
          <span style={{fontFamily: DISPLAY, fontStyle: 'italic', fontSize: fit(s.highlight, 150, 12), color: brand.accent}}>{s.highlight}</span>
          <div style={{position: 'absolute', left: 4, bottom: 10, height: 10, width: '100%', background: brand.accentSoft, borderRadius: 5, opacity: 0.8}} />
        </div>
        {/* light sweep across the title */}
        <div style={{position: 'absolute', top: 380, left: sweep, width: 240, height: 1000, transform: 'skewX(-18deg)', background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0) 100%)', WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, black 30%, black 70%, transparent 100%)', maskImage: 'linear-gradient(180deg, transparent 0%, black 30%, black 70%, transparent 100%)'}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------- SHIFT: industrial age card fades back, future society card lights up ---------- */
const FactoryArt: React.FC<{brand: FBrand; f: number}> = ({brand, f}) => (
  <svg width={240} height={200} viewBox="0 0 240 200">
    <g fill="none" stroke={brand.text} strokeWidth={6} strokeLinejoin="round">
      <path d="M10 186 V110 L60 140 V110 L110 140 V110 L160 140 V60 H190 V186 Z" />
      <path d="M200 186 V40 H222 V186" />
      <line x1={0} y1={186} x2={240} y2={186} />
    </g>
    {[0, 1, 2].map((i) => {
      const p = ((f + i * 18) % 54) / 54;
      return <circle key={i} cx={211 + p * 14} cy={30 - p * 40} r={7 + p * 12} fill={brand.text} opacity={0.25 * (1 - p)} />;
    })}
  </svg>
);

const FutureArt: React.FC<{brand: FBrand; f: number}> = ({brand, f}) => (
  <svg width={240} height={200} viewBox="0 0 240 200">
    <g fill="none" stroke={brand.text} strokeWidth={6} strokeLinejoin="round">
      <path d="M20 186 V90 L45 70 L70 90 V186" />
      <path d="M90 186 V30 Q110 10 130 30 V186" />
      <path d="M150 186 V70 H200 V186" />
      <line x1={0} y1={186} x2={240} y2={186} />
    </g>
    <path d="M45 70 Q110 -10 175 70" fill="none" stroke={brand.accent} strokeWidth={4} strokeDasharray="6 8" strokeDashoffset={-f * 1.5} />
    {[[45, 120], [110, 60], [110, 120], [175, 110], [175, 150]].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={7} fill={brand.accent} opacity={0.4 + 0.6 * Math.abs(Math.sin(f / 9 + i))} />
    ))}
    <circle cx={30 + ((f * 2) % 200)} cy={18 + Math.sin(f / 6) * 6} r={6} fill={brand.text} />
  </svg>
);

export const Shift: React.FC<{s: FShift; brand: FBrand}> = ({s, brand}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const total = s.durationSec * fps;
  const nextAt = Math.round(total * 0.42);
  const c1 = useIn(4, 14);
  const c2 = spring({frame: frame - nextAt, fps, config: {damping: 13}});
  const line = interpolate(frame, [nextAt - 18, nextAt + 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const card = (label: string, text: string, art: React.ReactNode, e: number, live: boolean, dim: number) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 30,
        padding: '30px 34px',
        borderRadius: 34,
        background: live ? '#FFFDF7' : a('#FFFFFF', 0.45),
        border: `3px solid ${live ? brand.accent : a(brand.text, 0.15)}`,
        boxShadow: live ? `0 24px 60px ${a(brand.accent, 0.28)}` : 'none',
        opacity: e * (1 - dim * 0.45),
        transform: `translateY(${(1 - e) * 60}px) scale(${1 - dim * 0.04})`,
        filter: dim ? `grayscale(${dim})` : undefined,
      }}
    >
      <div style={{flexShrink: 0}}>{art}</div>
      <div>
        <div style={{fontFamily: GROTESK, fontWeight: 700, fontSize: 28, letterSpacing: 6, color: brand.accent}}>{label.toUpperCase()}</div>
        <div style={{fontFamily: DISPLAY, fontSize: fit(text, 54, 30), lineHeight: 1.12, color: brand.text, marginTop: 8}}>{text}</div>
      </div>
    </div>
  );
  return (
    <AbsoluteFill style={{padding: `${SAFE_TOP + 20}px 64px 0`}}>
      <Kicker text="The shift" brand={brand} />
      <div style={{marginTop: 46}}>{card(s.thenLabel || 'Industrial age', s.then, <FactoryArt brand={brand} f={frame} />, c1, false, c2)}</div>
      <div style={{height: 150, position: 'relative'}}>
        <svg width={952} height={150} style={{position: 'absolute'}}>
          <line x1={476} y1={14} x2={476} y2={14 + 122 * line} stroke={brand.accent} strokeWidth={6} strokeLinecap="round" />
          <path d={`M456 ${110 * line + 14} L476 ${130 * line + 14} L496 ${110 * line + 14}`} fill="none" stroke={brand.accent} strokeWidth={6} strokeLinecap="round" opacity={line} />
          <circle cx={476} cy={14 + 122 * line} r={12} fill={brand.accentSoft} opacity={line < 1 ? 1 : 0} />
        </svg>
      </div>
      {card(s.nextLabel || 'Future society', s.next, <FutureArt brand={brand} f={frame} />, c2, true, 0)}
    </AbsoluteFill>
  );
};

/* ---------- STAT: gold gauge + counter with prefix / suffix ---------- */
export const Stat: React.FC<{s: FStat; brand: FBrand}> = ({s, brand}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = interpolate(frame, [6, 2.2 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.poly(4))});
  const dec = Math.max(0, Math.min(2, s.decimals ?? (Number.isInteger(s.value) ? 0 : 1)));
  const val = s.isYear ? String(Math.round(p * s.value)) : (p * s.value).toLocaleString('en-US', {minimumFractionDigits: dec, maximumFractionDigits: dec});
  const lbl = spring({frame: frame - 2.3 * fps, fps, config: {damping: 15}});
  const cx = 540;
  const cy = 640;
  const R = 320;
  const start = 135;
  const sweep = 270;
  const arc = (deg: number) => {
    const r1 = ((start) * Math.PI) / 180;
    const r2 = ((start + deg) * Math.PI) / 180;
    const large = deg > 180 ? 1 : 0;
    return `M${cx + Math.cos(r1) * R} ${cy + Math.sin(r1) * R} A${R} ${R} 0 ${large} 1 ${cx + Math.cos(r2) * R} ${cy + Math.sin(r2) * R}`;
  };
  const main = `${s.prefix ?? ''}${val}`;
  const numSize = main.length > 7 ? Math.round(200 * 7 / main.length) : 200;
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <path d={arc(sweep)} fill="none" stroke={brand.text} strokeOpacity={0.09} strokeWidth={30} strokeLinecap="round" />
        <path d={arc(Math.max(0.1, sweep * p))} fill="none" stroke={brand.accent} strokeWidth={30} strokeLinecap="round" />
        {Array.from({length: 46}).map((_, i) => {
          const deg = start + (i / 45) * sweep;
          const r = (deg * Math.PI) / 180;
          const long = i % 5 === 0;
          return (
            <line
              key={i}
              x1={cx + Math.cos(r) * (R + 40)}
              y1={cy + Math.sin(r) * (R + 40)}
              x2={cx + Math.cos(r) * (R + (long ? 74 : 58))}
              y2={cy + Math.sin(r) * (R + (long ? 74 : 58))}
              stroke={i / 45 <= p ? brand.accent : brand.text}
              strokeOpacity={i / 45 <= p ? 0.9 : 0.15}
              strokeWidth={4}
            />
          );
        })}
        <circle
          cx={cx + Math.cos(((start + sweep * p) * Math.PI) / 180) * R}
          cy={cy + Math.sin(((start + sweep * p) * Math.PI) / 180) * R}
          r={26}
          fill={brand.bg}
          stroke={brand.accent}
          strokeWidth={8}
        />
      </svg>
      <div style={{position: 'absolute', top: cy - 120, width: 1080, textAlign: 'center', lineHeight: 1}}>
        <span style={{fontFamily: DISPLAY, fontSize: numSize, color: brand.text}}>{main}</span>
        {s.suffix && <span style={{fontFamily: DISPLAY, fontStyle: 'italic', fontSize: Math.round(numSize * 0.48), color: brand.accent, marginLeft: 10}}>{s.suffix}</span>}
      </div>
      <div style={{position: 'absolute', top: 1000, left: 90, width: 900, textAlign: 'center', opacity: lbl, transform: `translateY(${(1 - lbl) * 40}px)`}}>
        <div style={{fontFamily: DISPLAY, fontStyle: 'italic', fontSize: fit(s.label, 54, 40), lineHeight: 1.15, color: brand.text}}>{s.label}</div>
        <div style={{fontFamily: GROTESK, fontWeight: 700, fontSize: 28, letterSpacing: 5, color: brand.accent, marginTop: 14}}>{s.sub.toUpperCase()}</div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- TECH: big animated diagram of the technology ---------- */
export const Tech: React.FC<{s: FTech; brand: FBrand}> = ({s, brand}) => {
  const cap = useIn(18, 15);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: SAFE_TOP + 10, left: 84, right: 84}}>
        <Kicker text={s.title} brand={brand} />
      </div>
      <div style={{position: 'absolute', top: 300}}>
        <TechVisualView visual={s.visual} brand={brand} />
      </div>
      <div style={{position: 'absolute', top: 1168, left: 90, right: 90, textAlign: 'center', opacity: cap, transform: `translateY(${(1 - cap) * 30}px)`}}>
        <span style={{fontFamily: DISPLAY, fontStyle: 'italic', fontSize: fit(s.caption, 50, 44), color: brand.text}}>{s.caption}</span>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- STEPS: "how it works" timeline ---------- */
export const Steps: React.FC<{s: FSteps; brand: FBrand}> = ({s, brand}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const total = s.durationSec * fps;
  const steps = s.steps.slice(0, 4);
  const top = 470;
  const gap = 180;
  const at = (i: number) => Math.round(6 + (i / steps.length) * total * 0.8);
  const active = steps.reduce((acc, _, i) => (frame >= at(i) ? i : acc), 0);
  const lineP = interpolate(frame, [at(0), at(steps.length - 1) + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: SAFE_TOP + 10, left: 84, right: 84}}>
        <Kicker text={s.title} brand={brand} />
      </div>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <line x1={150} y1={top} x2={150} y2={top + gap * (steps.length - 1)} stroke={brand.text} strokeOpacity={0.12} strokeWidth={8} strokeLinecap="round" />
        <line x1={150} y1={top} x2={150} y2={top + gap * (steps.length - 1) * lineP} stroke={brand.accent} strokeWidth={8} strokeLinecap="round" />
        <circle cx={150} cy={top + gap * (steps.length - 1) * lineP} r={16} fill={brand.accentSoft} opacity={lineP < 1 ? 1 : 0} />
      </svg>
      {steps.map((st, i) => {
        const e = spring({frame: frame - at(i), fps, config: {damping: 12, stiffness: 160}});
        const on = i === active;
        return (
          <div key={i} style={{position: 'absolute', left: 104, top: top + i * gap - 46, right: 70, display: 'flex', alignItems: 'center', gap: 34, opacity: e, transform: `translateX(${(1 - e) * 60}px)`}}>
            <div
              style={{
                width: 92,
                height: 92,
                borderRadius: 46,
                flexShrink: 0,
                background: on ? brand.text : brand.bg,
                border: `5px solid ${on ? brand.text : brand.accent}`,
                color: on ? brand.accentSoft : brand.accent,
                fontFamily: DISPLAY,
                fontSize: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `scale(${on ? 1.1 : 1})`,
                boxShadow: on ? `0 14px 34px ${a(brand.text, 0.25)}` : 'none',
              }}
            >
              {i + 1}
            </div>
            <div style={{fontFamily: GROTESK, fontWeight: on ? 700 : 500, fontSize: on ? 48 : 42, lineHeight: 1.15, color: brand.text, opacity: on ? 1 : 0.62}}>{st}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------- IMPACT: three sectors being transformed ---------- */
export const Impact: React.FC<{s: FImpact; brand: FBrand}> = ({s, brand}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{padding: `${SAFE_TOP + 10}px 64px 0`}}>
      <Kicker text={s.title} brand={brand} />
      <div style={{display: 'flex', flexDirection: 'column', gap: 40, marginTop: 60}}>
        {s.items.slice(0, 3).map((it, i) => {
          const e = spring({frame: frame - 8 - i * 14, fps, config: {damping: 14}});
          const bar = interpolate(frame, [14 + i * 14, 34 + i * 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          return (
            <div
              key={i}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 30,
                background: '#FFFDF7',
                borderRadius: 30,
                padding: '40px 36px 40px 48px',
                boxShadow: `0 18px 44px ${a(brand.text, 0.1)}`,
                border: `2px solid ${a(brand.accent, 0.25 + 0.4 * bar)}`,
                opacity: e,
                transform: `translateX(${(1 - e) * 140}px)`,
                overflow: 'hidden',
              }}
            >
              <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 12, background: brand.accent, transform: `scaleY(${bar})`, transformOrigin: 'top'}} />
              <div style={{width: 128, height: 128, borderRadius: 64, background: a(brand.accentSoft, 0.28), display: 'flex', alignItems: 'center', justifyContent: 'center', color: brand.text, flexShrink: 0}}>
                <FIcons name={it.icon} size={80} stroke={6} t={frame} />
              </div>
              <div style={{flex: 1}}>
                <div style={{fontFamily: GROTESK, fontWeight: 700, fontSize: 28, letterSpacing: 6, color: brand.accent}}>{it.sector.toUpperCase()}</div>
                <div style={{fontFamily: DISPLAY, fontSize: fit(it.change, 48, 34), lineHeight: 1.12, color: brand.text, marginTop: 6, opacity: bar}}>{it.change}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ---------- OUTRO ---------- */
export const Outro: React.FC<{s: FOutro; brand: FBrand}> = ({s, brand}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const e1 = spring({frame, fps, config: {damping: 13}});
  const e2 = spring({frame: frame - 12, fps, config: {damping: 14}});
  const e3 = spring({frame: frame - 24, fps, config: {damping: 12}});
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', top: -200}}>
      <svg width={1080} height={1920} style={{position: 'absolute', top: 200}}>
        {[220, 300, 380].map((r, i) => (
          <circle key={i} cx={540} cy={760} r={r * (0.8 + 0.2 * e1)} fill="none" stroke={brand.accent} strokeOpacity={0.3 - i * 0.07} strokeWidth={3} strokeDasharray={i === 1 ? '3 14' : undefined} transform={`rotate(${frame * (i % 2 ? -0.4 : 0.4)} 540 760)`} />
        ))}
      </svg>
      <div style={{fontFamily: GROTESK, fontWeight: 700, fontSize: 30, letterSpacing: 10, color: brand.accent, opacity: e1}}>{brand.series}</div>
      <div style={{fontFamily: DISPLAY, fontSize: fit(s.topic, 130, 12), color: brand.text, opacity: e1, transform: `scale(${interpolate(e1, [0, 1], [1.25, 1])})`, textAlign: 'center', lineHeight: 1.02, marginTop: 18, padding: '0 60px'}}>
        {s.topic}
      </div>
      <div style={{width: 280 * e2, height: 6, background: brand.accent, borderRadius: 3, margin: '30px 0'}} />
      <div style={{fontFamily: DISPLAY, fontStyle: 'italic', fontSize: fit(s.line, 52, 36), color: brand.text, opacity: e2, textAlign: 'center', padding: '0 80px'}}>{s.line}</div>
      <div style={{marginTop: 60, opacity: e3, transform: `translateY(${(1 - e3) * 40}px)`, textAlign: 'center'}}>
        <div style={{fontFamily: GROTESK, fontWeight: 600, fontSize: 38, color: brand.text}}>{s.cta}</div>
        <div style={{marginTop: 34, display: 'inline-flex', alignItems: 'center', gap: 20, background: brand.text, borderRadius: 999, padding: '16px 44px'}}>
          <span style={{fontFamily: GROTESK, fontWeight: 700, fontSize: 38, letterSpacing: 2, color: brand.accentSoft}}>{brand.name}</span>
          <span style={{fontFamily: GROTESK, fontWeight: 500, fontSize: 34, color: brand.bg}}>{brand.url}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
