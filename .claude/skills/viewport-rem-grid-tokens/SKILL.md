---
name: viewport-rem-grid-tokens
description: Design-token foundation used by two award-winning studio sites — viewport-scaled rem (design in px at 375/1440/1920, ship in rem so the layout scales like a poster), a 6/8/12-column CSS grid with a Shift+G debug overlay, four named easing tokens, restrained editorial type (grotesk + mono labels, tight negative tracking), and font-loading/perf basics. Use at project start for any editorial/motion site. From by-kin.com and uncommonstudio.com.au.
---

# Viewport-rem grid + tokens

## Scaling system (verified in both CSS bundles)
```css
html { font-size: 10px !important; }                       /* mobile: 1rem = 10px */
@media (min-width: 768px)  { html { font-size: 1.1111111111vw !important; } }  /* 768→ 8.53px … */
@media (min-width: 1200px) { html { font-size: 0.5208333333vw !important; } }  /* =10px at 1920 wide */
html { -webkit-font-smoothing: antialiased; scroll-behavior: unset !important; overscroll-behavior-y: none !important; }
```
- Rule: **everything is rem** (gaps `1.6rem`, section padding `8/12/20rem`, headings `4.8rem/6.24rem` …). Design the 1920 comp at 1px = 0.1rem; the whole page scales linearly between 1200 and any width. Mobile (<768) is a fixed 10px rem.
- Trade-off: pinch-zoom/browser text-size preferences don't scale text. Mitigate: keep body copy >= `1.4rem` at mobile, don't disable zoom (Uncommon sets `user-scalable=no` — don't copy that).
- Spacing tokens: `--gap-x: 1.6rem → 3.2rem (md) → 4rem (lg)`; container padding = `--gap-x`; section `--padding-tb: 8rem / 12rem / 20rem`.

## Grid
`.container{padding-inline:var(--gap-x)}`, `.grid{display:grid; column-gap:var(--gap-x)}` with **6 cols (xs) / 8 (sm) / 12 (lg)**; content uses `col-span-*`/`col-start-*` (e.g. footer links `col-span-3 col-start-3`). Debug overlay (Uncommon): `Shift+G` toggles `.grid-debug` (fixed, pointer-events none, column tints), persisted in `localStorage.isGrid`. Add it — alignment discipline is what makes "restrained" look expensive.

## Easing + motion tokens
```css
--easeInOutQuart: cubic-bezier(.76,0,.24,1);   /* movement of large things, covers, colour fades, 1–1.2s */
--easeOutQuart:   cubic-bezier(.165,.84,.44,1);/* hovers, opacity/transform entrances, .4–.8s */
--easeInOutCubic: cubic-bezier(.65,0,.35,1);
--easeInOutQuad:  cubic-bezier(.45,0,.55,1);
```
GSAP equivalents: `power3.out` (default entrance), `power3.inOut` (covers/wipes), `power4.inOut` (hero clip). Common CSS durations seen: `.4s` opacity, `.6s` transform/bg, `.8s` fade-translate, `1.2s` position/size/colour. Cursor followers use `gsap.quickTo(el,'x',{duration:.4–.6, ease:'power3'})`. Rule of thumb from both sites: **nothing is faster than .4s, big movements 1.2s, always ease-out or ease-in-out quart; no bounce/overshoot.**

## Type + colour (editorial restraint)
- 'kin: Apercu Pro (400/500/700 all mapped) + Apercu Mono Pro for labels (`--font-label`), line-height 100–130%, labels 1.4rem, display up to 6.4rem (32rem for giant numerals). Uncommon: Neue Montreal, tracking `-.1px … -.9px` on display, `+.5–.7px` on 12px caps labels.
- Palette is near-monochrome with ONE accent: 'kin `--dark:#111214`, `--silver:#f4f2ed`, `--gray:#999896`, `--red:#ff6542` (accent), tertiary `#8499ca`; Uncommon the same `--dark/--gray/--red` plus `--white`, `--be:#edeaed`. Surfaces swap `--primary-color/--color` between dark and silver per section (theme via CSS vars flipped by IntersectionObserver, not per-component classes).
- Fonts: `next/font` with `font-display:swap`, adjusted fallback (`size-adjust:103.05%; ascent-override:107.14%`), 3 critical woff2 `<link rel=preload>`.

## Perf practices observed
- Preload only the LCP image + critical fonts; load webpack runtime `fetchPriority=low`.
- Hide off-screen heavy layers (`display:none`/`visibility:hidden`) once scrolled past; `will-change` only on 2–13 transform targets.
- Cache hero/thumbnail images with the Cache API for instant shared-element transitions (see `gated-page-transitions`).
- `ScrollTrigger.config({ignoreMobileResize:true})` to stop URL-bar resize jank.

## Gaps to fix when borrowing
Neither site defines `prefers-reduced-motion`, focus-visible styling is not evident, and Uncommon disables zoom. Add: reduced-motion media query that sets durations to ~0 and disables Lenis; visible focus rings; allow zoom.
