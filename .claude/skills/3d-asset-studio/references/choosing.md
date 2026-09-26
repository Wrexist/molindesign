# Choosing: from a request to a plan

## Contents
- Reading the request
- Output: which mode
- Style: which look
- Source: library, code, import or generated
- Size, format and weight
- Example plans
- When not to use 3D at all

## Reading the request

People rarely say "mode: layers, look: clay". They say *"some 3D stuff next to the heading"*, *"a 3D version of
our logo"*, *"icons like Apple's"*, *"can it spin?"*. Read three things from the words and the project:

1. **Where it will live.** A web page (which section, how big, what colour behind it?), a social card, an app
   store image, a slide, a print or an AR experience. Look at the project: the CSS colours, the fonts, the
   layout slot, other images (their style is the style to match).
2. **What it must do.** Sit there, enter with motion, loop, turn under the visitor's finger, be printed or
   placed in a room.
3. **What it must look like.** Photographic, or illustration-like (clay, toon, low-poly)? Matching an existing
   set? Brand colours?

If the user shows a reference image, match its lighting direction, camera height, shadow softness and
saturation. Those four carry most of a style.

## Output: which mode

| signals in the request | mode | notes |
|---|---|---|
| "on the site", "next to the heading", "animate when you scroll", "drop in", "stack", loading screen | `layers` | the default for web decoration; each object and its shadow is a sprite that CSS animates |
| "hero image", "banner", "OG image", "product shot", "for Instagram", "wallpaper", "slide" | `still` | set `size` (1200×630 OG, 1080×1350 portrait post, 1920×1080 slide) and a `backdrop` |
| "icons", "set of illustrations", "category images", "feature icons" | `icons` | one scene, one object per layer; `icons.uniform: true` keeps relative sizes |
| "spinning", "turntable", "360", "loop", "GIF", "video", "animated" | `sequence` | `--turntable N` or an `animate(t)` function; ship animated WebP (with alpha) or WebM/MP4 |
| "GLB", "for AR", "for Blender", "3D file", "print it", "STL" | `none` + `--export` | or add `--export` to any render |
| "let people rotate it", "configurator", "view in your room" | live | GLB + poster; `<model-viewer>` (AR) or `w3d-viewer` (references/live-3d.md) |

Several at once is common. A product page might get a sprite stage for the page, a still for the social card,
a GLB/USDZ pair for AR, and a turntable for the gallery, all from one scene file.

**Sprites or a video for motion?** Sprites plus CSS (layers) for entrances and gentle idles: tiny, sharp,
interactive with scroll, perfect loops. Video or animated WebP (sequence) when the object itself changes: a
turntable, a lid opening, liquid pouring, a camera move. Use live WebGL only when the visitor controls it.

## Style: which look

| the page / request feels | look + studio | backdrop |
|---|---|---|
| premium product, real-world, e-commerce | `photoreal` + `soft` / `bright` | transparent or a soft gradient |
| friendly SaaS, onboarding, "3D illustrations", playful | `clay` (+ `clay` studio) | pastel flat or radial gradient |
| architecture, concept, minimal, editorial | `mono` | warm white |
| comic, games, kids, bold brand | `toon` | flat brand colour |
| geometric, tech, retro-game, low-fi charm | `lowpoly` | gradient; `golden` light |
| technical, blueprint, documentation | `lineart` / `wireframe` | white or dark navy |
| dark, luxury, night, neon | `photoreal` + `dramatic` / `night`, emissive + bloom | dark gradient |
| glass, perfume, drinks, jewellery | `photoreal` + `glass` | the final background colour (glass needs it) |
| isometric UI illustrations | any look + `camera: {iso: true}` | flat |

Art direction for each (colour, light, camera, detail level): references/styles.md.

## Source: library, code, import or generated

Decide in this order:

1. **Is it in the library?** (`w3d/objects.js`: fitness, tableware, food, plants, books, packaging, gems,
   tech, puffy icons, blobs, rocks.) Use it, recolour it, pass options.
2. **Can it be built from a few shapes?** Most products can, in 20–80 lines: a bottle is one lathe, a phone is
   an extruded rounded rectangle, a chair is boxes plus tubes, a key is an extruded outline with a CSG hole. Model
   it at real size. This gives the best control and the cleanest result.
3. **Is there an existing model?** The user's own files (CAD exports, previous projects), or a free library
   (Poly Haven, Kenney, Quaternius, Sketchfab CC). Import it with `loadModel`, inspect it, rematerial it if
   needed. This is right for complex organic things (people, animals, detailed vehicles, furniture with
   upholstery) where code modeling would take hours and still look worse.
4. **Generate one?** Only when a generator tool is actually available and the user agrees to send their input
   to it. Expect to fix scale, orientation and materials.

Never promise a "3D model of this photo" from pixels alone. Model it from the photo's proportions instead, and
say so.

## Size, format and weight

| use | render width | format | typical weight |
|---|---|---|---|
| decorative sprites in a 320–400 px slot | 700–900 px frame | WebP sprites | 60–200 kB per stage |
| hero still, full width | 2400 px (or 1600 for half width) | WebP q 0.9; JPEG if the platform needs it | 80–250 kB |
| OG / social card | exactly 1200×630 (or the platform's size) | PNG or JPEG (many scrapers skip WebP) | 100–300 kB |
| icon set shown at 64–128 px | 256–512 px squares | WebP (PNG for design tools) | 5–30 kB each |
| turntable in a 400 px box | 800 px, 36–72 frames | animated WebP (alpha) or WebM | 0.5–3 MB |
| AR / live model | – | GLB (web) + USDZ (iOS) | 0.2–5 MB (compress: references/importing.md) |

Rule of thumb: render twice the largest CSS size for 2× screens, and never ship a 3 MB PNG where a 150 kB WebP
does.

## Example plans

- *"Add realistic 3D objects next to the hero heading of my yoga studio site: a rolled mat and cork blocks,
  with a nice little load animation. Classy, not gimmicky."*
  → layers · `yogaMat` + two `yogaBlock` (cork), stacked · soft studio, fill tinted to the page sand colour ·
  900 px frame for a ~420 px slot · `drop` staggered 350 ms, no idle · scene in `design/3d/`.
- *"Gör vår logga (logo.svg) till ett snyggt 3D-objekt i mässing som svävar ovanför en mjuk skugga."*
  → layers · `extrudeSVG` of the logo, bevel ~4% of the width · brass + `softbox` environment · hovering
  0.3 units up, `studio: 'top'` so the shadow sits right under it · `pop` then `float` idle · reply in Swedish.
- *"We need 8 feature icons in that soft 3D style everyone uses."*
  → icons · `clay` look, pastel palette from the brand · one object per feature (`puffy` shapes, simple
  props), the same camera (elevation ~25°, three-quarter), `icons.uniform: false`, 512 px squares, transparent.
- *"A spinning product shot for the landing page."*
  → sequence · `--turntable 60`, 30 fps, 800 px, soft studio · animated WebP (alpha) plus WebM, poster frame =
  frame 0 · loop.
- *"Can I see this chair in my room on my phone?"*
  → export GLB + USDZ at real size, poster still · `<model-viewer ar ios-src=…>` (references/live-3d.md).
- *"Make this STL look good for the Kickstarter page."*
  → `inspect.mjs part.stl` → `loadModel(url, {material: M.powderCoat(…), smooth: 30})` → still, 1600×1000,
  `dramatic` studio, dark gradient backdrop.
- *"Print a replacement knob."* Model it in mm with CSG (shaft hole, knurls), export STL, and state the wall
  thicknesses (at least 1.2 mm for FDM).

## When not to use 3D at all

Real product photos exist and are good: use them (a 3D render next to real photos looks fake). The brand is flat
and illustrative: a 3D object will clash unless the whole set changes. The slot is tiny (under ~48 px): a
drawn icon reads better. Say so, and offer the 3D version where it helps.
