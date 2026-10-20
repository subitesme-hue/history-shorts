// Waits for scripts/ai_clips.mjs (started in the background) to finish, then sets scene.clip in the props
// for every clip that was generated. Scenes without a clip keep their animated fallback.
import fs from 'node:fs';

const propsPath = process.argv[2] ?? 'props.json';
const waitMin = Number(process.env.AI_CLIPS_TIMEOUT_MIN || 14) + 1;
const deadline = Date.now() + waitMin * 60000;
while (!fs.existsSync('public/clips/DONE') && Date.now() < deadline) await new Promise((r) => setTimeout(r, 5000));
if (!fs.existsSync('public/clips/DONE')) console.log('AI clip step did not finish in time -> rendering with fallbacks.');

let manifest = {};
try {
  manifest = JSON.parse(fs.readFileSync('public/clips/manifest.json', 'utf8'));
} catch {}

const props = JSON.parse(fs.readFileSync(propsPath, 'utf8'));
let n = 0;
props.scenes.forEach((s, i) => {
  delete s.clip;
  delete s.clipSec;
  if (manifest[i] && fs.existsSync('public/' + manifest[i])) {
    s.clip = manifest[i];
    s.clipSec = Number(process.env.SEEDANCE_DURATION || 8);
    n++;
  }
});
fs.writeFileSync(propsPath, JSON.stringify(props, null, 2));

// Report how much of the video is animation vs AI footage (target: animation 10-25 s).
let anim = 0;
let ai = 0;
for (const s of props.scenes) (s.clip ? (ai += s.durationSec) : s.type === 'cinema' ? 0 : (anim += s.durationSec));
console.log(`Clips merged: ${n}. AI footage ≈ ${ai.toFixed(1)}s, animation ≈ ${anim.toFixed(1)}s.`);
