// Parses + validates the Brain output and builds the GitHub dispatch body for render-future.yml.
let raw = $json.choices?.[0]?.message?.content || '';
raw = raw.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
let p;
try { p = JSON.parse(raw); } catch (e) { throw new Error('Brain did not return valid JSON: ' + raw.slice(0, 300)); }

const row = $('Pick Topic').first().json;
const TYPES = ['hook', 'shift', 'stat', 'tech', 'steps', 'impact', 'outro'];
const VISUALS = ['neural', 'chain', 'robot', 'network', 'orbit'];
const ICONS = ['factory','health','finance','retail','logistics','education','home','farm','city','energy','car','chip','shield','globe','people','chart'];
const str = (v, max) => String(v ?? '').trim().slice(0, max);

let scenes = (Array.isArray(p.scenes) ? p.scenes : [])
  .filter(s => s && typeof s === 'object')
  .map(s => ({ ...s, type: String(s.type || '').toLowerCase() }))
  .filter(s => TYPES.includes(s.type) && String(s.narration || '').trim());

for (const s of scenes) {
  s.narration = String(s.narration).trim();
  s.durationSec = Math.min(9, Math.max(4, Number(s.durationSec) || 5));
  if (s.type === 'hook') { s.kicker = str(s.kicker || 'The future', 30); s.headline = str(s.headline, 60); s.highlight = str(s.highlight, 24); }
  if (s.type === 'shift') { s.then = str(s.then, 40); s.next = str(s.next, 40); if (s.thenLabel) s.thenLabel = str(s.thenLabel, 20); if (s.nextLabel) s.nextLabel = str(s.nextLabel, 20); }
  if (s.type === 'stat') {
    s.value = Number(String(s.value).replace(/[^0-9.\-]/g, ''));
    s.isYear = !!s.isYear || (Number.isInteger(s.value) && s.value >= 1000 && s.value <= 2100 && !s.prefix && !s.suffix);
    s.decimals = s.isYear ? 0 : Math.min(1, Math.max(0, Number(s.decimals) || 0));
    s.prefix = str(s.prefix, 3); s.suffix = str(s.suffix, 12); s.label = str(s.label, 60); s.sub = str(s.sub, 40);
  }
  if (s.type === 'tech') { if (!VISUALS.includes(s.visual)) s.visual = row.visual || 'neural'; s.title = str(s.title || 'How it works', 30); s.caption = str(s.caption, 50); }
  if (s.type === 'steps') { s.title = str(s.title || 'How it works', 30); s.steps = (s.steps || []).slice(0, 4).map(x => str(x, 30)); }
  if (s.type === 'impact') {
    s.title = str(s.title || 'What changes', 26);
    s.items = (s.items || []).slice(0, 3).map(it => ({ icon: ICONS.includes(it.icon) ? it.icon : 'chart', sector: str(it.sector, 18), change: str(it.change, 34) }));
  }
  if (s.type === 'outro') { s.topic = str(s.topic || row.topic, 28); s.line = str(s.line || 'The future is being built now.', 40); s.cta = 'Follow for more future shifts'; }
}
// Drop scenes that would render broken.
scenes = scenes.filter(s =>
  !(s.type === 'stat' && !isFinite(s.value)) &&
  !(s.type === 'steps' && s.steps.length < 3) &&
  !(s.type === 'impact' && s.items.length < 2) &&
  !(s.type === 'hook' && (!s.headline || !s.highlight)));

// Exactly one hook first, one outro last.
let hook = scenes.find(s => s.type === 'hook');
let outro = scenes.find(s => s.type === 'outro');
scenes = scenes.filter(s => s.type !== 'hook' && s.type !== 'outro');
if (!hook) throw new Error('Brain returned no usable hook scene. Types: ' + JSON.stringify((p.scenes || []).map(s => s && s.type)));
if (!outro) outro = { type: 'outro', durationSec: 4.5, topic: row.topic, line: 'The future is being built now.', cta: 'Follow for more future shifts', narration: row.topic + '. Follow T&I News for more future shifts.' };
scenes = [hook, ...scenes.slice(0, 5), outro];
if (scenes.length < 5) throw new Error('Brain returned too few usable scenes: ' + scenes.map(s => s.type).join(','));

// Fixed brand, music and posting targets (never trusted to the model).
const out = {
  brand: { name: 'T&I NEWS', url: 'tai.news', series: 'FUTURE SHIFT', bg: '#F7F2E6', bg2: '#EADFC6', accent: '#B07F22', accentSoft: '#D8B565', text: '#0B1F44' },
  sfx: true,
  musicFile: row.music || 'music/future-1.mp3',
  musicVolume: 0.4,
  scenes,
};

function withSite(text) {
  const cta = '🔗 Visit tai.news for more';
  let t = String(text || '').trim();
  if (!t || /tai\.news/i.test(t)) return t;
  const lines = t.split('\n');
  const tagLine = lines.findIndex(l => /^\s*#/.test(l));
  if (tagLine === -1) return t + '\n\n' + cta;
  return lines.slice(0, tagLine).join('\n').trim() + '\n\n' + cta + '\n\n' + lines.slice(tagLine).join('\n').trim();
}
function xCaption(text) {
  const site = ' tai.news';
  let t = String(text || '')
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, '')
    .replace(/#\S+/g, '')
    .replace(/https?:\/\/\S+|\btai\.news\b/gi, '')
    .replace(/\s+/g, ' ').trim();
  const max = 119 - site.length;
  if (t.length > max) t = t.slice(0, max).replace(/\s+\S*$/, '').replace(/[,;:\s]+$/, '') + '…';
  return t + site;
}

const b = p.post || {};
if (!b.content) throw new Error('Brain returned no post.content caption');
let ytTitle = (b.youtube_title || (row.topic + ': ' + hook.headline + ' ' + hook.highlight + ' #Shorts')).trim();
if (ytTitle.length > 100) ytTitle = ytTitle.slice(0, 97) + '...';
out.post = {
  content: withSite(b.content),
  // Facebook 7748, Instagram 7752, TikTok 7908, YouTube 7751, LinkedIn 9116. X 7747 is a separate post.
  account_ids: [7748, 7752, 7908, 7751, 9116],
  publish_now: true,
  platform_content: {
    youtube: {
      title: ytTitle,
      description: withSite(b.youtube_description || b.content),
      privacy: 'public',
      made_for_kids: false,
      is_short: true,
      tags: Array.isArray(b.youtube_tags) ? b.youtube_tags.slice(0, 15) : [],
    },
    linkedin: { content: withSite(b.linkedin_caption || b.content) },
  },
  x: { account_ids: [7747], content: xCaption(b.x_caption || hook.narration) },
};

return [{ json: {
  props: out,
  // Manual "Test run" renders only; the schedule posts.
  dispatch_body: { ref: 'main', inputs: { props: JSON.stringify(out), post: row._test ? 'false' : 'true', voice: 'am_michael' } },
} }];
