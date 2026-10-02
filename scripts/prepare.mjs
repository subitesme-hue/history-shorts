// Voice + timing prep. Runs BEFORE `remotion render` (locally or in GitHub Actions).
// For each scene: ElevenLabs text-to-speech WITH TIMESTAMPS -> public/vo/scene-N.mp3,
// stretch the scene to fit its narration, and build exact word-level captions.
// Docs: POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps
//   header xi-api-key, body {text, model_id}; response {audio_base64, alignment{character_start_times_seconds, character_end_times_seconds}}
// If ELEVENLABS_API_KEY is not set, it leaves props.json untouched (auto-timed captions, no voice).

import fs from 'node:fs';
import path from 'node:path';

const FPS = 30;
const TRANSITION_FRAMES = 12; // keep in sync with src/theme.ts
const MIN_SEC = {hook: 4, globe: 5, counter: 4.5, iconGrid: 4, machine: 7, legacy: 5.5, outro: 4};

const propsPath = process.argv[2] ?? 'props.json';
const props = JSON.parse(fs.readFileSync(propsPath, 'utf8'));
const KEY = process.env.ELEVENLABS_API_KEY;
const VOICE = process.env.ELEVENLABS_VOICE_ID;
const MODEL = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';

if (!KEY || !VOICE) {
  console.log('ELEVENLABS_API_KEY / ELEVENLABS_VOICE_ID not set -> rendering without voiceover.');
  process.exit(0);
}

fs.mkdirSync('public/vo', {recursive: true});
const captions = [];
let startFrame = 0;

for (const [i, scene] of props.scenes.entries()) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}/with-timestamps`, {
    method: 'POST',
    headers: {'xi-api-key': KEY, 'Content-Type': 'application/json'},
    body: JSON.stringify({text: scene.narration, model_id: MODEL}),
  });
  if (!res.ok) throw new Error(`ElevenLabs scene ${i}: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const file = `vo/scene-${i}.mp3`;
  fs.writeFileSync(path.join('public', file), Buffer.from(data.audio_base64, 'base64'));

  const a = data.alignment;
  const chars = a.characters ?? [...scene.narration];
  const st = a.character_start_times_seconds;
  const en = a.character_end_times_seconds;
  const audioLen = en[en.length - 1];

  // Group characters into words.
  let word = '', ws = null, we = null;
  const flush = () => {
    if (word.trim()) captions.push({text: word.trim(), startMs: (startFrame / FPS) * 1000 + ws * 1000, endMs: (startFrame / FPS) * 1000 + we * 1000});
    word = ''; ws = null;
  };
  chars.forEach((c, k) => {
    if (/\s/.test(c)) return flush();
    if (ws === null) ws = st[k];
    word += c; we = en[k];
  });
  flush();

  // Scene must hold the full narration + breathing room + the outgoing transition.
  const needed = audioLen + 0.5 + (i < props.scenes.length - 1 ? TRANSITION_FRAMES / FPS : 0);
  scene.durationSec = Math.max(MIN_SEC[scene.type] ?? 4, Math.round(needed * 10) / 10);
  scene.voiceFile = file;
  startFrame += Math.round(scene.durationSec * FPS) - (i < props.scenes.length - 1 ? TRANSITION_FRAMES : 0);
  console.log(`scene ${i} (${scene.type}): voice ${audioLen.toFixed(2)}s -> scene ${scene.durationSec}s`);
}

props.captions = captions;
fs.writeFileSync(propsPath, JSON.stringify(props, null, 2));
console.log(`Total ≈ ${(startFrame / FPS).toFixed(1)}s, ${captions.length} caption words.`);
