// Posts out/video.mp4 through PostEverywhere using the same 4 calls your n8n chain already uses:
// 1) POST {base}/media/upload {filename, content_type, size} -> data.media_id, data.upload_url
// 2) PUT raw bytes to upload_url (Content-Type: video/mp4)
// 3) POST {base}/media/{media_id}/complete
// 4) POST {base}/posts {media_ids, account_ids, content, platform_content, publish_now}
// Base URL from PostEverywhere docs (posteverywhere.ai/docs): https://app.posteverywhere.ai/api/v1 (override with PE_BASE_URL if it ever changes).

import fs from 'node:fs';

const props = JSON.parse(fs.readFileSync(process.argv[2] ?? 'props.json', 'utf8'));
const BASE = (process.env.PE_BASE_URL || 'https://app.posteverywhere.ai/api/v1').replace(/\/$/, '');
const KEY = process.env.PE_API_KEY;
if (!props.post) { console.log('No "post" block in props -> skipping posting.'); process.exit(0); }
if (!KEY) throw new Error('Add the PE_API_KEY secret in GitHub (Settings → Secrets and variables → Actions) to post.');

const auth = {Authorization: `Bearer ${KEY}`};
const bytes = fs.readFileSync('out/video.mp4');
const call = async (url, opts) => {
  const r = await fetch(url, opts);
  const t = await r.text();
  if (!r.ok) throw new Error(`${opts.method} ${url} -> ${r.status} ${t}`);
  return t ? JSON.parse(t) : {};
};

const up = await call(`${BASE}/media/upload`, {
  method: 'POST',
  headers: {...auth, 'Content-Type': 'application/json'},
  body: JSON.stringify({filename: 'short.mp4', content_type: 'video/mp4', size: bytes.length}),
});
const mediaId = up.data.media_id;
const put = await fetch(up.data.upload_url, {method: 'PUT', headers: {'Content-Type': 'video/mp4'}, body: bytes});
if (!put.ok) throw new Error(`PUT bytes -> ${put.status} ${await put.text()}`);
await call(`${BASE}/media/${mediaId}/complete`, {method: 'POST', headers: auth});
await new Promise((r) => setTimeout(r, 3000)); // media reached ready in ~2s in your n8n runs

const post = await call(`${BASE}/posts`, {
  method: 'POST',
  headers: {...auth, 'Content-Type': 'application/json'},
  body: JSON.stringify({
    media_ids: [mediaId],
    account_ids: props.post.account_ids,
    content: props.post.content,
    platform_content: props.post.platform_content ?? {},
    publish_now: props.post.publish_now ?? true,
  }),
});
console.log('Posted:', JSON.stringify(post).slice(0, 500));
