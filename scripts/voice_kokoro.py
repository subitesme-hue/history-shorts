"""Kokoro voiceover + word-level caption timings (free, Apache-2.0 model).

For every scene in props.json:
  1. Kokoro speaks the scene's narration  -> public/vo/scene-N.wav (24 kHz)
  2. Word timings come from Kokoro's own tokens (start_ts / end_ts)
  3. The scene is stretched to fit its narration
Then props.json gets `captions` (exact word timings) and each scene a `voiceFile`.

Verified against kokoro source (kokoro/pipeline.py): KPipeline(lang_code=...)(text, voice=, speed=)
yields Result objects with .audio (torch tensor, 24 kHz) and .tokens (misaki MToken with
.text, .whitespace, .start_ts, .end_ts). Timestamps are relative to each Result chunk.

Env vars (all optional):
  KOKORO_VOICE  default am_michael   (top American male voices: am_michael, am_fenrir, am_puck; best overall: af_heart)
  KOKORO_LANG   default a            (a = American English, b = British English)
  KOKORO_SPEED  default 1.0
"""
import json
import os
import re
import sys

FPS = 30
TRANSITION_FRAMES = 12  # keep in sync with src/theme.ts
SAMPLE_RATE = 24000
MIN_SEC = {"hook": 4, "globe": 5, "counter": 4.5, "iconGrid": 4, "machine": 7, "legacy": 5.5, "outro": 4,
           # Future Shift series
           "shift": 5.5, "stat": 4.5, "tech": 5.5, "steps": 7, "impact": 5.5}


def words_from_results(results):
    """Turn Kokoro Results into [(text, start_s, end_s)] + concatenated audio, merging
    punctuation and hyphen pieces (tokens with no whitespace before them) into the previous word."""
    import numpy as np

    words, chunks, offset = [], [], 0.0
    for r in results:
        audio = r.audio
        if audio is None:
            continue
        audio = audio.detach().cpu().numpy() if hasattr(audio, "detach") else np.asarray(audio)
        prev_ws = " "
        for t in r.tokens or []:
            text = t.text
            has_ts = t.start_ts is not None and t.end_ts is not None
            glue = words and (prev_ws == "" or re.fullmatch(r"[^\w]+", text))
            if glue:
                w = words[-1]
                words[-1] = (w[0] + text, w[1], (offset + t.end_ts) if has_ts else w[2])
            elif has_ts and text.strip():
                words.append((text, offset + t.start_ts, offset + t.end_ts))
            prev_ws = t.whitespace
        chunks.append(audio)
        offset += len(audio) / SAMPLE_RATE
    full = np.concatenate(chunks) if chunks else np.zeros(1, dtype="float32")
    return words, full, offset


def main(props_path="props.json", pipeline=None, write_audio=True):
    props = json.load(open(props_path))
    voice = os.environ.get("KOKORO_VOICE") or "am_michael"
    lang = os.environ.get("KOKORO_LANG") or "a"
    speed = float(os.environ.get("KOKORO_SPEED") or 1.0)

    if pipeline is None:
        from kokoro import KPipeline

        pipeline = KPipeline(lang_code=lang)
    if write_audio:
        import soundfile as sf

        os.makedirs("public/vo", exist_ok=True)

    captions, start_frame = [], 0
    n = len(props["scenes"])
    for i, scene in enumerate(props["scenes"]):
        results = list(pipeline(scene["narration"], voice=voice, speed=speed, split_pattern=None))
        words, audio, audio_len = words_from_results(results)
        rel = f"vo/scene-{i}.wav"
        if write_audio:
            sf.write(os.path.join("public", rel), audio, SAMPLE_RATE)

        base_ms = start_frame / FPS * 1000
        for text, s, e in words:
            captions.append({"text": text, "startMs": round(base_ms + s * 1000), "endMs": round(base_ms + e * 1000)})

        last = i == n - 1
        needed = audio_len + 0.5 + (0 if last else TRANSITION_FRAMES / FPS)
        scene["durationSec"] = max(MIN_SEC.get(scene["type"], 4), round(needed, 1))
        scene["voiceFile"] = rel
        start_frame += round(scene["durationSec"] * FPS) - (0 if last else TRANSITION_FRAMES)
        print(f"scene {i} ({scene['type']}): voice {audio_len:.2f}s -> scene {scene['durationSec']}s, {len(words)} words")

    props["captions"] = captions
    json.dump(props, open(props_path, "w"), indent=2)
    print(f"Voice: {voice} | total ~{start_frame / FPS:.1f}s | {len(captions)} caption words")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "props.json")
