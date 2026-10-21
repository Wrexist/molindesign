# Held · Halden LF‑1 launch film

A 34‑second launch film written entirely in code, and the page that plays it. Every frame, the score and every sound are functions of time `t`, so the browser preview and the offline MP4 are the same film.

- **Watch live:** open `index.html` (static, no build). Space plays, ← → seek, `,` `.` step one frame.
- **The MP4:** `out/halden-lf1-held.mp4` (1920×1080, 30 fps, −14 LUFS). Poster: `out/poster.jpg`.
- **How it was directed:** [`TREATMENT.md`](TREATMENT.md). **The method:** `.claude/skills/code-rendered-film/SKILL.md`.

## Files
| File | What |
|---|---|
| `film.js` | The film: timeline (`SHOTS`, `CUES`, `IRIS`, `EV`), scenes (rain, night coast, camera), iris, HUD, type, `SCORE` (Web Audio, rendered offline) |
| `index.html` | Live player: poster gate, scrub bar with chapters, frame step, mute. `?render` = bare 1920×1080 canvas for capture, `?t=12` = start time |
| `tools/render.mjs` | Headless renderer and checks (needs Node 20+, ffmpeg; `npm install` in `tools/`) |
| `fonts/`, `fonts.css` | Self‑hosted OFL fonts (rendering never depends on the network) |

## Render
```sh
cd film/tools && npm install
node render.mjs sheet                      # contact sheet, one frame per second → out/check/sheet.jpg
node render.mjs strip --from 23 --to 24.2  # every 0.1 s around a key moment
node render.mjs readcheck                  # every line held ≥ letters/15 + 1.5 s
node render.mjs all                        # score → WAV, frames (4-sample motion blur) → MP4, loudnorm −14 LUFS, poster, checks
```

## Second film: “One second” (vertical explainer)
`escapement/` is a 38.5‑second 1080×1920 TikTok/Reels explainer on how a mechanical watch counts a second, built on the same contract and renderer: `escapement/index.html` plays it, `escapement/out/one-second.mp4` is the master, `escapement/TREATMENT.md` has the reads. Render any film with `--film <dir>`; size, length, poster time and file name come from the page's `window.FILM`:
```sh
node render.mjs readcheck --film escapement
node render.mjs video --film escapement --samples 6 && node render.mjs master --film escapement
```
