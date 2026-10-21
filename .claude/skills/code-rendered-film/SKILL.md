---
name: code-rendered-film
description: Make a launch film, hero loop, social clip or pitch video entirely in code — one page whose every frame is a pure function of t (render(t), DUR, READY, EV, TEXTS), played live as a website and captured by headless Chromium into an MP4 with sub-frame motion blur, a procedural score rendered offline from the same timeline, two-pass loudnorm to −14 LUFS, grain added in ffmpeg. Includes the directing method (benchmark, three structures, one native move, write the reads), a text-dwell check, contact-sheet review and an independent AI-jury rubric. Use when a site needs a video asset (hero fallback MP4 for low GPU tiers, OG/social clip, launch film) or when the brief is a film. From lemo-opuscar, ClaudeAnimationBase, mg-styles-15, pdoom-video and opus-video-prompts (read in source, Oct 2026), proven in film/ (Halden LF‑1 "Held").
---

# Code-rendered film

Working example in this repo: `film/` (live: `film/index.html`, renderer: `film/tools/render.mjs`, treatment: `film/TREATMENT.md`). Everything below marked **verified** was read in the source repos or is running in `film/`; **inferred** is our own reasoning.

## 1. The contract (verified, all five source repos use a variant)
One page exposes:
```js
window.DUR = 34;                      // seconds
window.render = (t, samples, shutter, fps) => {};   // draw frame t; samples>1 = motion blur
window.READY = true;                  // after fonts/assets load (await document.fonts.load for each face)
window.EV = [{ t: 1.0, type: 'shutter' }, …];         // cue events, feed the score and the mix
window.TEXTS = t => [{ id, text, x0, y0, x1, y1 }];   // texts fully readable at t (for the dwell check)
window.SCORE = offlineAudioContext => {};             // builds the score on any (Offline)AudioContext
```
Rules: **no `Date.now`, no unseeded `Math.random`, no CSS animations/transitions, no timers, no state carried between frames.** Any frame can be drawn alone, in any order, by any worker. Seeded RNG (`mulberry32`) and `hash(i)` for anything that must stay put.

## 2. One timeline drives everything (verified)
A single table (`SHOTS`, text `CUES`, readout steps, `IRIS` transitions, `EV`) is read by the picture, the score, the HUD, the player's chapter ticks and the checks. Put cuts on downbeats (120 BPM → 1 bar = 2 s) and land every visual hit on a beat. Change a time once; everything follows.

## 3. Motion as pure functions of t
- **Springs as closed-form step responses** (verified, opus-video-prompts #15): `y = 1 − e^(−ζωt)(cos ω_d t + ζω/ω_d sin ω_d t)`. A value that changes target many times is the **sum of one spring per change**: `v(t) = v0 + Σ Δv_i · step(t − t_i)`. Keep ζ ≥ 0.85 for premium work (no bouncy easing).
- **Bullet time without state**: integrate a smoothstep rate analytically: for `u = (t−a)/(b−a)`, `τ = (b−a)(u³ − u⁴/2)` (film/ `rainTime`).
- **Physical mapping beats decoration**: streak length = velocity × shutter time; exposure lifts dark layers by `e^1.6` and bright ones by `e^0.4`, so lights appear first.
- **One world → screen function** per scene (verified, lemo TECHNIQUE §2). Any effect that follows a subject (iris onto a star, a crop) calls it. Never hand-type screen coordinates.
- **Rolling digits** for readouts: per-character roll from the step list, staggered 25 ms right-to-left (pure-function version of `animated-number-flow`).
- Live grain is a tiled noise canvas seeded by `floor(t·24)`; **off in render mode**, ffmpeg adds it (`noise=alls=5:allf=t`) because drawn grain makes frames incompressible (verified, lemo).

## 4. Motion blur (verified: pdoom-video, opus-video-prompts)
Average sub-frames across a shutter of ½ frame. In Canvas 2D an exact running mean: draw sub-frame k into a scratch canvas, composite it over the accumulator at `globalAlpha = 1/(k+1)`. 4 samples at 30 fps is enough for UI and camera moves; pdoom samples adaptively per 32 px tile (12 still → 324 whip).

## 5. Sound from the same timeline
`SCORE(ctx)` builds nodes on an `OfflineAudioContext` (deterministic): EV-driven foley (shutter = band-passed noise slap + high tick 55 ms later + 150→60 Hz thump), seeded-noise convolution reverb, pads, bells (FM), plucks, noise beds. The live player renders the same buffer once on the first Play gesture, normalises to −1 dBFS, and uses the audio clock as the picture clock (`t = ac.currentTime − startedAt`). The renderer writes it to WAV and masters with **two-pass loudnorm, I −14 LUFS, TP −1.5** (verified, lemo `mux.sh`).
- Keep 20–120 Hz about 3 dB under the rest (verified, lemo §5): a 38 Hz high-pass and a −4 dB low shelf at 140 Hz on the master fixed ours (measured −1.6 → −3.4 dB).
- **Two real silences** before the turn and before the peak; the first sound after each is one of the most important in the film. Use sound as a transition (J/L cuts) at least twice (verified, lemo DIRECTOR §6).

## 6. Directing (verified, lemo DIRECTOR + ClaudeAnimationBase)
1. Pick 1–2 **benchmarks**; write "learn / don't take".
2. Write **three candidate structures**, choose one, say why. The first idea for a style is its cliché.
3. One subject, one goal, **one turn**; hook in 3 s; no slow logo reveal; the ending rhymes with the opening.
4. **One native move** at the emotional peak (in film/: the 9-blade aperture iris is the only transition, and it closes onto a star that becomes the shutter button).
5. ≥ 4 camera moves, one signature shot, transitions made of the medium (no default fades).
6. **Write the reads**: per shot, what the viewer must understand, in order. One read at a time; fast actions, slow meanings; lead the eye; reads set the length.
7. Avoid twinning (code copies values: offset phases and seeds).
Write it all in `TREATMENT.md` (shot list, cue map, sound table) before code.

## 7. Review loop (verified; tooling in film/tools/render.mjs)
- `node render.mjs sheet` (frame every 1 s), `strip --from a --to b` (every 0.1 s around key actions), `still --t` (full-size detail). Look at them. Two passes minimum.
- `node render.mjs readcheck`: every text must be fully on screen for **≥ max(1.8 s, letters/15 + 1.5 s)** (ZH: chars/4.5 + 1.5). It caught 5 of 9 lines in our first cut.
- On the master: `ebur128` (loudness, true peak), `blackdetect` (unintended black), `ffprobe` (duration, size, fps).
- Then an **independent jury**: a fresh session that did not make the film scores it 1–10 (5 student, 7 pro, 8 agency, 9 award shortlist) on style fidelity, concept/wow, motion craft, design/type, finish, sound sync, technical; lists 5–10 fixes by impact with timecode, observation, why and numbers; at least one fix must raise the wow; flags anything generic/AI-template. Keep version N, apply, re-render, re-review (verified, mg-styles-15 `rubric.md`; their films ended 7.6–8.2).

## 8. Ban list for "high-end minimal" (verified, opus-video-prompts #16)
Shockwave rings, particle bursts, RGB split, camera shake, lens flares, neon glows, grid floors, flashing backgrounds, bouncy easing. Also: never set `opacity`/`filter` on a `preserve-3d` element (it flattens); fade a wrapper.

## 9. Website uses (inferred)
- **Hero fallback**: render the WebGL hero to a 6–8 s seamless MP4 (last frame = first frame) and serve it to `gpu-tier-adaptive-quality` tier 0–1 and to `prefers-reduced-data`.
- **OG / social clip**: the same page at `--size 1080x1920` or 1200×630 still via `render.mjs still`.
- **Pitch film** for a client demo, built from the site's own tokens and copy.
- The live player is itself a page: chapter ticks, scrub, frame step (`,` `.`), never autoplay, sound only after a gesture, `visibilitychange` pauses.

## 10. Assets and rights (verified, lemo §11)
Only CC0 / CC BY / OFL; list each in `CREDITS`; self-host fonts (Google Fonts CSS API → woff2 into the project); never link fonts at render time. Procedural sound needs no licence.

## Pitfalls we hit
- Bokeh drawn as stretched sprites looks like brushed metal, not rain: draw streaks as thin gradient strokes and keep stretched sprites for out-of-focus only.
- A hard-edged beam polygon reads as a flashlight: draw beams into a quarter-res buffer and upscale for free softness.
- Text dwell fails silently by eye: run `readcheck` after every retime.
- `exitCode` from a check stops a `&&` chain; run audio/video steps separately when iterating.
- Rain read as stock bokeh until each near drop became a teardrop lens (an upside‑down image of the lamp inside, a rim, a specular) drawn `source-over`, with a visible lamp and a soft cone behind it. Additive circles alone read as "bokeh background".
- A long exposure is a pure function too: average K samples over the window opened so far (K grows with the elapsed exposure). Glints become silk lines, a beam becomes a fan; no frame-to-frame accumulation buffer needed.
- An outline drawing of the product reads as a wireframe: give it mass (gradient body, texture, rim light, one light sweep) and fade the construction strokes as the shading arrives.
- A "silence" is not silent while reverb tails run: duck the master, not just the beds. Our first jury measured −24 dB in it; aim ≤ −34 dB.
- True peak: limit at 4× oversampling (`aresample=192000,alimiter,…,aresample=48000`); a 48 kHz limiter still gave +2 → −0.5 dBTP.
- A long exposure of a rotating beam seen side-on is just two brighter wedges. Give each averaged instant its own small tilt (seeded) and narrow the beam as the exposure grows: the fan becomes rays, the signature shot of round 3.
- Run the jury twice. Round 1 (≈6/10) found what self-review missed: the ending iris landing on the wrong object, a dead black stretch, all lower-thirds on one baseline. Round 2 scored 7.0 and asked for the ray fan, earlier and brighter product shading, a legible price and glass air in the frozen section.
