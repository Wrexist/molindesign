# Scene API, CLI and output files

## Contents
- Scene module and build context
- settings (every field, with defaults)
- Layer fields
- animate() for sequences
- CLI: render.mjs, inspect.mjs, convert.mjs, preview.mjs, check-env.mjs
- Output files per mode, meta.json
- Units and exports

## Scene module and build context

A scene is one ES module. It runs in the browser that renders it, so it can use `fetch`, canvas, `FontFace` and
`import.meta.url`. Bare imports `three`, `three/addons/…` (three.js 0.170), `three-mesh-bvh`, `three-bvh-csg`
and `w3d/…` (this skill's `scripts/lib`) are mapped for it. Other files are imported by relative path.

```js
import * as THREE from 'three';
import * as O from 'w3d/objects.js';

export const settings = {name: 'hero', mode: 'still', size: [1200, 630], backdrop: {radial: ['#fbf7f0', '#efe6d8']}};

export default async function build(ctx) {        // may be async
  const logo = await (await fetch(new URL('./logo.svg', import.meta.url))).text();
  return [{name: 'mug', object: O.mug()}];        // an array of layers (or one Object3D, or {layers})
}
export function animate({t, layers}) {}           // optional, mode 'sequence' (below)
```

`ctx` = `{THREE, scene, renderer, settings, rng, mode, look, log, warn, meta}`:
- `rng(seed)` is a seeded random generator. Never use `Math.random()`: every render must come out identical, or
  iterations cannot be compared.
- `log(msg)` and `warn(msg)` print in the CLI output (warnings are repeated at the end).
- `meta` is an object written into `meta.json` as `scene`, for any facts you want to keep with the asset.
- Files next to the scene: `new URL('./file.ext', import.meta.url)`. Absolute paths (`/Users/…/x.glb`) also load.

Scale: 1 unit = 10 cm. Stand objects on y = 0 (use `onFloor`); anything below y = 0 is reported.

## settings

| field | default | meaning |
|---|---|---|
| `name` | file name without `.scene.js` | asset name, file prefix, preview folder |
| `mode` | `'layers'` | `layers` · `still` · `icons` · `sequence` · `none` (only exports) |
| `look` | `'photoreal'` | `photoreal clay mono toon lowpoly lineart wireframe`; brings its own studio/AO defaults |
| `lookOptions` | `{}` | per-look knobs: `outlineWidth` (share of the scene radius, toon 0.012, lineart 0.008), `outline: false`, `lineColor`, `lineWidth` (px), `creaseAngle` (lineart, 42°), `tint` (mono), `cell` / `maxCell` (lowpoly facet size) |
| `width` | `1000` | output width in px (layers, still, sequence); height follows the content |
| `size` | `null` | `[w, h]`: an exact output size (still, sequence); content fitted inside with `margin`, placed by `align` |
| `margin`, `align` | `0.1`, `[0.5, 0.5]` | share of the frame kept empty; where the content sits (0–1, 0–1) |
| `ss` | `2` | supersampling on top of MSAA (1 = draft quality, 3 = very fine detail) |
| `quality` | `0.9` | WebP/JPEG quality (shadow alpha is lossless) |
| `formats` | `['webp']` | still/icons: any of `webp png jpg` |
| `padding` | `4` | px kept around the content |
| `studio` | `'soft'` | a preset name or `{preset, envMap, exposure, env, envRotation, toneMapping, key, fill, rim, hemi, floor, contact}` |
| `camera` | `{elevation: 16, azimuth: 0, distance: 5.8}` | degrees above the floor; degrees around; bounding radii away (3.5 wide-angle, 9 nearly flat). `projection: 'orthographic'`; `iso: true` (true isometric: ortho, 35.264°, 45°); `position`/`target` `[x, y, z]` |
| `floor` | `{y: 0}` | `{y, shadow}`: `shadow` = floor shadow opacity; `false` = no floor, no floor shadows |
| `contact` | preset | `{opacity, blur, height}` soft contact shadow; `false` to disable |
| `shadowColor` | `'#000000'` | shadow colour; a very dark tint of the page colour on strongly coloured pages |
| `background` | `'#f2f2ee'` | the page colour, used in previews only (and to flatten JPEGs and MP4s) |
| `backdrop` | `'transparent'` | still/icons/sequence: `'#hex'`, `{linear: [a, b], angle}`, `{radial: [a, b], at: [x, y], size}`; rendered as the scene background, so glass and reflections see it |
| `order` | `'auto'` | layers: paint order from occlusion; `'declared'`; or names back → front |
| `ao` | `false` | baked ambient occlusion: `true` or `{strength, distance, samples, self}` (clay looks turn it on) |
| `post` | `{bloom: false, vignette: 0, grain: 0}` | `bloom: true` or `{strength, radius}` (emissive things glow); `vignette` 0–0.4; `grain` 0–0.06 film grain |
| `icons` | `{size: [512, 512], margin: 0.07, uniform: false}` | `uniform: true` keeps relative sizes across the set |
| `sequence` | `{frames: 48, fps: 24, turntable: false, loop: true}` | `turns` (turntable rotations); `loop: true` leaves out the frame equal to the first |
| `motion` | `{type: 'drop', stagger: 480}` | layers: entrance defaults for the snippet, optional `idle` |
| `export` | none | `['glb', 'usdz', 'stl', 'obj']`, like `--export` |
| `pathtrace` | none | `{samples, bounces}`: path-traced still (GPU only) |

Studio object form: `{preset: 'soft', envMap: 'softbox', key: {dir: [x, y, z], intensity, color, softness}, fill:
{…}, rim: {…}}`. Directions are for a camera looking from +z; they turn with `camera.azimuth`. `key.softness`:
1 = crisp product shadows, 3 = soft, 6 = overcast, 10+ = barely there. Presets, environments and HDRIs:
materials-lighting.md.

## Layer fields

| field | default | meaning |
|---|---|---|
| `name` | object.name or `layer-N` | file name (lowercase-dashed) |
| `object` | – | any THREE.Object3D (a Mesh, a Group, an imported model) |
| `motion` | `settings.motion.type` | layers: entrance `drop bounce pop rise snap roll fade none` |
| `delay` | index × stagger | ms before its entrance |
| `idle` | none | loop after the entrance: `hop float sway breathe` |
| `style` | none | CSS custom properties for this item, e.g. `{'--squash': 0.02, '--drop': '26cqw'}` |
| `shadow` | `true` | `false`: no shadow sprite and no shadows cast |
| `holdout` | `[]` | names of layers that hide parts of this one (interlocking objects: a band around a kettlebell) |
| `clean` | `false` | the sprite without shadows from layers painted before it (for objects that move a lot) |

## animate() for sequences

```js
export function animate({t, frame, frames, seconds, fps, layers, scene, THREE}) {
  layers.lid.rotation.x = -1.2 * ease(t);   // layers by name
}
```
Called before every frame. `t` runs 0 → 1 (with `loop: true`, the frame at t = 1 is left out, so the loop is
seamless). Framing covers every pose, and shadows, contact shadows and AO follow. Without `animate`, or with
`sequence.turntable: true` (`--turntable N`), everything turns once around its centre under fixed light.
Patterns (easing, squash and stretch, loops, camera moves): animation.md.

## CLI

All scripts are Node ≥ 18. Paths are relative to the skill folder.

```bash
node scripts/check-env.mjs                                   # what is missing, and the fix
node scripts/render.mjs scene.js --draft                     # quick beauty preview, nothing written to --out
node scripts/render.mjs scene.js --out public/assets/hero    # the real thing
node scripts/inspect.mjs model.glb                           # what a model is + a sheet of four views
node scripts/convert.mjs model.fbx --to glb,usdz             # formats through three.js, at real size
node scripts/preview.mjs public/assets/hero/meta.json --out hero.motion.png   # choreography sheet
```

**render.mjs**: `--out <dir>` · `--draft` · `--mode layers|still|icons|sequence|none` · `--look <look>` ·
`--name` · `--width <px>` · `--size WxH` · `--ss 1-3` · `--quality 0-1` · `--png` (also lossless) · `--ao` /
`--no-ao` · `--frames <n>` · `--turntable <n>` (implies sequence) · `--video webp,webm,mp4` · `--export
glb,usdz,stl,obj` (`--glb`) · `--pathtrace [n]` · `--gpu` · `--base <url>` (URL prefix in snippet.html) ·
`--previews <dir>` (default `<scene dir>/<name>.preview/`) · `--browser <chrome>` · `--three <dir>` ·
`--timeout <s>` (900) · `--set path=value` (repeatable; overrides any setting for one run: `--set camera.azimuth=-40
--set studio=bright --set studio.key.softness=3`, values parsed as JSON when they can be). `--draft` renders at
most 640 px, even with `size`, and without supersampling.

**inspect.mjs** `<model>`: `--out <dir>` (default `<model>.inspect/`) · `--height <len>` / `--size <len>` (`--by <pattern>` to
measure it on some parts) ·
`--units mm|cm|m|in` · `--up z` · `--look <look>` · `--smooth <deg>`. It prints the format, the real size, meshes,
triangles, materials, textures, animations and compression, a table of every part's size, and advice for the web. It
writes `info.json` and
`sheet.png` (front, three-quarter, side, back).

**convert.mjs** `<model> --to glb,usdz,stl,obj`: `--out <dir>` · `--name` · `--height` / `--size` · `--units`
· `--up z` · `--smooth <deg>`. Writes only the files asked for.

**preview.mjs** `<meta.json>`: `--out <png>` · `--width <px>` (stage width, 360) · `--frames <n>` (16) · `--bg` ·
`--motion <name>` · `--idle <name|none>` · `--idle-cycles <n>` · `--stagger <ms>` · `--css <file>` · `--video
<webm>`.

## Output files per mode

The preview folder (look at these, do not ship them) holds `beauty.png`, `sheet.png` and `snippet.html` for
every mode.

| mode | in `--out` | `sheet.png` shows |
|---|---|---|
| `layers` | `<layer>.webp`, `<layer>-shadow.webp`, `meta.json` | beauty, every layer on a checkerboard, a heat map of layers vs render |
| `still` | `<name>.webp` (+ `png`/`jpg` per `formats`), `meta.json` | the image |
| `icons` | `icons/<layer>.webp`, `meta.json` | a contact sheet of the set |
| `sequence` | `frames/000.webp …`, `<name>.webp` (animated), `.webm`/`.mp4` with `--video`, `meta.json` | frame 0 |
| `none` | only the `--export` files | – |

Model exports go to `--out` as `<name>.glb|usdz|stl|obj` in any mode.

meta.json (layers):
```json
{
  "name": "plates", "generator": "3d-asset-studio", "mode": "layers", "look": "photoreal",
  "frame": {"width": 760, "height": 350}, "order": ["plate0", "plate1", "plate2"],
  "layers": [{
    "name": "plate0", "index": 0, "z": 0, "contact": [49.8, 62.7], "motion": "drop", "delay": 0,
    "object": {"src": "plate0.webp", "width": 677, "height": 251, "left": 5.263, "top": 21.429, "w": 89.079, "origin": [49.98, 100]},
    "shadow": {"src": "plate0-shadow.webp", "width": 747, "height": 223, "left": 0.921, "top": 34.571, "w": 98.289, "origin": [49.71, 44.2]}
  }],
  "verify": {"mean": 0.07, "p99": 1, "max": 14, "webp": {"mean": 1.3, "p99": 6, "lumaP99": 3}}
}
```
`left`, `top` and `w` are % of the frame. `origin` is the transform origin (% of the sprite) where the object
meets what it stands on, and `contact` is that point in % of the frame. `z` is the paint position. `verify`
compares the repainted layers with the render (0–255): a mean under ~0.3 means the layering is exact, and the
`webp` numbers are what compression costs (`lumaP99` counts brightness only).

meta.json (sequence) adds `"sequence": {"frames", "fps", "loop", "pattern": "frames/{i}.webp", "pad",
"turntable"}` and `animatedWebp`, `webm` (+ `webmAlpha`), `mp4`. (icons) adds `"icons": [{"name", "src",
"width", "height"}]`. (still) adds `"files"`.

## Units and exports

Scene units are 10 cm. Exports are written at real size. GLB, USDZ and OBJ are in metres (the glTF standard,
and what AR expects). STL is in millimetres and Z-up (what slicers assume). Importing reverses this.
`loadModel` knows the units of each format (references/importing.md). Baked AO travels as vertex colour.
Procedural grain is a render-time shader: other viewers show the plain PBR base, but its parameters travel in glTF
extras, and `loadModel` rebuilds it.
