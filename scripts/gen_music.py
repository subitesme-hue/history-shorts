"""Original, royalty-free background music for the Future Shift shorts.

Everything here is synthesised from scratch (no samples), so the tracks are 100% owned by you
and safe on TikTok / YouTube / Instagram / Facebook / LinkedIn / X (no Content ID claims).

Each track = slow warm pad + soft felt-piano arpeggio + sub bass + airy shimmer, through a long reverb.
Run:  python scripts/gen_music.py      -> public/music/future-1..4.mp3 and history-1..4.mp3 (existing files are kept)
Needs numpy, scipy and ffmpeg.
"""
import os
import subprocess
import numpy as np
from scipy.signal import fftconvolve, butter, sosfilt

SR = 44100
LENGTH = 80  # seconds; videos are ~35-50 s, the composition loops the track if ever needed
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "music")

NOTE = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def chord(root, quality, octave=4):
    base = 12 * (octave + 1) + NOTE[root]
    shapes = {
        "maj7": [0, 4, 7, 11],
        "maj9": [0, 4, 7, 11, 14],
        "m7": [0, 3, 7, 10],
        "m9": [0, 3, 7, 10, 14],
        "add9": [0, 4, 7, 14],
        "sus2": [0, 2, 7, 12],
        "6/9": [0, 4, 9, 14],
    }
    return [base + i for i in shapes[quality]], base - 24


# Four moods. Each progression is 4 chords, BAR seconds each, repeated.
TRACKS = [
    # name, bpm-ish bar length, progression
    ("future-1", 4.4, [("D", "maj9"), ("B", "m9"), ("G", "maj7"), ("A", "sus2")]),      # hopeful, bright
    ("future-2", 4.8, [("A", "m9"), ("F", "maj7"), ("C", "add9"), ("G", "6/9")]),       # reflective
    ("future-3", 4.2, [("E", "maj9"), ("C#", "m7"), ("A", "maj9"), ("B", "sus2")]),     # wide, cinematic
    ("future-4", 5.0, [("F", "maj7"), ("D", "m9"), ("A#", "maj9"), ("C", "sus2")]),     # calm, warm
    # Forgotten Innovators: same warmth, more reflective / timeless
    ("history-1", 5.2, [("D", "m9"), ("A#", "maj7"), ("F", "maj9"), ("C", "6/9")]),     # wistful
    ("history-2", 5.0, [("E", "m9"), ("C", "maj7"), ("G", "add9"), ("D", "sus2")]),     # wonder
    ("history-3", 5.4, [("A", "m7"), ("F", "maj9"), ("D", "m9"), ("E", "sus2")]),       # ancient, cinematic
    ("history-4", 4.8, [("G", "maj9"), ("E", "m7"), ("C", "maj9"), ("D", "sus2")]),     # hopeful legacy
]


def env_adsr(n, a, r):
    e = np.ones(n)
    ai, ri = int(a * SR), int(r * SR)
    ai, ri = min(ai, n // 2), min(ri, n // 2)
    e[:ai] = np.linspace(0, 1, ai) ** 2
    e[n - ri:] *= np.linspace(1, 0, ri) ** 2
    return e


def pad(progression, bar, rng):
    total = int(LENGTH * SR)
    out = np.zeros((total, 2))
    t_bar = int(bar * SR)
    overlap = int(1.6 * SR)
    i = 0
    pos = 0
    while pos < total:
        notes, _ = chord(*progression[i % len(progression)], octave=3)
        n = min(t_bar + overlap, total - pos)
        t = np.arange(n) / SR
        seg = np.zeros((n, 2))
        for k, m in enumerate(notes):
            f = hz(m)
            for d, pan in ((-6, 0.25), (0, 0.5), (6, 0.75)):  # three detuned voices (cents) spread in stereo
                ff = f * 2 ** (d / 1200)
                ph = rng.uniform(0, 2 * np.pi)
                w = np.sin(2 * np.pi * ff * t + ph) + 0.18 * np.sin(4 * np.pi * ff * t + ph)
                w *= 1 + 0.08 * np.sin(2 * np.pi * (0.13 + 0.05 * k) * t)  # slow breathing
                seg[:, 0] += w * (1 - pan)
                seg[:, 1] += w * pan
        seg *= env_adsr(n, 1.4, 1.6)[:, None] / (len(notes) * 3)
        out[pos:pos + n] += seg
        pos += t_bar
        i += 1
    return out


def piano_note(f, dur, vel):
    n = int(dur * SR)
    t = np.arange(n) / SR
    w = np.zeros(n)
    # felt-piano-ish partials with slight inharmonicity, upper partials decay faster
    for h, amp, dec in ((1, 1.0, 1.6), (2, 0.42, 0.9), (3, 0.18, 0.6), (4, 0.08, 0.4), (5, 0.04, 0.3)):
        fh = f * h * (1 + 0.0004 * h * h)
        w += amp * np.exp(-t / dec) * np.sin(2 * np.pi * fh * t)
    att = int(0.006 * SR)
    w[:att] *= np.linspace(0, 1, att)
    return w * vel


def arpeggio(progression, bar, rng):
    total = int(LENGTH * SR)
    out = np.zeros((total, 2))
    pattern = [0, 2, 1, 3, 2, 1]  # gentle up-and-down figure
    steps = 6
    pos_bar = int(3.0 * bar * SR) // 3  # start after the first bar so the intro breathes
    start = int(bar * SR)
    i = 1
    pos = start
    while pos < total:
        notes, _ = chord(*progression[i % len(progression)], octave=4)
        step = bar / steps
        for s in range(steps):
            m = notes[pattern[s] % len(notes)] + (12 if s == 3 and rng.random() < 0.35 else 0)
            p = pos + int(s * step * SR + rng.normal(0, 0.008) * SR)  # tiny human timing drift
            if p < 0 or p >= total:
                continue
            vel = 0.55 + 0.25 * rng.random() - (0.15 if s % 2 else 0)
            w = piano_note(hz(m), 3.2, vel)
            w = w[: total - p]
            pan = 0.3 + 0.4 * (s / (steps - 1))
            out[p:p + len(w), 0] += w * (1 - pan)
            out[p:p + len(w), 1] += w * pan
        pos += int(bar * SR)
        i += 1
    return out * 0.16


def bass(progression, bar):
    total = int(LENGTH * SR)
    out = np.zeros(total)
    t_bar = int(bar * SR)
    pos, i = 0, 0
    while pos < total:
        _, root = chord(*progression[i % len(progression)], octave=3)
        n = min(t_bar + int(0.8 * SR), total - pos)
        t = np.arange(n) / SR
        w = np.sin(2 * np.pi * hz(root) * t) + 0.25 * np.sin(4 * np.pi * hz(root) * t)
        out[pos:pos + n] += w * env_adsr(n, 0.6, 1.0) * 0.22
        pos += t_bar
        i += 1
    return np.stack([out, out], axis=1)


def shimmer(progression, bar, rng):
    total = int(LENGTH * SR)
    t = np.arange(total) / SR
    out = np.zeros((total, 2))
    notes, _ = chord(*progression[0], octave=6)
    for k, m in enumerate(notes[:3]):
        lfo = 0.5 + 0.5 * np.sin(2 * np.pi * (0.05 + 0.03 * k) * t + rng.uniform(0, 6))
        w = np.sin(2 * np.pi * hz(m) * t) * lfo
        out[:, k % 2] += w
    return out * 0.012


def reverb(x, seconds=3.2, wet=0.38, rng=None):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = np.stack([rng.standard_normal(n), rng.standard_normal(n)], axis=1) * np.exp(-t / (seconds / 6.9))[:, None]
    sos = butter(2, 6500, "low", fs=SR, output="sos")
    ir = sosfilt(sos, ir, axis=0)
    ir /= np.sqrt((ir ** 2).sum(axis=0))
    w = np.stack([fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in range(2)], axis=1)
    return x * (1 - wet) + w * wet


def master(x):
    sos = butter(2, 40, "high", fs=SR, output="sos")
    x = sosfilt(sos, x, axis=0)
    sos = butter(2, 9000, "low", fs=SR, output="sos")
    x = sosfilt(sos, x, axis=0)
    x = np.tanh(x * 1.2) / np.tanh(1.2)  # gentle glue
    fi, fo = int(2.5 * SR), int(4 * SR)
    x[:fi] *= np.linspace(0, 1, fi)[:, None] ** 2
    x[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 2
    rms = np.sqrt((x ** 2).mean())
    x *= 0.12 / rms  # ~ -18 dBFS RMS: full, but leaves room under the voice
    peak = np.abs(x).max()
    if peak > 0.89:
        x *= 0.89 / peak
    return x


def main():
    os.makedirs(OUT, exist_ok=True)
    for idx, (name, bar, prog) in enumerate(TRACKS):
        if os.path.exists(os.path.join(OUT, name + ".mp3")) and os.environ.get("FORCE") != "1":
            print("exists, skipping", name, "(FORCE=1 to rebuild)")
            continue
        rng = np.random.default_rng(1000 + idx)
        mix = pad(prog, bar, rng) * 0.9 + arpeggio(prog, bar, rng) + bass(prog, bar) + shimmer(prog, bar, rng)
        mix = master(reverb(mix, rng=rng))
        wav = os.path.join(OUT, name + ".wav")
        import soundfile as sf

        sf.write(wav, mix.astype(np.float32), SR)
        mp3 = os.path.join(OUT, name + ".mp3")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-codec:a", "libmp3lame", "-b:a", "160k", mp3], check=True)
        os.remove(wav)
        print("wrote", mp3)


if __name__ == "__main__":
    main()
