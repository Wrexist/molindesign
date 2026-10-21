# Held · Halden LF‑1 launch film

A 34‑second launch film written entirely in code, and the page that plays it. Every frame, the score and every sound are functions of time `t`, so the browser preview and the offline MP4 are the same film.

- **Watch live:** open `index.html` (static, no build). Space plays, ← → seek, `,` `.` step one frame.
- **The MP4:** `out/halden-lf1-held.mp4` (1920×1080, 30 fps, −14 LUFS). Poster: `out/poster.jpg`.
- **Narrated cut:** `out/halden-lf1-held-vo.mp4`, the same film with six voice-over lines (Kokoro `af_heart`), the score ducked and carved under the voice. Script: [`vo/script.json`](vo/script.json). **The method:** `.claude/skills/film-voiceover/SKILL.md`.
- **How it was directed:** [`TREATMENT.md`](TREATMENT.md). **The method:** `.claude/skills/code-rendered-film/SKILL.md`.

## Files
| File | What |
|---|---|
| `film.js` | The film: timeline (`SHOTS`, `CUES`, `IRIS`, `EV`), scenes (rain, night coast, camera), iris, HUD, type, `SCORE` (Web Audio, rendered offline) |
| `index.html` | Live player: poster gate, scrub bar with chapters, frame step, mute. `?render` = bare 1920×1080 canvas for capture, `?t=12` = start time |
| `tools/render.mjs` | Headless renderer and checks (needs Node 20+, ffmpeg; `npm install` in `tools/`) |
| `tools/voiceover.py` | Voice-over: plan, synthesize (Kokoro-82M, CPU), fit lines to slots, word-timed captions, Whisper listen checks, duck/carve/master (`pip install -r tools/requirements-voice.txt`) |
| `vo/script.json`, `vo/held-vo.mp3` | Held's narration script, and the finished narration stem (used by the Motion Library demo) |
| `fonts/`, `fonts.css` | Self‑hosted OFL fonts (rendering never depends on the network) |

## Render
```sh
cd film/tools && npm install
node render.mjs sheet                      # contact sheet, one frame per second → out/check/sheet.jpg
node render.mjs strip --from 23 --to 24.2  # every 0.1 s around a key moment
node render.mjs readcheck                  # every line held ≥ letters/15 + 1.5 s
node render.mjs all                        # score → WAV, frames (4-sample motion blur) → MP4, loudnorm −14 LUFS, poster, checks
```

## Voice-over
```sh
python3 -m venv ~/.venv-voice && ~/.venv-voice/bin/pip install -r tools/requirements-voice.txt
cd tools && node render.mjs audio            # score → out/mix.wav (picture: out/video.mp4 from `node render.mjs video`)
~/.venv-voice/bin/python voiceover.py all ../vo/script.json --out ../out/halden-lf1-held-vo.mp4
```
`all` runs synth (fitted lines, `out/vo/vo.wav`, captions in `vo.json` / `vo.js` / `vo.srt`), the listen check, then the mix with an in-context check that Whisper still hears every line through the master.
