---
name: 3d-asset-studio
description: Create any 3D asset and put it to work. Product renders and hero stills, transparent objects that animate on websites (drop, bounce, stack, float on scroll), 3D icon sets, 3D logos and lettering, clay, toon, low-poly and line-art illustrations, glass and metal product shots, turntables and looping animations (animated WebP, WebM, MP4), and model files (GLB for the web, USDZ for AR, STL for 3D printing). Models objects in three.js code (30 real-size object generators, SVG, fonts, booleans, deformers) or imports existing models (GLB, OBJ, FBX, STL, PLY, 3MF, DAE), inspects and converts them, and renders offline in headless Chromium with studio lighting. Use it whenever someone wants anything 3D (objects, models, renders, icons, mockups, illustrations, animations, AR or print files, a live 3D viewer) or wants 3D decoration on a site, even if they never say three.js. Also for Swedish requests such as 3D-objekt, 3D-föremål, 3D-modell, 3D-ikoner, 3D-logga, 3D-bild, rendering, produktbild, snurrande 3D.
---

# 3D Asset Studio

Make 3D things that look like they were shot in a studio, then deliver them in the form the job needs. The
outputs are: layered transparent sprites that animate on a web page, a finished still, a matching icon set, a
looping animation, or a model file. Objects are either modeled in code (a library of real-size objects and
modeling helpers) or imported from existing models. They are rendered offline with three.js in headless
Chromium, lit by studio presets. Every render is deterministic, previewed, and self-checked.

Why offline rendering is the default: a rendered image is a few kB to a few hundred kB, pixel-sharp, costs the
visitor no WebGL, battery or JavaScript, and looks identical everywhere. Go live (WebGL on the page) only when
the visitor must turn, zoom, configure the object or see it in AR.

Talk to the user in their language (often Swedish). Show them preview images as you go, and ask only what you
cannot infer or sensibly default.

## 1. Turn the request into a one-line plan

Settle six things. Most come from the request and the project; default the rest and say what you chose.

| decide | typical answer |
|---|---|
| **subject** | which objects, how many (1–3 is usually best), real or stylized |
| **style** | photoreal (default) · clay · toon · low-poly · line art · glass / neon · isometric (see references/styles.md) |
| **output** | sprites that animate · still · icon set · animation · model file · live viewer (next section) |
| **where / size** | the slot on the page or the file's use → pixel width (render 2× the CSS size) |
| **background** | transparent over the page (most web use) or a painted backdrop (stills, social, e-mail) |
| **motion** | entrance and idle for sprites; loop or turntable for animations; none |

Say the plan in one or two sentences ("Two cork blocks and a rolled terracotta mat as animated sprites beside
the hero, soft daylight, dropping in one by one") and go. Ask first only when the subject itself or its placement
is unclear. Worked examples of requests turned into plans, and when to pick what: **references/choosing.md**.

**Restraint beats quantity.** Two or three well-made objects that belong to the content work better than six that
compete with it. A client once asked to remove extra objects because it was "too much".

## 2. Pick the output

| the job | mode | ships as |
|---|---|---|
| objects that move on a web page (enter on scroll, stack, float) | `layers` (default) | one transparent WebP per object + one per shadow, `meta.json`, a ready HTML snippet; CSS/JS kit animates them |
| hero image, product shot, OG/social image, e-mail, slide | `still` | one image at an exact size, transparent or on a backdrop (colour, gradient) |
| a set of icons or catalogue thumbnails that match | `icons` | one image per object, same size, light and camera; a contact sheet |
| a turntable, a looping animation, a spinning logo | `sequence` | numbered frames + animated WebP (alpha), WebM, MP4 |
| a model for the web, AR, Blender or 3D printing | `none` + `--export` | GLB · USDZ · STL · OBJ at real-world size |
| visitors turn, zoom or place it in AR | live | GLB + poster in `<model-viewer>` or `assets/live/w3d-viewer.js` (references/live-3d.md) |

A single scene can feed several outputs: sprites for the page, a still for the social card, a GLB for AR.

## 3. Get the geometry

1. **Library object.** `w3d/objects.js` has 30 generators at real size, several with variants: fitness gear,
   tableware, food, plants, books, packaging, gems, tech, icon shapes. Use them as they are, recoloured, or as worked examples. See the catalogue in
   references/modeling.md.
2. **Model it in code.** Nearly every product is turned (`lathe`), swept (`tube`, `ribbon`), box-like
   (`roundedBox`), an outline with depth (`extrudeSVG`, `text3d`), or a combination cut with booleans (`csg`)
   and reshaped with deformers (`bend`, `twist`, `taper`, `displace`). Recipes: **references/modeling.md**.
3. **Import a model.** `loadModel(url, {height: '78cm'})` reads GLB/glTF (with Draco, Meshopt and KTX2), OBJ+MTL,
   FBX, STL, PLY, 3MF, DAE, USDZ and VOX. It returns the model at real size, standing on the floor and ready
   for the studio. Look at any model with `inspect.mjs` first. Sources, licences, fixing models:
   **references/importing.md**.
4. **Generated meshes.** If an image-to-3D tool is connected (an MCP server, for example), it can produce a GLB
   to import. Uploading the user's images or files to a third-party service needs their clear go-ahead first.
   Generated meshes usually need a scale fix, new materials and a critical look (references/importing.md).

Logos: an SVG → `extrudeSVG`. Words: `text3d('Hello', {font})` with a bundled or a brand font. Photos of a real
product: model it (proportions from the photo); do not try to reconstruct geometry from pixels.

## 4. The workflow

`<skill>` is this skill's directory. The scripts are plain Node ≥ 18 and need no project setup.

1. **Check the machine (once):** `node <skill>/scripts/check-env.mjs`. It tests Playwright, Chromium, WebGL and
   three.js and prints the exact fix for anything missing. The first render installs pinned three.js packages
   into `~/.cache/3d-asset-studio/` (needs the npm registry once).
2. **Write the scene:** copy the closest example from `<skill>/assets/examples/` into the project, for example
   `design/3d/hero.scene.js`. The scene file is source code: commit it, so the asset can be re-rendered with a
   tweak months later.
3. **Draft and look:** `node <skill>/scripts/render.mjs design/3d/hero.scene.js --draft` (15–40 s), then open
   `design/3d/hero.preview/beauty.png` with Read and critique it against the checklist below. Change one thing
   at a time, in this order: proportions → edges → materials → light and camera → composition.
4. **Render for real:** `node <skill>/scripts/render.mjs design/3d/hero.scene.js --out public/assets/hero`
   plus the mode's flags (`--mode still --size 1200x630`, `--mode icons`, `--turntable 48 --video webp,webm`,
   `--export glb,usdz`). Read `hero.preview/sheet.png`. Fix every warning the script prints; each one names its
   cause and its fix.
5. **Check it in use:** for sprites, `node <skill>/scripts/preview.mjs public/assets/hero/meta.json --out
   hero.motion.png` freezes the choreography at 16 exact moments (read it). Then look at the real page at
   desktop and phone widths and with reduced motion. Screenshots through Playwright are fine.
6. **Deliver:** wire it into the page (references/web-integration.md), or hand over the files with their
   sizes and a short note on how to use them. Commit the scene, the outputs and `meta.json`, but not the
   `.preview` folder.

Render times: rendering is software WebGL (SwiftShader), identical on every machine and needing no GPU. A
draft takes 15–40 s. A full three-layer render takes 40–120 s, more on a busy machine. An icon set costs about
10–30 s per icon, a 48-frame sequence 2–4 min. Baked AO (on by default in the clay and mono looks) adds 30 s to
3 min on dense scenes, so iterate with `--no-ao` or `ao: {samples: 12}`. Run renders one after another: parallel renders share the CPU and
all slow down. `--set camera.elevation=24` tries a variant without editing the scene. `--gpu` uses a graphics card
when one exists.
`--pathtrace` (true global illumination) needs a GPU and refuses to run without one.

## A scene module

```js
import * as THREE from 'three';
import * as O from 'w3d/objects.js';
import {lathe, roundCorners} from 'w3d/geometry.js';
import * as M from 'w3d/materials.js';

export const settings = {
  name: 'hero',                      // file prefix
  mode: 'layers',                    // layers | still | icons | sequence | none
  look: 'photoreal',                 // photoreal | clay | mono | toon | lowpoly | lineart | wireframe
  width: 900,                        // output px (render 2× the CSS width)
  studio: 'soft',                    // light preset (table below) or {preset, key: {softness}, envMap, …}
  camera: {elevation: 16},           // degrees above the floor; azimuth, distance, iso: true, projection
  background: '#f4f1ea',             // the page colour: previews show the real result
};

export default async function build({rng}) {           // may be async: fetch SVGs, fonts, models
  const mug = O.mug({color: 0xf1eee8});
  const coaster = new THREE.Mesh(lathe(roundCorners([[0, 0], [0.62, 0], [0.62, 0.05], [0, 0.05]], [0, 0.02, 0.02, 0])), M.cork());
  mug.position.set(0.05, 0.05, 0); mug.rotation.y = -0.4;  // stand on the coaster, turned: nothing CNC-aligned
  return [{name: 'coaster', object: coaster}, {name: 'mug', object: mug, motion: 'drop', delay: 300}];
}
// optional, for mode 'sequence': move anything per frame (t runs 0 → 1)
// export function animate({t, layers}) { layers.mug.rotation.y = t * Math.PI * 2; }
```
1 unit = 10 cm. Objects stand on y = 0 at real size. Camera, lights, shadow maps and framing size themselves
to the content. Layers are what moves or gets its own image; one layer can be a whole group. All settings,
layer options, CLI flags and output formats: **references/scene-api.md**.

## Examples to start from (`assets/examples/`)

`assets/gallery.jpg` shows a render of each one. Open it to pick a starting point, or show it to a user who asks
what is possible.

| example | mode | shows |
|---|---|---|
| `weight-plates` | layers | lathe profiles, a hand-made stack, rubber + steel, staggered `drop` (the reference sprite scene) |
| `kettlebell-set` | layers | tube handle, canvas seams on a ball, a twisted `ribbon` band, `holdout` for interlocking |
| `coffee-cup` | layers | walls with real thickness, a handle, latte art as a canvas texture |
| `logo` + `logo-mark.svg` | layers | `extrudeSVG`, satin gold, `softbox` reflections, hovering with `float` |
| `phone` | layers | device mockup, emissive screen from `screen.png` or a drawn placeholder |
| `clay-icons` | icons | a matching set: clay look, pastel palette, `puffy` shapes, a custom SVG, a coin stack |
| `isometric-room` | still | true isometric camera, a real-scale room, a window cut with `subtract`, clay look |
| `breakfast` | still | food: donuts with scattered sprinkles, backlight, a gradient backdrop |
| `glass-bottles` | still | glass on its backdrop with the `glass` studio |
| `neon-sign` | still | a `tube` along a curve, `text3d`, emissive + bloom, `night` studio |
| `lamp` | still | modeling from scratch (the worked example in references/modeling.md) |
| `still-life` | still | the same scene for every look: `--look clay`, `toon`, `lowpoly`, `lineart`, `wireframe`, `mono` |
| `bounce` | sequence | `animate(t)` with squash and stretch → animated WebP / WebM |
| `imported-model` + `models/desk-set.glb` | still | `loadModel` at real size, restyling one part by name |
| `materials` | layers | every material preset as a labelled swatch in sheet.png (render it to choose) |

## The library at a glance

| module | what |
|---|---|
| `w3d/objects.js` | real-size generators: `weightPlate kettlebell dumbbell exerciseBall tennisBall resistanceBand yogaMat yogaBlock mug bottle jar vase bowl plate donut fruit cake pottedPlant candle book box giftBox gem coin pill puffy blob rock phone laptop` (+ `CATALOG`) |
| `w3d/geometry.js` | `lathe roundCorners spline tube ribbon roundedBox roundedDisc extrudeSVG creased smooth facet evenUV onFloor` |
| `w3d/materials.js` | presets `rubber powderCoat plastic stone cork foam felt terracotta wax paper leather linen marble dough icing glow brushedSteel chrome gold brass copper ceramic paint fabric wood glass`; `withGrain` (seamless solid-noise surface), `canvasTexture`, `imageTexture`, `swatch` (brand colour → albedo), `rng` |
| `w3d/deform.js` | `bend twist taper displace inflate squash` |
| `w3d/csg.js` | `subtract union intersect cutter` (booleans: holes, slots, engraving, one clean solid) |
| `w3d/text.js` | `text3d` (bundled fonts or a .ttf/.otf), `loadFont` |
| `w3d/scatter.js` | `scatter` over a surface, `scatterVolume` (sprinkles, seeds, pebbles, confetti) |
| `w3d/models.js` | `loadModel fitTo copyModel poseAt describe length` (import existing models) |
| `w3d/noise.js`, `w3d/ao.js` | `noise3 fbm3 ridged3`; `bakeAO` (settings `ao: true` does it for you) |

## Looks and studios

| look | what it does | pairs with |
|---|---|---|
| `photoreal` | the materials as built | any studio |
| `clay` | matte pastel clay, baked AO, soft light (friendly 3D illustration) | `clay` studio (automatic) |
| `mono` | everything one warm white clay (architecture, concept models) | `clay` |
| `toon` | cel shading, ink outlines | `soft`, a flat colour backdrop |
| `lowpoly` | faceted remesh, flat shading | `soft`, `golden` |
| `lineart` | ink outlines and creases on white | `bright` |
| `wireframe` | the low-poly mesh drawn as lines | `bright`, dark backdrops |

| studio | light | for |
|---|---|---|
| `soft` | soft daylight from the upper left (default) | most products on light pages |
| `bright` | flatter and brighter, light shadows | white or pastel products, e-commerce |
| `dramatic` | low key, strong side light, rim | dark pages, premium |
| `top` | from above | flat lays, and **floating objects** (the shadow sits right under them) |
| `clay` | big soft light, lots of bounce | clay and mono looks, illustrations |
| `golden` | warm, low, long shadows, sunset reflections | lifestyle, outdoors |
| `night` | near dark, rim strips | neon, emissive things with `post: {bloom: true}` |
| `glass` | dark-field strips: dark edges, long highlights | glass, liquids, perfume, chrome, jewellery |

Environments (what reflections see): `room`, `softbox` (metals, gloss), `strips` (glass), `overcast`, `sunset`,
`dark`, `neutral`, or any `.hdr`/`.exr` file. Light, colour, shadows and materials:
**references/materials-lighting.md**. Style direction and composition: **references/styles.md**.

## The critique checklist (read every draft against it)

1. **Proportions.** Do they match the real object? Look up the dimensions (references/modeling.md has a table).
   Wrong proportions give a render away before any material does.
2. **Edges.** Is anything razor sharp? Real things have fillets, and the highlights live on them.
3. **Material.** Does it read as the material at a glance (rubber, glazed ceramic, brushed steel)? Metals need a
   reflective environment (`softbox`), glass needs its backdrop and the `glass` studio.
4. **Light.** One clear key direction, matching the page (usually upper left)? Form visible on every object?
   No pure-black holes, no blown whites?
5. **Grounding.** Does it touch the floor with a contact shadow? A floating object needs a clearly detached
   shadow, and top light keeps that shadow directly under it.
6. **Colour.** Is it on brand next to the page colour? Lit faces render lighter than the swatch, so start from
   `M.swatch('#hex')`.
7. **Composition.** Is the crop tight but breathing? For groups: a triangle, overlaps, one hero. For sets: the
   same camera, light and scale.
8. **Artefacts.** Look for jagged edges, noise, banding on curves, z-fighting (dotted lines where surfaces nearly
   touch), shadow acne.

## What makes it look expensive

- **Real proportions and real scale**, 1 unit = 10 cm, so grain, bevels and light falloff are right.
- **Soft edges everywhere**: `roundCorners`, bevels, fillets.
- **Imperfection**: a few mm of offset, small rotations, nothing CNC-aligned or perfectly symmetric.
- **Contact**: objects touch the floor and each other.
- **Quiet materials**: dark greys instead of black (`0x252625`), warm whites (`0xf1eee8`) instead of `0xffffff`,
  fine grain instead of noise.
- **One light story** across everything on a page or in a set.
- **Deterministic**: use `rng(seed)`, never `Math.random()`, so iterations stay comparable.

## Rules learned the hard way

- Glass refracts only what is in the render, never the web page behind a transparent sprite. Render glass on
  its final backdrop with the `glass` studio, or tint and frost it for transparent layers.
- Objects that pass both behind and in front of each other need `holdout`, not a different paint order.
- A side key light gives a floating object two shadows (one offset, one under it). Use `studio: 'top'` or raise
  the key.
- Shadows under objects are part of their sprite, so they must not show while the object is in the air (the kit
  handles this).
- Surfaces closer than ~0.5 mm, seen edge-on, z-fight. Leave a gap, or give the inner part
  `polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1`. Rounded parts resting on a surface do the
  same where the fillet grazes it: sink them deeper than the fillet, or give them a flat bottom.
- Flat pictograms (extruded SVGs, `puffy`, `text3d`) must face the camera: turn them by about the camera azimuth.
- Lossy WebP stores colour at half resolution: saturated edges shift a little, and no quality setting fixes it.
  It is invisible at page size; `--png` if colour must be exact.
- Exports are real size (glTF/USDZ/OBJ in metres, STL in millimetres and Z-up), so a mug comes out 9.5 cm tall in
  AR, not 95 cm. Check sizes you are given with `measure(model, part)` or the inspect table, and report them.
- Web-kit pitfalls (`translate(%)`, restarting animations, global `img` rules) are in references/web-integration.md.

## Reference map

| read | when |
|---|---|
| references/choosing.md | turning a vague request into a plan; picking output, style and source; example plans |
| references/scene-api.md | every setting, layer option, CLI flag (render, inspect, convert, preview) and output file |
| references/modeling.md | building geometry: recipes, the object catalogue, real-world dimensions, booleans, deformers, text, scatter |
| references/materials-lighting.md | materials and PBR values, colour, studios and environments, shadows, glass, metals, matching the page |
| references/styles.md | clay, toon, low-poly, line art, isometric, neon, icon sets; camera and composition |
| references/animation.md | sequences, `animate(t)`, turntables, loops, timing, video containers and alpha |
| references/importing.md | loading, inspecting, fixing and converting models; free sources and licences; AI-generated meshes |
| references/web-integration.md | sprites on a page: install, frameworks, motions, choreography, stills, icons and video embeds |
| references/live-3d.md | live WebGL: `<model-viewer>`, `w3d-viewer`, React Three Fiber, AR, performance budgets |
| references/troubleshooting.md | an error, a warning, or something that looks wrong |
