// Props contract for the FUTURE SHIFT series (emerging tech -> futuristic societies).
// This is exactly what the n8n "Build Props" node sends to GitHub Actions.
import type {CaptionWord} from '../types';

export type FBrand = {
  name: string; // "T&I NEWS"
  url: string; // "tai.news"
  series: string; // "FUTURE SHIFT"
  bg: string; // ivory
  bg2: string; // deeper ivory/sand for gradients
  accent: string; // gold
  accentSoft: string; // pale gold for lines/glows
  text: string; // navy
};

export type FIcon =
  | 'factory' | 'health' | 'finance' | 'retail' | 'logistics' | 'education' | 'home' | 'farm'
  | 'city' | 'energy' | 'car' | 'chip' | 'shield' | 'globe' | 'people' | 'chart';

export type TechVisual = 'neural' | 'chain' | 'robot' | 'network' | 'orbit';

type Base = {durationSec: number; narration: string; voiceFile?: string};

export type FHook = Base & {type: 'hook'; kicker: string; headline: string; highlight: string};
export type FShift = Base & {type: 'shift'; thenLabel?: string; then: string; nextLabel?: string; next: string};
export type FStat = Base & {type: 'stat'; value: number; prefix?: string; suffix?: string; decimals?: number; isYear?: boolean; label: string; sub: string};
export type FTech = Base & {type: 'tech'; visual: TechVisual; title: string; caption: string};
export type FSteps = Base & {type: 'steps'; title: string; steps: string[]};
export type FImpact = Base & {type: 'impact'; title: string; items: {icon: FIcon; sector: string; change: string}[]};
export type FOutro = Base & {type: 'outro'; topic: string; line: string; cta: string};

export type FScene = FHook | FShift | FStat | FTech | FSteps | FImpact | FOutro;

export type FutureProps = {
  brand: FBrand;
  scenes: FScene[];
  captions?: CaptionWord[];
  musicFile?: string; // e.g. "music/future-2.mp3" (in /public)
  musicVolume?: number; // 0..1, default 0.26 (auto-ducks under the voice)
  sfx?: boolean;
  post?: unknown;
};
