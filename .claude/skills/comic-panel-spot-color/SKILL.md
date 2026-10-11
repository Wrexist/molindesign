---
name: comic-panel-spot-color
description: Art-direction recipe for a graphic-novel feel on a dark site — charcoal ground, black-and-white hatched illustration with one saturated spot colour (blood red) plus a muted gold, uppercase display type, hard-edged "floating frames" (comic panels) that open onto scenes, white disc cursor, red hover accents. Use for spirits/fashion/film/editorial brands wanting illustrated storytelling. From santionispirits.com (palette, type, UI numbers verified in CSS/bundle; panel implementation partly inferred).
---

# Comic panel + spot colour

## Palette (verified)
```css
:root{
  --ground:#1d1d1d;        /* body / loader */
  --ink:#121212;           /* near-black for text on paper, outlines */
  --paper:#ffffff;
  --spot:#c82924;          /* UI hover/focus + accents (links, buttons, header labels) */
  --spot-art:#be261e;      /* in-illustration red (shader uniform; #bc251c in another scene) */
  --gold:#b0976a;          /* secondary spot, used sparingly in art */
  --stone:#7f7261;         /* muted scene tint */
}
```
Rule: art is **monochrome + exactly one red + at most one muted gold**. UI uses the same red only on hover/focus (`transition: color .1s`), never as a large fill except in the illustration.

## Type (verified)
- Display: `Charles Rosie` (condensed hand-lettered), **uppercase**, `letter-spacing:.005em`, `line-height:1.2`; sizes fluid and huge: H1 `217px` desktop (`70px` mobile, `calc(38.89vw − 81.67px)` between 390–768), H2 `200px`, H3 `82px`. Body-bold: `PP Nikkei Maru Ultrabold` 15 px uppercase; body-regular: `GT Era Text Light` 15 px / 1.5. Use `font-display:swap` and `text-wrap:balance`.
- Headings carry the page; copy lines are short, narrated in the third person, caps ("THE SAINT DRINKS — AND IN AN INSTANT, A BEAM OF LIGHT ENGULFS HIM"). Mirror this as a comic caption box.

## Panels ("floating frames")
Verified: each scene defines a frame by **four projected corner points + a centre** (`uPoint1..4`, `uCenter`) fed to a frame shader, with per-scene state `frameWidth .63–.9`, `frameHeight .25–.35` (viewport-relative; narrower on mobile: `.45 x .25`), `framePad .3–.5`, h/v alignment (`right/bottom`), plus a `tLines` hatch texture (line tile `.8–4.5`), a perlin noise texture and a light direction for cross-hatch shading. Outline layers are rendered as an *inverse* shader with `uLineWidth` `.0005–.009` (thin on small props, thick on structures). Scene content is clipped to the frame; characters can break out of it ("eyes" panel at `1.8 x .65`).
CSS approximation (inference — the original is WebGL):
```css
.panel{position:absolute;inset:var(--pad,8vh) var(--padx,8vw);
  clip-path:polygon(var(--x1) var(--y1),var(--x2) var(--y2),var(--x3) var(--y3),var(--x4) var(--y4));
  background:var(--ground);outline:3px solid var(--paper);transition:clip-path .8s cubic-bezier(.7,0,.2,1)}
```
Animate the four points between scenes (a panel "re-cuts" like a page turn); keep slight skew (≤ 4°) so frames feel hand-cut. Respect `prefers-reduced-motion`: swap frames instantly.

## UI chrome (verified)
- Cursor/disc: 120 px white circle, `3px solid #000`, uppercase label 16 px; see `hold-to-advance` (sustain-hold) for behaviour. Cursor text states: "Hold", "Hold & Pour", "Hold & Move".
- Buttons: `96×48`, `3px solid #fff`, transparent; hover/`:focus-visible` → text + border `--spot` in `.1s`. Hover styles only under `(hover:hover) and (pointer:fine)`.
- Links underline: two 1 px pseudo-lines wipe (`scaleX` out right / in left, `.3s`, `.1s` delay).
- Header: floating white pill (top/right ≈ 24 px, 40 px high) with `3px` stroke SVG background; labels 15 px at `.5` opacity → `1` when active.
- Audio toggle: 4 animated bars, `mix-blend-mode:difference`, fixed bottom-right (`1.5rem`).
- Age gate: huge headline split top/bottom with `clip-path:inset(0)` and two bordered choice buttons — appropriate for alcohol brands; add real legal logic server-side.
- Footer text white on ground, 12 px links.

## Rules
- Contrast: white on `#1d1d1d` passes; `#c82924` on `#1d1d1d` is only ≈ 3:1 — use it for ≥ 24 px text or non-text accents, not body copy.
- Illustration pipeline: ink linework + hatch/halftone in B&W, then colour **one** object per scene (the bottle, the beam, the cloak) so the eye lands there.
- Provide the story text as real DOM (Santioni mirrors canvas text in a hidden `GLA11y` layer); no reduced-motion handling was found on the site, so add it.
- Don't add a second spot colour; don't use gradients in the art; don't let panels cover the nav.
