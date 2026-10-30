# Whisper snaps a word's start back across a pause (and folds a hit in the pause into the next word), so a merged
# heard word can cover a whole pause. Trim each heard word to where the voice track actually has energy
# (out/vo/vo.wav > -45 dBFS, 10 ms frames, 60 ms hangover each side). Words with no voiced frame keep their span.
import json, re, sys, numpy as np, soundfile as sf
from pathlib import Path
film = Path(sys.argv[1]); hj = film / 'vo' / 'heard.js'
a, sr = sf.read(str(film / 'out' / 'vo' / 'vo.wav'), dtype='float32')
if a.ndim > 1: a = a.mean(1)
h = int(.01 * sr); e = np.array([20 * np.log10(np.sqrt((a[i:i + h] ** 2).mean()) + 1e-9) for i in range(0, len(a) - h, h)])
v = e > -45; vh = v.copy()
for k in range(1, 7): vh[k:] |= v[:-k]; vh[:-k] |= v[k:]
H = json.loads(re.search(r'window\.HEARD = (\[.*\]);', hj.read_text(), re.S).group(1))
out, n = [], 0
for s, t in H:
    i0, i1 = int(s * 100), int(np.ceil(t * 100))
    idx = [i for i in range(i0, min(i1 + 1, len(vh))) if vh[i]]
    if idx:
        runs, cur = [], [idx[0]]
        for i in idx[1:]:
            if i == cur[-1] + 1: cur.append(i)
            else: runs.append(cur); cur = [i]
        runs.append(cur); idx = max(runs, key=len)   # the word is its longest voiced run
        ns, nt = max(s, idx[0] / 100), min(t, (idx[-1] + 1) / 100)
        if (ns, nt) != (s, t): n += 1
        out.append([round(ns, 2), round(nt, 2)])
    else: out.append([s, t])
out = sorted({tuple(x) for x in out})
hj.write_text('/* SFX gate input: every word unhinted faster-whisper base.en and small.en heard in the finished mix, as [start, end], merged over every mix pass, each trimmed to the voiced frames of out/vo/vo.wav (Whisper snaps word starts back across pauses). */\nwindow.HEARD = ' + json.dumps([list(x) for x in out]) + ';\n')
print(f'trimmed {n} of {len(H)} heard words')
