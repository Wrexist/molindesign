# Styles, camera and composition

## Contents
- Matching a reference image
- Photoreal
- Clay and soft 3D illustration
- Mono (white model)
- Toon
- Low-poly
- Line art and wireframe
- Neon, glass and dark luxury
- Isometric
- Camera
- Composition
- Sets that match (icons, series, product lines)

A look (`look: 'clay'`) converts materials and adds outlines or facets for the whole scene. The style is the
look plus the choices around it: palette, light, camera, detail level and backdrop. Those are what this file is
about.

## Matching a reference image

When the user shows an image to match, read five things from it, then set the scene to them:

| read | how | set |
|---|---|---|
| light direction | where the shadows fall (away from the light) | `studio.key.dir` |
| shadow softness | a crisp edge or a gradual one; a contact shadow or not | `key.softness` 1 / 3 / 6, `contact` |
| camera height | the ellipses of round tops: flat means low (10–15°), round means high (40°+); horizon placement | `camera.elevation` |
| lens | parallel edges converging = wide (`distance` 3.5–4.5); staying parallel = long lens (8–10) or `projection: 'orthographic'` | `camera.distance` |
| surface and colour | gloss (sharp highlights or broad), saturation, contrast, detail level | look, materials, palette |

Render a draft and put it next to the reference; adjust one of the five at a time.

## Photoreal

The default. Realism comes from proportions, rounded edges, imperfection, contact and quiet materials (SKILL.md).
Lighting is photographic: one key, a fill, sometimes a rim. Camera 12–20° with a moderate lens. Backdrops are
transparent, or a soft neutral gradient for stills. Keep detail at the scale a photo would resolve.

## Clay and soft 3D illustration

The friendly "3D icons" style of SaaS sites and onboarding screens: matte, chunky, pastel, softly lit.
- `look: 'clay'` (brings the `clay` studio: big soft key, lots of bounce, baked AO).
- **Shapes**: simple and chunky. Primitives with big bevels (`roundedBox(…, radius 0.15–0.3 × size)`), `puffy`
  extrusions, `blob`s, capsules and spheres. Exaggerate proportions a little (thicker, rounder); drop small
  detail, because it reads as noise.
- **Palette**: 3–5 pastels from the brand (high lightness, low saturation) plus a warm white. The clay look
  lifts and desaturates colours a bit.
- **Camera**: elevation 25–35°, three-quarter (azimuth −30 to −40), distance 6–8 (gentle perspective).
- **Backdrop**: transparent for web, or a pastel radial gradient (`{radial: ['#f6f1ff', '#e6dcfa']}`) for stills.
- **Composition**: one main object with 1–3 small satellites (a coin, a sparkle `puffy('star')`, a little
  sphere), floating slightly with soft shadows.

## Mono (white model)

Architecture models, product concepts, editorial. `look: 'mono'` makes everything one warm white clay
(`lookOptions.tint`). Light with a lower, crisper key (`key.softness` 1–1.5, elevation of the light 30–40°) so
form comes from shadow; AO does the rest. Camera 25–35° or isometric. Backdrop warm white or light grey.

## Toon

Comic and game style: flat colour steps and ink outlines.
- `look: 'toon'`, and `lookOptions.outlineWidth` (0.008 thin to 0.02 bold) and `lineColor`.
- **Colours**: saturated and flat. Pick them as a set: three-step shading comes from the light, so choose base
  colours at mid lightness.
- **Shapes**: bold, readable silhouettes; limit tiny parts (each gets an outline).
- **Light**: `soft` or a harder key (`softness` 0.8) for crisp shadow shapes. The contact shadow stays subtle.
- **Backdrop**: a flat colour or a two-colour linear gradient. The orthographic camera suits sticker-like art.

## Low-poly

Faceted, geometric charm.
- `look: 'lowpoly'` remeshes every mesh into facets. Its size follows each mesh (`lookOptions.cell` 0.2 = 20% of
  the radius; smaller = more facets).
- Build with primitives (cones for trees, icospheres for rocks and bushes, boxes for houses). Flat colours per
  object with slight hue shifts between faces come for free from the facets.
- `golden` light or `soft` with a warm key; long shadows help.
- Backdrop: a soft gradient sky. Isometric cameras work well.

## Line art and wireframe

- `look: 'lineart'`: ink outlines and crease lines on white shading (patents, manuals, technical drawings, a
  premium minimal look). `lookOptions.creaseAngle` (42°) picks which edges draw; `lineWidth` in px.
- `look: 'wireframe'`: the low-poly mesh as lines (tech, "under the hood", blueprint). `lineColor` to the brand;
  on navy for blueprint (`backdrop: '#12233f'`, `lineColor: 0x9cc4ff`).
- Both read best with `projection: 'orthographic'` or a long lens, and few materials.

## Neon, glass and dark luxury

- **Neon**: `studio: 'night'`, `glow` materials on tubes (`tube` along a path, or `text3d` outlines), a dark
  backdrop, `post: {bloom: {strength: 1, radius: 1.4}}`. Keep everything else dark and slightly glossy so it picks
  up coloured reflections.
- **Glass**: `studio: 'glass'` on the final backdrop, with coloured liquid inside for colour, and one opaque object
  to anchor the composition.
- **Dark luxury**: `dramatic` with a rim; gold, brass or chrome with `softbox`; black marble (`marble({color:
  0x1d1d1f, veinColor: 0x8a8a8a})`); a radial backdrop from `#2a2724` to `#0f0e0d`; `post: {vignette: 0.25}`.

## Isometric

`camera: {iso: true}`: an orthographic camera at 35.264° and 45°, the true isometric angle of UI
illustrations. Build on a grid (align objects to x/z, sizes in whole units), keep scale consistent, and use flat
or clay looks. Rooms and scenes: a floor slab (`roundedBox`) and two walls, cut away at the front. Icons: one
object per tile, same camera, `icons` mode.

## Camera

| elevation | reads as |
|---|---|
| 5–10° | heroic, monumental, very close to the floor |
| 12–20° | product photography (the default 16°) |
| 25–35° | illustration, the three-quarter icon view; shows tops of cups and boxes |
| 45–60° | overview, tabletop |
| 75–90° | flat lay (use `studio: 'top'`) |

- **Azimuth** −25° to −40° shows two faces of box-like things, so they read as 3D. Avoid exactly 0° for boxes
  (flat) and exactly 45° (dull symmetry) unless the style wants it.
- **Distance** (in bounding radii): 3.5–4.5 is wide-angle and dramatic, for single heroic objects; 5.8 is the
  default; 8–10 is a telephoto, catalogue-flat look. `projection: 'orthographic'` is fully flat.
- Keep the camera still across a set, and move the objects instead.

## Composition

- **One hero.** The largest, closest and most contrasting object is where the eye lands.
- **Groups of 2–4 as a triangle**: tall at the back, the hero in front, a low object leading in. Odd numbers feel
  natural.
- **Overlap and touch.** Separate objects that do not touch look like clip art.
- **Space for text**: in stills with a headline, put the objects on one side (`align: [0.78, 0.6]`, `margin:
  0.08`) and leave the other side calm.
- **Crops**: sprites are cropped tight automatically, and the page layout decides the breathing room. For stills,
  `margin` 0.08–0.15.
- **Contrast with the background**: a light object on light needs a darker shadow or rim; a dark object on dark
  needs a rim light.

## Sets that match (icons, series, product lines)

- Render the whole set from **one scene** (`mode: 'icons'`, one layer per icon). Camera, light, look and
  resolution then match by construction.
- `icons.uniform: false` (default) fits each icon to its square, which suits icon grids. `uniform: true` keeps
  their real relative sizes, which suits product lines.
- Same palette logic (each icon gets one main colour from the palette plus the shared neutral), same detail level,
  same bevel radius relative to size, same number of parts (2–4).
- Add icons later by adding layers to the same scene and re-rendering; all icons come out again identical to
  before (deterministic).
- Check the contact sheet (`preview/sheet.png`): at a glance, nothing should look like it came from another set.
