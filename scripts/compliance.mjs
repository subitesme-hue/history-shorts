// YouTube compliance gate (runs after render, before posting). Fixes what it safely can, then blocks the post
// if a hard rule still fails.  node scripts/compliance.mjs <props.json> <history|future> [video.mp4]
//
// Fixes:  moves the YouTube fields into platform_content.youtube.settings, the only place PostEverywhere reads them
//         (verified in @posteverywhere/sdk 1.6.1 YouTubeSettings + @posteverywhere/mcp 1.14.0 changelog, Oct 20 2026);
//         sets settings.containsSyntheticMedia (YouTube's "altered or synthetic content" disclosure) from whether
//         the video has AI footage, and adds a matching line to the description.
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

// ---- 1. YouTube fields -> platform_content.youtube.settings (title, description, tags, privacyStatus, madeForKids,
//         categoryId, containsSyntheticMedia). The old flat keys (title, privacy, made_for_kids, is_short ...) are removed.
if (!yt) errors.push('No post.platform_content.youtube block, so YouTube would get no title or settings.');
else {
  const st = {...(yt.settings || {})};
  const take = (...vals) => vals.find((v) => v !== undefined && v !== null && v !== '');
  st.title = String(take(st.title, yt.title) || '').trim();
  st.description = String(take(st.description, yt.description, yt.content) || '');
  const tags = take(st.tags, yt.tags);
  if (tags) st.tags = (Array.isArray(tags) ? tags : String(tags).split(',')).map((t) => String(t).trim()).filter(Boolean).slice(0, 15);
  st.privacyStatus = take(st.privacyStatus, yt.privacy, 'public');
  st.madeForKids = take(st.madeForKids, yt.made_for_kids, false);
  st.categoryId = String(take(st.categoryId, process.env.YT_CATEGORY_ID, '28')); // 28 = Science & Technology
  st.containsSyntheticMedia = aiScenes > 0;
  for (const k of ['title', 'description', 'tags', 'privacy', 'made_for_kids', 'is_short']) delete yt[k];
  yt.content = st.description; // PostEverywhere: the YouTube description goes in content
  yt.settings = st;
  fixes.push(`YouTube settings set: title, description, ${st.tags ? 'tags, ' : ''}privacyStatus=${st.privacyStatus}, madeForKids=${st.madeForKids}, categoryId=${st.categoryId}, containsSyntheticMedia=${st.containsSyntheticMedia}.`);

  if (!st.title) errors.push('YouTube title is empty.');
  if (st.title.length > 100) errors.push(`YouTube title is ${st.title.length} characters (limit 100).`);
  if (st.madeForKids !== false) errors.push('"Made for kids" is not false.');
  if (!['public', 'unlisted', 'private'].includes(st.privacyStatus)) errors.push(`Invalid privacyStatus "${st.privacyStatus}".`);

  // ---- 2. AI disclosure: the API flag above + a plain line in the description for viewers
  if (aiScenes > 0) {
    const line = DISCLOSURE[series];
    if (!st.description.includes(line)) {
      const at = st.description.search(/\n\s*(🔗|#)/);
      st.description = at === -1 ? `${st.description.trim()}\n\n${line}` : `${st.description.slice(0, at).trim()}\n\n${line}${st.description.slice(at)}`;
      yt.content = st.description;
      fixes.push(`Added AI disclosure line to the description (${aiScenes} AI scene(s)).`);
    }
    if (st.containsSyntheticMedia !== true || !st.description.includes(line)) errors.push('AI footage present but disclosure is incomplete.');
  }
  if (st.description.length > 5000) errors.push('YouTube description is over 5000 characters.');
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
