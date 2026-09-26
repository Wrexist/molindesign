# Putting it on the page

## Contents
- Anatomy of a stage (layers mode)
- Install once per project
- Plain HTML, React, Vue/Svelte/Astro
- Motions, idles and timing
- Choreographing several objects
- Sizing and responsive layout
- Performance
- Accessibility and reduced motion
- Loading screens and hero hand-offs
- Stills, icons and sequences on a page
- Turntables and live 3D
- Pitfalls that have bitten before

## Anatomy of a stage (layers mode)

```html
<div class="w3d" data-play="view" style="--w3d-ar:760/350; width:min(320px,100%)" aria-hidden="true">
  <div class="w3d-item" data-layer="plate0" data-motion="drop" style="--delay:0ms">
    <img class="w3d-shadow" src="/assets/plates/plate0-shadow.webp" width="747" height="223" style="--l:0.921%;--t:34.571%;--w:98.289%;--ox:49.71%;--oy:44.2%" alt="" loading="lazy" decoding="async">
    <img class="w3d-obj" src="/assets/plates/plate0.webp" width="677" height="251" style="--l:5.263%;--t:21.429%;--w:89.079%;--ox:49.98%;--oy:100%" alt="" loading="lazy" decoding="async">
  </div>
  <!-- one .w3d-item per layer, in paint order (back to front) -->
</div>
```
- `.w3d` is the frame: give it a **width**; `aspect-ratio` from `--w3d-ar` gives the height. Everything inside
  is positioned in % of the frame, so it scales as one image.
- Each item paints its shadow, then its object. Items are in paint order; do not reorder them in the DOM.
- `--ox/--oy` put the transform origin where the object touches the floor, so squash and scale look physical.
- `snippet.html` in the preview folder has this markup filled in; `meta.json` has the same data for components.

## Install once per project

Copy `assets/w3d.css` and `assets/w3d.js` from the skill into the project (e.g. `public/w3d/` or `src/w3d/`).
w3d.js is a classic script with no dependencies, so it works in every setup, even when the page is opened
from `file://`.
```html
<link rel="stylesheet" href="/w3d/w3d.css">
<script src="/w3d/w3d.js" defer data-auto></script>   <!-- binds every .w3d stage and .w3d-spin player -->
```
Bundlers and frameworks: `import './w3d/w3d.css'; import './w3d/w3d.js';` (a side-effect import that defines
`window.w3d`), then `window.w3d.init()` once, or `window.w3d.bind(el)` per stage. The API is `init(root)`,
`bind(el)` (returns a cleanup), `play(el)`, `reset(el)` and `spin(el)`.
Optional, prevents a one-frame flash of the final state above the fold:
`<script>document.documentElement.classList.add('w3d-js')</script>` in `<head>`.

## Plain HTML, React, Vue/Svelte/Astro

- **HTML / Astro / server templates**: paste `snippet.html`, fix the `src` prefix if `--base` guessed wrong.
- **React / Next / Vite**: copy `assets/W3D.jsx` next to `w3d.js`, then
  ```jsx
  import meta from '../public/assets/plates/meta.json';
  <W3D meta={meta} base="/assets/plates/" style={{width: 'min(320px, 100%)'}} />
  ```
  Props: `play`, `motion`, `idle`, `stagger`, `className`, `style`. It binds itself (layout effect, before paint).
  In TypeScript projects rename to `.tsx` and type `meta` loosely (`any` or a small interface).
- **Vue / Svelte**: render the snippet markup (or loop over `meta.layers` like W3D.jsx) and call
  `window.w3d.bind(el)` in `onMounted` / `onMount`; call the returned cleanup on unmount.

## Motions, idles and timing

| motion | feel | default `--dur` | knobs |
|---|---|---|---|
| `drop` | heavy thing lands: falls, squashes, small rebound; shadow appears on impact | 820 ms | `--drop` (40cqw), `--squash` (.07) |
| `bounce` | ball: three decaying bounces, squash and stretch; shadow grows as it falls | 1250 ms | `--drop`, `--squash` (.075) |
| `pop` | grows out of its footprint with a soft overshoot | 640 ms | — |
| `rise` | quiet editorial fade up | 780 ms | `--rise` (5cqw) |
| `snap` | elastic stretch and spring back (bands, straps, cables) | 900 ms | — |
| `roll` | rolls in from the left and rocks to a stop | 1150 ms | `--roll` (46cqw), `--turn` (1turn) |
| `fade` | opacity only | 520 ms | — |
| `none` | static | — | — |

| idle | loop | default `--idle-dur` | knobs |
|---|---|---|---|
| `hop` | small hop with squash, then rest (balls) | 2600 ms | `--hop` (6% of its height) |
| `float` | slow hover with the shadow breathing (floating logos, devices) | 5200 ms | `--float` (2.4cqw) |
| `sway` | gentle rock around the base (bottles, plants) | 4200 ms | `--sway` (1.4deg) |
| `breathe` | tiny elastic pulse (bands) | 2600 ms | — |

Set them per item (`data-motion`, `data-idle`, `style="--dur:700ms;--squash:.03"`) or in the scene (layer
`motion`, `idle`, `style`) so the snippet carries them. Idles start `--idle-wait` (450 ms) after the entrance.

Pick motion from the material: iron and rubber `drop` with a small squash; balls `bounce`; ceramics and glass
`drop` with `--squash:.02` or `rise`; bands `snap`; logos `pop` then `float`; devices `rise` then `float`.

## Choreographing several objects

- Stagger 250–500 ms, in the order a person would place them (the base first, then what goes on it).
- One heavy landing at a time; overlapping impacts read as a crash.
- The total should be under ~2 s before the page feels settled; idles only on one object, and subtle.
- Stacks: each item lands exactly where it rests; the drop distance is the same for all (`cqw` units do that).

Preview it before shipping — frames are exact and repeatable:
```bash
node scripts/preview.mjs public/assets/plates/meta.json --out plates.motion.png --bg '#f4f5f0'
```
Read the sheet: shadows must not show under an object that is still in the air, the last frame must match
beauty.png, and nothing should pop at the end of an entrance.

## Sizing and responsive layout

- Frame width `W` px renders sharp up to about `W/2` CSS px on 2× screens. Render 2× the largest size you use.
- Size with `width: min(320px, 100%)` or grid columns; the height follows. Distances in keyframes use `cqw`
  (the stage is a size container), so the choreography scales with it.
- Let the stage overlap neighbouring elements (negative margins, `position: absolute`): an object that sits on
  the edge of a card or breaks out of a photo feels part of the page. `pointer-events: none` is already set.
- On phones decorative stages usually shrink (60–70%) or move above the text; hide only if they crowd content.

## Performance

- Sprites are WebP, typically 10–40 kB each; a three-object stage is ~100 kB. Shadows are black+alpha and small.
- Everything animates `transform` and `opacity` only (compositor, 60 fps on phones). Do not add `filter` or
  `box-shadow` animations to the images.
- `loading="lazy"` for below the fold; for the hero or a loading screen use `loading="eager"` and
  `fetchpriority="high"` on the largest object, and preload it (`<link rel="preload" as="image">`).
- w3d.js waits (max 1.5 s) for the images to decode before an entrance starts, so it never plays with holes.

## Accessibility and reduced motion

- Decorative stages are `aria-hidden="true"` with empty `alt`. If an object carries meaning (a product), give
  the stage `role="img"` and an `aria-label`, and drop `aria-hidden`.
- With `prefers-reduced-motion: reduce` everything shows at rest immediately and idles never run; this is
  built into w3d.css/w3d.js. Keep it that way.
- Without JavaScript the stage shows at rest (the failsafe also reveals it after 3 s if the script never loads).

## Loading screens and hero hand-offs

A loading screen must paint before the app bundle: inline its CSS in `index.html`, put the stage markup in
the HTML (eager images, preloaded), and play it with a class toggled by a tiny inline script. Keep the entrance
short (≤ 1.2 s), loop an idle while waiting, and when the app is ready either fade the loader out or fly the
stage into the same object in the hero (measure both rects, animate `transform` with WAAPI, then cross-fade).
Freeze idles at rest before leaving (`animation: none` via a class) instead of swapping animation names, which
restarts them.

## Stills, icons and sequences on a page

Every mode writes a `snippet.html` in its preview folder with the exact markup. The essentials:
- **Stills**: a plain `<img>` with `width`/`height` (no layout shift), `alt=""` when decorative, a real
  description when it shows the product. Hero images above the fold: `loading="eager" fetchpriority="high"`.
  For art direction at several sizes render twice (`--size 1600x900` and `--size 800x1000`) and use `<picture>`
  with media queries.
- **Open Graph / social cards**: render exactly `1200x630` as PNG or JPEG (`formats: ['png']`; some scrapers
  ignore WebP) and reference it with absolute URLs:
  `<meta property="og:image" content="https://example.com/og.png">` plus `og:image:width` and `og:image:height`.
- **Icons**: `<img src="/icons/sync.webp" width="512" height="512" alt="" style="width: 64px; height: auto">`. The
  set is square and consistent, so it drops into any grid. Render at 4–8× the display size.
- **Sequences**: animated WebP as an `<img>` (alpha, autoplay), WebM/MP4 as `<video autoplay muted loop
  playsinline>`, or frames in the `w3d-spin` player. Reduced motion and posters: animation.md.

## Turntables and live 3D

- `--turntable 36` renders frames with the objects turning under fixed light. Show them with the drag-to-turn
  player:
  ```html
  <div class="w3d-spin" data-src="/assets/mug/frames/{i}.webp" data-frames="36" data-pad="3" data-auto="8" style="--w3d-ar:900/600; width:min(420px,100%)" role="img" aria-label="Stoneware mug"></div>
  ```
  `data-auto` turns it by itself until touched (never with reduced motion), and `data-scrub` ties it to scroll.
  36 frames × ~30 kB ≈ 1 MB, so load it only where rotation is the point (product pages).
- For visitor-controlled 3D (orbit, zoom, AR), export `--export glb,usdz` and use `<model-viewer>` or
  `w3d-viewer`: references/live-3d.md. For decoration, sprites are lighter, sharper and animate better.

## Pitfalls that have bitten before

- **`translate()` percentages are relative to the element's own box.** A drop of `-60%` makes a thin plate
  fall less far than a tall one; use `cqw` (container) or px. The kit's keyframes already do.
- **Changing `animation-name` restarts the animation.** To stop an idle, freeze with a class that sets
  `animation: none` and the rest pose, not by swapping in another animation.
- **CSS animations override static styles**, including `opacity` on the same element. Fade out with the Web
  Animations API (`el.animate(...)`) or on a wrapper.
- **Global image rules leak in.** Resets like `img {height: 100%}` or `img {max-width: 100%}` distort the layers.
  The kit resets the important properties on `.w3d .w3d-item > img`; watch for `!important` rules.
- **Hover transforms on ancestors or `img` selectors** (`.card:hover img {transform: scale(1.05)}`) hit the layers
  too and break the stage. Scope them to the photo they were meant for.
- **Shadows showing in mid-air** mean the shadow keyframes run ahead of the object: keep them tied to the
  impact moment (the kit's `drop` fades them in from 46% to 51%).
- **Decorative images need `alt=""`**, not the file name, or screen readers read out "plate0 dot webp".
