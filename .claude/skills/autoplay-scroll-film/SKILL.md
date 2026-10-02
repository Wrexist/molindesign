---
name: autoplay-scroll-film
description: A scroll-driven WebGL "film" that also plays by itself — a tall dummy scroll height split into scenes, Lenis + GSAP on one rAF, per-scene progress uniforms (0..1) that shaders window with smoothstep, an autoscroll driver the viewer can steer (scroll/arrow = direction, press-and-hold = slow to 0.2x), a click-to-start gate with a letter-by-letter blur prologue. Use for brand stories / case-study films with 5-8 scenes. From brand.ivress.co.jp (IVRESS "Spin a Tale"); numbers verified in source.
---

# Autoplay scroll film

## Architecture (verified)
- Real page scroll exists, but only as a **timeline**: `#app` height = `sum(screenHeight) * 100vh`. IVRESS: scenes `[3,3,3,3,3,8]` screens = 23 screens desktop; mobile multiplies by `0.8`.
- Single scene table drives DOM, shaders, audio and UI:
```js
SECTIONS = [
 {id:'section1', progress:'one',   screenHeight:3, ui:{from:0,  to:.6}},
 {id:'section2', progress:'two',   screenHeight:3, easing:'easeInQuad', ui:{from:.1,to:.8}},
 {id:'section3', progress:'three', screenHeight:3, ui:{from:0, to:.95, parts:[{key:'part1',from:0,to:.45},{key:'part2',from:.5,to:.95}]}},
 {id:'section4', progress:'fourth',screenHeight:3, ui:{from:.1,to:.9}},
 {id:'section5', progress:'five',  screenHeight:3, ui:{from:.1,to:.9}, interaction:{fromOffset:.12,toOffset:.05}},
 {id:'section6', progress:'sixth', screenHeight:8, ui:{from:0,to:.95, parts:[{key:'part1',from:.05,to:.3},{key:'part2',from:.3,to:.52},{key:'part3',from:.52,to:.64}]}},
]; // from/to are normalised page progress; ui.from/to = window in which that scene's text is allowed to be .show
```
- Each scene owns a uniform `xProgress ∈ [0,1]`. A scene-change is just one uniform going 1→0 while the next goes 0→1; **materials read the uniforms directly** (TSL nodes), e.g. `twoProgress.smoothstep(.55,1)`, `fiveProgress.smoothstep(.275,.8)`, `twoProgress.smoothstep(.6,.95)`. Define each effect as a smoothstep *window* over a scene's progress (glow ramps `.5→1`, cloth assembles `.275→.8`) so cross-scene transitions overlap and never hard-cut. Optional easing per scene (`easeInQuad = t*t`, also `easeInCubic`, `easeInQuart`).
- `a.currentIndex` / `a.sections.current = 'section'+(i+1)` + a `sectionProgress` event feed audio, UI and pagination.

## One clock
```js
const lenis = new Lenis({ syncTouch:true, smoothWheel:true, normalizeWheel:true,
  wheelMultiplier: isWindows ? 1 : .5, touchMultiplier:1, syncTouchLerp:.075, touchInertiaMultiplier:30, lerp:.1 });
gsap.ticker.lagSmoothing(0); gsap.ticker.remove(gsap.updateRoot);   // GSAP no longer self-ticks
rafBus.add(t => { gsap.updateRoot(t/1000); lenis.raf(t); /* then damp below */ });
// wheel input clamped for consistency: deltaY = clamp(deltaY, -50, 50)
let shown = 0;  rAF: shown = damp(shown, lenis.progress, 12, dt);  // THREE.MathUtils.damp, lambda 12
if (Math.abs(shown - target) < 1e-4) shown = target;
```
- Double smoothing is deliberate: Lenis `lerp .1` for the page, then `damp(…,12)` for the scene uniforms → camera moves feel weighty. `lenis.stop()` until the start click; `scrollTo(0,{immediate:true})` on boot. Provide `skipDampOnce` / `skipDampForFrames` flags for jumps (anchors, loop-back) so uniforms snap instead of sweeping through every scene.
- Renderer and Lenis share a single rAF (`rafBus` with `renderPriority`; renderer 999999 = last).

## Autoscroll (film plays itself)
Started on the click-to-start; state in a small class (`started, direction, boostMax 3, boostGain 1.5, userBoostDamp 12, dirDamp 14, holdMs 350, targetMultiplierSlow .2`):
- Base speed: `uniformSectionDuration = 50 s` per scene desktop, `25 s` touch (declared in source; I read the `global` branch fully, the default `perSection` branch only partly, so treat the exact per-scene mapping as inferred).
- **Steering**: wheel/arrow/space/touch-drag sets `direction` (+1/-1, deadzone `3 px` on touch, `0` desktop); keyboard adds `keyboardExtraSpeed = 10` while a key is held (ArrowUp/Down/Space). User scroll velocity adds a boost up to `×3`.
- **Press-and-hold to savour**: `mousedown` → after `50 ms` `targetMultiplier = 0.2`; release → `1`. Cheap, delightful "slow motion" with zero UI.
- Touch: while a finger is down or Lenis velocity `>= 5` set `deferToLenis = true` and stop autoscroll writes; resume when settled. No fighting the user.
- Pauses in sub-pages/anchor scroll (`inSubpage`, `anchorScrolling`). Fractional scroll: if the browser can't scroll sub-pixel, accumulate and apply `trunc()` remainders.
- Provide an off switch (`autoscrollEnabled=false`, `setEnabled()`) — IVRESS exposes it internally but shows no UI; **add a visible pause/play control** (a11y: WCAG 2.2.2).

## Start gate + prologue (text beats)
1. `#prologue` full-black overlay with one line of serif text, letters spans `data-delay 0..9` (scrambled order, not left→right, for an organic feel).
2. Letter reveal: base `opacity 0; filter blur(12px); transform scale(.8)`; shown: `opacity 1.68s, filter 2.28s, transform 1.2s`, ease `--main-ease: cubic-bezier(.25,1,.5,1)`, delays `i*0.05s` (opacity) and `.3s + i*.05s` (filter/transform). Hide: `opacity 1.4s, filter 1s`. In-scene story text uses `1.4s / 1.9s / 1s`.
3. Title: per-char `translate3d(0,100%,0)` in overflow-hidden wrappers, `1.7s` (second line `2.2s`), `transition-delay: calc(var(--char-index) * .1s)` (see `masked-text-reveal`).
4. "CLICK TO / START" (touch: "TAP TO / BEGIN") circular button with an infinite ripple: `border 10px white; scale 0→1; opacity .35→0; 2s ease-out infinite`. The click is the audio-unlock gesture: play the start sfx, `lenis.start()`, `autoscroll.start(1)`, fade title out (`hide`, remove after `2000ms`), reveal the scroll hint after `600ms`.
5. The prologue background fades `#000 → transparent` over `3s` (`--main-ease`), exposing the 3D scene underneath — the loader→film handoff is a dissolve, not a cut.

## Look tokens
`--default-color #FAF5F0; --hl-color #f9b639; --color-black #000203; --main-ease cubic-bezier(.25,1,.5,1)`; fonts: condensed display serif (`Basilia Compress D`, self-hosted woff2) + `Josefin Sans` UI + a JP Mincho stack (`A-OTF Ryumin Pr6N` → Hiragino/Meiryo) for story text. Warm cream on near-black with ONE amber accent.

## Rules
- Text visibility is derived from scene progress windows (`ui.from/to`), never from timers.
- `prefers-reduced-motion` (not handled in the source): skip autoscroll, drop blur/scale from letters (opacity only), render stills per scene, keep native scroll with `scroll-snap`.
- Keep real, keyboard-operable controls: Space/Arrows already steer; add Esc/pause, visible focus, a skip link past the film, and a text transcript of the story (SEO + a11y).
- Cap wheel deltas and keep `touch-action` sane; test iOS (Lenis `syncTouch` is the risky bit).
- Minimise DOM: ~6 absolutely positioned `.story-section` layers fixed over one canvas; toggle `.show/.hide` classes only.
