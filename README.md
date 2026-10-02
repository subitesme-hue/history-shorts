# History Shorts — Remotion motion-graphics template

Infographic shorts (no footage): kinetic headline, spinning globe with map pin, year counter, icon grids,
animated mechanism diagrams, then→now cards, branded outro, Submagic-style word-highlight captions,
whoosh SFX and progress bar. 1080×1920, 30 fps.

## Files
- `props.json` — the content of one short (sample: Al-Jazari). The n8n Brain produces this.
- `BRAIN_PROMPT.md` — system prompt + exact JSON shape for the Brain node.
- `src/` — the template (scenes in `src/scenes/Scenes.tsx`, captions in `src/components/Captions.tsx`).
- `scripts/voice_kokoro.py` — free Kokoro voice per scene + word timings (default).
- `scripts/prepare.mjs` — optional ElevenLabs voice (set repo variable `VOICE_ENGINE` = `elevenlabs`).
- `n8n/history-shorts-n8n.json` — import into n8n.
- `SETUP.md` — full step-by-step setup.
- `scripts/post.mjs` — posts the MP4 via PostEverywhere (same 4 calls as your n8n chain).
- `.github/workflows/render.yml` — voice + render + post on GitHub Actions when n8n triggers it.

## Preview locally
1. Install Node 22.
2. `npm ci`
3. `npm run studio` → opens Remotion Studio in your browser. Edit `props.json` and watch it update.
4. `npm run render` → `out/video.mp4`.
