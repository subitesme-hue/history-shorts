// YouTube compliance gate (runs after render, before posting). Fixes what it safely can, then blocks the post
// if a hard rule still fails.  node scripts/compliance.mjs <props.json> <history|future> [video.mp4]
//
// Fixes:  adds the AI-disclosure line to the YouTube description when the video contains AI footage;
//         sets the YouTube disclosure field if repo variable YT_SYNTHETIC_FIELD names it (e.g. once PostEverywhere
//         confirms the exact key) — left unset until confirmed, never guessed.
// Blocks: missing YouTube block/title, title > 100 chars, "made for kids" not false, AI footage without disclosure,
//         same title or topic as an earlier Short, too similar to any of the last 3 Shorts, bad video length.
// Report: out/compliance.json (uploaded as an Actions artifact).
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {DISCLOSURE, differences, readJson, writeJson, seriesHistory, signatureOf, youtubeOf} from './shorts_common.mjs';

const [propsPath = 'props.json', series = 'history', video = 'out/video.mp4'] = process.argv.slice(2);
const props = readJson(propsPath, null);
if (!props) throw new Error(`Cannot read ${propsPath}`);

const errors = [];
const warnings = [];
const fixes = [];
const yt = youtubeOf(props);
const aiScenes = (props.scenes || []).filter((s) => s.clip).length;

// ---- 1. YouTube fields
if (!yt) errors.push('No post.platform_content.youtube block, so YouTube would get no title or settings.');
else {
  const title = String(yt.title || yt.settings?.title || '').trim();
  if (!title) errors.push('YouTube title is empty.');
  if (title.length > 100) errors.push(`YouTube title is ${title.length} characters (limit 100).`);
  const kids = yt.made_for_kids ?? yt.settings?.madeForKids;
  if (kids !== false) errors.push('"Made for kids" is not explicitly false.');

  // ---- 2. AI disclosure
  if (aiScenes > 0) {
    const line = DISCLOSURE[series];
    const desc = String(yt.description || '');
    if (!desc.includes(line)) {
      // Put it above the "Visit tai.news" line / hashtags if present, else at the end.
      const at = desc.search(/\n\s*(🔗|#)/);
      yt.description = at === -1 ? `${desc.trim()}\n\n${line}` : `${desc.slice(0, at).trim()}\n\n${line}${desc.slice(at)}`;
      fixes.push(`Added AI disclosure line to the YouTube description (${aiScenes} AI scene(s)).`);
    }
    const field = String(process.env.YT_SYNTHETIC_FIELD || '').trim();
    if (field) {
      yt.settings = {...(yt.settings || {}), [field]: true};
      fixes.push(`Set youtube.settings.${field} = true.`);
    } else {
      warnings.push('YouTube "altered content" flag not sent by API (repo variable YT_SYNTHETIC_FIELD not set yet); relying on the description disclosure.');
    }
    if (!String(yt.description).includes(line)) errors.push('AI footage present but the disclosure line is missing.');
  }
  if (String(yt.description || '').length > 5000) errors.push('YouTube description is over 5000 characters.');
}
if (props.post?.x?.content && props.post.x.content.length > 120) errors.push(`X caption is ${props.post.x.content.length} characters (limit 120).`);

// ---- 3. Not a repeat, and not a copy of the last few
const sig = signatureOf(props, series);
const past = seriesHistory(series);
const real = past.filter((h) => !h.seed);
if (sig.title && real.some((h) => h.title.toLowerCase() === sig.title.toLowerCase())) errors.push(`Title already used: "${sig.title}".`);
if (sig.topic && real.some((h) => h.topic.toLowerCase() === sig.topic.toLowerCase())) errors.push(`Topic already posted: "${sig.topic}".`);
for (const h of past.slice(-3)) {
  const diff = differences(sig, h);
  if (diff.length < 2) errors.push(`Too similar to the Short of ${h.date}${h.topic ? ` (${h.topic})` : ''}: ${diff.length ? 'only ' + diff.join(', ') + ' differs' : 'nothing differs'}. Needs 2+ of voice, music, end card, structure, hook.`);
}
if (past.slice(-3).length && past.slice(-3).every((h) => h.structure === sig.structure)) {
  warnings.push(`Same scene order as the last ${past.slice(-3).length} Shorts (${sig.structure}). Consider rotating story formats in the Brain prompt.`);
}

// ---- 4. Video file
if (fs.existsSync(video)) {
  try {
    const dur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video]).toString().trim());
    sig.duration = Math.round(dur * 10) / 10;
    if (!(dur >= 8 && dur <= 180)) errors.push(`Video is ${dur.toFixed(1)} s; a Short must be 8-180 s.`);
  } catch (e) { warnings.push('Could not read video duration: ' + e.message); }
} else errors.push(`Rendered video not found at ${video}.`);

writeJson(propsPath, props);
fs.mkdirSync('out', {recursive: true});
const report = {series, ok: errors.length === 0, errors, warnings, fixes, signature: sig, checked_at: new Date().toISOString()};
writeJson('out/compliance.json', report);
writeJson('out/signature.json', sig);

for (const f of fixes) console.log('FIXED   ', f);
for (const w of warnings) console.log(`::warning::${w}`);
for (const e of errors) console.log(`::error::${e}`);
console.log(report.ok ? 'Compliance gate PASSED.' : 'Compliance gate FAILED: the video will not be posted.');
if (!report.ok) process.exit(1);
