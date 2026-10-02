---
name: gated-page-transitions
description: Route transitions and entrance choreography that never call attention to themselves — a state machine (cover → push → reveal) with Lenis stop/reset, a shared-image iris transition, and a "play" gate so every section's entrance (masked word lines, image scale-settle, hairline draw) fires only after the cover lifts, with a delay rule for above vs below the fold. Next.js App Router + GSAP + ScrollTrigger + Lenis. Use for any multi-page motion site. From by-kin.com and uncommonstudio.com.au.
---

# Gated page transitions + entrance choreography

Both sites share the same architecture (Next App Router, GSAP, ScrollTrigger, signals/Zustand store). Values below are from the bundles.

## State machine
`animationIn(url)` → overlay in → `setInComplete` → `router.push(url,{scroll:true})` → new route mounts → loader/"ready" flag → overlay out → `play()` (entrances fire) → `ScrollTrigger.refresh()`.

**'kin (logo cover), exact:**
- Cover fades in `opacity 0→1, .6s power3.out`; simultaneously its SVG logo's 3 glyph groups slide in: group0 from `y:-120%`, group1 from `y:+120%`, group2 from `x:+120%`, all to 0 over **.6s `power3.inOut`**. `body.is_transition` set (blocks pointer/scroll).
- Push route on cover complete. On ready: glyphs exit (reverse direction, `.6s power3.inOut`), cover fades out `.6s power3.inOut` with `delay:.5`; after `(.5s + 100ms)` call `play()`, remove `is_transition`, `ScrollTrigger.refresh()`. Constants: `XX=100ms`, `q$=.6s`.
- First load uses the same cover as a `Loading...` page loader (blinking dots) fading out `.6s power3.inOut`.
- `history.scrollRestoration='manual'`; on boot `window.scrollTo(0,0)` and `lenis.scrollTo(0,{immediate:true})`.

**Uncommon (two variants chosen by `typeEffect`):**
- `page`: dark full-screen cover `opacity→1 .6s power3.out`; out: `opacity→0, delay .4, .6s power3.inOut`, then `play(); reset(); ScrollTrigger.refresh()`. `<html class="is-loading">` sets `* {cursor:wait}`. Cover z-index `99999999`; use `100svh` on mobile.
- `page_work` (shared element): the clicked thumbnail's `src` is stored; an overlay `<img>` is sized to viewport, fades items (`.8s power3.out`, `+.15s` per `data-outing` index), route pushes, then the overlay box collapses `clip-path: inset(50% 50% 50% 50%)` over **1s `power3.inOut`, delay .4** revealing the new page behind it. Thumbnails were pre-warmed with `caches.open('CACHE_IMAGES')` + `cache.put` so the overlay image paints instantly.
- On `ScrollTrigger.killAll()` + rebuild each navigation (`killAll` on `animationIn`, refresh after).

## Lenis hooks (both)
- Stop scroll while a menu/overlay is open: `lenis.stop()`; resume `lenis.start()`. Nested scrollers get `data-lenis-prevent` (+ `-wheel`/`-touch`). CSS: `.lenis.lenis-stopped{overflow:hidden}`, `.lenis-smooth{scrollbar-width:none}`, `html{scroll-behavior:unset; overscroll-behavior-y:none}`.
- Programmatic jumps: `lenis.scrollTo(0,{force:true,duration:.15,easing:t=>t/2})` (Uncommon, to snap before a video takeover) or `{immediate:true}` on route change.
- Smoothing itself: Lenis defaults (`lerp:.1`, `wheelMultiplier:1`; Uncommon bundles v1.3.17, drives it from its own rAF with `autoRaf:false`). **I found no explicit lerp/duration override in either bundle** — "weighted" feel = default lerp .1 + long eases below. Don't claim more.

## Entrance primitives (all wait for the `play` gate)
```js
const delayFor = el => el.getBoundingClientRect().top + scrollY > innerHeight ? delayTrigger : delayEnter; // 'kin sj(): below fold = no extra delay when scrolled in
ScrollTrigger.create({ trigger: el, once: true, start: `top+=${pct}% bottom`, onEnter: play });
// pct = clamp(map(elHeight/innerHeight, 0..100 → 30..0), 0, 30) if el starts below the fold (taller = triggers earlier); IntersectionObserver {threshold: pct/100} variant for horizontal/odd cases
// already in viewport at gate-open → play immediately
```
- Text: SplitType `lines,words`, words `y:100%` inside overflow-hidden lines → `y:0%`. 'kin: **1.2s `power3.out`, line delay = baseDelay + i/10**. Uncommon headings: **1.6s power3.out, stagger .015** per word; SVG logo letters `fromTo y:150%→0, stagger .025, 1.2s power3.out`.
- Fade-translate blocks: `opacity 0→1` (+ optional `x/y` from ±100%), **.8s `power3.out`**.
- Image: wrapper `overflow:hidden`, image `scale:1.2→1`, **.6s `power3.out`** (hover: `scale 1.2` over 1.2s in, `1` over .6s out).
- Hairline rules: `width 0→100%`, **1.2s `power3.inOut`**.
- Menu items / labels: `yPercent 110→0` `.8s power3.out`; outgoing `-110`.

## Rules
- One `play` flag gates everything; reset it on `animationIn` so nothing animates under the cover.
- Prefer opacity/clip covers over slides; the page being replaced should never visibly "go somewhere".
- Total cover time ≈ 1.2–1.6s round trip; entrances start ≤100ms after the cover finishes.
- Reduced motion (neither site implements it — add): `matchMedia('(prefers-reduced-motion: reduce)')` → cover becomes a 150ms opacity fade, no glyph/iris, set entrances to final state, `lenis` off (native scroll).
- Keep focus management: move focus to `<main>` after route change; announce title via `aria-live` — neither site does.
- Pair with `masked-text-reveal` (same word-mask idea, vanilla) and `cinematic-loader` for first-load.
