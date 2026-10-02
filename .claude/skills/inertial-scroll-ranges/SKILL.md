---
name: inertial-scroll-ranges
description: Scroll architecture for award-style sites — keep NATIVE scroll (sticky, anchors, a11y intact) but drive it with custom exponential-ease wheel inertia + drag-flick friction, then derive a per-section "range" ratio (-1…0…1) every frame and write transforms/opacity/blur directly to DOM from it (staggered per-line/char with a fit()+ease helper). Includes the Lenis variant (lerp .04, scripted scrollTo 2 s, auto-drift). Use for single-hero-object / z-depth scroll stories where text, card and 3D layers must leave in sync. From oryzo.ai (Lusion) bundle; Lenis notes from hubtown.co.in (Unseen).
---

# Inertial scroll + section ranges

Verified in `oryzo.ai` `hoisted.js` (`ScrollPane`, `ScrollDomRange`, `HeroSection.update`) and `hubtown.co.in` (Lenis config + scripted `scrollTo`). Numbers below are from source unless marked *(inference)*.

## 1. Scroll driver (Oryzo: custom, no Lenis/ScrollTrigger)
- Page height = real content height (`body.style.height = content.getBoundingClientRect().height`); content stays `position:relative; transform:none` so native `position:sticky`, anchors and scrollbars still work. Each frame the engine computes `scrollPixel` and writes it back with `window.scrollTo({top, behavior:'instant'})`; a `_skipNativeScroll` flag stops that write from re-triggering the `scroll` listener. A real native scroll (scrollbar drag, find-in-page) resets target = current, velocity = 0.
- **Wheel**: `delta = clamp(normalizedWheelY, -200, 200)`; `target = clamp(target + delta)`; per frame `step = (target - pos) * (1 - exp(-12 * dt))` (wheelEaseCoeff 12). Stop when `|target-pos| < 0.1`.
- **Drag/touch flick**: while dragging, pos follows the pointer 1:1 and a 0.1 s history of `{deltaPixel, deltaTime}` is kept; on release velocity = time-weighted mean of that window. Then `v += -mix(2.1, 1.9, clamp(|v/viewH/5|,0,1)) * v * dt; pos += v * dt` (friction 2.1 slow → 1.9 fast, i.e. faster flicks coast slightly longer).
- Keys: ↑/↓ ±100 px, PageUp/PageDown ±viewport height (they animate through the same target).
- `scrollTo(el, offsetViewFraction)` sets `target` (animated) or resets instantly (`scrollToPixel(0, true)` on route change). `history.scrollRestoration = 'manual'`.

```js
// per-frame (dt in seconds)
function step(dt){
  if (wheeling){ target = clamp(target + wheelDelta, 0, max); wheelDelta = 0;
    const d = target - pos; pos += d * (1 - Math.exp(-12 * dt)); if (Math.abs(target-pos) < .1){ pos = target; wheeling = false; } }
  else if (!dragging){ v += -(mix(2.1,1.9,clamp(Math.abs(v/vh/5),0,1))) * v * dt; pos = clamp(pos + v*dt, 0, max); }
  if (Math.abs(pos - written) > .1){ skipNative = true; written = pos; scrollTo({top: pos, behavior:'instant'}); }
}
addEventListener('wheel', e => { wheelDelta += clamp(normalize(e), -200, 200); wheeling = true; }, {passive:true});
```
Note: Oryzo calls `preventDefault` nowhere in this path in the code I read; native scroll is overridden by the instant write each frame *(inference: verify there is no double-scroll in your build; safer to `preventDefault` wheel on the driver when you implement it)*.

## 2. Section range (the key abstraction)
`getDomRange(el)` caches `getBoundingClientRect` (invalidated on resize / ResizeObserver) and exposes, per frame, with `o = rectTop - scrollPixel`, `h = height`, `V = viewport`:
- `ratio` ∈ [-1, 1]: −1 = fully below the viewport, 0 = fully on screen / pinned, +1 = fully scrolled out above. (`min(0, fit(o, V, V-h, -1, 0)) + max(0, fit(o, 0, -h, 0, 1))`)
- `showScreenOffset = -(o-V)/V` (0 when top touches bottom edge), `hideScreenOffset = -(o+h)/V` (0 when bottom touches top edge, negative while visible).
- `isActive = ratio in [-1,1]` → set `visibility:hidden` and skip all work when false.
Helpers: `fit(x, a, b, c, d, ease?) = c + ease(clamp01((x-a)/(b-a))) * (d-c)`; `ease` = the standard Penner set (cubicOut, cubicInOut, backOut, expoOut, sineOut…).

## 3. Writing the exit/enter (Oryzo hero, exact recipe)
`l = activeRatio = fit(range.hideScreenOffset, -1, -.5, 1, 0)` (1 while hero fills screen, 0 once half scrolled out). Also drives the 3D layer (`heroScene.activeRatio` → camera2D zoom `fit(l,1,0,1,.95,cubicIn)`, gobo opacity, blur plate). Sets CSS var `--active-ratio` too.
- Per **word/line/char i of n** (`I = 1 - i/(n-1)`): exit progress `k = fit(l, I*.2, I*.2+.8, 1, 0)`; chars: `opacity = enter*(1-k)`, `filter: blur(fit(k,.25,.75,0,.3)em)` (desktop only), `translate3d(enter-x em,0,0)`; lines: `translate3d(fit(l,I*.2,I*.2+.8,1,0,cubicOut)*2em,0,0)` (mobile: `translateY(-2em)` instead). Tagline words: `translateY(-fit(l, I*.3, I*.3+.67, 1, 0, cubicOut)em)`.
- Entry (after loader): same per-item `fit(startTime, .5+E*.2, 1.5+E*.2, 0, 1, cubicOut)` where `E` = stagger 0…1 → 1 s per item, 0.2 s total spread, 0.5 s delay.
- Logo: header logo morphs from hero ref box to nav slot with `fit(l, 0, .5, …, cubicInOut)` for scale/x/y.
- Dash-line under card grows `width = fit(l*enter, 0,1, 0,100, cubicOut)%`.
- Library: GSAP **SplitText** only for splitting (`type:'lines,chars'`, `mask:'lines'`, `autoSplit:false`, re-split in `resize`); no GSAP tweens drive scroll. Add `translateZ(0)` on lines.
**Why it works**: one scalar per section drives every layer, so DOM text, WebGL props and a blur plate can never drift out of sync, and the stagger is "free" (a different input window per item).

## 4. Lenis variant (hubtown.co.in)
- Lenis (autoRaf off, ticked by the app RAF) on a wrapper/inner pair; home config `{ lerp: .04 }` (very heavy glide — default is .1). Sections are `h-[400vh]`/`h-[1000vh]` with `data-trigger-start/end` pixel limits and GSAP ScrollTrigger (`start:'top center', end:'bottom-=25% top'`) scrubbing a Theatre.js sequence per WebGL scene.
- **Programmatic moves**: `stop()` → `scrollTo(mid, { duration: 2, easing: t => t*(2-t), force:true, lock:true, onComplete: () => start() })` (quadOut, 2 s) for nav clicks within a scene; 5 s for cross-scene transitions while a displacement-shader pass runs.
- **Auto-drift in marked sections** (desktop only): in RAF, if `lenis.scroll` is inside a limit pair and `lenis.velocity >= 0`, call `lenis.scrollTo(lenis.targetScroll + 8, { programmatic:false })` → ≈ 8 px/frame gentle autoplay that the user can still override.

## Rules
- Prefer **native scroll + eased driver** to a transform-based scroller: keeps sticky, `scroll-margin`, anchor links, scrollbar, and keyboard working.
- Cache rects; only re-measure on resize/ResizeObserver, never per frame. Cull inactive sections.
- Write `style.transform/opacity` directly (no framework state per frame). `translate3d`, `will-change` only on animating elements.
- Mobile: drop blur filters and x-translations (Oryzo does), use Y translate.
- **Reduced motion**: `matchMedia('(prefers-reduced-motion: reduce)')` → disable the custom driver (let the browser scroll), set every range-driven property to its end state (`opacity:1; transform:none; filter:none`) and skip auto-drift/scripted `scrollTo` (use `behavior:'auto'`).
- Keep headings in real DOM text (SplitText wraps; add `aria-label` to the original element if you split chars, `aria-hidden` on the spans).
- Don't hijack Ctrl+wheel (zoom) or overlays with their own scroll (`overscroll-behavior: contain`).
- Not verified: Oryzo's exact scroll-length per section (depends on CSS heights I did not trace).
