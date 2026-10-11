---
name: char-split-scroll-reveal
description: A reusable GSAP "split text" reveal engine - chars/lines split, masked entrance presets (2d rise, x slide, 3d rise with rotationX, plain fade), exact durations/staggers, once-only ScrollTrigger start with a size-aware threshold, hover re-roll, and revert/resplit on resize + fonts.ready. Use for headlines, nav links and labels on portfolio/agency sites. Sources - minhpham.design (app.bundle.js, GSAP 3.11 + split-type + Lenis), matvoyce.tv and iventions.com (same patterns, verified in bundles).
---

# Char/line split reveal engine

Complements `masked-text-reveal` (line masks only): this one splits to chars, ships four presets and handles scroll triggering, resize and teardown. Numbers are lifted from minhpham.design's text class and cross-checked in matvoyce.tv / iventions.com.

## Presets (exact)
All animate each **char** (split types `chars, lines`), wrapped in a line with `clip-path: inset(0)` (or `overflow:hidden`).
| type | from | to | out |
|---|---|---|---|
| `simple` | opacity 0 | opacity 1, 1.4s, stagger .05, power3.out | opacity 0, .8s, stagger .01, power3.inOut |
| `2d` | y 105% | y 0%, 1.4s, stagger .02, power3.out | y -105%, .8s, stagger .01, power3.inOut |
| `x_2d` | x -105% | x 0%, 1.4s, stagger .015, power3.out | x 105%, .8s, stagger .01 |
| default `3d` | y 105%, rotationX 20 | y 0%, rotationX 0, 1.4s, stagger .015, power3.out | y -105%, .8s, stagger .01 |
`3d` needs `perspective: 300px` on the element. Scroll-out helpers: up `y:-105%, power3.out, .6s, stagger .015`; down `y:105%` same. matvoyce's chars: `yPercent 100 -> 0`, **1.2s, stagger .02, power3.out**; also modes `mask_top` (-100), `mask_random` (each char starts at yPercent +-100 chosen by Math.random), `scale` (0->1), `typing` (opacity, .15s, stagger .1). iventions animates **lines** (not chars): `yPercent 100 -> 0` + rotationX/Y, out `yPercent:100, .8s, stagger:-.065` (negative = bottom-up exit).
Default ease everywhere: `power3.out` for in, `power3.inOut` for out/transitions.

## Scroll trigger (verified formula)
```js
function startPct(el) {                       // data-threshold overrides
  const { height, top } = el.getBoundingClientRect();
  if (top < innerHeight) return 0;            // already on screen: fire immediately
  return Math.max(Math.min(map(height / innerHeight, 0, 1, 0.3, 0) * 100 /* matvoyce */, 30), 0);
}
ScrollTrigger.create({ trigger: el, start: `top+=${pct}% bottom`, once: true, onEnter: animIn });
```
(minhpham uses the same map with `.3 -> 0` and string `"${r}% bottom"`.) Meaning: tall blocks start slightly earlier, small ones as they touch the viewport bottom. Fires **once**, then removes its trigger. Items already in view at load get `delay = data-screen-offset`; after first scroll use `data-offset` (stagger blocks by hand). matvoyce: if element is in view at load, delay = `delayEnter + loaderDuration/1000`, otherwise `delayTrigger || 0`.

## Skeleton
```js
import SplitType from 'split-type'; import gsap from 'gsap'; import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
const PRESETS = { '2d': { from:{y:'105%'}, to:{y:'0%',duration:1.4,stagger:.02,ease:'power3.out'} } /* ...table above */ };

function revealChars(el, type = '2d') {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;                                          // leave text visible, static
  const p = PRESETS[type]; let st;
  const build = () => { st?.revert(); st = new SplitType(el, { types: 'lines,chars' }); gsap.set(st.chars, p.from); };
  document.fonts.ready.then(() => {
    build();
    ScrollTrigger.create({ trigger: el, start: 'top bottom', once: true,
      onEnter: () => gsap.fromTo(st.chars, p.from, { ...p.to, onComplete: () => { el.classList.add('animated'); st.revert(); } }) });
    new ResizeObserver(() => { if (!el.classList.contains('animated')) build(); }).observe(el);
  });
}
```
Patterns taken from matvoyce's hook: hide the element (`opacity:0`) until `document.fonts.ready`, then show + split; `ResizeObserver` -> revert, re-split, re-init, and replay if already triggered; after the tween finishes (`onToggle` inactive / complete) `revert()` the split so the DOM is clean again, add class `animated`. Add `will-change: transform` only until `.animated` (`:not(.animated){will-change:transform;backface-visibility:hidden}`).

## Hover re-roll (minhpham, nav/links)
On enter, if not already running: `to(chars, { ...out, duration: .3 })`, then in `onComplete` `fromTo(chars, from, { ...to, duration: .3 })`, flag to ignore re-entry; `killTweensOf(chars)` first. So the label slides out up and a fresh copy slides in from below in ~0.6s total.

## Smooth scroll that pairs with it (minhpham, Lenis old API - labelled as that version's option names)
`duration: 1.65` (2.5 on touch tablets >=768), `easing: t => Math.min(1, 1.001 - Math.pow(2, -10*t))`, `direction/gestureDirection: 'vertical'`, `mouseMultiplier: 1`, `touchMultiplier: 8`, smooth wheel off on touch, `lenis.stop()` until the loader finishes, `history.scrollRestoration = 'manual'`, hide scrollbar, `overscroll-behavior-y: none`. In current Lenis use `smoothWheel` / `syncTouch` instead of `smooth` / `smoothTouch`, and call `lenis.on('scroll', ScrollTrigger.update)` + `gsap.ticker.add(t => lenis.raf(t*1000))`, `gsap.ticker.lagSmoothing(0)`.

## Accessibility and reduced motion
- `aria-label="<full text>"` on the element and `aria-hidden="true"` on chars (iventions passes `aria: "none"` to SplitText and labels manually - same idea). Never split text inside a link without a label on the link.
- Reduced motion: no tween, no split; text visible immediately. Also no hover re-roll.
- No-JS / pre-hydration: only hide with a class set by JS (`.js .is-animation-loading{opacity:0}`), so text is visible without JS. A hidden-until-split flash must not exceed fonts.ready.
- Don't leave split spans in the DOM after the animation (revert) - selection, find-in-page, translation and line wrapping all stay correct.

## Rules / don'ts
- Split only after fonts load and on resize; otherwise lines break differently after split.
- Stagger total should stay < ~0.8s: stagger .015-.02 x chars; for long strings use `lines` or `stagger: {amount: .6}` instead of per-char fixed stagger.
- Mask padding: add `padding-block: .1em` (or negative margin trick) so descenders aren't clipped by `overflow:hidden`.
- One-shot entrances (`once:true`); do not re-trigger on scroll back.
