// Shared helpers for the YouTube compliance steps (vary.mjs, compliance.mjs, review.mjs, record.mjs).
import fs from 'node:fs';

export const HISTORY_FILE = 'compliance/history.json';

// Voices already used in production by the tech-impact-docs pipeline (British voices need lang "b").
export const VOICES = ['am_michael', 'af_heart', 'bm_george', 'am_fenrir', 'bf_emma', 'af_bella'];
export const langFor = (voice) => (voice.startsWith('b') ? 'b' : 'a');

export const MUSIC = {
  history: ['music/history-1.mp3', 'music/history-2.mp3', 'music/history-3.mp3', 'music/history-4.mp3'],
  future: ['music/future-1.mp3', 'music/future-2.mp3', 'music/future-3.mp3', 'music/future-4.mp3'],
};

// On-screen end-card lines (the spoken outro still comes from the script).
export const CTAS = {
  history: [
    'Follow for more forgotten innovators',
    'Follow to meet the next forgotten inventor',
    'A new forgotten innovator every Tuesday',
    'Follow T&I News for more lost inventors',
  ],
  future: [
    'Follow for more future shifts',
    'Follow to see what changes next',
    'A new Future Shift every Wednesday',
    'Follow T&I News for the next shift',
  ],
};

// Line YouTube can read as the creator's AI disclosure (YouTube Help: it may select the disclosure for creators
// who disclose altered or synthetic content in the title or description).
export const DISCLOSURE = {
  history: 'Includes AI-generated reconstructions of historical scenes.',
  future: 'Includes AI-generated visualisations of future scenes.',
};

const ANIM = new Set(['globe', 'counter', 'iconGrid', 'machine', 'legacy', 'shift', 'stat', 'tech', 'steps', 'impact']);

export const readJson = (f, fallback) => {
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return fallback; }
};
export const writeJson = (f, v) => fs.writeFileSync(f, JSON.stringify(v, null, 2) + '\n');

export const seriesHistory = (series) => readJson(HISTORY_FILE, []).filter((h) => h.series === series);

export const youtubeOf = (props) => props.post?.platform_content?.youtube || null;

export const topicOf = (props, series) => {
  const outro = (props.scenes || []).find((s) => s.type === 'outro') || {};
  return String((series === 'history' ? outro.name : outro.topic) || '').trim();
};

// What a viewer would notice as "the same video again".
export const signatureOf = (props, series) => {
  const scenes = props.scenes || [];
  const outro = scenes.find((s) => s.type === 'outro') || {};
  const hook = scenes.find((s) => s.type === 'hook') || {};
  return {
    series,
    topic: topicOf(props, series),
    title: String(youtubeOf(props)?.settings?.title || youtubeOf(props)?.title || '').trim(),
    voice: props.compliance?.voice || 'am_michael',
    music: props.musicFile || 'auto',
    cta: String(outro.cta || ''),
    structure: scenes.map((s) => (ANIM.has(s.type) ? 'anim' : s.type)).join('>'),
    kicker: String(hook.kicker || ''),
    ai_clips: scenes.filter((s) => s.clip).length,
  };
};

export const VARIETY_KEYS = ['voice', 'music', 'cta', 'structure', 'kicker'];
export const differences = (a, b) => VARIETY_KEYS.filter((k) => String(a[k] || '') !== String(b[k] || ''));
