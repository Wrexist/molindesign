#!/usr/bin/env python3
"""Voice-over for code-rendered films: a timed script in, a narrated, ducked, mastered film out.

    python3 voiceover.py audition --text "A line in the film's register." [--voices af_heart,bf_emma,am_michael]
    python3 voiceover.py plan  ../vo/script.json          # will each line fit its slot? (no synthesis)
    python3 voiceover.py layout ../vo/script.json         # long-form: speak every line, then set each `at` from the takes and `pause`
    python3 voiceover.py synth ../vo/script.json          # lines → out/vo/vo.wav, vo.json, vo.srt + vo/vo.js (captions for the page)
    python3 voiceover.py check ../vo/script.json          # listen check: Whisper hears every line, word error, pace, quiet zones
    python3 voiceover.py mix   ../vo/script.json [--score ../out/mix.wav --video ../out/video.mp4 --out ../out/film-vo.mp4]
    python3 voiceover.py all   ../vo/script.json          # synth, check, mix

Engines: Kokoro-82M (Apache-2.0) through kokoro-onnx, CPU only, about 3x faster than real time (default);
"engine": "chatterbox" (MIT, venv ~/.venv-cb); "engine": "ming" (Ming-3.0-tts-0.5B, MIT, venv ~/.venv-ming, the factory voice).
Word timings and the listen check: faster-whisper (MIT). Models download once to ~/.cache/molin-voice.
Every output is deterministic for a given script, so the narrated film re-renders exactly like the picture.
"""
import argparse, difflib, hashlib, json, math, os, re, subprocess, sys, urllib.request
from pathlib import Path

import numpy as np
import soundfile as sf

SR = 48000
CACHE = Path(os.environ.get('MOLIN_VOICE_CACHE', Path.home() / '.cache' / 'molin-voice'))
MODEL_URL = 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/'
MODEL_FILES = ('kokoro-v1.0.onnx', 'voices-v1.0.bin')
WPS = 2.6                       # natural narration pace in words/second at speed 1.0 (calibrated per voice once lines exist)

DEFAULTS = {
    'voice': 'af_heart', 'lang': 'en-us', 'speed': 0.95,
    'fit': {'min': 0.82, 'max': 1.12},          # Kokoro re-speaks at a new rate (prosody, not a time-stretch); past 1.12 it rushes
    'pace': {'max': 3.0},                         # words/second; a line faster than this is slowed if its slot has room
    'names': [],                                  # brand words and places, given to the listen check so it knows them
    'gap': 0.15,                                  # a line's slot ends this long before the next line starts
    'quiet': [],                                  # [t0, t1] windows the voice must leave alone (silences, the peak)
    'pronounce': {},                              # written form → spoken form, whole words
    'chain': {'highpass': 80, 'mud_db': -2.0, 'presence_db': 2.5, 'air_db': 1.5, 'deess': 0.4, 'room': 0.0},
    'duck': {'db': -10.0, 'lead': 0.2, 'release': 0.5, 'bridge': 0.7, 'carve_db': -4.0, 'smr_db': 12.0, 'score_db': 0.0},   # score_db: the whole score, under and between lines
    'master': {'lufs': -14.0, 'tp': -1.5},
    'captions': {'max_words': 3, 'max_chars': 18, 'min_s': 0.5},
}


# ---------- script ----------
def load_script(path):
    p = Path(path).resolve()
    s = json.loads(p.read_text())
    if s.get('engine') in ('chatterbox', 'ming'):   # atempo, not re-speaking: keep the stretch small
        s.setdefault('fit', {'min': 0.92, 'max': 1.1})
        s.setdefault('speed', 1.0)
    for k, v in DEFAULTS.items():
        if isinstance(v, dict):
            s[k] = {**v, **s.get(k, {})}
        else:
            s.setdefault(k, v)
    s['_dir'] = p.parent
    film = Path(s.get('film', p.parent.parent if p.parent.name == 'vo' else p.parent))
    s['_film'] = film if film.is_absolute() else (p.parent / film).resolve()
    s['_out'] = s['_film'] / 'out' / 'vo'
    lines = sorted(s['lines'], key=lambda l: l['at'])
    dur = s.get('dur')
    for i, l in enumerate(lines):
        nxt = lines[i + 1]['at'] - s['gap'] if i + 1 < len(lines) else (dur if dur else l['at'] + 30)
        l['end'] = min(l.get('end', nxt), nxt)
        for q0, q1 in s['quiet']:                 # a slot never runs into a quiet window
            if q0 >= l['at'] - 1e-6:
                l['end'] = min(l['end'], q0)
            elif q1 > l['at']:
                sys.exit(f'line "{l["id"]}" starts at {l["at"]} inside quiet window {q0}-{q1}')
    s['lines'] = lines
    return s


def spoken(s, l):
    text = l.get('say', l['text'])
    for written, said in {**s['pronounce'], **l.get('pronounce', {})}.items():
        text = re.sub(r'(?<!\w)' + re.escape(written) + r'(?!\w)', said, text)
    return text


def words(text):
    # a leading $ or quote stays on its word, and 5,000 / 2.5 stay one word
    text = re.sub(r'(?<=\s)&(?=\s)', 'and', text)    # Whisper writes "and" as "&" in lists ("Claude & Tommy")
    return re.findall(r"[$€£“\"‘(]*[\w'’‑-]+(?:[.,]\d+)*[^\w\s]*", text)


NUM = dict(zip('zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty'.split(), map(str, range(21))))
NUM.update({'thirty': '30', 'forty': '40', 'fifty': '50', 'sixty': '60', 'hundred': '100', 'thousand': '1000'})
WEAK = set('a an the of to in on at for with and or but it its is as by from that this'.split())
SAME = {'their': 'there', "they're": 'there', 'c': 'see', 'sea': 'see', 'u': 'you', 'r': 'are', 'to': '2', 'too': '2', 'for': '4', 'vi': '6'}


def norm(w):
    w = re.sub(r"[^\w']", '', w.lower().replace('’', "'"))
    return SAME.get(NUM.get(w, w), NUM.get(w, w))


# ---------- engines ----------
def ensure_models():
    CACHE.mkdir(parents=True, exist_ok=True)
    for f in MODEL_FILES:
        dst = CACHE / f
        if not dst.exists():
            print(f'downloading {f} (once) → {dst}')
            tmp = dst.with_suffix('.part')
            urllib.request.urlretrieve(MODEL_URL + f, tmp)
            tmp.rename(dst)
    return [str(CACHE / f) for f in MODEL_FILES]


_tts = None
def tts():
    global _tts
    if _tts is None:
        from kokoro_onnx import Kokoro
        _tts = Kokoro(*ensure_models())
    return _tts


def voice_style(v):
    """A voice name, or {"blend": {"af_heart": 0.7, "af_bella": 0.3}} for a house voice nobody else has."""
    if isinstance(v, str):
        return v
    mix = v['blend']
    total = sum(mix.values())
    return sum(tts().get_voice_style(n) * (w / total) for n, w in mix.items()).astype(np.float32)


def voice_key(v):
    return v if isinstance(v, str) else json.dumps(v, sort_keys=True)


def resample(a, sr_in, sr_out=SR):
    if sr_in == sr_out:
        return a.astype(np.float32)
    r = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f32le', '-ar', str(sr_in), '-ac', '1', '-i', '-',
                        '-af', f'aresample={sr_out}:resampler=soxr', '-f', 'f32le', '-'],
                       input=a.astype(np.float32).tobytes(), capture_output=True, check=True)
    return np.frombuffer(r.stdout, np.float32).copy()


_cb = None
def chatterbox():
    global _cb
    if _cb is None:
        from chatterbox.tts import ChatterboxTTS
        _cb = ChatterboxTTS.from_pretrained(device='cpu')
    return _cb


def tempo(a, rate):
    """Pitch-preserving speed change (ffmpeg atempo) for engines that can't re-speak at a rate."""
    if abs(rate - 1) < 1e-3:
        return a
    r = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', f'atempo={rate:.4f}',
                        '-f', 'f32le', '-'], input=a.astype(np.float32).tobytes(), capture_output=True, check=True)
    return np.frombuffer(r.stdout, np.float32).copy()


def speak_chatterbox(s, l, speed, cache_dir):
    """Chatterbox (MIT): a far more human read than Kokoro (breaths, pitch movement, emphasis), ~5x slower than real
    time on CPU. It has no rate control, so the raw take is cached and `speed` is applied as a mild atempo."""
    v = {**s.get('chatterbox', {}), **l.get('chatterbox', {})}
    text = spoken(s, l)
    seed = int(v.get('seed', 7)) + l.get('take', 0)
    ex, cfg, ref = v.get('exaggeration', 0.55), v.get('cfg', 0.45), v.get('ref')
    key = hashlib.sha1(json.dumps(['cb1', text, seed, ex, cfg, ref, v.get('temperature', 0.8)]).encode()).hexdigest()[:16]
    f = cache_dir / f'{l["id"]}-cb-{key}.wav'
    if f.exists():
        a, _ = sf.read(f, dtype='float32')
    else:
        import torch
        torch.manual_seed(seed)
        kw = dict(exaggeration=ex, cfg_weight=cfg, temperature=v.get('temperature', 0.8))
        if ref:
            kw['audio_prompt_path'] = str((s['_dir'] / ref).resolve())
        w = chatterbox().generate(text, **kw)
        a = resample(trim(w[0].numpy(), chatterbox().sr), chatterbox().sr)
        sf.write(f, a, SR, subtype='FLOAT')
    return level(tempo(a, speed), v.get('level_db'))


MING_SRC = Path(os.environ.get('MING_SRC', Path.home() / 'ming-src'))
MING_MODEL = Path(os.environ.get('MING_MODEL', Path.home() / 'ming-0.5b'))
_ming = None
def ming():
    global _ming
    if _ming is None:
        import torch
        sys.path.insert(0, str(MING_SRC))
        cwd = os.getcwd()
        os.chdir(MING_SRC)                      # its loader reads files relative to the repo
        try:
            from ming_tts import MingTTS
            _ming = MingTTS(str(MING_MODEL), device='cpu', text_normalization=False)
            _ming.model.to(torch.float32)       # bf16 on CPU is slower and rougher
        finally:
            os.chdir(cwd)
    return _ming


def speak_ming(s, l, speed, cache_dir):
    """Ming-3.0-tts-0.5B (inclusionAI, MIT): the most human open voice in our Oct 2026 bake-off (Isac picked US_James).
    `voice` is a preset (US_James, US_Emma…); `style` instead designs a voice from a description. ~3x slower than real
    time on CPU. No rate control either, so the raw take is cached and `speed` is a mild atempo."""
    v = {**s.get('ming', {}), **l.get('ming', {})}
    text = spoken(s, l)
    seed = int(v.get('seed', 7)) + l.get('take', 0)
    voice, style = v.get('voice', 'US_James'), v.get('style')
    # `ref` {wav, text}: clone one fixed take for every line. Preset voices drift line to line (pitch, timbre, pace);
    # a single reference holds them still. `whole` speaks the line in one piece instead of ~24-token fragments.
    ref = v.get('ref')
    ref_wav = ref and str((s['_dir'] / ref['wav']).resolve())
    ref_id = ref and hashlib.sha1(Path(ref_wav).read_bytes()).hexdigest()[:12]
    whole = bool(v.get('whole'))
    key = hashlib.sha1(json.dumps(['ming1', text, seed, voice, style] + ([ref_id, ref['text'], whole] if ref else [])).encode()).hexdigest()[:16]
    f = cache_dir / f'{l["id"]}-ming-{key}.wav'
    if f.exists():
        a, _ = sf.read(f, dtype='float32')
    else:
        import torch
        torch.manual_seed(seed)
        if ref:
            w = ming().synthesize(task='TTS', language_id='English', text=text, prompt_wav_path=ref_wav,
                                  prompt_text=ref['text'], use_spk_emb=True, raw_text=whole)
        elif style:
            w = ming().synthesize(task='VOICE_DESIGN', text=text, controls={'style': style}, use_zero_spk_emb=True)
        else:
            w = ming().synthesize(task='IP', text=text, controls={'ip': voice}, use_zero_spk_emb=True)
        sr = ming().sample_rate
        a = resample(trim(w.float().cpu().numpy().ravel(), sr), sr)
        sf.write(f, a, SR, subtype='FLOAT')
    return level(tempo(a, speed), v.get('level_db'))


def level(a, db):
    """Same loudness on every line: scale so the louder half of 20 ms frames sits at `db` dBFS (None leaves it)."""
    if db is None or not len(a):
        return a
    n = int(SR * 0.02)
    fr = a[:len(a) // n * n].reshape(-1, n) if len(a) >= n else a[None]
    e = np.sqrt((fr ** 2).mean(1))
    loud = e[e >= np.median(e)]
    cur = 20 * np.log10(np.sqrt((loud ** 2).mean()) + 1e-9)
    return (a * 10 ** ((db - cur) / 20)).astype(np.float32)


def speak(s, l, speed, cache_dir):
    """Synthesize one line at a rate; cached by everything that changes the sound."""
    if s.get('engine') == 'chatterbox':
        return speak_chatterbox(s, l, speed, cache_dir)
    if s.get('engine') == 'ming':
        return speak_ming(s, l, speed, cache_dir)
    voice, lang = l.get('voice', s['voice']), l.get('lang', s['lang'])
    text = spoken(s, l)
    pause = l.get('sentence_pause', 0.3)
    key = hashlib.sha1(json.dumps([text, voice_key(voice), lang, round(speed, 3), pause, MODEL_FILES]).encode()).hexdigest()[:16]
    f = cache_dir / f'{l["id"]}-{key}.wav'
    if f.exists():
        a, _ = sf.read(f, dtype='float32')
        return a
    if '/' in text:     # inline IPA, e.g. "pronounce": {"Halden": "/hˈɑːldən/"}: phonemize the rest, splice the IPA in
        parts = re.split(r'/([^/]+)/', text)
        text = ''.join(p if i % 2 else tts().tokenizer.phonemize(p, lang) if p.strip() else p for i, p in enumerate(parts))
        a, sr = tts().create(text, voice=voice_style(voice), speed=speed, lang=lang, sentence_pause=pause, is_phonemes=True)
    else:
        a, sr = tts().create(text, voice=voice_style(voice), speed=speed, lang=lang, sentence_pause=pause)
    a = resample(trim(a, sr), sr)
    sf.write(f, a, SR, subtype='FLOAT')
    return a


def trim(a, sr, floor_db=-45, pad=0.02):
    """Cut leading/trailing silence so `at` is the first audible phoneme, not the model's breath-in."""
    fr = int(sr * 0.01)
    n = len(a) // fr
    if n == 0:
        return a
    rms = np.sqrt((a[:n * fr].reshape(n, fr) ** 2).mean(1) + 1e-12)
    on = np.where(20 * np.log10(rms / rms.max()) > floor_db)[0]
    if not len(on):
        return a
    i0, i1 = max(0, on[0] * fr - int(pad * sr)), min(len(a), (on[-1] + 1) * fr + int(pad * sr))
    return a[i0:i1]


_asr = None
def asr():
    global _asr
    if _asr is None:
        try:
            from faster_whisper import WhisperModel
        except ImportError:
            return None
        _asr = WhisperModel(os.environ.get('MOLIN_ASR_MODEL', 'base.en'), device='cpu', compute_type='int8',
                            download_root=str(CACHE / 'whisper'))
    return _asr


def hear(a, names=()):
    """What Whisper hears in a line (48 kHz mono), with word times relative to the line start.
    `names` (brand words, places) go in the prompt so a correctly spoken name isn't flagged as a mistake."""
    m = asr()
    if m is None:
        return None
    a16 = resample(a, SR, 16000)
    segs, _ = m.transcribe(a16, language='en', word_timestamps=True, beam_size=5, vad_filter=False,
                           condition_on_previous_text=False, initial_prompt=(', '.join(names) + '.') if names else None)
    out = []
    for sg in segs:
        for w in (sg.words or []):
            x = {'w': w.word.strip(), 't0': float(w.start), 't1': float(w.end), 'p': float(w.probability)}
            # Whisper sometimes splits a number at its thousands comma ("$5" ",000."): put it back together
            if out and re.match(r'^[,.]\d', x['w']) and re.search(r'\d$', out[-1]['w']):
                out[-1].update(w=out[-1]['w'] + x['w'], t1=x['t1'], p=min(out[-1]['p'], x['p']))
            else:
                out.append(x)
    return out


def drop_tail(h, script, end):
    """Whisper invents words after a line's last word ("Thank you.", "E E E", "4 5"), in the fade-out or in
    digital silence. If the script's last word was heard, everything Whisper heard after it is dropped; otherwise
    extra trailing words that are low-confidence or start after the line has ended (`end`, seconds) go."""
    if not h:
        return h
    a, b = [norm(w) for w in script], [norm(x['w']) for x in h]
    last = None
    for blk in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
        if blk.size and blk.a + blk.size == len(a):
            last = blk.b + blk.size
    if last is not None:
        return h[:last]
    while len(h) > len(script) and (h[-1]['p'] < 0.3 or h[-1]['t0'] >= end - 0.05):
        h = h[:-1]
    return h


def align_words(script_words, heard, dur):
    """Script spelling with Whisper timing. Unmatched words are spread across the gap they fall in."""
    out = [{'w': w, 't0': None, 't1': None} for w in script_words]
    if heard:
        a, b = [norm(w) for w in script_words], [norm(h['w']) for h in heard]
        for blk in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
            for k in range(blk.size):
                h = heard[blk.b + k]
                out[blk.a + k].update(t0=h['t0'], t1=h['t1'])
    # fill holes linearly between known neighbours (or by letter count when nothing was heard)
    i = 0
    while i < len(out):
        if out[i]['t0'] is not None:
            i += 1
            continue
        j = i
        while j < len(out) and out[j]['t0'] is None:
            j += 1
        t_a = out[i - 1]['t1'] if i > 0 else 0.0
        t_b = out[j]['t0'] if j < len(out) else dur
        lens = [max(1, len(norm(o['w']))) for o in out[i:j]]
        acc, tot = t_a, sum(lens)
        for k, L in zip(range(i, j), lens):
            d = (t_b - t_a) * L / tot
            out[k].update(t0=acc, t1=acc + d)
            acc += d
        i = j
    return out


def wer(ref, hyp):
    # Whisper sometimes writes "$5 ,000": rejoin a number it split at its thousands comma
    join = lambda ws: re.sub(r'(?:(?<=\s)|^)&(?=\s|$)', 'and', re.sub(r'(\d) ([,.]\d)', r'\1\2', ' '.join(ws))).replace('%', ' percent').split()   # Whisper writes "and" as "&" in lists   # Whisper writes "37,000%" for "thirty-seven thousand percent"
    split = lambda ws: [norm(p) for w in join(ws) for p in re.split(r'[-‑]', w) if norm(p)]
    r, h = split(ref), split(hyp)
    # "$96 billion" and "96 billion dollars" are the same words spoken: when either side writes a $ amount, ignore "dollars"
    if any('$' in w for w in list(ref) + list(hyp)):
        r, h = [w for w in r if w not in ('dollars', 'dollar')], [w for w in h if w not in ('dollars', 'dollar')]
    # Whisper spells some compounds shut ("datacenters" for "data centers"): split a heard word that is two script words joined
    pairs = {r[i] + r[i + 1]: [r[i], r[i + 1]] for i in range(len(r) - 1)}
    h = [p for w in h for p in pairs.get(w, [w])]
    # ...and splits some open ("line up" for "lineup"): rejoin two heard words that make one script word
    rs, hh, i = set(r), [], 0
    while i < len(h):
        if i + 1 < len(h) and h[i] + h[i + 1] in rs and h[i] not in rs: hh.append(h[i] + h[i + 1]); i += 2
        else: hh.append(h[i]); i += 1
    h = hh
    d = list(range(len(h) + 1))
    for i in range(1, len(r) + 1):
        prev, d[0] = d[0], i
        for j in range(1, len(h) + 1):
            prev, d[j] = d[j], min(d[j] + 1, d[j - 1] + 1, prev + (r[i - 1] != h[j - 1]))
    return d[len(h)] / max(1, len(r))


# ---------- commands ----------
def cmd_audition(a):
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    print(f'{"voice":14} {"dur":>6} {"wps":>5} {"wer":>5} {"minp":>5}')
    for v in a.voices.split(','):
        lang = a.lang or ('en-gb' if v.startswith('b') else 'en-us')
        s = {'voice': v, 'lang': lang, 'pronounce': {}}
        l = {'id': 'audition', 'text': a.text}
        x = speak(s, l, a.speed, out)
        sf.write(out / f'{v}.wav', x, SR, subtype='PCM_16')
        heard = hear(x)
        n = len(words(a.text))
        w = wer(words(a.text), [h['w'] for h in heard]) if heard else float('nan')
        mp = min((h['p'] for h in heard), default=float('nan')) if heard else float('nan')
        print(f'{v:14} {len(x) / SR:6.2f} {n / (len(x) / SR):5.2f} {w:5.2f} {mp:5.2f}')
    print(f'\nwrote {out}/<voice>.wav. Listen in a row; pick on fit to the film first, grade second.')


def cmd_plan(a):
    s = load_script(a.script)
    base = s['speed']
    print(f'PLAN  (estimate {WPS} words/s at speed 1.0; base speed {base})')
    ok = True
    for l in s['lines']:
        n = len(words(spoken(s, l)))
        est = n / (WPS * base)
        slot = l['end'] - l['at']
        need = est / slot
        verdict = 'fits' if need <= 1 else ('tight' if need * base <= s['fit']['max'] else 'CUT')
        ok &= verdict != 'CUT'
        cut = '' if verdict != 'CUT' else f'  → cut about {math.ceil(n - slot * WPS * s["fit"]["max"])} words'
        print(f'{verdict:5} {l["id"]:10} {l["at"]:6.2f}–{l["end"]:6.2f}  slot {slot:4.2f}s  est {est:4.2f}s  "{l["text"]}"{cut}')
    if not ok:
        sys.exit(2)


def cmd_synth(a):
    s = load_script(a.script)
    out = s['_out']
    (out / 'lines').mkdir(parents=True, exist_ok=True)
    dur = s.get('dur') or max(l['end'] for l in s['lines']) + 1
    track = np.zeros(int(math.ceil(dur * SR)) + SR, np.float32)
    meta, problems = [], []
    for l in s['lines']:
        slot = l['end'] - l['at']
        speed = l.get('speed', s['speed'])
        x = speak(s, l, speed, out / 'lines')
        natural = len(x) / SR
        n_words = len(words(l['text']))
        calm = n_words / s['pace']['max']                       # how long the line needs to not sound rushed
        if natural > slot:
            target = slot * 0.97
        elif natural < calm and slot > natural + 0.1:
            target = min(calm, slot * 0.97)
        elif l.get('fill') and natural < slot * 0.8:
            target = slot * 0.9
        else:
            target = None
        for _ in range(4 if target else 0):
            # re-speak at the rate that fits (Kokoro changes delivery, not pitch); rate vs length isn't linear, so iterate
            d = len(x) / SR
            if abs(d - target) < 0.05 or (natural > slot and d <= slot) or (natural <= slot and target <= d <= slot):
                break
            new = float(np.clip(round(speed * d / target, 3), s['fit']['min'], s['fit']['max']))
            if new == speed:
                break
            speed = new
            x = speak(s, l, speed, out / 'lines')
        d = len(x) / SR
        if d > slot + 0.02:
            n = len(words(spoken(s, l)))
            problems.append(f'"{l["id"]}" runs {d - slot:.2f}s past its slot even at {speed}x: cut about {math.ceil(n * (1 - slot / d))} words or move it')
        if l.get('fade_in'):   # a short ramp so a plosive onset doesn't start from digital zero
            x = x.copy(); nf = min(len(x), int(l['fade_in'] * SR)); x[:nf] *= np.linspace(0, 1, nf, dtype=x.dtype)
        i0 = int(round(l['at'] * SR))
        track[i0:i0 + len(x)] += x[:len(track) - i0]
        heard = hear(x, s.get('names', []) + list(s['pronounce']))
        ws = align_words(words(l['text']), heard, d)
        meta.append({'id': l['id'], 'text': l['text'], 'say': spoken(s, l), 't0': l['at'], 't1': round(l['at'] + d, 3),
                     'slot': round(l['end'], 3), 'speed': speed,
                     'words': [{'w': w['w'], 't0': round(l['at'] + w['t0'], 3), 't1': round(l['at'] + w['t1'], 3)} for w in ws],
                     'heard': heard})
        print(f'{l["id"]:10} {l["at"]:6.2f}–{l["at"] + d:6.2f}  (slot to {l["end"]:.2f})  speed {speed:.2f}  {len(words(l["text"])) / d:.2f} w/s')
    track = track[:int(math.ceil(dur * SR))]
    raw = out / 'vo-dry.wav'
    sf.write(raw, track, SR, subtype='FLOAT')
    process_chain(s, raw, out / 'vo.wav')
    caps = captions(s, meta)
    doc = {'voice': s['engine'] if s.get('engine') in ('chatterbox', 'ming') else voice_key(s['voice']), 'dur': dur, 'lines': [{k: v for k, v in m.items() if k != 'heard'} for m in meta], 'captions': caps}
    (out / 'vo.json').write_text(json.dumps(doc, indent=1, ensure_ascii=False))
    # vo.js sits next to the script (committed): the film page loads it to draw captions in render(t)
    (s['_dir'] / 'vo.js').write_text('/* generated by tools/voiceover.py, do not edit */\nwindow.VO = ' + json.dumps(doc, ensure_ascii=False) + ';\n')
    (out / 'vo.srt').write_text(srt(caps))
    (out / 'heard.json').write_text(json.dumps([{'id': m['id'], 'heard': m['heard']} for m in meta], indent=1))
    print(f'wrote {out.relative_to(s["_film"])}/vo.wav, vo.json, vo.srt and {(s["_dir"] / "vo.js").relative_to(s["_film"])}')
    if problems:
        print('\nFIT PROBLEMS\n' + '\n'.join(problems))
        sys.exit(2)


def cmd_layout(a):
    """Long-form films are cut to the voice, not the voice to a timeline: speak each line once (cached), then place
    it right after the previous take plus that line's `pause` (default 0.4 s), and write the times back to the script."""
    p = Path(a.script).resolve()
    raw = json.loads(p.read_text())
    s = load_script(a.script)
    (s['_out'] / 'lines').mkdir(parents=True, exist_ok=True)
    by_id = {l['id']: l for l in s['lines']}
    t = raw['lines'][0].get('at', 0.4)
    for l in raw['lines']:
        x = speak(s, by_id[l['id']], l.get('speed', s['speed']), s['_out'] / 'lines')
        d = len(x) / SR
        n = len(words(l['text']))
        if n / d > s['pace']['max']:          # synth will slow a rushed take (atempo, down to fit.min): leave it the room
            d = min(n / s['pace']['max'], d / s['fit']['min'])
        l['at'] = round(t, 2)
        print(f'{l["id"]:10} {t:7.2f}  {d:5.2f}s  {len(words(l["text"])) / d:.2f} w/s')
        t += d + l.get('pause', 0.4)
    raw['dur'] = round(t + raw.get('tail', 1.2), 2)
    p.write_text(json.dumps(raw, indent=1, ensure_ascii=False) + '\n')
    print(f'laid out {len(raw["lines"])} lines, {raw["dur"]:.1f} s')


def process_chain(s, src, dst):
    """Broadcast narration chain: rumble out, mud down, presence and air up, de-ess, gentle 3:1 compression."""
    c = s['chain']
    af = [f'highpass=f={c["highpass"]}:poles=2',
          f'equalizer=f=280:t=q:w=1.1:g={c["mud_db"]}',
          f'equalizer=f=4200:t=q:w=1.3:g={c["presence_db"]}',
          f'highshelf=f=10000:g={c["air_db"]}',
          f'deesser=i={c["deess"]}:m=0.5:f=0.5:s=o',
          'acompressor=threshold=-22dB:ratio=3:attack=6:release=90:knee=4:makeup=1']
    if c['room'] > 0:   # a little early reflection helps a dry voice sit inside a reverberant score
        af.append(f'aecho=1:1:19|31|47:{0.16 * c["room"]:.3f}|{0.11 * c["room"]:.3f}|{0.07 * c["room"]:.3f}')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(src), '-af', ','.join(af), '-ar', str(SR), '-ac', '1', '-c:a', 'pcm_f32le', str(dst)], check=True)


def captions(s, meta):
    """Short caption cards for muted viewing. Split at punctuation first, then cut long phrases into even chunks
    (5 words → 3 + 2, never 4 + 1, so no word is orphaned), then fold any card shown under min_s into its phrase-mate."""
    mw, mc, min_s = s['captions']['max_words'], s['captions']['max_chars'], s['captions']['min_s']
    cards = []
    for m in meta:
        phrases, cur = [], []
        for w in m['words']:
            cur.append(w)
            if re.search(r'[.,!?;:—]$', w['w']):
                phrases.append(cur)
                cur = []
        if cur:
            phrases.append(cur)
        for ph in phrases:
            chars = len(' '.join(w['w'] for w in ph))
            n = max(math.ceil(len(ph) / mw), math.ceil(chars / mc))
            n = min(n, len(ph))
            size = len(ph) / n
            cut = lambda x: int(x + 0.5)            # front-heavy: 5 words → 3 + 2
            chunks = [ph[cut(i * size):cut((i + 1) * size)] for i in range(n)]
            for i in range(len(chunks) - 1):        # never end a card on "of", "the", "and"…: hand it to the next card
                while len(chunks[i]) > 1 and norm(chunks[i][-1]['w']) in WEAK:
                    chunks[i + 1].insert(0, chunks[i].pop())
            i = 0
            while len(chunks) > 1 and i < len(chunks):
                show = (chunks[i + 1][0]['t0'] if i + 1 < len(chunks) else chunks[i][-1]['t1'] + 0.25) - chunks[i][0]['t0']
                if show < min_s:
                    j = i - 1 if i + 1 >= len(chunks) else i
                    chunks[j:j + 2] = [chunks[j] + chunks[j + 1]]
                    i = 0
                    continue
                i += 1
            cards += chunks
    out = []
    for i, c in enumerate(cards):
        t1 = c[-1]['t1'] + 0.25
        if i + 1 < len(cards):
            t1 = min(t1, cards[i + 1][0]['t0'])
        out.append({'t0': c[0]['t0'], 't1': round(t1, 3), 'text': ' '.join(w['w'] for w in c), 'words': c})
    return out


def srt(caps):
    def ts(t):
        ms = int(round(t * 1000))
        return f'{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02},{ms % 1000:03}'
    return ''.join(f'{i + 1}\n{ts(c["t0"])} --> {ts(c["t1"])}\n{c["text"]}\n\n' for i, c in enumerate(caps))


def cmd_check(a):
    s = load_script(a.script)
    out = s['_out']
    doc = json.loads((out / 'vo.json').read_text())
    heard = {h['id']: h['heard'] for h in json.loads((out / 'heard.json').read_text())}
    ok = True
    print('\nLISTEN CHECK  (Whisper hears each line; fix word error > 10 % or pace outside 1.8 w/s to pace.max + 0.3; soft = words heard under 0.45 confidence, listen to those)')
    for l in doc['lines']:
        h = heard.get(l['id'])
        if h is None:
            print(f'skip  {l["id"]:10} (faster-whisper not installed)')
            continue
        h = min(drop_tail(h, words(l['say']), l['t1'] - l['t0']), drop_tail(h, words(l['text']), l['t1'] - l['t0']), key=len)   # the shorter: whichever script form Whisper wrote
        w = min(wer(words(l['say']), [x['w'] for x in h]), wer(words(l['text']), [x['w'] for x in h]))
        weak = [x for x in h if x['p'] < 0.45]
        pace = len(l['words']) / max(0.01, l['t1'] - l['t0'])
        flags = []
        if w > 0.10: flags.append(f'heard "{" ".join(x["w"] for x in h)}"')
        note = ('  (soft: ' + ', '.join(f'{x["w"]} {x["p"]:.2f}' for x in weak) + ')') if weak else ''
        if pace > s['pace']['max'] + 0.3: flags.append(f'rushed at {pace:.2f} w/s: cut words or add a comma')
        if pace < 1.8: flags.append(f'dragging at {pace:.2f} w/s')
        ok &= not flags
        print(f'{"ok  " if not flags else "FIX "}  {l["id"]:10} wer {w:4.2f}  {pace:4.2f} w/s  ' + ('; '.join(flags)) + note)
    for q0, q1 in s['quiet']:
        for l in doc['lines']:
            if l['t0'] < q1 and l['t1'] > q0:
                ok = False
                print(f'FIX   {l["id"]} speaks inside quiet window {q0}–{q1}')
    short = [c for c in doc['captions'] if c['t1'] - c['t0'] < 0.3]
    if short:
        print('note  captions under 0.3 s: ' + ', '.join(f'"{c["text"]}"' for c in short))
    if not ok:
        print('\nFixes: respell in "say" or "pronounce" (e.g. "LF-1" → "L F one"), use punctuation for breath, or rewrite the line.')
        sys.exit(2)


def read_audio(path, channels):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-ac', str(channels), '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True)
    return np.frombuffer(r.stdout, np.float32).reshape(-1, channels).copy()


def envelope(s, doc, n):
    """Duck amount 0..1 over time from the words actually spoken: starts `lead` s before the first word (a compressor
    can only react after), holds across gaps shorter than `bridge` s so the music doesn't pump between phrases,
    and releases over `release` s. Raised-cosine ramps."""
    d = s['duck']
    spans = []
    for l in doc['lines']:
        for w in l['words']:
            a, b = w['t0'], w['t1']
            if spans and a - spans[-1][1] < d['bridge']:
                spans[-1][1] = max(spans[-1][1], b)
            else:
                spans.append([a, b])
    t = np.arange(n) / SR
    e = np.zeros(n, np.float32)
    for a, b in spans:
        up = np.clip((t - (a - d['lead'])) / d['lead'], 0, 1)
        down = np.clip(1 - (t - b) / d['release'], 0, 1)
        e = np.maximum(e, np.minimum(up, down))
    return (0.5 - 0.5 * np.cos(np.pi * e)).astype(np.float32), spans


def rms_db(x):
    return 20 * np.log10(np.sqrt(np.mean(np.square(x))) + 1e-9)


def cmd_mix(a):
    s = load_script(a.script)
    out, film = s['_out'], s['_film']
    score_p = Path(a.score or film / 'out' / 'mix.wav')
    video_p = Path(a.video) if a.video else film / 'out' / 'video.mp4'
    doc = json.loads((out / 'vo.json').read_text())
    score = read_audio(score_p, 2) * 10 ** (s['duck'].get('score_db', 0) / 20)   # the whole score down a touch, lines or not
    vo = read_audio(out / 'vo.wav', 1)[:, 0]
    n = len(score)
    vo = np.pad(vo, (0, max(0, n - len(vo))))[:n]
    e, spans = envelope(s, doc, n)
    d = s['duck']
    # carve a pocket for the voice in the music: a copy of the score with 1.5–4 kHz pulled down, crossfaded in by the duck
    carved_p = out / 'score-carved.wav'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(score_p), '-af',
                    f'equalizer=f=2600:t=q:w=0.9:g={d["carve_db"]},equalizer=f=1200:t=q:w=1:g={d["carve_db"] / 2}',
                    '-ar', str(SR), '-c:a', 'pcm_f32le', str(carved_p)], check=True)
    carved = read_audio(carved_p, 2)[:n]
    carved = np.pad(carved, ((0, n - len(carved)), (0, 0)))
    gain = 1 - e * (1 - 10 ** (d['db'] / 20))
    bed = (score * (1 - e[:, None]) + carved * e[:, None]) * gain[:, None]
    # set the voice level from the speech-to-music ratio inside the spoken spans, not by ear
    mask = np.zeros(n, bool)
    for a0, b0 in spans:
        mask[int(a0 * SR):int(b0 * SR)] = True
    smr_now = rms_db(vo[mask]) - rms_db(bed[mask])
    vo_gain = 10 ** ((d['smr_db'] - smr_now) / 20)
    mix = bed + (vo * vo_gain)[:, None]
    print(f'duck {d["db"]} dB over {len(spans)} phrases; voice set {20 * math.log10(vo_gain):+.1f} dB for a {d["smr_db"]} dB speech-to-music ratio')
    pre = out / 'mix-vo.wav'
    sf.write(pre, mix, SR, subtype='FLOAT')
    if not video_p.exists():
        print(f'no video at {video_p}: wrote {pre.relative_to(film)} only')
        return
    dst = Path(a.out) if a.out else film / 'out' / (video_p.stem + '-vo.mp4')
    master(s, pre, video_p, dst)
    in_context(s, doc, dst)


def in_context(s, doc, film_file):
    """The real test: can Whisper still hear every line through the finished mix? Also prove the quiet windows stayed quiet."""
    full = read_audio(film_file, 1)[:, 0]
    if asr() is not None:
        print('\nIN-CONTEXT CHECK  (each line heard through the finished mix)')
        for l in doc['lines']:
            seg = full[int(max(0, l['t0'] - 0.1) * SR):int((l['t1'] + 0.2) * SR)]
            h = hear(seg, s.get('names', []) + list(s['pronounce']))
            h = min(drop_tail(h, words(l['say']), l['t1'] - max(0, l['t0'] - 0.1)), drop_tail(h, words(l['text']), l['t1'] - max(0, l['t0'] - 0.1)), key=len)
            w = min(wer(words(l['say']), [x['w'] for x in h]), wer(words(l['text']), [x['w'] for x in h]))
            print(f'{"ok  " if w <= 0.1 else "FIX "}  {l["id"]:10} wer {w:4.2f}  heard "{" ".join(x["w"] for x in h)}"')
    for q0, q1 in s['quiet']:
        print(f'quiet {q0:5.2f}–{q1:5.2f}  {rms_db(full[int(q0 * SR):int(q1 * SR)]):6.1f} dBFS rms   (whole film {rms_db(full):.1f})')


def master(s, wav, video, dst):
    m = s['master']
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(wav), '-af', f'loudnorm=I={m["lufs"]}:TP={m["tp"]}:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
    j = json.loads(r.stderr[r.stderr.rindex('{'):r.stderr.rindex('}') + 1])
    lim = 10 ** ((m['tp'] - 1.2) / 20)       # limit at 4x oversampling, a hair under the true-peak target
    # loudnorm silently falls back to its dynamic mode when linear gain would break the true-peak target (sharp foley
    # clicks under a voice do that), and the dynamic mode overshoots. So: plain gain into the oversampled limiter,
    # measured and corrected once, which always stays linear.
    gain = m['lufs'] - float(j['input_i'])
    for _ in range(4):
        chain = f'volume={gain:.2f}dB,aresample=192000,alimiter=limit={lim:.3f}:level=false:attack=1:release=60,aresample=48000'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(video), '-i', str(wav), '-map', '0:v:0', '-map', '1:a:0',
                        '-af', chain, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', str(dst)], check=True)
        r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(dst), '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True)
        got = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', r.stderr)[-1])
        tp = float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', r.stderr)[-1])
        if abs(got - m['lufs']) < 0.3 and tp <= m['tp']:
            break
        gain += m['lufs'] - got
        if tp > m['tp']:                     # the AAC encode overshoots the limiter on sharp transients (Chatterbox plosives)
            lim *= 10 ** ((m['tp'] - tp - 0.2) / 20)
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(dst), '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True)
    I = re.findall(r'I:\s+(-?[\d.]+) LUFS', r.stderr)[-1]
    tp = re.findall(r'Peak:\s+(-?[\d.]+) dBFS', r.stderr)[-1]
    print(f'wrote {dst}\nintegrated {I} LUFS   true peak {tp} dBTP')


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest='cmd', required=True)
    au = sub.add_parser('audition')
    au.add_argument('--text', required=True)
    au.add_argument('--voices', default='af_heart,af_bella,af_nicole,bf_emma,am_michael,am_fenrir,bm_george,bm_fable')
    au.add_argument('--speed', type=float, default=0.95)
    au.add_argument('--lang')
    au.add_argument('--out', default=str(Path(__file__).resolve().parent.parent / 'out' / 'vo' / 'audition'))
    for name in ('plan', 'layout', 'synth', 'check', 'mix', 'all'):
        sp = sub.add_parser(name)
        sp.add_argument('script')
        if name in ('mix', 'all'):
            sp.add_argument('--score')
            sp.add_argument('--video')
            sp.add_argument('--out')
    a = p.parse_args()
    if a.cmd == 'all':
        cmd_synth(a)
        try:
            cmd_check(a)
        except SystemExit:
            print('(listen check flagged lines; mixing anyway so you can hear them in context)')
        cmd_mix(a)
    else:
        {'audition': cmd_audition, 'plan': cmd_plan, 'layout': cmd_layout, 'synth': cmd_synth, 'check': cmd_check, 'mix': cmd_mix}[a.cmd](a)


if __name__ == '__main__':
    main()
