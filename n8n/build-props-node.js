// Parse + validate the Brain output, then build the GitHub dispatch body.
let raw = $json.choices?.[0]?.message?.content || '';
raw = raw.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
let p;
try { p = JSON.parse(raw); } catch (e) { throw new Error('Brain did not return valid JSON: ' + raw.slice(0, 300)); }

const TYPES = ['hook','globe','counter','iconGrid','machine','legacy','outro'];
const ICONS = ['gear','clock','drum','engine','robot','book','drop','bulb'];
const row = $('Pick Innovator').first().json;

// Accept "Hook", "icon_grid", "Icon Grid", "map" etc. and map them to the template's names.
const ALIAS = { hook:'hook', globe:'globe', map:'globe', location:'globe', counter:'counter', year:'counter',
  icongrid:'iconGrid', grid:'iconGrid', machine:'machine', mechanism:'machine', diagram:'machine',
  legacy:'legacy', thennow:'legacy', outro:'outro', ending:'outro', closing:'outro' };
const scenesRaw = Array.isArray(p.scenes) ? p.scenes : (Array.isArray(p.video?.scenes) ? p.video.scenes : []);

// Work out each scene's type: from a type-like field if present, otherwise from the fields the scene contains.
const norm = (t) => ALIAS[String(t || '').toLowerCase().replace(/[^a-z]/g, '')];
const inferType = (s) => {
  const named = norm(s.type ?? s.scene_type ?? s.sceneType ?? s.kind ?? s.template ?? s.layout ?? s.scene);
  if (named) return named;
  if ('headline' in s || 'highlight' in s || 'kicker' in s) return 'hook';
  if ('lat' in s || 'lon' in s || 'latitude' in s || 'place' in s) return 'globe';
  if (Array.isArray(s.steps)) return 'machine';
  if (Array.isArray(s.items)) return 'legacy';
  if ('cta' in s || 'years' in s) return 'outro';
  if ('count' in s && 'icon' in s) return 'iconGrid';
  if ('to' in s) return 'counter';
  return undefined;
};
const unwrap = (s) => {
  // Handles scenes shaped like {"hook": {...}}
  const keys = s && typeof s === 'object' ? Object.keys(s) : [];
  if (keys.length === 1 && norm(keys[0]) && typeof s[keys[0]] === 'object') return { ...s[keys[0]], type: keys[0] };
  return s;
};
const receivedTypes = scenesRaw.map(s => (s && typeof s === 'object') ? (s.type ?? Object.keys(s).join('+')) : typeof s);
let scenes = scenesRaw
  .filter(s => s && typeof s === 'object')
  .map(unwrap)
  .map((s, i) => {
    const t = inferType(s);
    const out = { ...s, type: t };
    if (t === 'globe') { out.lat = Number(s.lat ?? s.latitude); out.lon = Number(s.lon ?? s.lng ?? s.longitude); }
    // Narration: on the scene itself, or in a top-level list/object the Brain may have used instead.
    const topList = [p.narration, p.narrations, p.voiceover, p.script].find(Array.isArray);
    if (!out.narration) out.narration = s.voiceover ?? s.vo ?? s.text ?? s.script ?? s.spoken ?? (topList ? (typeof topList[i] === 'string' ? topList[i] : topList[i]?.narration ?? topList[i]?.text) : undefined);
    return out;
  })
  .filter(s => TYPES.includes(s.type) && s.narration && !(s.type === 'globe' && (isNaN(s.lat) || isNaN(s.lon))));

// Repair order: exactly one hook first, exactly one outro last.
let hookScene = scenes.find(s => s.type === 'hook');
let outroScene = scenes.find(s => s.type === 'outro');
scenes = scenes.filter(s => s.type !== 'hook' && s.type !== 'outro');
if (!hookScene) {
  const first = scenes.shift() || { narration: row.name + ' changed technology forever.' };
  const words = String(first.narration).replace(/[.!?]+$/, '').split(' ');
  hookScene = { type: 'hook', durationSec: 5, narration: first.narration, kicker: row.era || 'Forgotten innovator',
           headline: words.slice(0, -1).slice(0, 6).join(' '), highlight: words.slice(-1)[0] + '.' };
}
if (!outroScene) outroScene = { type: 'outro', durationSec: 4.5, name: row.name, years: row.era || '',
                      cta: 'Follow for more forgotten innovators', narration: row.name + '. Follow for more forgotten innovators.' };
scenes = [hookScene, ...scenes, outroScene];
if (scenes.length < 4) throw new Error('Brain returned too few usable scenes (each needs narration). Scene keys: ' + JSON.stringify(receivedTypes) + ' | Top-level keys: ' + JSON.stringify(Object.keys(p)));

for (const s of scenes) {
  s.durationSec = Number(s.durationSec) || 5;
  if (s.type === 'iconGrid' && !ICONS.includes(s.icon)) s.icon = 'gear';
  if (s.type === 'legacy') (s.items || []).forEach(it => { if (!ICONS.includes(it.icon)) it.icon = 'gear'; });
  if (s.type === 'machine') s.steps = (s.steps || []).slice(0, 4);
}
p.scenes = scenes;

// Fixed brand + posting targets (never trust the model with these)
p.brand = { name: 'T&I NEWS', url: 'tai.news', bg: '#0A1630', accent: '#D4A63A', text: '#F4E9D0' };
p.sfx = true;
// Adds "Visit tai.news for more" to a caption, just above the hashtags (never twice).
function withSite(text) {
  const cta = '🔗 Visit tai.news for more';
  let t = String(text || '').trim();
  if (!t || /tai\.news/i.test(t)) return t;
  const lines = t.split('\n');
  const tagLine = lines.findIndex(l => /^\s*#/.test(l));
  if (tagLine === -1) return t + '\n\n' + cta;
  const before = lines.slice(0, tagLine).join('\n').trim();
  const after = lines.slice(tagLine).join('\n').trim();
  return before + '\n\n' + cta + '\n\n' + after;
}

// X caption: no emojis, website added, always under 120 characters.
function xCaption(text) {
  const site = ' tai.news';
  let t = String(text || '')
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, '')   // strip emojis
    .replace(/#\S+/g, '')                                                             // strip hashtags
    .replace(/https?:\/\/\S+|\btai\.news\b/gi, '')                                 // site is re-added below
    .replace(/\s+/g, ' ').trim();
  const max = 119 - site.length;
  if (t.length > max) t = t.slice(0, max).replace(/\s+\S*$/, '').replace(/[,;:\s]+$/, '') + '…';
  return t + site;
}

const b = p.post || {};
const outro = p.scenes[p.scenes.length - 1];
let ytTitle = (b.youtube_title || (outro.name + ': ' + p.scenes[0].headline + ' ' + p.scenes[0].highlight)).trim();
if (ytTitle.length > 100) ytTitle = ytTitle.slice(0, 97) + '...';   // YouTube title limit is 100 characters
p.post = {
  content: withSite(b.content),
  // Facebook 7748, Instagram 7752, TikTok 7908, YouTube 7751, LinkedIn 9116. X (7747) is a separate post below.
  account_ids: [7748, 7752, 7908, 7751, 9116],
  publish_now: true,
  platform_content: {
    youtube: {
      title: ytTitle,
      description: withSite(b.youtube_description || b.content),
      privacy: 'public',
      made_for_kids: false,
      is_short: true,
      tags: Array.isArray(b.youtube_tags) ? b.youtube_tags.slice(0, 15) : []
    },
    linkedin: { content: withSite(b.linkedin_caption || b.content) }
  },
  x: { account_ids: [7747], content: xCaption(b.x_caption || p.scenes[0].narration) }
};
if (!p.post.content) throw new Error('Brain returned no post.content caption');
delete p.captions;

return [{ json: {
  props: p,
  // Built-in TEST row never posts (render only). Real Sheet rows post.
  dispatch_body: { ref: 'main', inputs: { props: JSON.stringify(p), post: $('Pick Innovator').first().json._test ? 'false' : 'true', voice: 'am_michael' } }
} }];