// After a successful post: add this Short's signature to compliance/history.json (keeps the last 60),
// so the next run's variety step and compliance gate compare against it.  node scripts/record.mjs
import {HISTORY_FILE, readJson, writeJson} from './shorts_common.mjs';

const sig = readJson('out/signature.json', null);
if (!sig) throw new Error('out/signature.json missing (compliance gate did not run).');
const all = readJson(HISTORY_FILE, []);
all.push({...sig, date: new Date().toISOString().slice(0, 10)});
writeJson(HISTORY_FILE, all.slice(-60));
console.log(`Recorded ${sig.series} Short "${sig.title}" in ${HISTORY_FILE}.`);
