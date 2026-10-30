// Independent reviewer (runs after the compliance gate, before posting).
// A separate Claude call that did not write the script looks at 8 frames of the finished video plus the narration,
// title and description, and passes or blocks the post.   node scripts/review.mjs <props.json> [video.mp4]
//
// Needs the GitHub secret ANTHROPIC_API_KEY. Without it the review is skipped with a warning (posting continues),
// so the schedule never breaks; once the key is added, a "fail" verdict or an API error blocks the post.
// Model: repo variable REVIEW_MODEL, default claude-sonnet-5-5. Report: out/review.json.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import Anthropic from '@anthropic-ai/sdk';
import {readJson, writeJson, youtubeOf} from './shorts_common.mjs';

const [propsPath = 'props.json', video = 'out/video.mp4'] = process.argv.slice(2);
const props = readJson(propsPath, null);
fs.mkdirSync('out', {recursive: true});
const save = (r) => writeJson('out/review.json', r);

if (!process.env.ANTHROPIC_API_KEY) {
  save({verdict: 'skipped', reason: 'ANTHROPIC_API_KEY secret not set'});
  console.log('::warning::Reviewer skipped: add the ANTHROPIC_API_KEY secret to turn the independent review on.');
  process.exit(0);
}

// ---- frames
const dur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video]).toString().trim());
fs.mkdirSync('out/frames', {recursive: true});
const N = 8;
const frames = [];
for (let i = 0; i < N; i++) {
  const t = ((i + 0.5) * dur) / N;
  const f = `out/frames/f${i}.jpg`;
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', t.toFixed(2), '-i', video, '-frames:v', '1', '-vf', 'scale=432:-2', '-q:v', '4', f]);
  frames.push({t, data: fs.readFileSync(f).toString('base64')});
}

const yt = youtubeOf(props) || {};
const scenes = (props.scenes || []).map((s, i) => `${i + 1}. [${s.type}${s.clip ? ', AI-generated footage' : ''}] ${s.label ? `label "${s.label}" — ` : ''}"${s.narration}"`).join('\n');

const brief = `You are an independent pre-publication reviewer for T&I News YouTube Shorts. You did not make this video.
Decide whether it is safe to publish under YouTube's current rules, and say what to fix.

BLOCK (verdict "fail") only for real problems:
- A real historical person shown with a clear, close-up, identifiable face in AI footage (the format allows only backs, silhouettes, distance, hands).
- Footage or narration that could mislead viewers into thinking AI reconstructions are real archival footage, or a claim that is clearly false.
- Gore, weapons in use, sexual content, shock or emotionally manipulative framing, or anything "off-putting".
- Garbled, misspelled or nonsense text visible inside a frame, or broken/blank frames.
- Title or hook promises something the video doesn't deliver (clickbait).
- AI footage present but the YouTube description lacks an AI-generated disclosure line.
Everything else (style, pacing, small mismatches between a frame and a sentence) goes in "warnings" and does not block.

Reply with ONLY this JSON: {"verdict":"pass"|"fail","blocking_issues":["..."],"warnings":["..."],"summary":"one sentence"}

TITLE: ${yt.title || ''}
DESCRIPTION:
${yt.description || ''}
SCENES (in order, narration in quotes):
${scenes}
FRAMES: ${N} stills at evenly spaced times across the ${dur.toFixed(1)} s video follow.`;

const content = [{type: 'text', text: brief}];
for (const f of frames) {
  content.push({type: 'text', text: `Frame at ${f.t.toFixed(1)} s:`});
  content.push({type: 'image', source: {type: 'base64', media_type: 'image/jpeg', data: f.data}});
}

const client = new Anthropic({maxRetries: 4});
const model = process.env.REVIEW_MODEL || 'claude-sonnet-5-5';
let text = '';
try {
  const msg = await client.messages.create({model, max_tokens: 1500, messages: [{role: 'user', content}]});
  text = msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
} catch (e) {
  save({verdict: 'error', model, error: String(e.message || e)});
  console.log(`::error::Reviewer API call failed (${e.message}). Blocking the post; re-run the job to retry.`);
  process.exit(1);
}

let r;
try { r = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)); } catch {
  save({verdict: 'error', model, raw: text});
  console.log('::error::Reviewer reply was not valid JSON. Blocking the post.');
  process.exit(1);
}
save({...r, model, reviewed_at: new Date().toISOString()});
for (const w of r.warnings || []) console.log(`::warning::Reviewer: ${w}`);
for (const b of r.blocking_issues || []) console.log(`::error::Reviewer: ${b}`);
console.log(`Reviewer (${model}): ${r.verdict} — ${r.summary || ''}`);
if (r.verdict !== 'pass') process.exit(1);
