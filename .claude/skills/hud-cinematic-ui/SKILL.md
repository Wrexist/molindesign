---
name: hud-cinematic-ui
description: Camera-viewfinder / HUD interface language for dark premium sites — corner-bracket frame, wide-stretch uppercase labels, mono/tabular numerics, hairline spec tables, vignette overlay, single orange accent, numbered "[ Nº 01 / 24 ]" framing. Use when designing UI chrome that must float over 3D or full-bleed imagery. From amv.tarunvishwakarma.dev.
---

# HUD / viewfinder UI language

## Typography
- **Archivo** variable (`wght 100–900`, `wdth 62–125`). Two roles:
  - `.display { font-family: Archivo; font-stretch: 125%; }` — headlines, wide and calm (weights 300 for caps titles, 400 for sentences).
  - `.label { font-family: Archivo; letter-spacing: .2em; text-transform: uppercase; font-variant-numeric: tabular-nums; font-size: 10.5px; font-weight: 500; font-stretch: 112.5%; }` — **every** piece of UI chrome (nav, buttons, captions, spec keys). One class, applied everywhere = instant system.
- **Geist Mono** only for debug/telemetry. Body copy 14–16 px, `leading-[1.6]`, `text-white/75`.
- Brand wordmark in nav: `12px, font-medium, tracking-[.32em], white` ("ASTON MARTIN").
- Load with `font-display: swap` and an `size-adjust` fallback (next/font does it) to avoid layout shift.

## Layout grid
- Everything `position: fixed` to the viewport edges: gutters `left/right 1.5rem (mobile) → 3rem (md)`, top `1.5rem → 2.25rem`, bottom bar `1.25rem → 1.75rem`.
- Eyebrow + title block at `top: 16–18vh; left: gutter`. Spec table right-aligned at `top: 27vh; right: 3.5rem` (lg+), collapses inline on mobile (`flex-wrap gap-x-5`).
- Bottom-left: provenance ("Location / Bay 07, lower level", "Designed and built by / Name"). Bottom-right: next action. Bottom-center: scroll hint.

## Frame & chrome
```html
<div class="fixed inset-4 hidden md:block pointer-events-none">  <!-- fades 0→1, scale 1.015→1, 1.4s -->
  <span class="absolute h-5 w-5 top-0 left-0 border-t border-l border-white/40"></span> … ×4 corners
</div>
```
- Vignette overlay: `radial-gradient(130% 105% at 50% 44%, transparent 42%, rgb(0 0 0/.5) 74%, rgb(0 0 0/.9) 100%), linear-gradient(to bottom, rgb(0 0 0/.4), transparent 20%, transparent 82%, rgb(0 0 0/.45))` — keeps text legible without boxes.
- Frosted surfaces only for panels/menus: `bg-black/55–60 backdrop-blur-2xl border border-white/10 rounded-2xl`.

## Spec rows (hairline table)
```html
<dl><div class="flex items-baseline justify-between gap-6 border-t border-white/10 py-4 last:border-b">
  <dt class="label text-white/45">Engine</dt><dd class="text-[14px] text-white/90 text-right">7.0-litre naturally aspirated V12</dd></div></dl>
```
Inline variant (over 3D): `<p class="label flex justify-end gap-6 py-1.5"><span class="text-white/40">Output</span><span class="min-w-[96px] text-right text-white/85">820 hp</span></p>` inside a `border-r border-white/20 pr-5` column — a right-side vertical rule.

## Accent usage (orange #f97316 only)
Active index digits, short `h-px w-8` eyebrow rule, hotspot dot (+ `shadow-[0_0_12px_rgb(249_115_22/.7)]`), `↗ →` arrows, drawer tab underline, focus/hover micro-states, sound bars. Selection color `#f9731666`.

## Numbered framing
`[ Nº 01 / 24 ]` (index of an edition: "24 built") in orange + `<h1>` product name at `text-white/70`. Chapter indicator `01 / 06`. Camera telemetry `35 mm · f/2.8 · Focus 4.2 m`, scene readouts `Speed 120 km/h`. Real-feeling instrument data makes the HUD believable — drive it from actual engine values (see `scroll-driven-chapters`).

## Opacity ladder
`/90` primary, `/85` body, `/70` secondary, `/60` hints, `/45` keys/captions, `/40` footnotes, `/35` disabled/separators, `/15` rails, `/10` hairlines.

## Mobile
Hide right spec column & bottom-left credits (`hidden md:block`), move CTA to bottom-center, hamburger = two 1-px lines (`w-6 gap-[5px]`) in a 44 px circle, `pointer-coarse:py-3.5` on text buttons.
