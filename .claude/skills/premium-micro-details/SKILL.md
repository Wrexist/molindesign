---
name: premium-micro-details
description: Checklist of small craft details that make a site feel premium and accessible — easing tokens, hover/focus micro-interactions, tap-target rules, reduced-motion handling, inert/aria patterns, ping dots, scroll-hint line, text legibility over imagery, font fallback metrics, error copy, PWA/OG metadata. Use as a final polish pass on ANY website, not only 3D. Collected from amv.tarunvishwakarma.dev.
---

# Premium micro-details checklist

## Motion
- [ ] One default ease for entrances: `cubic-bezier(.23,1,.32,1)`; in/out for drawn paths `cubic-bezier(.77,0,.175,1)`; drawers `cubic-bezier(.32,.72,0,1)`.
- [ ] Enter 0.6–1.1 s, **exit 0.2–0.35 s** (leave fast). Stagger 40–90 ms.
- [ ] Animate only `transform`, `opacity`, `filter`, `clip-path`/`stroke-dashoffset`.
- [ ] Press feedback: `active:scale-[.97]` on buttons; `whileTap scale .95` on big hotspots.
- [ ] Arrow glyphs nudge on hover: `→` `translate-x-1`, `←` `-translate-x-1`, `↗` `-translate-y-.5 translate-x-.5` (300 ms, ease-out-quint). Cheap, delightful.
- [ ] Underline-grow link: 1 px bar, `origin-left scale-x-0 → 100` on hover **and** focus-visible.
- [ ] Ping dot for "look here": `animate-ping` ring + glowing core, `[animation-duration:2.2s]`, `motion-reduce:hidden`.
- [ ] Scroll hint: 36 px hairline with a sliding 12 px bright segment (static under reduced motion).
- [ ] Spring (not tween) for numeric UI: digit columns `stiffness 260, damping 30, mass .6`.
- [ ] Frame-rate-independent smoothing: `k = 1 − exp(−λ·dt)`, clamp dt ≤ 50 ms.

## Reduced motion (`prefers-reduced-motion: reduce`)
Replace slides with opacity fades, skip fly-through/parallax/ping, disable custom cursor, keep information identical. In Motion: `<MotionConfig reducedMotion="user">` + `useReducedMotion()` for per-component branches.

## Accessibility
- [ ] Canvas gets `role="img"` + descriptive `aria-label`; the real content lives in DOM (drawer/spec).
- [ ] Toggle buttons use `aria-pressed`; menus `aria-expanded/controls`; dialogs `role="dialog" aria-modal`; tabs full ARIA + arrow keys; progress `role="progressbar"` with `aria-valuenow`; sliders `role="slider"` + arrow keys.
- [ ] `inert` on mounted-but-hidden UI layers (not just `pointer-events-none`).
- [ ] `aria-live="polite"` on labels that change (colorway name, beat captions).
- [ ] Esc exits every mode/overlay and a visible `Esc` kbd hint is shown.
- [ ] Hit targets ≥ 44 px on coarse pointers: `pointer-coarse:py-3.5`, `pointer-coarse:h-11 w-11`; use `-my-2 py-2` to enlarge hit area without moving layout.
- [ ] `-webkit-tap-highlight-color: transparent`; `select-none` on the stage; `::selection { background:#f9731666; color:#fff }`.

## Legibility over imagery
- Text-shadow instead of boxes: `0 1px 14px rgb(0 0 0/.8)` (small), `0 2px 24px rgb(0 0 0/.55)` (display).
- Vignette gradient overlay (see `hud-cinematic-ui`).
- `text-balance` on multi-line captions.

## Fonts
Variable fonts with width axis (Archivo 62–125 %), `font-display: swap`, subset via `unicode-range`, metric-matched fallback (`size-adjust`, `ascent/descent-override`). Preload only the Latin subset. Tabular numerics for any changing number.

## Copy & content
- Short declarative lines + one italic phrase; spec data as dry facts; trivia "beats" with a vivid comparison.
- Numbering/edition framing (`Nº 01 / 24`), place-setting (`Bay 07, lower level`), credit line ("Designed and built by …"), making-of images.
- Error copy that tells the next step (WebGL, network).
- Disclaimer when brand-adjacent: "An independent concept, not affiliated with or endorsed by …".

## Metadata & sharing
`<title>` "Thing in 3D | Author"; descriptive meta description; `og:*` + `twitter:*` with 1200×630 image + alt; `theme-color`, `color-scheme`; `manifest.webmanifest` (`display: fullscreen`, 192/512 icons); apple-icon; SVG favicon; `format-detection` off; `robots` with `max-image-preview:large`; canonical URL. In this repo remember demos use `noindex, nofollow` until customer approval (see README).

## Touch/mobile
Alternate hint copy via `@media (hover:none)`; `navigator.vibrate?.()` haptic ticks on key thresholds (always optional-chained); `100dvh`-safe fixed layouts; move CTAs bottom-center (`bottom-32`) and stack credits away on small screens.
