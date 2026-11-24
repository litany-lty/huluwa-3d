#!/usr/bin/env python3
"""Offline mix of the film soundtrack (theme -> act BGM crossfades -> SFX cues -> ending theme)."""
import json, os, subprocess, sys, re
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 44100
OPEN, END_DUR = 18.0, 34.0
out_path = sys.argv[1] if len(sys.argv) > 1 else f'{ROOT}/exports/film_audio.wav'

# AssetRegistry imports 'three' (browser importmap) -> parse paths textually instead
sb = subprocess.run(['node', '--input-type=module', '-e',
    f"import {{ ACTS, SFX_CUES, FILM_DURATION }} from '{ROOT}/src/director/StoryboardData.js'; console.log(JSON.stringify({{ACTS, SFX_CUES, FILM_DURATION}}))"],
    capture_output=True, text=True, check=True).stdout
data = json.loads(sb)
ACTS, CUES, FILM = data['ACTS'], data['SFX_CUES'], data['FILM_DURATION']
TOTAL = OPEN + FILM + END_DUR
paths = dict(re.findall(r"^\s+(\w+): '\./(assets/[^']+)',", open(f'{ROOT}/src/core/AssetRegistry.js', encoding='utf-8').read(), re.M))

def load(key):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f'{ROOT}/{paths[key]}', '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2)

mix = np.zeros((int(TOTAL * SR) + SR, 2), dtype=np.float32)

# ---- BGM instances (mirrors main.js / FilmDirector / AudioMaestro behaviour) ----
inst = [dict(t=0.0, key='bgm1', vol=0.74, fade=0.6, ramps=[])]
cur_key, cur_vol = 'bgm1', 0.74
def add_event(t, key, vol, fade):
    global cur_key
    if key == cur_key:
        inst[-1]['ramps'].append((t, vol))
    else:
        inst.append(dict(t=t, key=key, vol=vol, fade=fade, ramps=[]))
        cur_key = key
add_event(OPEN, ACTS[0]['bgm'], ACTS[0].get('bgmVol', 0.5), 1.2)
for a in ACTS[1:]:
    add_event(OPEN + a['start'], a['bgm'], a.get('bgmVol', 0.5), 1.2)
add_event(OPEN + FILM, 'bgm5', 0.74, 1.5)

for i, it in enumerate(inst):
    buf = load(it['key'])
    t0 = it['t']
    t1 = (inst[i + 1]['t'] + inst[i + 1]['fade']) if i + 1 < len(inst) else TOTAL
    n = int((t1 - t0) * SR)
    # loop buffer
    reps = int(np.ceil(n / len(buf))) + 1
    seg = np.tile(buf, (reps, 1))[:n]
    pts = [(t0, 0.0), (t0 + it['fade'], it['vol'])]
    v = it['vol']
    for (tc, nv) in it['ramps']:
        pts += [(tc, v), (tc + 0.5, nv)]
        v = nv
    if i + 1 < len(inst):
        tn, fn = inst[i + 1]['t'], inst[i + 1]['fade']
        pts += [(tn, v), (tn + fn, 0.0)]
    pts.sort(key=lambda p: p[0])
    xs = np.array([p[0] for p in pts]); ys = np.array([p[1] for p in pts])
    env = np.interp(t0 + np.arange(n) / SR, xs, ys).astype(np.float32)
    s = int(t0 * SR)
    mix[s:s + n] += seg * env[:, None]
    print(f"bgm {it['key']} {t0:.1f}s -> {t1:.1f}s vol {it['vol']}")

# ---- SFX cues ----
sfx_cache = {}
for c in CUES:
    k = c['sfx']
    if k not in sfx_cache:
        sfx_cache[k] = load(k)
    buf = sfx_cache[k]
    rate = float(c.get('rate', 1.0))
    idx = np.arange(0, len(buf) - 1, rate)
    res = np.stack([np.interp(idx, np.arange(len(buf)), buf[:, ch]) for ch in (0, 1)], axis=1).astype(np.float32)
    s = int((OPEN + c['time']) * SR)
    e = min(len(mix), s + len(res))
    mix[s:e] += res[:e - s] * float(c.get('vol', 0.8))
print('sfx cues mixed:', len(CUES))

# ---- master fade-out + peak safety ----
nfade = int(3.3 * SR)
end_i = int(TOTAL * SR)
mix[end_i - nfade:end_i] *= np.linspace(1, 0, nfade, dtype=np.float32)[:, None]
mix = mix[:end_i]
peak = float(np.max(np.abs(mix)))
print('peak', round(peak, 3))
if peak > 0.97:
    mix *= 0.97 / peak
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'pcm_s16le', out_path],
               input=mix.astype('<f4').tobytes(), check=True)
print('wrote', out_path, round(TOTAL, 1), 's')
