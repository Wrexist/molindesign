---
name: scroll-velocity-section-metrics
description: Reusable scroll signals for choreographed section transitions — a smoothed, clamped scroll velocity (-1..1) and per-section metrics (progress 0..1, transition -1..0..+1, screenOffset) computed from cached rects, feeding CSS variables or a WebGL/canvas effect (scroll-kicked fluid/particle disturbance). Use when sections should react to scroll speed and enter/exit progress rather than only scroll position. From shopify.com/editions/spring2026 (verified in bundle code).
---

# Scroll velocity + section metrics

Shopify Editions Spring '26 is a React Three Fiber + Theatre.js + Lenis page: a GPU fluid sim and point-cloud scene react to scroll. We did NOT find text-to-points sampling or image-sequence scrubbing in its bundles (it uses 3D assets/point clouds and Theatre.js timelines); the portable, verified part is the signal layer below.

## 1. Smoothed scroll velocity (exact constants)
```js
const GAIN=.32, SMOOTH=14, DECAY=10, DEAD=.01;
let raw=0, v=0, lastT=0, lastY=0, lastEv=0;
function sampleVelocity(y /* lenis.scroll ?? scrollY */) {
  const now = performance.now();
  if (!lastT) { lastT=lastEv=now; lastY=y; return v; }
  const dt = Math.min((now-lastT)/1000, 1/30); lastT=now;
  const d = y-lastY, frameMs = Math.min(Math.max(now-lastEv, 8), 80); lastEv=now; lastY=y;
  raw = Math.abs(d) < DEAD ? 0 : Math.max(-1, Math.min(1, d/frameMs*GAIN)); // px/ms * .32
  v += (raw - v) * (1 - Math.exp(-dt*SMOOTH));   // fast attack
  raw *= Math.exp(-dt*DECAY);                    // decays when scrolling stops
  return v;                                      // -1..1
}
```
Call once per rAF. Use `v` for: skew/stretch (`transform: skewY(calc(var(--v) * -4deg))`), blur/chromatic offset, parallax boost, particle push. Shopify multiplies `v*44` (camera "scrollDrift", only on top GPU tier) and `|v|*3` for effect strength.

## 2. Section metrics (per section rect, cached)
Cache `docTop = rect.top + scrollY`, `height` per section with a `ResizeObserver` (+ resize/orientationchange/visualViewport, rAF-batched) so per-frame work is arithmetic, no layout reads. Then with `top = docTop - scrollY`, `vh = innerHeight`:
```js
const clamp=(x,a,b)=>Math.min(Math.max(x,a),b);
progress   = clamp((vh - top) / (vh + height), 0, 1);          // 0 as it touches bottom, 1 as it leaves top
s = Math.min(height, vh);
entering   = -Math.max(0, top - (vh - s)) / s;                  // -1 .. 0
exiting    = 1 - clamp(bottom / Math.min(height, vh*exitScale), 0, 1); // 0 .. 1  (exitScale default 1, per-section override)
transition = clamp(entering + exiting, -1, 1);                  // -1 entering, 0 fully on stage, +1 gone
screenOffset = (vh*.5 - (anchorTop + anchorH*.5)) / vh;         // anchor centre vs viewport centre (opt. [data-section-anchor])
```
Round to 3 decimals and only publish when changed. Drive `--progress`, `--transition` CSS vars; e.g. `opacity: calc(1 - abs(var(--transition)))`, `translate: 0 calc(var(--transition) * 6vh)`. Choreography rule: the **outgoing** section's `transition` goes 0 -> +1 while the **incoming** goes -1 -> 0, so crossfades overlap naturally; pause per-section effects when `transition` is at -1 (offscreen) — Shopify skips scene updates then.

## 3. Scroll-kicked disturbance (canvas/WebGL)
Shopify paints splats into a fluid sim per tagged element rect each step: only when `|v| >= .018`; strength `clamp(v,-1,1)*K*clamp(dt*60,.25,2)`; splat at rect centre with sideways sway `sin(t*1.7 + i*1.91)*|x|*.28`, radius `clamp(min(w,h)*.045, 9, 23)` (scaled), colour cycling HSL `((t*.07+.11)%1, .55, .54)`, max 8 rects. While scrolling fast, fluid velocity dissipation lerps down to .9 using `smoothstep(|v|, .02, .3)` damped at rate 5 so the trail lingers. 2D-canvas equivalent: spawn/push particles near headline rects proportional to `v`.

## a11y / reduced motion
- `prefers-reduced-motion`: force `v = 0`, freeze metrics-driven transforms (keep opacity-only transitions), no splats. Shopify likewise slows scene time and skips load fades under reduced motion (inferred constant not verified).
- Content must not depend on these signals to be readable; clamp transforms (<= 4deg skew, <= 6vh shift).

## Don'ts
- Don't read `getBoundingClientRect()` on every scroll tick; cache + observe.
- Don't feed raw wheel deltas (spiky); always smooth + clamp.
- Don't use velocity effects on long-form text blocks.
