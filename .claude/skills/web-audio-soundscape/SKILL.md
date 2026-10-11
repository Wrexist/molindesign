---
name: web-audio-soundscape
description: Opt-in, live-mixed Web Audio soundscape for interactive sites — Sound on/off toggle with animated level bars, lazy buffer decoding, looping music bed with lowpass "muffle" by location, scene cues, procedural noise for hover/drag sounds, interaction-driven gain/pitch, and a clean teardown. Use whenever a site benefits from sound design (product films, games, immersive portfolios). From amv.tarunvishwakarma.dev.
---

# Web Audio soundscape

## Principles
- **Off by default, opt-in** (autoplay policies + courtesy). Toggle is visible from the very first screen (top-left during loader, then in nav). Label slot swaps "Sound on / Sound off" in a CSS grid (both rendered, one `invisible`) so width never jumps.
- **Create the `AudioContext` lazily on the first toggle click** (user gesture), then `ctx.resume()`; mute via a master `GainNode` ramp: `out.gain.setTargetAtTime(on?1:0, now, .04)`. Close the context on unmount (`ctx.close()`).
- Fetch+decode buffers with a safe wrapper that never throws: `fetch(url).then(r=>r.arrayBuffer()).then(b=>ctx.decodeAudioData(b)).catch(()=>null)` — every consumer must tolerate `null`.
- Load all buffers as promises up-front *after* the toggle (`music, crank, reveal, circuit, lift, hatch, freeze, xform, loader-exit`), but only await when a cue fires.

## Toggle UI
Three 2 px bars in a 10 px box (`flex items-end justify-between`), heights scale `[.95,.7,1.15]`; **on**: `animate-[level_var(--d)_ease-in-out_infinite] bg-orange-500` with staggered negative `animation-delay` (`-.3s·i`), **off**: `scale-y-[.3] bg-white/40`. `@keyframes level { 0%,100%{transform:scaleY(.3)} 50%{transform:scaleY(1)} }`. `aria-pressed`, `motion-reduce:animate-none`. Mobile keeps the toggle in the top bar (it is the one control never hidden).

## Mix architecture
```
music loop ─► lowpass(muffle) ─► musicGain ─┐
circuit bed ─► lowpass ─► bedGain ──────────┼─► masterOut ─► destination
one-shots (reveal, lift, hatch…) ─► gain ───┤
procedural noise (hover, stir) ─► bandpass ─► gain ─┘
```
- **Spatial storytelling with a filter**: when the camera is "away" from the room, `muffle.frequency → 300 Hz` and `musicGain → 0` (`setTargetAtTime(…, .6)`); back "in the hall" → `20 kHz` and `.5`. Swap which bed is audible per scene (`place('hall'|'circuit')`). A single lowpass sells "behind a door/underground".
- Loops use `loopStart/loopEnd` (`{loopStart:.5, loopEnd:86.52}`) to skip encoder padding → seamless.
- Always use `setTargetAtTime` (exponential smoothing) instead of hard sets → no clicks.
- One-shots are started with an **offset equal to lateness** (`start(0, ctx.currentTime - cueTime)`) so a cue that fires late stays in sync with the visual.
- Per-cue gains table: `{lift:.5, hatch:.28, freeze:.28, xform:.28}`; music `.5`; crank `.4`.

## Procedural sounds (no assets)
- Create a 2-second stereo white-noise `AudioBuffer` once.
- **Hover whoosh**: noise → bandpass (1800→4200 Hz ramp over .35 s, Q 1.2) → gain env (`linearRamp .05 @60 ms`, then decay τ≈.09), throttled to once per .6 s on entering an interactive area.
- **Stir/drag texture**: looping noise → bandpass (`700 + 1900·v` Hz) → gain `.045·v^.8`, smoothed (`.05` attack, `.08` release). Interaction speed `v∈[0,1]` modulates it.
- **Drag crank**: looped sample with `gain = .4·p^.8`, `playbackRate = .85 + .5·p` — pitch rises with progress; stop on commit then fire the stinger.

## Rules
- Never autoplay; never play above −12 dBFS-ish loudness (gains ≤ .5 master-relative).
- Respect tab visibility (optional: suspend context on `visibilitychange`).
- Provide visual equivalents for every cue (captions/beats) — sound is enhancement only.
- Keep assets small (mp3/ogg); host at `/<site>/audio/*.mp3`; note licensing for music.
