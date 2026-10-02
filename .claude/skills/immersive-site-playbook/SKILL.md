---
name: immersive-site-playbook
description: Master playbook for building a cinematic, "one-take" interactive website (hero 3D / scroll-driven story / premium UI chrome), distilled from amv.tarunvishwakarma.dev (Aston Martin Vulcan 3D). Use at the START of any website where the brief says premium, immersive, cinematic, 3D, product reveal, portfolio showpiece, or "wow" — it decides structure, stack, and which sibling skills to apply.
---

# Immersive site playbook (source: amv.tarunvishwakarma.dev)

The reference site is a single fixed full-screen `<canvas>` (three.js) with **all UI as HTML overlays**. There is no page scroll — wheel/touch input *scrubs a timeline*. The result feels like a film you play, not a page you read. Study it as a system, not a pile of effects.

## Architecture (copy this shape)

```
<main class="fixed inset-0 overflow-hidden bg-black select-none">
  <canvas role="img" aria-label="…rendered live in 3D">      ← the "film"
  <div vignette gradient overlay pointer-events-none>         ← radial + top/bottom linear
  loader (SVG+canvas, z-top until ready)                      → skill: cinematic-loader
  corner-bracket frame, top nav, sound toggle                 → skill: hud-cinematic-ui, web-audio-soundscape
  per-chapter copy (masked line reveals)                      → skill: masked-text-reveal
  hotspot pins that follow 3D anchors                         → skill: hotspot-callout-pins
  chapter menu + progress rail + camera telemetry             → skill: scroll-driven-chapters
  drag-to-reveal orbit slider (the first interaction)         → skill: orbit-drag-reveal
  drawer (Specification / About)                              → skill: slide-over-drawer
  custom reticle cursor (fine pointers only)                  → skill: reticle-cursor
</main>
```

Key decisions the site makes:
1. **Engine and UI are decoupled by callbacks.** The 3D module is lazy-loaded (`import()` after first paint) and exposes `start(canvas, hud, onProgress, signal, callbacks, anchors)` returning `{ scrub, release, commit, jump, explore, spec, lock, glass, anchor, dispose }`. The UI never touches three.js objects; the engine reports `onChapter / onBeat / onLabel / onCue / onEnd / onIdle`. 3D → DOM positions flow through `anchors` refs (engine writes `transform` on pinned elements each frame).
2. **Bake, don't compute.** Model, lighting, camera moves and animation are authored in Blender; light is *baked in Cycles*; the browser only plays the take. This is why it looks cinematic at 60 fps on laptops. See "Blender pipeline" below.
3. **One scroll-scrubbed timeline** with named scenes (`SCENES = [[name, startTime], …]`, `END`). Chapter UI, rail ticks, copy beats and audio cues are all derived from the same table.
4. **State machine for the intro**: `loading → ready → (drag commit) → playing → done`, plus overlay states `hold | reveal | gate | in | wait | rise | finale`. Gate every overlay on these (`on={state === …}`) so nothing overlaps.
5. **Copy is part of the design**: short declarative lines, one italic emphasis phrase ("Nothing on it *is there for show.*"), facts as dry spec rows, a poetic sign-off. Numbered framing `[ Nº 01 / 24 ]`, `Bay 07, lower level`.
6. **Honest provenance**: footer/About says "independent fan project, not affiliated with…". Always do this for brand-adjacent work.

## Stack the reference uses
- Next.js (App Router, Turbopack), React, Tailwind v4, **Motion (framer-motion) for DOM**, **GSAP for the loader timeline + counter tween**, three.js for 3D, Web Audio API for sound, WAAPI for small SVG pulses. Fonts: **Archivo** (variable, width axis 62–125%) + **Geist Mono**, via `next/font` (auto size-adjust fallback).
- For this repo's plain static sites (GitHub Pages, no build): the same ideas work with vanilla JS + CSS + WAAPI + optional GSAP from a CDN; keep relative asset paths.

## Design tokens (steal verbatim)
```css
:root { --background:#0a0a0a; --foreground:#ededed; }
/* accent: Tailwind orange-500 #f97316; selection: #f9731666; theme-color #000; color-scheme: dark */
--ease-out-quint: cubic-bezier(0.23, 1, 0.32, 1);   /* default for EVERYTHING entering */
--ease-in-out:    cubic-bezier(0.77, 0, 0.175, 1);  /* path-draw / big moves */
--ease-drawer:    cubic-bezier(0.32, 0.72, 0, 1);   /* side drawer */
```
Palette discipline: pure black stage, white at opacity steps (`/85 /70 /60 /45 /40 /35 /15 /10`), **one** accent (orange) used only for: the active index, hairlines, pings, glow dots, link arrows. Hierarchy comes from opacity, not extra colors.

## Blender → web pipeline (from the site's About text)
Model/light/animate in Blender → bake lighting in Cycles → export (glTF) with baked textures → play in three.js driven by a single normalized time `t`. Scrub with damping (target `t` set by wheel/touch, rendered `t` eased toward it). Ship a "solid view" making-of figure in About (two `aspect-video` webp captions: "The bay, in Blender") — it doubles as proof of craft.

## Performance & resilience checklist
- Lazy-load the engine; the loader paints first (SVG + 2D canvas, zero 3D dependency).
- Cap DPR at 2 (`Math.min(devicePixelRatio, 2)`) for the 2D canvas; do the same for the WebGL renderer.
- Preload only the fonts/first audio needed; decode audio lazily on first "Sound on" click (autoplay policy).
- Friendly failure copy: WebGL missing → "This needs WebGL 2. Open it in a recent Chrome, Safari, Edge or Firefox"; fetch failure → "It didn't finish loading. Check the connection and reload". Shown inside the loader with `role="alert"`.
- `?speed=` query param to slow/speed the loader, `?f` to hold the final frame for screenshots (handy for OG image capture).
- Honour `prefers-reduced-motion` everywhere (see each sibling skill's fallback).
- `inert` on hidden-but-mounted UI; `aria-live="polite"` for changing labels; `aria-pressed` on toggles.

## SEO / sharing (do all of these)
`<title>`: "<Product> in 3D | <Author>". Rich `description` (verbs: uncover, drive, ride). `og:image` 1200×630 + `twitter:card=summary_large_image`, descriptive `og:image:alt`, `theme-color:#000`, `color-scheme:dark`, `manifest.webmanifest` (`display:fullscreen`, 192/512 icons, black bg), `apple-icon`, SVG `icon`, keyword list, `robots` with `max-image-preview:large`. Add `format-detection` off.

## Which sibling skills to load
| Need | Skill |
|---|---|
| Branded loading screen | `cinematic-loader` |
| Headline/line animation | `masked-text-reveal` |
| Camera-style HUD, brackets, labels, type | `hud-cinematic-ui` |
| Custom cursor | `reticle-cursor` |
| First-interaction reveal gesture | `orbit-drag-reveal` |
| Scrubbed story + chapter nav + telemetry | `scroll-driven-chapters` |
| Callouts attached to 3D points | `hotspot-callout-pins` |
| Side panel with tabs | `slide-over-drawer` |
| Sound design | `web-audio-soundscape` |
| Small polish details & a11y | `premium-micro-details` |

Always finish by checking: mobile (`pointer: coarse`, 44 px hit areas), reduced-motion, keyboard (Esc closes, arrows on sliders/tabs), no overlapping overlays at any state.
