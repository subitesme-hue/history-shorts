// AI cinematic clips for every scene that has a "prompt" (hook + cinema scenes).
// Generator: Seedance 2.0 Mini on KIE.AI (replaced Seedance 1.5 Pro, retired 21 Oct 2026 04:00 UTC).
// Spec verified at docs.kie.ai/market/bytedance/seedance-2-mini: resolution 480p|720p only, duration 4-15, no fixed_lens.
//   Submit: POST https://api.kie.ai/api/v1/jobs/createTask
//           {model:"bytedance/seedance-2-mini", input:{prompt, aspect_ratio, resolution, duration, generate_audio}}
//           -> data.taskId
//   Poll:   GET  https://api.kie.ai/api/v1/jobs/recordInfo?taskId=...
//           -> data.state ("success" | "fail" | still working), data.resultJson (JSON string) -> resultUrls[0]
//
// All clips are submitted at once and polled together. Results go to public/clips/scene-N.mp4 and
// public/clips/manifest.json ({"N": "clips/scene-N.mp4"}). A clip that fails is simply left out:
// that scene then renders its animated fallback card, so a video is never blocked by one bad clip.
// Run it in the background while the voice is made; scripts/merge_clips.mjs copies the manifest into the props.
//
// Env: KIE_API_KEY (required, GitHub secret). Optional repo variables:
//   SEEDANCE_MODEL (default bytedance/seedance-2-mini), SEEDANCE_RESOLUTION (720p), SEEDANCE_DURATION (8),
//   AI_CLIPS_MAX (5), AI_CLIPS_TIMEOUT_MIN (14)

import fs from 'node:fs';
import path from 'node:path';

const propsPath = process.argv[2] ?? 'props.json';
const OUT_DIR = 'public/clips';
const MANIFEST = path.join(OUT_DIR, 'manifest.json');
const KEY = process.env.KIE_API_KEY;
const NEW_MODEL = 'bytedance/seedance-2-mini';
// A leftover SEEDANCE_MODEL repo variable pointing at the retired 1.5 Pro is upgraded automatically.
const envModel = String(process.env.SEEDANCE_MODEL || '').trim();
const MODEL = !envModel || /seedance-1\.5/i.test(envModel) ? NEW_MODEL : envModel;
// 2.0 Mini accepts only 480p or 720p; anything else falls back to 720p.
const RES = ['480p', '720p'].includes(process.env.SEEDANCE_RESOLUTION) ? process.env.SEEDANCE_RESOLUTION : '720p';
// 2.0 Mini accepts 4-15 seconds.
const DURATION = Math.min(15, Math.max(4, Math.round(Number(process.env.SEEDANCE_DURATION || 8))));
const MAX = Number(process.env.AI_CLIPS_MAX || 5);
const TIMEOUT_MS = Number(process.env.AI_CLIPS_TIMEOUT_MIN || 14) * 60000;
const BASE = 'https://api.kie.ai/api/v1/jobs';

fs.mkdirSync(OUT_DIR, {recursive: true});
const manifest = {};
const save = () => fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
const done = () => {
  save();
  fs.writeFileSync(path.join(OUT_DIR, 'DONE'), new Date().toISOString());
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Every clip gets the same look so the cuts feel like one film. No text, no logos, no real faces in close-up.
const STYLE =
  'Vertical 9:16 cinematic documentary shot, photorealistic, shallow depth of field, natural film grain, ' +
  'warm golden key light with deep shadows, smooth slow camera movement, high detail. ' +
  'No on-screen text, no subtitles, no captions, no logos, no watermark.';

const props = JSON.parse(fs.readFileSync(propsPath, 'utf8'));
const jobs = (props.scenes || [])
  .map((s, i) => ({i, prompt: String(s.prompt || '').trim()}))
  .filter((j) => j.prompt.length > 10)
  .slice(0, MAX);

if (!jobs.length) {
  console.log('No scene prompts -> no AI clips needed.');
  done();
  process.exit(0);
}
if (!KEY) {
  console.log('KIE_API_KEY secret is not set -> skipping AI clips (scenes use their animated fallback).');
  done();
  process.exit(0);
}

const api = async (url, opts = {}) => {
  const r = await fetch(url, {...opts, headers: {Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', ...(opts.headers || {})}});
  const text = await r.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`HTTP ${r.status} non-JSON: ${text.slice(0, 200)}`);
  }
  if (!r.ok || (json.code && json.code !== 200)) throw new Error(`HTTP ${r.status} code ${json.code}: ${json.msg || text.slice(0, 200)}`);
  return json;
};

const submit = async (job) => {
  const body = {
    model: MODEL,
    input: {
      prompt: `${job.prompt}\n${STYLE}`.slice(0, 2500),
      aspect_ratio: '9:16',
      resolution: RES,
      duration: DURATION,
      generate_audio: false,
    },
  };
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const j = await api(`${BASE}/createTask`, {method: 'POST', body: JSON.stringify(body)});
      const id = j.data?.taskId;
      if (!id) throw new Error('no data.taskId in response: ' + JSON.stringify(j).slice(0, 200));
      console.log(`scene ${job.i}: submitted ${id}`);
      return id;
    } catch (e) {
      console.log(`scene ${job.i}: submit attempt ${attempt} failed: ${e.message}`);
      if (attempt === 2) return null;
      await sleep(5000);
    }
  }
};

const resultUrl = (data) => {
  let rj = data?.resultJson;
  if (typeof rj === 'string') {
    try {
      rj = JSON.parse(rj);
    } catch {
      rj = {};
    }
  }
  return rj?.resultUrls?.[0] || rj?.resultUrl || data?.videoUrl || null;
};

const download = async (job, url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`download HTTP ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length < 20000) throw new Error(`download too small (${buf.length} bytes)`);
  const rel = `clips/scene-${job.i}.mp4`;
  fs.writeFileSync(path.join('public', rel), buf);
  manifest[job.i] = rel;
  save();
  console.log(`scene ${job.i}: saved ${rel} (${(buf.length / 1e6).toFixed(1)} MB)`);
};

const started = Date.now();
await Promise.all(jobs.map(async (job) => (job.id = await submit(job))));
let pending = jobs.filter((j) => j.id);

while (pending.length && Date.now() - started < TIMEOUT_MS) {
  await sleep(15000);
  const still = [];
  for (const job of pending) {
    try {
      const j = await api(`${BASE}/recordInfo?taskId=${encodeURIComponent(job.id)}`);
      const d = j.data || {};
      const state = String(d.state || '').toLowerCase();
      if (state === 'success') {
        const url = resultUrl(d);
        if (!url) console.log(`scene ${job.i}: success but no result URL: ${JSON.stringify(d).slice(0, 300)}`);
        else await download(job, url).catch((e) => console.log(`scene ${job.i}: ${e.message}`));
      } else if (state === 'fail' || state === 'failed') {
        console.log(`scene ${job.i}: generation failed: ${d.failMsg || d.failCode || JSON.stringify(d).slice(0, 200)}`);
      } else {
        still.push(job);
      }
    } catch (e) {
      console.log(`scene ${job.i}: poll error (will retry): ${e.message}`);
      still.push(job);
    }
  }
  pending = still;
  if (pending.length) console.log(`${pending.length} clip(s) still generating… ${Math.round((Date.now() - started) / 1000)}s`);
}
if (pending.length) console.log(`Timed out waiting for scenes ${pending.map((j) => j.i).join(', ')} -> they use the animated fallback.`);
console.log(`AI clips ready: ${Object.keys(manifest).length}/${jobs.length}`);
done();
