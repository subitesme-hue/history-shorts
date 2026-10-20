# Cinematic upgrade — AI footage + short animations (both series)

Each short is now ~40–50 s: an AI-footage hook, 3–4 AI cinematic shots, and only **two** animated
infographics plus the outro (≈10–25 s of animation).

**Flow (GitHub Actions):** n8n sends props → `scripts/ai_clips.mjs` asks Seedance 2.0 Mini (KIE.AI) for one clip per
`hook`/`cinema` scene **in the background** → Kokoro voice is made at the same time → `scripts/merge_clips.mjs`
attaches the finished clips → Remotion renders → PostEverywhere posts.

A clip that fails or times out never blocks the post: that scene shows an animated title card instead.

## Setup
1. GitHub repo → **Settings → Secrets and variables → Actions → Secrets → New repository secret**:
   Name `KIE_API_KEY`, value = your KIE.AI API key (the same one your Seedance n8n workflow uses, without `Bearer `).
2. Optional **Variables** (same page, Variables tab):
   - `SEEDANCE_DURATION` — clip length in seconds, default `8`.
   - `SEEDANCE_RESOLUTION` — default `720p`.
   - `AI_CLIPS_MAX` — max clips per video, default `5` (hook + 4 cinema).
   - `SEEDANCE_MODEL` — default `bytedance/seedance-2-mini`.
3. Test: **Actions → Render and post short → Run workflow** (props blank, post `false`). The sample props now contain
   cinema scenes. In the run, open **Wait for AI clips and add them to the video** to see the KIE log and the
   AI-vs-animation seconds. Download the artifact and watch it.
4. Same for **Render and post Future Shift short**.

## Cost
Each video makes up to 5 Seedance clips. Check the per-clip credit price for Seedance 2.0 Mini (720p, no audio) on
kie.ai before going live and multiply by 5 × videos per day. Lower `AI_CLIPS_MAX` or `SEEDANCE_DURATION` to spend less.

## Scene types added
- `hook` gets `prompt` (AI shot behind the headline).
- `cinema`: `narration`, `label` (lower-third, ≤30 chars), `prompt` (one continuous shot, no text in frame).
