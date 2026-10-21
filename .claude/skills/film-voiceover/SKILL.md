---
name: film-voiceover
description: Add professional voice-over narration to a code-rendered film (launch film, TikTok/Reels explainer, hero clip). Write a script viewers stay for, pick a voice, time every line to the picture and its supers, synthesize it locally with Kokoro-82M (Apache-2.0, CPU), get word timings and burned-in caption cards, prove every line is intelligible with a Whisper listen check (alone and through the finished mix), duck and carve the procedural score under the voice, and master to −14 LUFS. Use with code-rendered-film whenever a film needs a voice or captions. Ideas studied in VoiceStudio's source (Oct 2026); proven on film/ (Held, narrated cut).
---

# Film voice-over

Tool: `film/tools/voiceover.py`. Example script: `film/vo/script.json` (narration for Held). Result: `film/out/halden-lf1-held-vo.mp4`.
**Verified** = read in source (VoiceStudio `backend/services/*`, Kokoro `VOICES.md`, kokoro-onnx) or measured in our pipeline. **Inferred** = our own reasoning or common practice, not measured here.

## 0. Why not VoiceStudio itself (verified, Oct 2026)
VoiceStudio (github.com/debpalash/VoiceStudio) is an Electron app over a FastAPI + PyTorch backend (~5 GB CPU install), AGPL‑3.0. Its default engine, OmniVoice, ships **CC‑BY‑NC weights** (non‑commercial) plus Higgs Audio and Llama terms, and its own licence inventory marks no model as cleared for commercial use. A launch film is commercial, so we **don't run it and copy none of its code** (AGPL). What we took are its *ideas* (sections 3–5), re‑implemented from scratch. Engine instead: **Kokoro‑82M**, which VoiceStudio also lists: Apache‑2.0 weights and voices, ONNX on CPU, ~3× faster than real time here. Word timings and checks: **faster‑whisper** (MIT). espeak‑ng (GPL) runs only as the phonemizer at synthesis time; nothing of it ships in the film.
Never clone or imitate a real person's voice without written consent; Kokoro's stock voices are not anyone we can name.

## 1. Pipeline
```sh
python3 -m venv ~/.venv-voice && ~/.venv-voice/bin/pip install -r film/tools/requirements-voice.txt
cd film/tools && PY=~/.venv-voice/bin/python
$PY voiceover.py audition --text "A line in the film's register."   # same line, 8 voices → out/vo/audition/
$PY voiceover.py plan  ../vo/script.json    # will each line fit its slot? before any synthesis
$PY voiceover.py synth ../vo/script.json    # → out/vo/vo.wav (processed stem), vo.json, vo.srt; vo/vo.js for the page
$PY voiceover.py check ../vo/script.json    # listen check per line
node render.mjs audio && node render.mjs video   # (code-rendered-film) score → out/mix.wav, picture → out/video.mp4
$PY voiceover.py mix   ../vo/script.json [--out ../out/<film>-vo.mp4]   # duck, carve, master, mux, in-context check
```
Models download once to `~/.cache/molin-voice` (330 MB Kokoro, 140 MB Whisper base.en). Everything is cached by content hash, so re-running after a one-word edit re-speaks only that line. Output is deterministic like the picture.

## 2. The script file
```json
{ "dur": 34, "voice": "af_heart", "lang": "en-us", "speed": 0.9,
  "quiet": [[10.0, 11.6], [22.6, 24.3]],          // silences and the peak: the voice must leave them alone
  "pronounce": { "LF-1": "L F one" },              // written → spoken; "/hˈældən/" splices raw IPA
  "names": ["Halden", "LF-1"],                     // told to the listen check so a right name isn't flagged
  "lines": [ { "id": "freeze", "at": 2.0, "end": 5.0, "text": "One eight-thousandth of a second." } ] }
```
`text` is what the captions show, `say` (optional) what the voice reads. A line's slot runs from `at` to `end` (default: next line − 0.15 s), clipped at any quiet window. Per line you can override `voice`, `speed`, `lang`, `sentence_pause`, `fill` (stretch to fill the slot). Blend a house voice nobody else has: `"voice": {"blend": {"af_heart": 0.7, "af_bella": 0.3}}`.

## 3. Writing narration people stay for (inferred, from short-form practice; test with the jury)
1. **The first spoken words are the hook**, inside 1.5 s, and they say a stake, a number or a contradiction, never a greeting or a brand. "Your watch ticks 28,800 times an hour" beats "Let's talk about watches".
2. **Open a loop in line 1, close it in the last line.** Name the question the film answers; pay it off last; let the last line lead back into the first so the loop replays (TikTok counts rewatches).
3. **One idea per line, 4–10 words, write for the ear**: contractions, active verbs, "you", numbers written as spoken ("eight-thousandth", "twenty-eight thousand eight hundred"), no parentheses, no lists of three adjectives.
4. **Don't read the screen.** The super states the claim; the voice says the *why*, in the gaps between supers. The two may agree word for word only on the hook and the brand line (Held: the voice says "See in the dark" with the tagline).
5. **Re-hook every 6–8 s** with a turn word ("But", "Here's the trick", "Now watch the…") that lands on a cut.
6. **Pace:** explainer 2.6–3.0 words/s; premium/launch 2.2–2.7 w/s with room around lines; > 3.3 w/s reads as rushed (the check flags it). Reads set the length, not the other way round.
7. **Leave the big moments silent.** No voice over the peak, the native move, or the two real silences from code-rendered-film; the first sound after a silence should not be a word.
8. **Land the stressed word on the beat/cut**, not the line start: put `at` so the key noun hits the downbeat (word timings in `vo.json` tell you where it falls; nudge `at`).
9. **Short lines sound weak** in Kokoro (verified, VOICES.md: < 10–20 tokens). Pair two short sentences into one line ("Most cameras stop time. This one holds it.") and give a lone name a comma ("Halden, LF-1.").

## 4. Voice choice (verified grades from Kokoro VOICES.md; character notes inferred)
| Voice | Grade | Use |
|---|---|---|
| `af_heart` | A | warm, clear, best overall; launch films, calm explainers (Held) |
| `af_bella` | A− | brighter, more energy; TikTok explainers, product tours |
| `af_nicole` | B− | close, soft, slow (2.2 w/s); intimate / ASMR-ish |
| `bf_emma` | B− | British, composed; design and craft stories |
| `am_michael`, `am_fenrir`, `am_puck` | C+ | American male; usable, audition first |
| `bm_george`, `bm_fable` | C | British male, slower; check every line |
Pick on **fit to the film** (energy, register, how it sits on the score) by auditioning one real line in a row; grade is the tiebreak. Lower grades show more artefacts, so run the listen check harder on them. Speed: 0.88–0.95 for premium, 1.0–1.08 for explainers. VoiceStudio's direction taxonomy (verified, `director.py`) is a good brief vocabulary even though Kokoro has no instruct input: **energy** (calm…urgent), **emotion**, **pace** (measured…quick), **intimacy** (intimate…announcing), **formality**. Write one token per axis in the treatment and choose voice + speed to match.

## 5. Timing to picture
- **Slots and fitting** (idea verified in VoiceStudio `duration_planner.py`, `fit_planner.py`): predict before synthesis whether a line fits (`plan`, 2.6 w/s at speed 1.0, a verdict fits / tight / CUT with how many words to cut), then fit after synthesis. VoiceStudio time-stretches (≤ 1.2× imperceptible, 1.5× cap, ≥ 0.85× floor); Kokoro can **re-speak at a new rate**, which keeps natural prosody, so `synth` iterates the speed (cap 0.82–1.12) until the line lands in its slot, and slows rushed lines when the slot has room. Beyond the caps it fails with "cut about N words": rewrite, don't squeeze.
- **`at` is the first audible phoneme**: the tool trims the model's breath-in and tail (−45 dB floor), the same goal as VoiceStudio's forward-only onset snapping (`onset_align.py`).
- **Picture first, then the word** for things you show (voice 0.1–0.3 s after the cut that reveals it); **word first** (a J-cut of 0.2–0.5 s) when the line sets up a change. Never let a line run over a hard cut into a new idea (inferred).
- **Supers and captions don't fight**: a line never starts while a super is still revealing word by word; let the super settle, then speak.

## 6. Captions (for muted viewing)
`synth` gets word timings by running Whisper on each synthesized line and aligning its words to the script (script spelling, Whisper timing), then cuts caption cards: split at punctuation, long phrases into even chunks (5 words → 3 + 2, never 4 + 1), no card ending on "of", "the", "and", any card shown < 0.5 s folded into its phrase‑mate. Outputs `out/vo/vo.srt` (upload it to the platform too) and `vo/vo.js` next to the script (`window.VO = { lines, captions }`, committed) for the film page: load it before the film script. Draw them in `render(t)` as a pure function, e.g.:
```js
var card = VO.captions.find(function (c) { return t >= c.t0 && t < c.t1; });
if (card) card.words.forEach(function (w) { var on = t >= w.t0; /* draw w.w; current word = accent, spoken = 100 %, upcoming = 45 % */ });
```
Vertical (1080×1920) safe zone: keep captions between 55 % and 75 % of the height, clear of the platform UI at the bottom 20 % and right 15 %. Add the caption cards to `TEXTS(t)` so `readcheck` sees them.

## 7. Mix: ducking, carving, level (verified in our pipeline; envelope idea inferred)
- **Duck from the words, not a compressor.** A sidechain compressor can only react after the voice starts; we know every word time, so the score starts dipping **0.2 s before** the first word, **holds across gaps < 0.7 s** (no pumping between phrases) and releases over **0.5 s**, on raised-cosine ramps. Default −10 dB (Held: −9).
- **Carve, don't just turn down**: under the voice the score crossfades into a copy with −4 dB at 2.6 kHz and −2 dB at 1.2 kHz, so the music keeps its body while the consonants get a pocket.
- **Set voice level by number**: speech-to-music ratio inside spoken spans = **12 dB** (measured RMS, adjusted automatically; 10–15 is the broadcast range).
- **Narration chain** (ffmpeg): high-pass 80 Hz, −2 dB at 280 Hz (mud), +2.5 dB at 4.2 kHz (presence), +1.5 dB shelf at 10 kHz (air), de-esser, 3:1 compression; optional `room` early reflections so a dry voice sits inside a reverberant score.
- **Master** as code-rendered-film: two-pass loudnorm to −14 LUFS, limiter at 4× oversampling for true peak ≤ −1.5 dBTP. VoiceStudio also keeps the background bed and only swaps what's under dialogue (`dub_background.py`); same spirit: the score is ducked, never replaced.

## 8. Checks (run all three)
1. `plan`: no line marked CUT.
2. `check`: Whisper hears each line alone. Fix word error > 10 % (respell in `say`/`pronounce`), pace outside 1.8–3.3 w/s, any line inside a quiet window. "soft" words (confidence < 0.45) are worth a listen, not an automatic fix: Kokoro's first word is often soft.
3. `mix` ends with the **in-context check**: Whisper re-hears every line through the finished, mastered mix, and reports the level inside each quiet window. Every line must still read at word error ≤ 10 %.
Then add a **voice** row to the code-rendered-film jury: hook in the first spoken words, does the voice say the why rather than read the screen, pace, pronunciation, does it leave the peak alone, is it clear on phone speakers.

## Pitfalls we hit
- Whisper writes numbers as digits and hears "See" as "C": the check normalizes number words (one → 1) and a few homophones, and compares against both `text` and `say`.
- Whisper invents a low-confidence word in the tail room tone ("falls. falls.", "dark. Mark."): trailing extra words under 0.3 confidence are dropped before scoring.
- "Halden" alone was heard as "How did an"; "Halden, LF-1." (a comma) fixed it. Proper nouns go in `names` so Whisper is primed with them.
- Kokoro at 0.82× still read "Turn it up, and the night comes back." at 3.7 w/s. A full stop ("Turn it up. The night comes back.") bought the pause; punctuation is the cheapest pacing control.
- Writing for the slot first gave three lines 30–50 % too long for Held's gaps. Run `plan` before falling in love with a line.
- kokoro-onnx's default model reports no phoneme durations, so word timings come from Whisper; PyAV in faster-whisper can be out of step with its `av` wheel, so the tool feeds Whisper numpy audio decoded by ffmpeg.
