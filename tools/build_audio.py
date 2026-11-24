#!/usr/bin/env python3
"""Assemble the existing music and story-time effects into exact-length stereo WAVs."""
import argparse
import json
from pathlib import Path
import re
import subprocess
import wave

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SR = 44_100
OPEN = 18
CREDITS = 34
TARGET_PEAK = 10 ** (-2 / 20)

# Global seconds. Gain and fade timings are edit choices, not time stretching.
# A reprieve after the cauldron breaks lets the first theme return before credits.
# Credits always start at the head of the original, higher-key cue.
PHRASES = (
    # onset, track, native start, nominal gain, fade in, fade out (seconds)
    (0.0, 'bgm1', 0.0, .57, .18, 1.0),
    (18.0, 'bgm2', 0.0, .40, 1.0, 1.1),
    (70.0, 'bgm3', 0.0, .43, 1.1, .25),
    (120.0, 'bgm4', 0.0, .51, .25, .60),
    (150.0, 'bgm3', 0.0, .34, .60, .45),
    (176.0, 'bgm4', 0.0, .47, .45, .50),
    (223.0, 'bgm1', 0.0, .50, 1.20, .75),
    (258.0, 'bgm5', 0.0, .88, .75, 0),
)

# Story seconds (not film seconds): attack start, floor start, floor end,
# release end, minimum music gain. Transients retain the original SFX timing.
SPACES = (
    (41.5, 43.0, 45.1, 47.7, .25),   # mire pulls down Da Wa
    (91.9, 92.85, 93.75, 95.7, .27), # metallic attack -> silk sword
    (95.8, 96.25, 97.35, 99.7, .42), # cocoon tightens
    (119.9, 120.7, 121.6, 123.0, .37), # freezing wind takes the foreground
    (133.4, 134.7, 135.75, 137.5, .35), # invisible approach
    (173.5, 174.4, 175.6, 177.3, .35), # gourd vortex
    (193.6, 195.0, 197.9, 199.7, .16), # grandfather struck; lotus follows
    (207.0, 208.0, 209.05, 211.1, .24), # cauldron break
    (222.0, 222.7, 224.05, 226.7, .30), # summit rises
    (228.9, 229.5, 230.9, 233.0, .36), # transformation and gong
)


def timeline():
    return json.loads(subprocess.check_output([
        'node', '--input-type=module', '-e',
        f"import {{ FILM_DURATION, SFX_CUES }} from '{(ROOT / 'src/director/StoryboardData.js').as_uri()}';"
        "console.log(JSON.stringify([FILM_DURATION, SFX_CUES]));",
    ], text=True))


def samples(time):
    return round(time * SR)


def load(path):
    raw = subprocess.check_output([
        'ffmpeg', '-v', 'error', '-i', str(path), '-f', 'f32le',
        '-ac', '2', '-ar', str(SR), '-',
    ])
    return np.frombuffer(raw, dtype='<f4').reshape(-1, 2)


def phrase(buf, start, count):
    """Continue the native loop, smoothing only its last/first 25 ms at each seam."""
    off = samples(start)
    overlap = samples(.025)
    first = buf[off:][:count].copy()
    if len(first) == count:
        return first
    seg = np.empty((count, 2), dtype=np.float32)
    seg[:len(first)] = first
    weight = np.linspace(0, 1, overlap, dtype=np.float32)[:, None]
    end = len(first)
    while end < count:
        start = end - overlap
        seg[start:end] = seg[start:end] * (1 - weight) + buf[:overlap] * weight
        end = min(start + len(buf), count)
        seg[start + overlap:end] = buf[overlap:end - start]
    return seg


def envelope(track, attack, floor_start, floor_end, release, depth):
    """Apply a raised-cosine dip without raising existing dips on overlaps."""
    a, b, c, d = map(samples, (attack, floor_start, floor_end, release))
    for x, y, start, end in ((a, b, 1, depth), (b, c, depth, depth), (c, d, depth, 1)):
        idx = np.arange(max(0, x), min(len(track), y))
        if len(idx):
            w = (1 - np.cos(np.pi * (idx - x) / (y - x))) / 2
            track[idx] = np.minimum(track[idx], start + (end - start) * w)


def assemble(total, cues, assets):
    length = samples(total)
    assert total == 292 and PHRASES[-1][0] == total - CREDITS
    music = np.zeros((length, 2), dtype=np.float32)
    fx = np.zeros_like(music)
    for i, (onset, key, offset, gain, attack, release) in enumerate(PHRASES):
        next_onset = PHRASES[i + 1][0] if i + 1 < len(PHRASES) else total
        begin = samples(onset)
        count = samples(min(next_onset + release, total)) - begin
        seg = phrase(assets[key], offset, count)
        seg[:samples(attack)] *= np.linspace(0, gain, samples(attack), dtype=np.float32)[:, None]
        seg[samples(attack):] *= gain
        if release:
            seg[-samples(release):] *= np.linspace(1, 0, samples(release), dtype=np.float32)[:, None]
        music[begin:begin + count] += seg
        print(f'{key} timeline {onset:g}–{next_onset + release:g} s; source starts {offset:g} s; gain {gain:g}')
    duck = np.ones(length, dtype=np.float32)
    for cue in cues:
        t = OPEN + float(cue['time'])
        source = assets[cue['sfx']]
        # Retain the already-authored effect pitch/rate; no resampling of the music.
        idx = np.arange(0, len(source) - 1, float(cue.get('rate', 1)))
        pos = np.arange(len(source))
        seg = np.stack([np.interp(idx, pos, source[:, ch]) for ch in range(2)], axis=1).astype(np.float32)
        n = min(len(seg), length - samples(t))
        fx[samples(t):samples(t) + n] += seg[:n] * float(cue.get('vol', .8)) * .87
        envelope(duck, t - .12, t, t + .12, t + .8, .74)
    for *times, depth in SPACES:
        envelope(duck, *(OPEN + t for t in times), depth)
    music *= duck[:, None]
    fade = samples(3.25)
    music[-fade:] *= np.cos(np.linspace(0, np.pi / 2, fade, dtype=np.float32))[:, None]
    music[-1] = 0
    mix = music + fx
    peak = float(np.max(np.abs(mix)))
    gain = min(1, TARGET_PEAK / peak) if peak > 0 else 1
    print(f'{len(cues)} effects; pre-gain sample peak {20 * np.log10(peak):.2f} dBFS; master gain {gain:.5f}')
    return mix * gain, music * gain


def save(path, pcm):
    assert pcm.shape == (samples(292), 2) and np.isfinite(pcm).all()
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + '.tmp')
    with wave.open(str(temp), 'wb') as f:
        f.setnchannels(2)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes(np.rint(np.clip(pcm, -1, 1) * 32767).astype('<i2').tobytes())
    temp.replace(path)
    print(f'{path} | {len(pcm)} frames | {len(pcm) / SR:g} s | '
          f'{20 * np.log10(np.max(np.abs(pcm))):.2f} dBFS')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('master', nargs='?', type=Path, default=ROOT / 'exports/film_audio.wav')
    parser.add_argument('--music', type=Path, default=ROOT / 'exports/film_music.wav')
    args = parser.parse_args()
    if args.master.resolve() == args.music.resolve():
        parser.error('Choose distinct master and music output paths.')
    film, cues = timeline()
    registry = (ROOT / 'src/core/AssetRegistry.js').read_text()
    paths = dict(re.findall(r"^\s+(\w+): '\./(assets/[^']+)',", registry, re.M))
    keys = {p[1] for p in PHRASES} | {cue['sfx'] for cue in cues}
    assets = {key: load(ROOT / paths[key]) for key in sorted(keys)}
    mix, music = assemble(OPEN + film + CREDITS, cues, assets)
    save(args.master, mix)
    save(args.music, music)


if __name__ == '__main__':
    main()
