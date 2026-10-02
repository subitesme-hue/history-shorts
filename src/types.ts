// Props contract. This is EXACTLY what the n8n Brain node must output.

export type Brand = {
  name: string; // "T&I NEWS"
  url: string; // "tai.news"
  bg: string; // navy
  accent: string; // gold
  text: string; // cream
};

export type CaptionWord = {text: string; startMs: number; endMs: number};

type Base = {durationSec: number; narration: string; voiceFile?: string /* set by scripts/prepare.mjs */};

export type HookScene = Base & {type: 'hook'; kicker: string; headline: string; highlight: string};
export type GlobeScene = Base & {type: 'globe'; lat: number; lon: number; place: string; sub: string};
export type CounterScene = Base & {type: 'counter'; to: number; label: string; sub: string};
export type IconGridScene = Base & {type: 'iconGrid'; count: number; icon: IconName; value: string; label: string};
export type MachineScene = Base & {type: 'machine'; title: string; steps: string[]};
export type LegacyScene = Base & {
  type: 'legacy';
  title: string;
  items: {icon: IconName; then: string; now: string}[];
};
export type OutroScene = Base & {type: 'outro'; name: string; years: string; cta: string};

export type Scene =
  | HookScene
  | GlobeScene
  | CounterScene
  | IconGridScene
  | MachineScene
  | LegacyScene
  | OutroScene;

export type IconName = 'gear' | 'clock' | 'drum' | 'engine' | 'robot' | 'book' | 'drop' | 'bulb';

export type ShortProps = {
  brand: Brand;
  scenes: Scene[];
  voiceoverUrl?: string; // ElevenLabs MP3 URL (optional)
  musicUrl?: string; // background music URL (optional)
  captions?: CaptionWord[]; // word timings from ElevenLabs (optional; else auto-timed)
  sfx?: boolean;
  post?: {content: string; platform_content?: Record<string, unknown>; account_ids: number[]; publish_now?: boolean};
};
