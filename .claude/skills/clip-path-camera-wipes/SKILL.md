---
name: clip-path-camera-wipes
description: Section changes that read as camera moves instead of fades — a pinned hero that opens like a horizontal slit (clip-path polygon scrubbed by scroll), a drag/wheel slide wipe where two clipped layers pass each other with counter-parallax and a scale 1.2→1 settle, and a clipped image-sequence intro. GSAP + ScrollTrigger + clip-path, Lenis-friendly. Use for hero→content handoffs, case-study carousels, intros. From uncommonstudio.com.au (bundle read at uncommondesign.group) and by-kin.com.
---

# Clip-path camera wipes

All numbers below were read from the shipped bundles (Uncommon `app/page` + slider chunk; 'kin `96-*.js` hero). Lines marked *inferred* are my reading, not literal code.

## 1. Scroll-scrubbed slit reveal (Uncommon hero, desktop >=1200px only)
- Layer B (the next scene) is `position:fixed; inset:0; height:100vh; z-index:0` with `clip-path: polygon(0 50%,100% 50%,100% 50%,0 50%)` (zero-height slit on the centre line). Hero A sits above, pinned by sticky/long section height.
- One scrubbed tween opens it to the full rect; the hero text/art lifts away at the same time:
```js
const mm = gsap.matchMedia();
mm.add('(min-width:1200px)', () => {
  const st = { trigger: hero, start: 'top', end: '+=100%', scrub: 1 };      // scrub:1 = 1s of catch-up smoothing
  gsap.to(layerB,  { clipPath: 'polygon(0% 0%,100% 0%,100% 100%,0% 100%)', duration: 1,
                     scrollTrigger: { ...st, invalidateOnRefresh: true } });
  gsap.to(heroTitle, { yPercent: -120, opacity: .15, duration: 1, scrollTrigger: st });
  gsap.to(letters,   { translateY: '150%', opacity: .15, stagger: { from: 'center', amount: .25 }, scrollTrigger: { ...st, end: '+=90%' } });
  gsap.to(scrollHint,{ opacity: 0, scrollTrigger: { trigger: hero, start: 'top -1%', end: '+=1%', scrub: 1 } });
  return () => {};
});
mm.add('(max-width:1199px)', () => { /* no clip: only gsap.to(hero,{yPercent:50, scrub:true}) parallax */ });
```
- Polygon (not `inset()`) is deliberate: both ends have 4 points so GSAP interpolates cleanly. Never animate `height`/`top`.
- Hand-off flags: `onLeave` hides the sticky header, `onEnterBack` restores it; after the last work/service block, a second ScrollTrigger (`start:'bottom bottom'`) sets the fixed layer `display:none` so it stops painting (perf).

## 2. Drag/wheel slide wipe (Uncommon work slider)
Three stacked slides (`prev`, `current`, `next`), only those three get `visibility:visible`; the rest `hidden`. Driven by a `gsap.ticker` callback, not by tweens:
```js
state.val += (state.mx - state.val) * 0.1;           // lerp toward pointer/wheel delta (inferred: P3 = lerp)
const p = Math.abs(state.val) / W;                    // 0..1 across viewport width W
prev.style.clipPath = `inset(0 ${map(val,0,W,100,0)}% 0 0)`;   // left layer shrinks from the right
next.style.clipPath = `inset(0 0 0 ${map(val,0,-W,100,0)}%)`;  // right layer reveals from the left
prev.img.style.transform = `translate(${map(val,0,W,-25,0)}%,0) scale(${map(p,0,1,1.2,1)})`;
next.img.style.transform = `translate(${map(val,0,-W,25,0)}%,0) scale(${map(p,0,1,1.2,1)})`;
current.img.style.transform = `scale(${map(p,0,1,1,1.4)})`;   // outgoing slide zooms behind: the "dolly"
```
- Commit rule: wheel/drag `|movement| > 300px` → `gsap.fromTo(state,{mx:0},{mx:±W, ease:'power3.out', duration:.8})`; below 300 it springs back (`mx=0`). `state.wheelVal *= .9` per tick damps trackpad inertia. `@use-gesture` `useDrag/useWheel` supply the deltas; clicking a slide (hold < 1s, 0 movement) navigates.
- Images are `object-fit:cover` at 2560x1440; the inner image is oversized by the 1.2 scale so the ±25% translate never exposes an edge.

## 3. Clipped image-sequence intro ('kin home)
Full-bleed stack of images in a container clipped to `inset(50% 0 50% 0)` (slit), then:
- `clip` tween 50→0 over **1.6s `power4.inOut`** (write `inset(${clip}% 0 ${clip}% 0)` in `onUpdate`).
- A counter object steps through the images over **3s `power1.in`**; on each step previous image `opacity:0`, new image `fromTo({scale:1.2,zIndex:2},{scale:1, ease:'power3.out', duration: remaining})`.
- Hand-off: last 3 images tween (`x,y,width,height` to the featured cards' `getBoundingClientRect()`, **1.2s `power3.inOut`, +0.1s stagger**), then fade out `.6s` — the intro *becomes* the grid.

## Rules
- Animate only `clip-path`, `transform`, `opacity`. Set `will-change:transform` on the moving images only.
- Gate scrubbed versions behind `matchMedia`; mobile gets a plain parallax or nothing.
- Pair with `ScrollTrigger.config({ignoreMobileResize:true})` and `scrollRestoration='manual'`.
- A11y / reduced motion: neither site ships a `prefers-reduced-motion` rule (gap). Add one: under `reduce`, skip the scrub (render layer B fully open, `clip-path:none`), swap slide wipes for a 200ms opacity crossfade, and show intro sequences as a single static frame. Keep the slider keyboard-operable (arrow keys, buttons) — drag/wheel alone is not accessible.
- Don't layer more than one scrub tween per property on the same element; use `invalidateOnRefresh` when sizes depend on viewport.
