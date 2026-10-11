---
name: scroll-scrubbed-webgl-sections
description: One fixed WebGL canvas behind a Webflow/HTML page where each section owns a paused GSAP timeline scrubbed by ScrollTrigger (scrub:true) — Lenis synced to the GSAP ticker, overlapping pre-roll windows, group.visible gating, class toggles for CSS, SplitText char fades. Use for scroll-driven 3D/illustrated narratives layered on normal DOM sections. From sleep-well-creatives.com (verified in its bundle).
---

# Scroll-scrubbed WebGL sections

Verified in sleep-well-creatives.com's JS (GSAP + ScrollTrigger + SplitText 3.13 + Lenis 1.3 + three.js, hosted on Webflow with the app bundle loaded as a module).

## Architecture
- Normal Webflow/HTML sections provide scroll length and copy. **One fixed `<canvas>`** (three.js) sits behind. No pinning; the DOM scrolls, the canvas reacts.
- Each 3D scene is a class owning a `THREE.Group` (`visible=false` by default) and **paused timelines** (`gsap.timeline({paused:true, defaults:{duration:1, ease:'linear'}})`). A single `ScrollTrigger.create({... scrub:true, onUpdate:s => tl.progress(s.progress)})` drives them. Easing lives INSIDE the timeline tweens (`power1.in`, `power2.in`, `power4.in` on position/rotation/scale), the scrub itself stays linear.
- Always set `onEnter/onLeaveBack` -> `group.visible = true/false` and skip `update()` when the section class is not active (the scenes check `section.classList.contains('is-xxx-active')`). Offscreen scenes cost nothing.
- Toggle a CSS class from the same trigger (`toggleClass:'is-footer-active'`) so DOM styling and the GL scene share one source of truth.

## Trigger windows (exact values seen)
```js
// enter-pre-roll: scene fades in BEFORE its section reaches the viewport
ScrollTrigger.create({ trigger: sec, start:'top 200%', end:'top 100%', scrub:true,
  onEnter:()=>group.visible=true, onLeaveBack:()=>group.visible=false,
  onUpdate:s=>tlBefore.progress(s.progress) });
// main run: from section top entering to leave-marker passing
ScrollTrigger.create({ trigger: sec, start:'top 100%', endTrigger: leaveEl, end:'bottom 200%', scrub:true, ... });
// UI add/remove bracketing: start 'top 0%' -> end 'top -25%'  (UI in) ; 'top 125%' -> 'top 100%' (UI out)
// last section: start:'clamp(top bottom)', end:`+=${sectionHeight*1.01}` (1.05 on <570px)
```
Use `end` values beyond 100% (`bottom 200%`) so the scene finishes before the next one starts — overlapping windows make crossfades without extra code. Tip: `scrub:true` (no smoothing number) is fine because Lenis already smooths.

## Lenis + GSAP wiring (verbatim pattern)
```js
if (innerWidth >= 1025) {                       // desktop only; native scroll on touch/tablet
  const lenis = new Lenis({});                  // defaults (lerp .1)
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);                  // required, else scrub drifts after lag
}
```
Load `lenis.css` too. Add `data-lenis-prevent` on inner scrollers/modals.

## Small details worth copying
- Mouse parallax on the whole scene wrapper: `gsap.to(wrap.rotation,{duration:3, ease:'expo.out', y:mapRange(0,w,-.05,.05,mouse.x), x:mapRange(0,h,-.025,.025,mouse.y)})` — tiny angles (±0.05 rad) read as depth, not wobble.
- Ambient dust/snow: one `InstancedBufferGeometry` quad, per-instance attributes `aPosition, aScale(.015–.055), aSpeed(.3–1.1), aPhase, aSwayAmplitude`; falling is `mod(uTime*aSpeed, 8.)` in the vertex shader; sprite = 92px radial-gradient canvas texture, optional texture atlas via `aTileIndex`. Zero CPU per frame.
- Text: `SplitText.create(el,{type:'chars, words'})` then `from(chars,{opacity:0,duration:2,ease:'power1.out',stagger:.02})` fired once by `ScrollTrigger({start:'top 100%', onEnter})`. SVG line draws: `drawSVG '0%'`, 2 s, `power3.inOut`. (Slow 2 s fades are the sleepy brand tone; use ~0.6–0.9 s for energetic brands.)
- Set `--vh` CSS var from `innerHeight*.01` on resize and remove the preloader node after init.

## a11y / reduced motion
- Under `prefers-reduced-motion`: don't create Lenis; replace scrub timelines with one-shot `tl.progress(1)` states when the section enters (or just show the final pose); skip mouse parallax and dust.
- Copy must live in real DOM text (the canvas is `aria-hidden`); never put meaning only in GL. Keep `pointer-events:none` on the canvas.
- Autoplay media (video/audio in this site) must start muted and be opt-in for sound.

## Don'ts
- Don't scrub with `scrub: 1+` on top of Lenis (double smoothing = lag).
- Don't forget `ScrollTrigger.refresh()` after fonts/images/video metadata load (section heights drive the timeline length).
- Don't run Lenis on touch devices (inference: the site disables it below 1025px for that reason).
