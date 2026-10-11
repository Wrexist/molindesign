---
name: scroll-velocity-whoosh-audio
description: Scene-transition sound design for scroll films — a looping whoosh whose low-pass cutoff opens as the playhead approaches a scene boundary (and closes if you scroll fast), run through a convolution reverb; plus per-scene ambient beds that crossfade over 2s, three music parts mapped to scenes, and a one-hairline-bar Sound toggle persisted in localStorage. Use with autoplay-scroll-film or any section-based scroll site where transitions should be felt. From brand.ivress.co.jp (IVRESS); values verified in source. Complements web-audio-soundscape.
---

# Scroll-velocity whoosh + ambient beds

## Proximity-driven whoosh (the novel part)
A single looping whoosh sample plays *only near boundaries*; its filter opens as you approach.
```js
const MIN_F = 100, MAX_F = 10000, SMOOTH_MS = 180;
const boundaries = [/* {position (0..1 page progress), approachBefore, approachAfter, disabled} */];
// per scene i<last: position = cumulative screenHeight / total; defaults approach = .025 both sides
//   section1: before = sceneLen*.3, after = .001      section2: before = sceneLen*.3, after = .001
//   section5: before = sceneLen*.5, after = .001 (uses a different whoosh sample: "whoosh-epee-loop")
//   section3, section4: disabled (those transitions are silent)

function proximity(p){ let best=0, b=null;
  for (const x of boundaries){ if (x.disabled) continue;
    const d = p - x.position, w = d<0 ? x.approachBefore : x.approachAfter;
    if (Math.abs(d) < w){ const k = Math.pow(1 - Math.abs(d)/w, .7); if (k>best){best=k;b=x;} } }
  return {best,b}; }

// velocity: v += (|Δp|/Δt - v) * .3 ; fastScrollThreshold = .003 ; fastScrollMaxScale = .25
const velScale = v <= .003 ? 1 : .25 + .75*Math.exp(-(v-.003)*300);   // fast scrolling closes the filter
const ceiling = MIN_F + (MAX_F-MIN_F)*velScale;
const goal    = MIN_F + prox*(ceiling-MIN_F);
cutoff += (goal-cutoff) * (1 - Math.exp(-dt/SMOOTH_MS));              // dt in ms
lpf1.frequency.linearRampToValueAtTime(cutoff, ctx.currentTime + .1); // same on lpf2
```
- Start playback when `prox > 0 && !playing`; stop when `prox === 0 && cutoff <= MIN_F + 50`.
- Chain: `Howl → BiquadFilter lowpass (Q 1) → BiquadFilter lowpass (Q 1) [24 dB/oct] → Convolver reverb (wet .65 / dry .35, decay 6.5, predelay 20 ms, IR = impulse_response.mp3) → Howler.masterGain`. Wet/dry = two GainNodes around a ConvolverNode; load the IR with try/catch and run dry if it fails.
- Net effect: the whoosh swells from a muffled rumble to bright air exactly as the camera crosses the cut, and ducks when the user flicks quickly, so the soundtrack never turns to noise.
- Disable the whole whoosh/reverb group on iOS (`/iPad|iPhone|iPod/`): source skips `addSfxReverbGroup`/`setupWhooshTransition` there.

## Beds and music
- Howler (`html5:false`, WebAudio). SFX volumes: whoosh loops `.2`, particle-chime ambiences `.4`, UI in/out `.8`, start `1`.
- **Music parts** `part_01` (scenes 1-3, autoplay, max `.635`), `part_02` (4-5, `.8`), `part_03` (6, `.8`); only part_01 preloads, others load lazily (`preload:false`) → fast first paint.
- **Ambient beds** by scene: `section3 → chimes-particles-amb`, `section5 → chimes-particles-forest-amb`; on a scene change: fade previous out and next in over **2000 ms** (`howl.fade(0, vol, 2000)`; on out-fade `stop()`), guarded by `websiteStarted` and by "same scene → ignore".
- Audio starts only after the Click-to-start gesture (autoplay policy).

## Sound toggle UI
Header button: `SOUND` label (Josefin Sans 12px) + five **1px-wide, 16px-tall bars** (gap `3px`). Idle: `scaleY(.1)`; playing: `animation: eq 5s ease-in-out infinite` with staggered negative delays (`-.1s,-2s,-.2s,-3s…`) so bars never sync (keyframes e.g. `scaleY(.15) → .95 → .4 → .8`, with ±1-2px translateY). Toggle: `aria-label` swaps "Mute Sound / Unmute Sound", master volume tweens `1↔0` over `1s` (GSAP), state saved as `localStorage.isMuted` (wrap in try/catch), bars wind down smoothly (`transition transform .35s`).

## Rules
- Default to sound ON only after an explicit start click, with an always-visible toggle; remember the choice.
- Honor `prefers-reduced-motion` by leaving the whoosh off (keep music optional); pause audio on `visibilitychange` (not present in source; add it).
- Debounce nothing — the smoothing constants (180 ms, 0.3 velocity filter) are what make it feel analog.
- Keep loops seamless (loop points at zero-crossings) and master-limit the bus; mix whooshes ~ -14 dB under music.
