// Variety step (runs right after the props arrive, before voice/clips/render).
// Picks a voice, music bed and end-card line that the last few Shorts of this series did NOT use,
// so uploads don't look like one template stamped again and again (YouTube "generic or repetitive" rule).
//   node scripts/vary.mjs <props.json> <history|future>
// Writes the choices into the props and, on GitHub Actions, VOICE_PICK / LANG_PICK into $GITHUB_ENV.
// Repo variable VARIETY=off turns it off (the compliance gate still checks variety).
import fs from 'node:fs';
import {CTAS, MUSIC, VOICES, langFor, readJson, writeJson, seriesHistory, topicOf} from './shorts_common.mjs';

const [propsPath = 'props.json', series = 'history'] = process.argv.slice(2);
if (!MUSIC[series]) throw new Error(`Unknown series "${series}" (use history or future)`);
const props = readJson(propsPath, null);
if (!props) throw new Error(`Cannot read ${propsPath}`);

const past = seriesHistory(series).slice(-4);
const recent = (key, n) => past.slice(-n).map((h) => h[key]);

// Stable per topic, so a re-run of the same Short makes the same choices.
let seed = 0;
for (const ch of topicOf(props, series) + (props.post?.platform_content?.youtube?.settings?.title || props.post?.platform_content?.youtube?.title || '')) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
const pick = (pool, avoid) => {
  const fresh = pool.filter((x) => !avoid.includes(x));
  const from = fresh.length ? fresh : pool;
  return from[seed % from.length];
};

const off = String(process.env.VARIETY || '').toLowerCase() === 'off';
const inputVoice = process.env.INPUT_VOICE || 'am_michael';
const voice = off ? inputVoice : pick(VOICES, recent('voice', 3));
const music = off ? props.musicFile : pick(MUSIC[series], recent('music', 2));
const outro = (props.scenes || []).find((s) => s.type === 'outro');
if (outro && !off) outro.cta = pick(CTAS[series], recent('cta', 2));
if (music) props.musicFile = music;
props.compliance = {...(props.compliance || {}), series, voice};

writeJson(propsPath, props);
if (process.env.GITHUB_ENV) fs.appendFileSync(process.env.GITHUB_ENV, `VOICE_PICK=${voice}\nLANG_PICK=${langFor(voice)}\n`);
console.log(`Variety (${off ? 'off' : 'on'}): voice=${voice} lang=${langFor(voice)} music=${props.musicFile || 'auto'} cta="${outro?.cta || ''}"`);
