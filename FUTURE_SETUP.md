# Future Shift shorts — setup (runs next to History Shorts, does not touch it)

Emerging-tech explainers (AI, blockchain, robotics, IoT, quantum …): how each one moves societies from the
industrial age to a future society. Ivory/gold background, navy type, animated infographics, Kokoro voice,
original background music that dips under the voice, posted to Facebook, Instagram, TikTok, YouTube, LinkedIn and X.

**Flow:** n8n (picks today's technology → Wikipedia facts → Brain writes script) → GitHub Actions `render-future.yml`
(Kokoro voice → Remotion `FutureShort` render → PostEverywhere post).

## What's in the repo
- `src/future/` — the new template (scenes, tech visuals, captions, backdrop, music ducking).
- `props-future.json` — sample short (AI). `npm run studio` → pick **FutureShort** to preview/edit.
- `public/music/future-1..4.mp3` — original tracks made by `scripts/gen_music.py` (no samples, no copyright claims).
  The n8n flow rotates them by day.
- `.github/workflows/render-future.yml` — voice + render + post for this series.
- `n8n/future-shorts-n8n.json` — import into n8n. Code nodes also saved as `n8n/future-*-node.js`.
- `n8n/future-topics.csv` — the 36 built-in topics (same list is inside the Pick Topic node).

## Setup steps
1. GitHub secret `PE_API_KEY` — already set for History Shorts, reused. Nothing to do.
2. GitHub token for n8n — reuse the token from History Shorts (it already has Actions read/write on this repo).
3. n8n → **Workflows → Import from file** → `n8n/future-shorts-n8n.json`.
4. **Brain (OpenRouter)** node → Authorization header: same value as in your History Shorts workflow
   (replace `PASTE_YOUR_OPENROUTER_KEY`, keep `Bearer ` in front) — or pick the same credential if you moved it to one.
5. **Render on GitHub** node → Authorization header: replace `PASTE_YOUR_GITHUB_TOKEN` (keep `Bearer `). The URL is already set to `subitesme-hue/history-shorts`.
6. Click **Test run → Execute workflow**. A manual test renders but never posts. Expected: all nodes green, Render on GitHub
   returns empty (204). Repo → **Actions → Render and post Future Shift short** → download artifact **future-short** to watch.
7. Happy with it → **Activate** the workflow. It runs daily at **4:00 pm Dubai** and posts to all six platforms.

## Changing things
- Time: open the **Daily 4pm Dubai** node, change the hour (workflow timezone is Asia/Dubai).
- Topics: edit the `TOPICS` list in **Pick Topic** (`[name, visual, Wikipedia title]`). Visuals: `neural` (AI), `chain` (blockchain),
  `robot` (robotics), `network` (IoT / cities / mobility), `orbit` (quantum, science, energy).
  Or put a Google Sheets "Get row(s)" node before Pick Topic with columns `topic | visual | wiki_title | status` (first `pending` row wins).
- Voice: `voice: 'am_michael'` at the bottom of **Build Props** (same voices as History Shorts).
- Music loudness: `musicVolume: 0.4` in **Build Props** (0.3 quieter, 0.5 louder; it always dips under the voice).
- New music: `python scripts/gen_music.py` (edit the chord progressions at the top), commit the mp3s.
